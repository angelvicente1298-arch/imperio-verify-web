import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import {
  addVerificationEvent,
  countRelatedApprovals,
  createVerification,
  getVerificationByTicket,
  recentVerifications,
  updateVerification,
  verificationStats,
} from "./db";
import {
  addGuildMember,
  avatarUrl,
  buildAuthorizeUrl,
  clientIp,
  daysBetween,
  evaluateRisk,
  exchangeCode,
  fetchDiscordUser,
  grantVerifiedRole,
  isConfigured,
  lookupIp,
  makeTicket,
  missingConfig,
  redirectStatus,
  sha256,
  signState,
  snowflakeToDate,
  verifyState,
} from "./discordVerify";

/** Datos que envía el navegador junto con el botón de verificar. */
const contextSchema = z.object({
  timezone: z.string().max(64).optional(),
  fingerprint: z.string().max(64).optional(),
  userAgent: z.string().max(255).optional(),
});

type RequestHeaders = Record<string, unknown>;

function originFrom(headers: RequestHeaders, fallback: string): string {
  const host = (headers["x-forwarded-host"] as string) || (headers.host as string) || "";
  const proto = (headers["x-forwarded-proto"] as string) || "https";
  return host ? `${proto}://${host}` : fallback;
}

export const verifyRouter = router({
  /** Estado de la configuración para la pantalla inicial. */
  status: publicProcedure.query(async ({ ctx }) => {
    const missing = missingConfig();
    const origin = originFrom(ctx.req.headers as RequestHeaders, "http://localhost:3000");
    const redirect = await redirectStatus(origin);
    return {
      configured: isConfigured(),
      missing,
      minAccountDays: Number(process.env.VERIFY_MIN_ACCOUNT_DAYS ?? 30),
      vpnProtection: true,
      multiAccountProtection: true,
      // Si la URL de retorno no está registrada en Discord, se avisa en la web.
      redirectOk: redirect.ok,
      redirectUsed: redirect.used,
      redirectRegistered: redirect.registered,
      redirectSuggested: redirect.suggested,
    };
  }),

  /** Genera la URL del Discord Developer Portal para iniciar la verificación. */
  startLink: publicProcedure
    .input(contextSchema.optional())
    .query(async ({ ctx }) => {
      const origin = originFrom(ctx.req.headers as RequestHeaders, "http://localhost:3000");
      const state = signState();
      const url = await buildAuthorizeUrl(origin, state);
      const redirect = await redirectStatus(origin);
      return {
        url,
        state,
        redirectUri: redirect.used,
        redirectOk: redirect.ok,
        redirectRegistered: redirect.registered,
        redirectSuggested: redirect.suggested,
        configured: isConfigured(),
        missing: missingConfig(),
      };
    }),

  /** Procesa la respuesta del portal y decide si la cuenta entra o se bloquea. */
  complete: publicProcedure
    .input(
      z.object({ code: z.string().min(4), state: z.string().max(512).optional() }).and(contextSchema),
    )
    .mutation(async ({ ctx, input }) => {
      if (!isConfigured()) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Faltan credenciales de Discord: " + missingConfig().join(", "),
        });
      }

      // Protección CSRF: el `state` lo emitió este servidor hace menos de 15 min.
      if (input.state && !verifyState(input.state)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "El enlace de verificación caducó o no es válido. Vuelve a intentarlo.",
        });
      }

      const headers = ctx.req.headers as RequestHeaders;
      const origin = originFrom(headers, "http://localhost:3000");
      const ip = clientIp(headers, ctx.req.socket?.remoteAddress ?? undefined);
      const ticket = makeTicket();

      const fingerprint = input.fingerprint ? sha256(input.fingerprint) : null;
      const userAgent = (input.userAgent ?? (headers["user-agent"] as string) ?? "").slice(0, 250);

      // 1) Canjea el código por el token de la persona y lee sus metadatos.
      const accessToken = await exchangeCode(input.code, origin);
      const discordUser = await fetchDiscordUser(accessToken);
      const createdAt = snowflakeToDate(discordUser.id);
      const ageDays = createdAt ? daysBetween(createdAt) : null;
      const avatar = avatarUrl(discordUser);

      // 2) Comprueba la conexión: VPN, proxy, centro de datos.
      const ipInfo = await lookupIp(ip);

      // 3) Cuenta cuántas cuentas distintas ya pasaron por esta IP o dispositivo.
      const [sameIp, sameFingerprint] = await Promise.all([
        countRelatedApprovals("ip", ip),
        fingerprint ? countRelatedApprovals("fingerprint", fingerprint) : Promise.resolve(0),
      ]);

      const ipTimezone = ipInfo.timezone ?? "";
      const timezoneMismatch = Boolean(
        input.timezone && ipTimezone && input.timezone.trim() !== ipTimezone.trim(),
      );

      // 4) Decide.
      const risk = evaluateRisk({
        accountAgeDays: ageDays,
        accountVerifiedEmail: Boolean(discordUser.verified),
        ip: ipInfo,
        timezoneMismatch,
        sameIpAccounts: sameIp,
        sameFingerprintAccounts: sameFingerprint,
        fingerprintMissing: !fingerprint,
      });

      const verificationId = await createVerification({
        ticket,
        discordId: discordUser.id,
        username: discordUser.username,
        globalName: discordUser.global_name ?? null,
        avatar,
        email: discordUser.email ?? null,
        accountCreatedAt: createdAt,
        accountAgeDays: ageDays,
        status: risk.decision === "allow" ? "pending" : "blocked",
        decision: risk.decision,
        riskScore: risk.score,
        reasons: JSON.stringify(risk.reasons),
        ip: ip || null,
        ipCountry: ipInfo.countryCode,
        ipCity: ipInfo.city,
        ipIsp: ipInfo.isp,
        ipTimezone: ipInfo.timezone,
        ipProxy: ipInfo.proxy,
        ipHosting: ipInfo.hosting,
        vpnDetected: ipInfo.proxy || ipInfo.hosting,
        privateIp: ipInfo.privateIp,
        clientTimezone: input.timezone ?? null,
        fingerprint,
        userAgent,
        sameIpAccounts: sameIp,
        sameFingerprintAccounts: sameFingerprint,
      });

      if (risk.decision === "block") {
        await addVerificationEvent(
          verificationId,
          discordUser.id,
          "blocked",
          risk.reasons.map((r) => `${r.code}: ${r.text}`).join(" | "),
        );
        return {
          ticket,
          status: "blocked" as const,
          riskScore: risk.score,
          reasons: risk.reasons,
          account: {
            id: discordUser.id,
            username: discordUser.username,
            globalName: discordUser.global_name ?? null,
            avatar,
            createdAt: createdAt?.toISOString() ?? null,
            ageDays,
          },
          network: {
            country: ipInfo.country,
            city: ipInfo.city,
            isp: ipInfo.isp,
            vpn: ipInfo.proxy,
            hosting: ipInfo.hosting,
          },
          roleGranted: false,
          guildJoined: false,
        };
      }

      // 5) Entrega el acceso: une al servidor y asigna el rol.
      let guildJoined = false;
      let roleGranted = false;
      try {
        guildJoined = await addGuildMember(discordUser.id, accessToken);
        roleGranted = await grantVerifiedRole(discordUser.id);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Error desconocido";
        await updateVerification(verificationId, {
          status: "error",
          errorMessage: message.slice(0, 250),
          guildJoined,
          roleGranted,
        });
        await addVerificationEvent(verificationId, discordUser.id, "error", message);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "Tu cuenta es apta, pero no se pudo entregar el rol. Revisa que el bot esté en el servidor y tenga el permiso de Gestionar roles, y que su rol esté por encima del rol de verificado.",
        });
      }

      await updateVerification(verificationId, {
        status: "approved",
        guildJoined,
        roleGranted,
      });
      await addVerificationEvent(
        verificationId,
        discordUser.id,
        "approved",
        `Verificación correcta (riesgo ${risk.score})`,
      );

      return {
        ticket,
        status: "approved" as const,
        riskScore: risk.score,
        reasons: risk.reasons,
        account: {
          id: discordUser.id,
          username: discordUser.username,
          globalName: discordUser.global_name ?? null,
          avatar,
          createdAt: createdAt?.toISOString() ?? null,
          ageDays,
        },
        network: {
          country: ipInfo.country,
          city: ipInfo.city,
          isp: ipInfo.isp,
          vpn: ipInfo.proxy,
          hosting: ipInfo.hosting,
        },
        guildJoined,
        roleGranted,
      };
    },
  ),

  /** Consulta pública del resultado por ticket. */
  byTicket: publicProcedure.input(z.object({ ticket: z.string().min(4) })).query(async ({ input }) => {
    const row = await getVerificationByTicket(input.ticket);
    if (!row) return null;
    return {
      status: row.status,
      decision: row.decision,
      riskScore: row.riskScore,
      reasons: row.reasons ? JSON.parse(row.reasons) : [],
      roleGranted: row.roleGranted,
      createdAt: row.createdAt,
      account: {
        username: row.username,
        globalName: row.globalName,
        avatar: row.avatar,
        ageDays: row.accountAgeDays,
      },
      network: {
        country: row.ipCountry,
        city: row.ipCity,
        isp: row.ipIsp,
        vpn: row.vpnDetected,
      },
    };
  }),

  /** Panel de control: resumen y últimos intentos. */
  panel: publicProcedure.query(async () => {
    const [stats, recent] = await Promise.all([verificationStats(), recentVerifications(25)]);
    return { stats, recent };
  }),
});
