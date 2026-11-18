# Manual QA & Testiny-style case management

Last updated: November 2026

This guide covers **Fase A–C** features for day-to-day QA: test case details, Manual Run, attachments/runs/history tabs, and multi-case **Test Runs**.

---

## Concepts

| Term | In this app | Notes |
|------|-------------|--------|
| Test case | **Scenario** | Repository list + detail page |
| Manual checklist | **Manual Run** | Pass/Fail/Blocked/Skipped per step, no Playwright |
| Automated run | Mode **Automated (Playwright)** | Record + cloud/local agent playback |
| Multi-case cycle | **Test Run** | Many cases in one sealed run |
| Bug | **Issues** | Auto from fail, or create from Manual Failed/Blocked |

---

## Fase A — Case details & Manual Run

On **Scenarios → Open** a case:

1. **Details** — Priority, Type, Precondition, PIC, Steps (+ Expected result)
2. **Mode** defaults to **Manual checklist**
3. **Manual Run** — mark each step; Failed/Blocked require notes (+ optional Bug)
4. Switch to **Automated** to show **Record** and Playwright Run

Also available from **Execution**: select scenario → Mode Manual → Manual Run.

---

## Fase B — Attachments, Runs tab, last result

Case tabs:

- **Attachments** — PNG/JPG/WEBP/GIF/PDF (max 12 × 8MB)
- **Runs** — execution history for this case + % complete
- **History** — audit log when you save Details field changes

Repository list shows **Last result** (Passed / Failed / Running + %).

---

## Fase C — Multi-case Test Runs + bulk + audit

### Test Runs menu

1. **Test Runs → Create Run** (or select cases → **Create Test Run**)
2. Open run → set Pass/Fail/Blocked/Skip per case (or **Checklist**)
3. **Close / Seal** when the cycle is done

### Bulk on Scenarios

- **Create Test Run** — start a multi-case cycle  
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

Presets live in `backend/src/constants/roles.js` and `frontend/src/constants/roles.js`. Admins can still customize per user in Settings → Users / Menus.

---

## Dashboard reminders

Unfinished / stuck / empty draft scenarios appear on the Dashboard.

- **Sembunyikan / Hide** — collapse the panel (can **Tampilkan** again)
- **Nanti aja** — dismiss visible items for today
- Per-item **X** — dismiss one item for today

---

## Related docs

- [RUN_INTERNAL.md](./RUN_INTERNAL.md) — public vs internal URL / local agent  
- [API_ENDPOINTS.md](./API_ENDPOINTS.md) — REST reference  
- In-app **How to use** (sidebar help) — same flows for QA
