# Testing Strategy & Guide

**Last Updated:** June 4, 2026  
**Test Stack:** Jest (backend), Vitest (frontend unit), Playwright (E2E)  
**Coverage Target:** 80% statements, 80% functions, 80% lines, 75% branches

---

## Quick Start

```bash
# Semua test (monorepo)
npm test

# Backend saja
cd backend && npm test
cd backend && npm test -- --coverage

# Frontend unit
cd frontend && npm test

# Health check (backend + frontend + DB)
npm run health-check

# E2E (butuh backend & frontend running)
cd backend && npm run dev    # Terminal 1
cd frontend && npm run dev   # Terminal 2
cd frontend && npm run e2e   # Terminal 3
```

---

## Backend Unit Tests

### Status Stabilisasi (Phase 1 — Juni 2026)

| Metric | Nilai |
|--------|-------|
| Tests passing | 273/295 (92.5%) |
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
| Visual Regression | (via execution hooks) | Baseline capture & diff |

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

Lokasi: `frontend/e2e/` (15 spec files)

| Spec | Area |
|------|------|
| `auth.spec.js` / `auth-e2e.spec.js` | Login, logout, session |
| `scenarios.spec.js` / `scenario-e2e.spec.js` | CRUD scenario |
| `execution-e2e.spec.js` | Jalankan test |
| `parallel-e2e.spec.js` | Parallel execution |
| `scheduler-e2e.spec.js` | Penjadwalan |
| `browser-matrix-e2e.spec.js` | Cross-browser |
| `comprehensive.spec.js` | Full user journey |
| `features-e2e.spec.js` | Fitur tambahan |

Konfigurasi: `frontend/playwright.config.js`

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

Contoh workflow: `.github/workflows/ci-run-scenario.example.yml`

1. Generate API token di Settings → Integrations
2. Trigger `POST /api/ci/run` dengan token
3. Poll status execution

---

## TODO — Prioritas Berikutnya

### HIGH

- [ ] Naikkan coverage ExecutionService ke 80%+
- [ ] E2E untuk halaman baru: API Testing, Issues, Environments, Visual Regression
- [ ] Component tests (React Testing Library) untuk `ScenariosList`, `ExecuteScenarioButton`

### MEDIUM

- [ ] GitHub Actions: jalankan `npm test` otomatis di setiap PR
- [ ] Performance benchmark API (<500ms)
- [ ] Test notifikasi email/webhook end-to-end

### LOW

- [ ] Accessibility tests (axe) — mode EN/ID
- [ ] Visual regression E2E otomatis di CI
- [ ] Theme switching regression tests

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
```

---

## Referensi

| File | Fungsi |
|------|--------|
| `backend/jest.config.js` | Konfigurasi Jest |
| `backend/jest-setup.js` | Setup & mock global |
| `frontend/playwright.config.js` | Konfigurasi E2E |
| `scripts/health-check.js` | Health check semua service |

**Status:** Phase 1 stabilisasi selesai; Phase 2 fokus coverage & E2E fitur baru.
