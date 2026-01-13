#!/bin/bash
#
# Setup a remote host for LiquidContainer execution
#
# Usage:
#   ssh root@your-server.com < scripts/setup-remote-host.sh
#
# Or:
#   scp scripts/setup-remote-host.sh root@your-server.com:/tmp/
#   ssh root@your-server.com /tmp/setup-remote-host.sh
#

set -euo pipefail

# Configuration
DEPLOY_USER="${DEPLOY_USER:-deploy}"
CONTAINER_IMAGE="${CONTAINER_IMAGE:-ghcr.io/liquidcrypto/liquid-container:latest}"
MAX_CONTAINERS="${MAX_CONTAINERS:-20}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[SETUP]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Check if running as root
if [ "$(id -u)" -ne 0 ]; then
    error "This script must be run as root"
fi

log "Starting LiquidContainer remote host setup..."

# ============================================================================
# Install Docker
# ============================================================================

if command -v docker &> /dev/null; then
    log "Docker already installed: $(docker --version)"
else
    log "Installing Docker..."

    # Install Docker using official script
    curl -fsSL https://get.docker.com | sh

    # Enable and start Docker
    systemctl enable docker
    systemctl start docker

    log "Docker installed: $(docker --version)"
fi

# ============================================================================
# Create deploy user
# ============================================================================

if id "$DEPLOY_USER" &>/dev/null; then
    log "User $DEPLOY_USER already exists"
else
    log "Creating user: $DEPLOY_USER"

    useradd -m -s /bin/bash "$DEPLOY_USER"

    # Add to docker group
    usermod -aG docker "$DEPLOY_USER"
fi

# ============================================================================
# Configure SSH
# ============================================================================

log "Configuring SSH for $DEPLOY_USER..."

DEPLOY_HOME="/home/$DEPLOY_USER"
SSH_DIR="$DEPLOY_HOME/.ssh"

mkdir -p "$SSH_DIR"
chmod 700 "$SSH_DIR"

# Create authorized_keys if doesn't exist
touch "$SSH_DIR/authorized_keys"
chmod 600 "$SSH_DIR/authorized_keys"
chown -R "$DEPLOY_USER:$DEPLOY_USER" "$SSH_DIR"

echo ""
echo "=========================================="
echo "ADD YOUR PUBLIC KEY TO:"
echo "$SSH_DIR/authorized_keys"
echo "=========================================="
echo ""

# ============================================================================
# Configure Docker daemon
# ============================================================================

log "Configuring Docker daemon..."

mkdir -p /etc/docker

cat > /etc/docker/daemon.json <<EOF
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2",
  "live-restore": true,
  "default-ulimits": {
    "nofile": {
      "Name": "nofile",
      "Hard": 65536,
      "Soft": 65536
    }
  },
  "default-shm-size": "64M"
}
EOF

systemctl restart docker

# ============================================================================
# Pull container image
# ============================================================================

log "Pulling container image: $CONTAINER_IMAGE"

docker pull "$CONTAINER_IMAGE" || warn "Failed to pull image (might need authentication)"

# ============================================================================
# Configure system limits
# ============================================================================

log "Configuring system limits..."

# Increase file descriptors
cat >> /etc/security/limits.conf <<EOF

# LiquidContainer limits
$DEPLOY_USER soft nofile 65536
$DEPLOY_USER hard nofile 65536
$DEPLOY_USER soft nproc 32768
$DEPLOY_USER hard nproc 32768
EOF

# Increase inotify watchers
echo "fs.inotify.max_user_watches = 524288" >> /etc/sysctl.conf
echo "fs.inotify.max_user_instances = 512" >> /etc/sysctl.conf
sysctl -p || true

# ============================================================================
# Create cleanup cron job
# ============================================================================

log "Setting up cleanup cron job..."

cat > /etc/cron.daily/liquid-container-cleanup <<EOF
#!/bin/bash
# Cleanup old LiquidContainer resources

# Remove stopped containers older than 1 hour
docker container prune -f --filter "label=liquid.container=true" --filter "until=1h"

# Remove unused images older than 24 hours
docker image prune -f --filter "until=24h"

# Remove unused volumes
docker volume prune -f
EOF

chmod +x /etc/cron.daily/liquid-container-cleanup

# ============================================================================
# Create monitoring script
# ============================================================================

log "Creating monitoring script..."

cat > /usr/local/bin/liquid-container-status <<EOF
#!/bin/bash
# Show LiquidContainer status

echo "=== Docker Status ==="
systemctl status docker --no-pager | head -5

echo ""
echo "=== Container Stats ==="
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" | head -20

echo ""
echo "=== Active Containers ==="
docker ps --filter "label=liquid.container=true" --format "table {{.ID}}\t{{.Image}}\t{{.Status}}\t{{.Names}}"

echo ""
echo "=== Resource Usage ==="
echo "Containers: \$(docker ps -q --filter 'label=liquid.container=true' | wc -l) / $MAX_CONTAINERS"
echo "Disk: \$(df -h / | tail -1 | awk '{print \$5}')"
echo "Memory: \$(free -h | grep Mem | awk '{print \$3 "/" \$2}')"
EOF

chmod +x /usr/local/bin/liquid-container-status

# ============================================================================
# Summary
# ============================================================================

echo ""
echo "=========================================="
log "Setup complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Add your SSH public key:"
echo "   echo 'YOUR_PUBLIC_KEY' >> $SSH_DIR/authorized_keys"
echo ""
echo "2. Test SSH connection:"
echo "   ssh $DEPLOY_USER@\$(hostname -I | awk '{print \$1}')"
echo ""
echo "3. Configure endpoint in LiquidCrypto:"
echo "   {"
echo "     \"id\": \"$(hostname)\","
echo "     \"url\": \"ssh://$DEPLOY_USER@$(hostname -I | awk '{print $1}')\","
echo "     \"maxContainers\": $MAX_CONTAINERS,"
echo "     \"weight\": 1"
echo "   }"
echo ""
echo "4. Check status anytime:"
echo "   liquid-container-status"
echo ""
