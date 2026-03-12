# 📁 Project Structure Guide

## Directory Organization

```
testingndri/
├── .github/
│   └── workflows/              # GitHub Actions CI/CD pipelines
│       ├── test.yml           # Main testing pipeline (unit + E2E)
│       ├── quality.yml        # Code quality & security checks
│       ├── build.yml          # Build & deployment pipeline
│       └── performance.yml    # Weekly performance testing
│
├── backend/                    # Backend Node.js / Express API
│   ├── src/
│   │   ├── controllers/       # API endpoint handlers
│   │   ├── routes/            # Route definitions
│   │   ├── services/          # Business logic layer
│   │   ├── middleware/        # Express middleware
│   │   ├── utils/             # Utility functions
│   │   ├── lib/               # Library code
│   │   └── server.js          # Main server entry point
│   │
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema definition
│   │   └── migrations/        # Database migration files
│   │
│   ├── coverage/              # Jest code coverage reports
│   ├── templates/             # Data templates for testing
│   ├── uploads/               # File upload storage
│   ├── package.json           # Backend dependencies
│   ├── jest.config.js         # Jest testing configuration
│   └── .env.example           # Backend environment template
│
├── frontend/                   # Frontend React + Vite SPA
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── pages/             # Page components
│   │   ├── services/          # API client services
│   │   ├── store/             # State management (Zustand/Redux)
│   │   ├── App.jsx            # Root component
│   │   ├── main.jsx           # Entry point
│   │   └── index.css          # Global styles
│   │
│   ├── e2e/                   # Playwright E2E tests
│   │   ├── auth.spec.js       # Authentication tests
│   │   ├── scenarios.spec.js  # Scenario management tests
│   │   ├── execution.spec.js  # Test execution tests
│   │   ├── search.spec.js     # Search & filter tests
│   │   ├── qase.spec.js       # Qase.io integration tests
│   │   └── debug.spec.js      # Debug & utility tests
│   │
│   ├── playwright-report/     # Generated E2E test reports
│   ├── test-results/          # JSON test results
│   ├── package.json           # Frontend dependencies
│   ├── vite.config.js         # Vite build configuration
│   ├── playwright.config.js   # Playwright test configuration
│   ├── tailwind.config.js     # Tailwind CSS configuration
│   ├── postcss.config.js      # PostCSS configuration
│   └── index.html             # HTML template
│
├── scripts/                    # Utility scripts
│   └── init-db.sql           # Database initialization script
│
├── DEVELOPMENT_EVALUATION_REPORT.md   # Priority 2 & 6 evaluation
├── PRIORITY_2_ANALYSIS.md              # E2E selector analysis & roadmap
├── PRIORITY_6_CICD_COMPLETE.md         # CI/CD implementation details
├── NEXT_STEPS_EXECUTION_COMPLETE.md   # Previous execution summary
├── IMPLEMENTATION_COMPLETE.md          # Feature completion status
├── plan.md                             # Project plan & priorities
├── README.md                           # Project overview & setup
├── PROJECT_STRUCTURE.md                # This file - structure guide
├── docker-compose.yml                  # Docker Compose configuration
├── .env.example                        # Environment variables template
├── .gitignore                          # Git ignore rules
├── package.json                        # Root package configuration
└── package-lock.json                   # Dependency lock file
```

---

## File Organization by Purpose

### 📋 Documentation Files
| File | Purpose |
|------|---------|
| README.md | Project overview, setup instructions, quick start |
| PROJECT_STRUCTURE.md | This file - structure and organization guide |
| plan.md | Development roadmap and priority list |
| DEVELOPMENT_EVALUATION_REPORT.md | Complete evaluation of Priority 2 & 6 |
| PRIORITY_2_ANALYSIS.md | E2E selector fixes analysis & implementation plan |
| PRIORITY_6_CICD_COMPLETE.md | CI/CD pipeline configuration & troubleshooting |
| NEXT_STEPS_EXECUTION_COMPLETE.md | Summary of previous execution phases |
| IMPLEMENTATION_COMPLETE.md | Feature completion checklist |

### 🔧 Configuration Files
| File | Purpose |
|------|---------|
| .env.example | Template for environment variables |
| docker-compose.yml | Docker Compose database setup |
| package.json | Root project dependencies |
| package-lock.json | Locked dependency versions |
| .gitignore | Git ignore patterns |

### 🚀 CI/CD Workflows (.github/workflows/)
| File | Trigger | Purpose | Runtime |
|------|---------|---------|---------|
| test.yml | Push/PR to main/develop | Run unit + E2E tests | 15-20 min |
| quality.yml | Push/PR to main/develop | Lint + security audit | 5-10 min |
| build.yml | Push to main | Build backend & frontend | 8-15 min |
| performance.yml | Weekly + manual | Load + performance tests | 10-15 min |

### 📦 Backend (`backend/`)
**Technology**: Node.js 18+ | Express.js | PostgreSQL | Jest | Prisma ORM

**Key Directories**:
- `src/controllers/` - Request handlers with validation
- `src/routes/` - API endpoint definitions
- `src/services/` - Business logic & database queries
- `src/middleware/` - Authentication, error handling, logging
- `src/utils/` - Helper functions
- `prisma/` - Database schema & migrations
- `coverage/` - Jest code coverage reports

