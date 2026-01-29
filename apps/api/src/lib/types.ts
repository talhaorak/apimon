// ============================================================
// apimon API — Shared Hono Environment Types
// ============================================================

import type { Database } from "@apimon/db";

export type AppEnv = {
  Variables: {
    userId: string;
    db: Database;
  };
};
