# apimon

**CLI-first API monitoring and alerting SaaS**

Monitor your APIs from the command line with powerful alerts, status pages, and real-time dashboards.

## Features

- 🖥️ **CLI-First** — Manage monitors, alerts, and status pages from your terminal
- 📊 **Dashboard** — Beautiful web interface with uptime charts and response time graphs
- 🔔 **Multi-Channel Alerts** — Telegram, Slack, Discord, Email, Webhooks
- 📋 **Status Pages** — Public status pages for your services
- ⚡ **Fast Checks** — Monitor intervals from 30s to 24h
- 🏗️ **Monorepo** — Organized packages: web, api, worker, cli, db, shared, ui

## Architecture

```
apps/
  web/       → Next.js 15 dashboard & marketing site
  api/       → Hono REST API
  worker/    → Check runner & alert dispatcher
packages/
  cli/       → CLI tool
  db/        → Drizzle ORM + PostgreSQL
  shared/    → Types, schemas, constants
  ui/        → Shared UI components
```

## Quick Start

```bash
# Install dependencies
bun install

# Run development servers
bun run dev

# Build all packages
bun run build

# Run tests
bun run test
```

## Deploy

### One-Click Deploy to Netlify

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/talhaorak/apimon)

### Manual Deploy

1. Fork/clone the repo
2. Connect to Netlify (import from GitHub)
3. Set base directory to `apps/web`
4. Build command: `cd ../.. && bun install && bun run build --filter=@apimon/web`
5. Publish directory: `.next`

## Tech Stack

- **Frontend:** Next.js 15, React 19, Tailwind CSS v4, shadcn/ui, Recharts
- **API:** Hono, TypeScript
- **Database:** PostgreSQL + Drizzle ORM
- **Runtime:** Bun
- **Build:** Turborepo
- **Testing:** Vitest + Playwright

## License

MIT
