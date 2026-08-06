# Test Sambil Ngopi

**Intelligent test recording & playback platform** — record browser interactions with Playwright, turn them into reusable scenarios, and run them with scheduling, cross-browser matrix, analytics, and CI integration.

**Live:** [testsambilngopi.com](https://testsambilngopi.com)  
**Docs:** [`docs/README.md`](./docs/README.md)  
**Version:** 1.14.x (semantic release)

![Node](https://img.shields.io/badge/node-20.x-brightgreen.svg)
![React](https://img.shields.io/badge/React-18.2-blue.svg)
![Playwright](https://img.shields.io/badge/Playwright-1.58-blue.svg)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

---

## Table of contents

1. [Tech stack](#-tech-stack)
2. [Key features](#-key-features)
3. [Record & playback](#-record--playback)
4. [Current status](#-current-status)
5. [Product roadmap](#product-roadmap)
6. [Tested features](#-tested-features)
7. [Quick start](#-quick-start)
8. [Docker quick start](#-docker-quick-start)
9. [Documentation](#-documentation)
10. [Testing](#-testing)
11. [CI/CD & production](#-cicd--production)
12. [Security](#-security-public-repository)
13. [Project structure](#-project-structure)

---

## Tech stack

| Layer | Technology | Notes |
|-------|------------|--------|
| **Frontend** | React 18 + Vite 5 | SPA, React Router, Zustand |
| **Styling** | TailwindCSS 3.4 | Light theme, responsive layout |
| **Charts** | Recharts | Analytics dashboard |
| **HTTP** | Axios | API client with auth interceptors |
| **Backend** | Node.js 20 + Express 4 | ESM modules, REST API |
| **Database** | PostgreSQL 16 | Relational storage |
| **ORM** | Prisma 7 | Migrations, type-safe queries |
| **Automation** | Playwright 1.58 | Recording, execution, E2E |
| **Auth** | JWT + bcrypt | Role-based access (ADMIN / USER) |
| **Email** | Nodemailer | Password reset, notifications |
| **Captcha** | Cloudflare Turnstile | Login, register, reset password |
| **API docs** | Swagger UI | `/api/docs` |
| **Container** | Docker Compose | App + PostgreSQL single stack |
| **CI/CD** | GitHub Actions | Lint, test, release, deploy |
| **Deploy** | Self-hosted runner on VPS | `testsambilngopi.com` |

**Monorepo workspaces:** `backend/` + `frontend/` (root `package.json` orchestrates scripts).

---

## Key features

### Core testing
- **Scenario management** — create, edit, duplicate, search scenarios
- **Step editor** — NAVIGATE, CLICK, FILL, WAIT, ASSERTION, SCREENSHOT, API_CALL, and more
- **Browser recording** — client-direct (default) or proxy; public vs internal auto-detect; playback via Playwright
- **Execution engine** — step-by-step runs with screenshots, retries, error suggestions
- **Test chains** — multi-scenario workflows with stop-on-fail options
- **Excel import** — bulk scenario import with preview

### Advanced testing (admin tools)
- **Smoke test** — quick health-check suite
- **Stress test** — load / concurrency checks
- **Security test** — common vulnerability scans
- **API testing** — HTTP builder with assertions
- **Visual regression** — baseline capture, pixel diff, approve/reject
- **Browser matrix** — cross-browser / OS combinations
- **Parallel execution** — concurrent scenario runs
- **Scheduler** — once, hourly, daily, weekly cron jobs

### Platform
- **Environments** — variables with `{{var}}` substitution per environment
- **Issue tracker** — auto-create issues from failed executions
- **Analytics & reports** — trends, flaky steps, PDF/HTML export
- **Notifications** — email & webhook on failure
- **CI API** — run scenarios via API token (`/api/ci/run/:scenarioId`)
- **User management** — admin CRUD, roles, active/inactive, activity log
- **Welcome splash** — one-time modal after registration

### Auth & resilience
- Register / login with Turnstile captcha
- Forgot / reset password (email token, 15 min expiry)
- Custom error pages: 404, 403, 500, session expired, maintenance
- **Server health monitor** — auto-redirect to maintenance when prod is down
- **Offline banner** — browser network loss detection

---

## Record & playback

### How recording works

Default mode is **client-direct**: the real target site opens in your browser and a recorder script is attached (best visual/selector fidelity for playback). **Proxy** mode is optional for public sites. **Playwright headed** remains available for local desktop only (`RECORDING_MODE=playwright`).

```
User opens Recording panel
  → UI probes GET /api/recorder/target-info?url=…  (public vs internal/VPN)
  → User picks overview: Situs asli (client-direct) or Lewat proxy
  → POST /api/recorder/start { scenarioId, url, mode }

Client-direct (default / always for internal targets):
  → Opens /api/recorder/client-gate (panduan + inject inline CSP-safe)
  → User records on the real origin; steps POST /api/recorder/client-step/:id
  → Frontend polls GET /api/recorder/status → Stop → steps saved to PostgreSQL

Proxy (public sites only, optional):
  → Opens /api/recorder/proxy?url=…&sessionId=…
  → Server fetches HTML, injects recorder; assets via /api/recorder/asset
  → Same status/stop/save flow (SPA images/layout may differ from the live site)
```

**Recorder highlights:**
- Two UI overviews on Scenario Detail: **Situs asli** (recommended) vs **Lewat proxy**, with auto-detect public/internal
- Internal/VPN targets (private DNS) cannot be server-proxied — forced client-direct
- Intelligent selectors: `data-testid` → `id` → CSS path → XPath
- Shadow DOM, iframes, contenteditable, SPA route detection; noise filters (e.g. Google Translate)
- Step queue with retry; session keyed by `userId:scenarioId`
- Playback always hits the **real URL** via Playwright (not the recording proxy)

**Key files:**
- `backend/src/services/recorderService.js` — sessions, modes, inject script
- `backend/src/utils/networkReachability.js` — public vs internal detection
- `backend/src/controllers/recorderController.js` — proxy, client-gate, inject, steps
- `backend/src/services/executionService.js` — playback engine
- `frontend/src/pages/ScenarioDetailPage.jsx` — record UI & mode cards

### How playback works

1. User runs a scenario (optionally headless, with environment variables)
2. Execution service loads steps from DB in order
3. Playwright performs each step with smart waits
4. Screenshots / videos captured on failure
5. Results stored; analytics & issues updated

**Limitation (production):** Playback runs Playwright on the **VPS**. Only **public** URLs are reachable. Internal/VPN targets (e.g. `10.x.x.x`) are **blocked before Run** (preflight) with a clear message — they no longer wait 30s then timeout. Record (client-direct on your PC) still works. Override on on-prem runners: `ALLOW_PRIVATE_NETWORK_EXECUTION=true`. See [Product roadmap](#product-roadmap).

---

## Current status

**Overall:** Production ready — live at [testsambilngopi.com](https://testsambilngopi.com)

| Area | Status |
|------|--------|
| Recording (client-direct / proxy) | Complete |
| Execution & retry engine | Complete |
| Cross-browser & parallel | Complete |
| Scheduling | Complete |
| Admin user management | Complete |
| Visual regression (admin) | Complete |
| CI/CD pipeline | Complete |
| Production deploy (self-hosted) | Complete |
| Maintenance / down detection | Complete |
| Telegram deploy notify | Complete (release deploys only) |
| Cloud Run for private/internal URLs | P0 done — preflight + UI; P2 local agent durable queue |

**Recent releases (v1.6 – v1.9):** role-based access, welcome splash, production smoke CI, Telegram deploy notifications, maintenance page, favicon, deploy hardening.

---

## Product roadmap

Planned improvements (documentation only until a phase is approved for implementation). Detail, target files, and architecture notes: [`PROJECT_STRUCTURE.md`](./PROJECT_STRUCTURE.md#product-roadmap-planned).

| Phase | Focus | Status | Deliverables (summary) |
|-------|--------|--------|------------------------|
| **P0** | Run internal (highest pain) | **Done** | Preflight reachability before execute; UI public/internal badge; block cloud Run for private IPs in production; actionable navigation errors |
| **P1** | Scenario quality & UX | **Done** | NAVIGATE URL validation on save; self-heal badge (old → new selector) in step results |
| **P2** | Hybrid local agent | **Done** | Durable `AgentJob` + Execution/StepResults; UI status polling; `scripts/local-agent` |
| **P3** | Observability, collab, scale | **Partial** | Concurrent run quota; secret redaction; **shareable run links**; flaky UX still planned |

**Also shipped:** landing copy aligned with USER capabilities; [`docs/RUN_INTERNAL.md`](./docs/RUN_INTERNAL.md); Pricing page; onboarding checklist; app i18n store foundation.

---

## Tested features

| Feature | Status | Notes |
|---------|--------|-------|
| User auth (login/register/reset) | Pass | Unit + E2E |
| Scenario CRUD & search | Pass | E2E + API |
| Playwright recording | Pass | Client-direct (default) + proxy override; manual + unit |
| Step execution | Pass | E2E execution specs |
| Cross-browser matrix | Pass | E2E |
| Scheduler | Pass | E2E |
| Parallel execution | Pass | E2E |
| Smoke / stress / security tools | Pass | Admin E2E |
| API testing page | Pass | Admin routes |
| Environments & variables | Pass | E2E |
| Analytics dashboard | Pass | Unit + manual |
| User management (admin) | Pass | Unit + E2E |
| Production smoke (live URL) | Pass | `prod-monitor` workflow |
| Platform E2E (build from source) | Pass | CI on every push |

**Backend tests:** Jest — unit, integration, security, database suites.  
**Frontend tests:** Vitest (unit) + Playwright (17 E2E spec files).

---

## Quick start

### Prerequisites
- Node.js **20.x+**
- PostgreSQL **16** (or Docker)
- Git

### 1. Clone & install

```bash
git clone https://github.com/andri5/testingndrih.git
cd testingndrih
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
cp backend/.env.example backend/.env
# Edit .env — set DATABASE_URL, JWT_SECRET, ADMIN_EMAIL, SEED_PASSWORD
```

Never commit `.env` or real passwords (public repo).

### 3. Database

```bash
cd backend
npx prisma migrate dev
npm run db:seed    # optional — creates seed user from SEED_EMAIL / SEED_PASSWORD
```

### 4. Run locally

```bash
# Terminal 1 — API (port 5001)
npm run dev:backend

# Terminal 2 — UI (port 3001)
npm run dev:frontend
```

Open **http://localhost:3001** and sign in with credentials from your `.env` seed settings.

### 5. API docs

- Swagger: http://localhost:5001/api/docs
- Health: http://localhost:5001/health

---

## Docker quick start

```bash
git clone https://github.com/andri5/testingndrih.git
cd testingndrih
cp .env.example .env
# Set strong JWT_SECRET, DB_PASSWORD, SEED_PASSWORD in .env

docker compose up -d
```

After ~15 seconds:
- App: http://localhost:3000
- API docs: http://localhost:3000/api/docs

```bash
docker compose logs -f app    # follow logs
docker compose down         # stop (data kept)
docker compose down -v      # stop + remove volumes
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [`docs/README.md`](./docs/README.md) | Documentation index |
| [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) | Architecture & data flow |
| [`PROJECT_STRUCTURE.md`](./PROJECT_STRUCTURE.md) | Canonical folder layout |
| [`docs/SETUP.md`](./docs/SETUP.md) | Detailed setup & troubleshooting |
| [`docs/TESTING.md`](./docs/TESTING.md) | Test strategy & commands |
| [`docs/API_ENDPOINTS.md`](./docs/API_ENDPOINTS.md) | REST API reference |
| [`docs/SECURITY_TESTING.md`](./docs/SECURITY_TESTING.md) | Pentest & OWASP security testing |
| [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md) | Production deploy guide |
| [`scripts/README.md`](./scripts/README.md) | Deploy & ops scripts |

---

## Testing

```bash
# All workspaces
npm test

# Backend only (Jest)
npm run test:backend

# Frontend unit (Vitest)
npm run test:frontend

# E2E (needs app running or CI build)
cd frontend && npm run e2e

# Health check script
npm run health-check

# Security tests (backend API must be running — see docs/SECURITY_TESTING.md)
npm run test:security
```

See [`docs/TESTING.md`](./docs/TESTING.md) for coverage targets and [`docs/SECURITY_TESTING.md`](./docs/SECURITY_TESTING.md) for penetration testing.

---

## CI/CD & production

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| **CI** | Push / PR to `main` | Lint, backend tests, platform E2E |
| **Release** | CI success on `main` | Semantic version tag |
| **Deploy Production** | New release / manual | Deploy to VPS |
| **Configure Production AI** | Manual dispatch | AI keys on VPS |
| **Production Monitor** | Every 6h / manual | Live smoke tests |
| **Post-Maintenance** | Every 15 min | Deploy once when prod recovers |

Production URL: **https://testsambilngopi.com**

Manual deploy with latest `main`: GitHub Actions → Deploy Production → check `use_main`.

---

## Security (public repository)

- Do **not** commit `.env`, API tokens, Telegram bot tokens, or SMTP passwords
- Set `ADMIN_EMAIL`, `JWT_SECRET`, `SEED_PASSWORD` only on your machine / VPS
- GitHub secrets: Settings → Secrets and variables → Actions → environment `production`
- Rotate credentials if they were ever exposed in git history
- Run security tests: [`docs/SECURITY_TESTING.md`](./docs/SECURITY_TESTING.md)

---

## Project structure

```
testingndrih/
├── backend/                 # Express API + Playwright engine
│   ├── src/controllers/     # Route handlers (incl. recorder)
│   ├── src/services/        # Business logic (recorder, execution, …)
│   ├── src/utils/           # networkReachability, JWT, …
│   ├── src/routes/          # REST routes
│   ├── prisma/              # Schema & migrations
│   └── scripts/             # Seed, maintenance
├── frontend/                # React SPA
│   ├── src/pages/           # Landing, app, admin (ScenarioDetail recording UI)
│   ├── src/components/
│   │   ├── landing/         # Public site components
│   │   ├── security/        # Security scan UI
│   │   └── ui/              # Shared primitives
│   └── e2e/                 # Playwright E2E specs
├── docs/                    # Central documentation
├── scripts/
│   ├── deploy/              # Production deploy
│   ├── notify/              # Telegram
│   └── ops/                 # health-check, secrets
├── deploy/                  # nginx/Caddy example config
├── .github/workflows/       # CI, release, deploy
├── docker-compose.yml
├── Dockerfile
└── package.json             # Monorepo root
```

Full map: [`PROJECT_STRUCTURE.md`](./PROJECT_STRUCTURE.md)

---

## License

MIT — see [LICENSE](./LICENSE).

---

**Questions?** Open a [GitHub Issue](https://github.com/andri5/testingndrih/issues) or read the [docs index](./docs/README.md).
