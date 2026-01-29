// ============================================================
// apimon CLI — Pretty Terminal Output Helpers
// ============================================================

import chalk from "chalk";
import ora from "ora";
import Table from "cli-table3";

// ── Status Helpers ──

export function statusColor(statusCode: number): string {
  if (statusCode >= 200 && statusCode < 300) return chalk.green(String(statusCode));
  if (statusCode >= 300 && statusCode < 400) return chalk.yellow(String(statusCode));
  return chalk.red(String(statusCode));
}

export function statusIcon(isUp: boolean): string {
  return isUp ? chalk.green("●") : chalk.red("●");
}

export function statusText(isUp: boolean): string {
  return isUp ? chalk.green("Up") : chalk.red("Down");
}

// ── Message Helpers ──

export function printSuccess(message: string): void {
  console.log(`  ${chalk.green("✓")} ${message}`);
}

export function printError(message: string): void {
  console.error(`  ${chalk.red("✗")} ${message}`);
}

export function printWarning(message: string): void {
  console.log(`  ${chalk.yellow("⚠")} ${message}`);
}

export function printInfo(message: string): void {
  console.log(`  ${chalk.blue("ℹ")} ${message}`);
}

export function printHeader(title: string): void {
  console.log();
  console.log(`  ${chalk.bold(title)}`);
  console.log();
}

export function printDivider(): void {
  console.log(`  ${chalk.dim("─".repeat(50))}`);
}

// ── Formatting ──

export function formatMs(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

export function formatPercent(pct: number): string {
  const str = pct.toFixed(1) + "%";
  if (pct >= 99) return chalk.green(str);
  if (pct >= 95) return chalk.yellow(str);
  return chalk.red(str);
}

export function formatInterval(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  return `${Math.floor(seconds / 3600)}h`;
}

export function formatIntervalLong(seconds: number): string {
  if (seconds < 60) return `${seconds} seconds`;
  if (seconds === 60) return "1 minute";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes`;
  if (seconds === 3600) return "1 hour";
  return `${Math.floor(seconds / 3600)} hours`;
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) {
    const mins = Math.floor(seconds / 60);
    return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  }
  if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }
  const days = Math.floor(seconds / 86400);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

// ── Table ──

export function createTable(head: string[]): Table.Table {
  return new Table({
    head: head.map((h) => chalk.cyan(h)),
    style: {
      head: [],
      border: [],
    },
    chars: {
      "top": "─",
      "top-mid": "┬",
      "top-left": "┌",
      "top-right": "┐",
      "bottom": "─",
      "bottom-mid": "┴",
      "bottom-left": "└",
      "bottom-right": "┘",
      "left": "│",
      "left-mid": "├",
      "mid": "─",
      "mid-mid": "┼",
      "right": "│",
      "right-mid": "┤",
      "middle": "│",
    },
  });
}

// ── Spinner ──

export function createSpinner(text: string) {
  return ora({ text, spinner: "dots" }).start();
}

// ── Error Handling ──

export function handleError(error: unknown): never {
  if (isUserCancellation(error)) {
    console.log();
    process.exit(0);
  }

  if (error instanceof Error) {
    printError(error.message);
  } else {
    printError("An unexpected error occurred.");
  }

  process.exit(1);
}

function isUserCancellation(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return (
    error.name === "ExitPromptError" ||
    error.message.includes("User force closed the prompt")
  );
}

// ── Misc ──

export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.substring(0, maxLen - 1) + "…";
}

export { chalk };
