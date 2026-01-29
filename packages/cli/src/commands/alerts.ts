// ============================================================
// apimon alerts — List configured alert channels
// ============================================================

import type { Command } from "commander";
import {
  printHeader,
  printInfo,
  createTable,
  createSpinner,
  handleError,
  formatDate,
  chalk,
} from "../output.js";
import { createAuthenticatedClient } from "../api-client.js";

export function registerAlertsCommand(program: Command): void {
  program
    .command("alerts")
    .description("List configured alert channels")
    .action(async () => {
      try {
        await executeAlerts();
      } catch (error) {
        handleError(error);
      }
    });
}

async function executeAlerts(): Promise<void> {
  const client = createAuthenticatedClient();

  const spinner = createSpinner("Fetching alert channels...");
  const channels = await client.listAlertChannels();
  spinner.stop();

  if (channels.length === 0) {
    console.log();
    printInfo("No alert channels configured.");
    printInfo(`Set up alerts at ${chalk.cyan("https://apimon.dev/settings/alerts")}`);
    console.log();
    return;
  }

  printHeader(`Alert Channels (${channels.length})`);

  const table = createTable(["Type", "Name", "Verified", "Created"]);

  for (const channel of channels) {
    const verified = channel.isVerified
      ? chalk.green("✓")
      : chalk.red("✗");

    const name = (channel.config as Record<string, unknown>)["name"] as string | undefined;
    const displayName = name ?? chalk.dim("—");

    table.push([
      channel.type,
      displayName,
      verified,
      formatDate(new Date(channel.createdAt)),
    ]);
  }

  console.log(table.toString());
  console.log();
}
