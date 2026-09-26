import { and, desc, eq, gte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  verifications,
  verificationEvents,
  type InsertVerification,
  type Verification,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/* --------------------------------------------------------- verificaciones */

export async function createVerification(data: InsertVerification): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Base de datos no disponible");
  const result = await db.insert(verifications).values(data);
  return Number(result[0].insertId);
}

export async function updateVerification(
  id: number,
  data: Partial<InsertVerification>,
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(verifications).set(data).where(eq(verifications.id, id));
}

export async function getVerificationByTicket(ticket: string): Promise<Verification | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db
    .select()
    .from(verifications)
    .where(eq(verifications.ticket, ticket))
    .limit(1);
  return rows[0];
}

/**
 * Cuántas cuentas distintas ya pasaron por esta IP o este dispositivo en la
 * ventana indicada (30 días por defecto). Sirve para frenar multicuentas.
 */
export async function countRelatedApprovals(
  field: "ip" | "fingerprint",
  value: string,
  sinceDays = 30,
): Promise<number> {
  const db = await getDb();
  if (!db || !value) return 0;

  const since = new Date(Date.now() - sinceDays * 86_400_000);
  const column = field === "ip" ? verifications.ip : verifications.fingerprint;

  const rows = await db
    .select({ total: sql<number>`count(distinct ${verifications.discordId})` })
    .from(verifications)
    .where(
      and(
        eq(column, value),
        eq(verifications.status, "approved"),
        gte(verifications.createdAt, since),
      ),
    );

  return Number(rows[0]?.total ?? 0);
}

export async function addVerificationEvent(
  verificationId: number | null,
  discordId: string | null,
  type: string,
  message: string,
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(verificationEvents).values({ verificationId, discordId, type, message });
}

/** Resumen para el panel de control. */
export async function verificationStats() {
  const db = await getDb();
  if (!db) return { total: 0, approved: 0, blocked: 0, vpnBlocked: 0, last24h: 0 };

  const rows = await db
    .select({
      total: sql<number>`count(*)`,
      approved: sql<number>`sum(case when ${verifications.status} = 'approved' then 1 else 0 end)`,
      blocked: sql<number>`sum(case when ${verifications.status} = 'blocked' then 1 else 0 end)`,
      vpnBlocked: sql<number>`sum(case when ${verifications.vpnDetected} = true then 1 else 0 end)`,
    })
    .from(verifications);

  const recent = await db
    .select({ total: sql<number>`count(*)` })
    .from(verifications)
    .where(gte(verifications.createdAt, new Date(Date.now() - 86_400_000)));

  const row = rows[0];
  return {
    total: Number(row?.total ?? 0),
    approved: Number(row?.approved ?? 0),
    blocked: Number(row?.blocked ?? 0),
    vpnBlocked: Number(row?.vpnBlocked ?? 0),
    last24h: Number(recent[0]?.total ?? 0),
  };
}

export async function recentVerifications(limit = 25) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: verifications.id,
      ticket: verifications.ticket,
      discordId: verifications.discordId,
      username: verifications.username,
      globalName: verifications.globalName,
      avatar: verifications.avatar,
      status: verifications.status,
      riskScore: verifications.riskScore,
      ipCountry: verifications.ipCountry,
      ipIsp: verifications.ipIsp,
      vpnDetected: verifications.vpnDetected,
      roleGranted: verifications.roleGranted,
      reasons: verifications.reasons,
      createdAt: verifications.createdAt,
    })
    .from(verifications)
    .orderBy(desc(verifications.createdAt))
    .limit(limit);
}
