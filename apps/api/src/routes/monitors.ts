// ============================================================
// apimon API — Monitor Routes
// ============================================================

import { Hono } from "hono";
import { eq, and, desc } from "drizzle-orm";
import { monitors, checks, incidents } from "@apimon/db";
import {
  CreateMonitorSchema,
  UpdateMonitorSchema,
  PLAN_MONITOR_LIMITS,
} from "@apimon/shared";
import type { AppEnv } from "../lib/types.js";
import { authMiddleware } from "../middleware/auth.js";

const app = new Hono<AppEnv>();

// All monitor routes require authentication
app.use("*", authMiddleware);

// ── POST /monitors — Create a monitor ──
app.post("/", async (c) => {
  const db = c.get("db");
  const userId = c.get("userId");

  const body = await c.req.json().catch(() => null);
  if (!body) {
    return c.json({ error: "Invalid JSON body", code: "INVALID_BODY" }, 400);
  }

  const parsed = CreateMonitorSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      { error: "Validation failed", code: "VALIDATION_ERROR", details: parsed.error.flatten() },
      400,
    );
  }

  // Check plan limit
  const user = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.id, userId),
  });
  if (!user) {
    return c.json({ error: "User not found", code: "USER_NOT_FOUND" }, 404);
  }

  const existingMonitors = await db.query.monitors.findMany({
    where: eq(monitors.userId, userId),
  });

  const limit = PLAN_MONITOR_LIMITS[user.plan] ?? 5;
  if (existingMonitors.length >= limit) {
    return c.json(
      { error: `Monitor limit reached (${limit}). Upgrade your plan.`, code: "PLAN_LIMIT_REACHED" },
      403,
    );
  }

  const [monitor] = await db
    .insert(monitors)
    .values({
      userId,
      name: parsed.data.name,
      url: parsed.data.url,
      method: parsed.data.method,
      headers: parsed.data.headers ?? null,
      body: parsed.data.body ?? null,
      expectedStatus: parsed.data.expectedStatus,
      checkIntervalSeconds: parsed.data.checkIntervalSeconds,
      timeoutMs: parsed.data.timeoutMs,
      isActive: parsed.data.isActive,
    })
    .returning();

  return c.json(monitor, 201);
});

// ── GET /monitors — List all monitors for the user ──
app.get("/", async (c) => {
  const db = c.get("db");
  const userId = c.get("userId");

  const monitorList = await db.query.monitors.findMany({
    where: eq(monitors.userId, userId),
    orderBy: [desc(monitors.createdAt)],
  });

  // Fetch last check for each monitor
  const results = await Promise.all(
    monitorList.map(async (monitor) => {
      const lastCheck = await db.query.checks.findFirst({
        where: eq(checks.monitorId, monitor.id),
        orderBy: [desc(checks.checkedAt)],
      });
      return { ...monitor, lastCheck: lastCheck ?? null };
    }),
  );

  return c.json(results);
});

// ── GET /monitors/:id — Get a single monitor with details ──
app.get("/:id", async (c) => {
  const db = c.get("db");
  const userId = c.get("userId");
  const monitorId = c.req.param("id");

  const monitor = await db.query.monitors.findFirst({
    where: and(eq(monitors.id, monitorId), eq(monitors.userId, userId)),
  });

  if (!monitor) {
    return c.json({ error: "Monitor not found", code: "NOT_FOUND" }, 404);
  }

  // Fetch recent checks and active incidents
  const [recentChecks, activeIncidents] = await Promise.all([
    db.query.checks.findMany({
      where: eq(checks.monitorId, monitorId),
      orderBy: [desc(checks.checkedAt)],
      limit: 20,
    }),
    db.query.incidents.findMany({
      where: and(
        eq(incidents.monitorId, monitorId),
        eq(incidents.state, "ongoing"),
      ),
      orderBy: [desc(incidents.startedAt)],
    }),
  ]);

  return c.json({
    ...monitor,
    recentChecks,
    activeIncidents,
  });
});

// ── PUT /monitors/:id — Update a monitor ──
app.put("/:id", async (c) => {
  const db = c.get("db");
  const userId = c.get("userId");
  const monitorId = c.req.param("id");

  const body = await c.req.json().catch(() => null);
  if (!body) {
    return c.json({ error: "Invalid JSON body", code: "INVALID_BODY" }, 400);
  }

  const parsed = UpdateMonitorSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      { error: "Validation failed", code: "VALIDATION_ERROR", details: parsed.error.flatten() },
      400,
    );
  }

  // Verify ownership
  const existing = await db.query.monitors.findFirst({
    where: and(eq(monitors.id, monitorId), eq(monitors.userId, userId)),
  });
  if (!existing) {
    return c.json({ error: "Monitor not found", code: "NOT_FOUND" }, 404);
  }

  const [updated] = await db
    .update(monitors)
    .set({
      ...parsed.data,
      updatedAt: new Date(),
    })
    .where(eq(monitors.id, monitorId))
    .returning();

  return c.json(updated);
});

// ── DELETE /monitors/:id — Delete a monitor ──
app.delete("/:id", async (c) => {
  const db = c.get("db");
  const userId = c.get("userId");
  const monitorId = c.req.param("id");

  // Verify ownership
  const existing = await db.query.monitors.findFirst({
    where: and(eq(monitors.id, monitorId), eq(monitors.userId, userId)),
  });
  if (!existing) {
    return c.json({ error: "Monitor not found", code: "NOT_FOUND" }, 404);
  }

  await db.delete(monitors).where(eq(monitors.id, monitorId));

  return c.json({ success: true });
});

export { app as monitorsRoute };
