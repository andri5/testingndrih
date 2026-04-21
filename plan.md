# PLAN - testingndrih Testing Automation Platform

> Platform Otomatis untuk Record, Playback, dan Eksekusi Test Scenario di Website Apapun
>
> **Last Updated**: April 21, 2026 - Session 16 (UI Fixes & Light Theme Compatibility)
> **Current Phase**: Production-Ready — All core features implemented and deployed

---

## 📊 Project Overview

| Item | Detail |
|------|--------|
| **Aplikasi** | testingndrih (Testing Validation Platform) |
| **Fitur Utama** | Record interaction → Generate test steps → Execute & validate |
| **Frontend** | React 18 + Vite + TailwindCSS + Zustand |
| **Backend** | Node.js + Express.js (ESM) + Prisma ORM |
| **Database** | PostgreSQL 16 (Docker) |
| **Browser Automation** | Playwright (Firefox headed + Xvfb virtual display) |
| **Auth** | JWT + bcrypt |
| **Containerization** | Docker + docker-compose (2 containers: App + PostgreSQL) |
| **CI/CD** | Removed (was GitHub Actions) |

---

## 🚀 Quick Start (Docker)

```bash
# Prerequisites: Docker & Docker Desktop running

# 1. Copy .env.example to .env and fill in your values
cp .env.example .env

# 2. Start all services
docker-compose up -d

# Application: http://localhost:3000  (React SPA + REST API on same port)
# Database:    localhost:5432

# View logs
docker-compose logs -f app

# Stop
docker-compose down
```

**Default Credentials** *(created by seed on first start)*:
- Email: `admin@testingndrih.local`
- Password: `changeme123`

---

## ✅ COMPLETED FEATURES

### Phase 1: Core Recording Engine
- [x] Proxy-based recording (server fetches target page, injects recorder script)
- [x] Event capture: click, fill, paste, change, submit, hover, scroll, drag
- [x] Input field tracking with debouncing
- [x] Smart selector: data-testid → id → name → aria-label → placeholder → role+text → CSSPath
- [x] Checkbox/Radio auto-detection
- [x] Contenteditable support (Gmail, rich text editors)
- [x] SPA route detection (history.pushState/replaceState + popstate)
- [x] Shadow DOM support (composedPath, MutationObserver)
- [x] Dynamic class filtering (Angular, React, Vue, Styled Components)
- [x] Selector uniqueness validation with auto nth-child refinement
- [x] Hover indicator overlay with live selector display
- [x] Link interception for multi-page proxy navigation
- [x] Stop recording → auto-close browser + auto-save steps to DB
- [x] Bug fix: `<base href>` resolved fetch to correct origin via `window.__recOrigin`
- [x] Bug fix: `window.fetch` captured early as `window.__nativeFetch` before page scripts override

### Phase 2: Execution Engine
- [x] Step types: NAVIGATE, CLICK, FILL, WAIT, ASSERTION, SCREENSHOT, API_CALL, HOVER, SCROLL, FILE_UPLOAD, DRAG, MOCK_ROUTE
- [x] Firefox headed execution via Xvfb virtual display (not headless)
- [x] slowMo=300ms for realistic pacing and better video
- [x] Rich error capture: message, step info, page URL, console errors, failed network requests
- [x] Full-page screenshot on failed step with red error overlay annotation
- [x] Smart wait: waitFor(visible) → attached → scrollIntoView → retry
- [x] Checkbox/Radio: .check()/.uncheck(), Select: .selectOption()
- [x] Dialog auto-handling: alert/confirm/prompt
- [x] Multi-tab support
- [x] Screenshot after every step
- [x] Video recording of full execution (.webm)
- [x] Async execution — server returns execution ID immediately, runs in background
- [x] SSE (Server-Sent Events) live stream endpoint

### Phase 3: Live Execution Viewer
- [x] Live Viewer popup window opens automatically when executing
- [x] Real-time screenshot display via SSE updates
- [x] Progress bar with passed/failed counters
- [x] Sidebar with per-step status (active, passed, failed)
- [x] Error detail inline per failed step
- [x] Execution-done banner with video link

