// ============================================================
// apimon Worker — Monitor Check Engine
// ============================================================

import { DEFAULT_TIMEOUT_MS, CONSECUTIVE_FAILURES_THRESHOLD, DEFAULT_REGION } from "@apimon/shared";

console.log("🔧 apimon worker starting...");
console.log(`   Default timeout: ${DEFAULT_TIMEOUT_MS}ms`);
console.log(`   Failure threshold: ${CONSECUTIVE_FAILURES_THRESHOLD} consecutive`);
console.log(`   Region: ${DEFAULT_REGION}`);
console.log("");
console.log("⏳ Worker is ready. Waiting for check jobs...");

// TODO(@backend): Initialize BullMQ worker
// TODO(@backend): Implement check runner
// TODO(@backend): Implement incident detection
// TODO(@backend): Implement alert dispatch

// Keep process alive
setInterval(() => {
  // Heartbeat — worker is alive
}, 60_000);
