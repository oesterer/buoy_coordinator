#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# shellcheck disable=SC1091
source "$ROOT_DIR/scripts/prod-common.sh"

REMOTE="$(remote_host)"

ssh "$REMOTE" <<'EOF'
set -euo pipefail

if ! command -v docker >/dev/null 2>&1; then
  sudo dnf install -y docker
fi

sudo systemctl enable --now docker

if ! docker compose version >/dev/null 2>&1; then
  mkdir -p ~/.docker/cli-plugins
  arch="$(uname -m)"
  case "$arch" in
    x86_64) compose_arch="x86_64" ;;
    aarch64|arm64) compose_arch="aarch64" ;;
    *) echo "Unsupported architecture for Docker Compose plugin: $arch" >&2; exit 1 ;;
  esac
  curl -fsSL "https://github.com/docker/compose/releases/download/v2.29.7/docker-compose-linux-${compose_arch}" -o ~/.docker/cli-plugins/docker-compose
  chmod +x ~/.docker/cli-plugins/docker-compose
fi

mkdir -p /opt/buoy_coordinator /opt/buoy-data/postgres
sudo chown -R ec2-user:ec2-user /opt/buoy_coordinator
sudo chown -R 70:70 /opt/buoy-data/postgres
sudo chmod 700 /opt/buoy-data/postgres
docker compose version
EOF
