// ============================================================
// apimon add <url> — Add a new monitor
// ============================================================

import type { Command } from "commander";
import { input, select } from "@inquirer/prompts";
import type { CreateMonitorRequest } from "@apimon/shared";
import { CHECK_INTERVALS, DEFAULT_TIMEOUT_MS, HTTP_METHODS } from "@apimon/shared";
import {
  printSuccess,
  printHeader,
  createSpinner,
  handleError,
  formatIntervalLong,
  chalk,
} from "../output.js";
import { createAuthenticatedClient } from "../api-client.js";

interface AddOptions {
  name?: string;
  method?: string;
  interval?: string;
  expectedStatus?: string;
  timeout?: string;
}

export function registerAddCommand(program: Command): void {
  program
    .command("add <url>")
    .description("Add a new monitor")
    .option("-n, --name <name>", "Monitor name")
    .option("-m, --method <method>", "HTTP method")
    .option("-i, --interval <seconds>", "Check interval in seconds")
    .option("-s, --expected-status <code>", "Expected HTTP status code")
    .option("-t, --timeout <ms>", "Timeout in milliseconds")
    .action(async (url: string, options: AddOptions) => {
      try {
        await executeAdd(url, options);
      } catch (error) {
        handleError(error);
      }
    });
}

async function executeAdd(rawUrl: string, options: AddOptions): Promise<void> {
  // Normalize URL
  let url = rawUrl;
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = `https://${url}`;
  }

  printHeader(`Add Monitor`);

  const client = createAuthenticatedClient();

  // Determine if we need interactive mode
  const isInteractive = !options.name;

  let name: string;
  let method: string;
  let interval: number;
  let expectedStatus: number;
  let timeout: number;

  if (isInteractive) {
    // Extract hostname for default name
    let defaultName = "My Monitor";
    try {
      defaultName = new URL(url).hostname;
    } catch {
      // Use fallback
    }

    console.log(`  ${chalk.dim("URL:")} ${chalk.cyan(url)}`);
    console.log();

    name = await input({
      message: "Monitor name:",
      default: defaultName,
    });

    method = await select({
      message: "HTTP method:",
      choices: HTTP_METHODS.map((m) => ({ name: m, value: m })),
      default: "GET",
    });

    interval = await select({
      message: "Check interval:",
      choices: [
        { name: "30 seconds", value: CHECK_INTERVALS.THIRTY_SECONDS },
        { name: "1 minute", value: CHECK_INTERVALS.ONE_MINUTE },
        { name: "5 minutes", value: CHECK_INTERVALS.FIVE_MINUTES },
        { name: "15 minutes", value: CHECK_INTERVALS.FIFTEEN_MINUTES },
        { name: "30 minutes", value: CHECK_INTERVALS.THIRTY_MINUTES },
        { name: "1 hour", value: CHECK_INTERVALS.ONE_HOUR },
      ],
      default: CHECK_INTERVALS.FIVE_MINUTES,
    });

    const statusStr = await input({
      message: "Expected status code:",
      default: "200",
    });
    expectedStatus = parseInt(statusStr, 10);

    const timeoutStr = await input({
      message: "Timeout (ms):",
      default: String(DEFAULT_TIMEOUT_MS),
    });
    timeout = parseInt(timeoutStr, 10);
  } else {
    // Non-interactive: use flags with defaults
    name = options.name ?? "Monitor";
    method = (options.method ?? "GET").toUpperCase();
    interval = options.interval ? parseInt(options.interval, 10) : 300;
    expectedStatus = options.expectedStatus ? parseInt(options.expectedStatus, 10) : 200;
    timeout = options.timeout ? parseInt(options.timeout, 10) : DEFAULT_TIMEOUT_MS;
  }

  const spinner = createSpinner("Creating monitor...");

  const data: CreateMonitorRequest = {
    name,
    url,
    method: method as CreateMonitorRequest["method"],
    headers: {},
    checkIntervalSeconds: interval,
    expectedStatus,
    timeoutMs: timeout,
    isActive: true,
  };

  const monitor = await client.createMonitor(data);

  spinner.succeed("Monitor created");

  console.log();
  printSuccess(
    `Monitor added: ${chalk.bold(monitor.name)} (checking every ${formatIntervalLong(interval)})`
  );
  console.log(`  ${chalk.dim("ID:")} ${monitor.id}`);
  console.log(`  ${chalk.dim("URL:")} ${chalk.cyan(monitor.url)}`);
  console.log();
}
