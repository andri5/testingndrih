# Run internal / VPN staging targets

Cloud production ([testsambilngopi.my.id](https://testsambilngopi.my.id)) runs Playwright on a **public VPS**. Private RFC1918 hosts (`10.x`, `192.168.x`, `172.16–31.x`), `localhost`, and typical VPN-only DNS **cannot** be opened from that VPS.

| Action | Where it runs | Internal staging? |
|--------|----------------|-------------------|
| **Record** (client-direct) | Your browser | Yes — if your PC is on VPN/LAN |
| **Run** on production site | VPS Playwright | No — preflight blocks with a clear message |
| **Run** via local backend | Playwright on your PC | Yes — same network as staging |
| **Queue local agent** | Playwright on agent PC | Yes — agent must be on VPN/LAN |

## Recommended options

### A. Local backend Run

1. Connect to the same VPN/LAN as staging (confirm the URL opens in your browser).
2. Clone the repo and configure `backend/.env` (see [`SETUP.md`](./SETUP.md)).
3. Start the stack locally (`npm` scripts at repo root / workspaces).
4. Open the **local** UI (not the production domain).
5. Open the scenario → **Run**.

In production-mode local deploys on the same LAN, you may set:

```bash
ALLOW_PRIVATE_NETWORK_EXECUTION=true
```

Only use this when the runner machine can actually reach the private hosts.

### B. Shared VPN runner (recommended for QA)

One PC on VPN runs the agent as a Windows Scheduled Task. QA only uses the cloud UI.

1. Create an API token (**Admin → Integrations → CI/CD API Tokens**).
2. On the shared VPN PC: copy `scripts/local-agent/agent.env.example` → `agent.env`, set `AGENT_TOKEN`, then:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\local-agent\install-windows-task.ps1
```

3. Keep VPN connected on that PC.
4. Scenario Detail (Internal) → **Jalankan di PC ini**.
5. Status / logs: `powershell -File scripts\local-agent\status-windows-task.ps1`

Details: [`scripts/local-agent/README.md`](../scripts/local-agent/README.md).

### B2. Foreground agent (debug only)

```powershell
$env:AGENT_API_URL="https://testsambilngopi.my.id"
$env:AGENT_TOKEN="tsn_…"
node scripts/local-agent/run.mjs
```

## What production does (P0)

- Detects private/internal targets before execute.
- Shows a **Publik / Internal** badge on the scenario page.
- Returns `PRIVATE_NETWORK` instead of waiting for a 30s `page.goto` timeout.
