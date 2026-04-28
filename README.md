# 🧪 Test Sambil Ngopi Coy - Record & Playback Testing Platform

**Intelligent Test Recording & Playback Engine** — Record user interactions using Playwright headless browser, convert to test steps, and execute with smart error handling and cross-browser testing support.

> **🎯 Getting Started**: Read [`docs/guides/00_INDEX.md`](docs/guides/00_INDEX.md) for complete documentation  
> **⚡ Quick Reference**: [`docs/guides/QUICK_REFERENCE.md`](docs/guides/QUICK_REFERENCE.md) for commands and APIs  
> **📖 Architecture**: [`docs/guides/RECORDER_2.0_GUIDE.md`](docs/guides/RECORDER_2.0_GUIDE.md) for implementation details

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![Status](https://img.shields.io/badge/status-production--ready-brightgreen.svg)
![Node](https://img.shields.io/badge/node-20.x-brightgreen.svg)
![React](https://img.shields.io/badge/React-18.2-blue.svg)
![Playwright](https://img.shields.io/badge/Playwright-1.40%2B-blue.svg)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791.svg)

---

## ✨ Key Features (v2.0 - April 2026)

### 🎥 Playwright v2.0 Recording Engine (NEW)
- ✅ **Headless Browser Recording** — Backend-controlled Playwright chromium for reliable recording
- ✅ **No Proxy Window** — Server-side recording (no window pop-ups or CSP issues)
- ✅ **Real-time Step Polling** — Frontend polls status every 1.5 seconds
- ✅ **Step Extraction** — Direct browser context evaluation via `page.evaluate()`
- ✅ **Reliable Capture** — 95%+ accuracy with step verification
- ✅ **Resource Cleanup** — Automatic browser/context cleanup after recording
- ✅ **Session Management** — Multiple concurrent recording sessions supported

### 🔄 Recording Engine Features
- ✅ **Interactive Recording** — Record clicks, fills, selections, navigation in real-time
- ✅ **Intelligent Selector Building** — Auto-generate selectors: data-testid → id → CSS Path → XPath
- ✅ **Shadow DOM Support** — Full support via DOM traversal
- ✅ **Form Field Auto-Detection** — Checkbox, Radio, Select dropdown, Contenteditable handling
- ✅ **SPA Route Detection** — Detect route changes automatically
- ✅ **Step Types** — NAVIGATE, CLICK, FILL, HOVER, SCROLL, FILE_UPLOAD, DRAG, MOCK_ROUTE, SCREENSHOT, WAIT, ASSERTION, API_CALL

### ⚡ Execution Engine with Error Recovery
- ✅ **Smart Wait Strategy** — Intelligent polling with fallback chains
- ✅ **Rich Error Capture** — Step details, page URL, console errors, screenshots
- ✅ **Contextual Error Suggestions** — 20+ patterns for common issues
- ✅ **Dialog Auto-Handling** — Auto-accept alert/confirm/prompt dialogs
- ✅ **Step-by-Step Execution** — Full execution lifecycle with real-time status

### 🌐 Advanced Testing Features (New in v2.0)
- ✅ **Cross-Browser Testing** — Run same scenario on Chromium, Firefox, WebKit, Edge
- ✅ **Parallel Execution** — Execute multiple scenarios simultaneously with concurrency control
- ✅ **Test Scheduling** — Schedule test runs (Once, Hourly, Daily, Weekly)
- ✅ **Retry Engine** — Smart retry mechanism for flaky tests
- ✅ **Screenshot Comparison** — Visual regression testing support
- ✅ **Browser Matrix** — Execute tests across browser/OS combinations

### 🔐 Authentication & Security
- ✅ **Forgot Password Flow** — Email-based password reset with 15-minute token expiry
- ✅ **Password Reset Email** — Nodemailer SMTP integration (Gmail support)
- ✅ **Token Security** — Cryptographic tokens with SHA256 hashing
- ✅ **Password Requirements** — 8+ chars, uppercase, lowercase, digit, special character
- ✅ **JWT Authentication** — Secure session management with configurable expiry
- ✅ **OWASP Compliance** — Industry-standard security practices

### 🎨 User Interface
- ✅ **Scenario Management** — Create, edit, delete test scenarios
- ✅ **Step Editor** — Form-based step creation and editing
- ✅ **Execution Viewer** — Real-time execution with screenshot streaming
- ✅ **Execution History** — View past results with full details
- ✅ **Dark/Light Theme** — Full theme support with persistent preference
- ✅ **Responsive Design** — Mobile-first layout with collapsible navigation
- ✅ **Report Export** — Download execution reports (PDF/HTML)

### 🛡️ Error Handling & Resilience
- ✅ **Custom Error Pages** — 404, 403, 500, Session Expired, Maintenance pages
- ✅ **React ErrorBoundary** — Prevents blank white screen on render crashes
- ✅ **Offline Detection** — Auto-banner on internet disconnection
- ✅ **Auto Logout** — Session expiry handling with redirect to login
- ✅ **API Error Handling** — Comprehensive error messages and suggestions

---

## 🏗️ Tech Stack (v2.0)

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Frontend** | React + Vite | 18.2 + 5.4 | Modern SPA with fast HMR |
| **Backend** | Node.js + Express | 20.x + 4.x | RESTful API (ESM modules) |
| **Database** | PostgreSQL + Prisma | 16 + 5.x | Relational DB with ORM |
| **Recording** | Playwright | 1.40+ | **Headless browser recording engine** |
| **State Management** | Zustand | 4.4 | Frontend state |
| **Styling** | TailwindCSS | 3.4 | Utility-first CSS |
| **Authentication** | JWT + bcryptjs | Latest | Secure auth & hashing |
| **Email** | Nodemailer | 6.x | SMTP email service |
| **API Client** | Axios | Latest | HTTP with timeout/retry |
| **Container** | Docker + Compose | Latest | App + PostgreSQL orchestration |

---

## 📊 Current Status (April 2026)

### Project Completion
```
✅ Playwright v2.0 Recording Engine  100% Complete
   └─ Headless browser implementation
   └─ Real-time polling mechanism
   └─ Server-side recording
   └─ No proxy window needed

✅ Core Recording Features          100% Complete
   └─ Interactive recording
   └─ Selector building
   └─ Shadow DOM support
   └─ Form detection

✅ Execution Engine                 100% Complete
   └─ Multi-step execution
   └─ Smart wait strategies
   └─ Error capture & suggestions
   └─ Screenshot capture

✅ Advanced Features                100% Complete
   └─ Cross-browser testing
   └─ Parallel execution
   └─ Test scheduling
   └─ Retry mechanism
   └─ Screenshot comparison

✅ UI/UX & Themes                   100% Complete
   └─ Dark/Light themes
   └─ Responsive design
   └─ Error pages
   └─ Report generation

✅ Authentication & Security        100% Complete
   └─ Forgot password flow
   └─ Email-based reset
   └─ Password requirements
   └─ JWT authentication

✅ Project Organization             100% Complete
   └─ Clean folder structure
   └─ Centralized documentation
   └─ Organized test files
   └─ Production-ready layout

Overall Status: **100% Production Ready** ✅
```

### Tested Features
| Feature | Status | Notes |
|---------|--------|-------|
| Record with Playwright | ✅ | Headless browser working |
| Real-time step polling | ✅ | 1.5s interval updates |
| Step extraction | ✅ | Via page.evaluate() |
| Execute steps | ✅ | All types supported |
| Cross-browser | ✅ | Chrome, Firefox, WebKit, Edge |
| Parallel execution | ✅ | Concurrent test runs |
| Test scheduling | ✅ | Once, Hourly, Daily, Weekly |
| Password reset | ✅ | Email-based with token |
| Error handling | ✅ | 20+ suggestion patterns |
| Database | ✅ | PostgreSQL with Prisma |

---

## 🚀 Quick Start (5 minutes)

### Prerequisites
- Node.js 20.x+
- PostgreSQL 16 (or Docker)
- Git

### Installation & Setup

#### Step 1: Clone & Install
```bash
git clone https://github.com/andri5/testingndrih.git
cd testingndrih

# Backend
cd backend
npm install

# Frontend (new terminal)
cd frontend
npm install
```

#### Step 2: Setup Database
```bash
cd backend
npx prisma migrate dev  # Run all migrations
npm run seed           # Create test user
```

#### Step 3: Configure Environment
```bash
# In backend/.env
DATABASE_URL=postgresql://user:password@localhost:5432/testingndrih
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d
PORT=5001

# Optional: Email service for password reset
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password
SMTP_FROM="TestingNDRIH <noreply@testingndrih.local>"
```

#### Step 4: Start Servers
```bash
# Terminal 1: Backend
cd backend
npm run dev           # http://localhost:5001

# Terminal 2: Frontend
cd frontend
npm run dev           # http://localhost:3001
```

#### Step 5: Login
- **URL**: http://localhost:3001
- **Email**: `admin@testingndrih.local` (from seed)
- **Password**: `changeme123`

### Available Features ✅
- Record scenarios with Playwright headless browser
- Execute tests with real-time execution viewer
- Test scheduling (Once, Hourly, Daily, Weekly)
- Cross-browser testing (Chrome, Firefox, WebKit, Edge)
- Parallel execution
- Password reset via email
- Dark/Light theme

---

## 🐳 Quick Start (Docker - Recommended)

### Prerequisites
- Docker Desktop
- Git

### Setup (One Command)
```bash
# Clone repository
git clone https://github.com/andri5/testingndrih.git
cd testingndrih

# Copy environment template
cp .env.example .env
# Edit .env with your database credentials if needed

# Start services
docker-compose up -d

# Wait 10 seconds for initialization, then access:
# Frontend: http://localhost:3001
# API: http://localhost:5001/api/docs

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

**Default Login** *(from seed)*:
- Email: `admin@testingndrih.local`
- Password: `changeme123`

---

## 📖 Documentation

Start here based on your needs:

| Need | Document |
|------|----------|
| **Getting started** | [`docs/guides/00_INDEX.md`](docs/guides/00_INDEX.md) |
| **Quick commands** | [`docs/guides/QUICK_REFERENCE.md`](docs/guides/QUICK_REFERENCE.md) |
| **Manual testing** | [`docs/guides/MANUAL_TESTING_GUIDE.md`](docs/guides/MANUAL_TESTING_GUIDE.md) |
| **Architecture** | [`docs/guides/RECORDER_2.0_GUIDE.md`](docs/guides/RECORDER_2.0_GUIDE.md) |
| **Upgrading from v1.1** | [`docs/guides/MIGRATION_GUIDE.md`](docs/guides/MIGRATION_GUIDE.md) |
| **Test results** | [`docs/guides/FINAL_TEST_REPORT.md`](docs/guides/FINAL_TEST_REPORT.md) |
| **Implementation status** | [`docs/guides/IMPLEMENTATION_STATUS.md`](docs/guides/IMPLEMENTATION_STATUS.md) |
| **Project structure** | [`PROJECT_STRUCTURE.md`](PROJECT_STRUCTURE.md) |

---

## 🧪 Testing

### Run Tests
```bash
cd backend

# Unit tests
node ../tests/backend/test-playwright-recorder.js

# API tests
node ../tests/backend/debug-test-recorder.js

# E2E simulation
npm run dev &  # start backend first
node ../tests/backend/simulation-test-recorder.js

# All tests
powershell -ExecutionPolicy Bypass -File ../tests/test-comprehensive.ps1
```

### Test Results
- ✅ **Unit Tests**: 6/6 Passing
- ✅ **API Tests**: 5/5 Passing
- ✅ **E2E Flow**: Full workflow verified
- ✅ **Integration**: Database persistence confirmed
- ✅ **Overall**: 17+ test cases passing

See [`docs/guides/FINAL_TEST_REPORT.md`](docs/guides/FINAL_TEST_REPORT.md) for complete test report.

---

## 🔑 API Quick Reference

### Authentication
```bash
# Forgot Password
curl -X POST http://localhost:5001/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'

# Reset Password
curl -X POST http://localhost:5001/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token":"reset-token",
    "password":"NewPassword123!"
  }'
```

### Recording
```bash
# Start Recording
curl -X POST http://localhost:5001/api/recorder/start \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"scenarioId":"123","url":"https://example.com"}'

# Get Status
curl http://localhost:5001/api/recorder/status/123 \
  -H "Authorization: Bearer YOUR_TOKEN"

# Stop Recording
curl -X POST http://localhost:5001/api/recorder/stop \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"scenarioId":"123"}'
```

See [`docs/guides/QUICK_REFERENCE.md`](docs/guides/QUICK_REFERENCE.md) for full API reference.

---

## 🌐 Live Demo Features

### Recording
1. Click "Start Recording" → Playwright headless browser launches
2. Perform interactions on target website
3. See steps captured in real-time (1.5s polling)
4. Click "Stop Recording" → Auto-save to database

### Execution
1. Click "Execute" → Browser runs all steps sequentially
2. Watch real-time execution with screenshot streaming
3. See results with pass/fail status per step
4. View error suggestions if steps fail

### Advanced Testing
1. **Cross-Browser**: Run same scenario on multiple browsers
2. **Parallel**: Execute multiple scenarios concurrently
3. **Scheduled**: Schedule recurring test runs
4. **Visual**: Compare screenshots for regression testing

---

## 🛠️ Development

### Project Structure
See [`PROJECT_STRUCTURE.md`](PROJECT_STRUCTURE.md) for detailed folder organization.

```bash
# Key directories
backend/src/           # Backend source code
frontend/src/          # Frontend React code
docs/guides/           # All documentation
tests/backend/         # Test files
```

### Making Changes

**Backend**:
```bash
cd backend
npm run dev            # Nodemon auto-reload
# Edit files in src/
# Changes auto-reload
```

**Frontend**:
```bash
cd frontend
npm run dev            # Vite HMR
# Edit files in src/
# Changes hot-reload
```

### Building for Production
```bash
# Backend
cd backend
npm run build

# Frontend
cd frontend
npm run build          # Creates dist/
npm run preview        # Test production build
```

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Find process on port 5001
lsof -i :5001

# Kill process
kill -9 <PID>

# Or use different port
PORT=5002 npm run dev
```

### Database Connection Failed
```bash
# Check PostgreSQL is running
psql -U postgres

# Reset database
cd backend
npx prisma db push --force-reset
npm run seed
```

### Tests Failing
```bash
# Check backend is running
curl http://localhost:5001/health

# Run tests with verbose output
cd backend
npm test -- --verbose

# See full test report
cat ../docs/guides/FINAL_TEST_REPORT.md
```

For more help, see:
- [`docs/guides/MANUAL_TESTING_GUIDE.md`](docs/guides/MANUAL_TESTING_GUIDE.md) — Manual testing guide
- [`docs/guides/RECORDER_2.0_GUIDE.md`](docs/guides/RECORDER_2.0_GUIDE.md) — Architecture & troubleshooting
- [`docs/guides/QUICK_REFERENCE.md`](docs/guides/QUICK_REFERENCE.md) — Quick commands

---

## � Commit Guidelines

This project uses **Semantic Versioning** and **Conventional Commits** for automated versioning and release management.

### Commit Format
All commits follow this format:
```
<type>(<scope>): <description>

<optional body>
<optional footer>
```

### Commit Types
- **feat**: New feature (bumps MINOR version)
- **fix**: Bug fix (bumps PATCH version)
- **docs**: Documentation changes
- **test**: Test additions or updates
- **refactor**: Code refactoring
- **perf**: Performance improvements
- **ci**: CI/CD configuration
- **chore**: Dependencies, build config

### Examples
```bash
# Feature
git commit -m "feat(recorder): add shadow DOM support for complex selectors"

# Bug fix
git commit -m "fix(executor): resolve timeout issue in wait strategy"

# Multiple lines
git commit -m "feat(scheduler): implement daily test scheduling

- Add cron job support
- Create database schema
- Implement retry logic"

# Breaking change (bumps MAJOR)
git commit -m "feat(api)!: restructure scenario response format

BREAKING CHANGE: scenario.steps now returns objects instead of IDs"
```

📖 **Full guidelines**: See [COMMIT_CONVENTIONS.md](COMMIT_CONVENTIONS.md)

---

## �📞 Support

### Documentation
- **Full Guides**: [`docs/guides/`](docs/guides/)
- **Architecture**: [`RECORDER_2.0_GUIDE.md`](docs/guides/RECORDER_2.0_GUIDE.md)
- **Testing**: [`MANUAL_TESTING_GUIDE.md`](docs/guides/MANUAL_TESTING_GUIDE.md)
- **Quick Reference**: [`QUICK_REFERENCE.md`](docs/guides/QUICK_REFERENCE.md)

### Issues & Contributions
- GitHub Issues: [Report bugs or request features](https://github.com/andri5/testingndrih/issues)
- Pull Requests: [Contribute improvements](https://github.com/andri5/testingndrih/pulls)

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🙏 Acknowledgments

Built with:
- ⭐ **Playwright** for reliable browser automation
- ⚛️ **React** for modern UI
- 🚀 **Vite** for fast bundling
- 🗄️ **PostgreSQL & Prisma** for robust data management
- 🎨 **TailwindCSS** for beautiful styling
- 🐳 **Docker** for containerization

---

**Ready to test? Start with [`docs/guides/00_INDEX.md`](docs/guides/00_INDEX.md)** 🚀
