// ============================================================
// apimon Worker — Check Scheduler
// ============================================================
//
// Manages scheduling of HTTP checks for all active monitors.
// Groups monitors by interval to reduce overhead.
// Staggers initial checks to avoid thundering herd.
// ============================================================

import { eq } from "drizzle-orm";
import { monitors } from "@apimon/db";
import type { Database } from "@apimon/db";
import type { Monitor } from "@apimon/shared";
import { runCheck } from "./check-runner.js";

/** Active interval timers, keyed by interval in seconds */
const intervalTimers = new Map<number, ReturnType<typeof setInterval>>();

/** Tracks monitors per interval group */
const monitorGroups = new Map<number, Set<string>>();

/** Cache of monitor data, keyed by monitor ID */
const monitorCache = new Map<string, Monitor>();

/**
 * Start the scheduler: load all active monitors and schedule checks.
 */
export async function startScheduler(db: Database): Promise<void> {
  console.log("[Scheduler] Loading active monitors...");

  const activeMonitors = await db.query.monitors.findMany({
    where: eq(monitors.isActive, true),
  });

  console.log(`[Scheduler] Found ${activeMonitors.length} active monitors`);

  if (activeMonitors.length === 0) {
    console.log("[Scheduler] No active monitors. Waiting for refresh...");
    // Still set up the refresh interval
    scheduleRefresh(db);
    return;
  }

  // Group monitors by interval
  for (const monitor of activeMonitors) {
    addMonitorToSchedule(monitor as Monitor);
  }

  // Start interval timers for each group, staggered
  let staggerIndex = 0;
  for (const [interval, monitorIds] of monitorGroups.entries()) {
    const staggerMs = staggerIndex * 1000; // Stagger by 1 second per group
    staggerIndex++;

    console.log(
      `[Scheduler] Scheduling ${monitorIds.size} monitors at ${interval}s interval (stagger: ${staggerMs}ms)`,
    );

    // Stagger the first run
    setTimeout(() => {
      // Run immediately for the first time
      runGroupChecks(db, interval);

      // Then set up the recurring interval
      const timer = setInterval(() => {
        runGroupChecks(db, interval);
      }, interval * 1000);

      intervalTimers.set(interval, timer);
    }, staggerMs);
  }

  // Periodically refresh monitor list (every 60s)
  scheduleRefresh(db);
}

/**
 * Stop all scheduled checks.
 */
export function stopScheduler(): void {
  console.log("[Scheduler] Stopping all timers...");
  for (const [interval, timer] of intervalTimers.entries()) {
    clearInterval(timer);
    console.log(`[Scheduler] Stopped ${interval}s timer`);
  }
  intervalTimers.clear();
  monitorGroups.clear();
  monitorCache.clear();
}

/**
 * Add a monitor to the schedule groups and cache.
 */
function addMonitorToSchedule(monitor: Monitor): void {
  monitorCache.set(monitor.id, monitor);

  const interval = monitor.checkIntervalSeconds;
  if (!monitorGroups.has(interval)) {
    monitorGroups.set(interval, new Set());
  }
  monitorGroups.get(interval)!.add(monitor.id);
}

/**
 * Run checks for all monitors in a given interval group.
 */
async function runGroupChecks(db: Database, interval: number): Promise<void> {
  const monitorIds = monitorGroups.get(interval);
  if (!monitorIds || monitorIds.size === 0) return;

  const checkPromises: Promise<void>[] = [];

  for (const monitorId of monitorIds) {
    const monitor = monitorCache.get(monitorId);
    if (!monitor) continue;

    // Run checks concurrently but don't let one failure block others
    checkPromises.push(
      runCheck(db, monitor).catch((err) => {
        const errMsg = err instanceof Error ? err.message : "Unknown error";
        console.error(`[Scheduler] Check failed for ${monitor.name}: ${errMsg}`);
      }),
    );
  }

  await Promise.allSettled(checkPromises);
}

/**
 * Periodically refresh the monitor list from DB.
 * Handles new monitors, deleted monitors, and changed intervals.
 */
function scheduleRefresh(db: Database): void {
  setInterval(async () => {
    try {
      const activeMonitors = await db.query.monitors.findMany({
        where: eq(monitors.isActive, true),
      });

      const currentIds = new Set(monitorCache.keys());
      const newIds = new Set(activeMonitors.map((m) => m.id));

      // Add new monitors
      for (const monitor of activeMonitors) {
        if (!currentIds.has(monitor.id)) {
          console.log(`[Scheduler] New monitor detected: ${monitor.name}`);
          addMonitorToSchedule(monitor as Monitor);
          ensureIntervalTimer(db, monitor.checkIntervalSeconds);
        } else {
          // Update cache with latest data
          monitorCache.set(monitor.id, monitor as Monitor);
        }
      }

      // Remove deleted/deactivated monitors
      for (const id of currentIds) {
        if (!newIds.has(id)) {
          const monitor = monitorCache.get(id);
          console.log(`[Scheduler] Monitor removed: ${monitor?.name ?? id}`);
          monitorCache.delete(id);

          // Remove from interval group
          for (const [, group] of monitorGroups.entries()) {
            group.delete(id);
          }
        }
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Unknown error";
      console.error(`[Scheduler] Refresh failed: ${errMsg}`);
    }
  }, 60_000); // Refresh every 60 seconds
}

/**
 * Ensure an interval timer exists for the given interval.
 */
function ensureIntervalTimer(db: Database, interval: number): void {
  if (intervalTimers.has(interval)) return;

  console.log(`[Scheduler] Creating new timer for ${interval}s interval`);

  const timer = setInterval(() => {
    runGroupChecks(db, interval);
  }, interval * 1000);

  intervalTimers.set(interval, timer);

  // Run the first check immediately for the new group
  runGroupChecks(db, interval);
}
