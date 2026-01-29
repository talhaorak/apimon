import type {
  Monitor,
  MonitorResponse,
  MonitorDetailResponse,
  Check,
  CheckListResponse,
  Incident,
  IncidentListResponse,
  StatusPage,
  StatusPageResponse,
  AlertChannel,
  AlertHistory,
  ApiKey,
  ApiKeyResponse,
  ApiKeyCreateResponse,
  StatsResponse,
  UserResponse,
  CreateMonitorRequest,
  UpdateMonitorRequest,
  CreateAlertChannelRequest,
  CreateStatusPageRequest,
  UpdateStatusPageRequest,
  CreateApiKeyRequest,
  ApiError,
  PaginationParams,
  CheckFilterParams,
} from "@apimon/shared";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/v1";

class ApiClientError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  // TODO(@backend): Add auth token from cookie/session
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("apimon_token")
      : null;
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({
      error: "Unknown error",
      code: "UNKNOWN",
    }))) as ApiError;
    throw new ApiClientError(
      res.status,
      body.code,
      body.error,
      body.details
    );
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  // Auth
  auth: {
    login: (email: string, password: string) =>
      request<{ token: string; user: UserResponse }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
    signup: (email: string, password: string, name: string) =>
      request<{ token: string; user: UserResponse }>("/auth/signup", {
        method: "POST",
        body: JSON.stringify({ email, password, name }),
      }),
    me: () => request<UserResponse>("/auth/me"),
  },

  // Monitors
  monitors: {
    list: () => request<MonitorResponse[]>("/monitors"),
    get: (id: string) => request<MonitorDetailResponse>(`/monitors/${id}`),
    create: (data: CreateMonitorRequest) =>
      request<Monitor>("/monitors", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: UpdateMonitorRequest) =>
      request<Monitor>(`/monitors/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<void>(`/monitors/${id}`, { method: "DELETE" }),
    stats: () => request<StatsResponse>("/monitors/stats"),
  },

  // Checks
  checks: {
    list: (monitorId: string, params?: CheckFilterParams) => {
      const query = params
        ? "?" + new URLSearchParams(
            Object.fromEntries(
              Object.entries(params)
                .filter(([, v]) => v !== undefined)
                .map(([k, v]) => [k, String(v)])
            )
          ).toString()
        : "";
      return request<CheckListResponse>(
        `/monitors/${monitorId}/checks${query}`
      );
    },
  },

  // Incidents
  incidents: {
    list: (monitorId: string, params?: PaginationParams) => {
      const query = params
        ? "?" + new URLSearchParams(
            Object.fromEntries(
              Object.entries(params).map(([k, v]) => [k, String(v)])
            )
          ).toString()
        : "";
      return request<IncidentListResponse>(
        `/monitors/${monitorId}/incidents${query}`
      );
    },
  },

  // Alert Channels
  alertChannels: {
    list: () => request<AlertChannel[]>("/alert-channels"),
    create: (data: CreateAlertChannelRequest) =>
      request<AlertChannel>("/alert-channels", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<void>(`/alert-channels/${id}`, { method: "DELETE" }),
    test: (id: string) =>
      request<{ success: boolean }>(`/alert-channels/${id}/test`, {
        method: "POST",
      }),
  },

  // Status Pages
  statusPages: {
    list: () => request<StatusPage[]>("/status-pages"),
    get: (id: string) => request<StatusPageResponse>(`/status-pages/${id}`),
    getBySlug: (slug: string) =>
      request<StatusPageResponse>(`/status-pages/slug/${slug}`),
    create: (data: CreateStatusPageRequest) =>
      request<StatusPage>("/status-pages", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: UpdateStatusPageRequest) =>
      request<StatusPage>(`/status-pages/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<void>(`/status-pages/${id}`, { method: "DELETE" }),
  },

  // API Keys
  apiKeys: {
    list: () => request<ApiKeyResponse[]>("/api-keys"),
    create: (data: CreateApiKeyRequest) =>
      request<ApiKeyCreateResponse>("/api-keys", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    revoke: (id: string) =>
      request<void>(`/api-keys/${id}`, { method: "DELETE" }),
  },

  // User
  user: {
    me: () => request<UserResponse>("/auth/me"),
    update: (data: { name?: string; email?: string }) =>
      request<UserResponse>("/auth/me", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
  },
};

export { ApiClientError };
export default api;
