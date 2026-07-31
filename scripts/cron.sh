#!/usr/bin/env bash

# Wrapper des crons Scalingo : ne lance le script qu'en prod (IS_PRODUCTION=true)

set -euo pipefail

if [ "${IS_PRODUCTION:-}" != "true" ]; then
  echo "⏭️  Cron ignoré : $*"
  exit 0
fi

yarn script "$@"
