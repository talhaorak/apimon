// ============================================================
// apimon API — Auth Middleware Tests
// ============================================================

import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";

// Mock dependencies before importing the middleware
vi.mock("../lib/db.js", () => ({
  getDb: vi.fn(),
}));

vi.mock("../lib/crypto.js", () => ({
  hashApiKey: vi.fn((key: string) => `hashed_${key}`),
}));

import { authMiddleware, dbMiddleware } from "./auth.js";
import { getDb } from "../lib/db.js";
import type { AppEnv } from "../lib/types.js";

// ── Test helpers ──

function createTestApp() {
  const app = new Hono<AppEnv>();
  app.use("*", authMiddleware);
  app.get("/test", (c) => {
    return c.json({ userId: c.get("userId") });
  });
  return app;
}

function createMockDb(apiKeyResult: unknown = null) {
  const whereResult = {
    then: vi.fn((cb: () => void) => {
      cb?.();
      return { catch: vi.fn() };
    }),
    catch: vi.fn(),
  };
  return {
    query: {
      apiKeys: {
        findFirst: vi.fn().mockResolvedValue(apiKeyResult),
      },
      users: {
        findFirst: vi.fn(),
      },
    },
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => whereResult),
      })),
    })),
  } as unknown;
}

describe("authMiddleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("API Key Authentication", () => {
    it("authenticates with a valid API key", async () => {
      const mockDb = createMockDb({
        id: "key-1",
        userId: "user-123",
        keyHash: "hashed_apimon_testkey123",
      });
      vi.mocked(getDb).mockReturnValue(mockDb as ReturnType<typeof getDb>);

      const app = createTestApp();
      const res = await app.request("/test", {
        headers: { "X-API-Key": "apimon_testkey123" },
      });

      expect(res.status).toBe(200);
      const body = (await res.json()) as Record<string, unknown>;
      expect(body).toEqual({ userId: "user-123" });
    });

    it("rejects invalid API key", async () => {
      const mockDb = createMockDb(null); // No key found
      vi.mocked(getDb).mockReturnValue(mockDb as ReturnType<typeof getDb>);

      const app = createTestApp();
      const res = await app.request("/test", {
        headers: { "X-API-Key": "apimon_invalidkey" },
      });

      expect(res.status).toBe(401);
      const body = (await res.json()) as Record<string, unknown>;
      expect(body.code).toBe("INVALID_API_KEY");
    });
  });

  describe("Bearer Token Authentication", () => {
    it("returns 501 for Bearer token (not yet implemented)", async () => {
      const mockDb = createMockDb();
      vi.mocked(getDb).mockReturnValue(mockDb as ReturnType<typeof getDb>);

      const app = createTestApp();
      const res = await app.request("/test", {
        headers: { Authorization: "Bearer some-session-token" },
      });

      expect(res.status).toBe(501);
      const body = (await res.json()) as Record<string, unknown>;
      expect(body.code).toBe("NOT_IMPLEMENTED");
    });
  });

  describe("Missing Authentication", () => {
    it("returns 401 when no auth headers provided", async () => {
      const mockDb = createMockDb();
      vi.mocked(getDb).mockReturnValue(mockDb as ReturnType<typeof getDb>);

      const app = createTestApp();
      const res = await app.request("/test");

      expect(res.status).toBe(401);
      const body = (await res.json()) as Record<string, unknown>;
      expect(body.code).toBe("UNAUTHORIZED");
      expect(body.error).toContain("Authentication required");
    });
  });
});

describe("dbMiddleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sets db in context without requiring auth", async () => {
    const mockDb = createMockDb();
    vi.mocked(getDb).mockReturnValue(mockDb as ReturnType<typeof getDb>);

    const app = new Hono<AppEnv>();
    app.use("*", dbMiddleware);
    app.get("/public", (c) => {
      const db = c.get("db");
      return c.json({ hasDb: !!db });
    });

    const res = await app.request("/public");
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body).toEqual({ hasDb: true });
  });
});
