// ============================================================
// apimon — Database Client & Schema Export
// ============================================================

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

export * from "./schema.js";
export { schema };

/**
 * Create a database connection and return a Drizzle client.
 * Uses DATABASE_URL environment variable by default.
 */
export function createDb(url?: string) {
  const connectionString = url ?? process.env["DATABASE_URL"];
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. Provide a connection string.");
  }

  const client = postgres(connectionString, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  return drizzle(client, { schema });
}

/** Type of the Drizzle database client */
export type Database = ReturnType<typeof createDb>;
