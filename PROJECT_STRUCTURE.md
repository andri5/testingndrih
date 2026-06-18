# Project Structure

High-level map of the **Test Sambil Ngopi** monorepo. For file-by-file detail see [`docs/DIRECTORY_STRUCTURE.md`](./docs/DIRECTORY_STRUCTURE.md).

**Last updated:** June 2026 · **Version:** 1.14.x

---

## Repository layout

```
testingndrih/
│
├── backend/                      # Node.js API + Playwright automation
│   ├── src/
│   │   ├── controllers/          # HTTP handlers (auth, scenarios, execution, site, …)
│   │   ├── services/             # Business logic (33+ services)
│   │   ├── routes/               # Express routers mounted at /api/*
│   │   ├── middleware/           # JWT auth, API token auth, admin auth
│   │   ├── lib/                  # Prisma, browser launcher, logger, production security
│   │   ├── constants/            # Menu permissions, shared constants
│   │   └── utils/                # JWT, password, roles, image diff, Turnstile
│   ├── prisma/
│   │   ├── schema.prisma         # Database models
│   │   └── migrations/           # SQL migrations
│   ├── scripts/                  # seed, docker-entrypoint, DB maintenance
│   ├── tests/                    # Integration, security, database suites
│   └── uploads/                  # Screenshots, videos (gitignored)
│
├── frontend/                     # React 18 + Vite SPA
│   ├── src/
│   │   ├── pages/                # Route-level screens (landing, app, admin, help)
│   │   ├── components/
│   │   │   ├── landing/          # Public site: nav, footer, carousel, feedback
│   │   │   ├── security/         # Security scan UI widgets
│   │   │   └── ui/               # Shared primitives (Button, Card, Spinner)
│   │   ├── store/                # Zustand (auth, settings, loading)
│   │   ├── services/             # Axios API client
│   │   ├── hooks/                # useNavScrollSpy, useScrollReveal, …
│   │   ├── i18n/                 # Landing page copy (EN / ID)
│   │   ├── constants/            # App paths, welcome splash
│   │   └── utils/                # landingRoutes, validation, export
│   ├── e2e/                      # Playwright end-to-end specs
│   └── public/                   # favicon, maintenance.html, sitemap
│
├── docs/                         # Documentation (see docs/README.md)
│   ├── ARCHITECTURE.md
│   ├── DIRECTORY_STRUCTURE.md
│   ├── SETUP.md
│   ├── TESTING.md
│   ├── SECURITY_TESTING.md       # Pentest & OWASP guide
│   ├── API_ENDPOINTS.md
│   ├── DEPLOYMENT.md
│   └── examples/                 # CI workflow templates
│
├── scripts/                      # Ops scripts (see scripts/README.md)
│   ├── deploy/                   # deploy-production, maintenance-mode
│   ├── notify/                   # Telegram deploy notifications
│   └── ops/                      # health-check, secrets, runner setup
│
├── deploy/
│   └── nginx/                    # Example reverse-proxy config
│
├── .github/workflows/
│   ├── ci.yml                    # Lint + backend test + platform E2E
│   ├── release.yml               # semantic-release
│   ├── deploy-production.yml     # VPS deploy (self-hosted runner)
│   ├── configure-production-ai.yml # Production AI env setup
│   ├── prod-monitor.yml          # Scheduled live smoke tests
│   ├── post-maintenance-deploy.yml
│   └── (example → docs/examples/ci-run-scenario.example.yml)
│
├── docker-compose.yml
├── Dockerfile
├── package.json                  # npm workspaces root
├── README.md
└── CHANGELOG.md
```

---

## Backend modules

