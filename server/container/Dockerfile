# LiquidContainer Runtime Image
#
# The main container image with the runtime server.
# Built on top of liquid-container-base.
#
# Build:
#   docker build -f Dockerfile.base -t liquid-container-base:latest .
#   docker build -t liquid-container:latest .

ARG BASE_IMAGE=liquid-container-base:latest
FROM ${BASE_IMAGE}

# Copy runtime server
COPY runtime-server/ /opt/liquid-runtime/

# Install runtime dependencies
WORKDIR /opt/liquid-runtime
RUN bun install --frozen-lockfile --production

# Create tmpfs mount point for secrets
VOLUME /secrets

# Switch back to app directory
WORKDIR /app

# Switch to non-root user
USER agent

# Runtime server port
EXPOSE 8080

# Environment defaults (all overridable)
ENV LIQUID_RUNTIME_PORT=8080
ENV LIQUID_RUNTIME_MODE=idle
ENV LIQUID_MAX_EXECUTION_TIME=300000
ENV LIQUID_MAX_MEMORY_MB=512
ENV LIQUID_LOG_LEVEL=info

# Health check - fast interval for responsive pool management
HEALTHCHECK --interval=5s --timeout=3s --start-period=2s --retries=3 \
    CMD curl -sf http://localhost:8080/health || exit 1

# Start the runtime server
ENTRYPOINT ["bun", "run", "/opt/liquid-runtime/server.ts"]
