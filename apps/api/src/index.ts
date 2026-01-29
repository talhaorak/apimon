// ============================================================
// apimon API — Hono Server
// ============================================================

import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { API_VERSION } from "@apimon/shared";

const app = new Hono();

// Middleware
app.use("*", logger());
app.use("*", cors());

// Health check
app.get("/health", (c) => {
  return c.json({
    status: "ok",
    version: API_VERSION,
    timestamp: new Date().toISOString(),
  });
});

// API root
app.get("/", (c) => {
  return c.json({
    name: "apimon API",
    version: API_VERSION,
    docs: "/docs",
  });
});

// TODO(@backend): Mount route groups
// app.route(`/${API_VERSION}/monitors`, monitorsRoute);
// app.route(`/${API_VERSION}/checks`, checksRoute);
// app.route(`/${API_VERSION}/incidents`, incidentsRoute);
// app.route(`/${API_VERSION}/alert-channels`, alertChannelsRoute);
// app.route(`/${API_VERSION}/status-pages`, statusPagesRoute);
// app.route(`/${API_VERSION}/api-keys`, apiKeysRoute);
// app.route(`/${API_VERSION}/stats`, statsRoute);

const port = Number(process.env["PORT"] ?? 3001);

console.log(`🚀 apimon API running on http://localhost:${port}`);

export default {
  port,
  fetch: app.fetch,
};
