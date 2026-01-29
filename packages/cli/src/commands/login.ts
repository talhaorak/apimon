// ============================================================
// apimon login — Authenticate with API key
// ============================================================

import type { Command } from "commander";
import { password } from "@inquirer/prompts";
import {
  printSuccess,
  printHeader,
  printInfo,
  createSpinner,
  handleError,
  chalk,
} from "../output.js";
import { getApiUrl, updateGlobalConfig, getGlobalConfigPath } from "../config.js";
import { ApiClient } from "../api-client.js";

interface LoginOptions {
  key?: string;
}

export function registerLoginCommand(program: Command): void {
  program
    .command("login")
    .description("Authenticate with your API key")
    .option("-k, --key <key>", "API key (or will prompt)")
    .action(async (options: LoginOptions) => {
      try {
        await executeLogin(options);
      } catch (error) {
        handleError(error);
      }
    });
}

async function executeLogin(options: LoginOptions): Promise<void> {
  printHeader("Login to apimon");

  let apiKey = options.key;

  if (!apiKey) {
    printInfo(`Get your API key from ${chalk.cyan("https://apimon.dev/settings/api-keys")}`);
    console.log();

    apiKey = await password({
      message: "API key:",
      mask: "•",
    });
  }

  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error("API key cannot be empty.");
  }

  apiKey = apiKey.trim();

  // Validate key against API
  const spinner = createSpinner("Validating API key...");

  const client = new ApiClient(getApiUrl(), apiKey);
  const user = await client.validateKey();

  spinner.succeed("API key validated");

  // Save to global config
  updateGlobalConfig({ apiKey });

  console.log();
  printSuccess(`Authenticated as ${chalk.bold(user.email)}`);
  printInfo(`Config saved to ${chalk.dim(getGlobalConfigPath())}`);
  console.log();
}
