#!/bin/bash
# Deploy to Hetzner VPS
# Usage: ./scripts/deploy-prod.sh

set -e

SERVER_IP="${HETZNER_IP:-188.245.95.100}"
SERVER_USER="${HETZNER_USER:-root}"

echo "🚀 Deploying to Hetzner VPS ($SERVER_IP)..."

# Check if we can SSH
if ! ssh -q -o BatchMode=yes -o ConnectTimeout=5 "$SERVER_USER@$SERVER_IP" exit 2>/dev/null; then
    echo "❌ Cannot connect to $SERVER_IP. Check SSH keys or use password auth."
    exit 1
fi

echo "📦 Building frontend locally..."
bun install
bun run build

echo "📤 Syncing files to VPS..."
# Sync docker-compose, Caddyfile, and dist
rsync -avz --delete \
    docker-compose.prod.yml \
    Caddyfile \
    "$SERVER_USER@$SERVER_IP:/app/liquidcrypto/"

rsync -avz --delete \
    dist/ \
    "$SERVER_USER@$SERVER_IP:/app/liquidcrypto/dist/"

echo "🔄 Restarting services on VPS..."
ssh "$SERVER_USER@$SERVER_IP" << 'REMOTE'
    cd /app/liquidcrypto
    docker compose -f docker-compose.prod.yml pull
    docker compose -f docker-compose.prod.yml up -d
    sleep 5
    docker compose -f docker-compose.prod.yml ps
REMOTE

echo "✅ Deployment complete!"
echo "🌐 Visit: http://$SERVER_IP"
