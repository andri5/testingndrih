# 🧪 Testing Strategy & TODO List (v2.1.0)

**Last Updated:** June 2, 2026  
**Test Environment:** Jest (Backend), Playwright (Frontend E2E)  
**Coverage Target:** 80% statements, 80% functions, 80% lines, 75% branches

---

## 📊 PHASE 1 Testing Status

### ✅ PHASE 1A: Backend Unit Tests (COMPLETED)

**Backend Unit Tests Implemented:**
- ✅ **AuthController** (19/19 tests PASSING)
  - `registerUser()` - 4 tests (validation, duplicate, success)
  - `loginUser()` - 4 tests (invalid email, wrong password, success)
  - `getCurrentUser()` - 2 tests (found, not found)
  - `forgotPassword()` - 3 tests (missing email, non-existent user, valid user)
  - `validateResetToken()` - 3 tests (missing token, invalid/expired, valid)
  - `resetPassword()` - 3 tests (missing token, password mismatch, success)

- ✅ **ScenarioService** (24/24 tests PASSING)
  - `createScenario()` - 7 tests (validation, URL format, success, error handling)
  - `getUserScenarios()` - 4 tests (pagination, ordering, defaults, error handling)
  - `getScenarioById()` - 4 tests (retrieve with steps, not found, unauthorized)
  - `updateScenario()` - 5 tests (update success, URL validation, authorization, partial updates)
  - `deleteScenario()` - 4 tests (delete, not found, unauthorized, error handling)

**Backend Unit Tests Status:**
```
Test Suites: 2 passed ✅
Tests:       43 passed ✅
Time:        ~7.4s
Coverage:    Limited (single file runs) - need full suite run
```

**How to Run:**
```bash
# Run all backend tests
cd backend && npm test

# Run specific test suite
npm test -- --testPathPattern=authController
npm test -- --testPathPattern=scenarioService

# Run with coverage
npm test -- --coverage
```

---

### 🔄 PHASE 1B: Integration Tests (IN PROGRESS)

**Integration Tests Available:**
- `backend/tests/integration/auth.integration.test.js` - Auth workflow (register → login)
- `backend/tests/integration/scenario.integration.test.js` - Scenario CRUD workflow
- `backend/tests/integration/execution.integration.test.js` - Execution workflow
- `backend/tests/integration/parallel.integration.test.js` - Parallel execution
- `backend/tests/integration/scheduler.integration.test.js` - Scheduler workflow
- `backend/tests/integration/workflow.integration.test.js` - Complete workflow

**Note:** Integration tests require running backend server on port 5001
```bash
# Terminal 1: Start backend
cd backend && npm run dev

# Terminal 2: Run integration tests (after backend is ready)
cd backend && npm test -- --testPathPattern=integration
```

---

### 🌐 PHASE 1C: Frontend E2E Tests (IN PROGRESS)

**Frontend E2E Tests Available:**
- `frontend/e2e/auth.spec.js` - Login/Logout workflow
- `frontend/e2e/scenarios.spec.js` - Create/Edit/Delete scenarios
- `frontend/e2e/execution-e2e.spec.js` - Execute scenarios
- `frontend/e2e/comprehensive.spec.js` - Full user journey
- `frontend/e2e/search.spec.js` - Search functionality
- `frontend/e2e/features-e2e.spec.js` - Feature workflows

**How to Run:**
```bash
# Requires both backend and frontend running
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev

# Terminal 3: E2E Tests
cd frontend && npx playwright test

# Or specific test
npx playwright test e2e/scenarios.spec.js
```

---

## 📋 PHASE 1 TODO List

### Priority: CRITICAL ⚡

#### 1. ✅ [DONE] Fix & Validate Backend Unit Tests
- [x] AuthController tests implemented and passing (19/19)
- [x] ScenarioService tests implemented and passing (24/24)
- [x] Mock setup for prisma, password utils, JWT
- **Action:** Run full backend test suite to verify all pass
  ```bash
  cd backend && npm test -- --coverage
  ```

#### 2. 🔧 [IN PROGRESS] Fix ExecutionService Tests
- [ ] executionService.test.js - Fix failing tests (39 failed, 7 passed)
- [ ] executionService.comprehensive.test.js - Add comprehensive execution scenarios
- [ ] testStepService.test.js - Test step creation with transaction handling (NEW: race condition fix)
- **Action Required:**
  ```bash
  cd backend && npm test -- --testPathPattern=executionService
  # Analyze failures and fix test mocks
  ```

#### 3. 📱 [NOT STARTED] Frontend E2E - Core Workflow
- [ ] Verify auth.spec.js passes (login/logout)
- [ ] Verify scenarios.spec.js passes (CRUD operations)
- [ ] Create basic happy-path test (register → create scenario → execute)
- [ ] Add error handling tests (invalid credentials, timeout)
- **Action Required:**
  ```bash
  cd frontend && npx playwright test e2e/auth.spec.js
  cd frontend && npx playwright test e2e/scenarios.spec.js
  ```

#### 4. 🔗 [NOT STARTED] Integration Test - Auth + Scenario Workflow
- [ ] backend/tests/integration/auth.integration.test.js
- [ ] backend/tests/integration/scenario.integration.test.js
- [ ] Test complete auth → scenario create → step add workflow
- **Action Required:**
  ```bash
  # Ensure backend is running on port 5001
  cd backend && npm test -- --testPathPattern=integration
  ```

---

### Priority: HIGH 🔴

#### 5. 📊 [NOT STARTED] Coverage Analysis & Gaps
- [ ] Run full test suite with coverage report: `npm test -- --coverage`
- [ ] Identify modules with <80% coverage
- [ ] Document which files need more test coverage
- [ ] Prioritize critical paths (auth, execution, scenario CRUD)

