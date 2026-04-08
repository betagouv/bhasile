#!/usr/bin/env bash

# Bash pour exécuter un script one-off ou recurring.

set -euo pipefail
export HUSKY=0

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
if [ ! -d "node_modules" ]; then
  yarn install --silent
fi

echo "🏃 Exécution du script ${SCRIPT_PATH}"
tsx "${SCRIPT_PATH}" "$@"
