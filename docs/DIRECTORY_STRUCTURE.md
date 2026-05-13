# 📋 Complete Directory Structure

Last Updated: May 13, 2026  
Version: 3.0

---

## Root Directory

```
testingndrih/
├── 📄 README.md                      # Project overview & quick start
├── 📄 package.json                   # Monorepo package definition
├── 📄 commitlint.config.js           # Commit message validation
├── 📄 docker-compose.yml             # Docker orchestration config
├── 📄 Dockerfile                     # Main application Docker image
├── 📄 .env.example                   # Environment variables template
├── 📄 .gitignore                     # Git ignore rules
├── 📄 .dockerignore                  # Docker ignore rules
│
├── 📁 backend/                       # Backend API Server (Node.js/Express)
├── 📁 frontend/                      # Frontend Application (React 18)
├── 📁 .github/                       # GitHub workflows & config
├── 📁 .husky/                        # Git hooks configuration
└── 📁 docs/                          # Documentation (NEW)
```

---

## Backend Structure

```
backend/
├── 📄 package.json                   # Backend dependencies
├── 📄 .env                           # Backend environment config
├── 📄 Dockerfile                     # Backend container image
├── 📄 jest.config.js                 # Testing configuration
├── 📄 jest-setup.js                  # Jest setup
├── 📄 babel.config.js                # Babel transpilation
├── 📄 nodemon.json                   # Auto-reload on file changes
├── 📄 seed.js                        # Database seeding script
│
├── 📁 src/
│   ├── 📄 server.js                  # Express app entry point
│   │
│   ├── 📁 controllers/               # HTTP Request Handlers (13 files)
│   │   ├── authController.js         # Authentication endpoints
│   │   ├── scenarioController.js     # Scenario CRUD
│   │   ├── testStepController.js     # Test step management
│   │   ├── executionController.js    # Execution logic
│   │   ├── recorderController.js     # Recording sessions
│   │   ├── chainController.js        # Test chains
│   │   ├── analyticsController.js    # Analytics & reports
│   │   ├── searchController.js       # Search functionality
│   │   ├── fileController.js         # File operations
│   │   ├── importController.js       # Import scenarios
│   │   ├── smokeTestController.js    # Smoke testing
│   │   ├── stressTestController.js   # Stress testing
│   │   ├── securityTestController.js # Security testing
│   │   └── __tests__/                # Controller tests
│   │
│   ├── 📁 services/                  # Business Logic Layer (15+ files)
│   │   ├── authService.js            # Auth & user management
│   │   ├── scenarioService.js        # Scenario operations
│   │   ├── testStepService.js        # Step transactions
│   │   ├── executionService.js       # Playwright executor
│   │   ├── recordingService.js       # Recording engine
│   │   ├── chainService.js           # Chain execution
│   │   ├── analyticsService.js       # Metrics & analytics
│   │   ├── schedulerService.js       # Cron scheduling
│   │   ├── parallelExecutionService  # Parallel runs
│   │   ├── browserMatrixService      # Cross-browser testing
│   │   ├── emailService.js           # Email sending
│   │   ├── reportService.js          # Report generation
│   │   ├── browserService.js         # Browser detection
│   │   ├── fileService.js            # File operations
│   │   └── __tests__/                # Service tests
│   │
│   ├── 📁 routes/                    # Express Routes (17 files)
│   │   ├── authRoutes.js             # /api/auth/*
│   │   ├── scenarioRoutes.js         # /api/scenarios/*
│   │   ├── testStepRoutes.js         # /api/steps/*
│   │   ├── executionRoutes.js        # /api/executions/*
│   │   ├── recorderRoutes.js         # /api/recorder/*
│   │   ├── chainRoutes.js            # /api/chains/*
│   │   ├── analyticsRoutes.js        # /api/analytics/*
│   │   ├── searchRoutes.js           # /api/search/*
│   │   ├── schedulerRoutes.js        # /api/scheduler/*
│   │   ├── fileRoutes.js             # /api/files/*
│   │   ├── importRoutes.js           # /api/import/*
│   │   ├── parallelExecutionRoutes   # /api/parallel/*
│   │   ├── browserMatrixRoutes       # /api/browser-matrix/*
│   │   ├── smokeTestRoutes.js        # /api/smoke/*
│   │   ├── stressTestRoutes.js       # /api/stress/*
│   │   ├── securityTestRoutes.js     # /api/security/*
│   │   └── stepTypeRoutes.js         # /api/step-types/*
│   │
│   ├── 📁 middleware/                # Express Middleware (2+ files)
│   │   ├── auth.js                   # JWT verification
│   │   ├── errorHandler.js           # Error handling
│   │   ├── logger.js                 # Request logging
│   │   └── __tests__/                # Middleware tests
│   │
│   ├── 📁 lib/                       # Shared Libraries
│   │   ├── prisma.js                 # Prisma client singleton
│   │   └── swagger.js                # Swagger/OpenAPI config
│   │
│   └── 📁 utils/                     # Utility Functions
│       ├── validators.js             # Input validation
│       ├── formatters.js             # Data formatting
│       └── helpers.js                # Helper utilities
│
├── 📁 prisma/                        # Database Configuration
│   ├── schema.prisma                 # Database schema
│   └── migrations/                   # Database migration files
│       ├── 20260309090326_init/
│       ├── 20260309101939_add_qase_integration_models/
│       ├── 20260414094618_add_hover_scroll_fileupload_video/
│       ├── 20260414105432_add_drag_mock_route_step_types/
│       ├── 20260420082956_remove_qase/
│       ├── 20260421110533_add_test_chains/
│       ├── 20260422040830_add_reset_token_fields/
│       ├── 20260422073917_add_test_schedule/
│       ├── 20260422080250_add_priority3_features/
│       ├── 20260512000000_add_smoke_test_support/
│       ├── 20260512110000_add_stress_test_support/
│       └── 20260512120000_add_security_testing_support/
│
├── 📁 public/                        # Static assets
│   └── logo-icon.png                 # App logo
│
├── 📁 templates/                     # CSV templates
│   ├── basic-navigation.csv
│   ├── ecommerce-flow.csv
│   ├── form-test.csv
│   └── login-test.csv
│
└── 📁 uploads/                       # User uploads
    └── videos/                       # Recorded videos
```

