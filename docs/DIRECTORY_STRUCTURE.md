# Directory Structure

Struktur folder lengkap project **Test Sambil Ngopi** (TestingNDRIH).

**Last Updated:** June 4, 2026

---

## Root

```
testingndrih/
├── README.md                       # Overview & quick start
├── PROJECT_STRUCTURE.md            # Redirect ke /docs
├── package.json                    # Monorepo workspaces + health-check script
├── docker-compose.yml              # PostgreSQL + app
├── Dockerfile                      # Multi-stage build
├── .env.example                    # Environment template
├── commitlint.config.js            # Conventional commits
│
├── scripts/
│   └── health-check.js             # Cek kesehatan backend/frontend/DB
│
├── .github/workflows/
│   ├── release.yml                 # Semantic release
│   └── ci-run-scenario.example.yml # Contoh CI dengan API token
│
├── backend/                        # Node.js Express API
├── frontend/                       # React SPA
└── docs/                           # Dokumentasi
```

---

## Backend

```
backend/
├── package.json
├── jest.config.js
├── jest-setup.js
├── Dockerfile
│
├── scripts/
│   └── seed.js                     # Seed user & data awal
│
├── src/
│   ├── server.js                   # Entry point Express
│   │
│   ├── controllers/                # HTTP handlers (22 controllers)
│   │   ├── authController.js
│   │   ├── scenarioController.js
│   │   ├── testStepController.js
│   │   ├── executionController.js
│   │   ├── recorderController.js
│   │   ├── chainController.js
│   │   ├── analyticsController.js
│   │   ├── searchController.js
│   │   ├── fileController.js
│   │   ├── importController.js
│   │   ├── smokeTestController.js
│   │   ├── stressTestController.js
│   │   ├── securityTestController.js
│   │   ├── apiTestController.js
│   │   ├── issueController.js
│   │   ├── notificationController.js
│   │   ├── apiTokenController.js
│   │   ├── ciController.js
│   │   ├── environmentController.js
│   │   ├── visualRegressionController.js
│   │   └── __tests__/
│   │
│   ├── services/                   # Business logic (30+ services)
│   │   ├── scenarioService.js
│   │   ├── testStepService.js
│   │   ├── executionService.js
│   │   ├── recorderService.js
│   │   ├── chainService.js
│   │   ├── schedulerService.js
│   │   ├── parallelExecutionService.js
│   │   ├── browserMatrixService.js
│   │   ├── smokeTestService.js
│   │   ├── stressTestService.js
│   │   ├── securityTestService.js
│   │   ├── analyticsService.js
│   │   ├── searchService.js
│   │   ├── reportService.js
│   │   ├── emailService.js
│   │   ├── notificationService.js
│   │   ├── apiTestService.js
│   │   ├── issueService.js
│   │   ├── apiTokenService.js
│   │   ├── environmentService.js
│   │   ├── visualRegressionService.js
│   │   ├── screenshotComparisonService.js
│   │   ├── locatorSuggestionService.js
│   │   ├── locatorRepairService.js
│   │   ├── retryEngineService.js
│   │   ├── excelImportService.js
│   │   ├── fileService.js
│   │   ├── browserService.js
│   │   └── __tests__/
│   │
│   ├── routes/                     # REST endpoints (24 route files)
│   │   ├── authRoutes.js
│   │   ├── scenarioRoutes.js
│   │   ├── testStepRoutes.js
│   │   ├── executionRoutes.js
│   │   ├── recorderRoutes.js
│   │   ├── chainRoutes.js
│   │   ├── schedulerRoutes.js
│   │   ├── parallelExecutionRoutes.js
│   │   ├── browserMatrixRoutes.js
│   │   ├── smokeTestRoutes.js
│   │   ├── stressTestRoutes.js
│   │   ├── securityTestRoutes.js
│   │   ├── analyticsRoutes.js
│   │   ├── searchRoutes.js
│   │   ├── fileRoutes.js
│   │   ├── importRoutes.js
│   │   ├── stepTypeRoutes.js
│   │   ├── apiTestRoutes.js
│   │   ├── issueRoutes.js
│   │   ├── notificationRoutes.js
│   │   ├── apiTokenRoutes.js
│   │   ├── ciRoutes.js
│   │   ├── environmentRoutes.js
│   │   └── visualRegressionRoutes.js
│   │
│   ├── middleware/
│   │   └── auth.js
│   │
│   ├── lib/
│   │   ├── prisma.js
│   │   ├── swagger.js
│   │   ├── logger.js
│   │   └── browserLauncher.js
│   │
│   └── utils/
│       ├── jwt.js
│       ├── password.js
│       ├── errorHandler.js
│       ├── secretCrypto.js
│       ├── variableSubstitution.js
│       ├── imageDiff.js
│       └── __tests__/
│
├── tests/
│   ├── integration/                # Auth, scenario, execution, parallel, scheduler
│   ├── security/                   # SQL injection, XSS, CSRF, OWASP
│   └── database/                   # Integrity, transactions, performance
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/                 # 15 migrations
│
├── templates/                      # CSV import templates
├── public/
└── uploads/                        # Screenshots, videos, visual baselines (gitignored)
```

