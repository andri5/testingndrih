# Deployment & Development Workflow

Production: **https://testsambilngopi.my.id**  
App UI: **Test Repository** (icon rail + **feature folders** + scenario table).

Tanpa staging — rilis lewat `main`, dengan **Review deployments** sebelum deploy VPS.

---

## Alur development (sehari-hari)

```
1. Local develop
   frontend :3001  |  backend :5001  |  DB docker :5434
   UI: /scenarios = Test Repository (feature folders, Create menu, DnD)

2. Commit (Conventional Commits)
   feat(scenarios): ...
   fix(ui): ...

3. Push branch → PR ke main
   CI: lint + tests + E2E + commitlint

4. Merge main
   CI hijau → Release (semantic-release) → dispatch Deploy

5. Deploy Production
   Approve "Review deployments" (production-gate)
   Self-hosted runner build/up di VPS
   Health: https://testsambilngopi.my.id/health
```

### Manual deploy cepat (tanpa nunggu release)

GitHub → Actions → **Deploy Production** → Run workflow:

| Input | Nilai tipikal |
|--------|----------------|
| `use_main` | **true** (default) |
| `force_no_cache` | true setelah perubahan UI besar |
| `notify_telegram` | true |

Lalu approve **Review deployments**.

---

## Peta UI production (referensi QA)

| Menu (icon rail) | Path | Catatan |
|------------------|------|---------|
| Dashboard | `/dashboard` | Ringkasan |
| Scenarios | `/scenarios` | **Test Repository** + feature folders (1 folder = 1 fitur) |
| Test Runs | `/test-runs` | Multi-case runs grouped by feature |
| Execution | `/execution` | Run history |
| Environments | `/environments` | Variabel `{{var}}` |
| Reports / Analytics | `/reports`, `/analytics` | Laporan |
| Tools | wrench flyout | Smoke, stress, chains, API, visual, … |
| Settings | `/settings` | Akun & preferensi pribadi |
| Admin | `/admin` | Users, menus, integrations (ADMIN only) |

Create di repository: Manual / Quick Record / Templates / Excel / AI — assign ke **feature folder** aktif.

---

## Branching

| Branch | Peran | Deploy |
|--------|--------|--------|
| `main` | Production | Ya (setelah approval) |
| `feat/*` | Fitur | Tidak |
| `fix/*` | Bugfix | Tidak |
| `hotfix/*` | Darurat | Tidak |

`develop` tidak dipakai.

---

## Semantic commit

```
<type>(<scope opsional>): <deskripsi>
```

| Type | Dampak versi |
|------|----------------|
| `feat` | Minor |
| `fix` | Patch |
| `feat!` / `BREAKING CHANGE:` | Major |
| `docs`, `chore`, `ci`, … | Tidak rilis* |

\*Kecuali breaking. Validasi: Husky + commitlint (PR).

---

## Semantic release

Setelah CI `main` sukses, workflow **Release**:

1. Analisis commit sejak tag terakhir  
2. Bump versi + `CHANGELOG.md`  
3. Tag `vX.Y.Z` + GitHub Release  
4. Dispatch **Deploy Production** (`use_main=true`)

---

## Deploy production

Workflow: `.github/workflows/deploy-production.yml`

1. **Approve** — job `Review deployments` / environment `production-gate`  
2. **Deploy** — self-hosted `[self-hosted, production]`  
3. Script: `scripts/deploy/deploy-production.sh`  
   - sync `FRONTEND_URL` / `CORS_ORIGIN` → `https://testsambilngopi.my.id`  
   - build app, recreate app only  
   - attach DB network alias `postgres` (hindari conflict container)  
   - health lokal + publik  

### Secrets (environment `production`)

| Secret | Keterangan |
|--------|------------|
| `PROD_APP_PATH` | Path checkout di VPS (harus berisi `docker-compose.yml` + `.env`) |
| `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` | Notifikasi (opsional) |

### Environments

| Name | Fungsi |
|------|--------|
| `production-gate` | Required reviewers → tombol Review deployments |
| `production` | Secrets deploy (tanpa double-approve) |

### Self-hosted runner (wajib)

Tanpa runner Idle, job deploy **queued** selamanya.

```bash
# di VPS (sekali / setelah runner hilang)
RUNNER_TOKEN=XXXX sudo -E bash scripts/ops/setup-github-runner.sh
```

Cek: GitHub → Settings → Actions → Runners → hijau Idle.

Label: `self-hosted`, `production`, `linux`.

---

## Environment production (VPS `.env`)

```env
NODE_ENV=production
FRONTEND_URL=https://testsambilngopi.my.id
CORS_ORIGIN=https://testsambilngopi.my.id
DATABASE_URL=postgresql://...@postgres:5432/testingndrih
RUN_SEED=false
```

Reverse proxy saat ini: **Caddy** → `testsambilngopi.my.id` → `172.17.0.1:3000`.

---

## Local vs production

| | Local | Production |
|--|--------|------------|
| URL | http://localhost:3001 | https://testsambilngopi.my.id |
| API | http://localhost:5001 | same origin `/api` |
| UI | Vite HMR | Docker image (rebuild) |
| DB | docker `:5434` | container `testingndrih-db` |

Setelah deploy UI: hard refresh (`Ctrl+Shift+R`).

---

## Troubleshooting singkat

| Gejala | Perbaikan |
|--------|-----------|
| Deploy queued, no job | Nyalakan self-hosted runner |
| Review deployments tidak muncul | Cek environment `production-gate` + required reviewers |
| App 502 / P1001 postgres | `docker network connect --alias postgres <app_net> testingndrih-db` lalu restart app |
| UI masih lama | Rebuild `--no-cache` / `force_no_cache=true`; pastikan `PROD_APP_PATH` = checkout git terbaru |
| Health publik gagal | Cek Caddy + `curl -sk https://testsambilngopi.my.id/health` |
