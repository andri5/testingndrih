# 🏗️ Architecture Overview

## Project Structure

**Test Sambil Ngopi** adalah platform automated testing yang memungkinkan pengguna merekam interaksi browser dan memutar ulang sebagai test cases.

- **Tech Stack**: React 18 + Vite + TailwindCSS | Node.js + Express | PostgreSQL + Prisma | Playwright
- **Architecture**: Monorepo (backend + frontend) dengan Docker orchestration
- **Status**: Production Ready ✅

---

## 📂 Directory Layout

```
testingndrih/
├── backend/              # Node.js Express API Server
│   └── src/
│       ├── controllers/  # HTTP request handlers
│       ├── services/     # Business logic layer
│       ├── routes/       # Express route definitions
│       ├── middleware/   # Express middleware
│       ├── lib/          # Shared utilities & Prisma
│       └── utils/        # Helper functions
│
├── frontend/             # React 18 + Vite Application
│   └── src/
│       ├── pages/        # Page components (28 pages)
│       ├── components/   # Reusable UI components
│       ├── services/     # API clients & helpers
│       ├── store/        # Zustand state management
│       ├── hooks/        # Custom React hooks
│       ├── utils/        # Utility functions
│       ├── data/         # Static content (help, etc)
│       └── __tests__/    # Unit tests
│
└── docs/                 # Documentation
```

---

## 🔑 Key Technologies

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend UI** | React 18 + Vite | Component-based UI with HMR |
| **Styling** | TailwindCSS | Utility-first CSS framework |
| **State Management** | Zustand | Lightweight state management |
| **API Client** | Axios | HTTP requests to backend |
| **Testing** | Playwright | Browser automation & E2E tests |
| **Backend API** | Express.js | RESTful API server |
| **Database** | PostgreSQL | Relational database |
| **ORM** | Prisma | Database client & migrations |
| **Automation** | Playwright | Headless browser automation |
| **Deployment** | Docker | Containerization |

---

## 📊 Data Flow

1. **User Records** → Browser Recording (Playwright Headless)
2. **Steps Stored** → PostgreSQL (via Prisma ORM)
3. **Playback Execution** → Step-by-step Playwright automation
4. **Analytics Collected** → Performance metrics & reporting
5. **PDF Export** → Generated with SVG charts & analysis

---

## 🔄 Feature Modules

- **Core Testing**: Scenarios, Test Steps, Execution, Reports
- **Advanced Testing**: Smoke Test, Stress Test, Security Test
- **Test Chains**: Chain builder for multi-scenario workflows
- **Scheduling**: Cron-based test automation
- **Parallel Execution**: Run multiple tests concurrently
- **Browser Matrix**: Cross-browser compatibility testing
- **Analytics**: Execution history, performance metrics
- **User Management**: Authentication, password reset
- **Import/Export**: CSV/JSON/PDF data export

---

## 🗂️ File Organization

### Backend Controllers
```
authController.js          # Login, register, password reset
scenarioController.js      # CRUD operations for scenarios
testStepController.js      # Test step management
executionController.js     # Execute scenarios & chains
recorderController.js      # Start/stop recording sessions
chainController.js         # Test chain management
analyticsController.js     # Analytics & reporting
smokeTestController.js     # Smoke test execution
stressTestController.js    # Stress test execution
securityTestController.js  # Security testing
```

### Backend Services
```
authService.js            # JWT, user auth
scenarioService.js        # Scenario business logic
executionService.js       # Playwright execution engine
recordingService.js       # Headless browser recording
schedulerService.js       # Cron job scheduling
parallelExecutionService  # Multi-scenario runs
browserMatrixService.js   # Cross-browser testing
reportService.js          # Report generation
```

### Frontend Pages (28 total)
```
Dashboard        → Overview & quick stats
Scenarios        → Scenario management
Chains          → Test chain builder
Execution       → Manual scenario execution
Parallel        → Parallel batch execution
Smoke Test      → Smoke test runner
Stress Test     → Performance testing
Security Test   → Vulnerability scanning
Browser Matrix  → Cross-browser testing
Scheduler       → Cron job configuration
Reports         → Historical analytics
Analytics       → Metrics & insights
Settings        → User preferences
```

---

## 🔐 Security Features

- JWT authentication for API endpoints
- Password hashing (bcrypt)
- CORS enabled with proper headers
- Input validation & sanitization
- Protected routes with auth middleware
- Secure password reset via email tokens

---

## 📈 Performance Optimizations

- Frontend HMR (Hot Module Reload) with Vite
- Lazy loading for route components
- SVG-based charts (no heavy chart library)
- Database query optimization via Prisma
- Parallel test execution support
- Caching & memoization in React components
- Responsive design (mobile-first)

---

## 🚀 Deployment

### Docker Compose
- PostgreSQL database
- Backend API server
- Frontend React app (Nginx reverse proxy)
- Volume management for data persistence

### Environment Variables
See `.env.example` for required variables:
- Database credentials
- JWT secret
- Mail server config
- API URLs

