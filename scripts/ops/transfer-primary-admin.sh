#!/usr/bin/env bash
# Promote KEEP_EMAIL to ADMIN, delete REMOVE_EMAIL, optionally patch APP .env ADMIN_EMAIL.
set -euo pipefail

KEEP_EMAIL="$(printf '%s' "${KEEP_EMAIL:-faizalandri04@gmail.com}" | tr '[:upper:]' '[:lower:]' | tr -d '[:space:]')"
REMOVE_EMAIL="$(printf '%s' "${REMOVE_EMAIL:-admin@testingndrih.local}" | tr '[:upper:]' '[:lower:]' | tr -d '[:space:]')"
APP_PATH="${APP_PATH:-/opt/testingndrih}"
ENV_FILE="${ENV_FILE:-${APP_PATH}/.env}"
DB_CONTAINER="${DB_CONTAINER_NAME:-testingndrih-db}"
DB_USER="${DB_USER:-testingndrih_user}"
DB_NAME="${DB_NAME:-testingndrih}"

if [ "${KEEP_EMAIL}" = "${REMOVE_EMAIL}" ]; then
  echo "ERROR: KEEP_EMAIL and REMOVE_EMAIL must differ"
  exit 1
fi

if ! docker ps --format '{{.Names}}' | grep -qx "${DB_CONTAINER}"; then
  echo "ERROR: DB container not running: ${DB_CONTAINER}"
  exit 1
fi

psql_at() {
  docker exec -i "${DB_CONTAINER}" \
    psql -U "${DB_USER}" -d "${DB_NAME}" -v ON_ERROR_STOP=1 -At -F '|'
}

psql_c() {
  docker exec -i "${DB_CONTAINER}" \
    psql -U "${DB_USER}" -d "${DB_NAME}" -v ON_ERROR_STOP=1
}

echo "Keep (primary admin): ${KEEP_EMAIL}"
echo "Remove: ${REMOVE_EMAIL}"

KEEP_ROW="$(printf "SELECT id, email, role FROM users WHERE lower(email) = lower('%s');\n" "${KEEP_EMAIL}" | psql_at || true)"
if [ -z "${KEEP_ROW}" ]; then
  echo "ERROR: keep user not found: ${KEEP_EMAIL}"
  exit 1
fi
echo "Before keep: ${KEEP_ROW}"

printf "UPDATE users SET role = 'ADMIN', \"isActive\" = true, \"menuPermissions\" = '{}', \"updatedAt\" = NOW() WHERE lower(email) = lower('%s');\n" \
  "${KEEP_EMAIL}" | psql_c

AFTER_KEEP="$(printf "SELECT id, email, role, \"isActive\" FROM users WHERE lower(email) = lower('%s');\n" "${KEEP_EMAIL}" | psql_at)"
echo "After keep: ${AFTER_KEEP}"

REMOVE_ROW="$(printf "SELECT id, email, role FROM users WHERE lower(email) = lower('%s');\n" "${REMOVE_EMAIL}" | psql_at || true)"
if [ -z "${REMOVE_ROW}" ]; then
  echo "Remove user already absent: ${REMOVE_EMAIL}"
else
  echo "Deleting: ${REMOVE_ROW}"
  printf "DELETE FROM users WHERE lower(email) = lower('%s');\n" "${REMOVE_EMAIL}" | psql_c
  echo "Deleted ${REMOVE_EMAIL}"
fi

if [ -f "${ENV_FILE}" ]; then
  if grep -q '^ADMIN_EMAIL=' "${ENV_FILE}"; then
    sed -i.bak "s|^ADMIN_EMAIL=.*|ADMIN_EMAIL=${KEEP_EMAIL}|" "${ENV_FILE}"
  else
    printf '\nADMIN_EMAIL=%s\n' "${KEEP_EMAIL}" >> "${ENV_FILE}"
  fi
  if grep -q '^SEED_EMAIL=' "${ENV_FILE}"; then
    sed -i.bak "s|^SEED_EMAIL=.*|SEED_EMAIL=${KEEP_EMAIL}|" "${ENV_FILE}"
  fi
  echo "Updated ${ENV_FILE} ADMIN_EMAIL=${KEEP_EMAIL}"
else
  echo "WARN: ${ENV_FILE} not found — set ADMIN_EMAIL=${KEEP_EMAIL} manually"
fi

echo "Remaining users:"
printf "SELECT email, role, \"isActive\" FROM users ORDER BY email;\n" | psql_at
echo "OK: primary admin is ${KEEP_EMAIL}"
