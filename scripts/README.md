# Scripts

Operational scripts for **Test Sambil Ngopi**. Core application code lives in `backend/` and `frontend/` — this folder is for deploy, monitoring, and developer utilities only.

## Layout

```
scripts/
├── deploy/          # Production deploy & maintenance
├── notify/          # Telegram notifications
└── ops/             # Health check, secrets, runner setup
```

## Deploy (`deploy/`)

| Script | Purpose |
|--------|---------|
| `deploy-production.sh` | Full VPS deploy (Docker Compose). Used by GitHub Actions `Deploy Production`. |
| `maintenance-mode.sh` | Toggle nginx maintenance page: `sudo bash scripts/deploy/maintenance-mode.sh on\|off` |
| `production-recover.sh` | Manual VPS recovery after failed deploy (run via SSH) |

## Notify (`notify/`)

| Script | Purpose |
|--------|---------|
| `telegram-deploy-notify.sh` | Success/failure Telegram message after deploy (CI only) |

## Ops (`ops/`)

| Script | npm / usage |
|--------|-------------|
| `health-check.js` | `npm run health-check` — backend, frontend, DB |
| `generate-production-secrets.js` | `npm run generate-secrets` — JWT, DB password, etc. |
| `git-push-safe.js` | `npm run push` — safe push with pre-checks |
| `setup-github-runner.sh` | One-time VPS setup for self-hosted GitHub Actions runner |
| `configure-production-ai.sh` | Configure AI keys on production (workflow dispatch) |

## Backend scripts

Database and container scripts live in `backend/scripts/` (seed, audit, maintenance, docker entrypoint). See `backend/package.json` for `db:*` commands.
