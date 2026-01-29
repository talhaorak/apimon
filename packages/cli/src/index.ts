#!/usr/bin/env node
// ============================================================
// apimon CLI — CLI-first API Monitoring & Alerting
// ============================================================

import { Command } from "commander";
import { registerCheckCommand } from "./commands/check.js";
import { registerInitCommand } from "./commands/init.js";
import { registerLoginCommand } from "./commands/login.js";
import { registerAddCommand } from "./commands/add.js";
import { registerListCommand } from "./commands/list.js";
import { registerStatusCommand } from "./commands/status.js";
import { registerRemoveCommand } from "./commands/remove.js";
import { registerAlertsCommand } from "./commands/alerts.js";

const program = new Command();

program
  .name("apimon")
  .description("CLI-first API Monitoring & Alerting")
  .version("0.1.0", "-v, --version");

// Register all commands
registerCheckCommand(program);
registerInitCommand(program);
registerLoginCommand(program);
registerAddCommand(program);
registerListCommand(program);
registerStatusCommand(program);
registerRemoveCommand(program);
registerAlertsCommand(program);

// Parse and run
await program.parseAsync();

// ── Auto-update check (stub) ──
checkForUpdates().catch(() => {
  /* silently ignore update check failures */
});

async function checkForUpdates(): Promise<void> {
  // TODO: Implement actual version check against npm registry
  // Example:
  //   const res = await fetch("https://registry.npmjs.org/@apimon/cli/latest");
  //   const data = await res.json();
  //   if (data.version !== program.version()) {
  //     console.log(`\n  💡 New version available: ${data.version}`);
  //     console.log(`     Run: npm update -g @apimon/cli\n`);
  //   }
}