### Phase 4: Error Reporting & UX
- [x] StepErrorDetail component with 16+ contextual suggestions
- [x] Locator suggestion service (DOM analysis for alternatives)
- [x] PDF/HTML execution report export
- [x] Retest button
- [x] Execution result auto-scroll
- [x] Bulk step delete
- [x] XPath selector support

### Phase 5: Infrastructure
- [x] Single Docker container (backend + frontend served together on port 3000)
- [x] Xvfb virtual display for headed browser in Docker
- [x] PostgreSQL 16 + persistent volume
- [x] Prisma ORM with migrations
- [x] Swagger/OpenAPI documentation at `/api/docs`
- [x] GitHub Actions CI/CD
- [x] Credential sanitization (no secrets in git)

### Phase 6: UI Polish & Responsive Design
- [x] Dark theme readability fixed across all pages (ScenarioDetailPage, TestStepList, all menus)
- [x] Light theme support — comprehensive CSS overrides for all dark tokens, hover states, RGBA borders
- [x] Layout.jsx refactored — Settings moved to top-right header (gear icon), user dropdown from avatar
- [x] Responsive sidebar — mobile overlay drawer (`< lg`), desktop inline collapsible
- [x] Responsive pages — DashboardPage, ScenariosPage, ReportsPage, ScenarioDetailPage, SettingsPage, ImportExportPage, ExecutionPage all adapt to small screens
- [x] Touch-friendly tap targets (min 40px) via global CSS
- [x] Browser autofill dark/light override (`-webkit-box-shadow inset`)
- [x] LoginPage redesigned — dark card design with autofill fix
- [x] RegisterPage fully redesigned — matches LoginPage design system, English language, password strength UI
- [x] Default theme changed to **light**

### Phase 7: Error Handling & Special Pages
- [x] 404 NotFoundPage — unknown routes redirect here instead of dashboard
- [x] Maintenance page — accessible at `/maintenance`, animated status badge
- [x] Session Expired page — triggered automatically on 401 API response
- [x] 403 Forbidden page — triggered automatically on 403 API response
- [x] 500 Server Error page — triggered automatically on 5xx API response
- [x] React ErrorBoundary — wraps entire app, catches render crashes, prevents blank white screen
- [x] OfflineBanner — top banner appears automatically when internet disconnects, dismisses on reconnect
- [x] API interceptor updated — routes 401/403/5xx to correct error pages automatically

### Phase 8: UI Fixes & Light Theme Compatibility
- [x] Search bug fixed — backend expects `query` param, not `q`
- [x] Search response structure fixed — map `{scenarios, total, hasMore}` to pagination object correctly
- [x] Stats cards redesigned across all pages (ScenariosPage, ExecutionPage, ReportsPage, ScenarioDetailPage) — modern icon + number layout using `linear-card`
- [x] Execution result stats cards light theme fix — `bg-[#0F170F]`/`bg-[#170F0F]` override to green/red tint in light mode
- [x] Alert component light theme fix — `bg-[#1F0F0F]`, `bg-[#0F1F17]`, `bg-[#1F1A0F]`, `bg-[#1A1A2E]` override to pastel colors per theme
- [x] Border `border-[#2A2A2D]` override to `#DDDDE0` in light mode

---

```
Architecture
├─ Proxy Recording Engine           [=============================] 100% DONE
├─ Execution Engine (Headed)        [=============================] 100% DONE
├─ Live Execution Viewer (SSE)      [=============================] 100% DONE
├─ Error Handling & Suggestions     [=============================] 100% DONE
├─ Video Recording                  [=============================] 100% DONE
├─ Report Export (HTML/PDF)         [=============================] 100% DONE
├─ Docker (Single Container)        [=============================] 100% DONE
├─ Xvfb Virtual Display             [=============================] 100% DONE
├─ API Documentation (Swagger)      [=============================] 100% DONE
├─ Error Pages & Boundaries         [=============================] 100% DONE
├─ Light Theme Compatibility        [=============================] 100% DONE
└─ CI/CD (GitHub Actions)           [-----------------------------] REMOVED
```

**Overall Feature Completeness: 100%** (Production-ready)

---

## 🎯 Test Credentials

```
Email:    admin@testingndrih.local
Password: changeme123
URL:      http://localhost:3000
```

---

## 🔐 Security

