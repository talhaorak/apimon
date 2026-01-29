// ============================================================
// apimon CLI — API Client Tests
// ============================================================

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock config module
vi.mock("./config.js", () => ({
  getApiUrl: vi.fn(() => "https://api.apimon.dev"),
  getApiKey: vi.fn(() => "apimon_testkey123"),
}));

import { ApiClient, ApiClientError, createAuthenticatedClient } from "./api-client.js";
import { getApiKey } from "./config.js";

describe("ApiClient", () => {
  let client: ApiClient;
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    client = new ApiClient("https://api.example.com", "test-api-key");
    fetchSpy = vi.spyOn(globalThis, "fetch");
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Constructor", () => {
    it("strips trailing slash from base URL", async () => {
      const c = new ApiClient("https://api.example.com/", "key");
      fetchSpy.mockResolvedValue(
        new Response(JSON.stringify([]), { status: 200 })
      );
      await c.listMonitors();
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining("https://api.example.com/v1/monitors"),
        expect.anything()
      );
    });
  });

  describe("Request headers", () => {
    it("includes Authorization header with Bearer token", async () => {
      fetchSpy.mockResolvedValue(
        new Response(JSON.stringify([]), { status: 200 })
      );
      await client.listMonitors();

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer test-api-key",
            "Content-Type": "application/json",
          }),
        })
      );
    });
  });

  describe("Successful requests", () => {
    it("listMonitors returns array", async () => {
      const monitors = [
        { id: "1", name: "Test API", url: "https://example.com" },
      ];
      fetchSpy.mockResolvedValue(
        new Response(JSON.stringify(monitors), { status: 200 })
      );

      const result = await client.listMonitors();
      expect(result).toEqual(monitors);
    });

    it("getMonitor returns monitor detail", async () => {
      const monitor = {
        id: "1",
        name: "Test API",
        recentChecks: [],
        activeIncidents: [],
      };
      fetchSpy.mockResolvedValue(
        new Response(JSON.stringify(monitor), { status: 200 })
      );

      const result = await client.getMonitor("1");
      expect(result.id).toBe("1");
      expect(result).toHaveProperty("recentChecks");
    });

    it("createMonitor sends POST with body", async () => {
      const newMonitor = { id: "1", name: "New", url: "https://example.com" };
      fetchSpy.mockResolvedValue(
        new Response(JSON.stringify(newMonitor), { status: 201 })
      );

      const result = await client.createMonitor({
        name: "New",
        url: "https://example.com",
        method: "GET",
        headers: {},
        expectedStatus: 200,
        checkIntervalSeconds: 300,
        timeoutMs: 30000,
        isActive: true,
      });
      expect(result.name).toBe("New");

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining("/monitors"),
        expect.objectContaining({
          method: "POST",
        })
      );
    });

    it("deleteMonitor sends DELETE request", async () => {
      fetchSpy.mockResolvedValue(
        new Response(null, { status: 204 })
      );

      await client.deleteMonitor("1");

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining("/monitors/1"),
        expect.objectContaining({ method: "DELETE" })
      );
    });
  });

  describe("Error handling", () => {
    it("throws ApiClientError on 401", async () => {
      fetchSpy.mockResolvedValue(
        new Response(
          JSON.stringify({ error: "Invalid API key", code: "UNAUTHORIZED" }),
          { status: 401 }
        )
      );

      await expect(client.listMonitors()).rejects.toThrow(ApiClientError);
      await expect(client.listMonitors()).rejects.toThrow(/apimon login/);
    });

    it("throws ApiClientError on 403", async () => {
      fetchSpy.mockResolvedValue(
        new Response(
          JSON.stringify({ error: "Forbidden", code: "FORBIDDEN" }),
          { status: 403 }
        )
      );

      await expect(client.listMonitors()).rejects.toThrow(ApiClientError);
    });

    it("throws ApiClientError on 404", async () => {
      fetchSpy.mockResolvedValue(
        new Response(
          JSON.stringify({ error: "Not found", code: "NOT_FOUND" }),
          { status: 404 }
        )
      );

      await expect(client.getMonitor("xxx")).rejects.toThrow(ApiClientError);
    });

    it("throws ApiClientError on 429 rate limit", async () => {
      fetchSpy.mockResolvedValue(
        new Response(
          JSON.stringify({ error: "Too many requests", code: "RATE_LIMITED" }),
          { status: 429 }
        )
      );

      await expect(client.listMonitors()).rejects.toThrow(/rate limit/i);
    });

    it("throws ApiClientError on network connection refused", async () => {
      fetchSpy.mockRejectedValue(new Error("ECONNREFUSED"));

      await expect(client.listMonitors()).rejects.toThrow(ApiClientError);
      try {
        await client.listMonitors();
      } catch (err) {
        expect(err).toBeInstanceOf(ApiClientError);
        expect((err as ApiClientError).code).toBe("CONNECTION_REFUSED");
      }
    });

    it("throws ApiClientError on DNS failure", async () => {
      fetchSpy.mockRejectedValue(new Error("ENOTFOUND"));

      try {
        await client.listMonitors();
      } catch (err) {
        expect(err).toBeInstanceOf(ApiClientError);
        expect((err as ApiClientError).code).toBe("DNS_FAILED");
      }
    });

    it("throws ApiClientError on generic network error", async () => {
      fetchSpy.mockRejectedValue(new Error("Some network issue"));

      try {
        await client.listMonitors();
      } catch (err) {
        expect(err).toBeInstanceOf(ApiClientError);
        expect((err as ApiClientError).code).toBe("NETWORK_ERROR");
      }
    });

    it("includes error code and status from ApiClientError", async () => {
      fetchSpy.mockResolvedValue(
        new Response(
          JSON.stringify({ error: "Custom error", code: "CUSTOM_CODE" }),
          { status: 422 }
        )
      );

      try {
        await client.listMonitors();
      } catch (err) {
        expect(err).toBeInstanceOf(ApiClientError);
        expect((err as ApiClientError).statusCode).toBe(422);
      }
    });
  });
});

describe("createAuthenticatedClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates client when API key is configured", () => {
    vi.mocked(getApiKey).mockReturnValue("apimon_key123");
    const client = createAuthenticatedClient();
    expect(client).toBeInstanceOf(ApiClient);
  });

  it("throws when no API key is configured", () => {
    vi.mocked(getApiKey).mockReturnValue(undefined);
    expect(() => createAuthenticatedClient()).toThrow(/not authenticated/i);
  });
});
