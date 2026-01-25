# LiquidCrypto Backend - Production Dockerfile
# Multi-stage build for Bun/Elysia backend

# Stage 1: Build
FROM oven/bun:1.1-alpine AS builder

WORKDIR /build

# Copy workspace files
COPY package.json bun.lock ./
COPY packages/a2a-sdk ./packages/a2a-sdk
COPY packages/ui ./packages/ui
COPY server ./server

# Install dependencies (no frozen-lockfile due to version compatibility)
RUN bun install

# Build a2a-sdk if needed (skip if dist exists)
WORKDIR /build/packages/a2a-sdk
RUN if [ ! -d "dist" ]; then bun run build 2>/dev/null || echo "a2a-sdk build skipped"; fi

# No server bundle build - running TypeScript directly avoids pino thread-stream issues

# Stage 2: Runtime
FROM oven/bun:1.1-alpine

WORKDIR /app

# Install curl for healthcheck (not included in Alpine by default)
RUN apk add --no-cache curl

# Copy source and dependencies (no bundle - pino requires unbundled worker threads)
COPY --from=builder /build/server/src ./src
COPY --from=builder /build/server/package.json ./
COPY --from=builder /build/node_modules ./node_modules
COPY --from=builder /build/packages ./packages

# Runtime configuration
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -sf http://localhost:3000/health || exit 1

# Start server (unbundled - required for pino compatibility)
CMD ["bun", "run", "src/index.ts"]
