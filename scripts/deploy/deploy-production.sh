#!/usr/bin/env bash
# Production deploy — run on VPS self-hosted runner (see .github/workflows/deploy-production.yml).
# Builds from Actions checkout (GITHUB_WORKSPACE). Server .env stays in APP_PATH only.
# Avoids git fetch / rsync permission issues under /opt/testingndrih.
set -euo pipefail

APP_PATH="${APP_PATH:?APP_PATH is required}"
SOURCE_PATH="${GITHUB_WORKSPACE:-${APP_PATH}}"
ENV_FILE="${APP_PATH}/.env"
COMPOSE_FILE="${SOURCE_PATH}/docker-compose.yml"
COMPOSE_PROJECT="${COMPOSE_PROJECT:-testingndrih}"
FORCE_NO_CACHE="${FORCE_NO_CACHE:-false}"
HEALTH_LOCAL="${HEALTH_LOCAL:-http://127.0.0.1:3000/health}"
HEALTH_PUBLIC="${HEALTH_PUBLIC:-https://testsambilngopi.com/health}"

compose() {
  docker compose -p "${COMPOSE_PROJECT}" -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" "$@"
}

maintenance() {
  local script="${SOURCE_PATH}/scripts/deploy/maintenance-mode.sh"
  if [ -f "${script}" ] && command -v nginx >/dev/null 2>&1; then
    sudo bash "${script}" "$1" || echo "WARN: maintenance ${1} failed (continuing)"
  fi
}

on_error() {
  echo ""
  echo "=== DEPLOY FAILED — diagnostics ==="
  compose ps 2>/dev/null || true
  compose logs --tail=120 app 2>/dev/null || true
  echo ""
  df -h / /var/lib/docker 2>/dev/null || df -h 2>/dev/null || true
  maintenance off
}
trap on_error ERR

echo "Deploy source: ${SOURCE_PATH}"
echo "Env file: ${ENV_FILE}"
echo "Runner: $(whoami)@$(hostname)"

if [ ! -d "${SOURCE_PATH}" ]; then
  echo "ERROR: source path does not exist: ${SOURCE_PATH}"
  exit 1
fi
if [ ! -f "${COMPOSE_FILE}" ]; then
  echo "ERROR: missing ${COMPOSE_FILE}"
  exit 1
fi
if [ ! -f "${ENV_FILE}" ]; then
  echo "ERROR: missing ${ENV_FILE}"
  exit 1
fi

sed -i 's/\r$//' "${ENV_FILE}"
if grep -qE '^RUN_SEED=(true|1|yes|TRUE|YES)' "${ENV_FILE}"; then
  echo "ERROR: RUN_SEED is enabled — refusing deploy"
  exit 1
fi

if [ -d "${SOURCE_PATH}/.git" ]; then
  echo "Deployed revision: $(git -C "${SOURCE_PATH}" rev-parse HEAD) ($(git -C "${SOURCE_PATH}" log -1 --format=%s))"
elif [ -n "${GITHUB_SHA:-}" ]; then
  echo "Deployed revision: ${GITHUB_SHA}"
fi

maintenance on

export COMPOSE_DOCKER_CLI_BUILD=1
export DOCKER_BUILDKIT=1

compose up -d postgres
echo "Waiting for postgres..."
pg_ready=false
for i in $(seq 1 30); do
  if compose exec -T postgres pg_isready -U testingndrih_user -d testingndrih >/dev/null 2>&1; then
    echo "Postgres ready."
    pg_ready=true
    break
  fi
  sleep 2
done
if [ "${pg_ready}" != "true" ]; then
  echo "ERROR: Postgres not ready after 60s"
  compose logs --tail=50 postgres || true
  exit 1
fi

BUILD_FLAGS=()
if [ "${FORCE_NO_CACHE}" = "true" ]; then
  BUILD_FLAGS+=(--no-cache)
  echo "Building app image (no cache)..."
else
  echo "Building app image (with layer cache)..."
fi

if ! compose build "${BUILD_FLAGS[@]}" app; then
  echo "WARN: first build failed — retrying once..."
  compose build "${BUILD_FLAGS[@]}" app
fi

compose up -d --force-recreate app
compose ps

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
