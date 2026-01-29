// ============================================================
// apimon Worker — Alert Dispatcher
// ============================================================
//
// Sends alerts to configured channels when incidents are
// created or resolved. Supports: Telegram, Slack, Discord,
// Email (Resend), and custom Webhooks.
// ============================================================

import { eq } from "drizzle-orm";
import { alertChannels, alertHistory, monitors } from "@apimon/db";
import type { Database } from "@apimon/db";
import type { Monitor } from "@apimon/shared";

// ────────────────────────────────────────────────────────────
// Alert Dispatch — Incident Created
// ────────────────────────────────────────────────────────────

/**
 * Send down alerts to all configured channels for the monitor's user.
 */
export async function dispatchAlerts(
  db: Database,
  monitor: Monitor,
  incidentId: string,
  errorMessage: string | null,
): Promise<void> {
  const channels = await db.query.alertChannels.findMany({
    where: eq(alertChannels.userId, monitor.userId),
  });

  if (channels.length === 0) {
    console.log(`[Alerts] No channels configured for user ${monitor.userId}`);
    return;
  }

  const message = formatDownAlert(monitor, errorMessage);

  for (const channel of channels) {
    await sendAlert(db, channel, monitor, incidentId, message, "down");
  }
}

// ────────────────────────────────────────────────────────────
// Alert Dispatch — Incident Resolved
// ────────────────────────────────────────────────────────────

/**
 * Send recovery alerts to all configured channels for the monitor's user.
 */
export async function dispatchRecoveryAlerts(
  db: Database,
  monitor: Monitor,
  incidentId: string,
): Promise<void> {
  const channels = await db.query.alertChannels.findMany({
    where: eq(alertChannels.userId, monitor.userId),
  });

  if (channels.length === 0) return;

  const message = formatRecoveryAlert(monitor);

  for (const channel of channels) {
    await sendAlert(db, channel, monitor, incidentId, message, "recovery");
  }
}

// ────────────────────────────────────────────────────────────
// Channel-Specific Senders
// ────────────────────────────────────────────────────────────

interface ChannelRecord {
  id: string;
  type: string;
  config: Record<string, unknown>;
}

async function sendAlert(
  db: Database,
  channel: ChannelRecord,
  monitor: Monitor,
  incidentId: string,
  message: string,
  alertType: "down" | "recovery",
): Promise<void> {
  let status: "sent" | "failed" = "sent";

  try {
    const config = channel.config as Record<string, string>;

    switch (channel.type) {
      case "telegram":
        await sendTelegram(config, message, alertType);
        break;
      case "slack":
        await sendSlack(config, message, monitor, alertType);
        break;
      case "discord":
        await sendDiscord(config, message, monitor, alertType);
        break;
      case "email":
        await sendEmail(config, message, monitor, alertType);
        break;
      case "webhook":
        await sendWebhook(config, monitor, incidentId, alertType, message);
        break;
      default:
        console.warn(`[Alerts] Unknown channel type: ${channel.type}`);
        status = "failed";
    }
  } catch (err) {
    status = "failed";
    const errMsg = err instanceof Error ? err.message : "Unknown error";
    console.error(`[Alerts] Failed to send ${channel.type} alert: ${errMsg}`);
  }

  // Log to alert_history
  await db.insert(alertHistory).values({
    monitorId: monitor.id,
    channelId: channel.id,
    incidentId,
    message,
    status,
  });
}

// ── Telegram ──
async function sendTelegram(
  config: Record<string, string>,
  message: string,
  alertType: "down" | "recovery",
): Promise<void> {
  const botToken = process.env["TELEGRAM_BOT_TOKEN"];
  if (!botToken) throw new Error("TELEGRAM_BOT_TOKEN not set");

  const chatId = config["chatId"];
  if (!chatId) throw new Error("chatId not configured");

  const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: "HTML",
    }),
  });

  if (!res.ok) {
    throw new Error(`Telegram API error: ${res.status} ${await res.text()}`);
  }
}

