# Run internal / VPN staging targets

Cloud production ([testsambilngopi.com](https://testsambilngopi.com)) runs Playwright on a **public VPS**. Private RFC1918 hosts (`10.x`, `192.168.x`, `172.16–31.x`), `localhost`, and typical VPN-only DNS **cannot** be opened from that VPS.

| Action | Where it runs | Internal staging? |
|--------|----------------|-------------------|
| **Record** (client-direct) | Your browser | Yes — if your PC is on VPN/LAN |
| **Run** on production site | VPS Playwright | No — preflight blocks with a clear message |
| **Run** via local backend | Playwright on your PC | Yes — same network as staging |

## Recommended: local Run (today)

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

## What production does (P0)

- Detects private/internal targets before execute.
- Shows a **Publik / Internal** badge on the scenario page.
- Returns `PRIVATE_NETWORK` instead of waiting for a 30s `page.goto` timeout.

## Local agent (hybrid)

See [`scripts/local-agent/README.md`](../scripts/local-agent/README.md).

Queue from Scenario Detail (**Queue local agent**) when the URL badge is Internal, then run:

```bash
export AGENT_API_URL=https://testsambilngopi.com
export AGENT_TOKEN=tsn_...
node scripts/local-agent/run.mjs
```
