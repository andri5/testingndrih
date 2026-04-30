# 📁 Test Sambil Ngopi Coy - Project Structure

**Last Updated**: April 28, 2026
**Version**: 2.1.0
**Status**: Production Ready ✅

---

## 📂 Directory Tree

```
testingndrih/
├── docker-compose.yml              # PostgreSQL + App container orchestration
├── Dockerfile                      # Production image (React build + Express)
├── package.json                    # Root workspace (monorepo: backend + frontend)
├── .env.example                    # Environment template
├── README.md                       # Project overview & quick start
├── PROJECT_STRUCTURE.md            # This file
├── docs/guides/PROJECT_PLAN.md     # Development roadmap & task log
│
├── backend/                        # Node.js + Express API (ESM modules, port 5001)
│   ├── package.json
│   ├── jest.config.js
│   ├── babel.config.js
│   ├── nodemon.json
│   ├── seed.js                     # DB seed (creates default admin user)
│   │
│   ├── prisma/
│   │   ├── schema.prisma           # Full DB schema
│   │   └── migrations/             # Prisma migration history
│   │
│   ├── src/
│   │   ├── server.js               # Express entry point (middleware + route registration)
│   │   │
│   │   ├── controllers/            # HTTP request handlers (thin layer, calls services)
│   │   │   ├── authController.js
│   │   │   ├── scenarioController.js
│   │   │   ├── testStepController.js
│   │   │   ├── executionController.js
│   │   │   ├── recorderController.js
│   │   │   ├── chainController.js
│   │   │   ├── analyticsController.js
│   │   │   ├── searchController.js
│   │   │   └── fileController.js
│   │   │
│   │   ├── services/               # Business logic layer
│   │   │   ├── scenarioService.js
│   │   │   ├── testStepService.js      # ⚠️ stepNumber uses DB transaction (race-condition safe)
│   │   │   ├── executionService.js     # Step-by-step Playwright execution
│   │   │   ├── recorderService.js      # Playwright headless recording engine
│   │   │   ├── browserService.js       # Browser availability detection
│   │   │   ├── chainService.js         # Test chain management
│   │   │   ├── analyticsService.js
│   │   │   ├── searchService.js
│   │   │   ├── emailService.js         # Nodemailer SMTP (password reset)
│   │   │   ├── reportService.js
│   │   │   ├── schedulerService.js     # Cron-based recurring test runs
│   │   │   ├── parallelExecutionService.js
│   │   │   ├── browserMatrixService.js
│   │   │   ├── retryEngineService.js
│   │   │   ├── locatorRepairService.js
│   │   │   ├── locatorSuggestionService.js
│   │   │   ├── screenshotComparisonService.js
│   │   │   └── fileService.js
│   │   │
│   │   ├── routes/                 # Express route definitions
│   │   │   ├── authRoutes.js
│   │   │   ├── scenarioRoutes.js
│   │   │   ├── testStepRoutes.js
│   │   │   ├── executionRoutes.js
│   │   │   ├── recorderRoutes.js
│   │   │   ├── chainRoutes.js
│   │   │   ├── analyticsRoutes.js
│   │   │   ├── searchRoutes.js
│   │   │   ├── schedulerRoutes.js
│   │   │   ├── parallelExecutionRoutes.js
│   │   │   ├── browserMatrixRoutes.js
│   │   │   ├── fileRoutes.js
│   │   │   └── stepTypeRoutes.js
│   │   │
│   │   ├── middleware/
│   │   │   └── auth.js             # JWT authentication middleware
│   │   │
│   │   ├── lib/
│   │   │   ├── prisma.js           # Prisma client singleton
│   │   │   └── swagger.js          # Swagger/OpenAPI docs setup
│   │   │
│   │   └── utils/
│   │       ├── jwt.js              # JWT sign/verify
│   │       ├── password.js         # bcrypt hash/compare
│   │       └── errorHandler.js     # Global Express error handler
│   │
│   └── uploads/
│       ├── screenshots/            # Step & execution screenshots
│       └── videos/                 # Playwright video recordings
│
├── frontend/                       # React 18 + Vite + TailwindCSS (port 3001)
│   ├── package.json
│   ├── vite.config.js              # Port 3001, /api proxy → localhost:5001
│   ├── tailwind.config.js          # Custom colors + animations (fade-in, slide-up)
│   ├── postcss.config.js
│   ├── index.html
│   ├── playwright.config.js        # E2E test config
│   │
│   ├── src/
│   │   ├── main.jsx                # React DOM entry
│   │   ├── App.jsx                 # Router + ProtectedRoute setup
│   │   ├── index.css               # Global styles + html.theme-light overrides
│   │   │
│   │   ├── pages/                  # Route-level components (one per page)
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── ScenariosPage.jsx       # List + Quick Record + Templates + Bulk Execute
│   │   │   ├── ScenarioDetailPage.jsx  # Step editor + recorder + execution
│   │   │   ├── ChainsPage.jsx
│   │   │   ├── ChainBuilderPage.jsx    # Chain step reorder/edit (w/ tooltips)
│   │   │   ├── ChainExecutorPage.jsx
│   │   │   ├── ExecutionPage.jsx
│   │   │   ├── ParallelExecutionPage.jsx
│   │   │   ├── AnalyticsPage.jsx
│   │   │   ├── ReportsPage.jsx
│   │   │   ├── SchedulerPage.jsx
│   │   │   ├── BrowserMatrixPage.jsx
│   │   │   ├── SettingsPage.jsx        # Theme (dark/light) + Language (EN/ID)
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── ForgotPasswordPage.jsx
│   │   │   ├── ResetPasswordPage.jsx
│   │   │   ├── NotFoundPage.jsx        # 404
│   │   │   ├── ForbiddenPage.jsx       # 403
│   │   │   ├── ServerErrorPage.jsx     # 500
│   │   │   ├── SessionExpiredPage.jsx
│   │   │   └── MaintenancePage.jsx
│   │   │
│   │   ├── components/             # Reusable UI components
│   │   │   ├── ui/
│   │   │   │   └── index.jsx       # Button, Input, Card, Badge, Spinner, Alert,
│   │   │   │                       # CardHeader/Title/Description/Content,
│   │   │   │                       # Tooltip ← theme-aware + bilingual (EN/ID)
│   │   │   ├── Layout.jsx              # App shell (sidebar + top header)
│   │   │   ├── ScenariosList.jsx       # Scenario cards + tooltips on all action buttons
│   │   │   ├── ScenarioForm.jsx        # Create/edit scenario form
│   │   │   ├── ScenarioSearch.jsx      # Search + filter bar
│   │   │   ├── TestStepList.jsx        # Step list with drag-reorder
│   │   │   ├── ExecuteScenarioButton.jsx
│   │   │   ├── BrowserSelector.jsx     # Browser picker + headless toggle w/ tooltip
│   │   │   ├── SmartSuggestionPanel.jsx
│   │   │   ├── StepErrorDetail.jsx
│   │   │   ├── QuickRecordModal.jsx    # Quick Record Mode: URL → instant recording
│   │   │   ├── TemplatePickerModal.jsx # Template Library (Login, E-Commerce, Nav, Form)
│   │   │   ├── OfflineBanner.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── ErrorBoundary.jsx
│   │   │
│   │   ├── store/                  # Zustand global state
│   │   │   ├── authStore.js        # user, token, login(), logout()
│   │   │   ├── scenarioStore.js
│   │   │   ├── executionStore.js
│   │   │   └── settingsStore.js    # theme ('dark'|'light'), language ('en'|'id')
│   │   │
│   │   └── services/
│   │       └── api.js              # Axios client + all API call wrappers
│   │
│   └── e2e/                        # Playwright E2E tests
│       ├── auth.spec.js
│       ├── scenarios.spec.js
│       ├── execution.spec.js
│       ├── search.spec.js
│       ├── core-features.spec.js
│       ├── comprehensive.spec.js
│       └── ...
│
└── templates/                      # CSV scenario import templates
    ├── login-test.csv
    ├── ecommerce-flow.csv
    ├── basic-navigation.csv
    └── form-test.csv
```

