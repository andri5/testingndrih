#!/bin/bash
# Send a Telegram message via Bot API (used from GitHub Actions).
# Requires: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
# Usage: TELEGRAM_BOT_TOKEN=... TELEGRAM_CHAT_ID=... ./scripts/telegram-notify.sh "message"
set -euo pipefail

MESSAGE="${1:-}"
if [ -z "${MESSAGE}" ]; then
  echo "Usage: $0 <message>"
  exit 1
fi

TOKEN="${TELEGRAM_BOT_TOKEN:-}"
CHAT_ID="${TELEGRAM_CHAT_ID:-}"

if [ -z "${TOKEN}" ] || [ -z "${CHAT_ID}" ]; then
  echo "TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID not set — skipping notification"
  exit 0
fi

PAYLOAD=$(jq -n \
  --arg chat_id "${CHAT_ID}" \
  --arg text "${MESSAGE}" \
  '{chat_id: $chat_id, text: $text, parse_mode: "HTML", disable_web_page_preview: true}')

curl -fsS -X POST "https://api.telegram.org/bot${TOKEN}/sendMessage" \
  -H "Content-Type: application/json" \
  -d "${PAYLOAD}"

echo ""
echo "Telegram notification sent."
