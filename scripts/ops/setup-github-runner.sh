#!/bin/bash
# Install GitHub Actions self-hosted runner on the VPS (run once as root).
# Deploy workflow runs ON the server — no inbound SSH from GitHub cloud needed.
set -euo pipefail

RUNNER_USER="${RUNNER_USER:-deploy}"
RUNNER_HOME="/home/${RUNNER_USER}"
RUNNER_DIR="${RUNNER_HOME}/actions-runner"
REPO_URL="${REPO_URL:-https://github.com/andri5/testingndrih}"
RUNNER_VERSION="${RUNNER_VERSION:-2.334.0}"

if [ "$(id -u)" -ne 0 ]; then
  echo "Run as root: sudo bash scripts/ops/setup-github-runner.sh"
  exit 1
fi

if [ -z "${RUNNER_TOKEN:-}" ]; then
  echo "Set RUNNER_TOKEN from GitHub:"
  echo "  Settings → Actions → Runners → New self-hosted runner → copy token"
  echo ""
  echo "Example:"
  echo "  RUNNER_TOKEN=XXXX sudo -E bash scripts/ops/setup-github-runner.sh"
  exit 1
fi

id "${RUNNER_USER}" >/dev/null 2>&1 || { echo "User ${RUNNER_USER} not found"; exit 1; }
usermod -aG docker "${RUNNER_USER}"

mkdir -p "${RUNNER_DIR}"
cd "${RUNNER_DIR}"

if [ ! -f ./config.sh ]; then
  curl -fsSL -o actions-runner.tar.gz \
    "https://github.com/actions/runner/releases/download/v${RUNNER_VERSION}/actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz"
  tar xzf actions-runner.tar.gz
  rm -f actions-runner.tar.gz
fi

chown -R "${RUNNER_USER}:${RUNNER_USER}" "${RUNNER_DIR}"

sudo -u "${RUNNER_USER}" ./config.sh \
  --url "${REPO_URL}" \
  --token "${RUNNER_TOKEN}" \
  --name "testsambilngopi-vps" \
  --labels "production,self-hosted,linux" \
  --unattended \
  --replace

./svc.sh install "${RUNNER_USER}"
./svc.sh start

echo ""
echo "Runner installed. Verify in GitHub: Settings → Actions → Runners"
echo "Status should be Idle (green)."
