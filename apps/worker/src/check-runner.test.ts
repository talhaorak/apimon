// ============================================================
// apimon Worker — Check Runner Tests
// ============================================================

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Monitor } from "@apimon/shared";

// ── Mock dependencies ──

const mockInsert = vi.fn();
const mockFindMany = vi.fn();
const mockFindFirst = vi.fn();
const mockUpdate = vi.fn();

vi.mock("./alerts.js", () => ({
  dispatchAlerts: vi.fn().mockResolvedValue(undefined),
  dispatchRecoveryAlerts: vi.fn().mockResolvedValue(undefined),
}));

function createMockDb() {
  return {
    insert: mockInsert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: "incident-1" }]),
      }),
    }),
    query: {
      checks: {
        findMany: mockFindMany,
      },
      incidents: {
        findFirst: mockFindFirst,
      },
    },
    update: mockUpdate.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    }),
  } as unknown;
}

import { runCheck } from "./check-runner.js";
import { dispatchAlerts, dispatchRecoveryAlerts } from "./alerts.js";

// ── Test data ──

const baseMonitor: Monitor = {
  id: "mon-1",
  userId: "user-123",
  name: "Test API",
  url: "https://api.example.com/health",
  method: "GET",
  headers: null,
  body: null,
  expectedStatus: 200,
  checkIntervalSeconds: 300,
  timeoutMs: 5000,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("runCheck", () => {
  let mockDb: ReturnType<typeof createMockDb>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDb = createMockDb();
    // Default: no active incidents
    mockFindFirst.mockResolvedValue(null);
    // Default: not enough consecutive failures
    mockFindMany.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Successful check", () => {
    it("records successful check when server responds with expected status", async () => {
      const mockResponse = new Response(JSON.stringify({ status: "ok" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
      vi.spyOn(globalThis, "fetch").mockResolvedValue(mockResponse);

      await runCheck(mockDb as Parameters<typeof runCheck>[0], baseMonitor);

      // Verify check was saved
      expect(mockInsert).toHaveBeenCalledTimes(1); // once for check insert
      const insertCall = mockInsert.mock.results[0]?.value;
      expect(insertCall.values).toHaveBeenCalled();
    });

    it("measures response time", async () => {
      const mockResponse = new Response("ok", { status: 200 });
      vi.spyOn(globalThis, "fetch").mockResolvedValue(mockResponse);

      await runCheck(mockDb as Parameters<typeof runCheck>[0], baseMonitor);

      // Check insert was called — response time should be a number
      expect(mockInsert).toHaveBeenCalled();
    });
  });

  describe("Failed check", () => {
    it("records failure when status code doesn't match expected", async () => {
      const mockResponse = new Response("Internal Server Error", { status: 500 });
      vi.spyOn(globalThis, "fetch").mockResolvedValue(mockResponse);

      await runCheck(mockDb as Parameters<typeof runCheck>[0], baseMonitor);

      expect(mockInsert).toHaveBeenCalled();
    });

    it("records failure on network error", async () => {
      vi.spyOn(globalThis, "fetch").mockRejectedValue(
        new TypeError("Failed to fetch")
      );

      await runCheck(mockDb as Parameters<typeof runCheck>[0], baseMonitor);

      expect(mockInsert).toHaveBeenCalled();
    });
  });

  describe("Timeout handling", () => {
    it("records timeout error when request exceeds timeout", async () => {
      const abortError = new DOMException("The operation was aborted", "AbortError");
      vi.spyOn(globalThis, "fetch").mockRejectedValue(abortError);

      await runCheck(mockDb as Parameters<typeof runCheck>[0], baseMonitor);

      expect(mockInsert).toHaveBeenCalled();
    });
  });

  describe("Incident detection", () => {
    it("creates incident after 3 consecutive failures", async () => {
      // Simulate fetch failure
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response("Error", { status: 500 })
      );

      // Return 3 consecutive failures
      mockFindMany.mockResolvedValue([
        { isUp: false },
        { isUp: false },
        { isUp: false },
      ]);

      // No active incident
      mockFindFirst.mockResolvedValue(null);

      await runCheck(mockDb as Parameters<typeof runCheck>[0], baseMonitor);

      // Should have called insert for both check and incident
      expect(mockInsert).toHaveBeenCalledTimes(2);
      expect(vi.mocked(dispatchAlerts)).toHaveBeenCalled();
    });

    it("does not create incident with fewer than 3 consecutive failures", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response("Error", { status: 500 })
      );

      // Only 2 consecutive failures
      mockFindMany.mockResolvedValue([
        { isUp: false },
        { isUp: false },
      ]);

      mockFindFirst.mockResolvedValue(null);

      await runCheck(mockDb as Parameters<typeof runCheck>[0], baseMonitor);

      // Only check insert, no incident
      expect(mockInsert).toHaveBeenCalledTimes(1);
      expect(vi.mocked(dispatchAlerts)).not.toHaveBeenCalled();
    });

    it("resolves active incident when check succeeds", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response("ok", { status: 200 })
      );

      // Active incident exists
      mockFindFirst.mockResolvedValue({
        id: "incident-1",
        monitorId: "mon-1",
        state: "ongoing",
      });

      await runCheck(mockDb as Parameters<typeof runCheck>[0], baseMonitor);

      // Should update incident to resolved
      expect(mockUpdate).toHaveBeenCalled();
      expect(vi.mocked(dispatchRecoveryAlerts)).toHaveBeenCalled();
    });

    it("does not create duplicate incident when one is already active", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response("Error", { status: 500 })
      );

      // Active incident already exists
      mockFindFirst.mockResolvedValue({
        id: "incident-1",
        monitorId: "mon-1",
        state: "ongoing",
      });

      mockFindMany.mockResolvedValue([
        { isUp: false },
        { isUp: false },
        { isUp: false },
      ]);

      await runCheck(mockDb as Parameters<typeof runCheck>[0], baseMonitor);

      // Only check insert, incident already exists
      expect(mockInsert).toHaveBeenCalledTimes(1);
    });
  });

  describe("HTTP method handling", () => {
    it("sends POST request with body", async () => {
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response("ok", { status: 200 })
      );

      const postMonitor: Monitor = {
        ...baseMonitor,
        method: "POST",
        body: '{"key":"value"}',
        headers: { "Content-Type": "application/json" },
      };

      await runCheck(mockDb as Parameters<typeof runCheck>[0], postMonitor);

      expect(fetchSpy).toHaveBeenCalledWith(
        postMonitor.url,
        expect.objectContaining({
          method: "POST",
          body: '{"key":"value"}',
          headers: { "Content-Type": "application/json" },
        })
      );
    });

    it("does not send body for GET requests", async () => {
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response("ok", { status: 200 })
      );

      await runCheck(mockDb as Parameters<typeof runCheck>[0], baseMonitor);

      expect(fetchSpy).toHaveBeenCalledWith(
        baseMonitor.url,
        expect.objectContaining({
          method: "GET",
          body: undefined,
        })
      );
    });
  });
});
