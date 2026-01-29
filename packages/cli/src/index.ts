#!/usr/bin/env node
// ============================================================
// apimon CLI — CLI-first API Monitoring
// ============================================================

import { Command } from "commander";

const program = new Command();

program
  .name("apimon")
  .description("CLI-first API Monitoring & Alerting")
  .version("0.1.0");

program
  .command("check <url>")
  .description("One-shot HTTP check (no account needed)")
  .option("-m, --method <method>", "HTTP method", "GET")
  .option("-t, --timeout <ms>", "Timeout in milliseconds", "30000")
  .action((url: string, options: { method: string; timeout: string }) => {
    console.log(`Checking ${url} (${options.method}, timeout: ${options.timeout}ms)...`);
    // TODO(@backend): Implement HTTP check logic
  });

program
  .command("init")
  .description("Create .apimon.yaml config file")
  .action(() => {
    console.log("Initializing apimon config...");
    // TODO(@backend): Implement config init
  });

program
  .command("login")
  .description("Authenticate with API key")
  .action(() => {
    console.log("Login flow...");
    // TODO(@backend): Implement login
  });

program
  .command("add <url>")
  .description("Add a new monitor")
  .option("-n, --name <name>", "Monitor name")
  .option("-m, --method <method>", "HTTP method", "GET")
  .option("-i, --interval <seconds>", "Check interval in seconds", "300")
  .action((url: string, options: { name?: string; method: string; interval: string }) => {
    console.log(`Adding monitor: ${url}`, options);
    // TODO(@backend): Implement add monitor
  });

program
  .command("list")
  .description("List all monitors")
  .action(() => {
    console.log("Listing monitors...");
    // TODO(@backend): Implement list monitors
  });

program
  .command("status")
  .description("Show current status of all monitors")
  .action(() => {
    console.log("Fetching status...");
    // TODO(@backend): Implement status
  });

program
  .command("remove <id>")
  .description("Remove a monitor")
  .action((id: string) => {
    console.log(`Removing monitor: ${id}`);
    // TODO(@backend): Implement remove
  });

program.parse();
