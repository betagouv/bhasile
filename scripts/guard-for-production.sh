#!/usr/bin/env bash

set -euo pipefail

if [ "${IS_PRODUCTION:-}" = "true" ]; then
  echo "🚫 Commande interdite en production (IS_PRODUCTION=true)."
  exit 1
fi
