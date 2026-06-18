# Testing Strategy & Guide

**Last Updated:** June 8, 2026  
**Test Stack:** Jest (backend), Vitest (frontend unit), Playwright (E2E)  
**Coverage Target:** 80% statements, 80% functions, 80% lines, 75% branches

---

## Quick Start

```bash
# Semua test (monorepo)
npm test

# Backend saja (dev — tanpa coverage gate)
cd backend && npm test

# Backend dengan coverage report
cd backend && npm run test:coverage

# Frontend unit
cd frontend && npm test

# Health check (backend + frontend + DB)
npm run health-check

# E2E (frontend dev server di port 3001)
cd frontend && npx playwright install chromium   # sekali saja
cd frontend && npm run dev                       # Terminal 1 → http://localhost:3001
cd frontend && npx playwright test e2e/platform-features-e2e.spec.js --project=chromium

# E2E full suite (butuh backend + frontend)
cd backend && npm run dev    # Terminal 1
cd frontend && npm run dev   # Terminal 2
cd frontend && npm run e2e   # Terminal 3
```

---

## Backend Unit Tests

### Status Stabilisasi (Phase 1 — Juni 2026)

| Metric | Nilai |
|--------|-------|
| Tests passing | 349/349 (100%) |
| ParallelExecutionService | 18/18 ✅ |
| BrowserMatrixService | 22/22 ✅ |
| AuthController | 19/19 ✅ |
| ScenarioService | 24/24 ✅ |

### Suite Baru (Platform Features)

| Service | File Test | Cakupan |
|---------|-----------|---------|
| API Testing | `apiTestService.test.js` | Request builder, assertions |
| Issue Tracker | `issueService.test.js` | Auto-create dari execution gagal |
| Notifications | `notificationService.test.js` | Email & webhook |
| API Tokens | `apiTokenService.test.js` | CI/CD token auth |
| Variable Substitution | `variableSubstitution.test.js` | `{{var}}` di steps & API |
| Environments | `environmentService.test.js` | CRUD, variables, resolved values |
| Visual Regression | `visualRegressionService.test.js` | Baseline capture & diff |
| Scheduler | `schedulerService.test.js` | Cron runs + failure notifications |

```bash
cd backend
npm test -- --testPathPattern=apiTestService
npm test -- --testPathPattern=issueService
npm test -- --testPathPattern=notificationService
npm test -- --testPathPattern=variableSubstitution
```

### Konfigurasi

- `backend/jest.config.js` — coverage thresholds, ESM transform
- `backend/jest-setup.js` — Prisma mock, env test

---

## Integration Tests

Lokasi: `backend/tests/integration/`

| File | Workflow |
|------|----------|
| `auth.integration.test.js` | Register → login |
| `scenario.integration.test.js` | Scenario CRUD |
| `execution.integration.test.js` | Execute scenario |
| `parallel.integration.test.js` | Parallel batch |
| `scheduler.integration.test.js` | Scheduled runs |
| `workflow.integration.test.js` | End-to-end workflow |

```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd backend && npm test -- --testPathPattern=integration
```

---

## Security & Database Tests

Lihat juga **[SECURITY_TESTING.md](./SECURITY_TESTING.md)** untuk panduan pentest lengkap.

```bash
# Backend harus berjalan di :5001 (lihat SECURITY_TESTING.md)
npm run test:security
```

```
backend/tests/security/
├── sql-injection.security.test.js
├── xss.security.test.js
├── csrf-auth.security.test.js
├── authorization.security.test.js
├── input-validation.security.test.js
└── owasp.security.test.js

backend/tests/database/
├── database-integrity.test.js
├── database-transactions.test.js
└── database-performance.test.js
```

---

## Frontend E2E (Playwright)

Lokasi: `frontend/e2e/` (16 spec files)

