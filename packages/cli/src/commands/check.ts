// ============================================================
// apimon check <url> — One-shot HTTP check (no account needed)
// ============================================================

import type { Command } from "commander";
import { DEFAULT_TIMEOUT_MS, HTTP_METHODS } from "@apimon/shared";
import {
  chalk,
  statusColor,
  formatMs,
  printError,
  createSpinner,
  handleError,
} from "../output.js";

interface CheckOptions {
  method: string;
  timeout: string;
  headers?: string[];
  body?: string;
}

const PRIORITY_HEADERS = new Set([
  "content-type",
  "server",
  "x-powered-by",
  "cache-control",
  "content-length",
  "x-request-id",
  "x-response-time",
  "x-ratelimit-limit",
  "x-ratelimit-remaining",
  "strict-transport-security",
]);

export function registerCheckCommand(program: Command): void {
  program
    .command("check <url>")
    .description("One-shot HTTP check (no account needed)")
    .option("-m, --method <method>", "HTTP method", "GET")
    .option("-t, --timeout <ms>", "Timeout in milliseconds", String(DEFAULT_TIMEOUT_MS))
    .option("-H, --headers <header...>", "Headers as key:value")
    .option("-b, --body <body>", "Request body (for POST/PUT)")
    .action(async (url: string, options: CheckOptions) => {
      try {
        await executeCheck(url, options);
      } catch (error) {
        handleError(error);
      }
    });
}

async function executeCheck(rawUrl: string, options: CheckOptions): Promise<void> {
  // Normalize URL
  let url = rawUrl;
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = `https://${url}`;
  }

  const method = options.method.toUpperCase();

  // Validate method
  if (!(HTTP_METHODS as readonly string[]).includes(method)) {
    printError(`Invalid HTTP method: ${method}`);
    printError(`Supported: ${HTTP_METHODS.join(", ")}`);
    process.exit(1);
  }

  const timeout = parseInt(options.timeout, 10);
  if (isNaN(timeout) || timeout <= 0) {
    printError("Timeout must be a positive number.");
    process.exit(1);
  }

  // Parse headers
  const headers: Record<string, string> = {};
  if (options.headers) {
    for (const header of options.headers) {
      const colonIndex = header.indexOf(":");
      if (colonIndex === -1) {
        printError(`Invalid header format: "${header}". Use key:value format.`);
        process.exit(1);
      }
      const key = header.substring(0, colonIndex).trim();
      const value = header.substring(colonIndex + 1).trim();
      headers[key] = value;
    }
  }

  const spinner = createSpinner(`Checking ${chalk.cyan(url)}...`);

  const startTime = performance.now();
  let response: Response;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    response = await fetch(url, {
      method,
      headers: Object.keys(headers).length > 0 ? headers : undefined,
      body: options.body ?? undefined,
      signal: controller.signal,
      redirect: "follow",
    });

    clearTimeout(timeoutId);
  } catch (error) {
    const elapsed = performance.now() - startTime;
    spinner.stop();

    console.log();
    console.log(`  ${chalk.red("✗")} ${chalk.bold(url)}`);
    console.log();

    if (error instanceof Error) {
      if (error.name === "AbortError") {
        printError(`Request timed out after ${formatMs(timeout)}`);
      } else if (
        error.message.includes("ENOTFOUND") ||
        error.message.includes("getaddrinfo")
      ) {
        printError(`DNS lookup failed — could not resolve host`);
      } else if (error.message.includes("ECONNREFUSED")) {
        printError(`Connection refused`);
      } else if (
        error.message.includes("certificate") ||
        error.message.includes("SSL") ||
        error.message.includes("CERT")
      ) {
        printError(`SSL/TLS error: ${error.message}`);
      } else {
        printError(error.message);
      }
    } else {
      printError("Unknown error occurred");
    }

    console.log(`  ${chalk.dim(`Time: ${formatMs(elapsed)}`)}`);
    console.log();
    process.exit(1);
  }

  const elapsed = performance.now() - startTime;
  spinner.stop();

  // Determine display properties
  const statusCode = response.status;
  const isSuccess = statusCode >= 200 && statusCode < 300;
  const isRedirect = statusCode >= 300 && statusCode < 400;

  const icon = isSuccess
    ? chalk.green("✓")
    : isRedirect
      ? chalk.yellow("→")
      : chalk.red("✗");

  const statusStr = statusColor(statusCode);

  // Response time color
  let timeStr: string;
  if (elapsed < 200) timeStr = chalk.green(formatMs(elapsed));
  else if (elapsed < 500) timeStr = chalk.yellow(formatMs(elapsed));
  else timeStr = chalk.red(formatMs(elapsed));

  // Print results
  console.log();
  console.log(`  ${icon} ${chalk.bold(url)}`);
  console.log();
  console.log(`  ${chalk.dim("Status:")}     ${statusStr} ${chalk.dim(response.statusText)}`);
  console.log(`  ${chalk.dim("Time:")}       ${timeStr}`);
  console.log(`  ${chalk.dim("Method:")}     ${method}`);

  // Headers
  console.log();
  console.log(`  ${chalk.dim("Headers:")}`);

  const allHeaders: Array<[string, string]> = [];
  for (const [key, value] of response.headers.entries()) {
    allHeaders.push([key, value]);
  }

  // Sort: priority headers first
  allHeaders.sort((a, b) => {
    const aP = PRIORITY_HEADERS.has(a[0].toLowerCase()) ? 0 : 1;
    const bP = PRIORITY_HEADERS.has(b[0].toLowerCase()) ? 0 : 1;
    return aP - bP;
  });

  const maxHeaders = Math.min(allHeaders.length, 10);
  for (let i = 0; i < maxHeaders; i++) {
    const entry = allHeaders[i];
    if (entry) {
      console.log(`    ${chalk.dim(entry[0] + ":")} ${entry[1]}`);
    }
  }

  if (allHeaders.length > maxHeaders) {
    console.log(`    ${chalk.dim(`... and ${allHeaders.length - maxHeaders} more`)}`);
  }

  if (allHeaders.length === 0) {
    console.log(`    ${chalk.dim("(none)")}`);
  }

  console.log();

  if (!isSuccess && !isRedirect) {
    process.exit(1);
  }
}
