#!/usr/bin/env bash
# Production deploy — run on VPS self-hosted runner (see .github/workflows/deploy-production.yml).
set -euo pipefail

APP_PATH="${APP_PATH:?APP_PATH is required}"
USE_MAIN="${USE_MAIN:-false}"
DEPLOY_REF="${DEPLOY_REF:-}"
FORCE_NO_CACHE="${FORCE_NO_CACHE:-false}"
HEALTH_LOCAL="${HEALTH_LOCAL:-http://127.0.0.1:3000/health}"
HEALTH_PUBLIC="${HEALTH_PUBLIC:-https://testsambilngopi.com/health}"

cd "${APP_PATH}"

maintenance() {
  if [ -f scripts/maintenance-mode.sh ] && command -v nginx >/dev/null 2>&1; then
    sudo bash scripts/maintenance-mode.sh "$1" || echo "WARN: maintenance ${1} failed (continuing)"
  fi
}

on_error() {
  echo ""
  echo "=== DEPLOY FAILED — diagnostics ==="
  docker compose ps 2>/dev/null || true
  docker compose logs --tail=120 app 2>/dev/null || true
  echo ""
  df -h / /var/lib/docker 2>/dev/null || df -h 2>/dev/null || true
  maintenance off
}
trap on_error ERR

echo "Deploy target: USE_MAIN=${USE_MAIN} DEPLOY_REF=${DEPLOY_REF:-n/a}"
echo "Runner: $(whoami)@$(hostname)"

git config --global --add safe.directory "${APP_PATH}" 2>/dev/null || true

if [ ! -w .git/objects ]; then
  echo "ERROR: cannot write to ${APP_PATH}/.git/objects"
  echo "Fix as root: chown -R deploy:deploy ${APP_PATH}"
  exit 1
fi

if [ "${USE_MAIN}" = "true" ]; then
  git fetch origin main
  git checkout -f origin/main
else
  if [ -z "${DEPLOY_REF}" ]; then
    echo "ERROR: DEPLOY_REF is required when USE_MAIN is not true"
    exit 1
  fi
  checked_out=false
  for attempt in 1 2 3 4 5 6 8 10; do
    if git fetch --tags origin && git checkout -f "${DEPLOY_REF}"; then
      checked_out=true
      break
    fi
    echo "Tag ${DEPLOY_REF} not ready (attempt ${attempt}), retrying..."
    sleep "${attempt}"
  done
  if [ "${checked_out}" != "true" ]; then
    echo "ERROR: could not checkout ${DEPLOY_REF} after retries"
    exit 1
  fi
fi

echo "Deployed revision: $(git rev-parse HEAD) ($(git log -1 --format=%s))"

if [ ! -f .env ]; then
  echo "ERROR: missing ${APP_PATH}/.env"
  exit 1
fi
sed -i 's/\r$//' .env
if grep -qE '^RUN_SEED=(true|1|yes|TRUE|YES)' .env; then
  echo "ERROR: RUN_SEED is enabled — refusing deploy"
  exit 1
fi

maintenance on

export COMPOSE_DOCKER_CLI_BUILD=1
export DOCKER_BUILDKIT=1

docker compose up -d postgres
echo "Waiting for postgres..."
pg_ready=false
for i in $(seq 1 30); do
  if docker compose exec -T postgres pg_isready -U testingndrih_user -d testingndrih >/dev/null 2>&1; then
    echo "Postgres ready."
    pg_ready=true
    break
  fi
  sleep 2
done
if [ "${pg_ready}" != "true" ]; then
  echo "ERROR: Postgres not ready after 60s"
  docker compose logs --tail=50 postgres || true
  exit 1
fi

BUILD_FLAGS=()
if [ "${FORCE_NO_CACHE}" = "true" ]; then
  BUILD_FLAGS+=(--no-cache)
  echo "Building app image (no cache)..."
else
  echo "Building app image (with layer cache)..."
fi

if ! docker compose build "${BUILD_FLAGS[@]}" app; then
  echo "WARN: first build failed — retrying once..."
  docker compose build "${BUILD_FLAGS[@]}" app
fi

docker compose up -d --force-recreate app
docker compose ps

echo "Waiting for local app health (${HEALTH_LOCAL})..."
local_ok=false
for attempt in 1 2 3 4 5 6 8 10 12 15 20 25 30; do
  if curl -fsS "${HEALTH_LOCAL}" >/dev/null 2>&1; then
    echo "Local health check passed"
    local_ok=true
    break
  fi
  echo "Attempt ${attempt}: app not ready, waiting ${attempt}s..."
  sleep "${attempt}"
done
if [ "${local_ok}" != "true" ]; then
  echo "ERROR: local health check failed"
  exit 1
fi

maintenance off

if command -v nginx >/dev/null 2>&1; then
  sudo nginx -t && sudo systemctl reload nginx || echo "WARN: nginx reload failed"
fi

echo "Waiting for public health (${HEALTH_PUBLIC})..."
for attempt in 1 2 3 4 5 6 8 10 12 15; do
  if curl -fsS "${HEALTH_PUBLIC}" >/dev/null 2>&1; then
    echo ""
    echo "Production deploy complete — public health OK"
    trap - ERR
    exit 0
  fi
  echo "Attempt ${attempt}: public URL not ready, waiting ${attempt}s..."
  sleep "${attempt}"
done

echo "ERROR: public health check failed"
exit 1
