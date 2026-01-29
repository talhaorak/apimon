// ============================================================
// apimon init — Initialize .apimon.yaml config
// ============================================================

import type { Command } from "commander";
import { writeFileSync } from "node:fs";
import { input, select } from "@inquirer/prompts";
import { CHECK_INTERVALS } from "@apimon/shared";
import {
  printSuccess,
  printWarning,
  printHeader,
  handleError,
  chalk,
} from "../output.js";
import { getLocalConfigPath, localConfigExists } from "../config.js";

export function registerInitCommand(program: Command): void {
  program
    .command("init")
    .description("Create .apimon.yaml config file in current directory")
    .action(async () => {
      try {
        await executeInit();
      } catch (error) {
        handleError(error);
      }
    });
}

async function executeInit(): Promise<void> {
  printHeader("Initialize apimon");

  if (localConfigExists()) {
    printWarning(".apimon.yaml already exists in this directory.");
    printWarning("Delete it first if you want to re-initialize.");
    return;
  }

  const apiUrl = await input({
    message: "API server URL:",
    default: "https://api.apimon.dev",
  });

  const defaultInterval = await select({
    message: "Default check interval:",
    choices: [
      { name: "30 seconds", value: CHECK_INTERVALS.THIRTY_SECONDS },
      { name: "1 minute", value: CHECK_INTERVALS.ONE_MINUTE },
      { name: "5 minutes (recommended)", value: CHECK_INTERVALS.FIVE_MINUTES },
      { name: "15 minutes", value: CHECK_INTERVALS.FIFTEEN_MINUTES },
      { name: "30 minutes", value: CHECK_INTERVALS.THIRTY_MINUTES },
      { name: "1 hour", value: CHECK_INTERVALS.ONE_HOUR },
    ],
    default: CHECK_INTERVALS.FIVE_MINUTES,
  });

  // Write config with helpful comments
  const configContent = `# apimon Configuration
# Docs: https://apimon.dev/docs/config

# API server URL
apiUrl: ${apiUrl}

# Default check interval in seconds
# Options: 30, 60, 300, 900, 1800, 3600
defaultInterval: ${defaultInterval}
`;

  const configPath = getLocalConfigPath();
  writeFileSync(configPath, configContent, "utf-8");

  console.log();
  printSuccess(`Config saved to ${chalk.cyan(".apimon.yaml")}`);
  printSuccess(`Run ${chalk.cyan("apimon login")} to authenticate.`);
  console.log();
}
