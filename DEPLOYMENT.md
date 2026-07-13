# Production deployment (Docker on Ubuntu)

## Prerequisites

- DNS A record: `gr.mazust.ac.ir` → server IP
- Docker Engine + Compose plugin on the server
- Ports 80 and 443 open

## First deploy on server

```bash
cd /home/mirshad/university-appraisal
git clone https://github.com/ducksonmoon/gr-appraisal.git .
cp .env.example .env
# Edit .env: set AUTH_SECRET (32+ chars) and strong SEED_* passwords
docker compose up -d --build
```

## Iran / restricted network

If `docker pull` fails with 403, configure US DNS and a registry mirror on the server:

```bash
sudo tee /etc/systemd/resolved.conf.d/us-dns.conf <<'EOF'
[Resolve]
DNS=8.8.8.8 1.1.1.1 8.8.4.4
EOF
sudo systemctl restart systemd-resolved

sudo tee /etc/docker/daemon.json <<'EOF'
{
  "dns": ["8.8.8.8", "1.1.1.1"],
  "registry-mirrors": [
    "https://docker.arvancloud.ir",
    "https://registry.docker.ir"
  ]
}
EOF
sudo systemctl restart docker
```

### Let's Encrypt / HTTPS

UFW on the VM must allow 80/443 (already configured in deploy). If ACME still times out, also open **inbound TCP 80 and 443** in the **hosting/provider panel** (outside the VM). Until that works, the shipped `Caddyfile` serves HTTP so the app remains reachable.

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
