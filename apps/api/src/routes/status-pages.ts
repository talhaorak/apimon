// ============================================================
// apimon API — Status Page Routes
// ============================================================

import { Hono } from "hono";
import { eq, and, desc, inArray } from "drizzle-orm";
import { statusPages, monitors, checks, incidents } from "@apimon/db";
import {
  CreateStatusPageSchema,
  UpdateStatusPageSchema,
  PLAN_STATUS_PAGE_LIMITS,
} from "@apimon/shared";
import type { AppEnv } from "../lib/types.js";
import { authMiddleware, dbMiddleware } from "../middleware/auth.js";

const app = new Hono<AppEnv>();

// ── GET /status/:slug — Public status page (no auth) ──
app.get("/public/:slug", dbMiddleware, async (c) => {
  const db = c.get("db");
  const slug = c.req.param("slug");

  const statusPage = await db.query.statusPages.findFirst({
    where: and(eq(statusPages.slug, slug), eq(statusPages.isPublic, true)),
  });

  if (!statusPage) {
    return c.json({ error: "Status page not found", code: "NOT_FOUND" }, 404);
  }

  // Fetch monitors for this status page
  const monitorIds = statusPage.monitorIds;
  if (!monitorIds || monitorIds.length === 0) {
    return c.json({
      ...statusPage,
      monitors: [],
    });
  }

  const pageMonitors = await db.query.monitors.findMany({
    where: inArray(monitors.id, monitorIds),
  });

  // Get last check and active incidents for each monitor
  const monitorsWithStatus = await Promise.all(
    pageMonitors.map(async (monitor) => {
      const [lastCheck, activeIncidents] = await Promise.all([
        db.query.checks.findFirst({
          where: eq(checks.monitorId, monitor.id),
          orderBy: [desc(checks.checkedAt)],
        }),
        db.query.incidents.findMany({
          where: and(
            eq(incidents.monitorId, monitor.id),
            eq(incidents.state, "ongoing"),
          ),
        }),
      ]);

      return {
        id: monitor.id,
        name: monitor.name,
        url: monitor.url,
        isActive: monitor.isActive,
        lastCheck: lastCheck ?? null,
        hasActiveIncident: activeIncidents.length > 0,
      };
    }),
  );

  return c.json({
    ...statusPage,
    monitors: monitorsWithStatus,
  });
});

// ── Protected routes below ──
app.use("*", authMiddleware);

// ── POST /status-pages — Create a status page ──
app.post("/", async (c) => {
  const db = c.get("db");
  const userId = c.get("userId");

  const body = await c.req.json().catch(() => null);
  if (!body) {
    return c.json({ error: "Invalid JSON body", code: "INVALID_BODY" }, 400);
  }

  const parsed = CreateStatusPageSchema.safeParse(body);
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

  const existingPages = await db.query.statusPages.findMany({
    where: eq(statusPages.userId, userId),
  });

  const limit = PLAN_STATUS_PAGE_LIMITS[user.plan] ?? 1;
  if (existingPages.length >= limit) {
    return c.json(
      { error: `Status page limit reached (${limit}). Upgrade your plan.`, code: "PLAN_LIMIT_REACHED" },
      403,
    );
  }

  // Verify that all monitorIds belong to the user
  if (parsed.data.monitorIds.length > 0) {
    const userMonitors = await db.query.monitors.findMany({
      where: and(
        eq(monitors.userId, userId),
        inArray(monitors.id, parsed.data.monitorIds),
      ),
    });
    if (userMonitors.length !== parsed.data.monitorIds.length) {
      return c.json(
        { error: "One or more monitor IDs are invalid", code: "INVALID_MONITOR_IDS" },
        400,
      );
    }
  }

  // Check slug uniqueness
  const existingSlug = await db.query.statusPages.findFirst({
    where: eq(statusPages.slug, parsed.data.slug),
  });
  if (existingSlug) {
    return c.json({ error: "Slug already taken", code: "SLUG_TAKEN" }, 409);
  }

  const [page] = await db
    .insert(statusPages)
    .values({
      userId,
      slug: parsed.data.slug,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      monitorIds: parsed.data.monitorIds,
      isPublic: parsed.data.isPublic,
    })
    .returning();

  return c.json(page, 201);
});

// ── GET /status-pages — List user's status pages ──
app.get("/", async (c) => {
  const db = c.get("db");
  const userId = c.get("userId");

  const pages = await db.query.statusPages.findMany({
    where: eq(statusPages.userId, userId),
    orderBy: [desc(statusPages.createdAt)],
  });

  return c.json(pages);
});

// ── PUT /status-pages/:id — Update a status page ──
app.put("/:id", async (c) => {
  const db = c.get("db");
  const userId = c.get("userId");
  const pageId = c.req.param("id");

  const body = await c.req.json().catch(() => null);
  if (!body) {
    return c.json({ error: "Invalid JSON body", code: "INVALID_BODY" }, 400);
  }

  const parsed = UpdateStatusPageSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      { error: "Validation failed", code: "VALIDATION_ERROR", details: parsed.error.flatten() },
      400,
    );
  }

  const existing = await db.query.statusPages.findFirst({
    where: and(eq(statusPages.id, pageId), eq(statusPages.userId, userId)),
  });
  if (!existing) {
    return c.json({ error: "Status page not found", code: "NOT_FOUND" }, 404);
  }

  // If slug is being changed, check uniqueness
  if (parsed.data.slug && parsed.data.slug !== existing.slug) {
    const slugTaken = await db.query.statusPages.findFirst({
      where: eq(statusPages.slug, parsed.data.slug),
    });
    if (slugTaken) {
      return c.json({ error: "Slug already taken", code: "SLUG_TAKEN" }, 409);
    }
  }

  // If monitorIds changed, verify ownership
  if (parsed.data.monitorIds && parsed.data.monitorIds.length > 0) {
    const userMonitors = await db.query.monitors.findMany({
      where: and(
        eq(monitors.userId, userId),
        inArray(monitors.id, parsed.data.monitorIds),
      ),
    });
    if (userMonitors.length !== parsed.data.monitorIds.length) {
      return c.json(
        { error: "One or more monitor IDs are invalid", code: "INVALID_MONITOR_IDS" },
        400,
      );
    }
  }

  const [updated] = await db
    .update(statusPages)
    .set({
      ...parsed.data,
      updatedAt: new Date(),
    })
    .where(eq(statusPages.id, pageId))
    .returning();

  return c.json(updated);
});

// ── DELETE /status-pages/:id — Delete a status page ──
app.delete("/:id", async (c) => {
  const db = c.get("db");
  const userId = c.get("userId");
  const pageId = c.req.param("id");

  const existing = await db.query.statusPages.findFirst({
    where: and(eq(statusPages.id, pageId), eq(statusPages.userId, userId)),
  });
  if (!existing) {
    return c.json({ error: "Status page not found", code: "NOT_FOUND" }, 404);
  }

  await db.delete(statusPages).where(eq(statusPages.id, pageId));

  return c.json({ success: true });
});

export { app as statusPagesRoute };
