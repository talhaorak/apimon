// ============================================================
// apimon CLI — Typed API Client
// ============================================================

import type {
  Monitor,
  MonitorResponse,
  MonitorDetailResponse,
  StatsResponse,
  UserResponse,
  AlertChannel,
  CreateMonitorRequest,
  ApiError,
} from "@apimon/shared";
import { API_VERSION } from "@apimon/shared";
import { getApiUrl, getApiKey } from "./config.js";

// ── Custom Error ──

export class ApiClientError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.name = "ApiClientError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

// ── API Client ──

export class ApiClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.apiKey = apiKey;
  }

  private get headers(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${this.apiKey}`,
    };
  }

  private url(path: string): string {
    return `${this.baseUrl}/${API_VERSION}${path}`;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    let response: Response;

    try {
      response = await fetch(this.url(path), {
        method,
        headers: this.headers,
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("ECONNREFUSED")) {
          throw new ApiClientError(
            "Could not connect to apimon API. Is the server running?",
            0,
            "CONNECTION_REFUSED"
          );
        }
        if (error.message.includes("ENOTFOUND")) {
          throw new ApiClientError(
            "Could not resolve apimon API host. Check your API URL.",
            0,
            "DNS_FAILED"
          );
        }
        throw new ApiClientError(
          `Network error: ${error.message}`,
          0,
          "NETWORK_ERROR"
        );
      }
      throw error;
    }

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      let errorCode = "UNKNOWN_ERROR";

      try {
        const errorBody = (await response.json()) as ApiError;
        if (errorBody.error) errorMessage = errorBody.error;
        if (errorBody.code) errorCode = errorBody.code;
      } catch {
        // Use default error message
      }

      if (response.status === 401) {
        throw new ApiClientError(
          "Invalid or expired API key. Run `apimon login` to re-authenticate.",
          401,
          "UNAUTHORIZED"
        );
      }

      if (response.status === 403) {
        throw new ApiClientError(
          "Forbidden. You don't have permission for this action.",
          403,
          "FORBIDDEN"
        );
      }

      if (response.status === 404) {
        throw new ApiClientError(
          "Resource not found.",
          404,
          "NOT_FOUND"
        );
      }

      if (response.status === 429) {
        throw new ApiClientError(
          "Rate limit exceeded. Please try again later.",
          429,
          "RATE_LIMITED"
        );
      }

      throw new ApiClientError(errorMessage, response.status, errorCode);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }

  // ── Auth ──

  async validateKey(): Promise<UserResponse> {
    return this.request<UserResponse>("GET", "/auth/me");
  }

  // ── Monitors ──

  async listMonitors(status?: string): Promise<MonitorResponse[]> {
    const query = status && status !== "all" ? `?status=${status}` : "";
    return this.request<MonitorResponse[]>("GET", `/monitors${query}`);
  }

  async getMonitor(id: string): Promise<MonitorDetailResponse> {
    return this.request<MonitorDetailResponse>("GET", `/monitors/${id}`);
  }

  async createMonitor(data: CreateMonitorRequest): Promise<Monitor> {
    return this.request<Monitor>("POST", "/monitors", data);
  }

  async deleteMonitor(id: string): Promise<void> {
    return this.request<void>("DELETE", `/monitors/${id}`);
  }

  // ── Stats ──

  async getStats(): Promise<StatsResponse> {
    return this.request<StatsResponse>("GET", "/stats");
  }

  // ── Alert Channels ──

  async listAlertChannels(): Promise<AlertChannel[]> {
    return this.request<AlertChannel[]>("GET", "/alert-channels");
  }
}

// ── Factory ──

export function createAuthenticatedClient(): ApiClient {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error(
      "Not authenticated. Run `apimon login` first."
    );
  }
  return new ApiClient(getApiUrl(), apiKey);
}
