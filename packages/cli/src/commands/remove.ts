// ============================================================
// apimon remove <id> — Remove a monitor
// ============================================================

import type { Command } from "commander";
import { confirm } from "@inquirer/prompts";
import {
  printSuccess,
  createSpinner,
  handleError,
  chalk,
} from "../output.js";
import { createAuthenticatedClient } from "../api-client.js";

interface RemoveOptions {
  force?: boolean;
}

export function registerRemoveCommand(program: Command): void {
  program
    .command("remove <id>")
    .description("Remove a monitor")
    .option("-f, --force", "Skip confirmation prompt")
    .action(async (id: string, options: RemoveOptions) => {
      try {
        await executeRemove(id, options);
      } catch (error) {
        handleError(error);
      }
    });
}

async function executeRemove(id: string, options: RemoveOptions): Promise<void> {
  const client = createAuthenticatedClient();

  // Fetch monitor info first
  const spinner = createSpinner("Fetching monitor...");
  const monitor = await client.getMonitor(id);
  spinner.stop();

  console.log();
  console.log(`  ${chalk.dim("Monitor:")} ${chalk.bold(monitor.name)}`);
  console.log(`  ${chalk.dim("URL:")}     ${chalk.cyan(monitor.url)}`);
  console.log();

  // Confirm unless --force
  if (!options.force) {
    const confirmed = await confirm({
      message: "Are you sure you want to remove this monitor?",
      default: false,
    });

    if (!confirmed) {
      console.log();
      console.log(`  ${chalk.dim("Cancelled.")}`);
      console.log();
      return;
    }
  }

  const deleteSpinner = createSpinner("Removing monitor...");
  await client.deleteMonitor(id);
  deleteSpinner.succeed("Monitor removed");

  console.log();
  printSuccess(`Monitor removed: ${chalk.bold(monitor.name)}`);
  console.log();
}
