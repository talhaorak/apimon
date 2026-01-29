// ============================================================
// apimon list — List all monitors
// ============================================================

import type { Command } from "commander";
import {
  printHeader,
  printInfo,
  createTable,
  createSpinner,
  handleError,
  statusIcon,
  statusText,
  formatMs,
  formatPercent,
  truncate,
  chalk,
} from "../output.js";
import { createAuthenticatedClient } from "../api-client.js";

interface ListOptions {
  json?: boolean;
  status?: string;
}

export function registerListCommand(program: Command): void {
  program
    .command("list")
    .description("List all monitors")
    .option("--json", "Output as JSON")
    .option("--status <status>", "Filter by status: up, down, all", "all")
    .action(async (options: ListOptions) => {
      try {
        await executeList(options);
      } catch (error) {
        handleError(error);
      }
    });
}

async function executeList(options: ListOptions): Promise<void> {
  const client = createAuthenticatedClient();

  const spinner = createSpinner("Fetching monitors...");
  const monitors = await client.listMonitors(options.status);
  spinner.stop();

  // JSON output
  if (options.json) {
    console.log(JSON.stringify(monitors, null, 2));
    return;
  }

  if (monitors.length === 0) {
    console.log();
    printInfo("No monitors found.");
    printInfo(`Run ${chalk.cyan("apimon add <url>")} to create one.`);
    console.log();
    return;
  }

  printHeader(`Your Monitors (${monitors.length} total)`);

  const table = createTable([
    "ID",
    "Name",
    "URL",
    "Status",
    "Uptime",
    "Resp Time",
  ]);

  for (const monitor of monitors) {
    const isUp = monitor.lastCheck?.isUp ?? null;
    const status =
      isUp === null
        ? chalk.dim("—")
        : `${statusIcon(isUp)} ${statusText(isUp)}`;

    const uptime =
      monitor.uptimePercentage != null
        ? formatPercent(monitor.uptimePercentage)
        : chalk.dim("—");

    const respTime =
      monitor.lastCheck?.responseTimeMs != null
        ? formatMs(monitor.lastCheck.responseTimeMs)
        : chalk.dim("—");

    table.push([
      chalk.dim(monitor.id.substring(0, 8)),
      truncate(monitor.name, 20),
      truncate(monitor.url, 35),
      status,
      uptime,
      respTime,
    ]);
  }

  console.log(table.toString());
  console.log();
}
