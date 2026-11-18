# Local agent (hybrid Run for internal staging)

Run Playwright on a PC that can reach private/VPN URLs, while jobs are queued from the cloud UI.

Jobs and results are **persisted in the database** (Execution + StepResult). Restarting the API does not clear the queue.

## Recommended: shared VPN runner (QA-friendly)

Install **once** on one office/VPN PC. QA only clicks **Jalankan di PC ini** — they do not run the agent themselves.

1. **Settings → Integrations → CI/CD API Tokens** → create `tsn_...` token (ADMIN).
2. On the shared VPN PC:

```powershell
cd D:\testingndrih-1
cd backend
npm install
npx playwright install chromium
cd ..

copy scripts\local-agent\agent.env.example scripts\local-agent\agent.env
notepad scripts\local-agent\agent.env
# set AGENT_TOKEN=tsn_...

powershell -ExecutionPolicy Bypass -File scripts\local-agent\install-windows-task.ps1
```

3. Keep **VPN connected** on that PC (task starts at user logon).
4. Check status / logs:

```powershell
powershell -File scripts\local-agent\status-windows-task.ps1
```

5. QA: open Internal scenario → **Jalankan di PC ini**.

Uninstall:

```powershell
powershell -File scripts\local-agent\uninstall-windows-task.ps1
```

Task name: `TSN-LocalAgent` · log file: `scripts/local-agent/agent.log`

## Manual / foreground (debug)

```powershell
cd testingndrih
copy scripts\local-agent\agent.env.example scripts\local-agent\agent.env
# edit AGENT_TOKEN
node scripts/local-agent/run.mjs
```

Or with env vars (overrides `agent.env`):

```powershell
$env:AGENT_API_URL="https://testsambilngopi.my.id"
$env:AGENT_TOKEN="tsn_your_token_here"
node scripts/local-agent/run.mjs
```

`run.mjs` resolves `playwright` from `backend/node_modules` and auto-loads `agent.env`.

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