---

## Frontend

```
frontend/
├── package.json
├── vite.config.js
├── tailwind.config.js
├── playwright.config.js
├── index.html
│
├── src/
│   ├── main.jsx
│   ├── App.jsx                     # Routing & layout
│   ├── index.css
│   │
│   ├── pages/                      # 33 halaman
│   │   ├── DashboardPage.jsx
│   │   ├── ScenariosPage.jsx
│   │   ├── ScenarioDetailPage.jsx
│   │   ├── ChainsPage.jsx
│   │   ├── ChainBuilderPage.jsx
│   │   ├── ChainExecutorPage.jsx
│   │   ├── ExecutionPage.jsx
│   │   ├── ParallelExecutionPage.jsx
│   │   ├── BrowserMatrixPage.jsx
│   │   ├── SchedulerPage.jsx
│   │   ├── SmokeTest.jsx
│   │   ├── StressTestPage.jsx
│   │   ├── SecurityTestPage.jsx
│   │   ├── ApiTestingPage.jsx
│   │   ├── IssuesPage.jsx
│   │   ├── EnvironmentsPage.jsx
│   │   ├── VisualRegressionPage.jsx
│   │   ├── AnalyticsPage.jsx
│   │   ├── ReportsPage.jsx
│   │   ├── SettingsPage.jsx
│   │   ├── LoginPage.jsx / RegisterPage.jsx
│   │   ├── ForgotPasswordPage.jsx / ResetPasswordPage.jsx
│   │   ├── *HelpPage.jsx / error pages
│   │   └── ...
│   │
│   ├── components/                 # 30+ komponen reusable
│   │   ├── Layout.jsx
│   │   ├── ProtectedRoute.jsx
│   │   ├── HelpModal.jsx
│   │   ├── IntegrationsSettings.jsx
│   │   ├── ExecuteScenarioButton.jsx
│   │   ├── ScenariosList.jsx
│   │   ├── TestStepList.jsx
│   │   ├── BrowserSelector.jsx
│   │   ├── SmokeTest* / StressTest* / Security*
│   │   └── ui/index.jsx
│   │
│   ├── services/                   # API clients
│   │   ├── api.js
│   │   ├── authService.js
│   │   ├── scenarioService.js
│   │   ├── executionService.js
│   │   └── analyticsService.js
│   │
│   ├── store/                      # Zustand
│   │   ├── authStore.js
│   │   ├── settingsStore.js
│   │   └── uiStore.js
│   │
│   └── utils/
│       ├── exportUtils.js
│       └── testAnalysis.js
│
├── e2e/                            # 15 Playwright specs
│   ├── auth.spec.js / auth-e2e.spec.js
│   ├── scenarios.spec.js / scenario-e2e.spec.js
│   ├── execution-e2e.spec.js
│   ├── parallel-e2e.spec.js
│   ├── scheduler-e2e.spec.js
│   ├── browser-matrix-e2e.spec.js
│   └── ...
│
└── public/
```

---

## Documentation

```
docs/
├── README.md               # Index dokumentasi
├── ARCHITECTURE.md         # Arsitektur teknis
├── DIRECTORY_STRUCTURE.md  # File ini
├── SETUP.md                # Instalasi & troubleshooting
└── TESTING.md              # Strategi & panduan testing
```

---

## File Counts

| Area | Count |
|------|-------|
| Backend controllers | 22 |
| Backend services | 30+ |
| Backend routes | 24 |
| Frontend pages | 33 |
| Frontend components | 30+ |
| Database migrations | 15 |
| E2E specs | 15 |

---

## Konvensi Penamaan

| Tipe | Pola |
|------|------|
| Controller | `*Controller.js` |
| Service | `*Service.js` |
| Route | `*Routes.js` |
| Page | `*Page.jsx` |
| Component | PascalCase `.jsx` |

---

## File yang Dihapus (Cleanup Juni 2026)

File berikut tidak lagi digunakan dan telah dihapus:

- `backend/test-output.txt`, `test-final.txt`, `analytics-test*.txt`, `integration_test_output.txt`
- `backend/test-api.html`, `frontend/test-translations.html`
- `backend/create-user-simple.js`, `create-test-user.js` (diganti `backend/scripts/seed.js`)
- `frontend/src/data/helpContent.js` (konten inline di `HelpModal.jsx`)
- `frontend/src/hooks/useLoading.js` (menggunakan `loadingStore` langsung)
- `health-check.js` (root) → `scripts/health-check.js`
