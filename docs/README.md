# Documentation Index

Welcome to **Test Sambil Ngopi** documentation — guides for setup, development, testing, and production deployment.

**Live:** [testsambilngopi.com](https://testsambilngopi.com)  
**Last updated:** June 2026 · **Project version:** 1.14.x

---

## Documentation files

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Tech stack, data flow, record/playback, modules |
| [DIRECTORY_STRUCTURE.md](./DIRECTORY_STRUCTURE.md) | Full folder layout & naming conventions |
| [SETUP.md](./SETUP.md) | Local install, Docker, env vars, troubleshooting |
| [TESTING.md](./TESTING.md) | Jest, Vitest, Playwright E2E, CI coverage |
| [SECURITY_TESTING.md](./SECURITY_TESTING.md) | Pentest checklist, OWASP Jest suite, in-app scanner |
| [API_ENDPOINTS.md](./API_ENDPOINTS.md) | REST API reference |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Release, VPS deploy, GitHub Actions |
| [../PROJECT_STRUCTURE.md](../PROJECT_STRUCTURE.md) | High-level repo map |
| [../README.md](../README.md) | Main readme (quick start, features) |

---

## Quick navigation

### Getting started
1. **New to the project?** → [ARCHITECTURE.md](./ARCHITECTURE.md)
2. **Set up locally** → [SETUP.md](./SETUP.md)
3. **Find a file** → [DIRECTORY_STRUCTURE.md](./DIRECTORY_STRUCTURE.md)

### Development
- Backend: [SETUP.md](./SETUP.md) — backend section
- Frontend: [SETUP.md](./SETUP.md) — frontend section
- Database: `backend/prisma/schema.prisma`
- API: [API_ENDPOINTS.md](./API_ENDPOINTS.md)

### Deployment & ops
- Production deploy: [DEPLOYMENT.md](./DEPLOYMENT.md)
- Docker: [SETUP.md](./SETUP.md) — Docker section
- Maintenance mode: `scripts/deploy/maintenance-mode.sh`, `frontend/public/maintenance.html`
- Health check: `npm run health-check`
- Ops scripts index: [`../scripts/README.md`](../scripts/README.md)

---

## Project statistics

| Metric | Count |
|--------|-------|
| Backend controllers | 21 |
| Backend services | 33 |
| Frontend pages | 32 |
| E2E spec files | 17 |
| Database migrations | 17 |
| GitHub workflows | 7 |

---

## Tech stack (summary)

| Layer | Stack |
|-------|-------|
| Frontend | React 18, Vite 5, TailwindCSS, Zustand, Axios, Recharts |
| Backend | Node.js 20, Express 4, Prisma 7, Playwright 1.58 |
| Database | PostgreSQL 16 |
| Auth | JWT, bcrypt, Cloudflare Turnstile |
| Infra | Docker Compose, GitHub Actions, self-hosted runner |

---

## Key features

- **Record & playback** — server-side Playwright recording, step editor, execution engine
- **Test chains** — multi-scenario workflows
- **Admin tools** — smoke, stress, security, API testing, visual regression
- **Automation** — scheduler, parallel runs, browser matrix
- **Platform** — environments, analytics, reports, issue tracker, CI API tokens
- **Users** — role-based access (ADMIN / USER), activity log, welcome splash
- **Resilience** — maintenance page, server health monitor, offline banner

---

## Record & playback (overview)

```
Record  → POST /api/recorder/start → Playwright browser + injected script
Poll    → GET  /api/recorder/status → step queue updates
Stop    → POST /api/recorder/stop  → steps persisted to PostgreSQL
Run     → POST /api/executions     → executionService replays steps
```

Details: [ARCHITECTURE.md](./ARCHITECTURE.md#record--playback)

---

## Current status

| Area | Status |
|------|--------|
| Core testing (scenarios, steps, execution) | Production |
| Recording (Playwright v2) | Production |
| Admin tools & visual regression | Production |
| User management & roles | Production |
| CI/CD + semantic release | Production |
| Live deployment (testsambilngopi.com) | Production |
| Maintenance / downtime UX | Production |

---

## Tested features

| Area | Coverage |
|------|----------|
| Auth (login, register, reset) | Unit + E2E |
| Scenarios & search | E2E + API |
| Execution & chains | E2E |
| Scheduler, parallel, browser matrix | E2E |
| Admin pages (smoke/stress/security) | E2E |
| Platform E2E (from source) | CI on every push |
| Security Jest (OWASP) | `npm run test:security` (local, API running) |
| Production smoke (live URL) | `prod-monitor` workflow |

See [TESTING.md](./TESTING.md) for commands and coverage targets.

---

## Quick start

```bash
git clone https://github.com/andri5/testingndrih.git
cd testingndrih
npm install
cp .env.example .env
cp backend/.env.example backend/.env
# Edit .env — DATABASE_URL, JWT_SECRET, ADMIN_EMAIL, SEED_PASSWORD

cd backend && npx prisma migrate dev && npm run db:seed
cd ..
npm run dev:backend    # :5001
npm run dev:frontend   # :3001
```

Open http://localhost:3001 — credentials from your `.env` seed settings.

---

## FAQ

**How do I set up the project?**  
Follow [SETUP.md](./SETUP.md).

**Where is authentication handled?**  
`backend/src/controllers/authController.js`, `backend/src/middleware/auth.js`

**How do I add a new API feature?**  
Service in `backend/src/services/`, controller in `controllers/`, route in `routes/`, mount in `server.js`.

**Where are scenarios stored?**  
PostgreSQL via Prisma — schema in `backend/prisma/schema.prisma`.

**How do I deploy to production?**  
See [DEPLOYMENT.md](./DEPLOYMENT.md) — release tag triggers deploy; manual option uses `use_main`.

---

## Document history

| Date | Version | Changes |
|------|---------|---------|
| May 2026 | 3.0 | Initial documentation structure |
| June 4, 2026 | 3.1 | Cleanup, testing docs |
| June 2026 | 5.0 | Folder restructure (scripts/, components/), SECURITY_TESTING.md, v1.14.x |

---

**Status:** Production ready
