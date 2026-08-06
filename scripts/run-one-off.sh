#!/usr/bin/env bash

# Bash pour exécuter un script one-off ou recurring.

set -euo pipefail
export HUSKY=0

# Un container one-off peut tourner pendant un déploiement : il laisse le pool web tranquille.
export DATABASE_POOL_MAX=${DATABASE_POOL_MAX:-3}

SCRIPT_KIND=${SCRIPT_KIND:-one-off}
SCRIPTS_BASE_DIR="scripts/${SCRIPT_KIND}-scripts"

if [ ! -d "${SCRIPTS_BASE_DIR}" ]; then
  echo "❌ Erreur : le dossier '${SCRIPTS_BASE_DIR}' n'existe pas."
  exit 1
fi

SCRIPT_NAME=${1:-}
shift || true # retire le nom du script des arguments

if [ -z "$SCRIPT_NAME" ]; then
  echo "❌ Erreur : merci de fournir le nom du script. Exemple : yarn ${SCRIPT_KIND} 20251020-migrate-forms-and-steps"
  exit 1
fi

SCRIPT_PATH="${SCRIPTS_BASE_DIR}/${SCRIPT_NAME}.ts"

if [ ! -f "${SCRIPT_PATH}" ]; then
  echo "❌ Erreur : le script '${SCRIPT_PATH}' est introuvable."
  exit 1
fi

echo "🚀 Installation des dépendances"
rm -f .yarnrc && yarn install --production=false

echo "🏃 Exécution du script ${SCRIPT_PATH}"
npx tsx "${SCRIPT_PATH}" "$@"
