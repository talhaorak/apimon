# apimon — CLI-First API Monitoring & Alerting SaaS

> "API monitoring for developers who live in the terminal."

## Vision
Open-source CLI tool + managed cloud dashboard for API uptime monitoring.
Developers add monitors from terminal, get alerts on Telegram/Slack/Discord/email,
and share beautiful status pages with their users.

## Business Model
- **Free tier:** 5 monitors, 5-min check interval, 1 status page, 24h history
- **Pro ($12/mo):** 50 monitors, 1-min interval, 5 status pages, 90-day history, team features
- **Business ($29/mo):** Unlimited monitors, 30-sec interval, custom domains, SLA reports, API access

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Runtime | Bun | Fast, modern, TypeScript-native |
| Monorepo | Turborepo | Parallel builds, caching |
| Web App | Next.js 15 (App Router) | SSR, API routes, Vercel-native |
| UI | TailwindCSS + shadcn/ui | Beautiful, accessible, fast to build |
| API | Hono | Edge-ready, Bun-native, tiny |
| CLI | Commander.js + Ink (optional) | Standard Node.js CLI patterns |
| Database | PostgreSQL (Neon) | Free tier, serverless, branching |
| ORM | Drizzle | Type-safe, lightweight, great DX |
| Auth | Better-Auth | Open-source, self-hosted, simple |
| Payments | Stripe | Industry standard |
| Email | Resend | Developer-friendly, free tier |
| Hosting (Web) | Vercel | Free tier, auto-deploy |
| Hosting (Worker) | Fly.io | Free tier, persistent process |
| Queue | BullMQ + Upstash Redis | Job scheduling for checks |
| Charts | Recharts | React-native charting |

## Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│   CLI Tool   │────▶│   API (Hono)     │◀────│  Web App     │
│  (local)     │     │  on Fly.io       │     │  on Vercel   │
└─────────────┘     └────────┬─────────┘     └─────────────┘
                             │
                    ┌────────┴─────────┐
                    │  Monitor Worker  │
                    │  (Fly.io cron)   │
                    └────────┬─────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
       ┌──────┴──────┐ ┌────┴────┐ ┌───────┴──────┐
       │  Neon PG    │ │ Upstash │ │  Alert       │
       │  Database   │ │ Redis   │ │  Dispatch    │
       └─────────────┘ └─────────┘ │  (TG/Slack)  │
                                   └──────────────┘
```

## Monorepo Structure

```
apimon/
├── apps/
│   ├── web/           # Next.js dashboard + status pages
│   ├── api/           # Hono API server
│   └── worker/        # Monitoring engine (check runner)
├── packages/
│   ├── cli/           # CLI tool (npm package)
│   ├── db/            # Drizzle schema + migrations
│   ├── shared/        # Types, utils, constants
│   └── ui/            # Shared UI components (shadcn)
├── turbo.json
├── package.json
├── tsconfig.base.json
├── .env.example
├── AGENTS.md          # Agent rules for coding agents
└── PLAN.md            # This file
```

## Database Schema (Core)

```
users
  id, email, name, plan, stripe_customer_id, created_at

api_keys
  id, user_id, key_hash, name, last_used, created_at

monitors
  id, user_id, name, url, method, headers (json), body (text),
  expected_status, check_interval_seconds, timeout_ms,
  alert_channels (json), is_active, created_at, updated_at

checks
  id, monitor_id, status_code, response_time_ms, is_up,
  error_message, region, checked_at

incidents
  id, monitor_id, started_at, resolved_at, cause

status_pages
  id, user_id, slug, title, description, monitors (json[]),
  custom_domain, is_public, created_at

alert_channels
  id, user_id, type (telegram|slack|discord|email|webhook),
  config (json), is_verified, created_at

alert_history
  id, monitor_id, channel_id, incident_id, message, sent_at, status
```

## Features (MVP — Phase 1)

### CLI Tool
- [ ] `apimon init` — Create config file (.apimon.yaml)
- [ ] `apimon add <url>` — Add a monitor
- [ ] `apimon list` — List all monitors
- [ ] `apimon status` — Show current status of all monitors
- [ ] `apimon remove <id>` — Remove a monitor
- [ ] `apimon login` — Authenticate with API key
- [ ] `apimon check <url>` — One-shot check (no account needed)

### Web Dashboard
- [ ] Landing page (marketing + pricing)
- [ ] Auth (sign up, login, forgot password)
- [ ] Dashboard: monitor list with status indicators
- [ ] Monitor detail: uptime chart, response time chart, incident history
- [ ] Add/edit monitor form
- [ ] Alert channel management (Telegram, Slack, Discord, email)
- [ ] Status page builder (public URL)
- [ ] Settings: API keys, billing, profile

### API
- [ ] REST API with OpenAPI spec
- [ ] Auth: API key + session-based
- [ ] CRUD: monitors, alert channels, status pages
- [ ] Read: checks, incidents, stats
- [ ] Webhook: Stripe events

### Monitoring Engine
- [ ] HTTP checks (GET/POST/PUT/DELETE)
- [ ] Status code validation
- [ ] Response time measurement
- [ ] Timeout handling
- [ ] Check scheduling (per-monitor intervals)
- [ ] Incident detection (consecutive failures → incident)
- [ ] Incident resolution (recovery detected)

### Alert System
- [ ] Telegram Bot notifications
- [ ] Slack webhook notifications
- [ ] Discord webhook notifications
- [ ] Email notifications (via Resend)
- [ ] Generic webhook (custom URL)
- [ ] Alert on: down, recovered, degraded (slow response)

### Status Pages
- [ ] Public status page with slug URL
- [ ] Monitor status indicators
- [ ] 90-day uptime bar chart
- [ ] Incident timeline
- [ ] Subscribe to updates (email)

## Phase 2 (Post-MVP)
- Multi-region checks
- SSL certificate monitoring
- DNS monitoring
- Cron job monitoring (heartbeat endpoints)
- Team/organization support
- Maintenance windows
- Custom response body assertions
- GraphQL endpoint monitoring
- gRPC endpoint monitoring
- Branded status pages (custom domain + logo)
- Public API with rate limiting
- Billing with Stripe

## Deployment Plan

### Free Tier Services
| Service | Provider | Free Tier Limits |
|---------|----------|-----------------|
| Web hosting | Vercel | 100GB bandwidth, serverless functions |
| API + Worker | Fly.io | 3 shared VMs, 256MB RAM each |
| Database | Neon PostgreSQL | 0.5GB storage, 192h compute/month |
| Redis | Upstash | 10K commands/day |
| Email | Resend | 100 emails/day |
| DNS | Cloudflare | Unlimited |

### Deploy Steps
1. Set up Neon database + run migrations
2. Deploy API + Worker to Fly.io
3. Deploy Web to Vercel
4. Configure custom domain (apimon.dev or similar)
5. Set up Stripe (test mode first)
6. Create Telegram Bot for alerts

## Success Metrics
- MVP live in 2 weeks
- First external user in 3 weeks
- 100 GitHub stars in 1 month
- First paying customer in 6 weeks
- $1K MRR in 3 months
