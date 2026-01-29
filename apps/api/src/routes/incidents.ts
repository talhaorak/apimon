// ============================================================
// apimon API — Incident Routes
// ============================================================

import { Hono } from "hono";
import { eq, and, desc, sql } from "drizzle-orm";
import { monitors, incidents } from "@apimon/db";
import { PaginationSchema } from "@apimon/shared";
import type { AppEnv } from "../lib/types.js";
import { authMiddleware } from "../middleware/auth.js";

const app = new Hono<AppEnv>();

app.use("*", authMiddleware);

// ── GET /monitors/:monitorId/incidents — List incidents for a monitor ──
app.get("/:monitorId/incidents", async (c) => {
  const db = c.get("db");
  const userId = c.get("userId");
  const monitorId = c.req.param("monitorId");

  // Verify monitor ownership
  const monitor = await db.query.monitors.findFirst({
    where: and(eq(monitors.id, monitorId), eq(monitors.userId, userId)),
  });
  if (!monitor) {
    return c.json({ error: "Monitor not found", code: "NOT_FOUND" }, 404);
  }

  const query = {
    page: c.req.query("page"),
    pageSize: c.req.query("pageSize"),
  };

  const parsed = PaginationSchema.safeParse(query);
  if (!parsed.success) {
    return c.json(
      { error: "Invalid query parameters", code: "VALIDATION_ERROR", details: parsed.error.flatten() },
      400,
    );
  }

  const { page, pageSize } = parsed.data;
  const offset = (page - 1) * pageSize;

  const whereClause = eq(incidents.monitorId, monitorId);

  const [incidentList, countResult] = await Promise.all([
    db.query.incidents.findMany({
      where: whereClause,
      orderBy: [desc(incidents.startedAt)],
      limit: pageSize,
      offset,
    }),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(incidents)
      .where(whereClause),
  ]);

  const total = countResult[0]?.count ?? 0;

  return c.json({
    incidents: incidentList,
    total,
    page,
    pageSize,
  });
});

// ── GET /incidents/:id — Get a single incident ──
app.get("/:id", async (c) => {
  const db = c.get("db");
  const userId = c.get("userId");
  const incidentId = c.req.param("id");

  const incident = await db.query.incidents.findFirst({
    where: eq(incidents.id, incidentId),
    with: {
      monitor: true,
    },
  });

  if (!incident) {
    return c.json({ error: "Incident not found", code: "NOT_FOUND" }, 404);
  }

  // Verify the monitor belongs to the user
  if (incident.monitor.userId !== userId) {
    return c.json({ error: "Incident not found", code: "NOT_FOUND" }, 404);
  }

  return c.json(incident);
});

export { app as incidentsRoute };
