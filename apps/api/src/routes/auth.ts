// ============================================================
// apimon API — Auth Routes (Better-Auth Stub)
// ============================================================
//
// This file provides placeholder auth routes.
// TODO(@backend): Replace with full Better-Auth integration:
//   import { betterAuth } from "better-auth";
//   const auth = betterAuth({ ... });
//   export const authHandler = auth.handler;
//
// For now, these stubs document the expected auth API surface.
// ============================================================

import { Hono } from "hono";
import type { AppEnv } from "../lib/types.js";
import { dbMiddleware } from "../middleware/auth.js";

const app = new Hono<AppEnv>();

app.use("*", dbMiddleware);

// ── POST /auth/signup — Register a new user ──
app.post("/signup", async (c) => {
  // TODO(@backend): Integrate Better-Auth signup
  // const { email, password, name } = await c.req.json();
  // const result = await auth.signUp({ email, password, name });
  return c.json(
    { error: "Auth routes not yet implemented. Integrate Better-Auth.", code: "NOT_IMPLEMENTED" },
    501,
  );
});

// ── POST /auth/login — Sign in ──
app.post("/login", async (c) => {
  // TODO(@backend): Integrate Better-Auth login
  // const { email, password } = await c.req.json();
  // const session = await auth.signIn({ email, password });
  return c.json(
    { error: "Auth routes not yet implemented. Integrate Better-Auth.", code: "NOT_IMPLEMENTED" },
    501,
  );
});

// ── POST /auth/logout — Sign out ──
app.post("/logout", async (c) => {
  // TODO(@backend): Integrate Better-Auth logout
  // await auth.signOut(c);
  return c.json(
    { error: "Auth routes not yet implemented. Integrate Better-Auth.", code: "NOT_IMPLEMENTED" },
    501,
  );
});

// ── GET /auth/session — Get current session ──
app.get("/session", async (c) => {
  // TODO(@backend): Integrate Better-Auth session check
  // const session = await auth.getSession(c);
  return c.json(
    { error: "Auth routes not yet implemented. Integrate Better-Auth.", code: "NOT_IMPLEMENTED" },
    501,
  );
});

export { app as authRoute };