| Spec | Area |
|------|------|
| `platform-features-e2e.spec.js` | API Testing, Issues, Environments, Visual Regression |
| `auth.spec.js` / `auth-e2e.spec.js` | Login, logout, session |
| `scenarios.spec.js` / `scenario-e2e.spec.js` | CRUD scenario |
| `execution-e2e.spec.js` | Jalankan test |
| `parallel-e2e.spec.js` | Parallel execution |
| `scheduler-e2e.spec.js` | Penjadwalan |
| `browser-matrix-e2e.spec.js` | Cross-browser |
| `comprehensive.spec.js` | Full user journey |
| `features-e2e.spec.js` | Fitur tambahan |

Konfigurasi: `frontend/playwright.config.js` (baseURL: `http://localhost:3001`)

**Platform E2E** memakai mocked API — tidak butuh backend berjalan.

---

## Visual Regression Testing

Fitur visual regression menggunakan `pixelmatch` + `pngjs` di backend.

| Komponen | Lokasi |
|----------|--------|
| Service | `backend/src/services/visualRegressionService.js` |
| Diff util | `backend/src/utils/imageDiff.js` |
| API | `/api/visual-regression` |
| UI | `frontend/src/pages/VisualRegressionPage.jsx` |
| Baseline storage | `backend/uploads/visual/` |

**Manual test flow:**
1. Jalankan scenario dengan step `SCREENSHOT` atau hook visual regression
2. Buka `/visual-regression` — review baseline & comparison
3. Approve/reject perbedaan visual

---

## Environment Variables Testing

Substitusi `{{variable}}` di test steps dan API requests.

```bash
cd backend
npm test -- --testPathPattern=variableSubstitution
```

**Manual:** Buat environment di `/environments`, pilih saat execute scenario.

---

## CI/CD Testing

Workflow dev aktif: `.github/workflows/ci.yml` (backend test + lint pada PR)

Contoh remote run: `docs/examples/ci-run-scenario.example.yml`

1. Generate API token di Settings → Integrations
2. Trigger `POST /api/ci/run` dengan token
3. Poll status execution

---

## TODO — Prioritas Berikutnya

### HIGH

- [x] Stabilkan backend unit tests (349/349 passing)
- [x] E2E untuk halaman baru — `frontend/e2e/platform-features-e2e.spec.js` (5/5 passing)
- [x] CI workflow dev — `.github/workflows/ci.yml`
- [x] API reference — `docs/API_ENDPOINTS.md`
- [ ] Naikkan coverage global ke 80%+ (`npm run test:coverage`)
- [ ] Component tests (React Testing Library) untuk `ScenariosList`, `ExecuteScenarioButton`

### MEDIUM
- [ ] Performance benchmark API (<500ms)
- [ ] Test notifikasi email/webhook end-to-end

### LOW

- [ ] Accessibility tests (axe)
- [ ] Visual regression E2E otomatis di CI

---

## Troubleshooting

```bash
# Cek backend hidup
curl http://localhost:5001/health
npm run health-check

# Verbose Jest
cd backend && npm test -- --verbose

# Playwright debug
cd frontend && npx playwright test --debug

# Playwright browser belum terinstall
cd frontend && npx playwright install chromium

# Halaman /api-testing blank di dev → restart Vite setelah update vite.config.js
# (proxy hanya untuk /api/..., bukan /api-testing)
```

**Dev port:** gunakan `http://localhost:3001` (Vite). Port 3000 biasanya Docker/build lama.

---

## Referensi

| File | Fungsi |
|------|--------|
| `backend/jest.config.js` | Konfigurasi Jest |
| `backend/jest-setup.js` | Setup & mock global |
| `frontend/playwright.config.js` | Konfigurasi E2E |
| `scripts/ops/health-check.js` | Health check semua service |
| `docs/SECURITY_TESTING.md` | Pentest & OWASP checklist |

**Status:** Backend 349/349 ✅ | Platform E2E 5/5 ✅ | CI workflow (backend + E2E) ✅ | Phase 2: naikkan coverage global.
