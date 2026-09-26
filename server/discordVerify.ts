/**
 * Motor de verificación de cuentas de Discord.
 *
 * Analiza los metadatos que devuelve Discord Developer Portal (OAuth2) más las
 * señales de red del visitante, decide si la cuenta es apta y entrega el rol de
 * verificado. Nada de esto requiere que el usuario instale nada: solo pulsa un
 * botón y autoriza la app.
 */
import crypto from "crypto";

export const DISCORD_API = "https://discord.com/api/v10";

/* ------------------------------------------------------------ configuración */

export const config = {
  clientId: process.env.DISCORD_CLIENT_ID ?? "",
  clientSecret: process.env.DISCORD_CLIENT_SECRET ?? "",
  botToken: process.env.DISCORD_BOT_TOKEN ?? "",
  guildId: process.env.DISCORD_GUILD_ID ?? "",
  verifiedRoleId: process.env.DISCORD_VERIFIED_ROLE_ID ?? "",
  redirectUriOverride: process.env.DISCORD_REDIRECT_URI ?? "",
  /** Días mínimos de antigüedad de la cuenta. */
  minAccountDays: Number(process.env.VERIFY_MIN_ACCOUNT_DAYS ?? 30),
  /** Cuentas distintas permitidas por IP. 2 = se bloquea la segunda. */
  maxAccountsPerIp: Number(process.env.VERIFY_MAX_ACCOUNTS_PER_IP ?? 2),
  /** Cuentas distintas permitidas por dispositivo. */
  maxAccountsPerDevice: Number(process.env.VERIFY_MAX_ACCOUNTS_PER_DEVICE ?? 2),
  /** Puntaje de riesgo que ya no permite entrar. */
  maxRisk: Number(process.env.VERIFY_MAX_RISK ?? 40),
  ipqsKey: process.env.IPQUALITYSCORE_API_KEY ?? "",
};

/** ¿Están todas las credenciales de Discord presentes? */
export function isConfigured(): boolean {
  const c = config;
  // El servidor y el rol se pueden resolver solos con el token del bot, así que
  // solo exigimos las tres credenciales indispensables.
  return Boolean(c.clientId && c.clientSecret && c.botToken);
}

/** Qué falta configurar (para mostrarlo en el panel). */
export function missingConfig(): string[] {
  const missing: string[] = [];
  if (!config.clientId) missing.push("DISCORD_CLIENT_ID");
  if (!config.clientSecret) missing.push("DISCORD_CLIENT_SECRET");
  if (!config.botToken) missing.push("DISCORD_BOT_TOKEN");
  return missing;
}

const NUMERIC_ID = /^\d{17,20}$/;

/* ------------------------------------------------- URL de retorno (redirect) */

type AppInfo = { id: string; name: string; redirect_uris?: string[] | null };
let cachedApp: AppInfo | null = null;

/** Lee la ficha de la aplicación (incluye las URLs de retorno registradas). */
export async function applicationInfo(force = false): Promise<AppInfo | null> {
  if (cachedApp && !force) return cachedApp;
  try {
    const res = await fetch(`${DISCORD_API}/applications/@me`, {
      headers: { Authorization: `Bot ${config.botToken}` },
    });
    if (!res.ok) return null;
    cachedApp = (await res.json()) as AppInfo;
    return cachedApp;
  } catch {
    return null;
  }
}

/** Dominio de una URL (sin barra final ni protocolo), para comparar. */
export function hostOf(value: string): string {
  try {
    return new URL(value).host;
  } catch {
    return "";
  }
}

function isLocalhost(value: string): boolean {
  const host = hostOf(value);
  return host.startsWith("localhost") || host.startsWith("127.0.0.1");
}

/**
 * URL de retorno que hay que enviar a Discord.
 *
 * Discord exige que coincida **exactamente** con una de las registradas en el
 * Developer Portal (una barra final de diferencia ya la invalida). Por eso aquí
 * se leen las URLs registradas y se devuelve la que corresponde al dominio
 * actual, en lugar de construirla a mano.
 */
