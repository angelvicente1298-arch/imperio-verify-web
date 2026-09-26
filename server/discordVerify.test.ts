import { describe, expect, it } from "vitest";
import {
  daysBetween,
  evaluateRisk,
  isPrivateIp,
  makeTicket,
  sha256,
  signState,
  snowflakeToDate,
  verifyState,
  type IpInfo,
} from "./discordVerify";

const cleanIp: IpInfo = {
  ok: true,
  country: "Chile",
  countryCode: "CL",
  city: "Santiago",
  isp: "Movistar",
  timezone: "America/Santiago",
  proxy: false,
  hosting: false,
  mobile: false,
  privateIp: false,
  source: "ip-api",
};

const baseInput = {
  accountAgeDays: 900,
  accountVerifiedEmail: true,
  ip: cleanIp,
  timezoneMismatch: false,
  sameIpAccounts: 0,
  sameFingerprintAccounts: 0,
  fingerprintMissing: false,
};

describe("evaluateRisk", () => {
  it("aprueba una cuenta sana de red limpia", () => {
    const result = evaluateRisk(baseInput);
    expect(result.decision).toBe("allow");
    expect(result.reasons).toHaveLength(0);
  });

  it("bloquea siempre una conexión con VPN o proxy", () => {
    const result = evaluateRisk({ ...baseInput, ip: { ...cleanIp, proxy: true } });
    expect(result.decision).toBe("block");
    expect(result.reasons.some(r => r.code === "vpn_proxy" && r.hard)).toBe(true);
  });

  it("bloquea una conexión desde centro de datos", () => {
    const result = evaluateRisk({ ...baseInput, ip: { ...cleanIp, hosting: true } });
    expect(result.decision).toBe("block");
    expect(result.reasons.some(r => r.code === "datacenter")).toBe(true);
  });

  it("bloquea cuentas demasiado nuevas (multicuenta típica)", () => {
    const result = evaluateRisk({ ...baseInput, accountAgeDays: 3 });
    expect(result.decision).toBe("block");
    expect(result.reasons.some(r => r.code === "account_too_new" && r.hard)).toBe(true);
  });

  it("bloquea cuando el mismo dispositivo ya verificó otra cuenta", () => {
    const result = evaluateRisk({ ...baseInput, sameFingerprintAccounts: 2 });
    expect(result.decision).toBe("block");
    expect(result.reasons.some(r => r.code === "device_reuse")).toBe(true);
  });

  it("bloquea cuando la misma IP acumula varias cuentas", () => {
    const result = evaluateRisk({ ...baseInput, sameIpAccounts: 4 });
    expect(result.decision).toBe("block");
    expect(result.reasons.some(r => r.code === "ip_reuse")).toBe(true);
  });

  it("no bloquea por señales débiles aisladas, pero las reporta", () => {
    const result = evaluateRisk({ ...baseInput, accountVerifiedEmail: false });
    expect(result.decision).toBe("allow");
    expect(result.score).toBe(25);
    expect(result.reasons[0]?.code).toBe("email_unverified");
  });

  it("acumula señales débiles hasta bloquear", () => {
    const result = evaluateRisk({
      ...baseInput,
      accountVerifiedEmail: false,
      timezoneMismatch: true,
      accountAgeDays: 40,
    });
    expect(result.decision).toBe("block");
    expect(result.score).toBeGreaterThanOrEqual(40);
  });
});

describe("snowflakeToDate", () => {
  it("extrae la fecha de creación de la cuenta desde el ID", () => {
    const date = snowflakeToDate("710569093779865650");
    expect(date).toBeInstanceOf(Date);
    expect(date!.getUTCFullYear()).toBe(2020);
    expect(daysBetween(date!) > 1000).toBe(true);
  });

  it("devuelve null con un ID inválido", () => {
    expect(snowflakeToDate("no-es-un-id")).toBeNull();
  });
});

describe("isPrivateIp", () => {
  it("reconoce rangos privados y locales", () => {
    expect(isPrivateIp("127.0.0.1")).toBe(true);
    expect(isPrivateIp("10.1.2.3")).toBe(true);
    expect(isPrivateIp("192.168.1.20")).toBe(true);
    expect(isPrivateIp("172.16.5.9")).toBe(true);
    expect(isPrivateIp("::ffff:10.0.0.4")).toBe(true);
  });

  it("no confunde IP públicas", () => {
    expect(isPrivateIp("190.160.10.5")).toBe(false);
    expect(isPrivateIp("8.8.8.8")).toBe(false);
  });
});

describe("state de OAuth", () => {
  it("acepta un state recién emitido", () => {
    expect(verifyState(signState())).toBe(true);
  });

  it("rechaza states viejos o manipulados", () => {
    expect(verifyState(undefined)).toBe(false);
    expect(verifyState("basura")).toBe(false);
    expect(verifyState(signState(), -1)).toBe(false);
  });
});

describe("utilidades", () => {
  it("genera tickets y hashes estables", () => {
    const a = makeTicket();
    const b = makeTicket();
    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThan(8);
    expect(sha256("hola")).toBe(sha256("hola"));
    expect(sha256("hola")).not.toBe(sha256("hola2"));
  });
});