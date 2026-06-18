#!/bin/bash
# Build & send playful Telegram deploy notifications (GitHub Actions).
# Usage:
#   MODE=success TAG=v1.6.0 ./scripts/notify/telegram-deploy-notify.sh
#   MODE=failure TAG=v1.6.0 ./scripts/notify/telegram-deploy-notify.sh
set -euo pipefail

MODE="${1:-${MODE:-success}}"
TAG="${DEPLOY_TAG:-}"
REPO="${GITHUB_REPOSITORY:-}"
ACTOR="${GITHUB_ACTOR:-unknown}"
RUN_URL="${GITHUB_SERVER_URL:-https://github.com}/${REPO}/actions/runs/${GITHUB_RUN_ID:-0}"
SITE_URL="${PROD_SITE_URL:-https://testsambilngopi.com}"
TOKEN="${TELEGRAM_BOT_TOKEN:-}"
CHAT_ID="${TELEGRAM_CHAT_ID:-}"
GH_TOKEN="${GITHUB_TOKEN:-}"

if [ -z "${TOKEN}" ] || [ -z "${CHAT_ID}" ]; then
  echo "TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID not set — skipping notification"
  exit 0
fi

send_message() {
  local text="$1"
  # Telegram hard limit 4096 chars
  if [ "${#text}" -gt 4000 ]; then
    text="${text:0:3990}"$'\n\n…(dipotong)'
  fi
  local payload
  payload=$(jq -n \
    --arg chat_id "${CHAT_ID}" \
    --arg text "${text}" \
    '{chat_id: $chat_id, text: $text, parse_mode: "HTML", disable_web_page_preview: true}')
  curl -fsS -X POST "https://api.telegram.org/bot${TOKEN}/sendMessage" \
    -H "Content-Type: application/json" \
    -d "${payload}"
  echo ""
  echo "Telegram notification sent (${MODE})."
}

html_escape() {
  sed 's/&/\&amp;/g; s/</\&lt;/g; s/>/\&gt;/g'
}

# Prefer git author name, then GitHub login, then committer name
committer_label() {
  jq -r '
    if .commit.author.name != null and .commit.author.name != "" then .commit.author.name
    elif .author.login != null and .author.login != "" then .author.login
    elif .commit.committer.name != null and .commit.committer.name != "" then .commit.committer.name
    else "unknown"
    end
  '
}

fetch_head_commit_block() {
  local tag="$1"
  local sha="${tag#main@}"

  if [ -z "${GH_TOKEN}" ] || [ -z "${REPO}" ] || [ -z "${sha}" ] || [ "${sha}" = "${tag}" ]; then
    return
  fi

  local commit_json
  commit_json=$(curl -fsSL \
    -H "Authorization: Bearer ${GH_TOKEN}" \
    -H "Accept: application/vnd.github+json" \
    "https://api.github.com/repos/${REPO}/commits/${sha}")

  local subject author short_sha
  subject=$(echo "${commit_json}" | jq -r '.commit.message | split("\n")[0]')
  author=$(echo "${commit_json}" | committer_label)
  short_sha=$(echo "${sha}" | cut -c1-7)

  HEAD_COMMIT_BLOCK=$(
    printf '🎯 <b>Commit deploy ini:</b>\n<code>%s</code> — %s\n👤 Nama committer: <b>%s</b>' \
      "${short_sha}" \
      "$(printf '%s' "${subject}" | html_escape)" \
      "$(printf '%s' "${author}" | html_escape)"
  )
}