export async function callbackUrl(origin: string): Promise<string> {
  if (config.redirectUriOverride) return config.redirectUriOverride;

  const app = await applicationInfo();
  const registered = (app?.redirect_uris ?? []).filter(Boolean);
  const host = hostOf(origin);

  // 1) Coincidencia de dominio con el sitio actual (la situación normal).
  const match = registered.find(uri => hostOf(uri) === host);
  if (match) return match;

  // 2) Sin coincidencia: se usa una registrada que no sea de desarrollo, para
  //    que la verificación pueda completarse aunque se entre por otro dominio.
  const production = registered.find(uri => !isLocalhost(uri));
  if (production) {
    console.warn(
      `[Discord] El dominio ${host} no está registrado en el Developer Portal. Se usará ${production}.`,
    );
    return production;
  }

  if (registered.length > 0) return registered[0];

  // 3) Sin ninguna registrada: se avisa en la interfaz.
  return origin;
}

/**
 * Diagnóstico para la interfaz: si la URL de retorno coincide o no con las
 * registradas, y cuál hay que añadir en el Developer Portal si falta.
 */
export async function redirectStatus(origin: string): Promise<{
  ok: boolean;
  used: string;
  registered: string[];
  suggested: string;
}> {
  const used = await callbackUrl(origin);
  const app = await applicationInfo(true);
  const registered = ((app?.redirect_uris ?? []).filter(Boolean) as string[]) ?? [];
  const host = hostOf(used);

  // Es válida si su dominio está entre los registrados.
  const ok = registered.some(uri => hostOf(uri) === host);

  return {
    ok,
    used,
    registered,
    // Lo que debería registrarse para que funcione desde este dominio.
    suggested: registered.find(uri => hostOf(uri) === hostOf(origin)) ?? origin,
  };
}

/* ------------------------------------------- resolución automática de destino */

/**
 * Averigua el servidor y el rol de verificado. Si los IDs configurados no son
 * válidos (o no existen), se detectan automáticamente usando el token del bot:
 * el primer servidor donde esté el bot y el rol llamado «Verificado». Así el
 * sistema funciona aunque un ID se pegue mal en la configuración.
 */
type Target = { guildId: string; roleId: string; roleName: string; guildName: string };
let cachedTarget: Target | null = null;

async function botGet<T>(path: string): Promise<T> {
  const res = await fetch(`${DISCORD_API}${path}`, {
    headers: { Authorization: `Bot ${config.botToken}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Discord respondió ${res.status}: ${text.slice(0, 160)}`);
  }
  return (await res.json()) as T;
}

export async function resolveTarget(force = false): Promise<Target> {
  if (cachedTarget && !force) return cachedTarget;

  type Guild = { id: string; name: string };
  type Role = { id: string; name: string; position: number };

  let guild: Guild | null = null;

  if (NUMERIC_ID.test(config.guildId)) {
    try {
      guild = await botGet<Guild>(`/guilds/${config.guildId}`);
    } catch {
      guild = null;
    }
  }

  if (!guild) {
    const guilds = await botGet<Guild[]>("/users/@me/guilds");
    if (guilds.length === 0) {
      throw new Error(
        "El bot no está en ningún servidor. Invítalo a tu servidor de Discord e inténtalo de nuevo.",
      );
    }
    // Si está en varios, se prefiere el que coincida por nombre con la marca.
    guild =
      guilds.find(g => g.name.toLowerCase().includes("imperio")) ??
      (guilds.length === 1 ? guilds[0] : guilds[0]);
    console.warn(`[Discord] Servidor detectado automáticamente: ${guild.name} (${guild.id})`);
  }

  const roles = await botGet<Role[]>(`/guilds/${guild.id}/roles`);

  let role = NUMERIC_ID.test(config.verifiedRoleId)
    ? roles.find(r => r.id === config.verifiedRoleId)
    : undefined;

  if (!role) {
    const keywords = ["verificad", "verified"];
    role =
      roles.find(r => keywords.some(k => r.name.toLowerCase().includes(k))) ??
      undefined;
  }

  if (!role) {
    throw new Error(
      `No se encontró el rol de verificado en «${guild.name}». Crea un rol llamado «Verificado» o configura DISCORD_VERIFIED_ROLE_ID. Roles disponibles: ` +
        roles.filter(r => r.name !== "@everyone").map(r => r.name).slice(0, 12).join(", "),
    );
  }

  if (role.id !== config.verifiedRoleId || guild.id !== config.guildId) {
    console.warn(
      `[Discord] Destino resuelto automáticamente → servidor ${guild.name} (${guild.id}), rol ${role.name} (${role.id})`,
    );
  }

  cachedTarget = {
    guildId: guild.id,
    roleId: role.id,
    roleName: role.name,
    guildName: guild.name,
  };
  return cachedTarget;
}

/* ---------------------------------------------------------- oauth de Discord */

export async function buildAuthorizeUrl(origin: string, state: string): Promise<string> {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: await callbackUrl(origin),
    response_type: "code",
    // guilds.join permite añadir a la persona al servidor con su propio token.
    scope: "identify email guilds.join",
    state,
    prompt: "consent",
  });
  return `https://discord.com/oauth2/authorize?${params.toString()}`;
}

