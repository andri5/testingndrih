#!/bin/sh
set -e

# Clear stale lock from a previous crash/restart in the same container
rm -f /tmp/.X99-lock /tmp/.X11-unix/X99 2>/dev/null || true
Xvfb :99 -screen 0 1280x720x24 -nolisten tcp &
export DISPLAY=:99

npx prisma migrate deploy

case "${RUN_SEED:-false}" in
  true|1|yes|TRUE|YES)
    echo "RUN_SEED enabled — running database seed"
    node scripts/seed.js
    ;;
  *)
    echo "RUN_SEED disabled — skipping database seed"
    ;;
esac

exec node src/server.js
