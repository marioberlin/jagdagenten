#!/bin/bash
# =============================================================================
# LiquidCrypto Full Development Stack Startup Script
# =============================================================================
#
# This script starts ALL services required for development:
#   - PostgreSQL (database)
#   - Redis (caching & pub/sub)
#   - LiquidContainer Runtime (AI agent sandbox)
#   - Backend API (Elysia on port 3000)
#   - Frontend (Vite on port 5173)
#
# Usage:
#   ./dev.sh              Start all services (default)
#   ./dev.sh start        Start all services
#   ./dev.sh stop         Stop all services
#   ./dev.sh restart      Restart all services
#   ./dev.sh status       Show service status
#   ./dev.sh logs         Show Docker logs
#   ./dev.sh build        Build container images only
#   ./dev.sh clean        Stop and remove all containers/volumes
#   ./dev.sh docker       Start only Docker services (db, redis, runtime)
#   ./dev.sh app          Start only app services (backend, frontend)
#
# =============================================================================

set -e

# Get script directory and change to it
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# =============================================================================
# Configuration
# =============================================================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Service ports
POSTGRES_PORT=5432
REDIS_PORT=6379
RUNTIME_PORT=8081
BACKEND_PORT=3000
FRONTEND_PORT=5173

# PID files
PID_DIR="/tmp/liquidcrypto"
BACKEND_PID_FILE="$PID_DIR/backend.pid"
FRONTEND_PID_FILE="$PID_DIR/frontend.pid"

# Timeouts
HEALTH_CHECK_TIMEOUT=60
HEALTH_CHECK_INTERVAL=2

# =============================================================================
# Utility Functions
# =============================================================================

log_header() {
    echo ""
    echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BOLD}${BLUE}  $1${NC}"
    echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

log_step() {
    echo -e "${CYAN}→${NC} $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Check if a command exists
command_exists() {
    command -v "$1" &> /dev/null
}

# Check if a port is in use
port_in_use() {
    lsof -i :"$1" &> /dev/null
}

# Wait for a service to be healthy
wait_for_health() {
    local name="$1"
    local check_cmd="$2"
    local timeout="${3:-$HEALTH_CHECK_TIMEOUT}"
    local elapsed=0

    echo -ne "${CYAN}→${NC} Waiting for $name to be ready..."

    while [ $elapsed -lt $timeout ]; do
        if eval "$check_cmd" &> /dev/null; then
            echo -e " ${GREEN}ready${NC}"
            return 0
        fi
        sleep $HEALTH_CHECK_INTERVAL
        elapsed=$((elapsed + HEALTH_CHECK_INTERVAL))
        echo -ne "."
    done

    echo -e " ${RED}timeout${NC}"
    return 1
}

# Create PID directory
ensure_pid_dir() {
    mkdir -p "$PID_DIR"
}

# =============================================================================
# Prerequisite Checks
# =============================================================================

check_prerequisites() {
    log_header "Checking Prerequisites"

    local missing=()

    # Check Docker
    if command_exists docker; then
        if docker info &> /dev/null; then
            log_success "Docker is running"
        else
            log_error "Docker is installed but not running"
            echo "       Please start Docker Desktop or the Docker daemon"
            exit 1
        fi
    else
        missing+=("docker")
    fi

    # Check Docker Compose
    if command_exists docker && docker compose version &> /dev/null; then
        log_success "Docker Compose is available"
    elif command_exists docker-compose; then
        log_success "Docker Compose (standalone) is available"
    else
        missing+=("docker-compose")
    fi

    # Check Bun
    if command_exists bun; then
        log_success "Bun is installed ($(bun --version))"
    else
        missing+=("bun")
    fi

    # Check Node.js (fallback)
    if command_exists node; then
        log_success "Node.js is installed ($(node --version))"
    else
        log_warning "Node.js not found (optional, Bun is primary)"
    fi

    if [ ${#missing[@]} -gt 0 ]; then
        echo ""
        log_error "Missing required tools: ${missing[*]}"
        echo ""
        echo "Installation instructions:"
        for tool in "${missing[@]}"; do
            case $tool in
                docker)
                    echo "  Docker: https://docs.docker.com/get-docker/"
                    ;;
                docker-compose)
                    echo "  Docker Compose: https://docs.docker.com/compose/install/"
                    ;;
                bun)
                    echo "  Bun: curl -fsSL https://bun.sh/install | bash"
                    ;;
            esac
        done
        exit 1
    fi
}

