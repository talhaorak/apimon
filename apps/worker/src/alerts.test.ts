// ============================================================
// apimon Worker — Alert Dispatcher Tests
// ============================================================

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Monitor } from "@apimon/shared";

// ── Mock DB ──

const mockFindMany = vi.fn();
const mockInsertValues = vi.fn().mockResolvedValue(undefined);
const mockInsert = vi.fn().mockReturnValue({
  values: mockInsertValues,
});

function createMockDb() {
  return {
    query: {
      alertChannels: {
        findMany: mockFindMany,
      },
    },
    insert: mockInsert,
  } as unknown;
}

import { dispatchAlerts, dispatchRecoveryAlerts } from "./alerts.js";

// ── Test data ──

const testMonitor: Monitor = {
  id: "mon-1",
  userId: "user-123",
  name: "Production API",
  url: "https://api.production.com/health",
  method: "GET",
  headers: null,
  body: null,
  expectedStatus: 200,
  checkIntervalSeconds: 60,
  timeoutMs: 30000,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("Alert Dispatcher", () => {
  let mockDb: ReturnType<typeof createMockDb>;
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDb = createMockDb();
    fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("ok", { status: 200 })
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("dispatchAlerts (down)", () => {
    it("does nothing when no channels are configured", async () => {
      mockFindMany.mockResolvedValue([]);

      await dispatchAlerts(
        mockDb as Parameters<typeof dispatchAlerts>[0],
        testMonitor,
        "incident-1",
        "Connection refused"
      );

      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it("sends Telegram alert", async () => {
      process.env["TELEGRAM_BOT_TOKEN"] = "test-bot-token";
      mockFindMany.mockResolvedValue([
        { id: "ch-1", type: "telegram", config: { chatId: "123456789" } },
      ]);

      await dispatchAlerts(
        mockDb as Parameters<typeof dispatchAlerts>[0],
        testMonitor,
        "incident-1",
        "Connection refused"
      );

      expect(fetchSpy).toHaveBeenCalledWith(
        "https://api.telegram.org/bottest-bot-token/sendMessage",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
        })
      );

      // Verify message content
      const callBody = JSON.parse(fetchSpy.mock.calls[0]![1]!.body as string);
      expect(callBody.chat_id).toBe("123456789");
      expect(callBody.text).toContain("Monitor DOWN");
      expect(callBody.text).toContain("Production API");
      expect(callBody.text).toContain("Connection refused");
      expect(callBody.parse_mode).toBe("HTML");

      delete process.env["TELEGRAM_BOT_TOKEN"];
    });

    it("sends Slack alert with blocks format", async () => {
      mockFindMany.mockResolvedValue([
        {
          id: "ch-2",
          type: "slack",
          config: { webhookUrl: "https://hooks.slack.com/services/xxx" },
        },
      ]);

      await dispatchAlerts(
        mockDb as Parameters<typeof dispatchAlerts>[0],
        testMonitor,
        "incident-1",
        "Timeout"
      );

      expect(fetchSpy).toHaveBeenCalledWith(
        "https://hooks.slack.com/services/xxx",
        expect.objectContaining({ method: "POST" })
      );

      const callBody = JSON.parse(fetchSpy.mock.calls[0]![1]!.body as string);
      expect(callBody.blocks).toBeDefined();
      expect(callBody.blocks[0].text.text).toContain("Monitor Down");
    });

    it("sends Discord alert with embed", async () => {
      mockFindMany.mockResolvedValue([
        {
          id: "ch-3",
          type: "discord",
          config: { webhookUrl: "https://discord.com/api/webhooks/xxx" },
        },
      ]);

      await dispatchAlerts(
        mockDb as Parameters<typeof dispatchAlerts>[0],
        testMonitor,
        "incident-1",
        "500 error"
      );

      expect(fetchSpy).toHaveBeenCalledWith(
        "https://discord.com/api/webhooks/xxx",
        expect.objectContaining({ method: "POST" })
      );

      const callBody = JSON.parse(fetchSpy.mock.calls[0]![1]!.body as string);
      expect(callBody.embeds).toHaveLength(1);
      expect(callBody.embeds[0].title).toContain("Monitor Down");
      expect(callBody.embeds[0].color).toBe(0xdc2626); // Red
    });

    it("sends Email alert via Resend", async () => {
      process.env["RESEND_API_KEY"] = "re_test_123";
      mockFindMany.mockResolvedValue([
        {
          id: "ch-4",
          type: "email",
          config: { email: "admin@example.com" },
        },
      ]);

      await dispatchAlerts(
        mockDb as Parameters<typeof dispatchAlerts>[0],
        testMonitor,
        "incident-1",
        "DNS failure"
      );

      expect(fetchSpy).toHaveBeenCalledWith(
        "https://api.resend.com/emails",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer re_test_123",
          }),
        })
      );

      const callBody = JSON.parse(fetchSpy.mock.calls[0]![1]!.body as string);
      expect(callBody.to).toEqual(["admin@example.com"]);
      expect(callBody.subject).toContain("DOWN");
      expect(callBody.subject).toContain("Production API");

      delete process.env["RESEND_API_KEY"];
    });

    it("sends Webhook alert with JSON payload", async () => {
      mockFindMany.mockResolvedValue([
        {
          id: "ch-5",
          type: "webhook",
          config: { url: "https://my-service.com/webhook" },
        },
      ]);

      await dispatchAlerts(
        mockDb as Parameters<typeof dispatchAlerts>[0],
        testMonitor,
        "incident-1",
        "Server error"
      );

      expect(fetchSpy).toHaveBeenCalledWith(
        "https://my-service.com/webhook",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "User-Agent": "apimon-webhook/1.0",
          }),
        })
      );

      const callBody = JSON.parse(fetchSpy.mock.calls[0]![1]!.body as string);
      expect(callBody.type).toBe("down");
      expect(callBody.monitor.id).toBe("mon-1");
      expect(callBody.monitor.name).toBe("Production API");
      expect(callBody.incidentId).toBe("incident-1");
    });

    it("logs alert to history even on failure", async () => {
      fetchSpy.mockRejectedValue(new Error("Network error"));
      mockFindMany.mockResolvedValue([
        {
          id: "ch-5",
          type: "webhook",
          config: { url: "https://my-service.com/webhook" },
        },
      ]);

      await dispatchAlerts(
        mockDb as Parameters<typeof dispatchAlerts>[0],
        testMonitor,
        "incident-1",
        "Error"
      );

      // Alert history should still be recorded
      expect(mockInsert).toHaveBeenCalled();
    });

    it("sends to multiple channels", async () => {
      process.env["TELEGRAM_BOT_TOKEN"] = "test-bot-token";
      mockFindMany.mockResolvedValue([
        { id: "ch-1", type: "telegram", config: { chatId: "123" } },
        {
          id: "ch-2",
          type: "slack",
          config: { webhookUrl: "https://hooks.slack.com/xxx" },
        },
        {
          id: "ch-5",
          type: "webhook",
          config: { url: "https://my-service.com/webhook" },
        },
      ]);

      await dispatchAlerts(
        mockDb as Parameters<typeof dispatchAlerts>[0],
        testMonitor,
        "incident-1",
        "Multiple channel test"
      );

      // Should have called fetch 3 times (one per channel)
      expect(fetchSpy).toHaveBeenCalledTimes(3);
      // Should have logged 3 alert history entries
      expect(mockInsert).toHaveBeenCalledTimes(3);

      delete process.env["TELEGRAM_BOT_TOKEN"];
    });
  });

  describe("dispatchRecoveryAlerts", () => {
    it("sends recovery alerts to all channels", async () => {
      process.env["TELEGRAM_BOT_TOKEN"] = "test-bot-token";
      mockFindMany.mockResolvedValue([
        { id: "ch-1", type: "telegram", config: { chatId: "123" } },
      ]);

      await dispatchRecoveryAlerts(
        mockDb as Parameters<typeof dispatchRecoveryAlerts>[0],
        testMonitor,
        "incident-1"
      );

      expect(fetchSpy).toHaveBeenCalled();

      const callBody = JSON.parse(fetchSpy.mock.calls[0]![1]!.body as string);
      expect(callBody.text).toContain("RECOVERED");
      expect(callBody.text).toContain("Production API");
      expect(callBody.text).toContain("responding normally");

      delete process.env["TELEGRAM_BOT_TOKEN"];
    });

    it("does nothing when no channels configured", async () => {
      mockFindMany.mockResolvedValue([]);

      await dispatchRecoveryAlerts(
        mockDb as Parameters<typeof dispatchRecoveryAlerts>[0],
        testMonitor,
        "incident-1"
      );

      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it("sends Discord recovery embed with green color", async () => {
      mockFindMany.mockResolvedValue([
        {
          id: "ch-3",
          type: "discord",
          config: { webhookUrl: "https://discord.com/api/webhooks/xxx" },
        },
      ]);

      await dispatchRecoveryAlerts(
        mockDb as Parameters<typeof dispatchRecoveryAlerts>[0],
        testMonitor,
        "incident-1"
      );

      const callBody = JSON.parse(fetchSpy.mock.calls[0]![1]!.body as string);
      expect(callBody.embeds[0].color).toBe(0x16a34a); // Green
      expect(callBody.embeds[0].title).toContain("Recovered");
    });
  });
});
