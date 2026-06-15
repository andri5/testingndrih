# Test Sambil Ngopi

**Intelligent test recording & playback platform** — record browser interactions with Playwright, turn them into reusable scenarios, and run them with scheduling, cross-browser matrix, analytics, and CI integration.

**Live:** [testsambilngopi.com](https://testsambilngopi.com)  
**Docs:** [`docs/README.md`](./docs/README.md)  
**Version:** 1.9.x (semantic release)

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
5. [Tested features](#-tested-features)
6. [Quick start](#-quick-start)
7. [Docker quick start](#-docker-quick-start)
8. [Documentation](#-documentation)
9. [Testing](#-testing)
10. [CI/CD & production](#-cicd--production)
11. [Security](#-security-public-repository)
12. [Project structure](#-project-structure)

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

```
User clicks "Record" → Backend launches Playwright browser (Chromium/Firefox/WebKit)
                    → Opens target URL in headed mode
                    → Injects recorder script into the page
                    → Captures clicks, fills, navigation, etc.
                    → Frontend polls status every ~1.5s
                    → User clicks "Stop" → steps saved to PostgreSQL
```

**Recorder highlights:**
- Server-side Playwright session (no browser extension required)
- Intelligent selectors: `data-testid` → `id` → CSS path → XPath
- Shadow DOM, iframes, contenteditable, SPA route detection
- Step queue with retry on network blips
- Session keyed by `userId:scenarioId`

**Key files:**
- `backend/src/services/recorderService.js` — browser session & injection
- `backend/src/services/executionService.js` — playback engine
- `frontend/src/pages/ScenarioDetailPage.jsx` — record UI

### How playback works

1. User runs a scenario (optionally headless, with environment variables)
2. Execution service loads steps from DB in order
3. Playwright performs each step with smart waits
4. Screenshots / videos captured on failure
5. Results stored; analytics & issues updated

---

## Current status

**Overall:** Production ready — live at [testsambilngopi.com](https://testsambilngopi.com)

| Area | Status |
|------|--------|
| Recording (Playwright v2) | Complete |
| Execution & retry engine | Complete |
| Cross-browser & parallel | Complete |
| Scheduling | Complete |
| Admin user management | Complete |
| Visual regression (admin) | Complete |
| CI/CD pipeline | Complete |
| Production deploy (self-hosted) | Complete |
| Maintenance / down detection | Complete |
| Telegram deploy notify | Complete (release deploys only) |

**Recent releases (v1.6 – v1.9):** role-based access, welcome splash, production smoke CI, Telegram deploy notifications, maintenance page, favicon, deploy hardening.

---

## Tested features

| Feature | Status | Notes |
|---------|--------|-------|
| User auth (login/register/reset) | Pass | Unit + E2E |
| Scenario CRUD & search | Pass | E2E + API |
| Playwright recording | Pass | Manual + integration |
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
| [`docs/DIRECTORY_STRUCTURE.md`](./docs/DIRECTORY_STRUCTURE.md) | Full folder layout |
| [`docs/SETUP.md`](./docs/SETUP.md) | Detailed setup & troubleshooting |
| [`docs/TESTING.md`](./docs/TESTING.md) | Test strategy & commands |
| [`docs/API_ENDPOINTS.md`](./docs/API_ENDPOINTS.md) | REST API reference |
| [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md) | Production deploy guide |
| [`PROJECT_STRUCTURE.md`](./PROJECT_STRUCTURE.md) | High-level repo map |

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
```

See [`docs/TESTING.md`](./docs/TESTING.md) for coverage targets and CI details.

---

## CI/CD & production

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| **CI** | Push / PR to `main` | Lint, backend tests, platform E2E |
| **Release** | CI success on `main` | Semantic version tag |
| **Deploy Production** | New release / manual | Deploy to VPS |
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

---

## Project structure

```
testingndrih/
├── backend/                 # Express API + Playwright engine
│   ├── src/controllers/     # Route handlers (21)
│   ├── src/services/        # Business logic (33)
│   ├── src/routes/          # REST routes
│   ├── prisma/              # Schema & migrations
│   └── scripts/               # Seed, maintenance
├── frontend/                # React SPA
│   ├── src/pages/           # 32 page components
│   ├── src/components/      # Shared UI
│   └── e2e/                 # Playwright E2E (17 specs)
├── docs/                    # Central documentation
├── scripts/                 # health-check, deploy notify, recovery
├── deploy/                  # nginx example config
├── .github/workflows/       # CI, release, deploy
├── docker-compose.yml
├── Dockerfile
└── package.json             # Monorepo root
```

Full detail: [`PROJECT_STRUCTURE.md`](./PROJECT_STRUCTURE.md) and [`docs/DIRECTORY_STRUCTURE.md`](./docs/DIRECTORY_STRUCTURE.md).

---

## License

MIT — see [LICENSE](./LICENSE).

---

**Questions?** Open a [GitHub Issue](https://github.com/andri5/testingndrih/issues) or read the [docs index](./docs/README.md).
