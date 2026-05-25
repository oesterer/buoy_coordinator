#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# shellcheck disable=SC1091
source "$ROOT_DIR/scripts/prod-common.sh"

load_prod_env
require_var PROD_HOST

if [ ! -f "$PROD_ENV_FILE" ]; then
  echo "Create $PROD_ENV_FILE from deploy/prod.env.example before deploying." >&2
  exit 1
fi

REMOTE="$(remote_host)"

npm run typecheck
npm run build

"$ROOT_DIR/scripts/bootstrap-prod-host.sh"

ssh "$REMOTE" "mkdir -p '$REMOTE_APP_DIR'"
rsync -az --delete \
  --exclude '.git' \
  --exclude 'node_modules' \
  --exclude 'backend/dist' \
  --exclude 'frontend/dist' \
  --exclude 'logs' \
  --exclude '.env' \
  "$ROOT_DIR/" "$REMOTE:$REMOTE_APP_DIR/"

ssh "$REMOTE" "cd '$REMOTE_APP_DIR' && docker compose --env-file deploy/prod.env -f deploy/compose.prod.yml build && docker compose --env-file deploy/prod.env -f deploy/compose.prod.yml up -d postgres"
"$ROOT_DIR/scripts/migrate-prod.sh"
ssh "$REMOTE" "cd '$REMOTE_APP_DIR' && docker compose --env-file deploy/prod.env -f deploy/compose.prod.yml up -d --remove-orphans"
