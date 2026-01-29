// ============================================================
// apimon CLI — Config Management Tests
// ============================================================

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

// Mock node:fs
vi.mock("node:fs", () => ({
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  mkdirSync: vi.fn(),
  existsSync: vi.fn(),
}));

// Mock yaml
vi.mock("yaml", () => ({
  parse: vi.fn((str: string) => {
    // Simple YAML-like parsing for tests
    if (!str || str.trim() === "") return null;
    try {
      // Handle simple key: value pairs
      const result: Record<string, string> = {};
      for (const line of str.split("\n")) {
        const match = line.match(/^(\w+):\s*(.+)$/);
        if (match) {
          result[match[1]!] = match[2]!;
        }
      }
      return Object.keys(result).length > 0 ? result : null;
    } catch {
      return null;
    }
  }),
  stringify: vi.fn((obj: unknown) => {
    if (!obj || typeof obj !== "object") return "";
    return Object.entries(obj as Record<string, unknown>)
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n");
  }),
}));

import {
  readGlobalConfig,
  writeGlobalConfig,
  updateGlobalConfig,
  readLocalConfig,
  writeLocalConfig,
  localConfigExists,
  getApiUrl,
  getApiKey,
  getGlobalConfigDir,
  getGlobalConfigPath,
  getLocalConfigPath,
} from "./config.js";

describe("Config Management", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Path helpers", () => {
    it("returns global config dir under home", () => {
      const dir = getGlobalConfigDir();
      expect(dir).toBe(join(homedir(), ".apimon"));
    });

    it("returns global config path", () => {
      const path = getGlobalConfigPath();
      expect(path).toBe(join(homedir(), ".apimon", "config.yaml"));
    });

    it("returns local config path in cwd", () => {
      const path = getLocalConfigPath();
      expect(path).toBe(join(process.cwd(), ".apimon.yaml"));
    });
  });

  describe("readGlobalConfig", () => {
    it("returns empty object when config file doesn't exist", () => {
      vi.mocked(existsSync).mockReturnValue(false);
      const config = readGlobalConfig();
      expect(config).toEqual({});
    });

    it("reads and parses config when file exists", () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue("apiKey: apimon_test123\napiUrl: https://api.example.com");

      const config = readGlobalConfig();
      expect(config).toHaveProperty("apiKey");
    });

    it("returns empty object on read error", () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockImplementation(() => {
        throw new Error("Permission denied");
      });

      const config = readGlobalConfig();
      expect(config).toEqual({});
    });
  });

  describe("writeGlobalConfig", () => {
    it("creates config directory and writes file", () => {
      writeGlobalConfig({ apiKey: "test-key" });

      expect(mkdirSync).toHaveBeenCalledWith(
        join(homedir(), ".apimon"),
        { recursive: true }
      );
      expect(writeFileSync).toHaveBeenCalledWith(
        join(homedir(), ".apimon", "config.yaml"),
        expect.any(String),
        "utf-8"
      );
    });
  });

  describe("updateGlobalConfig", () => {
    it("merges updates with existing config", () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue("apiUrl: https://old.api.com");

      updateGlobalConfig({ apiKey: "new-key" });

      expect(writeFileSync).toHaveBeenCalled();
    });
  });

  describe("readLocalConfig", () => {
    it("returns empty object when local config doesn't exist", () => {
      vi.mocked(existsSync).mockReturnValue(false);
      const config = readLocalConfig();
      expect(config).toEqual({});
    });

    it("reads local config when it exists", () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue("defaultInterval: 60");

      const config = readLocalConfig();
      expect(config).toBeDefined();
    });
  });

  describe("writeLocalConfig", () => {
    it("writes local config file", () => {
      writeLocalConfig({ defaultInterval: 120 });

      expect(writeFileSync).toHaveBeenCalledWith(
        join(process.cwd(), ".apimon.yaml"),
        expect.any(String),
        "utf-8"
      );
    });
  });

  describe("localConfigExists", () => {
    it("returns true when local config exists", () => {
      vi.mocked(existsSync).mockReturnValue(true);
      expect(localConfigExists()).toBe(true);
    });

    it("returns false when local config doesn't exist", () => {
      vi.mocked(existsSync).mockReturnValue(false);
      expect(localConfigExists()).toBe(false);
    });
  });

  describe("getApiUrl", () => {
    it("returns default URL when no config exists", () => {
      vi.mocked(existsSync).mockReturnValue(false);
      expect(getApiUrl()).toBe("https://api.apimon.dev");
    });
  });

  describe("getApiKey", () => {
    it("returns undefined when no key is configured", () => {
      vi.mocked(existsSync).mockReturnValue(false);
      expect(getApiKey()).toBeUndefined();
    });
  });
});