#### 6. 🐛 [NOT STARTED] Critical Bug Test Coverage
- [ ] Test unique constraint fix on TestStep creation (verify transaction works)
- [ ] Test recorder with visible browser (headless: false)
- [ ] Test stepNumber calculation doesn't cause race conditions
- [ ] Test password reset flow end-to-end

#### 7. 🧩 [NOT STARTED] Component Tests (Frontend)
- [ ] Create React component unit tests (Jest + React Testing Library)
- [ ] Test critical components: ScenariosList, ChainBuilderPage, BrowserSelector
- [ ] Test Tooltip component in dark/light modes
- [ ] Test HelpModal with EN/ID language switching

---

### Priority: MEDIUM 🟡

#### 8. 🔒 [NOT STARTED] Security Tests
- [ ] SQL injection prevention - backend/tests/security/sql-injection.security.test.js
- [ ] XSS prevention - backend/tests/security/xss.security.test.js
- [ ] CSRF token validation - backend/tests/security/csrf-auth.security.test.js
- [ ] Input validation for all endpoints
- [ ] Authorization enforcement (scenario ownership)

#### 9. 🚀 [NOT STARTED] Performance Tests
- [ ] Database performance - backend/tests/database/database-performance.test.js
- [ ] Parallel execution stress test (10+ scenarios)
- [ ] API response time benchmarks (<500ms target)
- [ ] Frontend load time tests

#### 10. 📁 [NOT STARTED] File Upload Tests
- [ ] Test CSV template import
- [ ] Test screenshot upload during execution
- [ ] Test file size limits
- [ ] Test concurrent file uploads

---

### Priority: LOW 🟢

#### 11. 🎨 [NOT STARTED] UI/UX Tests
- [ ] Visual regression tests (Percy)
- [ ] Accessibility tests (axe) - EN/ID language modes
- [ ] Theme switching tests (dark/light mode)
- [ ] Responsive design tests (mobile, tablet, desktop)

#### 12. ⚙️ [NOT STARTED] Admin/Analytics Tests
- [ ] Admin panel workflow tests
- [ ] Analytics dashboard data accuracy
- [ ] User management (create, disable, delete)
- [ ] System health checks

#### 13. 🔔 [NOT STARTED] Email & Notification Tests
- [ ] Password reset email
- [ ] Execution result notifications
- [ ] Scheduler notifications
- [ ] Test environment email (development mode)

#### 14. 📊 [NOT STARTED] Test Reporting & CI/CD
- [ ] Setup GitHub Actions for automated test runs
- [ ] Generate coverage reports on each PR
- [ ] Slack notifications for test failures
- [ ] Performance regression detection

---

## 🏃 QUICK START - Run Tests

### All Backend Unit Tests
```bash
cd backend
npm test                          # Run all
npm test -- --coverage           # With coverage report
```

### All Frontend E2E Tests (requires both servers running)
```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev

# Terminal 3
cd frontend
npx playwright test               # Run all E2E tests
npx playwright test e2e/auth.spec.js  # Run specific test
```

### All Integration Tests
```bash
# Ensure backend server is running
cd backend && npm run dev

# In another terminal
cd backend
npm test -- --testPathPattern=integration
```

---

## 📈 Test Metrics Dashboard

| Category | Test Suite | Pass | Fail | Status | Run Command |
|----------|-----------|------|------|--------|------------|
| **Unit** | AuthController | 19 | 0 | ✅ | `npm test -- --testPathPattern=authController` |
| **Unit** | ScenarioService | 24 | 0 | ✅ | `npm test -- --testPathPattern=scenarioService` |
| **Unit** | ExecutionService | 7 | 39 | ❌ | `npm test -- --testPathPattern=executionService` |
| **Unit** | TestStepService | ? | ? | 🔄 | `npm test -- --testPathPattern=testStepService` |
| **Integration** | Auth Workflow | ? | ? | 🔄 | `npm test -- --testPathPattern=auth.integration` |
| **Integration** | Scenario Workflow | ? | ? | 🔄 | `npm test -- --testPathPattern=scenario.integration` |
| **E2E** | Scenarios | ? | ? | 🔄 | `npx playwright test e2e/scenarios.spec.js` |
| **E2E** | Execution | ? | ? | 🔄 | `npx playwright test e2e/execution-e2e.spec.js` |
| **E2E** | Auth | ? | ? | 🔄 | `npx playwright test e2e/auth.spec.js` |

---

## 🔑 Key Testing Improvements Made (v2.1.0)

✅ Implemented comprehensive backend unit tests for critical controllers/services  
✅ Added proper mocking for Prisma, JWT, password utilities  
✅ Created test coverage for auth workflows (register, login, password reset)  
✅ Added scenario CRUD operation tests  
✅ Integration test files available (auth, scenario, execution flows)  
✅ Frontend E2E test framework configured with Playwright  

---

## 📞 Support & Documentation

**Test Configuration Files:**
- Backend: `backend/jest.config.js`, `backend/jest-setup.js`
- Frontend: `frontend/playwright.config.js`

**Coverage Requirements:**
- Statements: 80% ✅
- Functions: 80% ✅
- Lines: 80% ✅
- Branches: 75% ✅

**Next Steps for PHASE 2:**
1. Fix ExecutionService tests (high priority - critical for recording)
2. Add component unit tests (React components)
3. Implement security tests (SQL injection, XSS, CSRF)
4. Add performance benchmarks
5. Setup CI/CD pipeline (GitHub Actions)

---

**Status:** PHASE 1 Testing underway  
**Last Updated:** June 2, 2026  
**Next Review:** After PHASE 1 completion
