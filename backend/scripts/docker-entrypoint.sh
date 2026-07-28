#!/bin/sh
set -e

# Clear stale lock from a previous crash/restart in the same container
rm -f /tmp/.X99-lock /tmp/.X11-unix/X99 2>/dev/null || true

Xvfb :99 -screen 0 1280x720x24 -nolisten tcp &
XVFB_PID=$!
export DISPLAY=:99

# Wait until the virtual display accepts connections (max ~5s)
i=0
while [ "$i" -lt 25 ]; do
  if xdpyinfo -display :99 >/dev/null 2>&1; then
    echo "[ENTRYPOINT] Xvfb :99 ready (pid $XVFB_PID)"
    break
  fi
  # xdpyinfo may be missing — fall back to lock file presence
  if [ -S /tmp/.X11-unix/X99 ] || [ -f /tmp/.X99-lock ]; then
    echo "[ENTRYPOINT] Xvfb :99 lock present (pid $XVFB_PID)"
    break
  fi
  i=$((i + 1))
  sleep 0.2
done

if ! kill -0 "$XVFB_PID" 2>/dev/null; then
  echo "[ENTRYPOINT] WARNING: Xvfb failed to start — headed browser runs will fall back to headless"
fi

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