---

## 🔑 Key Files Reference

| File | Keterangan |
|------|------------|
| `backend/src/server.js` | Express app entry, semua middleware & routes |
| `backend/src/services/recorderService.js` | Playwright headless recording engine |
| `backend/src/services/executionService.js` | Eksekusi step-by-step dengan screenshot |
| `backend/src/services/testStepService.js` | CRUD step — `stepNumber` atomic via DB transaction |
| `backend/src/services/schedulerService.js` | Cron-based recurring test runs |
| `backend/prisma/schema.prisma` | Full DB schema |
| `frontend/src/components/ui/index.jsx` | Shared UI components termasuk **Tooltip** |
| `frontend/src/index.css` | Theme overrides (`html.theme-light .class`) |
| `frontend/src/store/settingsStore.js` | Theme + language state (persist ke localStorage) |
| `frontend/src/services/api.js` | Semua panggilan API ke backend (Axios) |
| `frontend/src/App.jsx` | React Router setup + ProtectedRoute |

---

## 🎨 Sistem Tema (Dark / Light)

Tema dikendalikan via CSS class di `<html>`:
- **Dark** (default): tidak ada class
- **Light**: `html.theme-light` ditambahkan → semua warna gelap di-override di `index.css`

Ganti via **Settings → Theme** → disimpan di `localStorage`.

