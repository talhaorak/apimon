// ============================================================
// apimon — Shared Constants Tests
// ============================================================

import { describe, it, expect } from "vitest";
import {
  PLAN_TYPE,
  PLAN_MONITOR_LIMITS,
  PLAN_STATUS_PAGE_LIMITS,
  PLAN_HISTORY_DAYS,
  PLAN_PRICES_CENTS,
  PLAN_MIN_INTERVAL,
  CHECK_INTERVALS,
  DEFAULT_TIMEOUT_MS,
  MAX_RESPONSE_BODY_BYTES,
  CONSECUTIVE_FAILURES_THRESHOLD,
  HTTP_METHODS,
  ALERT_CHANNEL_TYPES,
  ALERT_STATUSES,
  INCIDENT_STATES,
  API_VERSION,
  DEFAULT_REGION,
} from "./constants.js";

describe("PLAN_TYPE", () => {
  it("has free, pro, and business tiers", () => {
    expect(PLAN_TYPE.FREE).toBe("free");
    expect(PLAN_TYPE.PRO).toBe("pro");
    expect(PLAN_TYPE.BUSINESS).toBe("business");
  });

  it("has exactly 3 plan types", () => {
    expect(Object.keys(PLAN_TYPE)).toHaveLength(3);
  });
});

describe("PLAN_MONITOR_LIMITS", () => {
  it("free plan allows 5 monitors", () => {
    expect(PLAN_MONITOR_LIMITS["free"]).toBe(5);
  });

  it("pro plan allows 50 monitors", () => {
    expect(PLAN_MONITOR_LIMITS["pro"]).toBe(50);
  });

  it("business plan allows unlimited monitors", () => {
    expect(PLAN_MONITOR_LIMITS["business"]).toBe(Infinity);
  });

  it("has limits for all plan types", () => {
    expect(Object.keys(PLAN_MONITOR_LIMITS)).toHaveLength(3);
  });
});

describe("PLAN_STATUS_PAGE_LIMITS", () => {
  it("free plan allows 1 status page", () => {
    expect(PLAN_STATUS_PAGE_LIMITS["free"]).toBe(1);
  });

  it("pro plan allows 5 status pages", () => {
    expect(PLAN_STATUS_PAGE_LIMITS["pro"]).toBe(5);
  });

  it("business plan allows unlimited status pages", () => {
    expect(PLAN_STATUS_PAGE_LIMITS["business"]).toBe(Infinity);
  });
});

describe("PLAN_HISTORY_DAYS", () => {
  it("free plan retains 1 day of history", () => {
    expect(PLAN_HISTORY_DAYS["free"]).toBe(1);
  });

  it("pro plan retains 90 days of history", () => {
    expect(PLAN_HISTORY_DAYS["pro"]).toBe(90);
  });

  it("business plan retains 365 days of history", () => {
    expect(PLAN_HISTORY_DAYS["business"]).toBe(365);
  });
});

describe("PLAN_PRICES_CENTS", () => {
  it("free plan costs $0", () => {
    expect(PLAN_PRICES_CENTS["free"]).toBe(0);
  });

  it("pro plan costs $12/mo (1200 cents)", () => {
    expect(PLAN_PRICES_CENTS["pro"]).toBe(1200);
  });

  it("business plan costs $29/mo (2900 cents)", () => {
    expect(PLAN_PRICES_CENTS["business"]).toBe(2900);
  });
});

describe("CHECK_INTERVALS", () => {
  it("has correct second values", () => {
    expect(CHECK_INTERVALS.THIRTY_SECONDS).toBe(30);
    expect(CHECK_INTERVALS.ONE_MINUTE).toBe(60);
    expect(CHECK_INTERVALS.FIVE_MINUTES).toBe(300);
    expect(CHECK_INTERVALS.FIFTEEN_MINUTES).toBe(900);
    expect(CHECK_INTERVALS.THIRTY_MINUTES).toBe(1800);
    expect(CHECK_INTERVALS.ONE_HOUR).toBe(3600);
  });

  it("has 6 interval options", () => {
    expect(Object.keys(CHECK_INTERVALS)).toHaveLength(6);
  });
});

describe("PLAN_MIN_INTERVAL", () => {
  it("free plan minimum is 5 minutes", () => {
    expect(PLAN_MIN_INTERVAL["free"]).toBe(300);
  });

  it("pro plan minimum is 1 minute", () => {
    expect(PLAN_MIN_INTERVAL["pro"]).toBe(60);
  });

  it("business plan minimum is 30 seconds", () => {
    expect(PLAN_MIN_INTERVAL["business"]).toBe(30);
  });

  it("each tier is faster than the one above", () => {
    expect(PLAN_MIN_INTERVAL["business"]!).toBeLessThan(PLAN_MIN_INTERVAL["pro"]!);
    expect(PLAN_MIN_INTERVAL["pro"]!).toBeLessThan(PLAN_MIN_INTERVAL["free"]!);
  });
});

describe("Default Values", () => {
  it("DEFAULT_TIMEOUT_MS is 30 seconds", () => {
    expect(DEFAULT_TIMEOUT_MS).toBe(30_000);
  });

  it("MAX_RESPONSE_BODY_BYTES is 1KB", () => {
    expect(MAX_RESPONSE_BODY_BYTES).toBe(1024);
  });

  it("CONSECUTIVE_FAILURES_THRESHOLD is 3", () => {
    expect(CONSECUTIVE_FAILURES_THRESHOLD).toBe(3);
  });

  it("DEFAULT_REGION is us-east-1", () => {
    expect(DEFAULT_REGION).toBe("us-east-1");
  });

  it("API_VERSION is v1", () => {
    expect(API_VERSION).toBe("v1");
  });
});

describe("HTTP_METHODS", () => {
  it("includes all standard methods", () => {
    expect(HTTP_METHODS).toContain("GET");
    expect(HTTP_METHODS).toContain("POST");
    expect(HTTP_METHODS).toContain("PUT");
    expect(HTTP_METHODS).toContain("PATCH");
    expect(HTTP_METHODS).toContain("DELETE");
    expect(HTTP_METHODS).toContain("HEAD");
    expect(HTTP_METHODS).toContain("OPTIONS");
  });

  it("has 7 methods", () => {
    expect(HTTP_METHODS).toHaveLength(7);
  });
});

describe("ALERT_CHANNEL_TYPES", () => {
  it("includes all supported channel types", () => {
    expect(ALERT_CHANNEL_TYPES).toContain("telegram");
    expect(ALERT_CHANNEL_TYPES).toContain("slack");
    expect(ALERT_CHANNEL_TYPES).toContain("discord");
    expect(ALERT_CHANNEL_TYPES).toContain("email");
    expect(ALERT_CHANNEL_TYPES).toContain("webhook");
  });

  it("has 5 channel types", () => {
    expect(ALERT_CHANNEL_TYPES).toHaveLength(5);
  });
});

describe("ALERT_STATUSES", () => {
  it("has pending, sent, and failed", () => {
    expect(ALERT_STATUSES).toContain("pending");
    expect(ALERT_STATUSES).toContain("sent");
    expect(ALERT_STATUSES).toContain("failed");
  });

  it("has 3 statuses", () => {
    expect(ALERT_STATUSES).toHaveLength(3);
  });
});

describe("INCIDENT_STATES", () => {
  it("has ongoing and resolved", () => {
    expect(INCIDENT_STATES).toContain("ongoing");
    expect(INCIDENT_STATES).toContain("resolved");
  });

  it("has 2 states", () => {
    expect(INCIDENT_STATES).toHaveLength(2);
  });
});
