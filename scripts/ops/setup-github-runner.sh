#!/bin/bash
# Install GitHub Actions self-hosted runner on the VPS (run once as root).
# Deploy workflow runs ON the server — no inbound SSH from GitHub cloud needed.
set -euo pipefail

# Prefer explicit RUNNER_USER, else deploy → ubuntu → SUDO_USER → who invoked sudo
if [ -z "${RUNNER_USER:-}" ]; then
  if id deploy >/dev/null 2>&1; then
    RUNNER_USER=deploy
  elif id ubuntu >/dev/null 2>&1; then
    RUNNER_USER=ubuntu
  elif [ -n "${SUDO_USER:-}" ] && id "${SUDO_USER}" >/dev/null 2>&1; then
    RUNNER_USER="${SUDO_USER}"
  else
    RUNNER_USER=ubuntu
  fi
fi
RUNNER_HOME="$(getent passwd "${RUNNER_USER}" | cut -d: -f6)"
RUNNER_HOME="${RUNNER_HOME:-/home/${RUNNER_USER}}"
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
  echo "Example (VPS ini pakai user ubuntu):"
  echo "  RUNNER_TOKEN=XXXX RUNNER_USER=ubuntu sudo -E bash scripts/ops/setup-github-runner.sh"
  exit 1
fi

if ! id "${RUNNER_USER}" >/dev/null 2>&1; then
  echo "User ${RUNNER_USER} not found. Set RUNNER_USER=ubuntu (or create deploy)."
  exit 1
fi
echo "Installing runner as user: ${RUNNER_USER} (${RUNNER_DIR})"
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
