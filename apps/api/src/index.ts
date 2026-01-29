// ============================================================
// apimon API — Hono Server
// ============================================================

import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { API_VERSION } from "@apimon/shared";

// Route imports
import { monitorsRoute } from "./routes/monitors.js";
import { checksRoute } from "./routes/checks.js";
import { incidentsRoute } from "./routes/incidents.js";
import { alertChannelsRoute } from "./routes/alert-channels.js";
import { statusPagesRoute } from "./routes/status-pages.js";
import { apiKeysRoute } from "./routes/api-keys.js";
import { statsRoute } from "./routes/stats.js";
import { authRoute } from "./routes/auth.js";
import { webhooksRoute } from "./routes/webhooks.js";

const app = new Hono();

// ── Global Middleware ──
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: process.env["WEB_URL"] ?? "http://localhost:3000",
    credentials: true,
  }),
);

// ── Health check (public) ──
app.get("/health", (c) => {
  return c.json({
    status: "ok",
    version: API_VERSION,
    timestamp: new Date().toISOString(),
  });
});

// ── API root (public) ──
app.get("/", (c) => {
  return c.json({
    name: "apimon API",
    version: API_VERSION,
    docs: "/docs",
  });
});

// ── Mount API routes ──
const api = `/${API_VERSION}`;

app.route(`${api}/monitors`, monitorsRoute);
app.route(`${api}/monitors`, checksRoute);     // /monitors/:monitorId/checks
app.route(`${api}/monitors`, statsRoute);      // /monitors/:monitorId/stats
app.route(`${api}/incidents`, incidentsRoute);  // /monitors/:monitorId/incidents + /incidents/:id
app.route(`${api}/monitors`, incidentsRoute);   // /monitors/:monitorId/incidents
app.route(`${api}/alert-channels`, alertChannelsRoute);
app.route(`${api}/status-pages`, statusPagesRoute);
app.route(`${api}/api-keys`, apiKeysRoute);
app.route(`${api}/auth`, authRoute);
app.route(`${api}/webhooks`, webhooksRoute);

// ── 404 fallback ──
app.notFound((c) => {
  return c.json({ error: "Not found", code: "NOT_FOUND" }, 404);
});

// ── Global error handler ──
app.onError((err, c) => {
  console.error(`[API Error]`, err);
  return c.json(
    { error: "Internal server error", code: "INTERNAL_ERROR" },
    500,
  );
});

const port = Number(process.env["PORT"] ?? 3001);

console.log(`🚀 apimon API running on http://localhost:${port}`);

export default {
  port,
  fetch: app.fetch,
};
