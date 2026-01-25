# LiquidCrypto Backend - Production Dockerfile
# Multi-stage build for Bun/Elysia backend

# Stage 1: Build
FROM oven/bun:1.1-alpine AS builder

WORKDIR /build

# Copy workspace files
COPY package.json bun.lock ./
COPY packages/a2a-sdk ./packages/a2a-sdk
COPY server ./server

# Install dependencies
RUN bun install --frozen-lockfile

# Build a2a-sdk first (workspace dependency)
WORKDIR /build/packages/a2a-sdk
RUN bun run build 2>/dev/null || bun build src/index.ts --outfile dist/index.js --target bun

# Build server
WORKDIR /build/server
RUN bun run build 2>/dev/null || bun build src/index.ts --outfile dist/index.js --target bun

# Stage 2: Runtime
FROM oven/bun:1.1-alpine

WORKDIR /app

# Copy built artifacts
COPY --from=builder /build/server/dist ./dist
COPY --from=builder /build/server/package.json ./
COPY --from=builder /build/node_modules ./node_modules
COPY --from=builder /build/packages ./packages

# Runtime configuration
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Health check
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=3 \
    CMD curl -sf http://localhost:3000/api/health || exit 1

# Start server
CMD ["bun", "run", "dist/index.js"]
