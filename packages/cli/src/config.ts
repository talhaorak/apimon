// ============================================================
// apimon CLI — Configuration Management
// ============================================================

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { parse, stringify } from "yaml";

// ── Types ──

export interface GlobalConfig {
  apiKey?: string;
  apiUrl?: string;
}

export interface LocalConfig {
  apiUrl?: string;
  defaultInterval?: number;
}

// ── Paths ──

const GLOBAL_CONFIG_DIR = join(homedir(), ".apimon");
const GLOBAL_CONFIG_PATH = join(GLOBAL_CONFIG_DIR, "config.yaml");
const LOCAL_CONFIG_FILENAME = ".apimon.yaml";

export function getGlobalConfigDir(): string {
  return GLOBAL_CONFIG_DIR;
}

export function getGlobalConfigPath(): string {
  return GLOBAL_CONFIG_PATH;
}

export function getLocalConfigPath(): string {
  return join(process.cwd(), LOCAL_CONFIG_FILENAME);
}

// ── Global Config (~/.apimon/config.yaml) ──

export function readGlobalConfig(): GlobalConfig {
  try {
    if (!existsSync(GLOBAL_CONFIG_PATH)) return {};
    const content = readFileSync(GLOBAL_CONFIG_PATH, "utf-8");
    return (parse(content) as GlobalConfig) ?? {};
  } catch {
    return {};
  }
}

export function writeGlobalConfig(config: GlobalConfig): void {
  mkdirSync(GLOBAL_CONFIG_DIR, { recursive: true });
  writeFileSync(GLOBAL_CONFIG_PATH, stringify(config), "utf-8");
}

export function updateGlobalConfig(updates: Partial<GlobalConfig>): void {
  const current = readGlobalConfig();
  writeGlobalConfig({ ...current, ...updates });
}

// ── Local Config (.apimon.yaml) ──

export function readLocalConfig(): LocalConfig {
  try {
    const localPath = getLocalConfigPath();
    if (!existsSync(localPath)) return {};
    const content = readFileSync(localPath, "utf-8");
    return (parse(content) as LocalConfig) ?? {};
  } catch {
    return {};
  }
}

export function writeLocalConfig(config: LocalConfig): void {
  writeFileSync(getLocalConfigPath(), stringify(config), "utf-8");
}

export function localConfigExists(): boolean {
  return existsSync(getLocalConfigPath());
}

// ── Resolved helpers ──

export function getApiUrl(): string {
  const local = readLocalConfig();
  const global_ = readGlobalConfig();
  return local.apiUrl ?? global_.apiUrl ?? "https://api.apimon.dev";
}

export function getApiKey(): string | undefined {
  return readGlobalConfig().apiKey;
}