export function signState(): string {
  const payload = { n: crypto.randomBytes(16).toString("hex"), t: Date.now() };
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

export function verifyState(state: string | undefined, maxAgeMs = 15 * 60 * 1000): boolean {
  if (!state) return false;
  try {
    const parsed = JSON.parse(Buffer.from(state, "base64url").toString("utf8"));
    return typeof parsed?.n === "string" && Date.now() - Number(parsed.t) < maxAgeMs;
  } catch {
    return false;
  }
}

type TokenResponse = { access_token?: string; token_type?: string; error?: string; error_description?: string };

export async function exchangeCode(code: string, origin: string): Promise<string> {
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    grant_type: "authorization_code",
    code,
    redirect_uri: await callbackUrl(origin),
  });

  const res = await fetch(`${DISCORD_API}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = (await res.json()) as TokenResponse;
  if (!res.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || "No se pudo validar el acceso con Discord");
  }
  return data.access_token;
}

export type DiscordUser = {
  id: string;
  username: string;
  global_name?: string | null;
  avatar?: string | null;
  email?: string | null;
  verified?: boolean;
};

export async function fetchDiscordUser(accessToken: string): Promise<DiscordUser> {
  const res = await fetch(`${DISCORD_API}/users/@me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("Discord no devolvió los datos de la cuenta");
  return (await res.json()) as DiscordUser;
}

