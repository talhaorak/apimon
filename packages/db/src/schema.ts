// ============================================================
// apimon — Database Schema (Drizzle ORM + PostgreSQL)
// ============================================================

import {
  pgTable,
  uuid,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ────────────────────────────────────────────────────────────
// Users
// ────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  plan: varchar("plan", { length: 20 }).notNull().default("free"),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  apiKeys: many(apiKeys),
  monitors: many(monitors),
  statusPages: many(statusPages),
  alertChannels: many(alertChannels),
}));

// ────────────────────────────────────────────────────────────
// API Keys
// ────────────────────────────────────────────────────────────

export const apiKeys = pgTable(
  "api_keys",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    keyHash: varchar("key_hash", { length: 255 }).notNull().unique(),
    name: varchar("name", { length: 100 }).notNull(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("api_keys_user_id_idx").on(table.userId),
  ]
);

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  user: one(users, {
    fields: [apiKeys.userId],
    references: [users.id],
  }),
}));

// ────────────────────────────────────────────────────────────
// Monitors
// ────────────────────────────────────────────────────────────

export const monitors = pgTable(
  "monitors",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    url: text("url").notNull(),
    method: varchar("method", { length: 10 }).notNull().default("GET"),
    headers: jsonb("headers").$type<Record<string, string>>(),
    body: text("body"),
    expectedStatus: integer("expected_status").notNull().default(200),
    checkIntervalSeconds: integer("check_interval_seconds").notNull().default(300),
    timeoutMs: integer("timeout_ms").notNull().default(30000),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("monitors_user_id_idx").on(table.userId),
    index("monitors_is_active_idx").on(table.isActive),
  ]
);

export const monitorsRelations = relations(monitors, ({ one, many }) => ({
  user: one(users, {
    fields: [monitors.userId],
    references: [users.id],
  }),
  checks: many(checks),
  incidents: many(incidents),
  alertHistory: many(alertHistory),
}));

// ────────────────────────────────────────────────────────────
// Checks
// ────────────────────────────────────────────────────────────

export const checks = pgTable(
  "checks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    monitorId: uuid("monitor_id")
      .notNull()
      .references(() => monitors.id, { onDelete: "cascade" }),
    statusCode: integer("status_code"),
    responseTimeMs: integer("response_time_ms"),
    isUp: boolean("is_up").notNull(),
    errorMessage: text("error_message"),
    responseBody: text("response_body"),
    region: varchar("region", { length: 50 }).notNull().default("us-east-1"),
    checkedAt: timestamp("checked_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("checks_monitor_id_idx").on(table.monitorId),
    index("checks_checked_at_idx").on(table.checkedAt),
    index("checks_monitor_checked_idx").on(table.monitorId, table.checkedAt),
  ]
);

export const checksRelations = relations(checks, ({ one }) => ({
  monitor: one(monitors, {
    fields: [checks.monitorId],
    references: [monitors.id],
  }),
}));

// ────────────────────────────────────────────────────────────
// Incidents
// ────────────────────────────────────────────────────────────

export const incidents = pgTable(
  "incidents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    monitorId: uuid("monitor_id")
      .notNull()
      .references(() => monitors.id, { onDelete: "cascade" }),
    state: varchar("state", { length: 20 }).notNull().default("ongoing"),
    cause: text("cause"),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  },
  (table) => [
    index("incidents_monitor_id_idx").on(table.monitorId),
    index("incidents_state_idx").on(table.state),
  ]
);

export const incidentsRelations = relations(incidents, ({ one, many }) => ({
  monitor: one(monitors, {
    fields: [incidents.monitorId],
    references: [monitors.id],
  }),
  alertHistory: many(alertHistory),
}));

// ────────────────────────────────────────────────────────────
// Status Pages
// ────────────────────────────────────────────────────────────

export const statusPages = pgTable(
  "status_pages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    slug: varchar("slug", { length: 64 }).notNull().unique(),
    title: varchar("title", { length: 200 }).notNull(),
    description: text("description"),
    monitorIds: jsonb("monitor_ids").$type<string[]>().notNull().default([]),
    customDomain: varchar("custom_domain", { length: 255 }),
    isPublic: boolean("is_public").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("status_pages_user_id_idx").on(table.userId),
    uniqueIndex("status_pages_slug_idx").on(table.slug),
  ]
);

export const statusPagesRelations = relations(statusPages, ({ one }) => ({
  user: one(users, {
    fields: [statusPages.userId],
    references: [users.id],
  }),
}));

// ────────────────────────────────────────────────────────────
// Alert Channels
// ────────────────────────────────────────────────────────────

export const alertChannels = pgTable(
  "alert_channels",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 20 }).notNull(),
    config: jsonb("config").$type<Record<string, unknown>>().notNull(),
    isVerified: boolean("is_verified").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("alert_channels_user_id_idx").on(table.userId),
  ]
);

export const alertChannelsRelations = relations(alertChannels, ({ one, many }) => ({
  user: one(users, {
    fields: [alertChannels.userId],
    references: [users.id],
  }),
  alertHistory: many(alertHistory),
}));

// ────────────────────────────────────────────────────────────
// Alert History
// ────────────────────────────────────────────────────────────

export const alertHistory = pgTable(
  "alert_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    monitorId: uuid("monitor_id")
      .notNull()
      .references(() => monitors.id, { onDelete: "cascade" }),
    channelId: uuid("channel_id")
      .notNull()
      .references(() => alertChannels.id, { onDelete: "cascade" }),
    incidentId: uuid("incident_id")
      .references(() => incidents.id, { onDelete: "set null" }),
    message: text("message").notNull(),
    status: varchar("status", { length: 20 }).notNull().default("pending"),
    sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("alert_history_monitor_id_idx").on(table.monitorId),
    index("alert_history_channel_id_idx").on(table.channelId),
    index("alert_history_incident_id_idx").on(table.incidentId),
  ]
);

export const alertHistoryRelations = relations(alertHistory, ({ one }) => ({
  monitor: one(monitors, {
    fields: [alertHistory.monitorId],
    references: [monitors.id],
  }),
  channel: one(alertChannels, {
    fields: [alertHistory.channelId],
    references: [alertChannels.id],
  }),
  incident: one(incidents, {
    fields: [alertHistory.incidentId],
    references: [incidents.id],
  }),
}));
