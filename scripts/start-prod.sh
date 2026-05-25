#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# shellcheck disable=SC1091
source "$ROOT_DIR/scripts/prod-common.sh"

load_prod_env
require_var AWS_REGION
require_var INSTANCE_ID

aws ec2 start-instances --region "$AWS_REGION" --instance-ids "$INSTANCE_ID" >/dev/null
aws ec2 wait instance-running --region "$AWS_REGION" --instance-ids "$INSTANCE_ID"

REMOTE="$(remote_host)"
for _ in {1..30}; do
  if ssh -o ConnectTimeout=5 "$REMOTE" "true" >/dev/null 2>&1; then
    break
  fi
  sleep 5
done

"$ROOT_DIR/scripts/bootstrap-prod-host.sh"

ssh "$REMOTE" "cd '$REMOTE_APP_DIR' && docker compose --env-file deploy/prod.env -f deploy/compose.prod.yml up -d"