- `.env` files excluded from git via `.gitignore`
- `.env.example` provided as template
- JWT secret via environment variable
- No secrets committed to repository
- Database credentials in Docker environment only

---

## 📝 Architecture

```
testingndrih/
├── Dockerfile                    # Multi-stage: React build → Node server + Xvfb
├── docker-compose.yml            # App (port 3000) + PostgreSQL 16
├── .env.example                  # Environment variable template
├── .gitignore
├── README.md
├── plan.md                       # This file
│
├── backend/
│   ├── src/
│   │   ├── server.js             # Express app + static frontend serving
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── executionController.js  # + liveStream + liveView handlers
│   │   │   ├── recorderController.js   # + proxyPage + receiveStep handlers
│   │   │   ├── scenarioController.js
│   │   │   ├── testStepController.js
│   │   │   ├── fileController.js
│   │   │   └── searchController.js
│   │   ├── services/
│   │   │   ├── executionService.js     # Playwright executor + EventEmitter SSE
│   │   │   ├── recorderService.js      # Proxy recorder + step capture script
│   │   │   ├── reportService.js        # HTML/PDF report generation
│   │   │   ├── scenarioService.js
│   │   │   ├── testStepService.js
│   │   │   ├── fileService.js
│   │   │   ├── locatorSuggestionService.js
│   │   │   └── searchService.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── executionRoutes.js      # + /live-view + /live-stream
│   │   │   ├── recorderRoutes.js       # + /proxy + /step/:scenarioId
│   │   │   └── ...
│   │   ├── middleware/
│   │   │   └── auth.js                 # JWT authentication
│   │   ├── lib/
│   │   │   └── prisma.js
│   │   └── utils/
│   ├── prisma/
│   │   ├── schema.prisma         # DB schema
│   │   └── migrations/
│   ├── templates/                # CSV import templates
│   ├── seed.js                   # Admin user seeder
│   ├── jest.config.js
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── main.jsx
    │   ├── pages/
    │   │   ├── LoginPage.jsx
    │   │   ├── RegisterPage.jsx
    │   │   ├── DashboardPage.jsx
    │   │   ├── ScenariosPage.jsx
    │   │   ├── ScenarioDetailPage.jsx  # Record + Edit + Execute + Live Viewer
    │   │   ├── ExecutionPage.jsx       # History + Details
│   │   │   ├── ReportsPage.jsx
│   │   │   └── SettingsPage.jsx
    │   ├── components/
    │   │   ├── StepErrorDetail.jsx
    │   │   ├── TestStepList.jsx
    │   │   ├── Layout.jsx
    │   │   └── ui/
    │   ├── services/
    │   │   └── api.js              # Axios client + all API endpoints
    │   └── store/
    │       └── authStore.js
    ├── e2e/                        # Playwright E2E test specs
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    └── package.json
```

---

## 🎬 How It Works

### Recording (Proxy-based)
1. User opens a scenario → clicks "Mulai Recording" → enters target URL
2. Server fetches target HTML, strips CSP, injects recorder script + toolbar
3. New browser window opens showing the proxied page
4. User interacts (click, fill, navigate) — steps are sent to backend via `fetch`
5. User clicks "Stop Recording" → browser window closes automatically
6. Steps are auto-saved to the database

### Execution (Headed via Xvfb)
1. User clicks "Jalankan Skenario"
2. Live Viewer popup opens immediately
3. Backend creates execution record, returns ID
4. Firefox launches headed on Xvfb `:99` virtual display
5. Live Viewer connects to SSE stream (`/api/executions/:id/live-stream`)
6. Screenshots streamed in real-time after each step
7. Failed step: full-page screenshot with red error overlay + rich error detail
8. Execution done: video link available in Live Viewer

---

## 🔧 Environment Variables (.env)

```
DATABASE_URL=postgresql://testingndrih_user:testingndrih_pass_2026@postgres:5432/testingndrih
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=7d
PORT=3000
SEED_EMAIL=admin@testingndrih.local
SEED_PASSWORD=changeme123
```

---

## 🚀 Future Enhancements

- [ ] Parallel execution (multiple scenarios at once)
- [ ] Scheduled execution (cron jobs)  
- [ ] Team collaboration (shared scenarios)
- [ ] Role-based access control
- [ ] Deployment guide / architecture docs