// ── Slack ──
async function sendSlack(
  config: Record<string, string>,
  message: string,
  monitor: Monitor,
  alertType: "down" | "recovery",
): Promise<void> {
  const webhookUrl = config["webhookUrl"];
  if (!webhookUrl) throw new Error("webhookUrl not configured");

  const color = alertType === "down" ? "#dc2626" : "#16a34a";
  const title = alertType === "down" ? "🔴 Monitor Down" : "🟢 Monitor Recovered";

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      blocks: [
        {
          type: "header",
          text: { type: "plain_text", text: title },
        },
        {
          type: "section",
          fields: [
            { type: "mrkdwn", text: `*Monitor:*\n${monitor.name}` },
            { type: "mrkdwn", text: `*URL:*\n${monitor.url}` },
          ],
        },
        {
          type: "section",
          text: { type: "mrkdwn", text: message },
        },
      ],
      attachments: [{ color, text: "" }],
    }),
  });

  if (!res.ok) {
    throw new Error(`Slack webhook error: ${res.status}`);
  }
}

// ── Discord ──
async function sendDiscord(
  config: Record<string, string>,
  message: string,
  monitor: Monitor,
  alertType: "down" | "recovery",
): Promise<void> {
  const webhookUrl = config["webhookUrl"];
  if (!webhookUrl) throw new Error("webhookUrl not configured");

  const color = alertType === "down" ? 0xdc2626 : 0x16a34a;
  const title = alertType === "down" ? "🔴 Monitor Down" : "🟢 Monitor Recovered";

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      embeds: [
        {
          title,
          description: message,
          color,
          fields: [
            { name: "Monitor", value: monitor.name, inline: true },
            { name: "URL", value: monitor.url, inline: true },
          ],
          timestamp: new Date().toISOString(),
        },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`Discord webhook error: ${res.status}`);
  }
}

// ── Email (Resend) ──
async function sendEmail(
  config: Record<string, string>,
  message: string,
  monitor: Monitor,
  alertType: "down" | "recovery",
): Promise<void> {
  const apiKey = process.env["RESEND_API_KEY"];
  if (!apiKey) throw new Error("RESEND_API_KEY not set");

  const email = config["email"];
  if (!email) throw new Error("email not configured");

  const subject =
    alertType === "down"
      ? `🔴 DOWN: ${monitor.name} is not responding`
      : `🟢 RECOVERED: ${monitor.name} is back up`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: "apimon <alerts@apimon.dev>",
      to: [email],
      subject,
      text: message,
    }),
  });

  if (!res.ok) {
    throw new Error(`Resend API error: ${res.status} ${await res.text()}`);
  }
}

// ── Custom Webhook ──
async function sendWebhook(
  config: Record<string, string>,
  monitor: Monitor,
  incidentId: string,
  alertType: "down" | "recovery",
  message: string,
): Promise<void> {
  const url = config["url"];
  if (!url) throw new Error("url not configured");

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "apimon-webhook/1.0",
    },
    body: JSON.stringify({
      type: alertType,
      monitor: {
        id: monitor.id,
        name: monitor.name,
        url: monitor.url,
      },
      incidentId,
      message,
      timestamp: new Date().toISOString(),
    }),
  });

  if (!res.ok) {
    throw new Error(`Webhook error: ${res.status}`);
  }
}

// ────────────────────────────────────────────────────────────
// Message Formatting
// ────────────────────────────────────────────────────────────

function formatDownAlert(monitor: Monitor, errorMessage: string | null): string {
  return [
    `🔴 <b>Monitor DOWN</b>`,
    ``,
    `<b>Name:</b> ${monitor.name}`,
    `<b>URL:</b> ${monitor.url}`,
    `<b>Error:</b> ${errorMessage ?? "Unknown error"}`,
    `<b>Time:</b> ${new Date().toISOString()}`,
    ``,
    `This monitor has failed ${CONSECUTIVE_FAILURES_STR} consecutive checks.`,
  ].join("\n");
}

function formatRecoveryAlert(monitor: Monitor): string {
  return [
    `🟢 <b>Monitor RECOVERED</b>`,
    ``,
    `<b>Name:</b> ${monitor.name}`,
    `<b>URL:</b> ${monitor.url}`,
    `<b>Time:</b> ${new Date().toISOString()}`,
    ``,
    `The monitor is responding normally again.`,
  ].join("\n");
}

const CONSECUTIVE_FAILURES_STR = "3";
