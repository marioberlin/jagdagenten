#!/bin/bash
#
# Build LiquidContainer Docker images
#
# Usage:
#   ./build.sh           # Build all images
#   ./build.sh base      # Build only base image
#   ./build.sh runtime   # Build only runtime image
#   ./build.sh claude-cli # Build Claude CLI image (for Builder)
#   ./build.sh push      # Build and push to registry
#

set -euo pipefail

# Configuration
REGISTRY="${LIQUID_CONTAINER_REGISTRY:-ghcr.io/liquidcrypto}"
VERSION="${LIQUID_CONTAINER_VERSION:-latest}"
BASE_IMAGE="liquid-container-base"
RUNTIME_IMAGE="liquid-container"
CLAUDE_CLI_IMAGE="liquid-container-claude-cli"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[BUILD]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Check Docker
if ! command -v docker &> /dev/null; then
    error "Docker is not installed or not in PATH"
fi

build_base() {
    log "Building base image: ${BASE_IMAGE}:${VERSION}"

    docker build \
        -f Dockerfile.base \
        -t "${BASE_IMAGE}:${VERSION}" \
        -t "${BASE_IMAGE}:latest" \
        --build-arg BUILDKIT_INLINE_CACHE=1 \
        .

    log "Base image built successfully"
}

build_runtime() {
    log "Building runtime image: ${RUNTIME_IMAGE}:${VERSION}"

    # Ensure base image exists
    if ! docker image inspect "${BASE_IMAGE}:${VERSION}" &> /dev/null; then
        warn "Base image not found, building first..."
        build_base
    fi

    # Install runtime server dependencies
    log "Installing runtime server dependencies..."
    cd runtime-server
    if command -v bun &> /dev/null; then
        bun install --frozen-lockfile
    else
        npm install
    fi
    cd ..

    docker build \
        -f Dockerfile \
        -t "${RUNTIME_IMAGE}:${VERSION}" \
        -t "${RUNTIME_IMAGE}:latest" \
        --build-arg BASE_IMAGE="${BASE_IMAGE}:${VERSION}" \
        --build-arg BUILDKIT_INLINE_CACHE=1 \
        .

    log "Runtime image built successfully"
}

build_claude_cli() {
    log "Building Claude CLI image: ${CLAUDE_CLI_IMAGE}:${VERSION}"

    # Ensure base image exists
    if ! docker image inspect "${BASE_IMAGE}:${VERSION}" &> /dev/null; then
        warn "Base image not found, building first..."
        build_base
    fi

    docker build \
        -f Dockerfile.claude-cli \
        -t "${CLAUDE_CLI_IMAGE}:${VERSION}" \
        -t "${CLAUDE_CLI_IMAGE}:latest" \
        --build-arg BASE_IMAGE="${BASE_IMAGE}:${VERSION}" \
        --build-arg BUILDKIT_INLINE_CACHE=1 \
        .

    log "Claude CLI image built successfully"
}

push_images() {
    log "Pushing images to registry: ${REGISTRY}"

    # Tag for registry
    docker tag "${BASE_IMAGE}:${VERSION}" "${REGISTRY}/${BASE_IMAGE}:${VERSION}"
    docker tag "${BASE_IMAGE}:latest" "${REGISTRY}/${BASE_IMAGE}:latest"
    docker tag "${RUNTIME_IMAGE}:${VERSION}" "${REGISTRY}/${RUNTIME_IMAGE}:${VERSION}"
    docker tag "${RUNTIME_IMAGE}:latest" "${REGISTRY}/${RUNTIME_IMAGE}:latest"
    docker tag "${CLAUDE_CLI_IMAGE}:${VERSION}" "${REGISTRY}/${CLAUDE_CLI_IMAGE}:${VERSION}"
    docker tag "${CLAUDE_CLI_IMAGE}:latest" "${REGISTRY}/${CLAUDE_CLI_IMAGE}:latest"

    # Push
    docker push "${REGISTRY}/${BASE_IMAGE}:${VERSION}"
    docker push "${REGISTRY}/${BASE_IMAGE}:latest"
    docker push "${REGISTRY}/${RUNTIME_IMAGE}:${VERSION}"
    docker push "${REGISTRY}/${RUNTIME_IMAGE}:latest"
    docker push "${REGISTRY}/${CLAUDE_CLI_IMAGE}:${VERSION}"
    docker push "${REGISTRY}/${CLAUDE_CLI_IMAGE}:latest"

    log "Images pushed successfully"
}

# Main
case "${1:-all}" in
    base)
        build_base
        ;;
    runtime)
        build_runtime
        ;;
    claude-cli)
        build_claude_cli
        ;;
    push)
        build_base
        build_runtime
        build_claude_cli
        push_images
        ;;
    all)
        build_base
        build_runtime
        build_claude_cli
        ;;
    *)
        echo "Usage: $0 {base|runtime|claude-cli|push|all}"
        exit 1
        ;;
esac

log "Build complete!"
echo ""
echo "Images:"
docker images | grep -E "(liquid-container|REPOSITORY)" | head -10
