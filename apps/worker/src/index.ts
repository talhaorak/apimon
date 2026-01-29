// ============================================================
// apimon Worker — Monitor Check Engine
// ============================================================
//
// Entry point for the monitoring worker. Initializes the
// database connection, starts the check scheduler, and
// exposes a health check HTTP endpoint on port 3002.
// ============================================================

import { createServer } from "node:http";
import { createDb } from "@apimon/db";
import {
  DEFAULT_TIMEOUT_MS,
  CONSECUTIVE_FAILURES_THRESHOLD,
  DEFAULT_REGION,
} from "@apimon/shared";
import { startScheduler, stopScheduler } from "./scheduler.js";

async function main(): Promise<void> {
  console.log("🔧 apimon worker starting...");
  console.log(`   Default timeout: ${DEFAULT_TIMEOUT_MS}ms`);
  console.log(`   Failure threshold: ${CONSECUTIVE_FAILURES_THRESHOLD} consecutive`);
  console.log(`   Region: ${DEFAULT_REGION}`);
  console.log("");

  // ── Initialize Database ──
  const db = createDb();
  console.log("✅ Database connected");

  // ── Start Scheduler ──
  await startScheduler(db);
  console.log("✅ Scheduler started");

  // ── Health Check HTTP Endpoint ──
  const healthPort = Number(process.env["WORKER_PORT"] ?? 3002);

  const server = createServer((req, res) => {
    if (req.url === "/health" && req.method === "GET") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          status: "ok",
          service: "apimon-worker",
          timestamp: new Date().toISOString(),
        }),
      );
    } else {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Not found", code: "NOT_FOUND" }));
    }
  });

  server.listen(healthPort, () => {
    console.log(`🩺 Health check endpoint: http://localhost:${healthPort}/health`);
    console.log("");
    console.log("🚀 apimon worker is running!");
  });

  // ── Graceful Shutdown ──
  const shutdown = () => {
    console.log("\n⏹️  Shutting down worker...");
    stopScheduler();
    server.close();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error("❌ Worker failed to start:", err);
  process.exit(1);
});
