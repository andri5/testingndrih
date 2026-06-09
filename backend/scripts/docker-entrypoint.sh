#!/bin/sh
set -e

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
