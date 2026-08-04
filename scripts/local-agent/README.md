# Local agent (hybrid Run for internal staging)

Run Playwright on a PC that can reach private/VPN URLs, while jobs are queued from the cloud UI.

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

3. On a scenario with an **Internal** badge, click **Queue local agent** (or use API below).
4. The agent claims the job, opens the internal URL locally, and posts results.

## API

- `POST /api/agent/queue/:scenarioId` (JWT) — enqueue
- `GET /api/agent/jobs/next` (JWT or API token) — claim
- `POST /api/agent/jobs/:jobId/complete` — report result

Jobs are **in-memory** on the API process (MVP). Restarting the server clears the queue.

See also [`docs/RUN_INTERNAL.md`](../../docs/RUN_INTERNAL.md).
