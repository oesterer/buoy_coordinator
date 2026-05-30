# Buoy Coordinator 

Full-stack RC sailing racetrack planner for autonomous floating buoy drones.

## Screenshots

![Planner UI screenshot](docs/images/planner-ui.png)

![Autonomous buoy drone](buoy.png)

## Deployment Architecture

![Deployment architecture](docs/images/deployment-architecture.png)

## Stack

- Frontend: React, TypeScript, Vite, Tailwind, React-Leaflet
- Backend: Node.js, Express, TypeScript, WebSockets
- Database: Postgres through Docker Compose

## Run Locally

```bash
cp .env.example .env
npm install
docker compose up -d postgres
npm run dev --workspace backend
npm run dev --workspace frontend
```

Frontend: `http://localhost:5173`  
Backend: `http://localhost:4000`

The Postgres container runs migrations from `database/migrations` when its volume is first initialized.

## Workspaces

- `backend`: REST API, WebSocket broadcasting, database repositories
- `frontend`: map-first racetrack planning UI
- `database`: SQL migrations

## Production Deployment

The low-cost AWS deployment path uses one EC2 instance with Docker Compose:

- Caddy serves the frontend and terminates HTTPS.
- Caddy proxies `/api` and `/ws` to the backend container.
- Postgres runs in Docker with data stored under `/opt/buoy-data/postgres` on an attached EBS volume.
- Terraform provisions EC2, security group, Elastic IP, and the EBS data volume.

Create AWS infrastructure:

```bash
cp infra/terraform/terraform.tfvars.example infra/terraform/terraform.tfvars
# edit key_name and ssh_ingress_cidr
./scripts/provision.sh
```

Point your DNS `A` record at the Terraform `public_ip` output.

Create production environment config:

```bash
cp deploy/prod.env.example deploy/prod.env
# edit APP_DOMAIN, ACME_EMAIL, PROD_HOST, AWS_REGION, INSTANCE_ID, and POSTGRES_PASSWORD
```

Deploy:

```bash
./scripts/deploy.sh
```

Start and stop the production host and services:

```bash
./scripts/start-prod.sh
./scripts/stop-prod.sh
```

Back up and restore Postgres:

```bash
./scripts/backup-db.sh
./scripts/restore-db.sh backups/buoy_coordinator-YYYYMMDD-HHMMSS.sql.gz
```

`deploy/prod.env`, Terraform state, and `backups/` are ignored by git.

See [docs/production.md](docs/production.md) for the production runbook and [docs/deploy.md](docs/deploy.md) for the detailed deployment guide.

## Database Access

Start Postgres:

```bash
docker compose up -d postgres
```

Use these settings in a SQL client:

```text
Host: localhost
Port: 5432
Database: buoy_coordinator
Username: xxxx
Password: xxxx
SSL: disabled
```

Connection URL:

```text
postgres://username:password@localhost:5432/buoy_coordinator
```

Test with `psql`:

```bash
psql postgres://username:password@localhost:5432/buoy_coordinator
```

Useful starter queries:

```sql
SELECT * FROM buoys;

SELECT * FROM racetracks;

SELECT *
FROM racetrack_marks
ORDER BY racetrack_id, order_index;
```

## Buoy API Examples

List registered buoys and copy a buoy `id` or `name`:

```bash
curl http://localhost:4000/api/buoys
```

Post telemetry from a buoy by UUID:

```bash
curl -X POST http://localhost:4000/api/buoys/BUOY_ID/telemetry \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 37.8062,
    "longitude": -122.4721,
    "heading": 118,
    "batteryLevel": 84,
    "status": "moving",
    "timestamp": "2026-05-23T20:30:00.000Z"
  }'
```

Post telemetry from a buoy by name. URL-encode spaces in names:

```bash
curl -X POST http://localhost:4000/api/buoys/Buoy%2001/telemetry \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 37.8062,
    "longitude": -122.4721,
    "heading": 118,
    "batteryLevel": 84,
    "status": "moving",
    "timestamp": "2026-05-23T20:30:00.000Z"
  }'
```

Post telemetry as CSV. `timestamp` is optional; when omitted, the server stores the current time. CSV can include a header row:

```bash
curl -X POST "http://localhost:4000/api/buoys/Buoy%2001/telemetry?format=csv" \
  -H "Content-Type: text/csv" \
  -H "Accept: text/csv" \
  --data-binary $'latitude,longitude,heading,batteryLevel,status,timestamp\n37.8062,-122.4721,118,84,moving,2026-05-23T20:30:00.000Z'
```

Or send only values in this order:

```text
latitude,longitude,heading,batteryLevel,status,timestamp
```

When omitting `timestamp`, either leave the last value blank or use a header row without `timestamp`:

```bash
curl -X POST "http://localhost:4000/api/buoys/Buoy%2001/telemetry?format=csv" \
  -H "Content-Type: text/csv" \
  -H "Accept: text/csv" \
  --data-binary $'latitude,longitude,heading,batteryLevel,status\n37.8062,-122.4721,118,84,moving'
```

Get the current command for a buoy:

```bash
curl http://localhost:4000/api/buoys/BUOY_ID/command
```

By name:

```bash
curl http://localhost:4000/api/buoys/Buoy%2001/command
```

Get the current command as CSV:

```bash
curl -H "Accept: text/csv" http://localhost:4000/api/buoys/Buoy%2001/command
```

CSV command responses are value-only without a header row. Value order:

command,targetLatitude,targetLongitude,updatedAt

Example:

```csv
MOVE_TO,37.8077,-122.475,2026-05-23T20:30:00.000Z
```

Example command response:

```json
{
  "command": "MOVE_TO",
  "targetLatitude": 37.8077,
  "targetLongitude": -122.475,
  "updatedAt": "2026-05-23T20:30:00.000Z"
}
```

Assign a command from the control server side:

```bash
curl -X POST http://localhost:4000/api/buoys/BUOY_ID/commands \
  -H "Content-Type: application/json" \
  -d '{
    "command": "MOVE_TO",
    "targetLatitude": 37.8077,
    "targetLongitude": -122.475
  }'
```

By name:

```bash
curl -X POST http://localhost:4000/api/buoys/Buoy%2001/commands \
  -H "Content-Type: application/json" \
  -d '{
    "command": "HOLD_POSITION"
  }'
```

Supported buoy statuses:

```text
idle
moving
holding
offline
low_battery
error
```

Supported buoy commands:

```text
MOVE_TO
HOLD_POSITION
RETURN_HOME
STOP
```
