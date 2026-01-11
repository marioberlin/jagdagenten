#!/bin/bash

# =============================================================================
# LiquidCrypto Startup Script
# Run: ./start.sh or add to PATH for global `start` command
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting LiquidCrypto...${NC}"
echo ""

# =============================================================================
# Redis Startup
# =============================================================================
start_redis() {
    echo -e "${YELLOW}📦 Starting Redis...${NC}"

    if command -v redis-server &> /dev/null; then
        # Try brew services first
        if command -v brew &> /dev/null && brew services list | grep -q redis; then
            brew services start redis
            echo -e "${GREEN}✓ Redis started via brew services${NC}"
        elif pgrep -x redis-server &> /dev/null; then
            echo -e "${GREEN}✓ Redis already running${NC}"
        else
            redis-server --daemonize yes
            echo -e "${GREEN}✓ Redis started in background${NC}"
        fi
    elif command -v docker &> /dev/null; then
        if docker ps -a --format '{{.Names}}' | grep -q '^liquid-redis$'; then
            if docker ps --format '{{.Names}}' | grep -q '^liquid-redis$'; then
                echo -e "${GREEN}✓ Redis container already running${NC}"
            else
                docker start liquid-redis
                echo -e "${GREEN}✓ Redis container started${NC}"
            fi
        else
            docker run -d -p 6379:6379 --name liquid-redis redis:alpine > /dev/null 2>&1
            echo -e "${GREEN}✓ Redis container started${NC}"
        fi
    else
        echo -e "${RED}⚠️  Redis not found!${NC}"
        echo -e "${YELLOW}   Install with: brew install redis${NC}"
        echo -e "${YELLOW}   Or use Docker: docker run -d -p 6379:6379 redis:alpine${NC}"
        return 1
    fi
}

# =============================================================================
# Backend Startup
# =============================================================================
start_backend() {
    echo -e "${YELLOW}🔧 Starting backend server...${NC}"

    if [ ! -d "server" ]; then
        echo -e "${RED}❌ Server directory not found${NC}"
        return 1
    fi

    cd server

    if [ ! -d "node_modules" ] && [ ! -d "bun.lockb" ]; then
        echo "Installing server dependencies..."
        bun install
    fi

    bun run dev &
    BACKEND_PID=$!
    cd ..

    echo -e "${GREEN}✓ Backend started (PID: $BACKEND_PID)${NC}"
    echo "$BACKEND_PID" > /tmp/liquid-backend.pid
}

# =============================================================================
# Frontend Startup
# =============================================================================
start_frontend() {
    echo -e "${YELLOW}🎨 Starting frontend...${NC}"

    if [ ! -d "node_modules" ] && [ ! -d "bun.lockb" ]; then
        echo "Installing frontend dependencies..."
        bun install
    fi

    bun run dev &
    FRONTEND_PID=$!

    echo -e "${GREEN}✓ Frontend started (PID: $FRONTEND_PID)${NC}"
    echo "$FRONTEND_PID" > /tmp/liquid-frontend.pid
}

# =============================================================================
# Stop All Services
# =============================================================================
stop_all() {
    echo -e "${YELLOW}🛑 Stopping all services...${NC}"

    if [ -f /tmp/liquid-backend.pid ]; then
        kill $(cat /tmp/liquid-backend.pid) 2>/dev/null || true
        rm /tmp/liquid-backend.pid
    fi

    if [ -f /tmp/liquid-frontend.pid ]; then
        kill $(cat /tmp/liquid-frontend.pid) 2>/dev/null || true
        rm /tmp/liquid-frontend.pid
    fi

    echo -e "${GREEN}✓ All services stopped${NC}"
}

# =============================================================================
# Main
# =============================================================================

# Handle arguments
case "${1:-start}" in
    start)
        start_redis
        start_backend
        start_frontend

        echo ""
        echo -e "${GREEN}✅ All services started!${NC}"
        echo ""
        echo -e "  ${BLUE}Frontend:${NC}  http://localhost:5173"
        echo -e "  ${BLUE}Backend:${NC}   http://localhost:3000"
        echo -e "  ${BLUE}Redis:${NC}     localhost:6379"
        echo ""
        echo -e "Press ${YELLOW}Ctrl+C${NC} to stop all services"

        # Cleanup on exit
        trap "stop_all; exit" INT TERM

        # Wait for processes
        wait
        ;;
    stop)
        stop_all
        ;;
    restart)
        stop_all
        sleep 1
        exec "$0" start
        ;;
    redis)
        start_redis
        ;;
    backend)
        start_backend
        ;;
    frontend)
        start_frontend
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|redis|backend|frontend}"
        echo ""
        echo "Commands:"
        echo "  start     - Start all services (default)"
        echo "  stop      - Stop all services"
        echo "  restart   - Restart all services"
        echo "  redis     - Start Redis only"
        echo "  backend   - Start backend only"
        echo "  frontend  - Start frontend only"
        exit 1
        ;;
esac