---

## 🌐 Sistem Bahasa (EN / ID)

Bahasa disimpan di `settingsStore` (`'en'` | `'id'`).
Komponen yang mendukung i18n memakai objek terjemahan lokal dan baca `language` dari store.

---

## 💡 Tooltip Component

```jsx
import { Tooltip } from '../components/ui'

<Tooltip text="Keterangan fitur" position="top" delay={300}>
  <Button>Klik</Button>
</Tooltip>
```

| Prop | Default | Keterangan |
|------|---------|------------|
| `text` | — | Teks tooltip |
| `position` | `'top'` | `top` \| `bottom` \| `left` \| `right` |
| `delay` | `300` | Delay muncul (ms) |

Warna otomatis mengikuti tema aktif via CSS class `.tooltip-popup`.
Teks mengikuti bahasa via `useSettingsStore` + local i18n object.

---

## 🗄️ Database Schema (Model Utama)

| Model | Deskripsi |
|-------|-----------|
| `User` | Akun auth (email, password hash, reset token) |
| `Scenario` | Test scenario (name, url, description, stepCount) |
| `TestStep` | Langkah test (type, selector, value, stepNumber) |
| `Execution` | Satu kali eksekusi (status, duration, browser) |
| `ExecutionStep` | Hasil per-step (passed/failed, screenshot, error) |
| `TestChain` | Urutan scenario (sequential suite) |
| `ChainStep` | Scenario dalam chain (stepNumber, runMode, retryCount) |
| `TestSchedule` | Jadwal berulang (cron expression, scenario, isActive) |

---

## 🛠️ Dev Commands

```bash
# Dari root
npm install              # Install semua workspace
npm run dev              # Jalankan backend + frontend bersamaan
npm run dev:backend      # Backend saja (http://localhost:5001)
npm run dev:frontend     # Frontend saja (http://localhost:3001)

# Backend
cd backend
npm test                 # Jest unit tests
npx prisma studio        # GUI database browser
npx prisma migrate dev   # Jalankan migrasi pending

# Frontend
cd frontend
npx playwright test      # E2E tests
npm run build            # Production build → dist/

# Docker (production)
docker compose up -d     # Jalankan DB + App (http://localhost:3000)
docker compose down      # Stop semua
```

---

## 📂 Directory Overview