# =============================================================================
# Docker Image Management
# =============================================================================

check_container_images() {
    log_header "Checking Container Images"

    local base_exists=false
    local runtime_exists=false

    # Check if base image exists
    if docker image inspect "liquid-container-base:latest" &> /dev/null; then
        log_success "Base image exists: liquid-container-base:latest"
        base_exists=true
    else
        log_warning "Base image not found: liquid-container-base:latest"
    fi

    # Check if runtime image exists
    if docker image inspect "liquid-container:latest" &> /dev/null; then
        log_success "Runtime image exists: liquid-container:latest"
        runtime_exists=true
    else
        log_warning "Runtime image not found: liquid-container:latest"
    fi

    # Build if needed
    if [ "$base_exists" = false ] || [ "$runtime_exists" = false ]; then
        echo ""
        log_step "Building missing container images..."
        build_container_images
    fi
}

build_container_images() {
    log_header "Building Container Images"

    if [ ! -d "server/container" ]; then
        log_error "Container directory not found: server/container"
        exit 1
    fi

    cd server/container

    # Build base image
    log_step "Building base image (this may take a few minutes)..."
    if docker build -f Dockerfile.base -t liquid-container-base:latest . ; then
        log_success "Base image built successfully"
    else
        log_error "Failed to build base image"
        cd "$SCRIPT_DIR"
        exit 1
    fi

    # Install runtime server dependencies
    log_step "Installing runtime server dependencies..."
    cd runtime-server
    if command_exists bun; then
        bun install --frozen-lockfile 2>/dev/null || bun install
    else
        npm install
    fi
    cd ..

    # Build runtime image
    log_step "Building runtime image..."
    if docker build -f Dockerfile -t liquid-container:latest --build-arg BASE_IMAGE=liquid-container-base:latest . ; then
        log_success "Runtime image built successfully"
    else
        log_error "Failed to build runtime image"
        cd "$SCRIPT_DIR"
        exit 1
    fi

    cd "$SCRIPT_DIR"

    echo ""
    log_success "All container images built successfully"
}

# =============================================================================
# Docker Services (PostgreSQL, Redis, Runtime)
# =============================================================================

start_docker_services() {
    log_header "Starting Docker Services"

    # Use docker compose (v2) or docker-compose (v1)
    local compose_cmd="docker compose"
    if ! docker compose version &> /dev/null; then
        compose_cmd="docker-compose"
    fi

    log_step "Starting PostgreSQL, Redis, and LiquidContainer Runtime..."

    # Start services in detached mode
    if $compose_cmd up -d; then
        log_success "Docker services started"
    else
        log_error "Failed to start Docker services"
        exit 1
    fi

    # Wait for PostgreSQL
    wait_for_health "PostgreSQL" \
        "docker exec liquidcrypto-postgres pg_isready -U liquidcrypto -d liquidcrypto" \
        60

    # Wait for Redis
    wait_for_health "Redis" \
        "docker exec liquidcrypto-redis redis-cli ping" \
        30

    # Wait for Runtime
    wait_for_health "LiquidContainer Runtime" \
        "curl -sf http://localhost:$RUNTIME_PORT/health" \
        60

    echo ""
    log_success "All Docker services are healthy"
}

stop_docker_services() {
    log_step "Stopping Docker services..."

    local compose_cmd="docker compose"
    if ! docker compose version &> /dev/null; then
        compose_cmd="docker-compose"
    fi

    $compose_cmd down

    log_success "Docker services stopped"
}

# =============================================================================
# Application Services (Backend, Frontend)
# =============================================================================

