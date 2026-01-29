# AGENTS.md — Multi-Agent Development Rules

## Project: apimon
CLI-First API Monitoring & Alerting SaaS

## Architecture Overview
See PLAN.md for full details. Monorepo with Turborepo:
- `apps/web` — Next.js 15 dashboard (Vercel)
- `apps/api` — Hono API server (Fly.io)
- `apps/worker` — Monitoring engine (Fly.io)
- `packages/cli` — CLI tool (npm)
- `packages/db` — Drizzle schema + migrations
- `packages/shared` — Types, utils, constants
- `packages/ui` — Shared UI components (shadcn/ui)

## Tech Stack
- Runtime: Bun
- Language: TypeScript (strict mode)
- Web: Next.js 15 App Router + TailwindCSS + shadcn/ui
- API: Hono
- DB: PostgreSQL (Neon) + Drizzle ORM
- Auth: Better-Auth
- CLI: Commander.js

## Agent Roles & Boundaries

### 🏗️ ARCHITECT
**Scope:** System design, data modeling, API contracts
**Owns:** `packages/db/`, `packages/shared/`, `PLAN.md`, API schemas
**Delivers:**
- Database schema (Drizzle)
- API route definitions (OpenAPI-style types)
- Shared TypeScript types and interfaces
- Package.json configurations for all packages
- Turborepo configuration
- Environment variable schema (.env.example)
**Rules:**
- Write types and interfaces FIRST, before any implementation
- All API endpoints must have request/response types defined
- Database schema must be complete before devs start

### 🔧 BACKEND DEVELOPER
**Scope:** API server, monitoring engine, alert dispatch
**Owns:** `apps/api/`, `apps/worker/`
**Delivers:**
- Hono API routes (CRUD for monitors, checks, incidents, alerts)
- Authentication middleware (API key + session)
- Monitor check runner (HTTP checks with timing)
- Check scheduler (BullMQ or simple cron)
- Incident detection logic
- Alert dispatch (Telegram, Slack, Discord, email, webhook)
- Health check endpoints
**Rules:**
- Import types ONLY from `packages/shared` and `packages/db`
- Never modify files in `apps/web/` or `packages/ui/`
- All endpoints must validate input (zod)
- All database queries go through Drizzle (never raw SQL)
- Error responses must follow consistent format: `{ error: string, code: string }`

### 🎨 FRONTEND DEVELOPER
**Scope:** Web dashboard, landing page, status pages
**Owns:** `apps/web/`, `packages/ui/`
**Delivers:**
- Landing page (hero, features, pricing, footer)
- Auth pages (sign up, login, forgot password)
- Dashboard layout (sidebar nav, header)
- Monitor list page
- Monitor detail page (charts, incidents, settings)
- Add/edit monitor form
- Alert channel management page
- Status page builder
- Settings pages (API keys, billing, profile)
- Public status page template
**Rules:**
- Use shadcn/ui components exclusively (no custom CSS except Tailwind utilities)
- Import types from `packages/shared`
- API calls go through a typed client (fetch wrapper with types)
- All pages must be responsive (mobile-first)
- Use React Server Components where possible
- Client components must be explicitly marked with 'use client'
- Never modify files in `apps/api/`, `apps/worker/`, or `packages/db/`

### 🧪 QA ENGINEER
**Scope:** Testing, quality assurance, CI/CD
**Owns:** All `*.test.ts` files, `vitest.config.ts`, `.github/workflows/`
**Delivers:**
- Unit tests for API routes (Hono test client)
- Unit tests for monitoring engine
- Unit tests for alert dispatch
- Integration tests for database operations
- E2E tests for critical web flows (Playwright)
- CI/CD pipeline (GitHub Actions)
- Test fixtures and factories
**Rules:**
- Use Vitest for unit/integration tests
- Use Playwright for E2E tests
- Test files live next to source: `foo.ts` → `foo.test.ts`
- Minimum coverage target: 80% for `apps/api/` and `apps/worker/`
- Never modify source code — only test files and CI config
- If a bug is found, document it clearly and report (don't fix)

## Shared Rules (ALL Agents)

### Code Style
- TypeScript strict mode (`"strict": true`)
- ESLint + Prettier (configured in root)
- No `any` types (use `unknown` + type guards)
- Prefer `const` over `let`
- Use named exports (no default exports except Next.js pages)
- Descriptive variable names (no single-letter except loop indices)

### File Conventions
- Files: `kebab-case.ts`
- Components: `PascalCase.tsx`
- Types: `PascalCase` (interfaces prefixed with nothing)
- Constants: `SCREAMING_SNAKE_CASE`
- Hooks: `use-kebab-case.ts`

### Git Conventions
- Conventional commits: `feat:`, `fix:`, `chore:`, `docs:`, `test:`
- One feature per commit
- Always commit working code

### Communication
- If you need something from another agent's scope, write a TODO comment:
  `// TODO(@backend): Need endpoint for monitor stats aggregation`
- Never modify files outside your scope
- If stuck, write a note in `/tmp/agent-notes/<your-role>.md`

### Context Files
Every agent MUST read before starting:
1. This file (`AGENTS.md`)
2. `PLAN.md` — Full project plan
3. `packages/shared/src/types.ts` — All shared types
4. `packages/db/src/schema.ts` — Database schema

### Progress Tracking
Each agent updates their section in `PROGRESS.md` after completing a task:
```
## [Role] — [Date] [Time]
- ✅ Completed: [what]
- 🔄 In Progress: [what]
- ❌ Blocked: [what and why]
- 📝 Notes: [anything important]
```
