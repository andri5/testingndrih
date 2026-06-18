#!/usr/bin/env bash
# Update AI_* variables in VPS .env and restart the app container.
# Run on the production server (or via self-hosted GitHub Actions runner).
set -euo pipefail

APP_PATH="${APP_PATH:-/opt/testingndrih}"
ENV_FILE="${APP_PATH}/.env"

if [ ! -f "${ENV_FILE}" ]; then
  echo "ERROR: missing ${ENV_FILE}"
  exit 1
fi

if [ -z "${OPENAI_API_KEY:-}" ]; then
  echo "ERROR: OPENAI_API_KEY is not set"
  exit 1
fi

AI_ENABLED="${AI_ENABLED:-true}"
OPENAI_BASE_URL="${OPENAI_BASE_URL:-https://api.groq.com/openai/v1}"
OPENAI_MODEL="${OPENAI_MODEL:-llama-3.3-70b-versatile}"
AI_RATE_LIMIT_PER_HOUR="${AI_RATE_LIMIT_PER_HOUR:-30}"
AI_DAILY_LIMIT_PER_USER="${AI_DAILY_LIMIT_PER_USER:-15}"
AI_HOURLY_LIMIT_PER_USER="${AI_HOURLY_LIMIT_PER_USER:-8}"
AI_GLOBAL_DAILY_LIMIT="${AI_GLOBAL_DAILY_LIMIT:-80}"

set_var() {
  local key="$1"
  local val="$2"
  if grep -q "^${key}=" "${ENV_FILE}"; then
    sed -i "s|^${key}=.*|${key}=${val}|" "${ENV_FILE}"
  else
    echo "${key}=${val}" >> "${ENV_FILE}"
  fi
}

set_var AI_ENABLED "${AI_ENABLED}"
set_var OPENAI_API_KEY "${OPENAI_API_KEY}"
set_var OPENAI_BASE_URL "${OPENAI_BASE_URL}"
set_var OPENAI_MODEL "${OPENAI_MODEL}"
set_var AI_RATE_LIMIT_PER_HOUR "${AI_RATE_LIMIT_PER_HOUR}"
set_var AI_DAILY_LIMIT_PER_USER "${AI_DAILY_LIMIT_PER_USER}"
set_var AI_HOURLY_LIMIT_PER_USER "${AI_HOURLY_LIMIT_PER_USER}"
set_var AI_GLOBAL_DAILY_LIMIT "${AI_GLOBAL_DAILY_LIMIT}"

sed -i 's/\r$//' "${ENV_FILE}"

cd "${APP_PATH}"
docker compose up -d app

echo "AI env updated in ${ENV_FILE} and app container restarted."
