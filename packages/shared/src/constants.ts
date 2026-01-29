// ============================================================
// apimon — Shared Constants
// ============================================================

/** Plan types */
export const PLAN_TYPE = {
  FREE: "free",
  PRO: "pro",
  BUSINESS: "business",
} as const;

/** Plan limits — monitor count */
export const PLAN_MONITOR_LIMITS: Record<string, number> = {
  [PLAN_TYPE.FREE]: 5,
  [PLAN_TYPE.PRO]: 50,
  [PLAN_TYPE.BUSINESS]: Infinity,
};

/** Plan limits — status page count */
export const PLAN_STATUS_PAGE_LIMITS: Record<string, number> = {
  [PLAN_TYPE.FREE]: 1,
  [PLAN_TYPE.PRO]: 5,
  [PLAN_TYPE.BUSINESS]: Infinity,
};

/** Plan limits — history retention in days */
export const PLAN_HISTORY_DAYS: Record<string, number> = {
  [PLAN_TYPE.FREE]: 1, // 24h
  [PLAN_TYPE.PRO]: 90,
  [PLAN_TYPE.BUSINESS]: 365,
};

/** Plan prices in cents (USD) */
export const PLAN_PRICES_CENTS: Record<string, number> = {
  [PLAN_TYPE.FREE]: 0,
  [PLAN_TYPE.PRO]: 1200,
  [PLAN_TYPE.BUSINESS]: 2900,
};

/** Check intervals in seconds */
export const CHECK_INTERVALS = {
  THIRTY_SECONDS: 30,
  ONE_MINUTE: 60,
  FIVE_MINUTES: 300,
  FIFTEEN_MINUTES: 900,
  THIRTY_MINUTES: 1800,
  ONE_HOUR: 3600,
} as const;

/** Minimum check intervals per plan (in seconds) */
export const PLAN_MIN_INTERVAL: Record<string, number> = {
  [PLAN_TYPE.FREE]: CHECK_INTERVALS.FIVE_MINUTES,
  [PLAN_TYPE.PRO]: CHECK_INTERVALS.ONE_MINUTE,
  [PLAN_TYPE.BUSINESS]: CHECK_INTERVALS.THIRTY_SECONDS,
};

/** Default timeout for HTTP checks (ms) */
export const DEFAULT_TIMEOUT_MS = 30_000;

/** Max response body to store (bytes) — 1KB */
export const MAX_RESPONSE_BODY_BYTES = 1024;

/** Number of consecutive failures before creating an incident */
export const CONSECUTIVE_FAILURES_THRESHOLD = 3;

/** Supported HTTP methods */
export const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"] as const;

/** Alert channel types */
export const ALERT_CHANNEL_TYPES = ["telegram", "slack", "discord", "email", "webhook"] as const;

/** Alert delivery statuses */
export const ALERT_STATUSES = ["pending", "sent", "failed"] as const;

/** Incident states */
export const INCIDENT_STATES = ["ongoing", "resolved"] as const;

/** API version */
export const API_VERSION = "v1";

/** Default check region */
export const DEFAULT_REGION = "us-east-1";
