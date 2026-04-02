# 🧪 TestingNDRIH - Record & Playback Testing Platform

**Intelligent Test Recording & Playback Engine** — Record user interactions on any website, convert to test steps, and execute with smart error handling and multi-website compatibility.

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![Status](https://img.shields.io/badge/status-recording--playback--complete-brightgreen.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Node](https://img.shields.io/badge/node-20.x-brightgreen.svg)
![Playwright](https://img.shields.io/badge/Playwright-1.40+-blue.svg)
![Feature Completeness](https://img.shields.io/badge/feature--completeness-85%25-brightgreen.svg)

---

## ✨ Key Features

### 🎥 Smart Recording Engine
- ✅ **Interactive Recording** — Record clicks, fills, selections, navigation in real-time
- ✅ **Intelligent Selector Building** — Auto-generate selectors: data-testid → id → CSS Path → XPath
- ✅ **Shadow DOM Support** — Powered by `composedPath()` + MutationObserver + `>>>` combinators
- ✅ **iframe Support** — Auto-inject and capture events inside iframes
- ✅ **SPA Route Detection** — Detect route changes via `history.pushState/replaceState`
- ✅ **Dynamic Class Filtering** — Remove framework-generated classes (Angular, React, Vue, Styled Components)
- ✅ **Contenteditable Support** — Record interactions in Gmail, rich text editors, and custom editors
- ✅ **Selector Uniqueness Validation** — Auto-refine non-unique selectors with nth-child
- ✅ **Form Field Auto-Detection** — Checkbox, Radio, Select dropdown, Contenteditable handling

### ⚡ Execution Engine with Error Recovery
- ✅ **Smart Wait Strategy** — waitFor(visible) → fallback attached → scroll → retry → networkidle
- ✅ **Rich Error Capture** — Step details, page URL, console errors, failed requests included
- ✅ **Contextual Error Suggestions** — 20+ patterns for timeout, Shadow DOM, iframe, dialog, console errors
- ✅ **Dialog Auto-Handling** — Auto-accept alert/confirm/prompt dialogs
- ✅ **Multi-Tab Support** — Track and interact with multiple browser windows
- ✅ **Step-by-Step Execution** — NAVIGATE, CLICK, FILL, WAIT, ASSERTION, SCREENSHOT, API_CALL
- ✅ **Screenshot Capture** — Auto-screenshot after each step (except WAIT/API_CALL)
- ✅ **Execution Result Display** — Real-time status with auto-scroll to errors

### 🌐 Multi-Website Compatibility
- ✅ **Works on Any Website** — No special setup required, uses browser console communication
- ✅ **CSP-Safe Recording** — Console.log based communication bypasses CSP restrictions
- ✅ **Mobile-Ready** — Records on responsive and mobile websites
- ✅ **3rd-Party Widget Compatible** — Records through embeds and external content
- ✅ **Real-Time Indicator Overlay** — Shows selector as you click elements

### 🎨 User Interface
- ✅ **Intuitive Scenario Management** — Create, edit, delete test scenarios
- ✅ **Form-Based Step Editor** — Manually add/edit steps with validation
- ✅ **Execution History** — View past execution results with details
- ✅ **Bulk Delete Scenarios** — Select multiple scenarios for batch deletion

---

## 🏗️ Tech Stack

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Frontend** | React + Vite | 18.2 + 5.4.21 | Modern SPA with fast HMR |
| **Backend** | Node.js + Express | 20.x + 4.x | RESTful API server (ESM) |
| **Database** | PostgreSQL + Prisma | 16 + 5.x | Relational DB with ORM |
| **Browser Automation** | Playwright | 1.40+ | Chromium recordings & execution |
| **State Management** | Zustand | 4.4 | Frontend state |
| **Styling** | TailwindCSS | 3.4 | Utility-first CSS |
| **Authentication** | JWT + bcryptjs | Standard | Secure auth & password hashing |
| **API Client** | Axios | Latest | HTTP requests with timeouts |
| **Container** | Docker + docker-compose | Latest | PostgreSQL environment |

---

## 📊 Current Status

### Feature Completion
```
Recording Engine             [=============================] 100% ✅
  └─ Shadow DOM support      [=============================] 100% ✅
  └─ iframe support          [=============================] 100% ✅
  └─ SPA detection           [=============================] 100% ✅
  └─ Contenteditable         [=============================] 100% ✅
  └─ Form auto-detection     [=============================] 100% ✅
  └─ Dynamic class filtering [=============================] 100% ✅

Execution Engine            [=============================] 100% ✅
  └─ Smart wait strategy     [=============================] 100% ✅
  └─ Error capture           [=============================] 100% ✅
  └─ Dialog handling         [=============================] 100% ✅
  └─ Multi-tab support       [=============================] 100% ✅

Error Handling              [=============================] 100% ✅
  └─ Error suggestions       [=============================] 100% ✅ (20+ patterns)
  └─ StepErrorDetail UI      [=============================] 100% ✅

Multi-Site Support          [=============================] 100% ✅
  └─ Shadow DOM piercing     [=============================] 100% ✅
  └─ Dynamic selectors       [=============================] 100% ✅
  └─ Real-world sites        [=============================] 100% ✅

UI/UX Polish                [==========================..] 90% ✅
  └─ Form auto-scroll        [=============================] 100% ✅
  └─ Bulk delete             [=============================] 100% ✅
  └─ Error visualization     [=============================] 100% ✅

Overall Feature Completeness: **~85%** (Core testing engine complete)
```

### Tested & Verified Features
| Feature | Status | Notes |
|---------|--------|-------|
| Record clicks & fills | ✅ | Basic interactions working |
| Shadow DOM recording | ✅ | composedPath + listener attachment |
| iframe recording | ✅ | context.addInitScript + frameattached |
| SPA navigation | ✅ | history.pushState/replaceState detection |
| Contenteditable forms | ✅ | Gmail-style editor support |
| Execute steps | ✅ | All step types working |
| Smart wait strategy | ✅ | Fallback chain implemented |
| Error suggestions | ✅ | 20+ contextual patterns |
| Checkbox handling | ✅ | Auto .check()/.uncheck() |
| Dialog handling | ✅ | Auto-accept alert/confirm/prompt |
| Multi-tab | ✅ | context.on('page') tracking |
| XPath selectors | ✅ | //, /, xpath= formats |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20.x
- Docker & docker-compose
- Git

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/andri5/testingndrih.git
   cd testingndrih
   ```

2. **Start PostgreSQL**
   ```bash
   docker compose up -d
   ```

3. **Install dependencies & setup backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   npx prisma migrate dev
   npx prisma db seed
   npm run dev
   ```

4. **Setup frontend (new terminal)**
   ```bash
   cd frontend
   npm install
   npm start
   ```

5. **Login with test credentials**
   - Email: `donkditren@gmail.com`
   - Password: `password*1`

### Your First Test
1. Navigate to **Scenarios** page
2. Click **+ Buat Skenario Baru**
3. Click **Record** button
4. In the browser tab that opens, interact with any website
5. Click elements, fill forms, submit
6. Return to the TestingNDRIH tab and click **Stop Recording**
7. Review the generated steps (edit if needed)
8. Click **Execute** to run your test

---

## 🔐 Security

✅ **Credentials Management**
- `.env` files properly excluded in `.gitignore`
- `.env.example` provided as template
- Test credentials only in seed.js with bcrypt hashing
- No hardcoded API keys or secrets
- Environment variables for all sensitive data

✅ **Files Protected from Public Repository**
```
.env* (database credentials, API keys)
node_modules/ (dependencies)
dist/, build/ (generated files)
backend/uploads/ (user files)
backend/screenshots/ (test screenshots)
.vscode/, .idea/ (IDE configs)
```

For detailed security checklist, see [GITHUB_PUSH_CHECKLIST.md](./GITHUB_PUSH_CHECKLIST.md).

---

## 🎯 How It Works

### 1. Recording Phase
```
User clicks "Record" 
  ↓
Headed Chromium opens
  ↓
User interacts with website (clicks, fills, submits)
  ↓
recorder.js captures interactions via console.log()
  ↓
Builds selectors: data-testid → id → CSS Path
  ↓
User clicks "Stop Recording"
  ↓
Steps saved to database
```

### 2. Review & Edit Phase
```
User views recorded steps
  ↓
Optional: Edit step selector, value, or type
  ↓
Optional: Add manual steps (WAIT, ASSERTION, API_CALL)
  ↓
Steps prepared for execution
```

### 3. Execution Phase
```
User clicks "Execute"
  ↓
Backend loads scenario steps
  ↓
For each step:
  ├─ Resolve locator (handle Shadow DOM, iframe, XPath)
  ├─ Execute action (navigate, click, fill, etc.)
  ├─ Smart wait (visible → attached → scroll → retry)
  ├─ Capture screenshot
  ├─ Capture error details if failed
  └─ Store result
  ↓
All steps complete
  ↓
Results displayed with pass/fail per step
```

### 4. Error Handling
```
Step fails
  ↓
Error captured with:
  ├─ Error message
  ├─ Step info (selector, value, type)
  ├─ Current page URL
  ├─ Last 5 console errors
  ├─ Last 5 failed network requests
  ↓
UI suggests fixes based on error pattern
  ├─ Timeout? → Wait longer or check selector
  ├─ Shadow DOM? → Use >>> combinator or check host chain
  ├─ iframe? → Verify frame context
  ├─ Dialog? → Allow auto-accept
  └─ Network? → Check API availability
  ↓
User can click "Retest" to try again with fix
```

---

## 📝 Support & Documentation

### Main Documentation
- [plan.md](./plan.md) — Development roadmap & feature details
- [GITHUB_PUSH_CHECKLIST.md](./GITHUB_PUSH_CHECKLIST.md) — Security verification checklist

### Key Components
- **Recording Engine**: `backend/src/services/recorderService.js` (1200+ lines)
- **Execution Engine**: `backend/src/services/executionService.js` (650+ lines)
- **Error Handling**: `frontend/src/components/StepErrorDetail.jsx` (150+ lines)
- **Main UI**: `frontend/src/pages/ScenarioDetailPage.jsx` (1100+ lines)

---

## 🛠️ Environment Setup

Create `backend/.env`:
```env
DATABASE_URL="postgresql://testuser:testpass123@localhost:5432/testingndrih"
JWT_SECRET="your-super-secret-key-change-in-production"
JWT_EXPIRES_IN=7d
OPENAI_API_KEY=sk-xxxxx-optional-for-future-features
PORT=5001
```

Create `frontend/.env`:
```env
VITE_API_URL="http://localhost:5001"
VITE_APP_NAME="TestingNDRIH"
```

---

## 🚀 Development Commands

### Setup (First Time)
```bash
# Install root dependencies
npm install

# Start database
docker compose up -d

# Backend setup
cd backend
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev

# Frontend (new terminal)
cd frontend
npm install
npm start
```

### Development Mode
```bash
# Start both (from root)
npm run dev

# Or separately
npm run dev:backend      # Backend only (port 5001)
npm run dev:frontend     # Frontend only (port 3001)
```

### Useful Commands
```bash
docker compose down      # Stop database
npx prisma studio       # View database GUI (while backend running)
npx prisma db seed      # Re-seed test data
```

---

## 🐞 Troubleshooting

### Port Already in Use
```bash
# macOS/Linux - Find and kill process
lsof -i :3001          # Frontend
lsof -i :5001          # Backend
lsof -i :5432          # Database
kill -9 <PID>

# Windows - In PowerShell
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

### Database Connection Issues
```bash
# Check if Docker running
docker ps

# View logs
docker compose logs postgres

# Reset database (WARNING: deletes all data)
docker compose down -v
docker compose up -d
cd backend && npx prisma migrate dev && npx prisma db seed
```

### Recorder Not Capturing Events
1. Check that frontend is at `http://localhost:3001`
2. Check that you clicked the "Record" button
3. Verify a new browser window opened
4. Check browser console (F12) for errors
5. Check backend logs for errors

### Execution Steps Are Failing
1. Click the error message to see suggestions
2. Review the step selector - it may need adjustment
3. Try "Retest" after making edits
4. Check if page structure changed since recording
5. For Shadow DOM: selectors should have `>>>` combinator

---

## 📞 Getting Help

**See error suggestion in the execution results?** — It's designed to help you fix the specific issue.

**Issue with a specific website?** — Check:
1. Is the site using Shadow DOM? (DevTools → inspect element)
2. Is the site using iframes? (DevTools → Sources)
3. Is it a Single Page App? (Check for framework in DevTools)
4. Does it have dynamic CSS classes? (elements change on re-render)

---

## 🎓 Example: Recording Your First Test

### Step 1: Start Recording
1. Go to Scenarios page
2. Click "+ Buat Skenario Baru" to create scenario
3. Click "Record" button
4. New Chromium window opens with overlay

### Step 2: Interact with Website
1. Go to any website (e.g., https://example.com)
2. Click a button → highlighted in green overlay
3. Fill a text field → input shown in overlay
4. Submit a form → action captured

### Step 3: Stop & Review
1. Return to TestingNDRIH tab
2. Click "Stop Recording"
3. View the steps in the form below
4. Edit any step if needed
5. Add more steps manually if needed

### Step 4: Execute
1. Click "Execute" button
2. Watch each step execute
3. See screenshots after each step
4. View pass/fail status with error details

---

## 🔮 Future Enhancements (Priority 1-3)

See [plan.md](./plan.md) for detailed roadmap:

### Priority 1: Advanced Features
- [ ] Per-step timeout/retry configuration
- [ ] Headless mode for CI/CD integration
- [ ] Parallel execution of multiple scenarios
- [ ] Firefox & WebKit browser support
- [ ] Environment variable parameterization

### Priority 2: Selectors & Debugging
- [ ] File upload recording
- [ ] Hover/drag/scroll gestures
- [ ] Advanced error diagnostics dashboard
- [ ] Video recording of execution
- [ ] Network request mocking/interception

### Priority 3: Team & CI/CD
- [ ] GitHub Actions CI/CD pipeline
- [ ] Team collaboration (shared scenarios)
- [ ] Scheduled execution (cron)
- [ ] PDF/HTML reporting
- [ ] Slack/email notifications

---

## 📄 License

MIT License — See LICENSE file for details

---

**Last Updated**: April 2, 2026 - Session 7 Complete  
**Status**: Record & Playback Engine 100% Complete, Overall Feature Completeness ~85%  
**Repository**: [github.com/andri5/testingndrih](https://github.com/andri5/testingndrih)
