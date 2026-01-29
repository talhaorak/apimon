// ============================================================
// apimon API — Database Singleton
// ============================================================

import { createDb, type Database } from "@apimon/db";

let db: Database | null = null;

/**
 * Get the singleton database instance.
 * Initializes on first call using DATABASE_URL env var.
 */
export function getDb(): Database {
  if (!db) {
    db = createDb();
  }
  return db;
}