/** Une al usuario al servidor usando su propio token (scope guilds.join). */
export async function addGuildMember(userId: string, accessToken: string): Promise<boolean> {
  const target = await resolveTarget();
  const res = await fetch(`${DISCORD_API}/guilds/${target.guildId}/members/${userId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bot ${config.botToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ access_token: accessToken }),
  });
  // 201 = añadido ahora, 204 = ya era miembro.
  if (res.status === 201 || res.status === 204) return true;
  const text = await res.text();
  throw new Error(`No se pudo unir al servidor: ${res.status} ${text.slice(0, 180)}`);
}

/** Entrega el rol de verificado. */
export async function grantVerifiedRole(userId: string): Promise<boolean> {
  const target = await resolveTarget();
  const res = await fetch(
    `${DISCORD_API}/guilds/${target.guildId}/members/${userId}/roles/${target.roleId}`,
    {
      method: "PUT",
      headers: { Authorization: `Bot ${config.botToken}` },
    },
  );
  if (res.status === 204) return true;
  const text = await res.text();
  throw new Error(`No se pudo asignar el rol: ${res.status} ${text.slice(0, 180)}`);
}

/* ------------------------------------------------------------ metadatos */

/** Los IDs de Discord (snowflake) incluyen la fecha de creación de la cuenta. */
export function snowflakeToDate(id: string): Date | null {
  try {
    const ms = Number(BigInt(id) >> BigInt(22)) + 1420070400000;
    const date = new Date(ms);
    return Number.isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

export function daysBetween(from: Date, to: Date = new Date()): number {
  return Math.max(0, Math.floor((to.getTime() - from.getTime()) / 86_400_000));
}

export type IpInfo = {
  ok: boolean;
  country: string | null;
  countryCode: string | null;
  city: string | null;
  isp: string | null;
  timezone: string | null;
  proxy: boolean;
  hosting: boolean;
  mobile: boolean;
  privateIp: boolean;
  source: string;
};

export function isPrivateIp(ip: string): boolean {
  if (!ip) return true;
  const clean = ip.replace(/^::ffff:/, "");
  if (clean === "::1" || clean === "127.0.0.1" || clean === "localhost") return true;
  if (/^10\./.test(clean)) return true;
  if (/^192\.168\./.test(clean)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(clean)) return true;
  if (/^169\.254\./.test(clean)) return true;
  if (/^f[cd]/i.test(clean)) return true;
  return false;
}

const EMPTY_IP: Omit<IpInfo, "privateIp" | "source"> = {
  ok: false,
  country: null,
  countryCode: null,
  city: null,
  isp: null,
  timezone: null,
  proxy: false,
  hosting: false,
  mobile: false,
};

/** Geolocaliza y detecta VPN/proxy/centro de datos de la IP del visitante. */
export async function lookupIp(ip: string): Promise<IpInfo> {
  if (isPrivateIp(ip)) {
    return { ...EMPTY_IP, privateIp: true, source: "local" };
  }

  // Detección opcional de mayor calidad si hay clave de IPQualityScore.
  let ipqs: { proxy: boolean; vpn: boolean; tor: boolean; hosting: boolean } | null = null;
  if (config.ipqsKey) {
    try {
      const res = await fetch(
        `https://ipqualityscore.com/api/json/ip/${config.ipqsKey}/${encodeURIComponent(ip)}?strictness=1`,
        { signal: AbortSignal.timeout(6000) },
      );
      if (res.ok) {
        const data = (await res.json()) as Record<string, unknown>;
        ipqs = {
          proxy: Boolean(data.proxy),
          vpn: Boolean(data.vpn),
          tor: Boolean(data.tor),
          hosting: Boolean(data.is_crawler) || Boolean(data.recent_abuse),
        };
      }
    } catch {
      ipqs = null;
    }
  }

  try {
    const fields =
      "status,message,country,countryCode,city,timezone,isp,org,as,mobile,proxy,hosting,query";
    const res = await fetch(`http://ip-api.com/json/${encodeURIComponent(ip)}?fields=${fields}`, {
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) throw new Error(`ip-api ${res.status}`);
    const data = (await res.json()) as Record<string, unknown>;
    if (data.status !== "success") {
      return { ...EMPTY_IP, privateIp: false, source: "ip-api:error" };
    }
    return {
      ok: true,
      country: (data.country as string) ?? null,
      countryCode: (data.countryCode as string) ?? null,
      city: (data.city as string) ?? null,
      isp: (data.isp as string) ?? null,
      timezone: (data.timezone as string) ?? null,
      proxy: Boolean(data.proxy) || Boolean(ipqs?.proxy) || Boolean(ipqs?.vpn) || Boolean(ipqs?.tor),
      hosting: Boolean(data.hosting) || Boolean(ipqs?.hosting),
      mobile: Boolean(data.mobile),
      privateIp: false,
      source: ipqs ? "ip-api+ipqs" : "ip-api",
    };
  } catch {
    // Si el servicio externo falla no bloqueamos: se marca como desconocido.
    return { ...EMPTY_IP, privateIp: false, source: "unavailable" };
  }
}

