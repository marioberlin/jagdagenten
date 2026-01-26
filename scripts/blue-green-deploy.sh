#!/bin/bash
# Blue-Green Deployment Script for LiquidCrypto
# Usage: ./blue-green-deploy.sh [IMAGE_TAG]
#
# This script:
# 1. Determines which backend (blue/green) is currently active
# 2. Updates the inactive backend with the new image
# 3. Waits for health checks to pass
# 4. Switches traffic to the new backend
# 5. Keeps the old backend running for instant rollback

set -e

DEPLOY_DIR="/app/liquidcrypto"
IMAGE_TAG="${1:-latest}"
BACKEND_IMAGE="ghcr.io/marioberlin/liquidcrypto-backend:${IMAGE_TAG}"
VIDEO_IMAGE="ghcr.io/marioberlin/liquidcrypto-video:${IMAGE_TAG}"
ACTIVE_BACKEND_FILE="${DEPLOY_DIR}/active-backend"
COMPOSE_FILE="${DEPLOY_DIR}/docker-compose.prod.yml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() { echo -e "${BLUE}[DEPLOY]${NC} $1"; }
success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# Determine current active backend
get_active_backend() {
    if [[ -f "$ACTIVE_BACKEND_FILE" ]]; then
        cat "$ACTIVE_BACKEND_FILE"
    else
        echo "blue"  # Default to blue if no file exists
    fi
}

# Get the inactive backend
get_inactive_backend() {
    local active=$(get_active_backend)
    if [[ "$active" == "blue" ]]; then
        echo "green"
    else
        echo "blue"
    fi
}

# Wait for backend to be healthy
wait_for_health() {
    local backend=$1
    local port=$2
    local max_attempts=45
    local attempt=1

    log "Waiting for backend-${backend} to be healthy..."

    # Give container time to initialize
    log "Waiting 10s for container startup..."
    sleep 10

    while [[ $attempt -le $max_attempts ]]; do
        # Check if container is running first
        if ! docker ps --filter "name=liquidcrypto-backend-${backend}" --filter "status=running" | grep -q "liquidcrypto-backend-${backend}"; then
            warn "Container not running, checking logs..."
            docker logs --tail 30 "liquidcrypto-backend-${backend}" 2>&1 || true
            error "backend-${backend} container stopped unexpectedly"
        fi

        # Use curl (installed in Dockerfile) instead of wget
        if docker exec "liquidcrypto-backend-${backend}" curl -sf "http://localhost:${port}/health" >/dev/null 2>&1; then
            success "backend-${backend} is healthy!"
            return 0
        fi

        echo -n "."
        sleep 2
        ((attempt++))
    done

    # Show logs before failing
    warn "Health check failed. Last 50 lines of container logs:"
    docker logs --tail 50 "liquidcrypto-backend-${backend}" 2>&1 || true
    error "backend-${backend} failed to become healthy after ${max_attempts} attempts"
}

# Main deployment logic
main() {
    cd "$DEPLOY_DIR"
    
    log "========================================="
    log "LiquidCrypto Blue-Green Deployment"
    log "========================================="
    log "Backend Image: ${BACKEND_IMAGE}"
    log "Video Image: ${VIDEO_IMAGE}"

    # Determine active and target backends
    ACTIVE=$(get_active_backend)
    TARGET=$(get_inactive_backend)

    # Both backends use port 3000 inside their containers
    TARGET_PORT=3000

    log "Current active: ${ACTIVE}"
    log "Deploy target:  ${TARGET} (port ${TARGET_PORT})"
    
    # Pull the new images
    log "Pulling backend image..."
    docker pull "$BACKEND_IMAGE"

    log "Pulling video image..."
    docker pull "$VIDEO_IMAGE" || warn "Video image not found, skipping..."
    
    # Update the target backend with the new image
    log "Updating backend-${TARGET} with new image..."
    
    if [[ "$TARGET" == "blue" ]]; then
        export BLUE_VERSION="${IMAGE_TAG}"
        export GREEN_VERSION="${IMAGE_TAG}"
    else
        export BLUE_VERSION="${IMAGE_TAG}"
        export GREEN_VERSION="${IMAGE_TAG}"
    fi
    export VIDEO_VERSION="${IMAGE_TAG}"
    
    # Stop and recreate the target backend
    log "Recreating backend-${TARGET}..."
    docker compose -f "$COMPOSE_FILE" stop "backend-${TARGET}" 2>/dev/null || true
    docker compose -f "$COMPOSE_FILE" rm -f "backend-${TARGET}" 2>/dev/null || true
    docker compose -f "$COMPOSE_FILE" up -d "backend-${TARGET}"

    # Start/update video-runtime service
    log "Starting video-runtime service..."
    docker compose -f "$COMPOSE_FILE" up -d video-runtime 2>/dev/null || warn "Video runtime not available"
    
    # Wait for health
    wait_for_health "$TARGET" "$TARGET_PORT"
    
    # Switch active backend
    log "Switching traffic to backend-${TARGET}..."
    echo "$TARGET" > "$ACTIVE_BACKEND_FILE"
    
    # Reload Caddy to pick up the change
    docker exec liquidcrypto-caddy caddy reload --config /etc/caddy/Caddyfile 2>/dev/null || \
        docker compose -f "$COMPOSE_FILE" restart caddy
    
    success "========================================="
    success "Deployment Complete!"
    success "========================================="
    success "Active backend: ${TARGET}"
    success "Standby backend: ${ACTIVE} (ready for rollback)"
    
    # Show status
    echo ""
    log "Container Status:"
    docker ps --format "table {{.Names}}\t{{.Status}}" | grep liquidcrypto
}

# Rollback function
rollback() {
    cd "$DEPLOY_DIR"
    
    ACTIVE=$(get_active_backend)
    ROLLBACK_TO=$(get_inactive_backend)
    
    log "Rolling back from ${ACTIVE} to ${ROLLBACK_TO}..."
    
    echo "$ROLLBACK_TO" > "$ACTIVE_BACKEND_FILE"
    docker exec liquidcrypto-caddy caddy reload --config /etc/caddy/Caddyfile 2>/dev/null || \
        docker compose -f "$COMPOSE_FILE" restart caddy
    
    success "Rolled back to backend-${ROLLBACK_TO}"
}

# Handle arguments
case "${1:-deploy}" in
    rollback)
        rollback
        ;;
    *)
        main
        ;;
esac
