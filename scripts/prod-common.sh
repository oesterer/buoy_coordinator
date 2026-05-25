#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROD_ENV_FILE="${PROD_ENV_FILE:-$ROOT_DIR/deploy/prod.env}"
REMOTE_APP_DIR="${REMOTE_APP_DIR:-/opt/buoy_coordinator}"
SSH_USER="${SSH_USER:-ec2-user}"

load_prod_env() {
  if [ -f "$PROD_ENV_FILE" ]; then
    set -a
    # shellcheck disable=SC1090
    source "$PROD_ENV_FILE"
    set +a
  fi
}

require_var() {
  local name="$1"
  if [ -z "${!name:-}" ]; then
    echo "Missing required environment variable: $name" >&2
    exit 1
  fi
}

remote_host() {
  load_prod_env
  require_var PROD_HOST
  echo "$SSH_USER@$PROD_HOST"
}

compose_cmd() {
  echo "docker compose --env-file deploy/prod.env -f deploy/compose.prod.yml"
}
