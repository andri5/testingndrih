# Security Testing & Penetration Testing Guide

**Last updated:** June 2026 · **Version:** 1.14.x

Panduan untuk menguji keamanan **Test Sambil Ngopi** — otomatis (Jest + fitur in-app) dan manual (pentest / ethical hacking).

> **Penting:** Lakukan penetration testing hanya pada environment yang Anda miliki (local, staging, atau production dengan izin tertulis). Jangan scan atau exploit sistem pihak ketiga tanpa otorisasi.

---

## Ringkasan lapisan keamanan

| Lapisan | Lokasi | Fungsi |
|---------|--------|--------|
| HTTP hardening | `backend/src/server.js` | Helmet, CORS, rate limiting |
| Auth | JWT + bcrypt, `middleware/auth.js` | Session token, role ADMIN/USER |
| API tokens | `middleware/apiTokenAuth.js` | CI/CD scoped access |
| Captcha | Cloudflare Turnstile | Login, register, reset password |
| Password policy | `utils/passwordValidation.js` | OWASP-style rules |
| Production secrets | `lib/productionSecurity.js` | Startup validation di prod |
| In-app security scan | `securityTestService.js` | Admin UI — simulated OWASP checks |
| Automated Jest suite | `backend/tests/security/` | SQLi, XSS, CSRF, auth, OWASP Top 10 |

---

## 1. Automated security tests (Jest)

### Prasyarat

Security tests memanggil API **live** di `http://localhost:5001`. Backend harus berjalan dengan database test.

```bash
# Terminal 1 — database (Docker atau PostgreSQL lokal)
docker compose up -d postgres   # atau PostgreSQL lokal

# Setup test DB (sekali)
cd backend
cp .env.test.example .env.test
# Edit DATABASE_URL di .env.test

npx prisma migrate deploy
SEED_EMAIL=admin@testingndrih.local SEED_PASSWORD=AdminPass123! npm run db:seed

# Jalankan API
npm run dev
```

```bash
# Terminal 2 — security suite (butuh backend jalan di :5001)
npm run test:security
```

**PowerShell (seed user):**
```powershell
$env:SEED_EMAIL="admin@testingndrih.local"
$env:SEED_PASSWORD="AdminPass123!"
cd backend; npm run db:seed
```

Login security test memakai `captchaToken: security-test-bypass` — hanya aktif saat `NODE_ENV !== production` (restart backend setelah update kode).

### File test

| File | Cakupan |
|------|---------|
| `owasp.security.test.js` | OWASP Top 10 (A01 access control, dll.) |
| `sql-injection.security.test.js` | SQL injection pada input API |
| `xss.security.test.js` | Reflected/stored XSS vectors |
| `csrf-auth.security.test.js` | Auth tanpa token, session handling |
| `authorization.security.test.js` | Role ADMIN vs USER, IDOR |
| `input-validation.security.test.js` | Payload invalid, boundary |

Konfigurasi: `backend/jest.security.config.js`

### Semua test backend (unit + integration + security + database)

```bash
cd backend && npm run test:all
```

---

## 2. In-app security scanner (Admin)

Fitur produk untuk scan kerentanan umum pada **target URL** scenario.

1. Login sebagai **ADMIN**
2. Buka **Security Test** (`/security-test`)
3. Pilih scenario → **Start Security Scan**
4. Review findings (kategori OWASP Top 10)

**API:** `POST /api/security/scan` (admin-only)  
**Backend:** `backend/src/services/securityTestService.js`

Scan mencakup simulasi: SQLi, XSS, auth bypass, command injection, security headers, SSL/TLS.

---

## 3. Manual penetration testing checklist

Gunakan checklist ini saat melakukan ethical hacking pada staging atau production (dengan izin).

### A. Reconnaissance & information disclosure

- [ ] `GET /health` — tidak bocorkan stack trace atau versi sensitif
- [ ] `GET /api/docs` — Swagger hanya di environment yang diizinkan
- [ ] Response headers: `X-Content-Type-Options`, `X-Frame-Options`, CSP (Helmet)
- [ ] Error 404/500 — tidak expose path server internal
- [ ] `.env`, `.git`, backup files tidak accessible via web

