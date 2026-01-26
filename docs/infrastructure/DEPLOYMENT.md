# LiquidCrypto Production Deployment Guide

> Comprehensive documentation for deploying, operating, and migrating the LiquidCrypto platform.

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Production Stack](#production-stack)
3. [CI/CD Pipeline](#cicd-pipeline)
4. [Deployment Flow](#deployment-flow)
5. [Server Directory Structure](#server-directory-structure)
6. [Environment Variables](#environment-variables)
7. [Folders Not Deployed](#folders-not-deployed-to-production)
8. [Migration Guide: New Server Setup](#migration-guide-new-server-setup)
9. [Operations & Maintenance](#operations--maintenance)
10. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

```mermaid
flowchart TB
    subgraph Internet
        User[User Browser]
        DNS[DNS: liquid-os.app]
    end
    
    subgraph Hetzner VPS["Hetzner VPS (188.245.95.100)"]
        subgraph Docker["Docker Network: liquid-network"]
            Caddy[Caddy :80/:443<br/>Reverse Proxy + SSL]
            
            subgraph Backends["Blue-Green Backends"]
                Blue[backend-blue:3000]
                Green[backend-green:3000]
            end
            
            PG[(PostgreSQL:5432)]
            Redis[(Redis:6379)]
        end
        
        FrontendFiles[Static Files<br/>/app/liquidcrypto/dist]
    end
    
    subgraph GitHub
        Repo[marioberlin/liquid-glass-ui]
        Actions[GitHub Actions]
        GHCR[GitHub Container Registry]
    end
    
    User --> DNS --> Caddy
    Caddy --> FrontendFiles
    Caddy --> Blue
    Caddy --> Green
    Blue --> PG
    Blue --> Redis
    Green --> PG
    Green --> Redis
    
    Repo --> Actions
    Actions --> GHCR
    Actions -->|SSH Deploy| Caddy
```

### Key Components

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Frontend** | React + Vite | SPA served as static files from `/srv` |
| **Backend** | Bun + Elysia | API server with health-based routing |
| **Database** | PostgreSQL 16 | Persistent data storage |
| **Cache** | Redis 7 | Session cache, pub/sub |
| **Messaging** | NATS 2.10 | A2A agents, work queues, real-time events |
| **Reverse Proxy** | Caddy 2 | SSL termination, load balancing, static file serving |
| **CI/CD** | GitHub Actions | Automated build and deploy |
| **Container Registry** | GHCR | Docker image storage |

---

## Production Stack

### Docker Services (docker-compose.prod.yml)

```yaml
services:
  backend-blue     # Primary backend instance
  backend-green    # Secondary backend (for zero-downtime deploys)
  postgres         # PostgreSQL 16-alpine
  redis            # Redis 7-alpine
  nats             # NATS 2.10-alpine (JetStream messaging)
  caddy            # Caddy 2-alpine (SSL + reverse proxy)
```

### Blue-Green Deployment

The platform uses **blue-green deployment** for zero-downtime releases:

1. **Active backend** serves live traffic (tracked in `/app/liquidcrypto/active-backend`)
2. **Inactive backend** receives new deployment
3. After health checks pass, traffic switches instantly
4. Previous version remains running for instant rollback

```
┌─────────────────────────────────────────────────────┐
│                    Caddy                            │
│  ┌─────────────┐         ┌─────────────┐           │
│  │ backend-blue│ ◄─────► │backend-green│           │
│  │  (active)   │         │ (standby)   │           │
│  └─────────────┘         └─────────────┘           │
└─────────────────────────────────────────────────────┘
         │                        │
         └───────┬────────────────┘
                 ▼
    ┌────────────────────────┐
    │    PostgreSQL + Redis   │
    └────────────────────────┘
```

---

## CI/CD Pipeline

### Workflow: `.github/workflows/deploy-hetzner.yml`

```mermaid
flowchart LR
    subgraph Trigger
        Push[Push to main]
        Manual[Manual Dispatch]
    end
    
    subgraph Build["Build Job"]
        Checkout[Checkout Code]
        BuildBackend[Build Backend Docker Image]
        PushGHCR[Push to GHCR]
        BuildFrontend[Build Frontend with VITE_* env]
        UploadArtifact[Upload dist/]
    end
    
    subgraph Deploy["Deploy Job"]
        DownloadArtifact[Download dist/]
        SyncConfig[SCP: docker-compose, Caddyfile, scripts]
        SyncFrontend[SCP: dist/* → /srv]
        SSHDeploy[SSH: Run blue-green-deploy.sh]
        VerifyHealth[Health Check]
    end
    
    Push --> Build
    Manual --> Build
    Build --> Deploy
    Checkout --> BuildBackend --> PushGHCR --> BuildFrontend --> UploadArtifact
    DownloadArtifact --> SyncConfig --> SyncFrontend --> SSHDeploy --> VerifyHealth
```

### GitHub Secrets Required

| Secret | Description |
|--------|-------------|
| `HETZNER_HOST` | VPS IP address (`188.245.95.100`) |
| `HETZNER_SSH_KEY` | SSH private key for root access |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `VITE_GOOGLE_API_KEY` | Google API key |
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps API key |
| `VITE_GOOGLE_PLACES_API_KEY` | Google Places API key |
| `VITE_GOOGLE_MASTER_TEMPLATE_ID` | Google Sheets template ID |

---

## Deployment Flow

### Automatic Deployment (Push to main)

1. **Build Phase** (GitHub Actions runner):
   - Build Docker image from `server/Dockerfile`
   - Push image to `ghcr.io/marioberlin/liquidcrypto-backend:SHA`
   - Build frontend with `bun run build` (VITE_* secrets injected)
   - Upload `dist/` as artifact

2. **Deploy Phase**:
   - Download frontend artifact
   - SCP files to VPS:
     - `docker-compose.prod.yml`
     - `Caddyfile`
     - `scripts/blue-green-deploy.sh`
     - `dist/*` → `/app/liquidcrypto/dist/`
   - SSH: Execute `blue-green-deploy.sh`

3. **Blue-Green Switch**:
   - Determine inactive backend (blue or green)
   - Pull new Docker image
   - Restart inactive backend with new image
   - Wait for health check (`/health` endpoint)
   - Switch `active-backend` file
   - Reload Caddy configuration

### Manual Rollback

```bash
# Via GitHub Actions UI:
# Go to Actions → Deploy to Hetzner → Run workflow → Check "Rollback"

# Or via SSH:
ssh root@188.245.95.100
cd /app/liquidcrypto
./scripts/blue-green-deploy.sh rollback
```

---

## Server Directory Structure

### Production Server (`/app/liquidcrypto/`)

| Path | Size | Purpose | Deployed by CI? |
|------|------|---------|-----------------|
| `active-backend` | 5B | Blue/green state file | Modified by script |
| `Caddyfile` | 2KB | Caddy reverse proxy config | ✅ Yes |
| `docker-compose.prod.yml` | 3KB | Docker stack definition | ✅ Yes |
| `dist/` | 179MB | Frontend static files | ✅ Yes |
| `scripts/` | 16KB | Deployment scripts | ✅ Yes |
| `.env.production` | 3KB | Environment variables | ❌ Manual (secrets) |
| `server/` | 53MB | Backend source (legacy) | ❌ No (uses Docker) |
| `packages/` | 2MB | Shared packages (legacy) | ❌ No (uses Docker) |
| `public/` | 49MB | Public assets | ❌ Not synced |
| `node_modules/` | 184KB | Dependencies (legacy) | ❌ No (uses Docker) |

### Docker Volumes (Persistent Data)

| Volume | Mount Point | Purpose |
|--------|-------------|---------|
| `pgdata` | `/var/lib/postgresql/data` | PostgreSQL database |
| `redisdata` | `/data` | Redis persistence |
| `caddy_data` | `/data` | SSL certificates |
| `caddy_config` | `/config` | Caddy state |

---

## Environment Variables

### `.env.production` on Server

```bash
# API Keys
GEMINI_API_KEY=AIzaSy...
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-proj-...

# Google Service Account (for Smart Sheets)
GOOGLE_SERVICE_ACCOUNT_EMAIL=...@iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."
GOOGLE_MASTER_TEMPLATE_ID=1XjNGCjk2...

# CORS (for production domain)
ALLOWED_ORIGINS=https://liquid-os.app,https://www.liquid-os.app

# Frontend Build (must also be in GitHub Secrets)
VITE_GOOGLE_CLIENT_ID=754718948116-...
VITE_GOOGLE_API_KEY=AIzaSyD6...
VITE_GOOGLE_MAPS_API_KEY=AIzaSyCvkF3g4...
VITE_GOOGLE_PLACES_API_KEY=AIzaSyCvkF3g4...

# Database
DATABASE_URL=postgresql://liquidcrypto:liquidcrypto_prod@postgres:5432/liquidcrypto
REDIS_URL=redis://redis:6379

# Binance Testnet
BINANCE_TESTNET=true
BINANCE_API_KEY=...
BINANCE_SECRET_KEY=...
```

> [!IMPORTANT]
> `VITE_*` variables are baked into the frontend at build time. They must be set as GitHub Secrets, not just on the server.

---

## Folders Not Deployed to Production

The following folders exist locally but are **NOT** synced to production:

| Folder | Reason |
|--------|--------|
| `src/` | Frontend source (compiled to `dist/`) |
| `tests/` | Test files (not needed in prod) |
| `coverage/` | Test coverage reports |
| `.storybook/` | Storybook config |
| `.github/` | CI/CD config (used by Actions) |
| `docs/` | Documentation (only small subset on server) |
| `skills/` | AI agent skills |
| `directives/` | AI agent directives |
| `archive/` | Archived code |
| `bot/` | Bot-specific code |
| `iOS/` | iOS app files |
| `.claude/`, `.agent/` | IDE/agent config |
| `.tmp/`, `.healing/` | Temporary files |
| `node_modules/` | Dev dependencies (Docker has its own) |

### Files Synced by CI/CD

```
docker-compose.prod.yml   → /app/liquidcrypto/
Caddyfile                 → /app/liquidcrypto/
scripts/blue-green-deploy.sh → /app/liquidcrypto/scripts/
dist/*                    → /app/liquidcrypto/dist/
```

---

## Migration Guide: New Server Setup

### Prerequisites

- Hetzner VPS (or similar) with:
  - Ubuntu 22.04+ or Debian 12+
  - 2+ vCPUs, 4GB+ RAM
  - 40GB+ storage
  - Public IPv4 address
- Domain pointed to new server (A record)
- SSH access as root

### Step 1: Initial Server Setup

```bash
# SSH into new server
ssh root@NEW_SERVER_IP

# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh

# Install Docker Compose plugin
apt install docker-compose-plugin -y

# Verify
docker --version
docker compose version
```

### Step 2: Create Application Directory

```bash
mkdir -p /app/liquidcrypto
cd /app/liquidcrypto
```

### Step 3: Copy Configuration Files

From your local machine:

```bash
# Copy essential files
scp docker-compose.prod.yml root@NEW_SERVER_IP:/app/liquidcrypto/
scp Caddyfile root@NEW_SERVER_IP:/app/liquidcrypto/
scp -r scripts root@NEW_SERVER_IP:/app/liquidcrypto/
```

### Step 4: Create Environment File

```bash
ssh root@NEW_SERVER_IP
cd /app/liquidcrypto

# Create .env.production with all secrets
nano .env.production
# (paste all environment variables)
```

### Step 5: Initialize Database Schema

```bash
# Copy SQL migrations
scp -r server/sql root@NEW_SERVER_IP:/app/liquidcrypto/server/

# Or run after starting PostgreSQL
```

### Step 6: Update Domain in Caddyfile

```bash
# Edit Caddyfile to use your domain
nano /app/liquidcrypto/Caddyfile

# Change first line:
# your-domain.com, www.your-domain.com {
```

### Step 7: Login to GitHub Container Registry

```bash
# Generate a Personal Access Token with packages:read scope
# https://github.com/settings/tokens

echo "YOUR_GITHUB_PAT" | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

### Step 8: Pull Images and Start Services

```bash
cd /app/liquidcrypto

# Pull backend image
docker pull ghcr.io/marioberlin/liquidcrypto-backend:latest

# Start all services
docker compose -f docker-compose.prod.yml up -d

# Check status
docker ps -a
docker logs liquidcrypto-caddy
```

### Step 9: Deploy Frontend

```bash
# Build frontend locally
bun run build

# Copy to server
scp -r dist/* root@NEW_SERVER_IP:/app/liquidcrypto/dist/
```

### Step 10: Update GitHub Secrets

Go to your repo → Settings → Secrets → Actions:

| Secret | New Value |
|--------|-----------|
| `HETZNER_HOST` | `NEW_SERVER_IP` |
| `HETZNER_SSH_KEY` | New SSH private key |

### Step 11: Update DNS

Update A records for your domain:
- `@` → `NEW_SERVER_IP`
- `www` → `NEW_SERVER_IP`

Wait for DNS propagation (5-30 minutes).

### Step 12: Verify Deployment

```bash
# Check health
curl -I https://your-domain.com/health

# Check SSL certificate
curl -vI https://your-domain.com 2>&1 | grep "SSL certificate"
```

---

## Operations & Maintenance

### View Container Logs

```bash
ssh root@188.245.95.100
docker logs -f liquidcrypto-backend-blue
docker logs -f liquidcrypto-caddy
docker logs -f liquidcrypto-postgres
```

### Restart Services

```bash
cd /app/liquidcrypto
docker compose -f docker-compose.prod.yml restart
```

### Database Backup

```bash
# Backup
docker exec liquidcrypto-postgres pg_dump -U liquidcrypto liquidcrypto > backup.sql

# Restore
cat backup.sql | docker exec -i liquidcrypto-postgres psql -U liquidcrypto liquidcrypto
```

### Check Active Backend

```bash
cat /app/liquidcrypto/active-backend
# Output: "blue" or "green"
```

### Force Switch Backend

```bash
echo "green" > /app/liquidcrypto/active-backend
docker exec liquidcrypto-caddy caddy reload --config /etc/caddy/Caddyfile
```

### Update SSL Certificate (Auto-Managed)

Caddy automatically manages SSL certificates via Let's Encrypt. Certificates auto-renew 30 days before expiration.

To force renewal:
```bash
docker exec liquidcrypto-caddy caddy reload --config /etc/caddy/Caddyfile
```

---

## Troubleshooting

### Health Check Failing

```bash
# Check backend logs
docker logs liquidcrypto-backend-blue --tail 100

# Check if backend is responding
docker exec liquidcrypto-backend-blue wget -qO- http://localhost:3000/health

# Check container health status
docker inspect liquidcrypto-backend-blue --format='{{.State.Health.Status}}'
```

### SSL Certificate Issues

```bash
# View Caddy logs
docker logs liquidcrypto-caddy --tail 100

# Check certificate status
docker exec liquidcrypto-caddy caddy trust

# Verify DNS is pointing to server
dig liquid-os.app +short
```

### Database Connection Issues

```bash
# Check PostgreSQL logs
docker logs liquidcrypto-postgres --tail 100

# Verify database is healthy
docker exec liquidcrypto-postgres pg_isready -U liquidcrypto -d liquidcrypto

# Check connection from backend
docker exec liquidcrypto-backend-blue wget -qO- http://localhost:3000/health
```

### CORS Errors

1. Verify `ALLOWED_ORIGINS` in `.env.production`
2. Restart backends:
   ```bash
   docker compose -f docker-compose.prod.yml restart backend-blue backend-green
   ```

### VITE_* Variables Not Working

These are baked at build time. To fix:
1. Ensure GitHub Secrets are set
2. Trigger a new deployment (push to main or empty commit)

```bash
git commit --allow-empty -m "chore: Rebuild frontend"
git push origin main
```

---

## Quick Reference

### URLs

| Environment | URL |
|-------------|-----|
| Production | https://liquid-os.app |
| Health Check | https://liquid-os.app/health |
| API | https://liquid-os.app/api/v1 |
| GitHub Actions | https://github.com/marioberlin/liquid-glass-ui/actions |
| Container Registry | https://ghcr.io/marioberlin/liquidcrypto-backend |

### SSH Access

```bash
ssh root@188.245.95.100
cd /app/liquidcrypto
```

### Common Commands

```bash
# View all containers
docker ps -a | grep liquidcrypto

# Restart everything
docker compose -f docker-compose.prod.yml restart

# Pull latest and redeploy
docker pull ghcr.io/marioberlin/liquidcrypto-backend:latest
./scripts/blue-green-deploy.sh latest

# Rollback
./scripts/blue-green-deploy.sh rollback

# View logs (follow)
docker logs -f liquidcrypto-backend-blue
```
