// ============================================================
// apimon — Shared Types & Zod Schemas Tests
// ============================================================

import { describe, it, expect } from "vitest";
import {
  PlanType,
  MonitorMethod,
  CheckInterval,
  AlertType,
  AlertStatus,
  IncidentState,
  CreateMonitorSchema,
  UpdateMonitorSchema,
  CreateAlertChannelSchema,
  CreateStatusPageSchema,
  UpdateStatusPageSchema,
  CreateApiKeySchema,
  PaginationSchema,
  CheckFilterSchema,
} from "./types.js";

// ────────────────────────────────────────────────────────────
// Enum Schemas
// ────────────────────────────────────────────────────────────

describe("PlanType", () => {
  it("accepts valid plan types", () => {
    expect(PlanType.parse("free")).toBe("free");
    expect(PlanType.parse("pro")).toBe("pro");
    expect(PlanType.parse("business")).toBe("business");
  });

  it("rejects invalid plan types", () => {
    expect(() => PlanType.parse("enterprise")).toThrow();
    expect(() => PlanType.parse("")).toThrow();
    expect(() => PlanType.parse(123)).toThrow();
  });
});

describe("MonitorMethod", () => {
  it("accepts all valid HTTP methods", () => {
    const methods = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"] as const;
    for (const method of methods) {
      expect(MonitorMethod.parse(method)).toBe(method);
    }
  });

  it("rejects invalid methods", () => {
    expect(() => MonitorMethod.parse("TRACE")).toThrow();
    expect(() => MonitorMethod.parse("get")).toThrow();
    expect(() => MonitorMethod.parse("")).toThrow();
  });
});

describe("CheckInterval", () => {
  it("accepts valid intervals", () => {
    const validIntervals = [30, 60, 300, 900, 1800, 3600];
    for (const interval of validIntervals) {
      expect(CheckInterval.parse(interval)).toBe(interval);
    }
  });

  it("coerces string values to numbers", () => {
    expect(CheckInterval.parse("300")).toBe(300);
    expect(CheckInterval.parse("60")).toBe(60);
  });

  it("rejects invalid intervals", () => {
    expect(() => CheckInterval.parse(45)).toThrow();
    expect(() => CheckInterval.parse(0)).toThrow();
    expect(() => CheckInterval.parse(120)).toThrow();
  });
});

describe("AlertType", () => {
  it("accepts valid alert types", () => {
    const types = ["telegram", "slack", "discord", "email", "webhook"] as const;
    for (const type of types) {
      expect(AlertType.parse(type)).toBe(type);
    }
  });

  it("rejects invalid alert types", () => {
    expect(() => AlertType.parse("sms")).toThrow();
    expect(() => AlertType.parse("pagerduty")).toThrow();
  });
});

describe("AlertStatus", () => {
  it("accepts valid statuses", () => {
    expect(AlertStatus.parse("pending")).toBe("pending");
    expect(AlertStatus.parse("sent")).toBe("sent");
    expect(AlertStatus.parse("failed")).toBe("failed");
  });

  it("rejects invalid statuses", () => {
    expect(() => AlertStatus.parse("delivered")).toThrow();
    expect(() => AlertStatus.parse("")).toThrow();
  });
});

describe("IncidentState", () => {
  it("accepts valid states", () => {
    expect(IncidentState.parse("ongoing")).toBe("ongoing");
    expect(IncidentState.parse("resolved")).toBe("resolved");
  });

  it("rejects invalid states", () => {
    expect(() => IncidentState.parse("pending")).toThrow();
    expect(() => IncidentState.parse("closed")).toThrow();
  });
});

// ────────────────────────────────────────────────────────────
// CreateMonitorSchema
// ────────────────────────────────────────────────────────────

