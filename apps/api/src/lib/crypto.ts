// ============================================================
// apimon API — Crypto Utilities for API Keys
// ============================================================

import { createHash, randomBytes } from "node:crypto";

/** Prefix for all API keys */
const API_KEY_PREFIX = "apimon_";

/**
 * Hash an API key using SHA-256.
 * Only the hash is stored in the database.
 */
export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

/**
 * Generate a new API key with the apimon_ prefix.
 * Returns the full key (only shown once to the user).
 */
export function generateApiKey(): string {
  return `${API_KEY_PREFIX}${randomBytes(32).toString("hex")}`;
}

/**
 * Extract the prefix (first 12 chars) from an API key for display.
 */
export function getKeyPrefix(key: string): string {
  return key.slice(0, 12) + "...";
}
