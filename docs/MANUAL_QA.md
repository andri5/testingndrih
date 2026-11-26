# Manual QA & Testiny-style case management

Last updated: November 2026

This guide covers **Fase A–C** features for day-to-day QA: test case details, Manual Run, attachments/runs/history tabs, and multi-case **Test Runs**.

---

## Concepts

| Term | In this app | Notes |
|------|-------------|--------|
| Feature | **Folder** in Test Repository | 1 folder = 1 fitur (module) |
| Test case | **Scenario** | 1 case = 1 flow; lives in a feature folder |
| Manual checklist | **Manual Run** | Pass/Fail/Blocked/Skipped per step, no Playwright |
| Automated run | Mode **Automated (Playwright)** | Record + cloud/local agent playback |
| Multi-case cycle | **Test Run** | Many cases in one sealed run |
| Bug | **Issues** | Auto from fail, or create from Manual Failed/Blocked |

---

## Organize by feature

Recommended structure (no step groups inside a case):

1. **Scenarios** → sidebar **Feature folders** → **New** (e.g. `Login`)
2. Select that folder → **Create Manual** (case lands in the active feature)
3. Or drag the **⋮⋮ grip** on a case from the table onto a feature folder (or **No folder**)
4. **Reorder** inside a feature folder / No folder: drag **⋮⋮** onto another row (atas/bawah). Not available on “All scenarios” (that view sorts by date).
5. **Click** a case (or **Open**) → detail panel opens on the **right** (Testiny-style: Details / Attachments / Runs / History). Edit steps / Manual Run via **full page** (icon ↗ in panel).
6. Breadcrumb **feature name** returns to that folder’s case list

Keep unrelated flows as separate cases under the same feature folder (e.g. Login valid / Login invalid).

### Bulk import Excel

**Scenarios → Create → Import Excel** (Ctrl+Click unduh template).

Template columns (current):

| Column | Notes |
|--------|--------|
| Feature Folder | 1 folder = 1 fitur; dibuat otomatis jika belum ada |
| Case Name | 1 case = 1 flow (isi di baris pertama case) |
| Description / Base URL / Precondition | Case meta |
| Case Expected Result | Expected hasil case |
| Severity (Priority) | LOW / MEDIUM / HIGH / CRITICAL |
| Case Type | Functional / Regression / Smoke / Sanity / Other |
| Step # / Step Type / Step Description | Steps |
| Step Expected Result / Selector / Value | Opsional per step |

Baris berikutnya kosongkan kolom case meta; isi hanya step. Format lama (`Scenario Name` + `Type`) masih diterima.

---

## Fase A — Case details & Manual Run

On **Scenarios → Open** a case:

1. **Details**
   - **Priority** / **Type** — colored selects (LOW→CRITICAL, Functional/Regression/Smoke/Other)
   - **Precondition** — text
   - **Expected result** — case-level text + **screenshot images** (PNG/JPG/WEBP/GIF); click **Simpan detail** for text
   - **PIC**, **Steps** (per-step expected result still available in the step form)
2. **Mode** defaults to **Manual checklist**
3. **Manual Run** — shows precondition + expected result/images; mark each step; Failed/Blocked require notes (+ optional Bug)
4. Switch to **Automated** to show **Record** and Playwright Run

Also available from **Execution**: select scenario → Mode Manual → Manual Run.

---

## Fase B — Attachments, Runs tab, last result

Case tabs:

- **Attachments** — general evidence (PNG/JPG/WEBP/GIF/PDF); expected-result images live under Details (`kind=EXPECTED_RESULT`)
- Cap: **16** files per case · **8MB** each
- **Runs** — execution history for this case + % complete
- **History** — audit log when you save Details field changes (includes `expectedResult`)

Repository list shows **Last result** (Passed / Failed / Running + %).

---

## Fase C — Multi-case Test Runs + bulk + audit

### Test Runs menu

1. **Test Runs → Create Run** — cases appear **grouped by feature folder** (1 folder = 1 fitur)
2. Filter by fitur, or **Select fitur** to pick all cases in that folder (or mix several fitur)
3. Open run → cases listed under each feature header → Pass/Fail/Blocked/Skip (or **Checklist**)
4. **Close / Seal** when the cycle is done

Tip: name the run after the features, e.g. `Sprint 12 · Login + Checkout`.

### Bulk on Scenarios

- **Create Test Run** — start a multi-case cycle from selected rows  
- **Auto Run** — sequential Playwright (headless)  
- **Move…** / **Set PIC…**

---

## Roles (recommended menus)

| Role | Menus |
|------|--------|
| **ADMIN** | All + Settings admin |
| **LEAD** | All testing (Main + Tools) |
| **USER (Tester)** | Dashboard, Scenarios, Test Runs, Execution, Environments, Reports, Analytics, Bugs |
| **VIEWER** | Dashboard, Scenarios, Test Runs, Reports, Analytics, Bugs (no Execution / Tools) |

Presets live in `backend/src/constants/roles.js` and `frontend/src/constants/roles.js`. Admins can still customize per user in Admin → Users / Menus.

---

## Dashboard reminders

Unfinished / stuck / empty draft scenarios appear on the Dashboard.

- **Sembunyikan / Hide** — collapse the panel (can **Tampilkan** again)
- **Nanti aja** — dismiss visible items for today
- Per-item **X** — dismiss one item for today

---

## Tools menu (sidebar)

Admin/LEAD tools sit under the **wrench** icon (Visual Regression, Chains, API Testing, Scheduler, Parallel, Smoke/Stress/Security, Browser Test). The flyout opens above Help/Settings so icons are not clipped by the scrollable main nav.

---

## Related docs

- [RUN_INTERNAL.md](./RUN_INTERNAL.md) — public vs internal URL / local agent  
- [API_ENDPOINTS.md](./API_ENDPOINTS.md) — REST reference  
- [../README.md](../README.md) — product overview  
- In-app **How to use** (sidebar help) — same flows for QA
