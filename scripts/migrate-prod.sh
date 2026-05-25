#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# shellcheck disable=SC1091
source "$ROOT_DIR/scripts/prod-common.sh"

REMOTE="$(remote_host)"
PSQL="psql -U \"\$POSTGRES_USER\" -d \"\$POSTGRES_DB\" -v ON_ERROR_STOP=1"

ssh "$REMOTE" "cd '$REMOTE_APP_DIR' && docker compose --env-file deploy/prod.env -f deploy/compose.prod.yml up -d postgres"
ssh "$REMOTE" "cd '$REMOTE_APP_DIR' && docker compose --env-file deploy/prod.env -f deploy/compose.prod.yml exec -T postgres sh -c 'for i in \$(seq 1 60); do pg_isready -U \"\$POSTGRES_USER\" -d \"\$POSTGRES_DB\" && exit 0; sleep 2; done; exit 1'"

ssh "$REMOTE" "cd '$REMOTE_APP_DIR' && docker compose --env-file deploy/prod.env -f deploy/compose.prod.yml exec -T postgres sh -c '$PSQL -c \"CREATE TABLE IF NOT EXISTS schema_migrations (filename text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now());\"'"

for migration in "$ROOT_DIR"/database/migrations/*.sql; do
  filename="$(basename "$migration")"
  already_applied="$(ssh "$REMOTE" "cd '$REMOTE_APP_DIR' && docker compose --env-file deploy/prod.env -f deploy/compose.prod.yml exec -T postgres sh -c '$PSQL -tAc \"SELECT 1 FROM schema_migrations WHERE filename = '\''$filename'\'';\"'")"
  if [ "$already_applied" = "1" ]; then
    echo "Skipping $filename"
    continue
  fi

  echo "Applying $filename"
  ssh "$REMOTE" "cd '$REMOTE_APP_DIR' && docker compose --env-file deploy/prod.env -f deploy/compose.prod.yml exec -T postgres sh -c '$PSQL'" < "$migration"
  ssh "$REMOTE" "cd '$REMOTE_APP_DIR' && docker compose --env-file deploy/prod.env -f deploy/compose.prod.yml exec -T postgres sh -c '$PSQL -c \"INSERT INTO schema_migrations (filename) VALUES ('\''$filename'\'');\"'"
done
