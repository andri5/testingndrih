#!/bin/bash
# Build & send playful Telegram deploy notifications (GitHub Actions).
# Usage:
#   MODE=success TAG=v1.6.0 ./scripts/notify/telegram-deploy-notify.sh
#   MODE=failure TAG=v1.6.0 ./scripts/notify/telegram-deploy-notify.sh
#
# Env:
#   DEPLOY_TAG          — release tag (v1.x.y) or main / main@<sha>
#   RELEASE_NOTES_TAG   — optional explicit tag whose GitHub Release body to show
#   TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, GITHUB_TOKEN, GITHUB_REPOSITORY, …
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
NOTES_TAG_HINT="${RELEASE_NOTES_TAG:-}"

AUTHORS_CACHE=""
RELEASE_URL_CACHE=""
NOTES_TAG_CACHE=""
HEAD_COMMIT_BLOCK=""

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

gh_api() {
  local path="$1"
  curl -fsSL \
    -H "Authorization: Bearer ${GH_TOKEN}" \
    -H "Accept: application/vnd.github+json" \
    -H "X-GitHub-Api-Version: 2022-11-28" \
    "https://api.github.com/repos/${REPO}${path}"
}

committer_label() {
  jq -r '
    if .commit.author.name != null and .commit.author.name != "" then .commit.author.name
    elif .author.login != null and .author.login != "" then .author.login
    elif .commit.committer.name != null and .commit.committer.name != "" then .commit.committer.name
    else "unknown"
    end
  '
}

# Resolve SHA when deploying main / main@sha / a release tag
resolve_head_sha() {
  local tag="$1"
  if [[ "${tag}" == main@* ]]; then
    echo "${tag#main@}"
    return
  fi
  if [ "${tag}" = "main" ]; then
    gh_api "/commits/main" | jq -r '.sha // empty'
    return
  fi
  if [ -n "${tag}" ]; then
    gh_api "/git/ref/tags/${tag}" 2>/dev/null | jq -r '
      if .object.type == "tag" then .object.sha
      elif .object.type == "commit" then .object.sha
      else empty end
    ' || gh_api "/commits/${tag}" 2>/dev/null | jq -r '.sha // empty' || true
  fi
}

latest_release_tag() {
  gh_api "/releases/latest" 2>/dev/null | jq -r '.tag_name // empty' || true
}

