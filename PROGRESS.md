# PROGRESS.md — apimon Development Progress

## 🏗️ ARCHITECT — 2025-07-18

### ✅ Completed

#### 1. Turborepo Monorepo Initialization
- Root `package.json` with Bun workspaces (`apps/*`, `packages/*`)
- `turbo.json` with build/dev/lint/typecheck/clean/db:generate/db:migrate pipelines
- `tsconfig.base.json` with TypeScript strict mode (ES2022 target, bundler resolution)
- `.gitignore` with comprehensive ignore rules
- `.env.example` with all required environment variables

#### 2. Apps Created
- **`apps/web`** — Next.js 15 App Router with landing page (features, CLI demo)
- **`apps/api`** — Hono server with health endpoint, CORS, logger middleware
- **`apps/worker`** — Monitor check engine entry point with heartbeat

#### 3. Packages Created
- **`packages/shared`** — Types, Zod schemas, constants (exported via barrel file)
- **`packages/db`** — Drizzle ORM schema + connection helper + drizzle.config.ts
- **`packages/cli`** — Commander.js CLI with commands: check, init, login, add, list, status, remove
- **`packages/ui`** — Stub for shared React components (shadcn/ui)

#### 4. Database Schema (`packages/db/src/schema.ts`)
All 8 tables with full columns, relations, and indexes:
- `users` — id, email, name, plan, stripe_customer_id, timestamps
- `api_keys` — id, user_id (FK), key_hash, name, last_used_at, created_at
- `monitors` — id, user_id (FK), name, url, method, headers (jsonb), body, expected_status, check_interval_seconds, timeout_ms, is_active, timestamps
- `checks` — id, monitor_id (FK), status_code, response_time_ms, is_up, error_message, response_body, region, checked_at
- `incidents` — id, monitor_id (FK), state, cause, started_at, resolved_at
- `status_pages` — id, user_id (FK), slug (unique), title, description, monitor_ids (jsonb), custom_domain, is_public, timestamps
- `alert_channels` — id, user_id (FK), type, config (jsonb), is_verified, created_at
- `alert_history` — id, monitor_id (FK), channel_id (FK), incident_id (FK nullable), message, status, sent_at

Indexes: user_id lookups, monitor_id + checked_at composite, state filters, slug unique

#### 5. Shared Types (`packages/shared/src/types.ts`)
- **Enums:** PlanType, MonitorMethod, CheckInterval, AlertType, AlertStatus, IncidentState
- **Entity interfaces:** User, ApiKey, Monitor, Check, Incident, StatusPage, AlertChannel, AlertHistory
- **Zod request schemas:** CreateMonitor, UpdateMonitor, CreateAlertChannel, CreateStatusPage, UpdateStatusPage, CreateApiKey
- **Response types:** MonitorResponse, MonitorDetailResponse, CheckListResponse, IncidentListResponse, StatusPageResponse, UserResponse, ApiKeyResponse, ApiKeyCreateResponse, StatsResponse
- **Pagination:** PaginationSchema, CheckFilterSchema
- **Error:** ApiError interface

#### 6. Constants (`packages/shared/src/constants.ts`)
- Plan limits (monitors, status pages, history days, prices)
- Check intervals (30s, 1m, 5m, 15m, 30m, 1h)
- Minimum intervals per plan
- Default timeout (30s), max response body (1KB)
- Consecutive failure threshold (3)
- HTTP methods, alert types, alert statuses, incident states

#### 7. Build Verification
- `bun install` ✅ — All dependencies resolved
- `bun run build` ✅ — All 7 packages build successfully
- Git commit: `5e2c315` — `feat: initialize turborepo monorepo with bun`

### 📝 Notes
- Workspace protocol used: `"@apimon/shared": "workspace:*"`
- Every package has its own `package.json` and `tsconfig.json`
- TypeScript strict mode enabled everywhere
- Next.js `transpilePackages` configured for workspace packages
- Drizzle config ready for PostgreSQL (Neon)

---

## 🔧 BACKEND DEVELOPER — 2025-07-19

### ✅ Completed

#### 1. API Server — Auth Middleware (`apps/api/src/middleware/auth.ts`)
- **API Key auth:** reads `X-API-Key` header, SHA-256 hashes it, looks up in `api_keys` table, updates `last_used_at`
- **Session/Bearer auth:** stub ready for Better-Auth integration
- **`authMiddleware`** — full auth required (API key or bearer token)
- **`dbMiddleware`** — DB-only context for public routes (health, status pages, webhooks)