| Module | Path | Responsibility |
|--------|------|----------------|
| **Auth** | `controllers/authController.js` | Login, register, password reset |
| **Site / landing** | `services/siteService.js` | Public feedback, page view analytics |
| **Scenarios** | `services/scenarioService.js` | CRUD, duplicate, stats |
| **Test steps** | `services/testStepService.js` | Step CRUD, reorder, batch |
| **Recorder** | `services/recorderService.js` | Playwright recording sessions |
| **Execution** | `services/executionService.js` | Playback, screenshots, cancel |
| **Retry engine** | `services/retryEngineService.js` | Flaky step retries |
| **Chains** | `services/chainService.js` | Multi-scenario workflows |
| **Scheduler** | `services/schedulerService.js` | Cron jobs |
| **Analytics** | `services/analyticsService.js` | Dashboard metrics |
| **Smoke / stress / security** | `*TestService.js` | Specialized test runners |
| **Visual regression** | `visualRegressionService.js` | Baseline & diff |
| **Environments** | `environmentService.js` | Variables & secrets |
| **Users** | `userService.js` | Admin user CRUD, menu permissions |
| **CI** | `controllers/ciController.js` | API token scenario runs |
| **AI** | `services/aiService.js` | Scenario suggestions (optional) |
| **Notifications** | `notificationService.js` | Email / webhook settings |

**Entry point:** `backend/src/server.js` — mounts all `/api/*` routes and serves built frontend in Docker.

---

## Frontend pages (by area)

| Area | Pages |
|------|-------|
| **Public** | Landing (`/`, `/id`), About (`/about`, `/id/about`), LandingNotFound |
| **Auth** | Login, Register, ForgotPassword, ResetPassword |
| **Core** | Dashboard, Scenarios, ScenarioDetail, Execution, Reports, Analytics, Settings |
| **Admin tools** | SmokeTest, StressTest, SecurityTest, ApiTesting, VisualRegression, Environments, Chains, ChainBuilder, ChainExecutor, Scheduler, Parallel, BrowserMatrix |
| **System** | Maintenance, SessionExpired, Forbidden, ServerError, NotFound |
| **Help** | SmokeTestHelp, StressTestHelp, SecurityTestHelp |

**Routing:** `frontend/src/App.jsx` — `ProtectedRoute` + `AdminRoute` + public landing routes.

**Public routing:** English default at `/` and `/about`; Indonesian at `/id` and `/id/about`. See `utils/landingRoutes.js`.

---

## Data flow (record → execute)

```mermaid
flowchart LR
  A[User UI] --> B[Express API]
  B --> C[recorderService]
  C --> D[Playwright Browser]
  D --> E[Injected recorder script]
  E --> B
  B --> F[(PostgreSQL)]
  A --> G[executionService]
  G --> D
  G --> F
```

---

## Configuration files

| File | Purpose |
|------|---------|
| `.env.example` | Docker / full-stack template |
| `backend/.env.example` | Local API development |
| `backend/.env.test.example` | Test database |
| `frontend/playwright.config.js` | E2E browser projects |
| `backend/jest.config.js` | Unit test config |
| `backend/jest.security.config.js` | OWASP / security test config |
| `.releaserc.json` | semantic-release rules |
| `commitlint.config.js` | Conventional commit lint |

---

## UI defaults (2026)

- **Theme:** Light (indigo accent `#5E6AD2`)
- **App language:** English
- **Landing:** Bilingual EN (default) / ID via URL prefix
- **Roles:** `ADMIN` (full tools) · `USER` (core testing, menu-assignable)
- **Primary admin:** `ADMIN_EMAIL` in `.env`

---

## Related docs

| Need | Go to |
|------|-------|
| Install locally | [`docs/SETUP.md`](./docs/SETUP.md) |
| Deploy production | [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md) |
| API list | [`docs/API_ENDPOINTS.md`](./docs/API_ENDPOINTS.md) |
| Run tests | [`docs/TESTING.md`](./docs/TESTING.md) |
| Security / pentest | [`docs/SECURITY_TESTING.md`](./docs/SECURITY_TESTING.md) |
| Architecture deep-dive | [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) |
| Script reference | [`scripts/README.md`](./scripts/README.md) |
