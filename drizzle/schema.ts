import {
  boolean,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Cada intento de verificación de una cuenta de Discord.
 * Guarda el resultado del análisis antifraude y si se entregó el rol.
 */
export const verifications = mysqlTable("verifications", {
  id: int("id").autoincrement().primaryKey(),
  /** Identificador público del intento (se usa para mostrar el resultado). */
  ticket: varchar("ticket", { length: 24 }).notNull().unique(),

  /** Datos de la cuenta de Discord. */
  discordId: varchar("discordId", { length: 32 }),
  username: varchar("username", { length: 64 }),
  globalName: varchar("globalName", { length: 96 }),
  avatar: varchar("avatar", { length: 160 }),
  email: varchar("email", { length: 320 }),
  accountCreatedAt: timestamp("accountCreatedAt"),
  accountAgeDays: int("accountAgeDays"),

  /** Resultado. */
  status: mysqlEnum("status", ["pending", "approved", "blocked", "error"])
    .default("pending")
    .notNull(),
  decision: mysqlEnum("decision", ["allow", "block"]).default("block").notNull(),
  riskScore: int("riskScore").default(0).notNull(),
  /** Lista JSON de motivos (código + texto + puntaje). */
  reasons: text("reasons"),
  errorMessage: varchar("errorMessage", { length: 255 }),

  /** Señales de red. */
  ip: varchar("ip", { length: 64 }),
  ipCountry: varchar("ipCountry", { length: 8 }),
  ipCity: varchar("ipCity", { length: 96 }),
  ipIsp: varchar("ipIsp", { length: 128 }),
  ipTimezone: varchar("ipTimezone", { length: 64 }),
  ipProxy: boolean("ipProxy").default(false).notNull(),
  ipHosting: boolean("ipHosting").default(false).notNull(),
  vpnDetected: boolean("vpnDetected").default(false).notNull(),
  privateIp: boolean("privateIp").default(false).notNull(),

  /** Señales del cliente. */
  clientTimezone: varchar("clientTimezone", { length: 64 }),
  fingerprint: varchar("fingerprint", { length: 64 }),
  userAgent: varchar("userAgent", { length: 255 }),

  /** Señales de multicuenta. */
  sameIpAccounts: int("sameIpAccounts").default(0).notNull(),
  sameFingerprintAccounts: int("sameFingerprintAccounts").default(0).notNull(),

  /** Entrega del acceso. */
  guildJoined: boolean("guildJoined").default(false).notNull(),
  roleGranted: boolean("roleGranted").default(false).notNull(),
  demo: boolean("demo").default(false).notNull(),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    ipIdx: index("idx_verifications_ip").on(table.ip),
    fingerprintIdx: index("idx_verifications_fingerprint").on(table.fingerprint),
    discordIdIdx: index("idx_verifications_discord_id").on(table.discordId),
    statusIdx: index("idx_verifications_status").on(table.status),
    createdAtIdx: index("idx_verifications_created_at").on(table.createdAt),
  }),
);

export type Verification = typeof verifications.$inferSelect;
export type InsertVerification = typeof verifications.$inferInsert;

/** Bitácora de cada paso del proceso, útil para auditar bloqueos. */
export const verificationEvents = mysqlTable("verification_events", {
  id: int("id").autoincrement().primaryKey(),
  verificationId: int("verificationId"),
  discordId: varchar("discordId", { length: 32 }),
  type: varchar("type", { length: 32 }).notNull(),
  message: text("message"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type VerificationEvent = typeof verificationEvents.$inferSelect;