**Running Tests**:
```bash
cd backend
npm test                  # Run all unit tests
npm test -- --coverage  # Run with coverage report
```

### 🎨 Frontend (`frontend/`)
**Technology**: React 18 | Vite 5 | TailwindCSS | Playwright | Zustand/Redux

**Key Directories**:
- `src/components/` - Reusable UI components
- `src/pages/` - Full page components
- `src/services/` - API client & utilities
- `src/store/` - State management
- `e2e/` - Playwright test suites (126 tests total)
- `test-results/` - Test output artifacts
- `playwright-report/` - HTML test reports

**Running Tests**:
```bash
cd frontend
npm run dev                              # Start dev server
npx playwright test                     # Run E2E tests
npx playwright test --ui                # Run with UI
npx playwright show-report              # View HTML report
```

### 🗄️ Database Setup (`scripts/`)
- `init-db.sql` - Initial database schema (optional, Prisma handles this)

---

## Workflow & Process

### 1️⃣ Development Workflow
```
Local Changes → Git Commit → Push to main/develop
                    ↓
            GitHub Actions Triggered
                    ↓
    test.yml (Unit + E2E) → quality.yml → build.yml
                    ↓
        All Pass? → Merge & Deploy
        Any Fail? → Fix & Push Again
```

### 2️⃣ PR Review Process
```
Create Branch → Make Changes → Push to GitHub
                    ↓
    Automated Tests Run (test.yml + quality.yml)
                    ↓
    Tests Pass?
    ├─ YES → Review by team → Merge
    └─ NO → Fix issues → Re-push
```

### 3️⃣ Test Execution Flow
```
Unit Tests (Backend)            E2E Tests (Frontend)
├─ 75+ tests                    ├─ 126 tests total
├─ 15-20 sec runtime            ├─ 54 sec runtime
├─ Jest framework               ├─ Playwright framework
└─ Coverage report              └─ HTML report + JSON

        ↓
    Quality Gate (Both Pass?)
        ├─ YES → Code Quality Checks
        │        (ESLint + Security Audit)
        └─ NO → Skip Quality Checks
```

---

## Key Features by Component

### Backend
✅ RESTful API with Express  
✅ PostgreSQL database with Prisma ORM  
✅ JWT authentication  
✅ Error handling & validation  
✅ Unit tests with Jest (75+ tests)  
✅ Code coverage reports  

### Frontend
✅ Modern React 18 SPA  
✅ Vite for fast development  
✅ TailwindCSS for styling  
✅ State management (Zustand/Redux)  
✅ 126 E2E tests with Playwright  
✅ HTML test reports  

### CI/CD Automation
✅ Automated testing on push/PR  
✅ Code quality scanning (ESLint)  
✅ Security audit (npm audit + Snyk)  
✅ Build pipeline (Docker ready)  
✅ Weekly performance monitoring  
✅ Artifact management (30 day retention)  

---

## Git Branching Strategy

```
main (Production)
├─ Release tags v1.0.0, v1.1.0, etc.
└─ All merged PRs from develop

develop (Staging)
├─ Latest development code
├─ Feature branches merge here
└─ Creates releases to main

feature/* (Feature branches)
├─ feature/auth-improvement
├─ feature/e2e-selectors
└─ feature/ci-cd-setup
```

---

## Environment Variables

Copy `.env.example` to `.env` in both directories:

**Backend (.env)**:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/testingdb"
JWT_SECRET="your-secret-key"
NODE_ENV="development"
API_PORT=5001
```

**Frontend (.env)**:
```env
VITE_API_URL="http://localhost:5001"
VITE_APP_NAME="Test Management"
```

---

## Performance Metrics

| Metric | Target | Current Status |
|--------|--------|-----------------|
| Unit Tests Runtime | <30s | ~15 sec ✅ |
| E2E Tests Runtime | <60s | ~54 sec ✅ |
| Total CI Pipeline | <30min | ~20 min ✅ |
| Unit Test Pass Rate | 80%+ | ~65% 🟡 |
| E2E Test Pass Rate | 80%+ | ~70% 🟡 |
| Code Coverage | 70%+ | ~20% 🔴 |

---

## Quick Reference Commands

```bash
# Installation
npm install              # Install all dependencies (root + backend + frontend)

# Development
npm run dev              # Start both servers (backend + frontend)
cd backend && npm run dev
cd frontend && npm run dev

# Testing
npm run test             # Run all tests
npm run test:unit        # Backend unit tests
npm run test:e2e         # Frontend E2E tests
npm run test:coverage    # Coverage report
npm run test:e2e:ui      # E2E with UI

# Build
npm run build            # Build both projects
npm run build:backend
npm run build:frontend

# Docker
docker-compose up -d     # Start PostgreSQL
docker-compose down      # Stop database

# Reports
npx playwright show-report  # View E2E report
npx jest --coverage         # View coverage report
```

---

## Support & Documentation

- **Local Setup**: See README.md
- **API Documentation**: Check backend/src/routes/
- **Test Results**: Check playwright-report/ & backend/coverage/
- **Troubleshooting**: See PRIORITY_6_CICD_COMPLETE.md
- **CI/CD Pipeline**: See .github/workflows/

---

**Last Updated**: March 12, 2026  
**Version**: 2.0 (Clean & Organized)