#### 2. API Server — Crypto Utilities (`apps/api/src/lib/crypto.ts`)
- `generateApiKey()` — creates `apimon_` prefixed keys with 32 random bytes
- `hashApiKey()` — SHA-256 hashing for storage
- `getKeyPrefix()` — safe prefix extraction for display

#### 3. API Server — All Routes (`apps/api/src/routes/`)

| Route File | Endpoints | Auth |
|---|---|---|
| `monitors.ts` | POST, GET (list), GET /:id, PUT /:id, DELETE /:id | ✅ API Key |
| `checks.ts` | GET /monitors/:monitorId/checks (paginated, date-filterable) | ✅ API Key |
| `incidents.ts` | GET /monitors/:monitorId/incidents, GET /incidents/:id | ✅ API Key |
| `alert-channels.ts` | POST, GET, DELETE /:id, POST /:id/test | ✅ API Key |
| `status-pages.ts` | POST, GET, PUT /:id, DELETE /:id, GET /public/:slug (public) | ✅ Mixed |
| `api-keys.ts` | POST (returns key once), GET (list), DELETE /:id | ✅ API Key |
| `stats.ts` | GET /monitors/:monitorId/stats (24h/7d/30d periods) | ✅ API Key |
| `auth.ts` | POST signup/login/logout, GET session (Better-Auth stubs) | Public |
| `webhooks.ts` | POST /webhooks/stripe (checkout, subscription events) | Signature |

#### 4. API Server — Features
- **Input validation:** all request bodies validated with Zod schemas from `@apimon/shared`
- **Error handling:** consistent `{ error: string, code: string }` format everywhere
- **Plan limits:** monitor count and status page limits enforced per user plan
- **CORS:** configured for web app origin
- **404 fallback** and **global error handler**
- **Owner verification:** all CRUD operations verify resource belongs to authenticated user

#### 5. Worker — Check Runner (`apps/worker/src/check-runner.ts`)
- Makes HTTP requests with configurable method, headers, body, timeout
- Measures response time with millisecond precision
- Validates status code against `expectedStatus`
- Captures truncated response body (max 1KB)
- Handles timeouts (AbortController) and network errors
- Saves check results to DB via Drizzle
- **Incident detection:** 3+ consecutive failures → creates new incident
- **Recovery detection:** success after incident → resolves incident

#### 6. Worker — Scheduler (`apps/worker/src/scheduler.ts`)
- Groups monitors by check interval for efficient scheduling
- **Staggered startup:** 1-second offset per interval group to avoid thundering herd
- **Monitor cache:** in-memory cache of active monitors
- **Auto-refresh:** reloads monitor list from DB every 60 seconds
- Handles new monitors, deleted monitors, and interval changes
- `startScheduler()` / `stopScheduler()` for lifecycle management

#### 7. Worker — Alert Dispatcher (`apps/worker/src/alerts.ts`)
- **Telegram:** POST to Bot API with HTML-formatted messages
- **Slack:** POST to webhook with Block Kit (header, fields, color attachment)
- **Discord:** POST to webhook with rich embeds (color-coded)
- **Email:** POST to Resend API with proper subject lines
- **Webhook:** POST to custom URL with structured JSON payload
- Down alerts + recovery alerts for all channel types
- All alerts logged to `alert_history` table with sent/failed status

#### 8. Worker — Entry Point (`apps/worker/src/index.ts`)
- Initializes DB connection via `createDb()`
- Starts scheduler with all active monitors
- Health check HTTP endpoint on port 3002 (configurable via `WORKER_PORT`)
- Graceful shutdown on SIGINT/SIGTERM

#### 9. Updated Main API Entry (`apps/api/src/index.ts`)
- Mounted all 9 route groups under `/v1/` prefix
- CORS with configurable origin
- 404 fallback and global error handler

### 📝 Build Verification
- `@apimon/api` build ✅
- `@apimon/worker` build ✅
- Full turbo build (excluding pre-existing CLI dep issue) ✅

### 📝 Notes
- Added `drizzle-orm` as direct dependency to both `apps/api` and `apps/worker` (needed for TypeScript type resolution of `eq`, `and`, `desc`, etc.)
- Better-Auth routes are stubs — need full integration when configuring auth provider
- Stripe webhook handler is functional stub — needs Stripe SDK for signature verification
- Pre-existing issue: `packages/cli` build fails due to missing `yaml`, `chalk`, `ora`, `cli-table3` deps (not in backend scope)

### 🔄 TODOs (for future work)
- Integrate Better-Auth for session-based authentication
- Add Stripe SDK for webhook signature verification
- Add rate limiting middleware
- Add request logging/metrics
- Multi-region check support
- Response body assertion checks