install_dependencies() {
    log_header "Installing Dependencies"

    # Check if root node_modules exists
    if [ ! -d "node_modules" ]; then
        log_step "Installing root dependencies..."
        bun install
        log_success "Root dependencies installed"
    else
        log_success "Root dependencies already installed"
    fi

    # Check server dependencies
    if [ ! -d "server/node_modules" ]; then
        log_step "Installing server dependencies..."
        cd server
        bun install
        cd "$SCRIPT_DIR"
        log_success "Server dependencies installed"
    else
        log_success "Server dependencies already installed"
    fi
}

start_backend() {
    log_step "Starting backend server..."

    ensure_pid_dir

    # Check if already running
    if [ -f "$BACKEND_PID_FILE" ] && kill -0 "$(cat "$BACKEND_PID_FILE")" 2>/dev/null; then
        log_warning "Backend is already running (PID: $(cat "$BACKEND_PID_FILE"))"
        return 0
    fi

    # Check port
    if port_in_use $BACKEND_PORT; then
        log_warning "Port $BACKEND_PORT is already in use"
        log_info "Attempting to kill existing process..."
        lsof -ti :$BACKEND_PORT | xargs kill -9 2>/dev/null || true
        sleep 1
    fi

    cd server

    # Start backend in background
    bun run dev > "$PID_DIR/backend.log" 2>&1 &
    local pid=$!
    echo $pid > "$BACKEND_PID_FILE"

    cd "$SCRIPT_DIR"

    # Wait for backend to be ready
    wait_for_health "Backend API" \
        "curl -sf http://localhost:$BACKEND_PORT/health" \
        30

    log_success "Backend started (PID: $pid)"
}

start_frontend() {
    log_step "Starting frontend dev server..."

    ensure_pid_dir

    # Check if already running
    if [ -f "$FRONTEND_PID_FILE" ] && kill -0 "$(cat "$FRONTEND_PID_FILE")" 2>/dev/null; then
        log_warning "Frontend is already running (PID: $(cat "$FRONTEND_PID_FILE"))"
        return 0
    fi

    # Check port
    if port_in_use $FRONTEND_PORT; then
        log_warning "Port $FRONTEND_PORT is already in use"
        log_info "Attempting to kill existing process..."
        lsof -ti :$FRONTEND_PORT | xargs kill -9 2>/dev/null || true
        sleep 1
    fi

    # Start frontend - use npx vite for better compatibility
    npx vite --host > "$PID_DIR/frontend.log" 2>&1 &
    local pid=$!
    echo $pid > "$FRONTEND_PID_FILE"

    # Wait for frontend to be ready
    wait_for_health "Frontend" \
        "curl -sf http://localhost:$FRONTEND_PORT" \
        30

    log_success "Frontend started (PID: $pid)"
}

stop_app_services() {
    log_step "Stopping application services..."

    # Stop backend
    if [ -f "$BACKEND_PID_FILE" ]; then
        local pid=$(cat "$BACKEND_PID_FILE")
        if kill -0 "$pid" 2>/dev/null; then
            kill "$pid" 2>/dev/null || true
            log_success "Backend stopped (PID: $pid)"
        fi
        rm -f "$BACKEND_PID_FILE"
    fi

    # Stop frontend
    if [ -f "$FRONTEND_PID_FILE" ]; then
        local pid=$(cat "$FRONTEND_PID_FILE")
        if kill -0 "$pid" 2>/dev/null; then
            kill "$pid" 2>/dev/null || true
            log_success "Frontend stopped (PID: $pid)"
        fi
        rm -f "$FRONTEND_PID_FILE"
    fi

    # Kill any orphaned processes on our ports
    lsof -ti :$BACKEND_PORT | xargs kill -9 2>/dev/null || true
    lsof -ti :$FRONTEND_PORT | xargs kill -9 2>/dev/null || true

    log_success "Application services stopped"
}

# =============================================================================
# Status & Logs
# =============================================================================