```
testingndrih/
├── 📄 README.md                          # Main project documentation
├── 📄 docker-compose.yml                 # Docker compose configuration
├── 📄 Dockerfile                         # Root Dockerfile (optional)
│
├── 📁 backend/                           # Node.js Backend (Port 5001)
│   ├── src/                              # Source code
│   │   ├── controllers/                  # Request handlers
│   │   ├── services/                     # Business logic
│   │   ├── routes/                       # API routes
│   │   ├── middleware/                   # Express middleware
│   │   ├── lib/                          # Utilities & helpers
│   │   └── server.js                     # Express app entry point
│   │
│   ├── prisma/                           # Database schema & migrations
│   │   ├── schema.prisma                 # Data model
│   │   └── migrations/                   # Migration history
│   │
│   ├── templates/                        # Test scenario templates
│   ├── uploads/                          # Screenshot uploads
│   │
│   ├── package.json                      # Dependencies & scripts
│   ├── jest.config.js                    # Jest testing config
│   ├── jest-setup.js                     # Jest setup
│   ├── nodemon.json                      # Nodemon auto-reload config
│   ├── babel.config.js                   # Babel transpiler config
│   ├── Dockerfile                        # Backend Docker image
│   └── seed.js                           # Database seeding script
│
├── 📁 frontend/                          # React Frontend (Port 3001)
│   ├── src/                              # React source code
│   │   ├── components/                   # Reusable React components
│   │   │   └── ui/                       # UI components (Button, Card, etc)
│   │   ├── pages/                        # Page components (routing)
│   │   ├── services/                     # API service layer
│   │   ├── store/                        # Zustand state management
│   │   ├── App.jsx                       # Root component
│   │   ├── main.jsx                      # React entry point
│   │   └── index.css                     # Global styles
│   │
│   ├── e2e/                              # E2E tests (Playwright)
│   │   ├── auth.spec.js
│   │   ├── scenarios.spec.js
│   │   └── ... (other e2e tests)
│   │
│   ├── public/                           # Static assets (if exists)
│   ├── package.json                      # Dependencies & scripts
│   ├── vite.config.js                    # Vite bundler config
│   ├── tailwind.config.js                # TailwindCSS config
│   ├── postcss.config.js                 # PostCSS config
│   ├── playwright.config.js              # Playwright E2E config
│   ├── .eslintrc.cjs                     # ESLint config
│   ├── Dockerfile                        # Frontend Docker image
│   └── index.html                        # HTML entry point
│
├── 📁 docs/                              # Documentation
│   └── guides/                           # All documentation files
│       ├── 00_INDEX.md                   # Master documentation index
│       ├── RECORDER_2.0_GUIDE.md         # Playwright recorder architecture
│       ├── MIGRATION_GUIDE.md            # V1.1 → V2.0 migration
│       ├── QUICK_REFERENCE.md            # Quick cheat sheet
│       ├── MANUAL_TESTING_GUIDE.md       # Manual testing procedures
│       ├── FINAL_TEST_REPORT.md          # Test results & validation
│       ├── IMPLEMENTATION_STATUS.md      # Implementation details
│       ├── SUMMARY_REPORT.md             # Executive summary
│       ├── PLAYWRIGHT_RECORDER_E2E_GUIDE.md # E2E testing guide
│       └── PROJECT_PLAN.md               # Project plan
│
├── 📁 .github/                           # GitHub configuration
│   └── workflows/                        # CI/CD workflows
│
├── 📁 .vscode/                           # VS Code settings
│
└── 📁 node_modules/                      # (gitignored) Dependencies
```

---

## 🎯 Key Directories Explained

### `/backend/src/`
**Core application logic**
- `controllers/` - Handle HTTP requests
- `services/` - Business logic (recording, execution, etc)
- `routes/` - API route definitions
- `middleware/` - Auth, error handling, logging
- `lib/` - Database client & utilities
- `server.js` - Express app setup

**Key Features Implemented:**
- Live Execution Viewer with real-time SSE streaming
- **Pause/Stop controls** from live viewer (viewer-pause, viewer-resume, viewer-stop endpoints — no auth)
- Playwright Recorder (record & playback)
- Self-Healing Selectors (Phase 2.1)
- Screenshot Comparison (Phase 2.2)
- Retry Engine for flaky steps
- Cancel execution with real-time loop interrupt

### `/frontend/src/`
**React application**
- `components/` - Reusable UI components
- `pages/` - Full page components (routed)
- `services/` - API client & data fetching
- `store/` - Global state (Zustand)
- `App.jsx` - Root component with routing

### `/docs/guides/`
**Complete documentation**
- Start with: `00_INDEX.md`
- For quick start: `QUICK_REFERENCE.md`
- For testing: `MANUAL_TESTING_GUIDE.md`
- For implementation: `RECORDER_2.0_GUIDE.md`

### `/frontend/e2e/`
**End-to-end tests (Playwright)**
- Auth, scenario, execution, and search flows
- Integrated with `frontend/playwright.config.js`

