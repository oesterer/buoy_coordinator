#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$ROOT_DIR/logs"
mkdir -p "$LOG_DIR"

exec >> "$LOG_DIR/startup.log" 2>&1

cd "$ROOT_DIR"

echo "[$(date -Iseconds)] Starting Buoy Coordinator services"

if [ ! -d "$ROOT_DIR/node_modules" ]; then
  echo "[$(date -Iseconds)] Installing npm dependencies"
  npm install
fi

echo "[$(date -Iseconds)] Starting Postgres"
docker compose up -d postgres

start_service() {
  local name="$1"
  local pid_file="$LOG_DIR/$name.pid"
  shift

  if [ -f "$pid_file" ]; then
    local existing_pid
    existing_pid="$(cat "$pid_file")"
    if kill -0 "$existing_pid" >/dev/null 2>&1; then
      echo "[$(date -Iseconds)] $name already running with PID $existing_pid"
      return
    fi
  fi

  echo "[$(date -Iseconds)] Starting $name"
  nohup "$@" >> "$LOG_DIR/$name.log" 2>&1 &
  echo "$!" > "$pid_file"
  echo "[$(date -Iseconds)] $name started with PID $(cat "$pid_file")"
}

start_service backend npm run dev --workspace backend
start_service frontend npm run dev --workspace frontend

echo "[$(date -Iseconds)] Startup complete"
echo "Frontend: http://localhost:5173"
echo "Backend: http://localhost:4000"
