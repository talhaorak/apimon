// ============================================================
// apimon API — Monitor Routes Tests
// ============================================================

import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";

// ── Mock dependencies ──

const mockUserFindFirst = vi.fn();
const mockMonitorFindFirst = vi.fn();
const mockMonitorsFindMany = vi.fn();
const mockChecksFindFirst = vi.fn();
const mockChecksFindMany = vi.fn();
const mockIncidentsFindMany = vi.fn();
const mockInsertValues = vi.fn();
const mockUpdateSet = vi.fn();
const mockDeleteWhere = vi.fn();

vi.mock("../lib/db.js", () => ({
  getDb: vi.fn(() => createFullMockDb()),
}));

vi.mock("../lib/crypto.js", () => ({
  hashApiKey: vi.fn((key: string) => `hashed_${key}`),
}));

function createFullMockDb() {
  // Auth middleware fire-and-forget: db.update(apiKeys).set({}).where(eq(...)).then().catch()
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
      users: {
        findFirst: mockUserFindFirst,
      },
      monitors: {
        findFirst: mockMonitorFindFirst,
        findMany: mockMonitorsFindMany,
      },
      checks: {
        findFirst: mockChecksFindFirst.mockResolvedValue(null),
        findMany: mockChecksFindMany.mockResolvedValue([]),
      },
      incidents: {
        findMany: mockIncidentsFindMany.mockResolvedValue([]),
      },
    },
    insert: vi.fn(() => ({
      values: mockInsertValues.mockReturnValue({
        returning: vi.fn().mockResolvedValue([]),
      }),
    })),
    update: vi.fn(() => ({
      set: mockUpdateSet.mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([]),
          // Support auth middleware's thenable chain
          then: vi.fn((cb: () => void) => {
            cb?.();
            return { catch: vi.fn() };
          }),
          catch: vi.fn(),
        }),
      }),
    })),
    delete: vi.fn(() => ({
      where: mockDeleteWhere.mockResolvedValue(undefined),
    })),
  };
}

import { monitorsRoute } from "./monitors.js";

const AUTH_HEADER = { "X-API-Key": "test-api-key" };

function createApp() {
  const app = new Hono();
  app.route("/monitors", monitorsRoute);
  return app;
}

