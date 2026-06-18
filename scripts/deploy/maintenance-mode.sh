#!/bin/bash
# Toggle nginx maintenance page on the VPS (works even when Docker app is down).
# Usage:
#   sudo bash scripts/deploy/maintenance-mode.sh on   # show maintenance page
#   sudo bash scripts/deploy/maintenance-mode.sh off  # restore normal proxy
set -euo pipefail

ACTION="${1:-}"
FLAG_FILE="${MAINTENANCE_FLAG:-/var/www/maintenance.on}"
MAINTENANCE_HTML="${MAINTENANCE_HTML:-/var/www/maintenance.html}"
REPO_HTML="${REPO_HTML:-$(dirname "$0")/../frontend/public/maintenance.html}"

if [ "$ACTION" != "on" ] && [ "$ACTION" != "off" ]; then
  echo "Usage: $0 on|off"
  exit 1
fi

if [ "$ACTION" = "on" ]; then
  if [ -f "$REPO_HTML" ]; then
    cp "$REPO_HTML" "$MAINTENANCE_HTML"
    echo "Copied maintenance page to ${MAINTENANCE_HTML}"
  elif [ ! -f "$MAINTENANCE_HTML" ]; then
    echo "WARN: No maintenance HTML at ${REPO_HTML} or ${MAINTENANCE_HTML}"
  fi
  touch "$FLAG_FILE"
  echo "Maintenance mode ON (${FLAG_FILE})"
else
  rm -f "$FLAG_FILE"
  echo "Maintenance mode OFF"
fi

if command -v nginx >/dev/null 2>&1; then
  nginx -t
  systemctl reload nginx
  echo "Nginx reloaded."
else
  echo "nginx not found — ensure reverse proxy serves maintenance when flag exists."
fi
