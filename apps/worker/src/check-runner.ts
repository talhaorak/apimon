// ============================================================
// apimon Worker — Check Runner
// ============================================================
//
// Executes HTTP checks against monitors, records results,
// and triggers incident detection.
// ============================================================

import { eq, and, desc } from "drizzle-orm";
import { monitors, checks, incidents } from "@apimon/db";
import type { Database } from "@apimon/db";
import {
  DEFAULT_REGION,
  CONSECUTIVE_FAILURES_THRESHOLD,
  MAX_RESPONSE_BODY_BYTES,
} from "@apimon/shared";
import type { Monitor } from "@apimon/shared";
import { dispatchAlerts, dispatchRecoveryAlerts } from "./alerts.js";

/**
 * Run an HTTP check for a single monitor.
 * - Makes the HTTP request with configured method, headers, body, timeout
 * - Measures response time
 * - Validates status code
 * - Saves the check result to DB
 * - Detects incidents (3+ consecutive failures)
 */
export async function runCheck(db: Database, monitor: Monitor): Promise<void> {
  const startTime = Date.now();
  let statusCode: number | null = null;
  let responseTimeMs: number | null = null;
  let isUp = false;
  let errorMessage: string | null = null;
  let responseBody: string | null = null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), monitor.timeoutMs);

    const response = await fetch(monitor.url, {
      method: monitor.method,
      headers: monitor.headers ?? undefined,
      body: monitor.method !== "GET" && monitor.method !== "HEAD" ? monitor.body : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    responseTimeMs = Date.now() - startTime;
    statusCode = response.status;
    isUp = statusCode === monitor.expectedStatus;

    // Capture truncated response body for debugging
    try {
      const text = await response.text();
      responseBody = text.slice(0, MAX_RESPONSE_BODY_BYTES);
    } catch {
      // Ignore body read errors
    }

    if (!isUp) {
      errorMessage = `Expected status ${monitor.expectedStatus}, got ${statusCode}`;
    }
  } catch (err) {
    responseTimeMs = Date.now() - startTime;
    isUp = false;

    if (err instanceof DOMException && err.name === "AbortError") {
      errorMessage = `Timeout after ${monitor.timeoutMs}ms`;
    } else if (err instanceof TypeError) {
      errorMessage = `Network error: ${err.message}`;
    } else if (err instanceof Error) {
      errorMessage = err.message;
    } else {
      errorMessage = "Unknown error";
    }
  }

  // ── Save check result ──
  await db.insert(checks).values({
    monitorId: monitor.id,
    statusCode,
    responseTimeMs,
    isUp,
    errorMessage,
    responseBody,
    region: DEFAULT_REGION,
  });

  // ── Incident Detection ──
  await detectIncident(db, monitor, isUp, errorMessage);

  const status = isUp ? "✅ UP" : "❌ DOWN";
  console.log(
    `[Check] ${monitor.name} (${monitor.url}) — ${status} — ${responseTimeMs}ms — ${statusCode ?? "N/A"}`,
  );
}

/**
 * Detect and manage incidents based on consecutive check failures.
 *
 * Rules:
 * - 3+ consecutive failures → create a new incident
 * - Recovery after incident → resolve the incident
 */
async function detectIncident(
  db: Database,
  monitor: Monitor,
  isUp: boolean,
  errorMessage: string | null,
): Promise<void> {
  // Get the last N checks to determine consecutive failures
  const recentChecks = await db.query.checks.findMany({
    where: eq(checks.monitorId, monitor.id),
    orderBy: [desc(checks.checkedAt)],
    limit: CONSECUTIVE_FAILURES_THRESHOLD,
  });

  // Find any active (ongoing) incident for this monitor
  const activeIncident = await db.query.incidents.findFirst({
    where: and(
      eq(incidents.monitorId, monitor.id),
      eq(incidents.state, "ongoing"),
    ),
  });

  if (isUp && activeIncident) {
    // ── Recovery: resolve the active incident ──
    await db
      .update(incidents)
      .set({
        state: "resolved",
        resolvedAt: new Date(),
      })
      .where(eq(incidents.id, activeIncident.id));

    console.log(`[Incident] RESOLVED — ${monitor.name} is back up`);

    // Dispatch recovery alerts
    await dispatchRecoveryAlerts(db, monitor, activeIncident.id);
    return;
  }

  if (!isUp && !activeIncident) {
    // Check if we have N consecutive failures
    const allFailed =
      recentChecks.length >= CONSECUTIVE_FAILURES_THRESHOLD &&
      recentChecks.every((check) => !check.isUp);

    if (allFailed) {
      // ── New Incident ──
      const result = await db
        .insert(incidents)
        .values({
          monitorId: monitor.id,
          state: "ongoing",
          cause: errorMessage ?? "Multiple consecutive check failures",
        })
        .returning();

      const incident = result[0];
      if (!incident) return;

      console.log(`[Incident] CREATED — ${monitor.name} is DOWN: ${errorMessage}`);

      // Dispatch alerts
      await dispatchAlerts(db, monitor, incident.id, errorMessage);
    }
  }
}
