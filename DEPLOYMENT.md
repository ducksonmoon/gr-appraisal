# Production deployment (Docker on Ubuntu)

## Prerequisites

- DNS A record: `gr.mazust.ac.ir` → server IP
- Docker Engine + Compose plugin on the server
- Ports 80 and 443 open

## First deploy on server

```bash
cd /home/mirshad/university-appraisal
cp .env.example .env
# Edit .env: set AUTH_SECRET (32+ chars) and strong SEED_* passwords
docker compose up -d --build
```

## Environment variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | `file:/data/prod.db` (persisted volume) |
| `AUTH_SECRET` | JWT secret, min 32 characters |
| `SEED_ADMIN_PASSWORD` | Initial admin password |
| `SEED_MANAGER_PASSWORD` | Initial manager password |
| `SEED_VIEWER_PASSWORD` | Initial viewer password |

Default login emails after seed: `admin@localhost`, `manager@localhost`, `viewer@localhost`

## Operations

```bash
docker compose logs -f app
docker compose logs -f caddy
docker compose restart app
docker compose down
docker compose up -d --build
```

Data persists in Docker volume `appraisal-data`.

## Security

- Never commit `.env` to git
- Change SSH password and seed passwords after first login
- Rotate `AUTH_SECRET` only with a planned session logout (invalidates all sessions)
