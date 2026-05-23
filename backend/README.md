# Buoy Coordinator Backend

Express + TypeScript API for RC sailing racetrack planning and buoy telemetry.

## Setup

```bash
cp .env.example .env
docker compose up -d postgres
npm install
npm run dev --workspace backend
```

The API runs on `http://localhost:4000` by default.

## API

- `GET /api/racetracks`
- `POST /api/racetracks`
- `PUT /api/racetracks/:id`
- `DELETE /api/racetracks/:id`
- `GET /api/buoys`
- `POST /api/buoys/:id/telemetry`
- `GET /api/buoys/:id/command`
- `POST /api/buoys/:id/commands`

WebSocket clients connect to `ws://localhost:4000/ws` and receive `buoy.updated`, `racetrack.created`, `racetrack.updated`, and `racetrack.deleted` messages.

## Database

Migrations live in `../database/migrations`. Docker Compose mounts them into Postgres initialization, so they run when the database volume is first created.
