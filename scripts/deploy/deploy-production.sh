#!/usr/bin/env bash
# Production deploy — run on VPS self-hosted runner (see .github/workflows/deploy-production.yml).
# Builds from Actions checkout (GITHUB_WORKSPACE). Server .env stays in APP_PATH only.
set -euo pipefail

APP_PATH="${APP_PATH:?APP_PATH is required}"
SOURCE_PATH="${GITHUB_WORKSPACE:-${APP_PATH}}"
ENV_FILE="${APP_PATH}/.env"
COMPOSE_FILE="${SOURCE_PATH}/docker-compose.yml"
COMPOSE_PROJECT="${COMPOSE_PROJECT:-testingndrih}"
FORCE_NO_CACHE="${FORCE_NO_CACHE:-false}"
HEALTH_LOCAL="${HEALTH_LOCAL:-http://127.0.0.1:3000/health}"
HEALTH_PUBLIC="${HEALTH_PUBLIC:-https://testsambilngopi.my.id/health}"
PROD_SITE_URL="${PROD_SITE_URL:-https://testsambilngopi.my.id}"
DB_CONTAINER_NAME="${DB_CONTAINER_NAME:-testingndrih-db}"
APP_CONTAINER_NAME="${APP_CONTAINER_NAME:-testingndrih-app}"

compose() {
  docker compose -p "${COMPOSE_PROJECT}" -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" "$@"
}

maintenance() {
  local script="${SOURCE_PATH}/scripts/deploy/maintenance-mode.sh"
  if [ -f "${script}" ] && command -v nginx >/dev/null 2>&1; then
    sudo bash "${script}" "$1" || echo "WARN: maintenance ${1} failed (continuing)"
  fi
}

ensure_env_domain() {
  # Keep CORS / public URL aligned with current production domain
  if grep -qE '^FRONTEND_URL=' "${ENV_FILE}"; then
    sed -i "s|^FRONTEND_URL=.*|FRONTEND_URL=${PROD_SITE_URL}|" "${ENV_FILE}"
  else
    echo "FRONTEND_URL=${PROD_SITE_URL}" >> "${ENV_FILE}"
  fi
  if grep -qE '^CORS_ORIGIN=' "${ENV_FILE}"; then
    sed -i "s|^CORS_ORIGIN=.*|CORS_ORIGIN=${PROD_SITE_URL}|" "${ENV_FILE}"
  else
    echo "CORS_ORIGIN=${PROD_SITE_URL}" >> "${ENV_FILE}"
  fi
  echo "Env domain:"
  grep -E '^(FRONTEND_URL|CORS_ORIGIN)=' "${ENV_FILE}" || true
}

ensure_postgres() {
  # Prefer an already-running DB container (avoids name conflicts across compose projects)
  if docker ps -a --format '{{.Names}}' | grep -qx "${DB_CONTAINER_NAME}"; then
    echo "Using existing DB container: ${DB_CONTAINER_NAME}"
    docker start "${DB_CONTAINER_NAME}" >/dev/null || true
  else
    echo "Starting postgres via compose..."
    compose up -d postgres
  fi

  echo "Waiting for postgres..."
  for i in $(seq 1 30); do
    if docker exec "${DB_CONTAINER_NAME}" pg_isready -U testingndrih_user -d testingndrih >/dev/null 2>&1; then
      echo "Postgres ready."
      return 0
    fi
    if compose exec -T postgres pg_isready -U testingndrih_user -d testingndrih >/dev/null 2>&1; then
      echo "Postgres ready (compose)."
      return 0
    fi
    sleep 2
  done
  echo "ERROR: Postgres not ready after 60s"
  docker logs --tail=50 "${DB_CONTAINER_NAME}" 2>/dev/null || compose logs --tail=50 postgres || true
  return 1
}

attach_db_network() {
  # After app recreate, DB may sit on another network — alias hostname "postgres"
  local app_net
  app_net="$(docker inspect "${APP_CONTAINER_NAME}" -f '{{range $k,$v := .NetworkSettings.Networks}}{{println $k}}{{end}}' 2>/dev/null | head -1 || true)"
  if [ -z "${app_net}" ]; then
    echo "WARN: could not detect app network — skip DB network attach"
    return 0
  fi
  echo "Attaching ${DB_CONTAINER_NAME} to ${app_net} (alias postgres)"
  docker network connect --alias postgres "${app_net}" "${DB_CONTAINER_NAME}" 2>/dev/null || \
    echo "DB already on network / alias exists"
}

on_error() {
  echo ""
  echo "=== DEPLOY FAILED — diagnostics ==="
  compose ps 2>/dev/null || true
  docker ps -a --filter "name=testingndrih" 2>/dev/null || true
  compose logs --tail=120 app 2>/dev/null || docker logs --tail=120 "${APP_CONTAINER_NAME}" 2>/dev/null || true
  echo ""
  df -h / /var/lib/docker 2>/dev/null || df -h 2>/dev/null || true
  maintenance off
}
trap on_error ERR

echo "Deploy source: ${SOURCE_PATH}"
echo "Env file: ${ENV_FILE}"
echo "Public site: ${PROD_SITE_URL}"
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

ensure_env_domain

if [ -d "${SOURCE_PATH}/.git" ]; then
  echo "Deployed revision: $(git -C "${SOURCE_PATH}" rev-parse HEAD) ($(git -C "${SOURCE_PATH}" log -1 --format=%s))"
elif [ -n "${GITHUB_SHA:-}" ]; then
  echo "Deployed revision: ${GITHUB_SHA}"
fi

maintenance on

export COMPOSE_DOCKER_CLI_BUILD=1
export DOCKER_BUILDKIT=1

ensure_postgres

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

# Recreate app only — keep existing DB container
if docker ps -a --format '{{.Names}}' | grep -qx "${APP_CONTAINER_NAME}"; then
  docker stop "${APP_CONTAINER_NAME}" >/dev/null 2>&1 || true
  docker rm "${APP_CONTAINER_NAME}" >/dev/null 2>&1 || true
fi
compose up -d --no-deps app
attach_db_network
docker restart "${APP_CONTAINER_NAME}" >/dev/null 2>&1 || true
compose ps 2>/dev/null || docker ps --filter "name=testingndrih"

echo "Waiting for local app health (${HEALTH_LOCAL})..."
local_ok=false
for attempt in 1 2 3 4 5 6 8 10 12 15 20 25 30; do
  if curl -fsS "${HEALTH_LOCAL}" >/dev/null 2>&1; then
    echo "Local health check passed"
    local_ok=true
    break
  fi
  echo "Attempt ${attempt}: app not ready, waiting ${attempt}s..."
  # Re-attach DB if app restarted onto a fresh network
  attach_db_network || true
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

# Reload Caddy if present (current VPS reverse proxy)
if docker ps --format '{{.Names}}' | grep -qx 'dompettenang-caddy-1'; then
  docker exec dompettenang-caddy-1 caddy reload --config /etc/caddy/Caddyfile >/dev/null 2>&1 \
    || echo "WARN: Caddy reload failed (continuing)"
fi

echo "Waiting for public health (${HEALTH_PUBLIC})..."
for attempt in 1 2 3 4 5 6 8 10 12 15; do
  if curl -fsSk "${HEALTH_PUBLIC}" >/dev/null 2>&1; then
    echo ""
    echo "Production deploy complete — ${PROD_SITE_URL} healthy"
    trap - ERR
    exit 0
  fi
  echo "Attempt ${attempt}: public URL not ready, waiting ${attempt}s..."
  sleep "${attempt}"
done

echo "ERROR: public health check failed"
exit 1
