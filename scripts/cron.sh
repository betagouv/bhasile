#!/usr/bin/env bash

# Wrapper des crons Scalingo : ne lance le script que si CRON_ENABLED=true (prod)

set -euo pipefail

if [ "${CRON_ENABLED:-}" != "true" ]; then
  echo "⏭️  Cron ignoré (CRON_ENABLED != true) : $*"
  exit 0
fi

yarn script "$@"
