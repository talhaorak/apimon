// ============================================================
// apimon API — Stats Routes Tests
// ============================================================

import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";

// ── Mock dependencies ──

const mockMonitorFindFirst = vi.fn();
const mockSelect = vi.fn();

vi.mock("../lib/db.js", () => ({
  getDb: vi.fn(() => createMockDb()),
}));

vi.mock("../lib/crypto.js", () => ({
  hashApiKey: vi.fn((key: string) => `hashed_${key}`),
}));

function createMockDb() {
  const authUpdateWhereResult = {
    then: vi.fn((cb: () => void) => {
      cb?.();
      return { catch: vi.fn() };
    }),
    catch: vi.fn(),
  };

  return {
    query: {
      apiKeys: {
        findFirst: vi.fn().mockResolvedValue({
          id: "key-1",
          userId: "user-123",
          keyHash: "hashed_test-api-key",
        }),
      },
      monitors: {
        findFirst: mockMonitorFindFirst,
      },
    },
    select: mockSelect,
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => authUpdateWhereResult),
      })),
    })),
  };
}

import { statsRoute } from "./stats.js";

const AUTH_HEADER = { "X-API-Key": "test-api-key" };

function createApp() {
  const app = new Hono();
  app.route("/monitors", statsRoute);
  return app;
}

describe("Stats Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /monitors/:monitorId/stats", () => {
    it("returns 404 for non-existent monitor", async () => {
      mockMonitorFindFirst.mockResolvedValue(null);

      const app = createApp();
      const res = await app.request("/monitors/non-existent/stats", {
        headers: AUTH_HEADER,
      });

      expect(res.status).toBe(404);
      const body = (await res.json()) as Record<string, unknown>;
      expect(body.code).toBe("NOT_FOUND");
    });

    it("returns stats with period data", async () => {
      mockMonitorFindFirst.mockResolvedValue({
        id: "mon-1",
        userId: "user-123",
        name: "My API",
      });

      // Mock the select().from().where() chain for checks stats & incident count
      mockSelect.mockImplementation(() => ({
        from: () => ({
          where: vi.fn().mockResolvedValue([
            { totalChecks: 100, upChecks: 95, avgResponseTime: 250, count: 2 },
          ]),
        }),
      }));

      const app = createApp();
      const res = await app.request("/monitors/mon-1/stats", {
        headers: AUTH_HEADER,
      });

      expect(res.status).toBe(200);
      const body = (await res.json()) as Record<string, unknown>;
      expect(body.monitorId).toBe("mon-1");
      expect(body.monitorName).toBe("My API");
      const periods = body.periods as Array<{ label: string }>;
      expect(periods).toBeInstanceOf(Array);
      expect(periods).toHaveLength(3);

      // Check period labels
      const labels = periods.map((p) => p.label);
      expect(labels).toEqual(["24h", "7d", "30d"]);
    });

    it("returns 401 without auth", async () => {
      const app = createApp();
      const res = await app.request("/monitors/mon-1/stats");

      expect(res.status).toBe(401);
    });
  });
});
