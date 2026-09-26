/**
 * Valida las credenciales de Discord contra su API real.
 * Requiere DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET y DISCORD_BOT_TOKEN.
 * El servidor y el rol se resuelven automáticamente con el token del bot.
 */
import { beforeAll, describe, expect, it } from "vitest";
import { config, isConfigured, missingConfig, resolveTarget } from "./discordVerify";

const DISCORD_API = "https://discord.com/api/v10";

describe("credenciales de Discord", () => {
  it("están las credenciales indispensables", () => {
    expect(missingConfig(), `Faltan: ${missingConfig().join(", ")}`).toHaveLength(0);
    expect(isConfigured()).toBe(true);
  });

  it("el client id es válido y el client secret es aceptado por Discord", async () => {
    expect(config.clientId).toMatch(/^\d{17,20}$/);

    // Se pide un token con un código falso: si el secreto es incorrecto Discord
    // responde invalid_client; si es correcto, se queja solo del código.
    const res = await fetch(`${DISCORD_API}/oauth2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        grant_type: "authorization_code",
        code: "codigo-invalido-de-prueba",
        redirect_uri: "https://ejemplo.invalid/",
      }),
    });
    const data = (await res.json()) as { error?: string };
    expect(data.error, "El client secret fue rechazado por Discord").not.toBe("invalid_client");
  });

  it("el bot token es válido y el bot existe", async () => {
    const res = await fetch(`${DISCORD_API}/users/@me`, {
      headers: { Authorization: `Bot ${config.botToken}` },
    });
    expect(res.status, "El bot token fue rechazado por Discord").toBe(200);
    const bot = (await res.json()) as { id: string; username: string; bot?: boolean };
    expect(bot.id).toMatch(/^\d+$/);
    expect(bot.bot).toBe(true);
    console.log(`    → Bot: ${bot.username} (${bot.id})`);
  });

  it("el servidor destino existe y el bot está dentro", async () => {
    const target = await resolveTarget(true);
    const res = await fetch(`${DISCORD_API}/guilds/${target.guildId}`, {
      headers: { Authorization: `Bot ${config.botToken}` },
    });
    expect(res.status, "El bot no está en ese servidor").toBe(200);
    const guild = (await res.json()) as { name: string };
    expect(guild.name).toBe(target.guildName);
    console.log(`    → Servidor: ${guild.name} (${target.guildId})`);
  });

  it("el rol de verificado existe en el servidor", async () => {
    const target = await resolveTarget(true);
    const res = await fetch(`${DISCORD_API}/guilds/${target.guildId}/roles`, {
      headers: { Authorization: `Bot ${config.botToken}` },
    });
    expect(res.status).toBe(200);
    const roles = (await res.json()) as { id: string; name: string }[];
    expect(roles.some(r => r.id === target.roleId)).toBe(true);
    console.log(`    → Rol de verificado: ${target.roleName} (${target.roleId})`);
  });

  it("el bot puede gestionar el rol (permiso y jerarquía)", async () => {
    const target = await resolveTarget(true);
    const [meRes, rolesRes] = await Promise.all([
      fetch(`${DISCORD_API}/users/@me`, { headers: { Authorization: `Bot ${config.botToken}` } }),
      fetch(`${DISCORD_API}/guilds/${target.guildId}/roles`, {
        headers: { Authorization: `Bot ${config.botToken}` },
      }),
    ]);
    const bot = (await meRes.json()) as { id: string };
    const roles = (await rolesRes.json()) as { id: string; position: number }[];

    const memberRes = await fetch(`${DISCORD_API}/guilds/${target.guildId}/members/${bot.id}`, {
      headers: { Authorization: `Bot ${config.botToken}` },
    });
    expect(memberRes.status, "El bot no figura como miembro del servidor").toBe(200);
    const member = (await memberRes.json()) as { roles: string[] };

    // Posición más alta del bot = su rol más alto entre los asignados.
    const botTop = Math.max(
      ...roles.filter(r => member.roles.includes(r.id)).map(r => r.position),
      0,
    );
    const rolePosition = roles.find(r => r.id === target.roleId)!.position;

    expect(
      botTop,
      `El rol del bot (posición ${botTop}) debe estar por encima del rol de verificado (posición ${rolePosition})`,
    ).toBeGreaterThan(rolePosition);
    console.log(`    → Jerarquía correcta: bot ${botTop} > rol ${rolePosition}`);
  });
});