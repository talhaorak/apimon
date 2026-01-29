# APImon - Deployment Account Inventory

**Scanned:** Firefox Developer Edition saved logins, macOS Keychain, CLI tools  
**Date:** 2025-07-27

---

## 🔑 Existing Accounts (Firefox Saved Logins)

| Service | Found | Details |
|---------|-------|---------|
| **GitHub** (github.com) | ✅ Yes | 3 saved logins for github.com |
| **Supabase** (supabase.com) | ✅ Yes | 6 saved logins for supabase.com |
| **Cloudflare** (dash.cloudflare.com) | ✅ Yes | 1 saved login for dash.cloudflare.com |
| **Netlify** (app.netlify.com) | ✅ Yes | 1 saved login for app.netlify.com |
| **Vercel** (vercel.com) | ❌ No | No saved credentials found |
| **Fly.io** (fly.io) | ❌ No | No saved credentials found |
| **Neon** (neon.tech) | ❌ No | No saved credentials found |
| **Railway** (railway.app) | ❌ No | No saved credentials found |
| **Render** (render.com) | ❌ No | No saved credentials found |

## 🖥️ CLI Authentication Status

| CLI Tool | Status | Details |
|----------|--------|---------|
| **gh** (GitHub CLI) | ✅ Authenticated | User: `talhaorak`, scopes: gist, read:org, repo |
| **vercel** (Vercel CLI) | ❌ Not authenticated | Installed globally (v50.8.1) but needs `vercel login` |
| **wrangler** (Cloudflare CLI) | ❌ Not authenticated | Available via npx, needs `wrangler login` |
| **railway** (Railway CLI) | ❌ Not authenticated | Available via npx, needs `railway login` |
| **flyctl** (Fly.io CLI) | ❌ Not installed | Not in PATH, not installed via brew |
| **supabase** (Supabase CLI) | ❌ Not installed | Not in PATH |
| **netlify** (Netlify CLI) | ❌ Not authenticated | Available via npx |
| **neonctl** (Neon CLI) | ❌ Not tested | npx timed out |

## 🗝️ macOS Keychain

- **GitHub**: Token stored in keychain (used by `gh` CLI — `gh:github.com`)
- **Cloudflare**: System-level proxy tokens only (Apple NetworkServiceProxy), not user credentials
- No other deployment service credentials found in keychain

## 🎯 Recommended Deployment Path

### Best Options (have existing accounts):

1. **🥇 Cloudflare Workers + Supabase** (both have accounts)
   - Cloudflare Workers for API/backend (generous free tier: 100K req/day)
   - Supabase for PostgreSQL database (free tier: 500MB, 2 projects)
   - Just need to run `wrangler login` to authenticate CLI
   - Good fit for API monitoring service

2. **🥈 Netlify + Supabase** (both have accounts)
   - Netlify for frontend/serverless functions
   - Supabase for database
   - Need to authenticate Netlify CLI

3. **🥉 Vercel + Supabase** (Vercel CLI installed, Supabase has account)
   - Vercel CLI already installed, just needs `vercel login`
   - Would need to create a Vercel account first (no saved credentials)

### For GitHub:
- ✅ **Ready to go** — `gh` CLI fully authenticated as `talhaorak`
- Can create repos, push code, set up GitHub Actions immediately

### Quick Start Commands:
```bash
# Authenticate Cloudflare (recommended path)
npx wrangler login

# Or authenticate Vercel (if preferred)
vercel login

# GitHub is ready
gh repo create apimon --private --source=.
```

---

*Note: Passwords are encrypted in Firefox's logins.json and were NOT extracted. Only service hostnames were checked for existence.*