show_status() {
    log_header "Service Status"

    echo ""
    echo -e "${BOLD}Docker Services:${NC}"

    # PostgreSQL
    if docker ps --format '{{.Names}}' | grep -q 'liquidcrypto-postgres'; then
        echo -e "  PostgreSQL:        ${GREEN}running${NC} (port $POSTGRES_PORT)"
    else
        echo -e "  PostgreSQL:        ${RED}stopped${NC}"
    fi

    # Redis
    if docker ps --format '{{.Names}}' | grep -q 'liquidcrypto-redis'; then
        echo -e "  Redis:             ${GREEN}running${NC} (port $REDIS_PORT)"
    else
        echo -e "  Redis:             ${RED}stopped${NC}"
    fi

    # Runtime
    if docker ps --format '{{.Names}}' | grep -q 'liquidcrypto-runtime'; then
        echo -e "  Container Runtime: ${GREEN}running${NC} (port $RUNTIME_PORT)"
    else
        echo -e "  Container Runtime: ${RED}stopped${NC}"
    fi

    echo ""
    echo -e "${BOLD}Application Services:${NC}"

    # Backend
    if [ -f "$BACKEND_PID_FILE" ] && kill -0 "$(cat "$BACKEND_PID_FILE")" 2>/dev/null; then
        echo -e "  Backend API:       ${GREEN}running${NC} (port $BACKEND_PORT, PID: $(cat "$BACKEND_PID_FILE"))"
    elif port_in_use $BACKEND_PORT; then
        echo -e "  Backend API:       ${YELLOW}port in use${NC} (port $BACKEND_PORT)"
    else
        echo -e "  Backend API:       ${RED}stopped${NC}"
    fi

    # Frontend
    if [ -f "$FRONTEND_PID_FILE" ] && kill -0 "$(cat "$FRONTEND_PID_FILE")" 2>/dev/null; then
        echo -e "  Frontend:          ${GREEN}running${NC} (port $FRONTEND_PORT, PID: $(cat "$FRONTEND_PID_FILE"))"
    elif port_in_use $FRONTEND_PORT; then
        echo -e "  Frontend:          ${YELLOW}port in use${NC} (port $FRONTEND_PORT)"
    else
        echo -e "  Frontend:          ${RED}stopped${NC}"
    fi

    echo ""
}

show_logs() {
    local service="${1:-all}"

    case "$service" in
        postgres)
            docker logs -f liquidcrypto-postgres
            ;;
        redis)
            docker logs -f liquidcrypto-redis
            ;;
        runtime)
            docker logs -f liquidcrypto-runtime
            ;;
        backend)
            if [ -f "$PID_DIR/backend.log" ]; then
                tail -f "$PID_DIR/backend.log"
            else
                log_error "Backend log not found"
            fi
            ;;
        frontend)
            if [ -f "$PID_DIR/frontend.log" ]; then
                tail -f "$PID_DIR/frontend.log"
            else
                log_error "Frontend log not found"
            fi
            ;;
        all|docker)
            docker compose logs -f
            ;;
        *)
            echo "Usage: $0 logs {postgres|redis|runtime|backend|frontend|docker|all}"
            ;;
    esac
}

# =============================================================================
# Full Stack Management
# =============================================================================