---

## 🖥️ CLI DEVELOPER — 2025-07-29

### ✅ Completed

#### 1. Core Infrastructure
- **`src/config.ts`** — Config file management for `~/.apimon/config.yaml` (global) and `.apimon.yaml` (local), with read/write/update helpers, API URL resolution (local → global → default), API key retrieval
- **`src/output.ts`** — Rich terminal output: chalk-powered colors, status icons (●/✓/✗), message helpers (success/error/warning/info/header/divider), formatMs/formatPercent/formatInterval/timeAgo/formatDate, table creation (cli-table3 with Unicode box-drawing), ora spinner factory, centralized error handler with graceful Ctrl+C handling
- **`src/api-client.ts`** — Typed HTTP client (`ApiClient` class) for all API endpoints (monitors CRUD, stats, alert channels, auth validation), custom `ApiClientError` with status codes, friendly error messages for 401/403/404/429/network errors, `createAuthenticatedClient()` factory

#### 2. Commands (8 total)

| Command | File | Auth | Description |
|---------|------|------|-------------|
| `apimon check <url>` | `commands/check.ts` | ❌ | One-shot HTTP check with timing, color-coded status, priority-sorted headers, supports --method/--timeout/--headers/--body, auto-prepends https://, validates HTTP methods, handles DNS/timeout/SSL errors gracefully |
| `apimon init` | `commands/init.ts` | ❌ | Interactive setup with @inquirer/prompts, writes .apimon.yaml with comments, guards against overwrite |
| `apimon login` | `commands/login.ts` | ❌ | Accepts --key flag or masked interactive prompt, validates key against API, saves to ~/.apimon/config.yaml |
| `apimon add <url>` | `commands/add.ts` | ✅ | Interactive mode (no --name) or flag-based, prompts for name/method/interval/status/timeout, creates monitor via API |
| `apimon list` | `commands/list.ts` | ✅ | Table with ID/Name/URL/Status/Uptime/RespTime, color-coded status, --json for raw output, --status filter (up/down/all) |
| `apimon status [id]` | `commands/status.ts` | ✅ | Without ID: summary (up/down/total/avg response/uptime/checks/incidents). With ID: detailed view with last check time, uptime %, interval, recent incidents |
| `apimon remove <id>` | `commands/remove.ts` | ✅ | Shows monitor info, confirmation prompt (--force to skip), clean removal message |
| `apimon alerts` | `commands/alerts.ts` | ✅ | Table with Type/Name/Verified/Created for all alert channels |

#### 3. Polish & DX
- `--version` / `-v` shows version
- `--help` / `-h` for all commands and subcommands
- Color-coded everything: green=success/2xx, yellow=redirect/3xx, red=error/4xx/5xx
- Unicode symbols throughout (✓ ✗ ● ⚠ ℹ →)
- Response time color coding: green <200ms, yellow <500ms, red >500ms
- Uptime color coding: green ≥99%, yellow ≥95%, red <95%
- Auto-update check stub (ready for npm registry integration)
- Friendly error messages (never stack traces)
- Graceful Ctrl+C handling during interactive prompts
- Non-zero exit code on failures
- bin entry: `"apimon" → "./dist/index.js"` with shebang

#### 4. Dependencies Added
- `chalk` ^5.6.2 (ESM-only terminal colors)
- `ora` ^9.1.0 (loading spinners)
- `@inquirer/prompts` ^8.2.0 (interactive prompts)
- `yaml` ^2.8.2 (config file parsing)
- `cli-table3` ^0.6.5 (table formatting)

### 📝 Build Verification
- `bun run build --filter=@apimon/cli` ✅ (TypeScript strict mode, zero errors)
- `bun packages/cli/src/index.ts --help` ✅ (all 8 commands listed)
- `bun packages/cli/src/index.ts check httpbin.org/get` ✅ (200 OK, headers, timing)
- `bun packages/cli/src/index.ts check httpbin.org/status/404` ✅ (red 404, exit code 1)
- `bun packages/cli/src/index.ts check nonexistent.invalid` ✅ (DNS error, friendly message)
- `bun packages/cli/src/index.ts check httpbin.org/post -m POST -b '{"test":true}'` ✅ (POST with body)
- Auth-required commands without login → clean "Not authenticated" message ✅

### 📝 Notes
- Pre-existing `@apimon/web` build error (type mismatch in marketing page) — not in CLI scope
- All types imported from `@apimon/shared` — no local type duplication
- Files never modified outside `packages/cli/`
