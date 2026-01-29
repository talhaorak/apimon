// ============================================================
// apimon CLI — Output Helpers Tests
// ============================================================

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock chalk to return plain text for testable output
vi.mock("chalk", () => {
  const handler: ProxyHandler<Record<string, unknown>> = {
    get(_target, prop: string) {
      if (prop === "default") return new Proxy({}, handler);
      // Return a function that returns the string as-is
      const fn = (str: string) => str;
      // Support chaining: chalk.green.bold("text")
      return new Proxy(fn, {
        get() {
          return fn;
        },
        apply(_target, _thisArg, args) {
          return String(args[0]);
        },
      });
    },
  };
  return { default: new Proxy({}, handler) };
});

// Mock ora
vi.mock("ora", () => ({
  default: vi.fn((opts: { text: string }) => ({
    text: typeof opts === "string" ? opts : opts.text,
    start: vi.fn().mockReturnThis(),
    stop: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis(),
  })),
}));

// Mock cli-table3
vi.mock("cli-table3", () => {
  function MockTable(_opts: unknown) {
    return {
      push: vi.fn(),
      toString: vi.fn(() => "table-output"),
    };
  }
  return { default: MockTable };
});

import {
  statusColor,
  statusIcon,
  statusText,
  formatMs,
  formatPercent,
  formatInterval,
  formatIntervalLong,
  formatDate,
  timeAgo,
  createTable,
  createSpinner,
  truncate,
} from "./output.js";

describe("Output Helpers", () => {
  describe("statusColor", () => {
    it("returns green for 2xx status codes", () => {
      const result = statusColor(200);
      expect(result).toBe("200");
    });

    it("returns yellow for 3xx status codes", () => {
      const result = statusColor(301);
      expect(result).toBe("301");
    });

    it("returns red for 4xx/5xx status codes", () => {
      const result400 = statusColor(404);
      expect(result400).toBe("404");
      const result500 = statusColor(500);
      expect(result500).toBe("500");
    });
  });

  describe("statusIcon", () => {
    it("returns green dot for up", () => {
      const result = statusIcon(true);
      expect(result).toContain("●");
    });

    it("returns red dot for down", () => {
      const result = statusIcon(false);
      expect(result).toContain("●");
    });
  });

  describe("statusText", () => {
    it("returns 'Up' for up status", () => {
      expect(statusText(true)).toBe("Up");
    });

    it("returns 'Down' for down status", () => {
      expect(statusText(false)).toBe("Down");
    });
  });

  describe("formatMs", () => {
    it("formats milliseconds under 1s", () => {
      expect(formatMs(150)).toBe("150ms");
      expect(formatMs(0)).toBe("0ms");
      expect(formatMs(999)).toBe("999ms");
    });

    it("formats seconds for 1000ms+", () => {
      expect(formatMs(1000)).toBe("1.00s");
      expect(formatMs(1500)).toBe("1.50s");
      expect(formatMs(2345)).toBe("2.35s");
    });

    it("rounds sub-second values", () => {
      expect(formatMs(99.7)).toBe("100ms");
    });
  });

  describe("formatPercent", () => {
    it("formats percentage with 1 decimal", () => {
      const result = formatPercent(99.5);
      expect(result).toContain("99.5%");
    });

    it("formats 100%", () => {
      const result = formatPercent(100);
      expect(result).toContain("100.0%");
    });

    it("formats low percentage", () => {
      const result = formatPercent(50);
      expect(result).toContain("50.0%");
    });
  });

  describe("formatInterval", () => {
    it("formats seconds", () => {
      expect(formatInterval(30)).toBe("30s");
      expect(formatInterval(59)).toBe("59s");
    });

    it("formats minutes", () => {
      expect(formatInterval(60)).toBe("1m");
      expect(formatInterval(300)).toBe("5m");
      expect(formatInterval(900)).toBe("15m");
    });

    it("formats hours", () => {
      expect(formatInterval(3600)).toBe("1h");
      expect(formatInterval(7200)).toBe("2h");
    });
  });

  describe("formatIntervalLong", () => {
    it("formats seconds in long form", () => {
      expect(formatIntervalLong(30)).toBe("30 seconds");
    });

    it("formats singular minute", () => {
      expect(formatIntervalLong(60)).toBe("1 minute");
    });

    it("formats plural minutes", () => {
      expect(formatIntervalLong(300)).toBe("5 minutes");
    });

    it("formats singular hour", () => {
      expect(formatIntervalLong(3600)).toBe("1 hour");
    });

    it("formats plural hours", () => {
      expect(formatIntervalLong(7200)).toBe("2 hours");
    });
  });

  describe("formatDate", () => {
    it("formats date in readable format", () => {
      const date = new Date("2024-06-15T14:30:00Z");
      const result = formatDate(date);
      // Should contain month, day, year, and time
      expect(result).toContain("2024");
      expect(result).toContain("15");
    });
  });

  describe("timeAgo", () => {
    it("returns 'just now' for recent times", () => {
      const now = new Date();
      expect(timeAgo(now)).toBe("just now");
    });

    it("returns minutes ago", () => {
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
      expect(timeAgo(fiveMinAgo)).toBe("5 minutes ago");
    });

    it("returns singular minute", () => {
      const oneMinAgo = new Date(Date.now() - 60 * 1000);
      expect(timeAgo(oneMinAgo)).toBe("1 minute ago");
    });

    it("returns hours ago", () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      expect(timeAgo(twoHoursAgo)).toBe("2 hours ago");
    });

    it("returns singular hour", () => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      expect(timeAgo(oneHourAgo)).toBe("1 hour ago");
    });

    it("returns days ago", () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      expect(timeAgo(threeDaysAgo)).toBe("3 days ago");
    });

    it("returns singular day", () => {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      expect(timeAgo(oneDayAgo)).toBe("1 day ago");
    });
  });

  describe("createTable", () => {
    it("creates a table with headers", () => {
      const table = createTable(["Name", "URL", "Status"]);
      expect(table).toBeDefined();
    });
  });

  describe("createSpinner", () => {
    it("creates and starts a spinner", () => {
      const spinner = createSpinner("Loading...");
      expect(spinner).toBeDefined();
    });
  });

  describe("truncate", () => {
    it("returns string as-is if shorter than max", () => {
      expect(truncate("short", 10)).toBe("short");
    });

    it("returns string as-is if exactly max length", () => {
      expect(truncate("exact", 5)).toBe("exact");
    });

    it("truncates and adds ellipsis for long strings", () => {
      const result = truncate("this is a very long string", 10);
      expect(result).toHaveLength(10);
      expect(result.endsWith("…")).toBe(true);
    });
  });
});