fetch_changelog_block() {
  local tag="$1"
  local prev_tag=""
  local commits_block=""
  local authors_block=""
  local release_url=""

  if [ -z "${GH_TOKEN}" ] || [ -z "${REPO}" ] || [ -z "${tag}" ]; then
    echo "• Detail changelog tidak tersedia (token/repo/tag kosong)"
    return
  fi

  release_url=$(curl -fsSL \
    -H "Authorization: Bearer ${GH_TOKEN}" \
    -H "Accept: application/vnd.github+json" \
    "https://api.github.com/repos/${REPO}/releases/tags/${tag}" \
    | jq -r '.html_url // empty')

  prev_tag=$(curl -fsSL \
    -H "Authorization: Bearer ${GH_TOKEN}" \
    -H "Accept: application/vnd.github+json" \
    "https://api.github.com/repos/${REPO}/tags?per_page=30" \
    | jq -r --arg t "${tag}" '
      [.[] | .name] as $names
      | ($names | index($t)) as $i
      | if $i != null and $i > 0 then $names[$i - 1] else empty end')

  if [ -n "${prev_tag}" ]; then
    local compare_json
    compare_json=$(curl -fsSL \
      -H "Authorization: Bearer ${GH_TOKEN}" \
      -H "Accept: application/vnd.github+json" \
      "https://api.github.com/repos/${REPO}/compare/${prev_tag}...${tag}")

    commits_block=$(echo "${compare_json}" | jq -r '
      [.commits[]? |
        "• " + (.commit.message | split("\n")[0]) + "\n  👤 " +
        (if .commit.author.name != null and .commit.author.name != "" then .commit.author.name
         elif .author.login != null then .author.login
         elif .commit.committer.name != null then .commit.committer.name
         else "unknown" end)
      ] | .[:12][] 
    ' 2>/dev/null | html_escape || true)

    authors_block=$(echo "${compare_json}" | jq -r '
      [.commits[]? |
        (if .commit.author.name != null and .commit.author.name != "" then .commit.author.name
         elif .author.login != null then .author.login
         elif .commit.committer.name != null then .commit.committer.name
         else "unknown" end)
      ] | unique | .[:8] | join(", ")
    ' 2>/dev/null || true)
  fi

  if [ -z "${commits_block}" ]; then
    commits_block=$(curl -fsSL \
      -H "Authorization: Bearer ${GH_TOKEN}" \
      -H "Accept: application/vnd.github+json" \
      "https://api.github.com/repos/${REPO}/releases/tags/${tag}" \
      | jq -r '.body // ""' \
      | sed 's/\r//g' | head -n 12 | sed 's/^/* /' | html_escape || echo "• (belum ada catatan rilis)")
  fi

  AUTHORS_CACHE="${authors_block}"
  RELEASE_URL_CACHE="${release_url}"
  printf '%s' "${commits_block}"
}

if [ "${MODE}" = "success" ]; then
  HEAD_COMMIT_BLOCK=""
  CHANGELOG=$(fetch_changelog_block "${TAG}")
  fetch_head_commit_block "${TAG}"
  AUTHORS="${AUTHORS_CACHE:-${ACTOR}}"
  RELEASE_LINK="${RELEASE_URL_CACHE:-${RUN_URL}}"

  DEPLOYED_AT=$(date -u '+%d %b %Y %H:%M UTC')

  HEAD_SECTION=""
  if [ -n "${HEAD_COMMIT_BLOCK:-}" ]; then
    HEAD_SECTION="${HEAD_COMMIT_BLOCK}"$'\n\n'
  fi

  read -r -d '' MESSAGE <<EOF || true
☕🚀 <b>NGOPI DULU — DEPLOY SUKSES!</b>

Production udah live. Bug? Mereka lagi ngantri di luar pintu.

🌐 <a href="${SITE_URL}">testsambilngopi.com</a>
🏷 Versi: <code>${TAG:-unknown}</code>
👤 Deploy dipicu oleh: <b>${ACTOR}</b>
🕐 Waktu: ${DEPLOYED_AT}

${HEAD_SECTION}<b>📝 Perubahan di versi ini:</b>
${CHANGELOG}

<b>🧑‍💻 Nama-nama committer:</b>
${AUTHORS}

<i>“Bukan bug, itu fitur spontan — kecuali user yang komplain.”</i>

🔗 <a href="${RELEASE_LINK}">Lihat release</a> · <a href="${RUN_URL}">Log deploy</a>
EOF

  send_message "${MESSAGE}"

elif [ "${MODE}" = "failure" ]; then
  read -r -d '' MESSAGE <<EOF || true
💥☕ <b>NGOPI TUMPAH — DEPLOY GAGAL!</b>

Production belum ke-update. Kopi jangan dibuang, log-nya yang dibuka.

🌐 Target: <a href="${SITE_URL}">testsambilngopi.com</a>
🏷 Versi target: <code>${TAG:-unknown}</code>
👤 Dipicu oleh: <b>${ACTOR}</b>

<i>“Santai — yang gagal deploy, bukan harapan kita.”</i>

🔗 <a href="${RUN_URL}">Buka log error</a>
EOF

  send_message "${MESSAGE}"
else
  echo "Unknown MODE: ${MODE} (use success or failure)"
  exit 1
fi
