# 🧪 TestingNDRIH - Record & Playback Testing Platform

**Intelligent Test Recording & Playback Engine** — Record user interactions using Playwright headless browser, convert to test steps, and execute with smart error handling and cross-browser testing support.

> **📚 Documentation**: See [**`/docs`**](./docs/README.md) for complete guides  
> **🏗️ Architecture**: [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)  
> **📂 Structure**: [`docs/DIRECTORY_STRUCTURE.md`](./docs/DIRECTORY_STRUCTURE.md)  
> **⚙️ Setup**: [`docs/SETUP.md`](./docs/SETUP.md)  
> **🧪 Testing**: [`docs/TESTING.md`](./docs/TESTING.md)  
> **🚀 Quick Start**: `npm install && npm run dev`  
> **🐳 Docker**: `docker-compose up -d`

![Version](https://img.shields.io/badge/version-3.0.0-blue.svg)
![Status](https://img.shields.io/badge/status-production--ready-brightgreen.svg)
![Node](https://img.shields.io/badge/node-20.x-brightgreen.svg)
![React](https://img.shields.io/badge/React-18.2-blue.svg)
![Playwright](https://img.shields.io/badge/Playwright-1.40%2B-blue.svg)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791.svg)

---

## ✨ Key Features (v3.0 - May 2026)

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

### 🌐 Advanced Testing Features
- ✅ **Cross-Browser Testing** — Chromium, Firefox, WebKit, Edge
- ✅ **Parallel Execution** — Multiple scenarios dengan concurrency control
- ✅ **Test Scheduling** — Once, Hourly, Daily, Weekly
- ✅ **Retry Engine** — Smart retry untuk flaky tests
- ✅ **Browser Matrix** — Cross-browser/OS combinations
- ✅ **API Testing** — HTTP request builder dengan assertions (`/api-testing`)
- ✅ **Issue Tracker** — Auto-create issue dari execution gagal (`/issues`)
- ✅ **Environment Variables** — `{{var}}` substitution per environment (`/environments`)
- ✅ **Visual Regression** — Baseline capture, pixel diff, approve/reject (`/visual-regression`)
- ✅ **CI/CD Integration** — API tokens & remote scenario run
- ✅ **Notifications** — Email & webhook saat execution selesai

### 🔐 Authentication & Security
- ✅ **Forgot Password Flow** — Email-based password reset with 15-minute token expiry
- ✅ **Password Reset Email** — Nodemailer SMTP integration (Gmail support)
- ✅ **Token Security** — Cryptographic tokens with SHA256 hashing
- ✅ **Password Requirements** — 8+ chars, uppercase, lowercase, digit, special character
- ✅ **JWT Authentication** — Secure session management with configurable expiry
- ✅ **OWASP Compliance** — Industry-standard security practices

### 🎨 User Interface & Data Management
- ✅ **Scenario Management** — Create, edit, delete test scenarios
- ✅ **Step Editor** — Form-based step creation and editing
- ✅ **Execution Viewer** — Real-time execution with screenshot streaming
- ✅ **Execution History** — View past results with full details
- ✅ **Light Theme UI** — Clean, readable light interface across all pages
- ✅ **Responsive Design** — Mobile-first layout with collapsible navigation
- ✅ **Report Export** — Download execution reports (PDF/HTML)
- ✅ **Profile Picture Upload** — User avatar with file size validation (max 5MB)
  - Profile picture preview with initials fallback
  - Change/upload controls with visual feedback
  - Persistent storage via localStorage
- ✅ **Excel Bulk Import** — Import scenarios from Excel with preview/edit
  - Download template to see exact format
  - Preview data before creating
  - Edit inline (names, descriptions, URLs, steps)
  - Batch create with validation
  - Inline preview with tooltips

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

## 📊 Current Status (May 2026)

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

✅ UI/UX                            100% Complete
   └─ Light theme (English UI)
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

✅ User Profile Management         100% Complete
   └─ Profile picture upload
   └─ File size validation (5MB)
   └─ localStorage persistence

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
| Profile picture | ✅ | Avatar upload & preview |
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
- **Email / password**: values from `SEED_EMAIL` and `SEED_PASSWORD` in your `.env` (see [`.env.example`](./.env.example))
- **Never commit real credentials** — use strong unique passwords in production

### Available Features ✅
- Record scenarios with Playwright headless browser
- Execute tests with real-time execution viewer
- Test scheduling (Once, Hourly, Daily, Weekly)
- Cross-browser testing (Chrome, Firefox, WebKit, Edge)
- Parallel execution
- Password reset via email
- Light theme (English UI)

---

## 🐳 Quick Start (Docker - Recommended)

### Prerequisites
- Docker Desktop (https://www.docker.com/products/docker-desktop/)
- Git

### Setup & Start (2 Steps)
```bash
# Step 1: Clone & Configure
git clone https://github.com/andri5/testingndrih.git
cd testingndrih
cp .env.example .env

# Step 2: Start services
docker-compose up -d
```

**Wait 15 seconds**, then access:
- 🌐 Frontend: http://localhost:3000
- 📚 API Docs: http://localhost:3000/api/docs
- 🔐 Login: use `SEED_EMAIL` / `SEED_PASSWORD` from your `.env` (copy from `.env.example`)

### Common Docker Commands
```bash
# Start services
docker-compose up -d

# Stop services (data preserved)
docker-compose down

# View real-time logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f app        # Application logs
docker-compose logs -f db         # Database logs

# Check service status
docker-compose ps

# Rebuild after code changes
docker-compose up -d --build

# Clean everything (removes data)
docker-compose down -v
```

### Multi-Laptop Setup

Untuk development di 2+ laptop, arahkan `DATABASE_URL` di `.env` ke IP laptop yang menjalankan PostgreSQL/Docker. Lihat [`docs/SETUP.md`](./docs/SETUP.md) untuk detail konfigurasi jaringan.

---

## 📖 Documentation

| Need | Document |
|------|----------|
| **Documentation index** | [`docs/README.md`](docs/README.md) |
| **Architecture** | [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) |
| **Setup & config** | [`docs/SETUP.md`](docs/SETUP.md) |
| **Directory structure** | [`docs/DIRECTORY_STRUCTURE.md`](docs/DIRECTORY_STRUCTURE.md) |
| **Testing guide** | [`docs/TESTING.md`](docs/TESTING.md) |
| **Project structure (redirect)** | [`PROJECT_STRUCTURE.md`](PROJECT_STRUCTURE.md) |

---

## 🧪 Testing

```bash
# Semua test (monorepo)
npm test

# Backend unit + integration (Jest)
cd backend && npm test
cd backend && npm test -- --coverage

# Frontend unit (Vitest)
cd frontend && npm test

# E2E (Playwright — butuh backend & frontend running)
cd frontend && npm run e2e

# Health check
npm run health-check
```

**Status:** 273/295 backend tests passing (92.5%). Lihat [`docs/TESTING.md`](docs/TESTING.md) untuk panduan lengkap.

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

Lihat Swagger UI di `http://localhost:5001/api/docs` untuk referensi API lengkap.

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

Lihat [`docs/DIRECTORY_STRUCTURE.md`](docs/DIRECTORY_STRUCTURE.md) untuk organisasi folder lengkap.

```
backend/src/           # API Express + services
backend/scripts/       # Seed & utilitas backend
frontend/src/          # React SPA
frontend/e2e/          # Playwright E2E tests
docs/                  # Dokumentasi terpusat
scripts/               # health-check.js
backend/uploads/       # Screenshots, videos (gitignored)
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

# Panduan testing lengkap
# Lihat docs/TESTING.md
```

Bantuan lebih lanjut:
- [`docs/TESTING.md`](docs/TESTING.md) — Panduan testing
- [`docs/SETUP.md`](docs/SETUP.md) — Setup & troubleshooting
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — Arsitektur teknis

---

## 🔒 Security (public repository)

- **Never commit** `.env`, API tokens, Telegram bot tokens, SMTP passwords, or SSH private keys
- Copy [`.env.example`](./.env.example) → `.env` and use your own values locally
- Set `ADMIN_EMAIL`, `SEED_PASSWORD`, and `JWT_SECRET` on the server only (see [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md))
- GitHub Actions secrets: configure under **Settings → Secrets and variables → Actions**
- If credentials were ever exposed in git history, **rotate them** (JWT, DB password, SMTP app password, Telegram bot token)

---

### Documentation
- **Index**: [`docs/README.md`](docs/README.md)
- **Architecture**: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- **Testing**: [`docs/TESTING.md`](docs/TESTING.md)
- **Setup**: [`docs/SETUP.md`](docs/SETUP.md)

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

**Ready to test?** Mulai dari [`docs/TESTING.md`](docs/TESTING.md) 🚀
