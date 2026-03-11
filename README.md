# testingndrih 🧪

**Automated Web Testing Platform** — Create, execute, and manage test scenarios with AI-powered insights.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Node](https://img.shields.io/badge/node-20.x-brightgreen.svg)

---

## 🎯 Features

- ✅ **Manual Test Scenario Creation** — Intuitive UI for building test steps
- ✅ **Automated Test Execution** — Run tests with Playwright (UI) and Axios (API)
- ✅ **File Upload Support** — Import scenarios from CSV/XLSX templates
- ✅ **Qase.io Integration** — Import test cases from Qase CSV/PDF
- ✅ **Real-time Execution Logs** — Live status updates via WebSocket
- ✅ **Screenshot Capture** — Automatic screenshots per step and on failure
- ✅ **Comprehensive Reporting** — Graphs, charts, and detailed metrics
- ✅ **API Testing** — Full HTTP request testing with assertions
- ✅ **Bug/Issue Tracking** — Track and report issues from test failures
- ✅ **AI Assistant** — Generate scenarios, suggest fixes, summarize reports
- ✅ **Secure Authentication** — JWT-based login with role-based access
- ✅ **CI/CD Integration** — GitHub Actions with auto test reports on PRs

---

## 🏗️ Tech Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| **Frontend** | React + Vite | 18.2 + 5.0 |
| **Backend** | Node.js + Express | 20.x + 4.x |
| **Database** | PostgreSQL + Prisma | 15 + 5.x |
| **Testing** | Jest + Vitest + Playwright | Latest |
| **State** | Zustand | 4.4 |
| **Styling** | TailwindCSS | 3.4 |
| **Charts** | Recharts | 2.10 |
| **Auth** | JWT + bcryptjs | Standard |
| **AI** | OpenAI GPT-4 | Optional |

---

## 📋 Quick Start

### Prerequisites
- **Node.js 20.x** — [Download](https://nodejs.org/)
- **Docker & Docker Compose** — [Download](https://www.docker.com/)
- **Git** — [Download](https://git-scm.com/)

### Installation

```bash
# Clone repository
git clone <repository-url>
cd testingndrih

# Copy environment
cp .env.example .env

# Install dependencies (monorepo)
npm install

# Start PostgreSQL
docker-compose up -d

# Run migrations
cd backend && npx prisma migrate dev

# Start development
npm run dev

# Frontend: http://localhost:3000
# Backend API: http://localhost:5001
```

---

## 📂 Project Structure

```
testingndrih/
├── .github/workflows/          # GitHub Actions CI/CD
├── backend/                    # Node.js + Express API
│   ├── src/
│   │   ├── config/            # Database, auth config
│   │   ├── controllers/       # Request handlers
│   │   ├── services/          # Business logic
│   │   ├── routes/            # API endpoints
│   │   ├── middleware/        # Auth, error handlers
│   │   └── server.js          # Entry point
│   ├── prisma/                # Database schema
│   ├── __tests__/             # Unit tests
│   └── package.json
├── frontend/                   # React + Vite
│   ├── src/
│   │   ├── pages/             # Page components
│   │   ├── components/        # Reusable components
│   │   ├── services/          # API calls
│   │   ├── store/             # Zustand state
│   │   ├── hooks/             # Custom hooks
│   │   └── App.jsx            # Root component
│   ├── __tests__/             # Unit tests
│   └── package.json
├── tests/                      # E2E & integration tests
├── docs/                       # Documentation
├── docker-compose.yml          # Database setup
├── package.json               # Monorepo config
└── plan.md                    # Development plan
```

---

## 🚀 NPM Commands

### Development

```bash
# Start both backend & frontend
npm run dev

# Start backend only
npm run dev:backend

# Start frontend only
npm run dev:frontend
```

### Testing

```bash
# Run all tests
npm run test

# Run backend tests
npm run test:backend

# Run frontend tests
npm run test:frontend

# CI mode (coverage)
npm run test:ci
```

### Code Quality

```bash
# Lint all projects
npm run lint

# Fix linting issues
npm run lint:fix
```

### Build

```bash
# Build all
npm run build

# Build backend
npm run build:backend

# Build frontend
npm run build:frontend
```

---

## 📖 Documentation

- **[Setup Guide](./docs/SETUP.md)** — Detailed installation & configuration
- **[API Documentation](./docs/API.md)** — Complete API reference
- **[User Guide](./docs/USER_GUIDE.md)** — How to use the platform
- **[Development Plan](./plan.md)** — Project roadmap & architecture

---

## 🧪 Testing

### Local Testing

```bash
# Backend tests with coverage
npm run test:backend

# Frontend tests with coverage
npm run test:frontend

# Watch mode
npm run test -- --watch
```

### CI/CD Pipeline

Tests run automatically on every PR:
- ESLint code quality checks
- Jest unit tests (backend)
- Vitest unit tests (frontend)  
- Coverage reports uploaded as artifacts
- Results posted as PR comments

---

## 🔐 Environment Variables

Copy `.env.example` to `.env` and update values:

```env
# Database
DATABASE_URL=postgresql://testuser:testpass123@localhost:5432/testingndrih

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# OpenAI (optional)
OPENAI_API_KEY=sk-xxxxx

# Server
PORT=5001
NODE_ENV=development
```

---

## 🐳 Docker

```bash
# Start PostgreSQL
docker-compose up -d

# View logs
docker-compose logs -f postgres

# Stop all
docker-compose down

# Clean everything
docker-compose down -v
```

---

## 📊 Project Progress

**Phase 1: Foundation** — Setup, auth, layout  
**Phase 2: Core Features** — Scenario management, upload, import  
**Phase 3: Execution** — Test runner, screenshots, logging  
**Phase 4: Reporting** — Dashboard, charts, issue tracking  
**Phase 5: AI & Polish** — AI features, UX refinements  
**Phase 6: DevOps** — CI/CD, deployment, documentation

See [plan.md](./plan.md) for detailed progress tracking.

---

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/feature-name`
2. Commit changes: `git commit -m "feat: description"`
3. Push: `git push origin feature/feature-name`
4. Create Pull Request
5. Tests must pass before merge

---

## 📝 License

MIT © 2026

---

## 🆘 Support

For issues and feature requests, please [open an issue](https://github.com/yourrepo/issues).

---

**Made with ❤️ for QA Engineers**
