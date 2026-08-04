# Local agent (hybrid Run for internal staging)

Run Playwright on a PC that can reach private/VPN URLs, while jobs are queued from the cloud UI.

Jobs and results are **persisted in the database** (Execution + StepResult). Restarting the API does not clear the queue.

## Setup

1. In the web app: **Settings → API Tokens** → create token (`tsn_...`).
2. On your VPN/LAN machine:

```bash
cd testingndrih
# Playwright must be installed (backend dependency)
set AGENT_API_URL=https://testsambilngopi.com
set AGENT_TOKEN=tsn_your_token_here
node scripts/local-agent/run.mjs
```

Linux/macOS:

```bash
export AGENT_API_URL=https://testsambilngopi.com
export AGENT_TOKEN=tsn_your_token_here
node scripts/local-agent/run.mjs
```

3. On a scenario with an **Internal** badge, click **Queue local agent**.
4. The Scenario Detail page shows job status (`QUEUED` → `CLAIMED` → `COMPLETED`/`FAILED`).
5. The agent claims the job, opens the internal URL locally, and posts step results — visible like a normal Run history.

## API

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `POST` | `/api/agent/queue/:scenarioId` | JWT | Enqueue (creates Execution `PENDING`) |
| `GET` | `/api/agent/jobs` | JWT | List jobs (`?scenarioId=&limit=`) |
| `GET` | `/api/agent/jobs/:jobId` | JWT | Job status (UI polling) |
| `POST` | `/api/agent/jobs/:jobId/cancel` | JWT | Cancel if still `QUEUED` |
| `GET` | `/api/agent/jobs/next` | JWT or API token | Claim next job |
| `POST` | `/api/agent/jobs/:jobId/complete` | JWT or API token | Write StepResults + close Execution |
| `GET` | `/api/agent/stats` | JWT | Counts by status |

See also [`docs/RUN_INTERNAL.md`](../../docs/RUN_INTERNAL.md).