fetch_head_commit_block() {
  local tag="$1"
  local sha
  sha=$(resolve_head_sha "${tag}")
  if [ -z "${GH_TOKEN}" ] || [ -z "${REPO}" ] || [ -z "${sha}" ]; then
    return
  fi

  local commit_json
  commit_json=$(gh_api "/commits/${sha}") || return

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

# Convert markdown-ish release notes to Telegram-friendly plain/HTML lines
format_release_notes_body() {
  local body="$1"
  if [ -z "${body}" ] || [ "${body}" = "null" ]; then
    return
  fi
  printf '%s' "${body}" \
    | sed 's/\r//g' \
    | sed -E 's/^#{1,6}[[:space:]]*//g' \
    | sed -E 's/\*\*([^*]+)\*\*/\1/g' \
    | sed -E 's/`([^`]+)`/\1/g' \
    | sed -E 's/^\*[[:space:]]+/• /g' \
    | sed -E 's/^-[[:space:]]+/• /g' \
    | sed '/^[[:space:]]*$/d' \
    | head -n 25 \
    | html_escape
}

fetch_release_notes_for_tag() {
  local tag="$1"
  [ -z "${tag}" ] && return
  local json
  json=$(gh_api "/releases/tags/${tag}" 2>/dev/null || true)
  [ -z "${json}" ] && return

  RELEASE_URL_CACHE=$(echo "${json}" | jq -r '.html_url // empty')
  NOTES_TAG_CACHE="${tag}"
  local body
  body=$(echo "${json}" | jq -r '.body // empty')
  format_release_notes_body "${body}"
}

fetch_commits_between() {
  local base="$1"
  local head="$2"
  [ -z "${base}" ] || [ -z "${head}" ] && return

  local compare_json
  compare_json=$(gh_api "/compare/${base}...${head}" 2>/dev/null || true)
  [ -z "${compare_json}" ] && return

  AUTHORS_CACHE=$(echo "${compare_json}" | jq -r '
    [.commits[]? |
      (if .commit.author.name != null and .commit.author.name != "" then .commit.author.name
       elif .author.login != null then .author.login
       elif .commit.committer.name != null then .commit.committer.name
       else "unknown" end)
    ] | unique | .[:8] | join(", ")
  ' 2>/dev/null || true)

  echo "${compare_json}" | jq -r '
    [.commits[]? |
      "• " + (.commit.message | split("\n")[0]) + "\n  👤 " +
      (if .commit.author.name != null and .commit.author.name != "" then .commit.author.name
       elif .author.login != null then .author.login
       elif .commit.committer.name != null then .commit.committer.name
       else "unknown" end)
    ] | .[:12][]
  ' 2>/dev/null | html_escape || true
}

# Prefer CHANGELOG.md section for a version (checked-out workspace)
fetch_changelog_md_section() {
  local version="$1"
  local file="CHANGELOG.md"
  [ -f "${file}" ] || return
  version="${version#v}"
  [ -z "${version}" ] && return

  # Capture from "## [x.y.z]" or "# [x.y.z]" until next heading
  awk -v ver="${version}" '
    BEGIN { show=0 }
    $0 ~ "^#+ \\[" ver "\\]" { show=1; next }
    show && $0 ~ "^#+ \\[" { exit }
    show { print }
  ' "${file}" \
    | sed '/^[[:space:]]*$/d' \
    | head -n 20 \
    | sed -E 's/^#+[[:space:]]*//; s/^\*[[:space:]]+/• /; s/^-[[:space:]]+/• /' \
    | html_escape || true
}

fetch_changelog_block() {
  local tag="$1"
  local notes=""
  local commits_block=""
  local notes_tag=""
  local head_sha=""

  if [ -z "${GH_TOKEN}" ] || [ -z "${REPO}" ]; then
    echo "• Detail changelog tidak tersedia (token/repo kosong)"
    return
  fi

  head_sha=$(resolve_head_sha "${tag}")

  # Which release notes to show?
  if [ -n "${NOTES_TAG_HINT}" ]; then
    notes_tag="${NOTES_TAG_HINT}"
  elif [[ "${tag}" == v* ]]; then
    notes_tag="${tag}"
  else
    notes_tag=$(latest_release_tag)
  fi

  if [ -n "${notes_tag}" ]; then
    notes=$(fetch_release_notes_for_tag "${notes_tag}")
    if [ -z "${notes}" ]; then
      notes=$(fetch_changelog_md_section "${notes_tag}")
    fi
  fi

  # Commits since previous release (or notes_tag) → deploy head
  local base_for_compare="${notes_tag}"
  if [ -z "${base_for_compare}" ] && [[ "${tag}" == v* ]]; then
    base_for_compare=$(gh_api "/tags?per_page=30" | jq -r --arg t "${tag}" '
      [.[] | .name] as $names
      | ($names | index($t)) as $i
      | if $i != null and $i > 0 then $names[$i - 1] else empty end')
  fi

  local compare_head="${head_sha:-${tag}}"
  if [ -n "${base_for_compare}" ] && [ -n "${compare_head}" ] && [ "${base_for_compare}" != "${compare_head}" ]; then
    commits_block=$(fetch_commits_between "${base_for_compare}" "${compare_head}")
  fi

  {
    if [ -n "${notes}" ]; then
      echo "<b>📦 Catatan rilis${notes_tag:+ (${notes_tag})}:</b>"
      echo "${notes}"
      echo ""
    fi
    if [ -n "${commits_block}" ]; then
      echo "<b>🔎 Commit terkait deploy:</b>"
      echo "${commits_block}"
    elif [ -z "${notes}" ]; then
      echo "• (belum ada catatan rilis — cek GitHub Releases)"
    fi
  }
}

if [ "${MODE}" = "success" ]; then
  CHANGELOG=$(fetch_changelog_block "${TAG}")
  fetch_head_commit_block "${TAG}"
  AUTHORS="${AUTHORS_CACHE:-${ACTOR}}"
  RELEASE_LINK="${RELEASE_URL_CACHE:-${RUN_URL}}"
  NOTES_LABEL="${NOTES_TAG_CACHE:-${NOTES_TAG_HINT:-}}"

  DEPLOYED_AT=$(date -u '+%d %b %Y %H:%M UTC')

  HEAD_SECTION=""
  if [ -n "${HEAD_COMMIT_BLOCK:-}" ]; then
    HEAD_SECTION="${HEAD_COMMIT_BLOCK}"$'\n\n'
  fi

  DISPLAY_TAG="${TAG:-unknown}"
  if [ -n "${NOTES_LABEL}" ] && [[ "${DISPLAY_TAG}" == main* ]]; then
    DISPLAY_TAG="${DISPLAY_TAG} (rilis ${NOTES_LABEL})"
  fi

  read -r -d '' MESSAGE <<EOF || true
☕🚀 <b>NGOPI DULU — DEPLOY SUKSES!</b>

Production udah live. Bug? Mereka lagi ngantri di luar pintu.

🌐 <a href="${SITE_URL}">testsambilngopi.com</a>
🏷 Versi / target: <code>${DISPLAY_TAG}</code>
👤 Deploy dipicu oleh: <b>${ACTOR}</b>
🕐 Waktu: ${DEPLOYED_AT}

${HEAD_SECTION}<b>📝 Perubahan / catatan rilis:</b>
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
