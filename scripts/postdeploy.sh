#!/usr/bin/env bash

# Postdeploy Scalingo : suppression/recréation des vues avec garde fou

set -euo pipefail

echo "Début du post-déploiement..."

if [ "${SKIP_POSTDEPLOY:-}" = "1" ] && [ "${IS_PRODUCTION:-}" != "true" ]; then
  echo "Postd-déploiement ignoré (via variable d'environnement)"
  exit 0
fi

yarn delete-views && yarn prisma:deploy && yarn apply-views