/* ------------------------------------------------------------- antifraude */

export type Reason = { code: string; text: string; score: number; hard?: boolean };

export type RiskInput = {
  accountAgeDays: number | null;
  accountVerifiedEmail: boolean;
  ip: IpInfo;
  /** Diferencia entre la zona horaria del navegador y la de la IP. */
  timezoneMismatch: boolean;
  sameIpAccounts: number;
  sameFingerprintAccounts: number;
  fingerprintMissing: boolean;
};

export type RiskResult = {
  decision: "allow" | "block";
  score: number;
  reasons: Reason[];
};

/** Reglas antifraude: multicuentas, VPN/proxy y cuentas desechables. */
export function evaluateRisk(input: RiskInput): RiskResult {
  const reasons: Reason[] = [];
  const c = config;

  if (input.ip.proxy) {
    reasons.push({
      code: "vpn_proxy",
      text: "Se detectó VPN, proxy o red Tor en tu conexión.",
      score: 100,
      hard: true,
    });
  }

  if (input.ip.hosting && !input.ip.mobile) {
    reasons.push({
      code: "datacenter",
      text: "La conexión proviene de un centro de datos, no de una red doméstica.",
      score: 100,
      hard: true,
    });
  }

  if (input.accountAgeDays !== null && input.accountAgeDays < c.minAccountDays) {
    reasons.push({
      code: "account_too_new",
      text: `Tu cuenta de Discord tiene ${input.accountAgeDays} días; se requieren al menos ${c.minAccountDays}.`,
      score: 100,
      hard: true,
    });
  }

  if (input.sameFingerprintAccounts >= c.maxAccountsPerDevice) {
    reasons.push({
      code: "device_reuse",
      text: `Este dispositivo ya verificó otra cuenta (${input.sameFingerprintAccounts} registradas).`,
      score: 100,
      hard: true,
    });
  }

  if (input.sameIpAccounts >= c.maxAccountsPerIp) {
    reasons.push({
      code: "ip_reuse",
      text: `Desde esta conexión ya se verificaron ${input.sameIpAccounts} cuentas.`,
      score: 100,
      hard: true,
    });
  }

  if (input.timezoneMismatch) {
    reasons.push({
      code: "timezone_mismatch",
      text: "La zona horaria de tu navegador no coincide con la de tu conexión.",
      score: 30,
    });
  }

  if (!input.accountVerifiedEmail) {
    reasons.push({
      code: "email_unverified",
      text: "Tu cuenta de Discord no tiene el correo verificado.",
      score: 25,
    });
  }

  if (input.fingerprintMissing) {
    reasons.push({
      code: "no_fingerprint",
      text: "No se pudo leer la firma del dispositivo.",
      score: 15,
    });
  }

  if (input.accountAgeDays !== null && input.accountAgeDays < c.minAccountDays * 3) {
    reasons.push({
      code: "account_recent",
      text: `Cuenta con ${input.accountAgeDays} días de antigüedad.`,
      score: 10,
    });
  }

  const score = reasons.reduce((total, reason) => total + reason.score, 0);
  const hard = reasons.some((reason) => reason.hard);
  return { decision: hard || score >= c.maxRisk ? "block" : "allow", score, reasons };
}

/* ---------------------------------------------------------------- utilidades */

export function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function makeTicket(): string {
  return crypto.randomBytes(9).toString("base64url");
}

/** Toma la IP pública real del visitante detrás de proxies. */
export function clientIp(headers: Record<string, unknown>, fallback?: string): string {
  const forwarded = headers["x-forwarded-for"];
  const raw = Array.isArray(forwarded) ? forwarded[0] : (forwarded as string | undefined);
  const first = (raw ?? "").split(",")[0]?.trim();
  return first || (headers["x-real-ip"] as string) || fallback || "";
}

export function avatarUrl(user: DiscordUser): string | null {
  if (!user.avatar) return null;
  return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`;
}
