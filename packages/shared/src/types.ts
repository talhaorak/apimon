// ============================================================
// apimon — Shared Types, Enums & Zod Schemas
// ============================================================

import { z } from "zod";
import {
  HTTP_METHODS,
  ALERT_CHANNEL_TYPES,
  ALERT_STATUSES,
  CHECK_INTERVALS,
} from "./constants.js";

// ────────────────────────────────────────────────────────────
// Enums
// ────────────────────────────────────────────────────────────

export const PlanType = z.enum(["free", "pro", "business"]);
export type PlanType = z.infer<typeof PlanType>;

export const MonitorMethod = z.enum(HTTP_METHODS);
export type MonitorMethod = z.infer<typeof MonitorMethod>;

export const CheckInterval = z.coerce.number().refine(
  (val) => Object.values(CHECK_INTERVALS).includes(val as never),
  { message: "Invalid check interval" }
);
export type CheckInterval = (typeof CHECK_INTERVALS)[keyof typeof CHECK_INTERVALS];

export const AlertType = z.enum(ALERT_CHANNEL_TYPES);
export type AlertType = z.infer<typeof AlertType>;

export const AlertStatus = z.enum(ALERT_STATUSES);
export type AlertStatus = z.infer<typeof AlertStatus>;

export const IncidentState = z.enum(["ongoing", "resolved"]);
export type IncidentState = z.infer<typeof IncidentState>;

// ────────────────────────────────────────────────────────────
// Entity Types
// ────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string | null;
  plan: PlanType;
  stripeCustomerId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiKey {
  id: string;
  userId: string;
  keyHash: string;
  name: string;
  lastUsedAt: Date | null;
  createdAt: Date;
}

export interface Monitor {
  id: string;
  userId: string;
  name: string;
  url: string;
  method: MonitorMethod;
  headers: Record<string, string> | null;
  body: string | null;
  expectedStatus: number;
  checkIntervalSeconds: number;
  timeoutMs: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Check {
  id: string;
  monitorId: string;
  statusCode: number | null;
  responseTimeMs: number | null;
  isUp: boolean;
  errorMessage: string | null;
  responseBody: string | null;
  region: string;
  checkedAt: Date;
}

export interface Incident {
  id: string;
  monitorId: string;
  state: IncidentState;
  cause: string | null;
  startedAt: Date;
  resolvedAt: Date | null;
}

export interface StatusPage {
  id: string;
  userId: string;
  slug: string;
  title: string;
  description: string | null;
  monitorIds: string[];
  customDomain: string | null;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AlertChannel {
  id: string;
  userId: string;
  type: AlertType;
  config: Record<string, unknown>;
  isVerified: boolean;
  createdAt: Date;
}

export interface AlertHistory {
  id: string;
  monitorId: string;
  channelId: string;
  incidentId: string | null;
  message: string;
  status: AlertStatus;
  sentAt: Date;
}

// ────────────────────────────────────────────────────────────
// Zod Schemas — Requests
// ────────────────────────────────────────────────────────────

export const CreateMonitorSchema = z.object({
  name: z.string().min(1).max(100),
  url: z.string().url(),
  method: MonitorMethod.default("GET"),
  headers: z.record(z.string()).optional().default({}),
  body: z.string().optional().nullable(),
  expectedStatus: z.number().int().min(100).max(599).default(200),
  checkIntervalSeconds: z.number().int().min(30).max(3600).default(300),
  timeoutMs: z.number().int().min(1000).max(60000).default(30000),
  isActive: z.boolean().default(true),
});
export type CreateMonitorRequest = z.infer<typeof CreateMonitorSchema>;

export const UpdateMonitorSchema = CreateMonitorSchema.partial();
export type UpdateMonitorRequest = z.infer<typeof UpdateMonitorSchema>;

export const CreateAlertChannelSchema = z.object({
  type: AlertType,
  config: z.record(z.unknown()),
  name: z.string().min(1).max(100).optional(),
});
export type CreateAlertChannelRequest = z.infer<typeof CreateAlertChannelSchema>;

export const CreateStatusPageSchema = z.object({
  slug: z.string().min(1).max(64).regex(/^[a-z0-9-]+$/),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional().nullable(),
  monitorIds: z.array(z.string().uuid()),
  isPublic: z.boolean().default(true),
});
export type CreateStatusPageRequest = z.infer<typeof CreateStatusPageSchema>;

export const UpdateStatusPageSchema = CreateStatusPageSchema.partial();
export type UpdateStatusPageRequest = z.infer<typeof UpdateStatusPageSchema>;

export const CreateApiKeySchema = z.object({
  name: z.string().min(1).max(100),
});
export type CreateApiKeyRequest = z.infer<typeof CreateApiKeySchema>;

// ────────────────────────────────────────────────────────────
// Zod Schemas — Responses
// ────────────────────────────────────────────────────────────

export interface MonitorResponse extends Monitor {
  lastCheck?: Check | null;
  uptimePercentage?: number;
  incidentCount?: number;
}

export interface MonitorDetailResponse extends MonitorResponse {
  recentChecks: Check[];
  activeIncidents: Incident[];
  alertChannels: AlertChannel[];
}

export interface CheckListResponse {
  checks: Check[];
  total: number;
  page: number;
  pageSize: number;
}

export interface IncidentListResponse {
  incidents: Incident[];
  total: number;
  page: number;
  pageSize: number;
}

export interface StatusPageResponse extends StatusPage {
  monitors: MonitorResponse[];
}

export interface UserResponse {
  id: string;
  email: string;
  name: string | null;
  plan: PlanType;
  monitorCount: number;
  monitorLimit: number;
}

export interface ApiKeyResponse {
  id: string;
  name: string;
  keyPrefix: string;
  lastUsedAt: Date | null;
  createdAt: Date;
}

export interface ApiKeyCreateResponse extends ApiKeyResponse {
  /** Full key — only returned once at creation time */
  key: string;
}

export interface StatsResponse {
  totalMonitors: number;
  monitorsUp: number;
  monitorsDown: number;
  avgResponseTimeMs: number;
  uptimePercentage: number;
  checksLast24h: number;
  incidentsLast24h: number;
}

// ────────────────────────────────────────────────────────────
// Pagination & Filtering
// ────────────────────────────────────────────────────────────

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type PaginationParams = z.infer<typeof PaginationSchema>;

export const CheckFilterSchema = PaginationSchema.extend({
  isUp: z.coerce.boolean().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});
export type CheckFilterParams = z.infer<typeof CheckFilterSchema>;

// ────────────────────────────────────────────────────────────
// Error Response
// ────────────────────────────────────────────────────────────

export interface ApiError {
  error: string;
  code: string;
  details?: unknown;
}