describe("Monitor Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Defaults
    mockUserFindFirst.mockResolvedValue(null);
    mockMonitorFindFirst.mockResolvedValue(null);
    mockMonitorsFindMany.mockResolvedValue([]);
    mockChecksFindFirst.mockResolvedValue(null);
    mockChecksFindMany.mockResolvedValue([]);
    mockIncidentsFindMany.mockResolvedValue([]);
  });

  // ────────────────────────────────────────────
  // POST /monitors — Create
  // ────────────────────────────────────────────

  describe("POST /monitors", () => {
    it("creates a monitor with valid data", async () => {
      // User lookup (for plan check)
      mockUserFindFirst.mockResolvedValueOnce({ id: "user-123", plan: "free" });
      // Existing monitors count
      mockMonitorsFindMany.mockResolvedValueOnce([]);
      // Insert result
      const newMonitor = {
        id: "mon-1",
        userId: "user-123",
        name: "My API",
        url: "https://api.example.com",
        method: "GET",
        expectedStatus: 200,
      };
      mockInsertValues.mockReturnValueOnce({
        returning: vi.fn().mockResolvedValue([newMonitor]),
      });

      const app = createApp();
      const res = await app.request("/monitors", {
        method: "POST",
        headers: { ...AUTH_HEADER, "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "My API",
          url: "https://api.example.com",
        }),
      });

      expect(res.status).toBe(201);
      const body = (await res.json()) as Record<string, unknown>;
      expect(body.name).toBe("My API");
    });

    it("returns 400 for invalid JSON body", async () => {
      const app = createApp();
      const res = await app.request("/monitors", {
        method: "POST",
        headers: { ...AUTH_HEADER, "Content-Type": "application/json" },
        body: "not-json{{{",
      });

      expect(res.status).toBe(400);
      const body = (await res.json()) as Record<string, unknown>;
      expect(body.code).toBe("INVALID_BODY");
    });

    it("returns 400 for validation errors", async () => {
      const app = createApp();
      const res = await app.request("/monitors", {
        method: "POST",
        headers: { ...AUTH_HEADER, "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "",
          url: "not-a-url",
        }),
      });

      expect(res.status).toBe(400);
      const body = (await res.json()) as Record<string, unknown>;
      expect(body.code).toBe("VALIDATION_ERROR");
    });

    it("returns 403 when plan limit reached", async () => {
      mockUserFindFirst.mockResolvedValueOnce({ id: "user-123", plan: "free" });
      mockMonitorsFindMany.mockResolvedValueOnce(
        [1, 2, 3, 4, 5].map((i) => ({ id: `mon-${i}` }))
      );

      const app = createApp();
      const res = await app.request("/monitors", {
        method: "POST",
        headers: { ...AUTH_HEADER, "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "New Monitor",
          url: "https://example.com",
        }),
      });

      expect(res.status).toBe(403);
      const body = (await res.json()) as Record<string, unknown>;
      expect(body.code).toBe("PLAN_LIMIT_REACHED");
    });

    it("returns 401 without auth header", async () => {
      const app = createApp();
      const res = await app.request("/monitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Test",
          url: "https://example.com",
        }),
      });

      expect(res.status).toBe(401);
    });
  });

  // ────────────────────────────────────────────
  // GET /monitors — List
  // ────────────────────────────────────────────

  describe("GET /monitors", () => {
    it("returns list of monitors", async () => {
      mockMonitorsFindMany.mockResolvedValueOnce([
        { id: "mon-1", name: "API 1", url: "https://api1.example.com" },
        { id: "mon-2", name: "API 2", url: "https://api2.example.com" },
      ]);

      const app = createApp();
      const res = await app.request("/monitors", {
        headers: AUTH_HEADER,
      });

      expect(res.status).toBe(200);
      const body = (await res.json()) as unknown[];
      expect(body).toHaveLength(2);
    });

    it("returns empty array when no monitors", async () => {
      mockMonitorsFindMany.mockResolvedValueOnce([]);

      const app = createApp();
      const res = await app.request("/monitors", {
        headers: AUTH_HEADER,
      });

      expect(res.status).toBe(200);
      const body = (await res.json()) as unknown[];
      expect(body).toEqual([]);
    });
  });

  // ────────────────────────────────────────────
  // GET /monitors/:id — Get Single
  // ────────────────────────────────────────────

  describe("GET /monitors/:id", () => {
    it("returns monitor with details", async () => {
      mockMonitorFindFirst.mockResolvedValueOnce({
        id: "mon-1",
        userId: "user-123",
        name: "My API",
        url: "https://api.example.com",
      });

      const app = createApp();
      const res = await app.request("/monitors/mon-1", {
        headers: AUTH_HEADER,
      });

      expect(res.status).toBe(200);
      const body = (await res.json()) as Record<string, unknown>;
      expect(body.name).toBe("My API");
      expect(body).toHaveProperty("recentChecks");
      expect(body).toHaveProperty("activeIncidents");
    });

    it("returns 404 for non-existent monitor", async () => {
      mockMonitorFindFirst.mockResolvedValueOnce(null);

      const app = createApp();
      const res = await app.request("/monitors/non-existent", {
        headers: AUTH_HEADER,
      });

      expect(res.status).toBe(404);
      const body = (await res.json()) as Record<string, unknown>;
      expect(body.code).toBe("NOT_FOUND");
    });
  });

  // ────────────────────────────────────────────
  // PUT /monitors/:id — Update
  // ────────────────────────────────────────────

  describe("PUT /monitors/:id", () => {
    it("updates a monitor successfully", async () => {
      mockMonitorFindFirst.mockResolvedValueOnce({
        id: "mon-1",
        userId: "user-123",
        name: "Old Name",
      });

      const updatedMonitor = {
        id: "mon-1",
        userId: "user-123",
        name: "New Name",
      };
      // First .set() call is from auth middleware (fire-and-forget update lastUsedAt)
      // Second .set() call is from the route handler (actual update)
      mockUpdateSet
        .mockReturnValueOnce({
          where: vi.fn().mockReturnValue({
            then: vi.fn((cb: () => void) => {
              cb?.();
              return { catch: vi.fn() };
            }),
            catch: vi.fn(),
          }),
        })
        .mockReturnValueOnce({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updatedMonitor]),
          }),
        });

      const app = createApp();
      const res = await app.request("/monitors/mon-1", {
        method: "PUT",
        headers: { ...AUTH_HEADER, "Content-Type": "application/json" },
        body: JSON.stringify({ name: "New Name" }),
      });

      expect(res.status).toBe(200);
      const body = (await res.json()) as Record<string, unknown>;
      expect(body.name).toBe("New Name");
    });

    it("returns 404 for non-existent monitor", async () => {
      mockMonitorFindFirst.mockResolvedValueOnce(null);

      const app = createApp();
      const res = await app.request("/monitors/non-existent", {
        method: "PUT",
        headers: { ...AUTH_HEADER, "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Updated" }),
      });

      expect(res.status).toBe(404);
    });

    it("returns 400 for invalid body", async () => {
      const app = createApp();
      const res = await app.request("/monitors/mon-1", {
        method: "PUT",
        headers: { ...AUTH_HEADER, "Content-Type": "application/json" },
        body: "invalid-json{{{",
      });

      expect(res.status).toBe(400);
    });
  });

  // ────────────────────────────────────────────
  // DELETE /monitors/:id — Delete
  // ────────────────────────────────────────────

  describe("DELETE /monitors/:id", () => {
    it("deletes a monitor successfully", async () => {
      mockMonitorFindFirst.mockResolvedValueOnce({
        id: "mon-1",
        userId: "user-123",
      });

      const app = createApp();
      const res = await app.request("/monitors/mon-1", {
        method: "DELETE",
        headers: AUTH_HEADER,
      });

      expect(res.status).toBe(200);
      const body = (await res.json()) as Record<string, unknown>;
      expect(body.success).toBe(true);
    });

    it("returns 404 for non-existent monitor", async () => {
      mockMonitorFindFirst.mockResolvedValueOnce(null);

      const app = createApp();
      const res = await app.request("/monitors/non-existent", {
        method: "DELETE",
        headers: AUTH_HEADER,
      });

      expect(res.status).toBe(404);
    });
  });
});
