# Project Structure

High-level map of the **Test Sambil Ngopi** monorepo. For file-by-file detail see [`docs/DIRECTORY_STRUCTURE.md`](./docs/DIRECTORY_STRUCTURE.md).

**Last updated:** August 2026 · **Version:** 1.14.x

---

## Repository layout

```
testingndrih/
│
├── backend/                      # Node.js API + Playwright automation
│   ├── src/
│   │   ├── controllers/          # HTTP handlers (auth, scenarios, execution, recorder, site, …)
│   │   ├── services/             # Business logic (33+ services)
│   │   ├── routes/               # Express routers mounted at /api/*
│   │   ├── middleware/           # JWT auth, API token auth, admin auth
│   │   ├── lib/                  # Prisma, browser launcher, logger, production security
│   │   ├── constants/            # Menu permissions, shared constants
│   │   └── utils/                # JWT, password, roles, networkReachability, image diff, Turnstile
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
│   └── nginx/                    # Example reverse-proxy config (prod often uses Caddy)
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
| **Recorder** | `services/recorderService.js` | Client-direct / proxy / Playwright sessions, inject script |
| **Reachability** | `utils/networkReachability.js` | Detect public vs internal (private IP) targets |
| **Execution** | `services/executionService.js` | Playback, screencast/browser runner, screenshots, cancel |
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

**Recorder HTTP surface** (`routes/recorderRoutes.js`):
- `GET /api/recorder/target-info` — public vs internal (auth)
- `POST /api/recorder/start|stop` — session lifecycle (auth)
- `GET /api/recorder/status/:scenarioId` — live steps (auth)
- `GET /api/recorder/proxy` · `GET /api/recorder/asset` — HTML/asset proxy (no auth)
- `GET /api/recorder/client-gate` · `GET /api/recorder/inject.js` — client-direct gate + script
- `POST /api/recorder/client-step/:scenarioId` — cross-origin steps (`X-Record-Token`)
- `POST /api/recorder/step/:scenarioId` · `POST /api/recorder/save/:scenarioId` — JWT step ingest / persist

**Entry point:** `backend/src/server.js` — mounts all `/api/*` routes and serves built frontend in Docker.

---

## Frontend pages (by area)

| Area | Pages |
|------|-------|
| **Public** | Landing (`/`, `/id`), About (`/about`, `/id/about`), LandingNotFound |
| **Auth** | Login, Register, ForgotPassword, ResetPassword |
| **Core** | Dashboard, Scenarios, ScenarioDetail (dual recording overviews), Execution, Reports, Analytics, Settings |
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
  B --> T[target-info / start]
  T --> CD[client-direct gate]
  T --> PX[HTML proxy]
  CD --> Inj[Inline inject on real origin]
  PX --> Inj2[Injected recorder in proxy tab]
  Inj --> CS[client-step or step API]
  Inj2 --> CS
  CS --> C[recorderService session]
  C --> F[(PostgreSQL)]
  A --> G[executionService]
  G --> D[Playwright on real URL]
  G --> F
```

**Modes:** `client-direct` (default; required for internal/VPN) · `proxy` (optional, public only) · `playwright` (local headed, opt-in).

**Playback isolation:** Each cloud Run uses Playwright `browser.newContext()` (ephemeral, no `storageState`) — Incognito-like. Chromium `--incognito` is **not** used (breaks CDP screencast / live viewer). The Browser Runner popup cannot be forced into Chrome Incognito from the web app.

**Quick Record:** Create-menu item is **ADMIN-only**; regular users use Create Manual / Templates / Import.

---

## Product roadmap (planned)

High-level product plan (not implemented until a phase is explicitly approved). Summary also in [`README.md`](./README.md#product-roadmap).

| Phase | Focus | Status | Notes |
|-------|--------|--------|--------|
| **P0** | Cloud Run + private/internal URLs | **Done** | Preflight + UI badge + block in production; env `ALLOW_PRIVATE_NETWORK_EXECUTION` for on-prem |
| **P1** | Scenario quality & UX | Planned | Validation, self-heal visibility, optional session reuse |
| **P2** | Hybrid local agent | Planned | Run private targets on user machine; public on VPS |
| **P3** | Observability, collab, scale | Planned | Better errors, share links, flaky, quotas, secrets |

### P0 — Run internal (implemented)

- Reuses [`backend/src/utils/networkReachability.js`](./backend/src/utils/networkReachability.js) via `preflightExecutionTargets` before execute
- UI badge public vs internal on Scenario Detail; hard-block when `executionBlocked`
- Actionable `formatPlaywrightNavigationError` on `page.goto` failures
- Production blocks private IPs unless `ALLOW_PRIVATE_NETWORK_EXECUTION=true`

**Touched:**
- `backend/src/utils/networkReachability.js`
- `backend/src/controllers/executionController.js`
- `backend/src/services/executionService.js`
- `frontend/src/pages/ScenarioDetailPage.jsx`

### P1 — Scenario quality & UX

- Validate NAVIGATE URL on step save; keep scenario-URL fallback on execute
- Surface self-heal locator changes in run results / Browser Runner
- Optional encrypted storage state / reuse login per environment (toggle, default off)

### P2 — Hybrid local agent

```mermaid
flowchart TB
  subgraph today [Today]
    Rec[Record client-direct on user PC]
    RunCloud[Run Playwright on VPS]
  end
  subgraph planned [Planned P2]
    Agent[Local agent on user VPN]
    RunCloud2[Run public URLs on VPS]
    RunAgent[Run private URLs via agent]
  end
  Rec --> DB[(PostgreSQL)]
  DB --> RunCloud
  DB --> RunCloud2
  DB --> RunAgent
  RunAgent --> Agent
```

**Likely touch points (when implemented):** new agent package/service, job queue or websocket from API, execution routing by target kind.

### P3 — Observability, collaboration, scale

- Map network/CSP failures to Indonesian guidance
- Shareable run links
- Flaky-step detection from analytics history
- Concurrent-run quota per user
- Masked environment secrets in logs / screenshots

---

## Configuration files

| File | Purpose |
|------|---------|
| `.env.example` | Docker / full-stack template |
| `backend/.env.example` | Local API development (`RECORDING_MODE`, CORS, …) |
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
| Product roadmap (summary) | [`README.md` § Product roadmap](./README.md#product-roadmap) |
| Script reference | [`scripts/README.md`](./scripts/README.md) |
