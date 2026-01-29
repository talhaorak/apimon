// ============================================================
// apimon API — Webhook Routes (Stripe)
// ============================================================

import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { users } from "@apimon/db";
import type { AppEnv } from "../lib/types.js";
import { dbMiddleware } from "../middleware/auth.js";

const app = new Hono<AppEnv>();

// Webhooks don't use auth middleware — they verify via signature
app.use("*", dbMiddleware);

// ── POST /webhooks/stripe — Stripe webhook handler ──
app.post("/stripe", async (c) => {
  const db = c.get("db");

  // Verify Stripe signature
  const signature = c.req.header("stripe-signature");
  const webhookSecret = process.env["STRIPE_WEBHOOK_SECRET"];

  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET not configured");
    return c.json({ error: "Webhook not configured", code: "CONFIG_ERROR" }, 500);
  }

  if (!signature) {
    return c.json({ error: "Missing stripe-signature header", code: "INVALID_SIGNATURE" }, 400);
  }

  // TODO(@backend): Verify signature with Stripe SDK
  // import Stripe from "stripe";
  // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  // const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

  const body = await c.req.json().catch(() => null);
  if (!body) {
    return c.json({ error: "Invalid JSON body", code: "INVALID_BODY" }, 400);
  }

  // Type assertion for Stripe event shape
  const event = body as {
    type: string;
    data: {
      object: {
        customer?: string;
        metadata?: Record<string, string>;
        status?: string;
      };
    };
  };

  console.log(`[Stripe] Received event: ${event.type}`);

  switch (event.type) {
    case "checkout.session.completed": {
      // User subscribed to a plan
      const customerId = event.data.object.customer;
      const plan = event.data.object.metadata?.["plan"] ?? "pro";

      if (customerId) {
        await db
          .update(users)
          .set({ plan, stripeCustomerId: customerId })
          .where(eq(users.stripeCustomerId, customerId));
        console.log(`[Stripe] User upgraded to ${plan}`);
      }
      break;
    }

    case "customer.subscription.deleted": {
      // Subscription cancelled — downgrade to free
      const customerId = event.data.object.customer;
      if (customerId) {
        await db
          .update(users)
          .set({ plan: "free" })
          .where(eq(users.stripeCustomerId, customerId));
        console.log(`[Stripe] User downgraded to free`);
      }
      break;
    }

    case "customer.subscription.updated": {
      // Subscription changed (upgrade/downgrade)
      const customerId = event.data.object.customer;
      const status = event.data.object.status;
      if (customerId && status === "active") {
        const plan = event.data.object.metadata?.["plan"] ?? "pro";
        await db
          .update(users)
          .set({ plan })
          .where(eq(users.stripeCustomerId, customerId));
        console.log(`[Stripe] Subscription updated to ${plan}`);
      }
      break;
    }

    default:
      console.log(`[Stripe] Unhandled event type: ${event.type}`);
  }

  return c.json({ received: true });
});

export { app as webhooksRoute };
