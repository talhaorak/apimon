// ============================================================
// apimon API — Check Routes
// ============================================================

import { Hono } from "hono";
import { eq, and, desc, gte, lte, sql } from "drizzle-orm";
import { monitors, checks } from "@apimon/db";
import { CheckFilterSchema } from "@apimon/shared";
import type { AppEnv } from "../lib/types.js";
import { authMiddleware } from "../middleware/auth.js";

const app = new Hono<AppEnv>();

app.use("*", authMiddleware);

// ── GET /monitors/:monitorId/checks — Paginated check results ──
app.get("/:monitorId/checks", async (c) => {
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

  // Parse filters
  const query = {
    page: c.req.query("page"),
    pageSize: c.req.query("pageSize"),
    isUp: c.req.query("isUp"),
    from: c.req.query("from"),
    to: c.req.query("to"),
  };

  const parsed = CheckFilterSchema.safeParse(query);
  if (!parsed.success) {
    return c.json(
      { error: "Invalid query parameters", code: "VALIDATION_ERROR", details: parsed.error.flatten() },
      400,
    );
  }

  const { page, pageSize, isUp, from, to } = parsed.data;
  const offset = (page - 1) * pageSize;

  // Build conditions
  const conditions = [eq(checks.monitorId, monitorId)];
  if (isUp !== undefined) {
    conditions.push(eq(checks.isUp, isUp));
  }
  if (from) {
    conditions.push(gte(checks.checkedAt, from));
  }
  if (to) {
    conditions.push(lte(checks.checkedAt, to));
  }

  const whereClause = and(...conditions);

  // Fetch checks + total count
  const [checkResults, countResult] = await Promise.all([
    db.query.checks.findMany({
      where: whereClause,
      orderBy: [desc(checks.checkedAt)],
      limit: pageSize,
      offset,
    }),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(checks)
      .where(whereClause),
  ]);

  const total = countResult[0]?.count ?? 0;

  return c.json({
    checks: checkResults,
    total,
    page,
    pageSize,
  });
});

export { app as checksRoute };
