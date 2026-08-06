# Scripts

Operational scripts for **Test Sambil Ngopi**. Core application code lives in `backend/` and `frontend/` — this folder is for deploy, monitoring, and developer utilities only.

## Layout

```
scripts/
├── deploy/          # Production deploy & maintenance
├── local-agent/     # Hybrid VPN agent for private-target runs
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
| `telegram-deploy-notify.sh` | Success/failure Telegram after deploy — includes GitHub Release notes + related commits |

## Ops (`ops/`)

| Script | npm / usage |
|--------|-------------|
| `health-check.js` | `npm run health-check` — backend, frontend, DB |
| `generate-production-secrets.js` | `npm run generate-secrets` — JWT, DB password, etc. |
| `git-push-safe.js` | `npm run push` — safe push with pre-checks |
| `setup-github-runner.sh` | One-time VPS setup for self-hosted GitHub Actions runner |
| `configure-production-ai.sh` | Configure AI keys on production (workflow dispatch) |

## Local agent (`local-agent/`)

| Script | Purpose |
|--------|---------|
| `run.mjs` | Hybrid local agent for private/VPN targets (claims `AgentJob` from API). See [`local-agent/README.md`](./local-agent/README.md). |

## Backend scripts

Database and container scripts live in `backend/scripts/` (seed, audit, maintenance, docker entrypoint). See `backend/package.json` for `db:*` commands.