### B. Authentication & session (OWASP A07)

- [ ] Brute force login — rate limit aktif
- [ ] Register/login tanpa Turnstile token ditolak
- [ ] Password lemah ditolak (`passwordValidation.js`)
- [ ] JWT expired / invalid → 401
- [ ] Reset password token sekali pakai, expiry 15 menit
- [ ] Logout tidak meninggalkan token valid di client storage lama

### C. Broken access control (OWASP A01)

- [ ] Akses scenario user lain tanpa token → 401
- [ ] USER tidak bisa akses `/api/security/*`, user management, admin routes
- [ ] Menu permissions per user (`menuPermissions`) di-enforce di frontend + API
- [ ] IDOR: ubah `scenarioId` / `userId` di URL/API → ditolak

### D. Injection (OWASP A03)

- [ ] SQLi pada search, filter, body JSON — Prisma parameterized queries
- [ ] XSS pada nama scenario, step description — output encoding di UI
- [ ] Command injection pada recorder/execution — tidak execute shell dari user input

### E. API & CI tokens (OWASP A02, A05)

- [ ] API token tanpa scope tidak bisa akses endpoint terlarang
- [ ] Token revoke langsung invalid
- [ ] `POST /api/ci/run` — hanya dengan token valid

### F. File upload & path traversal

- [ ] Upload hanya tipe yang diizinkan (`fileService.js`)
- [ ] Path `../../../etc/passwd` pada download ditolak

### G. Client-side & public site

- [ ] Landing feedback form — rate limit / validasi input
- [ ] ID/EN public routes — tidak expose admin paths
- [ ] CSP / XSS pada landing pages

### H. Infrastructure (production)

- [ ] HTTPS only (TLS 1.2+), HSTS di nginx
- [ ] PostgreSQL tidak exposed ke internet
- [ ] Docker secrets / `.env` tidak di image layer
- [ ] GitHub `production` environment secrets terpisah

---

## 4. External tools (optional)

Jalankan terhadap **staging** atau local — bukan production tanpa maintenance window & backup.

| Tool | Use case | Contoh |
|------|----------|--------|
| [OWASP ZAP](https://www.zaproxy.org/) | DAST — spider + active scan | `zap-baseline.py -t http://localhost:3001` |
| [nuclei](https://github.com/projectdiscovery/nuclei) | Template-based CVE/misconfig | `nuclei -u https://your-staging-url` |
| [sqlmap](https://sqlmap.org/) | SQL injection (hati-hati, hanya staging) | Parameterized pada form/API |
| [Burp Suite](https://portswigger.net/burp) | Manual intercept & replay | Proxy browser ke app |
| `npm audit` | Dependency vulnerabilities | `npm audit` di root, backend, frontend |

---

## 5. Production smoke (read-only)

Workflow `prod-monitor.yml` menjalankan health check dan Playwright smoke ke URL live — **bukan** full pentest.

```bash
# Lokal — production smoke spec (butuh kredensial di env)
cd frontend
npx playwright test e2e/production-smoke-e2e.spec.js --project=chromium
```

---

## 6. Reporting temuan

1. Catat: endpoint, payload, severity (Critical/High/Medium/Low), OWASP category
2. Buat issue GitHub dengan label `security` — **jangan** lampirkan exploit yang aktif di prod
3. Fix → tambah regression test di `backend/tests/security/` jika memungkinkan
4. Re-scan setelah deploy

---

## Quick commands

```bash
# Security Jest (backend harus jalan)
npm run test:security

# Dependency audit
npm audit
cd backend && npm audit
cd frontend && npm audit

# Health & headers
curl -I https://testsambilngopi.com/health

# Generate production secrets (VPS setup)
npm run generate-secrets
```

---

## Related docs

- [TESTING.md](./TESTING.md) — full test strategy
- [API_ENDPOINTS.md](./API_ENDPOINTS.md) — REST reference
- [DEPLOYMENT.md](./DEPLOYMENT.md) — production hardening
- In-app help: `/security-test/help`