describe("CreateMonitorSchema", () => {
  const validMonitor = {
    name: "My API",
    url: "https://api.example.com/health",
  };

  it("accepts valid input with only required fields", () => {
    const result = CreateMonitorSchema.parse(validMonitor);
    expect(result.name).toBe("My API");
    expect(result.url).toBe("https://api.example.com/health");
    // Defaults
    expect(result.method).toBe("GET");
    expect(result.expectedStatus).toBe(200);
    expect(result.checkIntervalSeconds).toBe(300);
    expect(result.timeoutMs).toBe(30000);
    expect(result.isActive).toBe(true);
    expect(result.headers).toEqual({});
    expect(result.body).toBeUndefined();
  });

  it("accepts valid input with all fields", () => {
    const result = CreateMonitorSchema.parse({
      name: "POST Endpoint",
      url: "https://api.example.com/submit",
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Custom": "value" },
      body: '{"test": true}',
      expectedStatus: 201,
      checkIntervalSeconds: 60,
      timeoutMs: 5000,
      isActive: false,
    });
    expect(result.method).toBe("POST");
    expect(result.headers).toEqual({ "Content-Type": "application/json", "X-Custom": "value" });
    expect(result.body).toBe('{"test": true}');
    expect(result.expectedStatus).toBe(201);
    expect(result.checkIntervalSeconds).toBe(60);
    expect(result.timeoutMs).toBe(5000);
    expect(result.isActive).toBe(false);
  });

  it("rejects missing name", () => {
    const result = CreateMonitorSchema.safeParse({ url: "https://example.com" });
    expect(result.success).toBe(false);
  });

  it("rejects missing url", () => {
    const result = CreateMonitorSchema.safeParse({ name: "Test" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid URL", () => {
    const result = CreateMonitorSchema.safeParse({
      name: "Test",
      url: "not-a-url",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty name", () => {
    const result = CreateMonitorSchema.safeParse({
      name: "",
      url: "https://example.com",
    });
    expect(result.success).toBe(false);
  });

  it("rejects name longer than 100 chars", () => {
    const result = CreateMonitorSchema.safeParse({
      name: "x".repeat(101),
      url: "https://example.com",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid HTTP method", () => {
    const result = CreateMonitorSchema.safeParse({
      ...validMonitor,
      method: "INVALID",
    });
    expect(result.success).toBe(false);
  });

  it("rejects status code out of range", () => {
    expect(
      CreateMonitorSchema.safeParse({ ...validMonitor, expectedStatus: 99 }).success
    ).toBe(false);
    expect(
      CreateMonitorSchema.safeParse({ ...validMonitor, expectedStatus: 600 }).success
    ).toBe(false);
  });

  it("rejects timeout below 1000ms", () => {
    const result = CreateMonitorSchema.safeParse({
      ...validMonitor,
      timeoutMs: 500,
    });
    expect(result.success).toBe(false);
  });

  it("rejects timeout above 60000ms", () => {
    const result = CreateMonitorSchema.safeParse({
      ...validMonitor,
      timeoutMs: 70000,
    });
    expect(result.success).toBe(false);
  });

  it("rejects check interval below 30s", () => {
    const result = CreateMonitorSchema.safeParse({
      ...validMonitor,
      checkIntervalSeconds: 10,
    });
    expect(result.success).toBe(false);
  });

  it("rejects check interval above 3600s", () => {
    const result = CreateMonitorSchema.safeParse({
      ...validMonitor,
      checkIntervalSeconds: 7200,
    });
    expect(result.success).toBe(false);
  });
});

// ────────────────────────────────────────────────────────────
// UpdateMonitorSchema
// ────────────────────────────────────────────────────────────

describe("UpdateMonitorSchema", () => {
  it("accepts partial updates", () => {
    const result = UpdateMonitorSchema.parse({ name: "Updated Name" });
    expect(result.name).toBe("Updated Name");
  });

  it("accepts empty object (no updates)", () => {
    const result = UpdateMonitorSchema.parse({});
    expect(result).toEqual({});
  });

  it("validates fields when provided", () => {
    const result = UpdateMonitorSchema.safeParse({ url: "not-a-url" });
    expect(result.success).toBe(false);
  });
});

// ────────────────────────────────────────────────────────────
// CreateAlertChannelSchema
// ────────────────────────────────────────────────────────────

describe("CreateAlertChannelSchema", () => {
  it("accepts valid telegram channel", () => {
    const result = CreateAlertChannelSchema.parse({
      type: "telegram",
      config: { chatId: "123456789" },
    });
    expect(result.type).toBe("telegram");
    expect(result.config).toEqual({ chatId: "123456789" });
  });

  it("accepts valid slack channel", () => {
    const result = CreateAlertChannelSchema.parse({
      type: "slack",
      config: { webhookUrl: "https://hooks.slack.com/services/xxx" },
    });
    expect(result.type).toBe("slack");
  });

  it("accepts optional name", () => {
    const result = CreateAlertChannelSchema.parse({
      type: "email",
      config: { email: "test@example.com" },
      name: "Work Email",
    });
    expect(result.name).toBe("Work Email");
  });

  it("rejects invalid type", () => {
    const result = CreateAlertChannelSchema.safeParse({
      type: "sms",
      config: {},
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing type", () => {
    const result = CreateAlertChannelSchema.safeParse({
      config: {},
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing config", () => {
    const result = CreateAlertChannelSchema.safeParse({
      type: "telegram",
    });
    expect(result.success).toBe(false);
  });
});

// ────────────────────────────────────────────────────────────
// CreateStatusPageSchema
// ────────────────────────────────────────────────────────────

describe("CreateStatusPageSchema", () => {
  const validPage = {
    slug: "my-status-page",
    title: "My Service Status",
    monitorIds: ["550e8400-e29b-41d4-a716-446655440000"],
  };

  it("accepts valid input", () => {
    const result = CreateStatusPageSchema.parse(validPage);
    expect(result.slug).toBe("my-status-page");
    expect(result.title).toBe("My Service Status");
    expect(result.isPublic).toBe(true); // default
  });

  it("rejects slug with uppercase", () => {
    const result = CreateStatusPageSchema.safeParse({
      ...validPage,
      slug: "My-Page",
    });
    expect(result.success).toBe(false);
  });

  it("rejects slug with spaces", () => {
    const result = CreateStatusPageSchema.safeParse({
      ...validPage,
      slug: "my page",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty slug", () => {
    const result = CreateStatusPageSchema.safeParse({
      ...validPage,
      slug: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects slug longer than 64 chars", () => {
    const result = CreateStatusPageSchema.safeParse({
      ...validPage,
      slug: "a".repeat(65),
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid UUID in monitorIds", () => {
    const result = CreateStatusPageSchema.safeParse({
      ...validPage,
      monitorIds: ["not-a-uuid"],
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing title", () => {
    const result = CreateStatusPageSchema.safeParse({
      slug: "test",
      monitorIds: [],
    });
    expect(result.success).toBe(false);
  });
});

// ────────────────────────────────────────────────────────────
// UpdateStatusPageSchema
// ────────────────────────────────────────────────────────────

describe("UpdateStatusPageSchema", () => {
  it("accepts partial updates", () => {
    const result = UpdateStatusPageSchema.parse({ title: "New Title" });
    expect(result.title).toBe("New Title");
  });

  it("accepts empty object", () => {
    const result = UpdateStatusPageSchema.parse({});
    expect(result).toEqual({});
  });
});

// ────────────────────────────────────────────────────────────
// CreateApiKeySchema
// ────────────────────────────────────────────────────────────

describe("CreateApiKeySchema", () => {
  it("accepts valid name", () => {
    const result = CreateApiKeySchema.parse({ name: "My CLI Key" });
    expect(result.name).toBe("My CLI Key");
  });

  it("rejects empty name", () => {
    const result = CreateApiKeySchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects name longer than 100 chars", () => {
    const result = CreateApiKeySchema.safeParse({ name: "x".repeat(101) });
    expect(result.success).toBe(false);
  });

  it("rejects missing name", () => {
    const result = CreateApiKeySchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

// ────────────────────────────────────────────────────────────
// PaginationSchema
// ────────────────────────────────────────────────────────────

describe("PaginationSchema", () => {
  it("provides defaults", () => {
    const result = PaginationSchema.parse({});
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
  });

  it("coerces string values", () => {
    const result = PaginationSchema.parse({ page: "3", pageSize: "50" });
    expect(result.page).toBe(3);
    expect(result.pageSize).toBe(50);
  });

  it("rejects page < 1", () => {
    const result = PaginationSchema.safeParse({ page: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects pageSize > 100", () => {
    const result = PaginationSchema.safeParse({ pageSize: 101 });
    expect(result.success).toBe(false);
  });

  it("rejects pageSize < 1", () => {
    const result = PaginationSchema.safeParse({ pageSize: 0 });
    expect(result.success).toBe(false);
  });
});

// ────────────────────────────────────────────────────────────
// CheckFilterSchema
// ────────────────────────────────────────────────────────────

describe("CheckFilterSchema", () => {
  it("extends pagination with filter fields", () => {
    const result = CheckFilterSchema.parse({
      page: 2,
      pageSize: 10,
      isUp: true,
    });
    expect(result.page).toBe(2);
    expect(result.pageSize).toBe(10);
    expect(result.isUp).toBe(true);
  });

  it("accepts date strings for from/to", () => {
    const result = CheckFilterSchema.parse({
      from: "2024-01-01",
      to: "2024-12-31",
    });
    expect(result.from).toBeInstanceOf(Date);
    expect(result.to).toBeInstanceOf(Date);
  });

  it("allows all fields to be optional", () => {
    const result = CheckFilterSchema.parse({});
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
    expect(result.isUp).toBeUndefined();
    expect(result.from).toBeUndefined();
    expect(result.to).toBeUndefined();
  });
});
