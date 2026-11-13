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

psql_at() {
  docker exec -i "${DB_CONTAINER}" \
    psql -U "${DB_USER}" -d "${DB_NAME}" -v ON_ERROR_STOP=1 -At -F '|'
}

psql_c() {
  docker exec -i "${DB_CONTAINER}" \
    psql -U "${DB_USER}" -d "${DB_NAME}" -v ON_ERROR_STOP=1
}

echo "Looking up user: ${EMAIL}"
BEFORE="$(printf "SELECT id, email, role FROM \"User\" WHERE lower(email) = lower('%s');\n" "${EMAIL}" | psql_at || true)"

if [ -z "${BEFORE}" ]; then
  echo "ERROR: user not found: ${EMAIL}"
  echo "Nearby emails:"
  printf "SELECT email, role FROM \"User\" WHERE email ILIKE '%%%s%%' ORDER BY email LIMIT 20;\n" \
    "$(printf '%s' "${EMAIL}" | cut -d@ -f1 | tr -cd 'a-z0-9._+-')" | psql_at || true
  exit 1
fi
echo "Before: ${BEFORE}"

printf "UPDATE \"User\" SET role = 'ADMIN', \"updatedAt\" = NOW() WHERE lower(email) = lower('%s');\n" "${EMAIL}" | psql_c

AFTER="$(printf "SELECT id, email, role FROM \"User\" WHERE lower(email) = lower('%s');\n" "${EMAIL}" | psql_at)"
echo "After:  ${AFTER}"

if echo "${AFTER}" | grep -q '|ADMIN$'; then
  echo "OK: ${EMAIL} is ADMIN"
else
  echo "ERROR: role update failed"
  exit 1
fi
