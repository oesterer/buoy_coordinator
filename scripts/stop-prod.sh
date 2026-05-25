#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# shellcheck disable=SC1091
source "$ROOT_DIR/scripts/prod-common.sh"

load_prod_env
require_var AWS_REGION
require_var INSTANCE_ID

REMOTE="$(remote_host)"
ssh "$REMOTE" "cd '$REMOTE_APP_DIR' && docker compose --env-file deploy/prod.env -f deploy/compose.prod.yml down"

aws ec2 stop-instances --region "$AWS_REGION" --instance-ids "$INSTANCE_ID" >/dev/null
aws ec2 wait instance-stopped --region "$AWS_REGION" --instance-ids "$INSTANCE_ID"
