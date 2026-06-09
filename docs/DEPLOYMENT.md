# Deployment & Release Workflow

Panduan deploy production untuk **Test Sambil Ngopi** (`https://testsambilngopi.com`).

Tanpa staging — semua rilis production melalui branch `main`, semantic versioning, dan approval manual sebelum deploy.

---

## Alur kerja (ringkas)

```
feat/fix/hotfix/*  →  PR ke main  →  CI (test + lint + E2E + commitlint)
                                        ↓
                                   merge main
                                        ↓
                                   CI hijau
                                        ↓
                              semantic-release (tag vX.Y.Z)
                                        ↓
                              GitHub Release published
                                        ↓
                         Deploy Production (approval manual ⏸)
                                        ↓
                              https://testsambilngopi.com
```

---

## Branching

| Branch | Peran | Deploy |
|--------|--------|--------|
| `main` | Production | Ya (setelah release + approval) |
| `feat/*` | Fitur baru | Tidak |
| `fix/*` | Perbaikan bug | Tidak |
| `hotfix/*` | Perbaikan darurat production | Tidak |

Branch `develop` **tidak dipakai** dalam workflow ini.

---

## Semantic commit (Conventional Commits)

Format:

```
<type>(<scope opsional>): <deskripsi>

[body opsional — max 100 karakter per baris]
```

| Type | Contoh | Dampak versi |
|------|--------|----------------|
| `feat` | `feat(api): add export endpoint` | Minor (2.0.0 → 2.1.0) |
| `fix` | `fix(ui): correct login redirect` | Patch (2.0.0 → 2.0.1) |
| `feat!` atau `BREAKING CHANGE:` | breaking API change | Major (2.0.0 → 3.0.0) |
| `docs`, `test`, `chore`, `ci`, `refactor`, `perf` | maintenance | Tidak memicu rilis* |

\*Kecuali ada penanda breaking change.

Validasi lokal: Husky `commit-msg` + commitlint.  
Validasi CI: commitlint pada setiap Pull Request.

---

## Semantic release

Setelah merge ke `main` dan CI sukses, workflow **Release** menjalankan [semantic-release](https://semantic-release.gitbook.io/):

1. Menganalisis commit sejak tag terakhir
2. Menentukan versi baru (`feat` → minor, `fix` → patch)
3. Memperbarui `CHANGELOG.md` dan `package.json`
4. Membuat Git tag (`v2.1.0`) dan GitHub Release

Commit rilis bot memakai `[skip ci]` agar tidak memicu loop CI/deploy.

Konfigurasi: `.releaserc.json`

---

## Deploy production

Workflow: `.github/workflows/deploy-production.yml`

**Trigger:** GitHub Release `published` (setelah semantic-release).

**Approval:** Environment `production` di GitHub — deploy tidak jalan sebelum Anda menyetujui.

**Langkah di server (via SSH):**

1. `git fetch --tags` + `git checkout <tag>`
2. `docker compose build`
3. `docker compose up -d`
4. Health check: `https://testsambilngopi.com/health`

---

## Setup server (sekali)

### 1. User deploy

```bash
sudo adduser deploy
sudo usermod -aG docker deploy
```

### 2. SSH key untuk GitHub Actions

Di laptop Anda:

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f deploy_key -N ""
```

- Public key (`deploy_key.pub`) → `~deploy/.ssh/authorized_keys` di VPS
- Private key (`deploy_key`) → GitHub Secret `PROD_SSH_KEY`

### 3. Clone repository

```bash
sudo mkdir -p /opt/testingndrih
sudo chown deploy:deploy /opt/testingndrih
sudo -u deploy git clone https://github.com/andri5/testingndrih.git /opt/testingndrih
cd /opt/testingndrih
sudo -u deploy git checkout main
```

### 4. Environment production

Buat `/opt/testingndrih/.env` (jangan di-commit):

```env
NODE_ENV=production
PORT=3000
FRONTEND_PORT=3000

DATABASE_URL=postgresql://USER:PASS@postgres:5432/testingndrih
DB_USER=testingndrih_user
DB_PASSWORD=<strong-password>
DB_NAME=testingndrih

JWT_SECRET=<long-random-secret>
JWT_EXPIRES_IN=7d

CORS_ORIGIN=https://testsambilngopi.com

# First deploy only — set false after admin user exists
RUN_SEED=true
SEED_EMAIL=admin@testingndrih.local
SEED_PASSWORD=<change-me>
ENABLE_SCHEDULER=true
```

Setelah admin berhasil dibuat, ubah `RUN_SEED=false` di `.env` VPS agar redeploy tidak menjalankan seed lagi.

Jalankan pertama kali:

```bash
cd /opt/testingndrih
docker compose up -d
```

### 5. Reverse proxy (Nginx contoh)

SSL di-handle Certbot. Proxy ke container port 3000:

```nginx
server {
    listen 443 ssl http2;
    server_name testsambilngopi.com;

    # ssl_certificate ... (Certbot)

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## GitHub configuration

### Secrets (Settings → Secrets and variables → Actions)

| Secret | Contoh | Keterangan |
|--------|--------|------------|
| `PROD_SSH_HOST` | `123.45.67.89` | IP atau hostname VPS |
| `PROD_SSH_USER` | `deploy` | User SSH |
| `PROD_SSH_KEY` | `-----BEGIN OPENSSH...` | Private key |
| `PROD_APP_PATH` | `/opt/testingndrih` | Path clone di server |

### Environment `production`

1. Settings → Environments → New environment → `production`
2. **Required reviewers:** tambahkan akun Anda
3. (Opsional) Deployment branches: `main` only

### Branch protection `main` (disarankan)

- Require pull request before merging
- Require status checks: `Backend Tests`, `Platform E2E`, `Commit lint`
- Do not allow bypassing

---

## Rollback

Di server:

```bash
cd /opt/testingndrih
git fetch --tags
git checkout v2.0.0   # versi sebelumnya
docker compose build
docker compose up -d
```

Atau re-run workflow deploy dari GitHub Release tag lama (setelah approval).

---

## Troubleshooting

| Masalah | Solusi |
|---------|--------|
| Deploy gagal SSH | Cek secrets, firewall port 22, `authorized_keys` |
| Health check gagal | `docker compose logs -f app`, cek Nginx & port 3000 |
| Migrasi DB gagal | `docker compose logs app`, backup DB sebelum deploy |
| Tidak ada release baru | Commit mungkin hanya `chore`/`docs` — tidak memicu versi |
| Loop CI | Commit rilis memakai `[skip ci]` — pastikan tidak dihapus |

---

## File terkait

| File | Fungsi |
|------|--------|
| `.github/workflows/ci.yml` | Test, lint, E2E, commitlint |
| `.github/workflows/release.yml` | Semantic release |
| `.github/workflows/deploy-production.yml` | Deploy ke VPS |
| `.releaserc.json` | Aturan versioning |
| `docker-compose.yml` | Stack production |
| `commitlint.config.js` | Aturan commit message |
