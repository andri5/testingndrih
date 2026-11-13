#!/usr/bin/env bash
# Promote a production user to ADMIN (run on VPS / self-hosted runner).
set -euo pipefail

EMAIL="${EMAIL:?EMAIL is required}"
EMAIL="$(printf '%s' "${EMAIL}" | tr '[:upper:]' '[:lower:]' | tr -d '[:space:]')"
if ! [[ "${EMAIL}" =~ ^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$ ]]; then
  echo "ERROR: invalid email: ${EMAIL}"
  exit 1
fi

DB_CONTAINER="${DB_CONTAINER_NAME:-testingndrih-db}"
DB_USER="${DB_USER:-testingndrih_user}"
DB_NAME="${DB_NAME:-testingndrih}"

if ! docker ps --format '{{.Names}}' | grep -qx "${DB_CONTAINER}"; then
  echo "ERROR: DB container not running: ${DB_CONTAINER}"
  exit 1
fi

query_user() {
  docker exec "${DB_CONTAINER}" psql -U "${DB_USER}" -d "${DB_NAME}" -v ON_ERROR_STOP=1 \
    -v "email=${EMAIL}" -Atc \
    "SELECT id || ' | ' || email || ' | ' || role FROM \"User\" WHERE lower(email) = lower(:'email');"
}

echo "Looking up user: ${EMAIL}"
BEFORE="$(query_user || true)"
if [ -z "${BEFORE}" ]; then
  echo "ERROR: user not found: ${EMAIL}"
  exit 1
fi
echo "Before: ${BEFORE}"

docker exec "${DB_CONTAINER}" psql -U "${DB_USER}" -d "${DB_NAME}" -v ON_ERROR_STOP=1 \
  -v "email=${EMAIL}" -c \
  "UPDATE \"User\" SET role = 'ADMIN', \"updatedAt\" = NOW() WHERE lower(email) = lower(:'email');"

AFTER="$(query_user)"
echo "After:  ${AFTER}"

if echo "${AFTER}" | grep -q '| ADMIN$'; then
  echo "OK: ${EMAIL} is ADMIN"
else
  echo "ERROR: role update failed"
  exit 1
fi
