#!/usr/bin/env bash

# Wrapper des crons Scalingo : ne lance le script qu'en prod (IS_PRODUCTION=true)

set -euo pipefail

if [ "${IS_PRODUCTION:-}" != "true" ]; then
  echo "⏭️  Cron ignoré : $*"
  exit 0
fi

SENTRY_CHECKIN_URL="https://sentry.incubateur.net/api/251/cron/$1/3acdbeb9544bbe2ff17673b6c7db2b76/"

send_checkin() {
  curl --silent --show-error --max-time 10 --output /dev/null "${SENTRY_CHECKIN_URL}?status=$1" || true
}

send_checkin in_progress
if yarn script "$@"; then
  send_checkin ok
else
  EXIT_CODE=$?
  send_checkin error
  exit "$EXIT_CODE"
fi
