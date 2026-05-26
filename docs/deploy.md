# Deployment Guide

## Overview

The production setup is intentionally simple and low-cost:

```text
Domain -> Elastic IP -> EC2 -> Caddy -> Frontend / Backend -> Postgres -> EBS
```

It uses one AWS EC2 instance running Docker Compose. The instance can be stopped when not needed to reduce compute cost. The database persists on an attached EBS volume.

![Deployment architecture](images/deployment-architecture.png)

## Main Tools

### Terraform

Terraform creates AWS infrastructure:

- EC2 instance
- Security group
- Elastic IP
- EBS data volume
- EBS attachment
- startup bootstrap script

Files:

```text
infra/terraform/
```

### Docker Compose

Docker Compose runs the production app on the EC2 host:

- `web`: Caddy + built frontend
- `backend`: Node/Express API
- `postgres`: Postgres database

File:

```text
deploy/compose.prod.yml
```

### Caddy

Caddy serves the frontend, terminates HTTPS, and proxies API traffic.

File:

```text
deploy/Caddyfile
```

Routes:

- `/` -> static frontend
- `/api/*` -> backend
- `/ws` -> backend WebSocket

### Production Env

`deploy/prod.env` contains production configuration and secrets. This file is ignored by git.

It contains:

- domain name
- EC2 host
- AWS region
- instance ID
- Postgres password
- public frontend/backend URLs

### Deployment Scripts

Scripts live in:

```text
scripts/
```

They automate provisioning, deploys, migrations, backups, and start/stop.

## 1. Provision AWS

Copy the Terraform example:

```bash
cp infra/terraform/terraform.tfvars.example infra/terraform/terraform.tfvars
```

Edit:

```hcl
aws_region          = "us-west-2"
project_name        = "buoy-coordinator"
instance_type       = "t3.micro"
key_name            = "your-existing-ec2-keypair"
ssh_ingress_cidr    = "your.public.ip.address/32"
root_volume_size_gb = 30
```

Then run:

```bash
./scripts/provision.sh
```

This runs:

```bash
terraform init
terraform apply
```

Terraform creates the EC2 instance and prints outputs:

```text
public_ip
instance_id
ssh_command
```

Save those values.

## 2. Configure DNS

Create an `A` record for your domain:

```text
buoy.oesterer.com -> EC2 Elastic IP
```

The Elastic IP should remain stable across stop/start cycles.

Verify DNS:

```bash
dig +short buoy.oesterer.com
```

It should return your EC2 public IP.

## 3. Configure SSH

Your `.pem` key stays outside the repo, for example:

```text
~/.ssh/buoy-coordinator.pem
```

Set permissions:

```bash
chmod 600 ~/.ssh/buoy-coordinator.pem
```

Add an SSH alias:

```sshconfig
Host buoy-prod
  HostName YOUR_EC2_PUBLIC_IP
  User ec2-user
  IdentityFile ~/.ssh/buoy-coordinator.pem
  IdentitiesOnly yes
```

Test:

```bash
ssh buoy-prod
```

## 4. Configure Production Env

Copy:

```bash
cp deploy/prod.env.example deploy/prod.env
```

Edit:

```bash
APP_DOMAIN=buoy.oesterer.com
ACME_EMAIL=andreas@oesterer.com

PROD_HOST=buoy-prod
SSH_USER=ec2-user
REMOTE_APP_DIR=/opt/buoy_coordinator
AWS_REGION=us-west-2
INSTANCE_ID=i-xxxxxxxxxxxxxxxxx

POSTGRES_DB=buoy_coordinator
POSTGRES_USER=buoy
POSTGRES_PASSWORD=long-random-password
POSTGRES_DATA_DIR=/opt/buoy-data/postgres

PUBLIC_ORIGIN=https://buoy.oesterer.com
PUBLIC_WS_ORIGIN=wss://buoy.oesterer.com/ws
```

This file is ignored by git because it contains secrets.

## 5. Bootstrap The Host

If Docker Compose is missing on EC2, run:

```bash
./scripts/bootstrap-prod-host.sh
```

This SSHes into the host and ensures:

- Docker is installed
- Docker is running
- Docker Compose v2 plugin exists
- app directory exists
- Postgres data directory exists
- Postgres data directory has correct container ownership

Verify:

```bash
ssh buoy-prod "docker compose version"
```

## 6. Deploy App

Run:

```bash
./scripts/deploy.sh
```

This does:

1. Runs local typecheck:

```bash
npm run typecheck
```

2. Runs local build:

```bash
npm run build
```

3. Bootstraps the remote EC2 host.

4. Uploads the repo to:

```text
/opt/buoy_coordinator
```

using `rsync`.

5. Builds Docker images on the EC2 host.

6. Starts Postgres.

7. Waits for Postgres with `pg_isready`.

8. Runs SQL migrations.

9. Starts all services.

## What Runs In Production

### `web` Container

- built from `deploy/frontend.Dockerfile`
- uses Caddy
- serves files from frontend build
- listens on ports `80` and `443`

### `backend` Container

- built from `deploy/backend.Dockerfile`
- runs Express server on port `4000`
- not directly public
- reachable through Caddy

### `postgres` Container

- uses `postgres:16-alpine`
- stores data in:

```text
/opt/buoy-data/postgres
```

on the EBS volume.

## 7. HTTPS Certificate

Caddy handles HTTPS automatically.

It uses:

```caddyfile
acme_ca https://acme-v02.api.letsencrypt.org/directory
```

Caddy needs:

- DNS pointing to the EC2 IP
- port `80` open
- port `443` open

Check logs:

```bash
ssh buoy-prod
cd /opt/buoy_coordinator
docker compose --env-file deploy/prod.env -f deploy/compose.prod.yml logs -f web
```

## 8. Stop To Reduce Cost

Run:

```bash
./scripts/stop-prod.sh
```

This:

- stops Docker services
- stops the EC2 instance

You still pay for:

- EBS volume
- Elastic IP depending on AWS pricing rules/state
- snapshots if you create them

## 9. Start Later

Run:

```bash
./scripts/start-prod.sh
```

This:

- starts the EC2 instance
- waits for SSH
- bootstraps host if needed
- starts Docker Compose services

The Elastic IP should stay the same.

## 10. Backups

Create backup:

```bash
./scripts/backup-db.sh
```

This creates:

```text
backups/buoy_coordinator-YYYYMMDD-HHMMSS.sql.gz
```

Restore:

```bash
./scripts/restore-db.sh backups/buoy_coordinator-YYYYMMDD-HHMMSS.sql.gz
```

## Security Notes

Currently:

- HTTPS is public
- frontend is public
- `/api/*` is public
- `/ws` is public
- no authentication is enabled

SSH is restricted by:

```hcl
ssh_ingress_cidr
```

HTTP/HTTPS are controlled by:

```hcl
allowed_http_cidrs
```

Default is:

```hcl
allowed_http_cidrs = ["0.0.0.0/0"]
```

That means anyone can reach the app and API. The next practical hardening step would be an API key or login.
