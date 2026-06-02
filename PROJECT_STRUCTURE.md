# � Documentation Moved

This file has been reorganized and consolidated into the `/docs` folder for better clarity and maintainability.

## 📚 New Documentation Structure

Please refer to the following files in the `/docs` folder:

- **[`/docs/README.md`](./docs/README.md)** - Documentation index & navigation guide
- **[`/docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)** - Technical architecture & components overview  
- **[`/docs/DIRECTORY_STRUCTURE.md`](./docs/DIRECTORY_STRUCTURE.md)** - Complete file organization
- **[`/docs/SETUP.md`](./docs/SETUP.md)** - Installation, configuration & troubleshooting

---

## ✨ Project Overview (Archived)

**Test Sambil Ngopi** adalah platform automated testing yang memungkinkan pengguna merekam interaksi browser dan memutal ulang sebagai test cases. Dibangun dengan React 18 frontend dan Node.js/Express backend.

- **Tech Stack**: React 18 + Vite + TailwindCSS | Node.js + Express | PostgreSQL + Prisma | Playwright
- **Architecture**: Monorepo (backend + frontend) dengan Docker orchestration  
- **Key Features**: Recording, Playback, Scheduling, Cross-browser testing, Dark/Light theme, Multi-language
- **Status**: Production Ready ✅

---

## 📂 Directory Structure

```
testingndrih/
│
├── 📄 README.md                    # Project overview & getting started
├── 📄 PROJECT_STRUCTURE.md         # This file - project organization
├── 📄 docker-compose.yml           # Docker compose config (PostgreSQL + App)
├── 📄 Dockerfile                   # Multi-stage Docker build
├── 📄 .env.example                 # Environment variables template
├── 📄 .gitignore                   # Git ignore rules
├── 📄 .dockerignore                # Docker ignore rules
├── 📄 package.json                 # Monorepo root package
├── 📄 commitlint.config.js         # Commit lint configuration
│
├── 📁 .github/                     # GitHub configuration
│   ├── 📁 workflows/               # CI/CD workflows
│   │   └── release.yml             # Semantic release automation
│
├── 📁 backend/                     # Node.js Express API Server
│   ├── 📄 package.json             # Dependencies & npm scripts
│   ├── 📄 Dockerfile               # Backend Docker image
│   ├── 📄 jest.config.js           # Jest testing configuration
│   ├── 📄 jest-setup.js            # Jest setup file
│   ├── 📄 babel.config.js          # Babel transpiler config
│   ├── 📄 nodemon.json             # Nodemon auto-reload config
│   ├── 📄 seed.js                  # Database seed script
│   │
│   ├── 📁 src/                     # Source code
│   │   ├── 📄 server.js            # Express app entry point
│   │   │
│   │   ├── 📁 controllers/         # HTTP request handlers
│   │   │   ├── authController.js           # Authentication
│   │   │   ├── scenarioController.js       # Scenario CRUD
│   │   │   ├── testStepController.js       # Test step management
│   │   │   ├── executionController.js      # Test execution
│   │   │   ├── recorderController.js       # Playwright recording
│   │   │   ├── chainController.js          # Test chain management
│   │   │   ├── analyticsController.js      # Analytics & reports
│   │   │   ├── searchController.js         # Search functionality
│   │   │   ├── fileController.js           # File operations
│   │   │   ├── importController.js         # Import scenarios
│   │   │   ├── smokeTestController.js      # Smoke tests
│   │   │   ├── stressTestController.js     # Stress tests
│   │   │   ├── securityTestController.js   # Security tests
│   │   │   └── __tests__/                  # Controller unit tests
│   │   │
│   │   ├── 📁 services/            # Business logic layer
│   │   │   ├── authService.js              # Auth & user management
│   │   │   ├── scenarioService.js          # Scenario operations
│   │   │   ├── testStepService.js          # Step management (atomic DB transactions)
│   │   │   ├── executionService.js         # Playwright step-by-step execution
│   │   │   ├── recorderService.js          # Headless browser recording engine
│   │   │   ├── browserService.js           # Browser availability detection
│   │   │   ├── chainService.js             # Test chain execution
│   │   │   ├── analyticsService.js         # Analytics & metrics
│   │   │   ├── searchService.js            # Search & filtering
│   │   │   ├── emailService.js             # Email (password reset via Nodemailer)
│   │   │   ├── reportService.js            # Report generation
│   │   │   ├── schedulerService.js         # Cron-based scheduling
│   │   │   ├── parallelExecutionService.js # Parallel test runs
│   │   │   ├── browserMatrixService.js     # Cross-browser testing
│   │   │   ├── retryEngineService.js       # Smart retry logic
│   │   │   ├── fileService.js              # File operations
│   │   │   └── __tests__/                  # Service unit tests
│   │   │
│   │   ├── 📁 routes/              # Express route definitions
│   │   │   ├── authRoutes.js       # Auth endpoints
│   │   │   ├── scenarioRoutes.js   # Scenario endpoints
│   │   │   ├── testStepRoutes.js   # Step endpoints
│   │   │   ├── executionRoutes.js  # Execution endpoints
│   │   │   ├── recorderRoutes.js   # Recorder endpoints
│   │   │   ├── chainRoutes.js      # Chain endpoints
│   │   │   ├── analyticsRoutes.js  # Analytics endpoints
│   │   │   ├── searchRoutes.js     # Search endpoints
│   │   │   ├── schedulerRoutes.js  # Scheduler endpoints
│   │   │   ├── fileRoutes.js       # File endpoints
│   │   │   ├── importRoutes.js     # Import endpoints
│   │   │   ├── parallelExecutionRoutes.js
│   │   │   ├── browserMatrixRoutes.js
│   │   │   └── stepTypeRoutes.js   # Step type reference
│   │   │
│   │   ├── 📁 middleware/          # Express middleware
│   │   │   ├── auth.js             # JWT authentication
│   │   │   └── __tests__/          # Middleware tests
│   │   │
│   │   ├── 📁 lib/                 # Library & utilities
│   │   │   ├── prisma.js           # Prisma client singleton
│   │   │   └── swagger.js          # Swagger/OpenAPI docs
│   │   │
│   │   └── 📁 utils/               # Helper utilities
│   │       ├── jwt.js              # JWT token utilities
│   │       ├── password.js         # Password hashing (bcrypt)
│   │       └── errorHandler.js     # Error handling utilities
│   │
│   ├── 📁 prisma/                  # Database schema & migrations
│   │   ├── schema.prisma           # Prisma data model
│   │   └── migrations/             # Migration history
│   │       └── [timestamp]_*/      # Individual migrations
│   │
│   ├── 📁 templates/               # Test scenario templates (CSV)
│   │   ├── login-test.csv          # Login flow template
│   │   ├── ecommerce-flow.csv      # E-commerce template
│   │   ├── basic-navigation.csv    # Navigation template
│   │   └── form-test.csv           # Form submission template
│   │
│   ├── 📁 uploads/                 # Runtime generated files (gitignored)
│   │   ├── 📁 screenshots/         # Execution & step screenshots
│   │   └── 📁 videos/              # Playwright video recordings
│   │
│   └── 📁 public/                  # Static assets
│       └── logo-icon.png           # Logo icon for UI
│
├── 📁 frontend/                    # React 18 Frontend (Vite + TailwindCSS)
│   ├── 📄 package.json             # Dependencies & npm scripts
│   ├── 📄 Dockerfile               # Frontend Docker image (multi-stage build)
│   ├── 📄 index.html               # HTML entry point
│   ├── 📄 vite.config.js           # Vite bundler configuration
│   ├── 📄 tailwind.config.js       # TailwindCSS configuration
│   ├── 📄 postcss.config.js        # PostCSS configuration
│   ├── 📄 playwright.config.js     # E2E test configuration
│   ├── 📄 .eslintrc.cjs            # ESLint rules
│   │
│   ├── 📁 public/                  # Static assets
│   │   ├── logo-icon.png           # Logo icon
│   │   └── favicon.ico             # Browser favicon
│   │
│   ├── 📁 src/                     # React source code
│   │   ├── 📄 main.jsx             # React DOM entry point
│   │   ├── 📄 App.jsx              # Root component (Router setup)
│   │   ├── 📄 index.css            # Global styles & theme overrides
│   │   │
│   │   ├── 📁 pages/               # Route-level components (Page components)
│   │   │   ├── LoginPage.jsx              # Authentication
│   │   │   ├── RegisterPage.jsx           # User registration
│   │   │   ├── ForgotPasswordPage.jsx     # Password reset request
│   │   │   ├── ResetPasswordPage.jsx      # Password reset form
│   │   │   ├── DashboardPage.jsx          # Main dashboard
│   │   │   ├── ScenariosPage.jsx          # Scenario list & management
│   │   │   ├── ScenarioDetailPage.jsx     # Scenario editor & recorder
│   │   │   ├── ChainsPage.jsx             # Test chain list
│   │   │   ├── ChainBuilderPage.jsx       # Chain builder/editor
│   │   │   ├── ChainExecutorPage.jsx      # Chain execution view
│   │   │   ├── ExecutionPage.jsx          # Execution history & live viewer
│   │   │   ├── ParallelExecutionPage.jsx  # Parallel execution setup
│   │   │   ├── AnalyticsPage.jsx          # Analytics & metrics
│   │   │   ├── ReportsPage.jsx            # Test reports
│   │   │   ├── SchedulerPage.jsx          # Test scheduling
│   │   │   ├── BrowserMatrixPage.jsx      # Cross-browser testing
│   │   │   ├── SettingsPage.jsx           # User settings (theme, language, profile)
│   │   │   ├── NotFoundPage.jsx           # 404 error page
│   │   │   ├── ForbiddenPage.jsx          # 403 error page
│   │   │   ├── ServerErrorPage.jsx        # 500 error page
│   │   │   ├── SessionExpiredPage.jsx     # Session timeout page
│   │   │   └── MaintenancePage.jsx        # Maintenance page
│   │   │
│   │   ├── 📁 components/          # Reusable React components
│   │   │   ├── 📁 ui/              # Base UI components
│   │   │   │   └── index.jsx       # Exported UI components:
│   │   │   │                       # - Button, Input, Card, Badge
│   │   │   │                       # - Spinner, Alert, Tooltip
│   │   │   │                       # - CardHeader, CardTitle, etc
│   │   │   │                       # All components: theme & i18n aware
│   │   │   │
│   │   │   ├── Layout.jsx               # App shell (sidebar + header)
│   │   │   ├── ProtectedRoute.jsx       # Route protection wrapper
│   │   │   ├── ErrorBoundary.jsx        # Error fallback component
│   │   │   ├── OfflineBanner.jsx        # Offline indicator
│   │   │   │
│   │   │   ├── 📁 Scenario Management/
│   │   │   │   ├── ScenariosList.jsx    # Scenario card grid
│   │   │   │   ├── ScenarioForm.jsx     # Create/edit form
│   │   │   │   ├── ScenarioSearch.jsx   # Search & filter bar
│   │   │   │   ├── TemplatePickerModal.jsx # Template library
│   │   │   │   └── ImportPreviewModal.jsx
│   │   │   │
│   │   │   ├── 📁 Test Execution/
│   │   │   │   ├── TestStepList.jsx     # Step list with reorder
│   │   │   │   ├── ExecuteScenarioButton.jsx
│   │   │   │   ├── BrowserSelector.jsx  # Browser picker
│   │   │   │   ├── StepErrorDetail.jsx  # Error details view
│   │   │   │   └── SmartSuggestionPanel.jsx
│   │   │   │
│   │   │   ├── 📁 Recording/
│   │   │   │   └── QuickRecordModal.jsx # Quick record mode
│   │   │   │
│   │   │   ├── 📁 Testing Features/
│   │   │   │   ├── SmokeTestRunner.jsx
│   │   │   │   ├── SmokeTestSummary.jsx
│   │   │   │   ├── SmokeTestHistory.jsx
│   │   │   │   ├── StressTestRunner.jsx
│   │   │   │   ├── StressTestSummary.jsx
│   │   │   │   ├── StressTestMetrics.jsx
│   │   │   │   ├── StressTestHistory.jsx
│   │   │   │   ├── SecurityScanRunner.jsx
│   │   │   │   ├── SecuritySummary.jsx
│   │   │   │   ├── SecurityHistory.jsx
│   │   │   │   └── SecurityFindings.jsx
│   │   │   │
│   │   │   ├── ExportButtons.jsx        # Export scenario
│   │   │   ├── HelpModal.jsx            # Help modal
│   │   │   └── ...
│   │   │
│   │   ├── 📁 services/            # API service layer
│   │   │   └── api.js              # Axios instance + all API wrappers
│   │   │
│   │   ├── 📁 store/               # Zustand global state
│   │   │   ├── authStore.js        # Auth state (user, token, login/logout)
│   │   │   ├── scenarioStore.js    # Scenario state
│   │   │   ├── executionStore.js   # Execution state
│   │   │   └── settingsStore.js    # Settings (theme, language, persist to localStorage)
│   │   │
│   │   ├── 📁 utils/               # Utility functions
│   │   │   └── [utility files]
│   │   │
│   │   └── 📁 assets/              # Static assets
│
│   ├── 📁 e2e/                     # Playwright E2E tests
│   │   ├── auth.spec.js            # Auth flow tests
│   │   ├── scenarios.spec.js        # Scenario CRUD tests
│   │   ├── execution-api.spec.js    # Execution tests
│   │   ├── features-e2e.spec.js     # Feature tests
│   │   ├── search.spec.js           # Search tests
│   │   ├── forgot-password.spec.js  # Password reset tests
│   │   ├── mocked-auth.spec.js      # Mock auth tests
│   │   └── comprehensive.spec.js    # Full workflow tests
│
│   └── 📁 node_modules/            # Dependencies (gitignored)
│
├── 📁 .github/                     # GitHub configuration
│   └── 📁 workflows/               # CI/CD workflows
│
└── 📁 .vscode/                     # VS Code workspace settings
    └── settings.json               # Development environment config
```

---

## 🔑 Key Files Reference

| File | Purpose |
|------|---------|
| `backend/src/server.js` | Express entry point - middleware & route registration |
| `backend/src/services/recorderService.js` | Playwright headless recording engine |
| `backend/src/services/executionService.js` | Step-by-step execution with screenshots |
| `backend/prisma/schema.prisma` | Complete database schema |
| `frontend/src/App.jsx` | React Router setup & protected routes |
| `frontend/src/store/settingsStore.js` | Global theme & language state (localStorage) |
| `frontend/src/services/api.js` | All Axios API calls to backend |
| `frontend/src/components/ui/index.jsx` | Base UI components (theme & i18n aware) |
| `frontend/src/index.css` | Global styles & light theme overrides |

---

## 🎨 Theme System

### Implementation
- **Dark Mode** (default): No HTML class
- **Light Mode**: `class="theme-light"` on `<html>`
- **Toggle**: Settings page → Theme selector
- **Persistence**: Stored in `localStorage` via `settingsStore`
- **Component Support**: All UI components detect theme via CSS class

### Color Palette

| Color | Dark | Light |
|-------|------|-------|
| Background | `#1A1A1C` | `#FFFFFF` |
| Text Primary | `#E0E0E2` | `#1A1A1C` |
| Text Secondary | `#8A8A8F` | `#666666` |
| Border | `#2D2D2F` | `#E0E0E2` |
| Accent | `#5E6AD2` | `#5E6AD2` |

---

## 🌐 Multi-Language Support

### Implementation
- **Languages**: English (EN) & Indonesian (ID)
- **Storage**: Zustand store + localStorage
- **Switch**: Settings page → Language selector
- **Components**: All pages support i18n via local translation objects

### Example Pattern
```jsx
const i18n = {
  en: { title: 'Settings', ... },
  id: { title: 'Pengaturan', ... }
}

const { language } = useSettingsStore()
const t = i18n[language] || i18n.en

return <h1>{t.title}</h1>
```

---

## 📊 Database Models

| Model | Purpose |
|-------|---------|
| `User` | Authentication & user management |
| `Scenario` | Test scenario metadata |
| `TestStep` | Individual test steps with atomic ordering |
| `Execution` | Test run record |
| `ExecutionStep` | Step result with screenshot/error |
| `TestChain` | Grouped scenarios |
| `ChainStep` | Scenario within chain |
| `TestSchedule` | Cron-based test scheduling |

---

## 🛠️ Development Commands

### Setup & Installation
```bash
# Install all dependencies
npm install

# Setup Docker environment
./setup-docker.sh          # Linux/Mac
./setup-docker.bat         # Windows
```

### Development
```bash
# Run entire stack (backend + frontend)
npm run dev

# Backend only
npm run dev:backend        # http://localhost:5001

# Frontend only
npm run dev:frontend       # http://localhost:3000
```

### Testing
```bash
# Backend tests
npm run test --workspace=backend

# Frontend E2E tests
npm run e2e --workspace=frontend

# Frontend unit tests
npm run test --workspace=frontend
```

### Database
```bash
cd backend
npx prisma studio        # GUI database browser
npx prisma migrate dev   # Run pending migrations
npx prisma db seed       # Seed default data
```

### Docker (Production)
```bash
# Start services
docker compose up -d

# Stop services
docker compose down

# View logs
docker compose logs -f app
docker compose logs -f db
```

---

## 📁 Organization Principles

### Root Level
✅ Keep minimal: Only README, docker-compose.yml, Dockerfile, .env files, setup scripts

### Backend
- ✅ Clear separation: controllers → services → database
- ✅ All business logic in services
- ✅ Atomic transactions for critical operations (e.g., step numbering)

### Frontend
- ✅ Components organized by feature/domain
- ✅ Pages for routes, Components for reusables
- ✅ All API calls through services layer
- ✅ Global state via Zustand stores

### Database
- ✅ Prisma ORM for type safety
- ✅ Migrations tracked in version control
- ✅ Seed script for initial data

---

## 📝 File Organization Stats

- **Backend Packages**: ~25 npm dependencies
- **Frontend Packages**: ~30 npm dependencies
- **Controllers**: 13 files
- **Services**: 20+ files
- **Components**: 30+ React components
- **Database Models**: 8 core models
- **E2E Tests**: 8 test suites

---

## ✅ Cleanup Status (May 12, 2026)

### Removed (Not Needed)
- ❌ Old analysis/strategy documents
- ❌ Implementation/testing checklists
- ❌ Query scripts
- ❌ Draft component files
- ❌ Release config (.releaserc.js)

### Organized
- ✅ Components grouped by domain
- ✅ Services layer clearly separated
- ✅ Routes well-organized
- ✅ Documentation in clear structure
- ✅ Static assets in public folders

### Current Features
- ✅ Profile picture upload with file size validation
- ✅ Dark/light theme with conditional styling
- ✅ Multi-language support (EN + ID)
- ✅ Docker containerization with health checks
- ✅ Comprehensive E2E test suite

---

## � Phase 2: Analytics Dashboard (June 2026)

### Overview
Comprehensive analytics dashboard with data visualization, providing insights into test execution metrics, performance trends, and failure analysis.

### Backend Implementation
**Services** (`backend/src/services/analyticsService.js`)
- `getPassFailTrend(userId, days)` - Daily pass/fail statistics
- `getTopFailingSteps(userId, limit)` - Most frequently failing steps ranked
- `getExecutionVolume(userId, days)` - Daily execution activity tracking
- `getScenarioPerformance(userId, limit)` - Scenario success rate ranking

**API Endpoints** (`backend/src/routes/analyticsRoutes.js`)
```
GET /api/analytics/dashboard/trends?days=30
GET /api/analytics/dashboard/failing-steps?limit=10
GET /api/analytics/dashboard/volume?days=30
GET /api/analytics/dashboard/scenario-performance?limit=20
```

### Frontend Implementation
**Enhanced Page** (`frontend/src/pages/AnalyticsPage.jsx`)
- **Pass/Fail Trend Chart** (ComposedChart) - Shows daily pass/fail execution counts
- **Execution Volume Chart** (AreaChart) - Displays testing activity intensity
- **Top Failing Steps** (BarChart) - Ranked failing steps with error counts
- **Scenario Performance** (Progress bars) - Success rate ranking by scenario

**Features**
- Dynamic date range selector (7/30/90 days)
- Interactive tooltips and legends
- Responsive grid layout (mobile/desktop optimized)
- Dark/Light theme support
- Bilingual interface (EN/ID)

**API Methods** (`frontend/src/services/api.js`)
```javascript
analyticsAPI.getPassFailTrend(days)
analyticsAPI.getExecutionVolume(days)
analyticsAPI.getTopFailingSteps(limit)
analyticsAPI.getScenarioPerformance(limit)
```

### Test Coverage
- `analyticsService.test.js` - 8 unit tests (service layer)
- `analyticsController.test.js` - 10 unit tests (controller layer)
- Test Suite: **273/295 tests passing (92.5%)**

### Total Deliverables
- 4 backend service functions
- 4 API controller handlers
- 4 API endpoints
- 4 frontend chart components
- 18 new test cases
- 1,500+ lines of production code

---

## �🚀 Quick Start

1. **Clone & Setup**
   ```bash
   git clone <repo>
   cd testingndrih
   ./setup-docker.bat  # Windows
   ```

2. **Development**
   ```bash
   npm install
   npm run dev
   ```

3. **Access Application**
   - Frontend: http://localhost:3000
   - API Docs: http://localhost:3000/api/docs

4. **Database Management**
   ```bash
   cd backend
   npx prisma studio
   ```

---

## 📞 Support

For issues or questions about project structure, refer to:
- README.md - Project overview
- backend/README.md - Backend specific docs
- frontend/README.md - Frontend specific docs