---

## Frontend Structure

```
frontend/
├── 📄 package.json                   # Dependencies & scripts
├── 📄 vite.config.js                 # Vite configuration
├── 📄 tailwind.config.js             # TailwindCSS config
├── 📄 postcss.config.js              # PostCSS configuration
├── 📄 playwright.config.js           # Playwright E2E config
├── 📄 .eslintrc.cjs                  # ESLint rules
├── 📄 index.html                     # HTML entry point
├── 📄 .gitignore                     # Git ignore rules
│
├── 📁 src/
│   ├── 📄 main.jsx                   # React app entry
│   ├── 📄 App.jsx                    # Main app component
│   ├── 📄 index.css                  # Global styles
│   │
│   ├── 📁 pages/                     # Page Components (28 files)
│   │   ├── DashboardPage.jsx         # Dashboard overview
│   │   ├── ScenariosPage.jsx         # Scenario management
│   │   ├── ScenarioDetailPage.jsx    # Scenario editor
│   │   ├── ChainsPage.jsx            # Chain management
│   │   ├── ChainBuilderPage.jsx      # Chain builder interface
│   │   ├── ChainExecutorPage.jsx     # Execute chains
│   │   ├── ExecutionPage.jsx         # Manual execution
│   │   ├── ParallelExecutionPage.jsx # Parallel batch runs
│   │   ├── BrowserMatrixPage.jsx     # Cross-browser testing
│   │   ├── SmokeTest.jsx             # Smoke test runner
│   │   ├── StressTestPage.jsx        # Stress test runner
│   │   ├── SecurityTestPage.jsx      # Security test runner
│   │   ├── SchedulerPage.jsx         # Schedule configuration
│   │   ├── ReportsPage.jsx           # Test reports
│   │   ├── AnalyticsPage.jsx         # Analytics & metrics
│   │   ├── SettingsPage.jsx          # User settings
│   │   ├── LoginPage.jsx             # Login form
│   │   ├── RegisterPage.jsx          # Registration form
│   │   ├── ForgotPasswordPage.jsx    # Password recovery
│   │   ├── ResetPasswordPage.jsx     # Password reset form
│   │   ├── SmokeTestHelpPage.jsx     # Help content
│   │   ├── StressTestHelpPage.jsx    # Help content
│   │   ├── SecurityTestHelpPage.jsx  # Help content
│   │   ├── NotFoundPage.jsx          # 404 page
│   │   ├── ForbiddenPage.jsx         # 403 page
│   │   ├── ServerErrorPage.jsx       # 500 page
│   │   ├── MaintenancePage.jsx       # Maintenance page
│   │   └── SessionExpiredPage.jsx    # Session timeout page
│   │
│   ├── 📁 components/                # Reusable Components (29 files)
│   │   ├── Layout.jsx                # Main layout wrapper
│   │   ├── ProtectedRoute.jsx        # Route protection
│   │   ├── ErrorBoundary.jsx         # Error handling
│   │   ├── OfflineBanner.jsx         # Connection status
│   │   ├── Loading.jsx               # Loading state UI
│   │   ├── HelpModal.jsx             # Help content modal
│   │   │
│   │   ├── Form Components
│   │   │   ├── ScenarioForm.jsx      # Scenario input
│   │   │   ├── ScenarioSearch.jsx    # Scenario search
│   │   │   └── ImportPreviewModal.jsx # Import preview
│   │   │
│   │   ├── Test Runners
│   │   │   ├── SmokeTestRunner.jsx   # Smoke test UI
│   │   │   ├── SmokeTestHistory.jsx  # Smoke history
│   │   │   ├── SmokeTestSummary.jsx  # Smoke summary
│   │   │   ├── StressTestRunner.jsx  # Stress test UI
│   │   │   ├── StressTestHistory.jsx # Stress history
│   │   │   ├── StressTestSummary.jsx # Stress summary
│   │   │   ├── StressTestMetrics.jsx # Metrics display
│   │   │   ├── SecurityScanRunner.jsx # Security test UI
│   │   │   ├── SecurityHistory.jsx   # Security history
│   │   │   ├── SecuritySummary.jsx   # Security summary
│   │   │   └── SecurityFindings.jsx  # Findings display
│   │   │
│   │   ├── Utilities & Helpers
│   │   │   ├── BrowserSelector.jsx   # Browser selection
│   │   │   ├── ExecuteScenarioButton.jsx
│   │   │   ├── QuickRecordModal.jsx  # Quick recording
│   │   │   ├── SmartSuggestionPanel.jsx
│   │   │   ├── ScenariosList.jsx     # Scenario list view
│   │   │   ├── TestStepList.jsx      # Step list display
│   │   │   ├── StepErrorDetail.jsx   # Error details
│   │   │   ├── ExportButtons.jsx     # PDF/CSV export
│   │   │   ├── TemplatePickerModal.jsx
│   │   │   └── ui/index.jsx          # UI utilities
│   │
│   ├── 📁 services/                  # API Clients (5+ files)
│   │   ├── api.js                    # Axios client
│   │   ├── authService.js            # Auth API calls
│   │   ├── scenarioService.js        # Scenario API calls
│   │   ├── executionService.js       # Execution API calls
│   │   └── analyticsService.js       # Analytics API calls
│   │
│   ├── 📁 store/                     # Zustand State Management (3 files)
│   │   ├── authStore.js              # Auth state (user, token)
│   │   ├── settingsStore.js          # Theme, language
│   │   └── uiStore.js                # UI state (modals, etc)
│   │
│   ├── 📁 hooks/                     # Custom React Hooks
│   │   └── useLoading.js             # Loading state hook
│   │
│   ├── 📁 utils/                     # Utility Functions (3 files)
│   │   ├── exportUtils.js            # Export to CSV/PDF/JSON
│   │   └── testAnalysis.js           # Test result analysis
│   │
│   ├── 📁 data/                      # Static Content
│   │   └── helpContent.js            # Help text & tooltips
│   │
│   └── 📁 __tests__/                 # Unit Tests
│       └── (test files)
│
├── 📁 e2e/                           # End-to-End Tests (Playwright)
│   ├── auth.spec.js
│   ├── comprehensive.spec.js
│   ├── execution-api.spec.js
│   ├── features-e2e.spec.js
│   ├── forgot-password.spec.js
│   ├── mocked-auth.spec.js
│   ├── scenarios.spec.js
│   └── search.spec.js
│
├── 📁 public/                        # Static Assets
│   └── logo-icon.png                 # App icon
│
└── 📁 node_modules/                  # Dependencies (gitignored)
```

