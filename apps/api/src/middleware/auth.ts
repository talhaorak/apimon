// ============================================================
// apimon API — Authentication Middleware
// ============================================================

import { createMiddleware } from "hono/factory";
import { eq } from "drizzle-orm";
import { apiKeys } from "@apimon/db";
import type { AppEnv } from "../lib/types.js";
import { getDb } from "../lib/db.js";
import { hashApiKey } from "../lib/crypto.js";

/**
 * Authentication middleware.
 *
 * Supports two auth methods:
 * 1. API Key: `X-API-Key` header — hash the key and look up in api_keys table
 * 2. Session: `Authorization: Bearer <token>` header — validate via Better-Auth (TODO)
 *
 * On success, sets `userId` and `db` in the Hono context.
 * On failure, returns 401 JSON error.
 */
export const authMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const db = getDb();
  c.set("db", db);

  // ── Method 1: API Key Auth ──
  const apiKeyHeader = c.req.header("X-API-Key");
  if (apiKeyHeader) {
    const keyHash = hashApiKey(apiKeyHeader);
    const keyRecord = await db.query.apiKeys.findFirst({
      where: eq(apiKeys.keyHash, keyHash),
    });

    if (!keyRecord) {
      return c.json({ error: "Invalid API key", code: "INVALID_API_KEY" }, 401);
    }

    // Update last used timestamp (fire-and-forget)
    db.update(apiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKeys.id, keyRecord.id))
      .then(() => {})
      .catch(() => {});

    c.set("userId", keyRecord.userId);
    return next();
  }

  // ── Method 2: Session/Bearer Auth ──
  const authHeader = c.req.header("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    // TODO(@backend): Integrate Better-Auth session validation
    // const token = authHeader.slice(7);
    // const session = await betterAuth.validateSession(token);
    // if (session) { c.set("userId", session.userId); return next(); }
    return c.json(
      { error: "Session auth not yet implemented", code: "NOT_IMPLEMENTED" },
      501,
    );
  }

  return c.json(
    { error: "Authentication required. Provide X-API-Key header or Bearer token.", code: "UNAUTHORIZED" },
    401,
  );
});

/**
 * Database-only middleware for public routes.
 * Sets `db` in context without requiring authentication.
 */
export const dbMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const db = getDb();
  c.set("db", db);
  return next();
});
