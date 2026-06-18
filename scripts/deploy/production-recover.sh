#!/bin/bash
# Run on the VPS as deploy user after SSH: bash scripts/deploy/production-recover.sh
# Restarts Docker stack + Nginx and verifies local health before public URL works.
set -euo pipefail

APP_PATH="${APP_PATH:-/opt/testingndrih}"
HEALTH_LOCAL="${HEALTH_LOCAL:-http://127.0.0.1:3000/health}"
PUBLIC_URL="${PUBLIC_URL:-https://testsambilngopi.com/health}"

echo "=== Production recovery: ${APP_PATH} ==="

if [ ! -d "${APP_PATH}" ]; then
  echo "ERROR: App path not found: ${APP_PATH}"
  exit 1
fi

cd "${APP_PATH}"

if [ ! -f .env ]; then
  echo "ERROR: Missing .env in ${APP_PATH}"
  exit 1
fi

echo ""
echo "1) Docker service status"
if ! systemctl is-active --quiet docker 2>/dev/null; then
  echo "Starting docker daemon..."
  sudo systemctl start docker
fi
sudo systemctl enable docker 2>/dev/null || true

echo ""
echo "2) Start database then app (full stack)"
docker compose up -d postgres
echo "Waiting for postgres..."
for i in $(seq 1 30); do
  if docker compose exec -T postgres pg_isready -U "${DB_USER:-testingndrih_user}" -d "${DB_NAME:-testingndrih}" >/dev/null 2>&1; then
    echo "Postgres ready."
    break
  fi
  sleep 2
  if [ "$i" -eq 30 ]; then
    echo "WARN: Postgres not ready — check: docker compose logs postgres"
  fi
done

docker compose up -d app
echo ""
docker compose ps

echo ""
echo "3) App health (localhost:3000)"
for attempt in 1 2 3 4 5 6 8 10; do
  if curl -fsS "${HEALTH_LOCAL}" >/dev/null; then
    echo "OK: ${HEALTH_LOCAL}"
    curl -fsS "${HEALTH_LOCAL}" || true
    echo ""
    break
  fi
  echo "Attempt ${attempt}: app not ready, waiting ${attempt}s..."
  sleep "${attempt}"
  if [ "${attempt}" -eq 10 ]; then
    echo "FAIL: App health check failed. Logs:"
    docker compose logs --tail=80 app
    exit 1
  fi
done

echo ""
echo "4) Nginx reverse proxy"
if command -v nginx >/dev/null 2>&1; then
  sudo nginx -t
  sudo systemctl restart nginx
  sudo systemctl enable nginx
  sudo systemctl status nginx --no-pager -l || true
else
  echo "nginx not installed on host — skip (ensure port 443 proxies to :3000)"
fi

echo ""
echo "5) Public URL check"
if curl -fsS --connect-timeout 15 "${PUBLIC_URL}"; then
  echo ""
  echo "=== Recovery complete: ${PUBLIC_URL} is up ==="
else
  echo ""
  echo "WARN: Local app is healthy but ${PUBLIC_URL} still unreachable."
  echo "Check: Hostinger firewall, DNS A record → VPS IP, SSL cert (certbot)."
  exit 1
fi