start_all() {
    echo -e "${BOLD}${MAGENTA}"
    echo "  ╔═══════════════════════════════════════════════════════════════════════╗"
    echo "  ║                                                                       ║"
    echo "  ║   ██╗     ██╗ ██████╗ ██╗   ██╗██╗██████╗  ██████╗███████╗           ║"
    echo "  ║   ██║     ██║██╔═══██╗██║   ██║██║██╔══██╗██╔════╝██╔════╝           ║"
    echo "  ║   ██║     ██║██║   ██║██║   ██║██║██║  ██║██║     ███████╗           ║"
    echo "  ║   ██║     ██║██║▄▄ ██║██║   ██║██║██║  ██║██║     ╚════██║           ║"
    echo "  ║   ███████╗██║╚██████╔╝╚██████╔╝██║██████╔╝╚██████╗███████║           ║"
    echo "  ║   ╚══════╝╚═╝ ╚══▀▀═╝  ╚═════╝ ╚═╝╚═════╝  ╚═════╝╚══════╝           ║"
    echo "  ║                                                                       ║"
    echo "  ║                    Development Stack Startup                          ║"
    echo "  ║                                                                       ║"
    echo "  ╚═══════════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"

    # Check prerequisites
    check_prerequisites

    # Check/build container images
    check_container_images

    # Start Docker services
    start_docker_services

    # Install dependencies
    install_dependencies

    # Start application services
    log_header "Starting Application Services"
    start_backend
    start_frontend

    # Show success message
    log_header "All Services Started!"

    echo ""
    echo -e "  ${BOLD}Access Points:${NC}"
    echo ""
    echo -e "    ${CYAN}Frontend:${NC}           ${BOLD}http://localhost:$FRONTEND_PORT${NC}"
    echo -e "    ${CYAN}Backend API:${NC}        ${BOLD}http://localhost:$BACKEND_PORT${NC}"
    echo -e "    ${CYAN}API Documentation:${NC}  ${BOLD}http://localhost:$BACKEND_PORT/swagger${NC}"
    echo ""
    echo -e "  ${BOLD}Infrastructure:${NC}"
    echo ""
    echo -e "    ${CYAN}PostgreSQL:${NC}         localhost:$POSTGRES_PORT"
    echo -e "    ${CYAN}Redis:${NC}              localhost:$REDIS_PORT"
    echo -e "    ${CYAN}Container Runtime:${NC}  localhost:$RUNTIME_PORT"
    echo ""
    echo -e "  ${BOLD}Useful Commands:${NC}"
    echo ""
    echo -e "    ${YELLOW}./dev.sh status${NC}     Show service status"
    echo -e "    ${YELLOW}./dev.sh logs${NC}       Show Docker logs"
    echo -e "    ${YELLOW}./dev.sh stop${NC}       Stop all services"
    echo -e "    ${YELLOW}./dev.sh restart${NC}    Restart all services"
    echo ""
    echo -e "  Press ${BOLD}${YELLOW}Ctrl+C${NC} to stop all services"
    echo ""

    # Setup signal handlers
    trap 'echo ""; log_info "Shutting down..."; stop_all; exit 0' INT TERM

    # Wait and keep running
    while true; do
        sleep 1
    done
}

stop_all() {
    log_header "Stopping All Services"

    stop_app_services
    stop_docker_services

    echo ""
    log_success "All services stopped"
}

clean_all() {
    log_header "Cleaning Up"

    stop_app_services

    log_step "Removing Docker containers and volumes..."

    local compose_cmd="docker compose"
    if ! docker compose version &> /dev/null; then
        compose_cmd="docker-compose"
    fi

    $compose_cmd down -v --remove-orphans

    # Clean up PID files
    rm -rf "$PID_DIR"

    log_success "Cleanup complete"
}

# =============================================================================
# Main Entry Point
# =============================================================================

main() {
    case "${1:-start}" in
        start)
            start_all
            ;;
        stop)
            stop_all
            ;;
        restart)
            stop_all
            sleep 2
            start_all
            ;;
        status)
            show_status
            ;;
        logs)
            show_logs "${2:-all}"
            ;;
        build)
            check_prerequisites
            build_container_images
            ;;
        clean)
            clean_all
            ;;
        docker)
            check_prerequisites
            check_container_images
            start_docker_services
            show_status
            ;;
        app)
            install_dependencies
            log_header "Starting Application Services"
            start_backend
            start_frontend
            show_status
            trap 'stop_app_services; exit 0' INT TERM
            wait
            ;;
        *)
            echo ""
            echo -e "${BOLD}LiquidCrypto Development Stack${NC}"
            echo ""
            echo "Usage: $0 <command>"
            echo ""
            echo "Commands:"
            echo "  start     Start all services (default)"
            echo "  stop      Stop all services"
            echo "  restart   Restart all services"
            echo "  status    Show service status"
            echo "  logs      Show Docker logs (logs [service])"
            echo "  build     Build container images only"
            echo "  clean     Stop and remove all containers/volumes"
            echo "  docker    Start only Docker services"
            echo "  app       Start only app services (backend, frontend)"
            echo ""
            echo "Log services: postgres, redis, runtime, backend, frontend, docker, all"
            echo ""
            exit 1
            ;;
    esac
}

main "$@"
