// ============================================================
// apimon API — Monitor Stats Routes
// ============================================================

import { Hono } from "hono";
import { eq, and, gte, sql } from "drizzle-orm";
import { monitors, checks, incidents } from "@apimon/db";
import type { AppEnv } from "../lib/types.js";
import { authMiddleware } from "../middleware/auth.js";

const app = new Hono<AppEnv>();

app.use("*", authMiddleware);

// Time period definitions (in hours)
const PERIODS = [
  { label: "24h", hours: 24 },
  { label: "7d", hours: 24 * 7 },
  { label: "30d", hours: 24 * 30 },
] as const;

// ── GET /monitors/:monitorId/stats — Uptime & response stats ──
app.get("/:monitorId/stats", async (c) => {
  const db = c.get("db");
  const userId = c.get("userId");
  const monitorId = c.req.param("monitorId");

  // Verify ownership
  const monitor = await db.query.monitors.findFirst({
    where: and(eq(monitors.id, monitorId), eq(monitors.userId, userId)),
  });
  if (!monitor) {
    return c.json({ error: "Monitor not found", code: "NOT_FOUND" }, 404);
  }

  // Calculate stats for each time period
  const periods = await Promise.all(
    PERIODS.map(async ({ label, hours }) => {
      const since = new Date(Date.now() - hours * 60 * 60 * 1000);

      const [statsResult, incidentCount] = await Promise.all([
        db
          .select({
            totalChecks: sql<number>`count(*)::int`,
            upChecks: sql<number>`count(*) filter (where ${checks.isUp} = true)::int`,
            avgResponseTime: sql<number>`coalesce(avg(${checks.responseTimeMs})::int, 0)`,
          })
          .from(checks)
          .where(
            and(
              eq(checks.monitorId, monitorId),
              gte(checks.checkedAt, since),
            ),
          ),
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(incidents)
          .where(
            and(
              eq(incidents.monitorId, monitorId),
              gte(incidents.startedAt, since),
            ),
          ),
      ]);

      const stats = statsResult[0];
      const total = stats?.totalChecks ?? 0;
      const up = stats?.upChecks ?? 0;
      const uptimePercentage = total > 0 ? Number(((up / total) * 100).toFixed(2)) : 100;

      return {
        label,
        uptimePercentage,
        avgResponseTimeMs: stats?.avgResponseTime ?? 0,
        totalChecks: total,
        totalIncidents: incidentCount[0]?.count ?? 0,
      };
    }),
  );

  return c.json({
    monitorId,
    monitorName: monitor.name,
    periods,
  });
});

export { app as statsRoute };
