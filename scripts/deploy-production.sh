#!/usr/bin/env bash
# Production deploy — run on VPS self-hosted runner (see .github/workflows/deploy-production.yml).
# Source code comes from Actions checkout (GITHUB_WORKSPACE), not git fetch in APP_PATH,
# so deploy user never needs write access to ${APP_PATH}/.git/objects.
set -euo pipefail

APP_PATH="${APP_PATH:?APP_PATH is required}"
SOURCE_PATH="${GITHUB_WORKSPACE:-${APP_PATH}}"
FORCE_NO_CACHE="${FORCE_NO_CACHE:-false}"
HEALTH_LOCAL="${HEALTH_LOCAL:-http://127.0.0.1:3000/health}"
HEALTH_PUBLIC="${HEALTH_PUBLIC:-https://testsambilngopi.com/health}"

maintenance() {
  if [ -f "${APP_PATH}/scripts/maintenance-mode.sh" ] && command -v nginx >/dev/null 2>&1; then
    sudo bash "${APP_PATH}/scripts/maintenance-mode.sh" "$1" || echo "WARN: maintenance ${1} failed (continuing)"
  fi
}

on_error() {
  echo ""
  echo "=== DEPLOY FAILED — diagnostics ==="
  cd "${APP_PATH}" 2>/dev/null || true
  docker compose ps 2>/dev/null || true
  docker compose logs --tail=120 app 2>/dev/null || true
  echo ""
  df -h / /var/lib/docker 2>/dev/null || df -h 2>/dev/null || true
  maintenance off
}
trap on_error ERR

echo "Deploy source: ${SOURCE_PATH}"
echo "Deploy target: ${APP_PATH}"
echo "Runner: $(whoami)@$(hostname)"

if [ ! -d "${SOURCE_PATH}" ]; then
  echo "ERROR: source path does not exist: ${SOURCE_PATH}"
  exit 1
fi

mkdir -p "${APP_PATH}"

# Sync fresh checkout into production path — keep server secrets and runtime data.
if [ "$(realpath "${SOURCE_PATH}")" != "$(realpath "${APP_PATH}")" ]; then
  echo "Syncing checkout → ${APP_PATH} (preserving .env, uploads, node_modules)..."
  ENV_BACKUP=""
  if [ -f "${APP_PATH}/.env" ]; then
    ENV_BACKUP="$(mktemp)"
    cp "${APP_PATH}/.env" "${ENV_BACKUP}"
  fi

  rsync -a --delete \
    --exclude '.git' \
    --exclude '.env' \
    --exclude '.env.*' \
    --exclude 'node_modules' \
    --exclude 'frontend/node_modules' \
    --exclude 'backend/node_modules' \
    --exclude 'backend/uploads' \
    --exclude 'backend/screenshots' \
    --exclude 'backend/logs' \
    --exclude 'backend/coverage' \
    --exclude 'tmp-runs.json' \
    "${SOURCE_PATH}/" "${APP_PATH}/"

  if [ -n "${ENV_BACKUP}" ]; then
    cp "${ENV_BACKUP}" "${APP_PATH}/.env"
    rm -f "${ENV_BACKUP}"
  fi
else
  echo "SOURCE_PATH equals APP_PATH — skipping rsync"
fi

cd "${APP_PATH}"

if [ -d "${SOURCE_PATH}/.git" ]; then
  echo "Deployed revision: $(git -C "${SOURCE_PATH}" rev-parse HEAD) ($(git -C "${SOURCE_PATH}" log -1 --format=%s))"
elif [ -n "${GITHUB_SHA:-}" ]; then
  echo "Deployed revision: ${GITHUB_SHA}"
fi

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
