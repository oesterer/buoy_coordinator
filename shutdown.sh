#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$ROOT_DIR/logs"
mkdir -p "$LOG_DIR"

exec >> "$LOG_DIR/shutdown.log" 2>&1

cd "$ROOT_DIR"

echo "[$(date -Iseconds)] Stopping Buoy Coordinator services"

stop_service() {
  local name="$1"
  local pid_file="$LOG_DIR/$name.pid"

  if [ ! -f "$pid_file" ]; then
    echo "[$(date -Iseconds)] No PID file for $name"
    return
  fi

  local pid
  pid="$(cat "$pid_file")"

  if kill -0 "$pid" >/dev/null 2>&1; then
    echo "[$(date -Iseconds)] Stopping $name with PID $pid"
    kill "$pid"

    for _ in {1..20}; do
      if ! kill -0 "$pid" >/dev/null 2>&1; then
        break
      fi
      sleep 0.25
    done

    if kill -0 "$pid" >/dev/null 2>&1; then
      echo "[$(date -Iseconds)] Force stopping $name with PID $pid"
      kill -9 "$pid"
    fi
  else
    echo "[$(date -Iseconds)] $name was not running"
  fi

  rm -f "$pid_file"
}

stop_service frontend
stop_service backend

echo "[$(date -Iseconds)] Stopping Postgres"
docker compose stop postgres

echo "[$(date -Iseconds)] Shutdown complete"