---

## Documentation Structure

```
docs/
├── 📄 ARCHITECTURE.md                # Project overview & tech stack
├── 📄 DIRECTORY_STRUCTURE.md         # This file
├── 📄 SETUP.md                       # Installation & setup guide
└── 📄 API_ENDPOINTS.md               # API documentation (optional)
```

---

## File Organization Best Practices

### Code Organization
- ✅ **Controllers** group HTTP handlers by domain
- ✅ **Services** contain reusable business logic
- ✅ **Routes** define Express endpoints
- ✅ **Pages** are top-level components (one per route)
- ✅ **Components** are reusable, focused UI elements
- ✅ **Utils** contain pure utility functions
- ✅ **Tests** colocate with source code where possible

### Naming Conventions
- Controllers: `*Controller.js`
- Services: `*Service.js`
- Routes: `*Routes.js`
- Pages: `*Page.jsx` or `*.jsx`
- Components: PascalCase for React components
- Utilities: camelCase functions

### Documentation
- README.md files in each major folder
- JSDoc comments for complex functions
- Component prop documentation
- API endpoint documentation

---

## File Counts Summary

| Directory | Count | Notes |
|-----------|-------|-------|
| Backend Controllers | 13 | One per major feature |
| Backend Services | 15+ | Reusable business logic |
| Backend Routes | 17 | REST endpoints |
| Frontend Pages | 28 | Feature + auth pages |
| Frontend Components | 29 | Reusable & domain-specific |
| Database Migrations | 12 | Version history |

**Total Production Files**: ~150+  
**Total Lines of Code**: ~15,000+

