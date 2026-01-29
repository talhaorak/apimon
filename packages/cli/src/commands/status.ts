// ============================================================
// apimon status [id] — Show monitor status
// ============================================================

import type { Command } from "commander";
import {
  printHeader,
  printDivider,
  createSpinner,
  handleError,
  statusIcon,
  statusText,
  formatMs,
  formatPercent,
  formatIntervalLong,
  timeAgo,
  formatDate,
  chalk,
} from "../output.js";
import { createAuthenticatedClient } from "../api-client.js";

export function registerStatusCommand(program: Command): void {
  program
    .command("status [id]")
    .description("Show status summary or detail for a specific monitor")
    .action(async (id?: string) => {
      try {
        if (id) {
          await executeDetailStatus(id);
        } else {
          await executeSummaryStatus();
        }
      } catch (error) {
        handleError(error);
      }
    });
}

// ── Summary View (no ID) ──

async function executeSummaryStatus(): Promise<void> {
  const client = createAuthenticatedClient();

  const spinner = createSpinner("Fetching status...");
  const stats = await client.getStats();
  spinner.stop();

  console.log();
  console.log(`  ${chalk.bold("apimon — Status Summary")}`);
  console.log();
  printDivider();
  console.log();

  console.log(
    `  ${chalk.green("●")} ${chalk.bold(String(stats.monitorsUp))} monitor${stats.monitorsUp === 1 ? "" : "s"} up`
  );
  console.log(
    `  ${chalk.red("●")} ${chalk.bold(String(stats.monitorsDown))} monitor${stats.monitorsDown === 1 ? "" : "s"} down`
  );
  console.log(
    `  ${chalk.blue("●")} ${chalk.bold(String(stats.totalMonitors))} total monitor${stats.totalMonitors === 1 ? "" : "s"}`
  );

  console.log();
  printDivider();
  console.log();

  console.log(
    `  ${chalk.dim("Avg Response:")}   ${formatMs(stats.avgResponseTimeMs)}`
  );
  console.log(
    `  ${chalk.dim("Overall Uptime:")} ${formatPercent(stats.uptimePercentage)}`
  );
  console.log(
    `  ${chalk.dim("Checks (24h):")}   ${stats.checksLast24h}`
  );
  console.log(
    `  ${chalk.dim("Incidents (24h):")} ${stats.incidentsLast24h}`
  );

  console.log();
}

// ── Detail View (with ID) ──

async function executeDetailStatus(id: string): Promise<void> {
  const client = createAuthenticatedClient();

  const spinner = createSpinner("Fetching monitor details...");
  const detail = await client.getMonitor(id);
  spinner.stop();

  const isUp = detail.lastCheck?.isUp ?? null;
  const statusDisplay =
    isUp === null
      ? chalk.dim("Unknown")
      : `${statusIcon(isUp)} ${statusText(isUp)}`;

  console.log();
  console.log(`  ${chalk.bold(detail.name)}`);
  console.log(`  ${chalk.cyan(detail.url)}`);
  console.log();
  printDivider();
  console.log();

  console.log(`  ${chalk.dim("Status:")}        ${statusDisplay}`);

  if (detail.lastCheck?.checkedAt) {
    const checkedAt = new Date(detail.lastCheck.checkedAt);
    console.log(`  ${chalk.dim("Last Check:")}    ${timeAgo(checkedAt)}`);
  } else {
    console.log(`  ${chalk.dim("Last Check:")}    ${chalk.dim("Never")}`);
  }

  if (detail.uptimePercentage != null) {
    console.log(
      `  ${chalk.dim("Uptime:")}        ${formatPercent(detail.uptimePercentage)}`
    );
  }

  if (detail.lastCheck?.responseTimeMs != null) {
    console.log(
      `  ${chalk.dim("Avg Response:")}  ${formatMs(detail.lastCheck.responseTimeMs)}`
    );
  }

  console.log(`  ${chalk.dim("Method:")}        ${detail.method}`);
  console.log(
    `  ${chalk.dim("Interval:")}      Every ${formatIntervalLong(detail.checkIntervalSeconds)}`
  );
  console.log(
    `  ${chalk.dim("Timeout:")}       ${formatMs(detail.timeoutMs)}`
  );
  console.log(`  ${chalk.dim("Active:")}        ${detail.isActive ? chalk.green("Yes") : chalk.red("No")}`);

  // Recent Incidents
  console.log();
  console.log(`  ${chalk.bold("Recent Incidents")}`);
  printDivider();

  if (detail.activeIncidents.length === 0) {
    console.log();
    console.log(`  ${chalk.green("✓")} No active incidents`);
  } else {
    console.log();
    for (const incident of detail.activeIncidents.slice(0, 5)) {
      const startedAt = new Date(incident.startedAt);
      const state =
        incident.state === "ongoing"
          ? chalk.red("● Ongoing")
          : chalk.green("● Resolved");

      console.log(`  ${state}  ${formatDate(startedAt)}`);

      if (incident.cause) {
        console.log(`    ${chalk.dim(incident.cause)}`);
      }

      if (incident.resolvedAt) {
        const resolvedAt = new Date(incident.resolvedAt);
        const durationMs = resolvedAt.getTime() - startedAt.getTime();
        console.log(`    ${chalk.dim(`Duration: ${formatMs(durationMs)}`)}`);
      }

      console.log();
    }
  }

  console.log();
}
