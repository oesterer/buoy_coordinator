# Production Deployment Runbook

This deployment runs the app on one AWS EC2 instance using Docker Compose.

![Deployment architecture](images/deployment-architecture.png)

## Prerequisites

- AWS CLI configured locally
- Terraform installed locally
- An existing EC2 key pair
- A DNS name you can point at the EC2 Elastic IP
- Docker installed locally only if you want to test production Compose builds before deploy

## 1. Provision AWS

```bash
cp infra/terraform/terraform.tfvars.example infra/terraform/terraform.tfvars
```

Edit:

```hcl
aws_region       = "us-west-2"
project_name     = "buoy-coordinator"
instance_type    = "t3.micro"
key_name         = "your-existing-ec2-keypair"
ssh_ingress_cidr = "your.public.ip.address/32"
```

Apply:

```bash
./scripts/provision.sh
```

Save the Terraform outputs:

- `public_ip`
- `instance_id`
- `ssh_command`

Point your DNS `A` record to `public_ip`.

## 2. Configure Production Env

```bash
cp deploy/prod.env.example deploy/prod.env
```

Edit:

```bash
APP_DOMAIN=buoys.example.com
ACME_EMAIL=admin@example.com
PROD_HOST=203.0.113.20
SSH_USER=ec2-user
REMOTE_APP_DIR=/opt/buoy_coordinator
AWS_REGION=us-west-2
INSTANCE_ID=i-xxxxxxxxxxxxxxxxx
POSTGRES_PASSWORD=long-random-password
PUBLIC_ORIGIN=https://buoys.example.com
PUBLIC_WS_ORIGIN=wss://buoys.example.com/ws
```

`deploy/prod.env` is ignored by git.

## 3. Deploy

```bash
./scripts/deploy.sh
```

The deploy script:

1. Runs local typecheck and build.
2. Bootstraps Docker and Docker Compose on the EC2 host.
3. Uploads the repo to `/opt/buoy_coordinator`.
4. Builds production containers on the EC2 host.
5. Starts Postgres.
6. Applies SQL migrations using `schema_migrations`.
7. Starts backend and Caddy.

If a host already exists but `docker compose` is missing or too old, repair it with:

```bash
./scripts/bootstrap-prod-host.sh
```

## 4. Start And Stop To Control Cost

Stop services and EC2:

```bash
./scripts/stop-prod.sh
```

Start EC2 and services:

```bash
./scripts/start-prod.sh
```

You still pay for EBS storage and Elastic IP conditions even when the instance is stopped.

## 5. Backups

Create a compressed SQL backup:

```bash
./scripts/backup-db.sh
```

Restore:

```bash
./scripts/restore-db.sh backups/buoy_coordinator-YYYYMMDD-HHMMSS.sql.gz
```

## 6. GitHub Actions Deployment

The workflow in `.github/workflows/deploy.yml` can deploy from `main` or `workflow_dispatch`.

Required repository secrets:

```text
PROD_HOST
PROD_SSH_KEY
APP_DOMAIN
ACME_EMAIL
POSTGRES_PASSWORD
```

`PROD_SSH_KEY` should be the private key for the EC2 key pair or another deploy key accepted by the instance.

Terraform is intentionally not run by the GitHub workflow. Provision infrastructure manually first, then use the workflow for app deployments.
