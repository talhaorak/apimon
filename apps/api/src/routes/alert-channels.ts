// ============================================================
// apimon API — Alert Channel Routes
// ============================================================

import { Hono } from "hono";
import { eq, and, desc } from "drizzle-orm";
import { alertChannels } from "@apimon/db";
import { CreateAlertChannelSchema } from "@apimon/shared";
import type { AppEnv } from "../lib/types.js";
import { authMiddleware } from "../middleware/auth.js";

const app = new Hono<AppEnv>();

app.use("*", authMiddleware);

// ── POST /alert-channels — Create an alert channel ──
app.post("/", async (c) => {
  const db = c.get("db");
  const userId = c.get("userId");

  const body = await c.req.json().catch(() => null);
  if (!body) {
    return c.json({ error: "Invalid JSON body", code: "INVALID_BODY" }, 400);
  }

  const parsed = CreateAlertChannelSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      { error: "Validation failed", code: "VALIDATION_ERROR", details: parsed.error.flatten() },
      400,
    );
  }

  const [channel] = await db
    .insert(alertChannels)
    .values({
      userId,
      type: parsed.data.type,
      config: parsed.data.config,
      isVerified: false,
    })
    .returning();

  return c.json(channel, 201);
});

// ── GET /alert-channels — List all alert channels for the user ──
app.get("/", async (c) => {
  const db = c.get("db");
  const userId = c.get("userId");

  const channels = await db.query.alertChannels.findMany({
    where: eq(alertChannels.userId, userId),
    orderBy: [desc(alertChannels.createdAt)],
  });

  return c.json(channels);
});

// ── DELETE /alert-channels/:id — Delete an alert channel ──
app.delete("/:id", async (c) => {
  const db = c.get("db");
  const userId = c.get("userId");
  const channelId = c.req.param("id");

  const existing = await db.query.alertChannels.findFirst({
    where: and(eq(alertChannels.id, channelId), eq(alertChannels.userId, userId)),
  });
  if (!existing) {
    return c.json({ error: "Alert channel not found", code: "NOT_FOUND" }, 404);
  }

  await db.delete(alertChannels).where(eq(alertChannels.id, channelId));

  return c.json({ success: true });
});

// ── POST /alert-channels/:id/test — Send a test alert ──
app.post("/:id/test", async (c) => {
  const db = c.get("db");
  const userId = c.get("userId");
  const channelId = c.req.param("id");

  const channel = await db.query.alertChannels.findFirst({
    where: and(eq(alertChannels.id, channelId), eq(alertChannels.userId, userId)),
  });
  if (!channel) {
    return c.json({ error: "Alert channel not found", code: "NOT_FOUND" }, 404);
  }

  // Send test alert based on channel type
  try {
    const testMessage = "🧪 This is a test alert from apimon. Your alert channel is working!";
    const config = channel.config as Record<string, string>;

    switch (channel.type) {
      case "telegram": {
        const botToken = process.env["TELEGRAM_BOT_TOKEN"];
        if (!botToken) {
          return c.json({ error: "Telegram bot token not configured", code: "CONFIG_ERROR" }, 500);
        }
        const chatId = config["chatId"];
        if (!chatId) {
          return c.json({ error: "Chat ID not configured in channel", code: "CONFIG_ERROR" }, 400);
        }
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: chatId, text: testMessage, parse_mode: "HTML" }),
        });
        break;
      }
      case "slack": {
        const webhookUrl = config["webhookUrl"];
        if (!webhookUrl) {
          return c.json({ error: "Webhook URL not configured", code: "CONFIG_ERROR" }, 400);
        }
        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: testMessage }),
        });
        break;
      }
      case "discord": {
        const webhookUrl = config["webhookUrl"];
        if (!webhookUrl) {
          return c.json({ error: "Webhook URL not configured", code: "CONFIG_ERROR" }, 400);
        }
        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: testMessage }),
        });
        break;
      }
      case "email": {
        const resendKey = process.env["RESEND_API_KEY"];
        if (!resendKey) {
          return c.json({ error: "Resend API key not configured", code: "CONFIG_ERROR" }, 500);
        }
        const email = config["email"];
        if (!email) {
          return c.json({ error: "Email not configured in channel", code: "CONFIG_ERROR" }, 400);
        }
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendKey}`,
          },
          body: JSON.stringify({
            from: "apimon <alerts@apimon.dev>",
            to: [email],
            subject: "apimon — Test Alert",
            text: testMessage,
          }),
        });
        break;
      }
      case "webhook": {
        const url = config["url"];
        if (!url) {
          return c.json({ error: "Webhook URL not configured", code: "CONFIG_ERROR" }, 400);
        }
        await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "test",
            message: testMessage,
            timestamp: new Date().toISOString(),
          }),
        });
        break;
      }
      default:
        return c.json({ error: "Unknown channel type", code: "UNKNOWN_TYPE" }, 400);
    }

    // Mark as verified after successful test
    await db
      .update(alertChannels)
      .set({ isVerified: true })
      .where(eq(alertChannels.id, channelId));

    return c.json({ success: true, message: "Test alert sent successfully" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return c.json(
      { error: `Failed to send test alert: ${message}`, code: "SEND_FAILED" },
      500,
    );
  }
});

export { app as alertChannelsRoute };