### `/backend/uploads/`
**Runtime artifacts (gitignored)**
- `screenshots/` for execution and step captures
- `videos/` for Playwright recordings
- `.gitkeep` files are tracked to preserve folder structure

---

## 🗑️ What Was Removed/Moved

### Removed (Not needed)
- ❌ `test-debounce.html` - Old test file
- ❌ `test-double-click.html` - Old test file
- ❌ `test-recorder.html` - Old test file
- ❌ `test-selector.html` - Old test file

### Moved to `/docs/guides/`
- ✅ DOCUMENTATION_INDEX.md → `00_INDEX.md`
- ✅ RECORDER_2.0_GUIDE.md
- ✅ MIGRATION_GUIDE.md
- ✅ QUICK_REFERENCE.md
- ✅ MANUAL_TESTING_GUIDE.md
- ✅ FINAL_TEST_REPORT.md
- ✅ IMPLEMENTATION_STATUS.md
- ✅ SUMMARY_REPORT.md
- ✅ PLAYWRIGHT_RECORDER_E2E_GUIDE.md
- ✅ plan.md → `PROJECT_PLAN.md`

---

## 📋 File Organization Rules

### Root Level (Keep Minimal)
```
✅ README.md              - Project overview
✅ docker-compose.yml     - Docker setup
✅ Dockerfile             - Root docker config
✅ .env files            - Environment variables
✅ .gitignore            - Git ignore rules
```

### Backend Root (Clean)
```
✅ package.json          - Dependencies
✅ jest.config.js        - Testing config
✅ nodemon.json          - Dev server config
✅ babel.config.js       - Transpiler config
✅ src/                  - All source code
✅ prisma/               - Database schema
✅ templates/            - Test templates
✅ uploads/              - File uploads
```

### Frontend Root (Clean)
```
✅ package.json          - Dependencies
✅ vite.config.js        - Build config
✅ tailwind.config.js    - Styling config
✅ src/                  - All source code
✅ e2e/                  - E2E tests
✅ index.html            - Entry point
```

---

## 🔄 Running Tests

### Backend Tests
```bash
# From root
npm run test --workspace=backend
```

### Frontend Tests
```bash
# From root
npm run test --workspace=frontend
npm run e2e --workspace=frontend
```

---

## 📚 Documentation Quick Links

| Need | File |
|------|------|
| Start here | `/docs/guides/00_INDEX.md` |
| Quick commands | `/docs/guides/QUICK_REFERENCE.md` |
| Manual testing | `/docs/guides/MANUAL_TESTING_GUIDE.md` |
| Architecture | `/docs/guides/RECORDER_2.0_GUIDE.md` |
| Upgrading | `/docs/guides/MIGRATION_GUIDE.md` |
| Test results | `/docs/guides/FINAL_TEST_REPORT.md` |

---

## 🎯 Project Organization Summary

### Before ❌
```
Root had 19+ files including:
- Docs scattered everywhere
- Test files in wrong places
- Old coverage folders
- HTML test files not needed
```

### After ✅
```
Root now has only:
- README.md (main doc)
- backend/ (source code)
- frontend/ (source code)
- docs/ (all documentation)
- Configuration files only
```

### Benefits
✅ Cleaner project structure  
✅ Easier to navigate  
✅ Documentation centralized  
✅ Test files organized  
✅ Production-ready layout  

---

## ⚙️ Next Steps

1. **Read documentation** from `/docs/guides/00_INDEX.md`
2. **Run tests** via workspace scripts in `package.json`
3. **Keep runtime artifacts** inside `/backend/uploads/` (already gitignored)
4. **Deploy with confidence** - structure is now production-ready

---

## 📞 Structure Maintained

| Component | Status |
|-----------|--------|
| Backend source code | ✅ Intact & organized |
| Frontend source code | ✅ Intact & organized |
| Documentation | ✅ Centralized in `/docs/` |
| Tests | ✅ Organized in backend/frontend workspaces |
| Configuration | ✅ All config files preserved |
| .env & secrets | ✅ In appropriate locations |
| Build & deployment | ✅ Ready to go |

---

**Project is now clean, organized, and production-ready! 🚀**
