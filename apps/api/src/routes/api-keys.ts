// ============================================================
// apimon API — API Key Routes
// ============================================================

import { Hono } from "hono";
import { eq, and, desc } from "drizzle-orm";
import { apiKeys } from "@apimon/db";
import { CreateApiKeySchema } from "@apimon/shared";
import type { AppEnv } from "../lib/types.js";
import { authMiddleware } from "../middleware/auth.js";
import { generateApiKey, hashApiKey, getKeyPrefix } from "../lib/crypto.js";

const app = new Hono<AppEnv>();

app.use("*", authMiddleware);

// ── POST /api-keys — Create a new API key ──
app.post("/", async (c) => {
  const db = c.get("db");
  const userId = c.get("userId");

  const body = await c.req.json().catch(() => null);
  if (!body) {
    return c.json({ error: "Invalid JSON body", code: "INVALID_BODY" }, 400);
  }

  const parsed = CreateApiKeySchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      { error: "Validation failed", code: "VALIDATION_ERROR", details: parsed.error.flatten() },
      400,
    );
  }

  // Generate a new API key
  const rawKey = generateApiKey();
  const keyHash = hashApiKey(rawKey);

  const result = await db
    .insert(apiKeys)
    .values({
      userId,
      keyHash,
      name: parsed.data.name,
    })
    .returning();

  const keyRecord = result[0];
  if (!keyRecord) {
    return c.json({ error: "Failed to create API key", code: "INTERNAL_ERROR" }, 500);
  }

  // Return the full key only this once
  return c.json(
    {
      id: keyRecord.id,
      name: keyRecord.name,
      keyPrefix: getKeyPrefix(rawKey),
      key: rawKey,
      lastUsedAt: keyRecord.lastUsedAt,
      createdAt: keyRecord.createdAt,
    },
    201,
  );
});

// ── GET /api-keys — List all API keys for the user ──
app.get("/", async (c) => {
  const db = c.get("db");
  const userId = c.get("userId");

  const keys = await db.query.apiKeys.findMany({
    where: eq(apiKeys.userId, userId),
    orderBy: [desc(apiKeys.createdAt)],
  });

  // Never expose keyHash — return safe info only
  return c.json(
    keys.map((k) => ({
      id: k.id,
      name: k.name,
      keyPrefix: k.keyHash.slice(0, 8) + "...",
      lastUsedAt: k.lastUsedAt,
      createdAt: k.createdAt,
    })),
  );
});

// ── DELETE /api-keys/:id — Revoke an API key ──
app.delete("/:id", async (c) => {
  const db = c.get("db");
  const userId = c.get("userId");
  const keyId = c.req.param("id");

  const existing = await db.query.apiKeys.findFirst({
    where: and(eq(apiKeys.id, keyId), eq(apiKeys.userId, userId)),
  });
  if (!existing) {
    return c.json({ error: "API key not found", code: "NOT_FOUND" }, 404);
  }

  await db.delete(apiKeys).where(eq(apiKeys.id, keyId));

  return c.json({ success: true });
});

export { app as apiKeysRoute };
