# LiquidContainer Runtime Architecture

## Executive Summary

LiquidContainer is a secure, model-agnostic container runtime for executing AI agents in isolated environments. It replaces the current mock process orchestration with a production-grade container system that works identically on local machines and remote cloud providers.

**Key Design Goals:**
- **< 100ms** container acquisition from warm pool
- **Zero-config** deployment to any Docker-compatible host
- **Provider-agnostic** infrastructure (works on Railway, Fly.io, Hetzner, bare metal)
- **Cost-efficient** with aggressive resource sharing and auto-scaling
- **Observable** via OpenTelemetry integration

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Container Specification](#2-container-specification)
3. [Pool Management](#3-pool-management)
4. [Runtime Server Protocol](#4-runtime-server-protocol)
5. [Configuration System](#5-configuration-system)
6. [Remote Deployment](#6-remote-deployment)
7. [Security Model](#7-security-model)
8. [Observability](#8-observability)
9. [Implementation Phases](#9-implementation-phases)
10. [File Structure](#10-file-structure)

---

## 1. Architecture Overview

### 1.1 Three-Layer Design

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              ORCHESTRATOR                                    │
│   Decides which agents to run, routes tasks, handles failures               │
│   (existing: server/src/orchestrator/)                                      │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            CONTAINER MANAGER                                 │
│   Pool lifecycle, container acquisition, health monitoring                   │
│   (new: server/src/container/)                                              │
│                                                                              │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                     │
│   │  Warm Pool   │  │   Scheduler  │  │   Registry   │                     │
│   │  (3 idle)    │  │  (placement) │  │  (discovery) │                     │
│   └──────────────┘  └──────────────┘  └──────────────┘                     │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           LIQUID CONTAINERS                                  │
│   Isolated execution environments with runtime server                        │
│                                                                              │
│   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐            │
│   │  Container A    │  │  Container B    │  │  Container C    │            │
│   │  ┌───────────┐  │  │  ┌───────────┐  │  │  ┌───────────┐  │            │
│   │  │  Runtime  │  │  │  │  Runtime  │  │  │  │  Runtime  │  │            │
│   │  │  Server   │  │  │  │  Server   │  │  │  │  Server   │  │            │
│   │  └───────────┘  │  │  └───────────┘  │  │  └───────────┘  │            │
│   │  Port 8080      │  │  Port 8080      │  │  Port 8080      │            │
│   └─────────────────┘  └─────────────────┘  └─────────────────┘            │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Execution Flow

```
1. Orchestrator calls containerManager.acquire()
2. Pool returns pre-warmed container (or creates new if empty)
3. Orchestrator sends POST /init with agent configuration
4. Container executes task, streams output via SSE
5. Orchestrator calls containerManager.release(containerId)
6. Container is recycled (reset state) or destroyed (if unhealthy)
```

---

## 2. Container Specification

### 2.1 Base Image

The base image is "heavy" - pre-baked with all runtimes to avoid install latency.

```dockerfile
# container/Dockerfile.base
FROM debian:bookworm-slim AS base

# System dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    git \
    jq \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Bun (primary runtime)
ENV BUN_INSTALL=/usr/local/bun
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="${BUN_INSTALL}/bin:${PATH}"

# Node.js 22 LTS (compatibility layer)
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Global tools
RUN bun install -g typescript tsx

# Create non-root user
RUN useradd -m -s /bin/bash agent
WORKDIR /app

# Health check endpoint
HEALTHCHECK --interval=5s --timeout=3s --start-period=2s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1
```

### 2.2 Runtime Image

```dockerfile
# container/Dockerfile
FROM liquid-container-base:latest

# Copy runtime server
COPY runtime-server/ /opt/liquid-runtime/

# Install runtime dependencies
WORKDIR /opt/liquid-runtime
RUN bun install --frozen-lockfile

# Switch to non-root user
USER agent
WORKDIR /app

# Runtime server listens on 8080
EXPOSE 8080

# Environment defaults (overridable)
ENV LIQUID_RUNTIME_PORT=8080
ENV LIQUID_RUNTIME_MODE=idle
ENV LIQUID_MAX_EXECUTION_TIME=300000
ENV LIQUID_MAX_MEMORY_MB=512

ENTRYPOINT ["bun", "run", "/opt/liquid-runtime/server.ts"]
```

### 2.3 Runtime Variants

| Variant | Use Case | Additional Tools |
|---------|----------|------------------|
| `base` | General agent execution | Bun, Node, Git |
| `python` | ML/Data agents | + Python 3.12, uv |
| `full` | Multi-language agents | + Go, Rust, Python |

---

## 3. Pool Management

### 3.1 Pool Configuration

```typescript
// server/src/container/types.ts

export interface PoolConfig {
  /** Minimum idle containers to maintain */
  minIdle: number;
  /** Maximum total containers */
  maxTotal: number;
  /** Container idle timeout before destruction (ms) */
  idleTimeout: number;
  /** Max time a container can be acquired (ms) */
  maxAcquireTime: number;
  /** Health check interval (ms) */
  healthCheckInterval: number;
  /** Container image to use */
  image: string;
  /** Resource limits per container */
  resources: ResourceLimits;
  /** Placement strategy */
  placement: PlacementStrategy;
}

export interface ResourceLimits {
  /** Memory limit in bytes */
  memory: number;
  /** CPU quota (1.0 = 1 core) */
  cpuQuota: number;
  /** Max PIDs */
  pidsLimit: number;
  /** Disk quota in bytes (if supported) */
  diskQuota?: number;
}

export type PlacementStrategy =
  | { type: 'local' }
  | { type: 'remote'; endpoints: RemoteEndpoint[] }
  | { type: 'hybrid'; localWeight: number; remoteEndpoints: RemoteEndpoint[] };

export interface RemoteEndpoint {
  /** Unique endpoint ID */
  id: string;
  /** Docker API URL (tcp:// or ssh://) */
  url: string;
  /** TLS certificates (for tcp://) */
  tls?: TLSConfig;
  /** SSH key (for ssh://) */
  sshKey?: string;
  /** Maximum containers on this endpoint */
  maxContainers: number;
  /** Weight for load balancing (higher = more traffic) */
  weight: number;
  /** Labels for affinity matching */
  labels: Record<string, string>;
}
```

### 3.2 Pool Implementation

```typescript
// server/src/container/pool.ts

import Dockerode from 'dockerode';
import { EventEmitter } from 'events';

export class ContainerPool extends EventEmitter {
  private idle: Map<string, PooledContainer> = new Map();
  private acquired: Map<string, PooledContainer> = new Map();
  private clients: Map<string, Dockerode> = new Map();
  private replenishing = false;
  private config: PoolConfig;

  constructor(config: PoolConfig) {
    super();
    this.config = config;
    this.initializeClients();
  }

  /**
   * Initialize Docker clients for all endpoints
   */
  private initializeClients(): void {
    if (this.config.placement.type === 'local') {
      this.clients.set('local', new Dockerode());
    } else {
      const endpoints = this.config.placement.type === 'remote'
        ? this.config.placement.endpoints
        : this.config.placement.remoteEndpoints;

      for (const endpoint of endpoints) {
        this.clients.set(endpoint.id, this.createClient(endpoint));
      }

      if (this.config.placement.type === 'hybrid') {
        this.clients.set('local', new Dockerode());
      }
    }
  }

  /**
   * Acquire a container from the pool
   * Returns immediately if idle container available
   * Otherwise creates new (subject to maxTotal limit)
   */
  async acquire(options?: AcquireOptions): Promise<PooledContainer> {
    // Try to get from idle pool
    const idle = this.getIdleContainer(options?.affinity);
    if (idle) {
      this.idle.delete(idle.id);
      this.acquired.set(idle.id, idle);
      idle.acquiredAt = Date.now();
      this.emit('acquired', { containerId: idle.id, fromPool: true });
      this.maybeReplenish();
      return idle;
    }

    // Check if we can create new
    const total = this.idle.size + this.acquired.size;
    if (total >= this.config.maxTotal) {
      throw new PoolExhaustedError(`Pool limit reached: ${total}/${this.config.maxTotal}`);
    }

    // Create new container
    const container = await this.createContainer(options?.affinity);
    this.acquired.set(container.id, container);
    container.acquiredAt = Date.now();
    this.emit('acquired', { containerId: container.id, fromPool: false });
    this.maybeReplenish();
    return container;
  }

  /**
   * Release a container back to the pool
   * Container is recycled if healthy, destroyed otherwise
   */
  async release(containerId: string, options?: ReleaseOptions): Promise<void> {
    const container = this.acquired.get(containerId);
    if (!container) {
      throw new Error(`Container ${containerId} not acquired`);
    }

    this.acquired.delete(containerId);

    // Destroy if marked unhealthy or force destroy requested
    if (options?.destroy || !await this.isHealthy(container)) {
      await this.destroyContainer(container);
      this.emit('destroyed', { containerId, reason: 'unhealthy' });
      return;
    }

    // Reset container state
    await this.resetContainer(container);

    // Return to idle pool
    container.acquiredAt = undefined;
    container.idleSince = Date.now();
    this.idle.set(containerId, container);
    this.emit('released', { containerId });
  }

  /**
   * Background replenishment - maintains minIdle containers
   */
  private async maybeReplenish(): Promise<void> {
    if (this.replenishing) return;
    if (this.idle.size >= this.config.minIdle) return;

    this.replenishing = true;
    try {
      const needed = this.config.minIdle - this.idle.size;
      const total = this.idle.size + this.acquired.size;
      const canCreate = Math.min(needed, this.config.maxTotal - total);

      const promises = Array(canCreate).fill(null).map(() =>
        this.createContainer().then(c => {
          c.idleSince = Date.now();
          this.idle.set(c.id, c);
          this.emit('replenished', { containerId: c.id });
        })
      );

      await Promise.allSettled(promises);
    } finally {
      this.replenishing = false;
    }
  }

  /**
   * Create a new container
   */
  private async createContainer(affinity?: AffinityRule[]): Promise<PooledContainer> {
    const endpoint = this.selectEndpoint(affinity);
    const client = this.clients.get(endpoint.id)!;

    const container = await client.createContainer({
      Image: this.config.image,
      Env: [
        `LIQUID_RUNTIME_PORT=8080`,
        `LIQUID_RUNTIME_MODE=idle`,
      ],
      HostConfig: {
        Memory: this.config.resources.memory,
        CpuPeriod: 100000,
        CpuQuota: Math.floor(this.config.resources.cpuQuota * 100000),
        PidsLimit: this.config.resources.pidsLimit,
        NetworkMode: 'bridge',
        AutoRemove: false,
        ReadonlyRootfs: false,
        SecurityOpt: ['no-new-privileges'],
      },
      ExposedPorts: { '8080/tcp': {} },
    });

    await container.start();

    const info = await container.inspect();
    const ipAddress = info.NetworkSettings.IPAddress;

    // Wait for runtime server to be ready
    await this.waitForReady(ipAddress, 8080);

    return {
      id: container.id,
      endpointId: endpoint.id,
      ipAddress,
      port: 8080,
      createdAt: Date.now(),
      dockerContainer: container,
    };
  }

  /**
   * Select endpoint based on affinity and load
   */
  private selectEndpoint(affinity?: AffinityRule[]): { id: string; client: Dockerode } {
    // Implementation: weighted random with affinity matching
    // See section 6.4 for full algorithm
  }
}
```

### 3.3 Pool States

```
┌─────────────┐     acquire()      ┌─────────────┐
│    IDLE     │ ─────────────────► │  ACQUIRED   │
│             │                    │             │
│  Waiting    │                    │  Running    │
│  for work   │ ◄───────────────── │  task       │
└─────────────┘     release()      └─────────────┘
       │                                  │
       │ idleTimeout                      │ unhealthy/force
       ▼                                  ▼
┌─────────────┐                    ┌─────────────┐
│  DESTROYED  │ ◄───────────────── │ DESTROYING  │
└─────────────┘                    └─────────────┘
```

---

## 4. Runtime Server Protocol

### 4.1 HTTP API

The runtime server inside each container exposes a simple HTTP API.

```typescript
// container/runtime-server/server.ts

import { Elysia } from 'elysia';
import { spawn } from 'child_process';

const app = new Elysia()
  .get('/health', () => ({
    status: 'ok',
    mode: process.env.LIQUID_RUNTIME_MODE,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  }))

  .post('/init', async ({ body }) => {
    // Initialize agent configuration
    const { agentId, script, env, mounts } = body as InitRequest;

    // Store configuration
    runtime.agentId = agentId;
    runtime.script = script;
    runtime.env = { ...process.env, ...env };

    // Mount any provided code/data
    if (mounts) {
      await mountPaths(mounts);
    }

    process.env.LIQUID_RUNTIME_MODE = 'ready';
    return { status: 'initialized', agentId };
  })

  .post('/execute', async ({ body }) => {
    // Execute a command and return result
    const { command, args, timeout } = body as ExecuteRequest;

    process.env.LIQUID_RUNTIME_MODE = 'executing';

    try {
      const result = await executeCommand(command, args, {
        timeout: timeout ?? parseInt(process.env.LIQUID_MAX_EXECUTION_TIME!),
        env: runtime.env,
      });

      process.env.LIQUID_RUNTIME_MODE = 'ready';
      return result;
    } catch (error) {
      process.env.LIQUID_RUNTIME_MODE = 'error';
      throw error;
    }
  })

  .get('/execute/stream', async ({ set }) => {
    // Server-Sent Events for streaming output
    set.headers['content-type'] = 'text/event-stream';
    set.headers['cache-control'] = 'no-cache';
    set.headers['connection'] = 'keep-alive';

    return new ReadableStream({
      async start(controller) {
        // Stream stdout/stderr as SSE events
        runtime.process?.stdout?.on('data', (chunk) => {
          controller.enqueue(`event: stdout\ndata: ${chunk.toString()}\n\n`);
        });
        runtime.process?.stderr?.on('data', (chunk) => {
          controller.enqueue(`event: stderr\ndata: ${chunk.toString()}\n\n`);
        });
        runtime.process?.on('close', (code) => {
          controller.enqueue(`event: exit\ndata: ${code}\n\n`);
          controller.close();
        });
      }
    });
  })

  .post('/reset', async () => {
    // Reset container state for reuse
    await cleanup();
    runtime.agentId = undefined;
    runtime.script = undefined;
    runtime.env = {};
    process.env.LIQUID_RUNTIME_MODE = 'idle';
    return { status: 'reset' };
  })

  .post('/shutdown', async () => {
    // Graceful shutdown
    await cleanup();
    setTimeout(() => process.exit(0), 100);
    return { status: 'shutting_down' };
  });

app.listen(parseInt(process.env.LIQUID_RUNTIME_PORT ?? '8080'));
```

### 4.2 Request/Response Types

```typescript
// container/runtime-server/types.ts

export interface InitRequest {
  /** Unique agent identifier */
  agentId: string;
  /** Script to execute (path or inline) */
  script?: {
    type: 'path' | 'inline';
    content: string;
  };
  /** Additional environment variables */
  env?: Record<string, string>;
  /** Paths to mount (host:container) */
  mounts?: Array<{
    source: string;
    target: string;
    readonly: boolean;
  }>;
  /** Secrets to inject (fetched from vault) */
  secrets?: string[];
}

export interface ExecuteRequest {
  /** Command to execute */
  command: string;
  /** Command arguments */
  args?: string[];
  /** Execution timeout in ms */
  timeout?: number;
  /** Working directory */
  cwd?: string;
  /** Stream output via SSE */
  stream?: boolean;
}

export interface ExecuteResponse {
  /** Exit code */
  exitCode: number;
  /** Standard output */
  stdout: string;
  /** Standard error */
  stderr: string;
  /** Execution duration in ms */
  duration: number;
  /** Whether execution was killed due to timeout */
  timedOut: boolean;
}

export interface HealthResponse {
  status: 'ok' | 'error';
  mode: 'idle' | 'ready' | 'executing' | 'error';
  uptime: number;
  memory: {
    heapUsed: number;
    heapTotal: number;
    rss: number;
  };
}
```

---

## 5. Configuration System

### 5.1 Environment Variables

All configuration is environment-variable driven for 12-factor compliance.

```bash
# Pool Configuration
LIQUID_POOL_MIN_IDLE=3              # Minimum warm containers
LIQUID_POOL_MAX_TOTAL=20            # Maximum containers
LIQUID_POOL_IDLE_TIMEOUT=300000     # 5 minutes idle timeout
LIQUID_POOL_ACQUIRE_TIMEOUT=30000   # 30 second acquire timeout
LIQUID_POOL_HEALTH_INTERVAL=10000   # 10 second health checks

# Resource Limits
LIQUID_CONTAINER_MEMORY=536870912   # 512MB per container
LIQUID_CONTAINER_CPU=0.5            # 0.5 CPU cores
LIQUID_CONTAINER_PIDS=100           # Max 100 processes

# Image Configuration
LIQUID_CONTAINER_IMAGE=liquid-container:latest
LIQUID_CONTAINER_REGISTRY=ghcr.io/yourusername

# Placement Strategy
LIQUID_PLACEMENT_STRATEGY=local     # local | remote | hybrid
LIQUID_PLACEMENT_LOCAL_WEIGHT=0.7   # For hybrid mode

# Remote Endpoints (JSON array for remote/hybrid)
LIQUID_REMOTE_ENDPOINTS='[{"id":"hetzner-1","url":"ssh://root@1.2.3.4","maxContainers":10,"weight":1}]'

# Security
LIQUID_NETWORK_MODE=bridge          # bridge | none | custom
LIQUID_ALLOWED_HOSTS=api.anthropic.com,api.google.com
LIQUID_SECRETS_BACKEND=env          # env | vault | aws-sm

# Observability
LIQUID_OTEL_ENABLED=true
LIQUID_LOG_LEVEL=info
```

### 5.2 Configuration Schema

```typescript
// server/src/container/config.ts

import { z } from 'zod';

export const PoolConfigSchema = z.object({
  minIdle: z.number().min(0).max(100).default(3),
  maxTotal: z.number().min(1).max(1000).default(20),
  idleTimeout: z.number().min(10000).max(3600000).default(300000),
  acquireTimeout: z.number().min(1000).max(60000).default(30000),
  healthInterval: z.number().min(1000).max(60000).default(10000),
});

export const ResourceLimitsSchema = z.object({
  memory: z.number().min(67108864).max(17179869184).default(536870912), // 64MB - 16GB
  cpuQuota: z.number().min(0.1).max(16).default(0.5),
  pidsLimit: z.number().min(10).max(10000).default(100),
});

export const RemoteEndpointSchema = z.object({
  id: z.string(),
  url: z.string().url(),
  tls: z.object({
    ca: z.string().optional(),
    cert: z.string().optional(),
    key: z.string().optional(),
  }).optional(),
  sshKey: z.string().optional(),
  maxContainers: z.number().min(1).default(10),
  weight: z.number().min(0).max(100).default(1),
  labels: z.record(z.string()).default({}),
});

export const PlacementSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('local') }),
  z.object({
    type: z.literal('remote'),
    endpoints: z.array(RemoteEndpointSchema).min(1),
  }),
  z.object({
    type: z.literal('hybrid'),
    localWeight: z.number().min(0).max(1).default(0.7),
    remoteEndpoints: z.array(RemoteEndpointSchema).min(1),
  }),
]);

export function loadConfig(): ContainerConfig {
  return {
    pool: PoolConfigSchema.parse({
      minIdle: parseInt(process.env.LIQUID_POOL_MIN_IDLE ?? '3'),
      maxTotal: parseInt(process.env.LIQUID_POOL_MAX_TOTAL ?? '20'),
      idleTimeout: parseInt(process.env.LIQUID_POOL_IDLE_TIMEOUT ?? '300000'),
      acquireTimeout: parseInt(process.env.LIQUID_POOL_ACQUIRE_TIMEOUT ?? '30000'),
      healthInterval: parseInt(process.env.LIQUID_POOL_HEALTH_INTERVAL ?? '10000'),
    }),
    resources: ResourceLimitsSchema.parse({
      memory: parseInt(process.env.LIQUID_CONTAINER_MEMORY ?? '536870912'),
      cpuQuota: parseFloat(process.env.LIQUID_CONTAINER_CPU ?? '0.5'),
      pidsLimit: parseInt(process.env.LIQUID_CONTAINER_PIDS ?? '100'),
    }),
    image: process.env.LIQUID_CONTAINER_IMAGE ?? 'liquid-container:latest',
    placement: parsePlacement(),
  };
}
```

### 5.3 Settings File (Optional Override)

```yaml
# .liquid/container.yaml (optional, overrides env vars)

pool:
  minIdle: 5
  maxTotal: 50
  idleTimeout: 600000

resources:
  memory: 1073741824  # 1GB
  cpuQuota: 1.0
  pidsLimit: 200

placement:
  type: hybrid
  localWeight: 0.3
  remoteEndpoints:
    - id: hetzner-fsn1
      url: ssh://deploy@hetzner-1.example.com
      maxContainers: 20
      weight: 2
      labels:
        region: eu-central
        tier: standard

    - id: hetzner-nbg1
      url: ssh://deploy@hetzner-2.example.com
      maxContainers: 20
      weight: 2
      labels:
        region: eu-central
        tier: standard

networkPolicy:
  mode: restricted
  allowedHosts:
    - api.anthropic.com
    - api.google.com
    - api.openai.com
    - registry.npmjs.org

secrets:
  backend: vault
  config:
    address: https://vault.example.com
    role: liquid-container
```

---

## 6. Remote Deployment

### 6.1 Provider-Agnostic Design

LiquidContainer uses Docker's remote API which works with any provider:

| Provider | Connection Method | Cost/hr (2 vCPU, 4GB) | Notes |
|----------|-------------------|----------------------|-------|
| **Hetzner Cloud** | SSH or TCP+TLS | ~$0.012 | Best value, EU-only |
| **Fly.io** | TCP+TLS (wireguard) | ~$0.025 | Global edge network |
| **Railway** | TCP+TLS | ~$0.05 | Simple setup |
| **DigitalOcean** | TCP+TLS | ~$0.03 | Reliable |
| **AWS ECS** | AWS SDK | ~$0.04 | Enterprise features |
| **Bare Metal** | SSH | Fixed cost | Maximum control |

### 6.2 SSH Tunnel Approach (Recommended)

For maximum compatibility, use SSH tunnels to reach Docker daemons:

```typescript
// server/src/container/remote/ssh-tunnel.ts

import { Client } from 'ssh2';
import Dockerode from 'dockerode';
import { createServer } from 'net';

export class SSHTunnel {
  private ssh: Client;
  private localPort: number;
  private server: Server;

  constructor(
    private config: {
      host: string;
      port: number;
      username: string;
      privateKey: string;
      remoteSocket: string; // /var/run/docker.sock
    }
  ) {
    this.ssh = new Client();
  }

  async connect(): Promise<Dockerode> {
    return new Promise((resolve, reject) => {
      this.ssh.on('ready', () => {
        // Create local TCP server that forwards to remote Unix socket
        this.server = createServer((socket) => {
          this.ssh.openssh_forwardOutStreamLocal(
            this.config.remoteSocket,
            (err, stream) => {
              if (err) {
                socket.end();
                return;
              }
              socket.pipe(stream).pipe(socket);
            }
          );
        });

        this.server.listen(0, '127.0.0.1', () => {
          this.localPort = (this.server.address() as any).port;

          const docker = new Dockerode({
            host: '127.0.0.1',
            port: this.localPort,
          });

          resolve(docker);
        });
      });

      this.ssh.on('error', reject);

      this.ssh.connect({
        host: this.config.host,
        port: this.config.port,
        username: this.config.username,
        privateKey: this.config.privateKey,
      });
    });
  }

  async disconnect(): Promise<void> {
    this.server?.close();
    this.ssh.end();
  }
}
```

### 6.3 Setup Script for Remote Hosts

```bash
#!/bin/bash
# scripts/setup-remote-host.sh
# Run on each remote server to prepare for LiquidContainer

set -euo pipefail

# Install Docker
curl -fsSL https://get.docker.com | sh

# Create deploy user with Docker access
useradd -m -s /bin/bash -G docker deploy

# Configure SSH for deploy user
mkdir -p /home/deploy/.ssh
chmod 700 /home/deploy/.ssh

# Add your public key (replace with actual key)
echo "YOUR_PUBLIC_KEY_HERE" >> /home/deploy/.ssh/authorized_keys
chmod 600 /home/deploy/.ssh/authorized_keys
chown -R deploy:deploy /home/deploy/.ssh

# Pull base image
docker pull ghcr.io/yourusername/liquid-container:latest

# Configure Docker daemon for production
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
  }
}
EOF

systemctl restart docker

echo "Remote host ready for LiquidContainer"
```

### 6.4 Load Balancing Algorithm

```typescript
// server/src/container/scheduler.ts

export class ContainerScheduler {
  private endpoints: Map<string, EndpointState> = new Map();

  /**
   * Select best endpoint for new container
   * Uses weighted random with health penalties
   */
  selectEndpoint(affinity?: AffinityRule[]): RemoteEndpoint {
    const candidates = this.getCandidates(affinity);

    if (candidates.length === 0) {
      throw new Error('No available endpoints match affinity rules');
    }

    // Calculate effective weights
    const weights = candidates.map(c => {
      const state = this.endpoints.get(c.id)!;
      let weight = c.weight;

      // Penalize based on current load (0-50% penalty)
      const loadRatio = state.activeContainers / c.maxContainers;
      weight *= (1 - loadRatio * 0.5);

      // Penalize based on recent failures (0-90% penalty)
      const failureRate = state.recentFailures / (state.recentRequests || 1);
      weight *= (1 - failureRate * 0.9);

      // Penalize based on latency (0-30% penalty for >500ms)
      const latencyPenalty = Math.min((state.avgLatency - 100) / 1000, 0.3);
      weight *= (1 - Math.max(0, latencyPenalty));

      return { endpoint: c, weight: Math.max(0.01, weight) };
    });

    // Weighted random selection
    const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
    let random = Math.random() * totalWeight;

    for (const { endpoint, weight } of weights) {
      random -= weight;
      if (random <= 0) {
        return endpoint;
      }
    }

    return weights[0].endpoint;
  }

  /**
   * Filter endpoints by affinity rules
   */
  private getCandidates(affinity?: AffinityRule[]): RemoteEndpoint[] {
    let candidates = Array.from(this.endpoints.values())
      .filter(e => e.activeContainers < e.maxContainers)
      .map(e => e.config);

    if (!affinity) return candidates;

    for (const rule of affinity) {
      candidates = candidates.filter(c => {
        switch (rule.operator) {
          case 'In':
            return rule.values.includes(c.labels[rule.key]);
          case 'NotIn':
            return !rule.values.includes(c.labels[rule.key]);
          case 'Exists':
            return rule.key in c.labels;
          case 'DoesNotExist':
            return !(rule.key in c.labels);
        }
      });
    }

    return candidates;
  }
}
```

---

## 7. Security Model

### 7.1 Defense in Depth

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Layer 1: Network Isolation                                                   │
│ - Containers run in isolated Docker network                                  │
│ - Egress restricted to allowlist (LIQUID_ALLOWED_HOSTS)                     │
│ - No direct inbound connections from internet                               │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
┌─────────────────────────────────────────────────────────────────────────────┐
│ Layer 2: Process Isolation                                                   │
│ - Non-root user inside container                                            │
│ - no-new-privileges security option                                         │
│ - Read-only root filesystem (optional)                                      │
│ - PID limit prevents fork bombs                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
┌─────────────────────────────────────────────────────────────────────────────┐
│ Layer 3: Resource Limits                                                     │
│ - Memory limits (OOM killed if exceeded)                                    │
│ - CPU quota (throttled, not killed)                                         │
│ - Execution timeout (SIGKILL after limit)                                   │
│ - Disk quota (where supported)                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
┌─────────────────────────────────────────────────────────────────────────────┐
│ Layer 4: Secrets Management                                                  │
│ - Secrets never in environment variables                                    │
│ - Injected at runtime via /secrets tmpfs mount                             │
│ - Rotated automatically, cleared on container reset                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Network Policy

```typescript
// server/src/container/network.ts

export async function createSecureNetwork(docker: Dockerode): Promise<string> {
  const network = await docker.createNetwork({
    Name: 'liquid-agents',
    Driver: 'bridge',
    Internal: false, // Allow outbound
    IPAM: {
      Config: [{ Subnet: '172.28.0.0/16' }],
    },
    Options: {
      'com.docker.network.bridge.enable_ip_masquerade': 'true',
    },
  });

  return network.id;
}

export function getIptablesRules(allowedHosts: string[]): string[] {
  // Restrict egress to specific hosts
  return [
    // Allow DNS
    '-A OUTPUT -p udp --dport 53 -j ACCEPT',
    // Allow established connections
    '-A OUTPUT -m state --state ESTABLISHED,RELATED -j ACCEPT',
    // Allow specific hosts
    ...allowedHosts.map(host =>
      `-A OUTPUT -d ${host} -j ACCEPT`
    ),
    // Drop everything else
    '-A OUTPUT -j DROP',
  ];
}
```

### 7.3 Secrets Injection

```typescript
// server/src/container/secrets.ts

export interface SecretsProvider {
  getSecret(name: string): Promise<string>;
  rotateSecret(name: string): Promise<void>;
}

export class VaultSecretsProvider implements SecretsProvider {
  async getSecret(name: string): Promise<string> {
    // Fetch from HashiCorp Vault
  }
}

export class EnvSecretsProvider implements SecretsProvider {
  async getSecret(name: string): Promise<string> {
    // Read from prefixed environment variables
    const value = process.env[`LIQUID_SECRET_${name.toUpperCase()}`];
    if (!value) throw new Error(`Secret ${name} not found`);
    return value;
  }
}

/**
 * Inject secrets into container via tmpfs mount
 * Secrets are never written to disk
 */
export async function injectSecrets(
  container: PooledContainer,
  secretNames: string[],
  provider: SecretsProvider
): Promise<void> {
  const secrets: Record<string, string> = {};

  for (const name of secretNames) {
    secrets[name] = await provider.getSecret(name);
  }

  // Write to container's /secrets tmpfs mount
  await container.exec([
    'sh', '-c',
    `echo '${JSON.stringify(secrets)}' > /secrets/secrets.json && chmod 600 /secrets/secrets.json`
  ]);
}
```

---

## 8. Observability

### 8.1 Metrics

```typescript
// server/src/container/metrics.ts

import { metrics } from '@opentelemetry/api';

const meter = metrics.getMeter('liquid-container');

export const containerMetrics = {
  poolSize: meter.createObservableGauge('liquid.container.pool.size', {
    description: 'Number of containers in pool by state',
  }),

  acquireLatency: meter.createHistogram('liquid.container.acquire.duration', {
    description: 'Time to acquire a container from pool',
    unit: 'ms',
  }),

  executionDuration: meter.createHistogram('liquid.container.execution.duration', {
    description: 'Container task execution duration',
    unit: 'ms',
  }),

  containerCreations: meter.createCounter('liquid.container.creations.total', {
    description: 'Total containers created',
  }),

  containerDestructions: meter.createCounter('liquid.container.destructions.total', {
    description: 'Total containers destroyed',
  }),

  healthCheckFailures: meter.createCounter('liquid.container.health.failures', {
    description: 'Health check failures by endpoint',
  }),
};
```

### 8.2 Distributed Tracing

```typescript
// server/src/container/tracing.ts

import { trace, SpanKind, SpanStatusCode } from '@opentelemetry/api';

const tracer = trace.getTracer('liquid-container');

export async function withContainerSpan<T>(
  name: string,
  containerId: string,
  fn: () => Promise<T>
): Promise<T> {
  return tracer.startActiveSpan(
    name,
    { kind: SpanKind.INTERNAL },
    async (span) => {
      span.setAttribute('container.id', containerId);

      try {
        const result = await fn();
        span.setStatus({ code: SpanStatusCode.OK });
        return result;
      } catch (error) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: (error as Error).message,
        });
        throw error;
      } finally {
        span.end();
      }
    }
  );
}
```

### 8.3 Structured Logging

```typescript
// server/src/container/logger.ts

import { componentLoggers } from '../logger.js';

export const containerLog = componentLoggers.http.child({ component: 'container' });

// Usage examples:
containerLog.info({ containerId, endpointId }, 'Container created');
containerLog.warn({ containerId, healthStatus }, 'Container unhealthy');
containerLog.error({ containerId, error: err.message }, 'Container execution failed');
```

---

## 9. Implementation Phases

### Phase 1: Local Foundation (Week 1-2)

**Goal:** Replace mock `executeAgent()` with real container execution locally.

**Deliverables:**
- [ ] Base Docker image (`Dockerfile.base`, `Dockerfile`)
- [ ] Runtime server (`container/runtime-server/`)
- [ ] Pool manager with local Docker (`server/src/container/pool.ts`)
- [ ] Configuration loader (`server/src/container/config.ts`)
- [ ] Integration with existing orchestrator

**Tests:**
- Unit tests for pool lifecycle
- Integration tests with local Docker
- Performance benchmarks (acquire latency)

**Acceptance Criteria:**
- `acquire()` < 100ms from warm pool
- `acquire()` < 3s cold start
- All existing orchestrator tests pass

### Phase 2: Security Hardening (Week 3)

**Goal:** Production-grade security for untrusted code execution.

**Deliverables:**
- [ ] Network isolation (`server/src/container/network.ts`)
- [ ] Secrets injection (`server/src/container/secrets.ts`)
- [ ] Resource enforcement validation
- [ ] Audit logging

**Tests:**
- Network isolation verification
- Resource limit tests (OOM, CPU throttle)
- Secret cleanup verification

**Acceptance Criteria:**
- Containers cannot reach unauthorized hosts
- Secrets are not persisted to disk
- Resource limits are enforced

### Phase 3: Remote Execution (Week 4-5)

**Goal:** Seamlessly execute containers on remote hosts.

**Deliverables:**
- [ ] SSH tunnel implementation
- [ ] Multi-endpoint pool manager
- [ ] Scheduler with weighted load balancing
- [ ] Remote host setup script

**Tests:**
- SSH tunnel reliability
- Cross-endpoint container migration
- Failover behavior

**Acceptance Criteria:**
- Transparent local/remote execution
- Automatic failover on endpoint failure
- < 500ms latency overhead for remote

### Phase 4: Observability & Operations (Week 6)

**Goal:** Production visibility and operational tooling.

**Deliverables:**
- [ ] OpenTelemetry integration
- [ ] Grafana dashboard template
- [ ] CLI tooling (`liquid-container` command)
- [ ] Documentation

**Tests:**
- Metrics accuracy
- Trace propagation

**Acceptance Criteria:**
- Full visibility into container lifecycle
- Alerts for pool exhaustion
- Easy debugging of failed executions

---

## 10. File Structure

```
server/
├── src/
│   ├── container/
│   │   ├── index.ts              # Main exports
│   │   ├── types.ts              # Type definitions
│   │   ├── config.ts             # Configuration loader
│   │   ├── pool.ts               # Container pool manager
│   │   ├── scheduler.ts          # Endpoint selection
│   │   ├── client.ts             # Runtime server client
│   │   ├── network.ts            # Network policy
│   │   ├── secrets.ts            # Secrets injection
│   │   ├── metrics.ts            # OpenTelemetry metrics
│   │   ├── tracing.ts            # Distributed tracing
│   │   └── remote/
│   │       ├── ssh-tunnel.ts     # SSH tunnel for remote Docker
│   │       └── tls-client.ts     # TCP+TLS Docker client
│   │
│   └── orchestrator/
│       └── index.ts              # Updated to use container pool
│
├── container/
│   ├── Dockerfile.base           # Base image
│   ├── Dockerfile                # Runtime image
│   └── runtime-server/
│       ├── package.json
│       ├── server.ts             # HTTP server
│       ├── executor.ts           # Command execution
│       └── types.ts              # Request/response types
│
├── scripts/
│   ├── setup-remote-host.sh      # Remote host provisioning
│   ├── build-container.sh        # Image build script
│   └── container-cli.ts          # Operational CLI
│
└── tests/
    └── unit/
        ├── container-pool.test.ts
        ├── container-scheduler.test.ts
        ├── container-security.test.ts
        └── container-remote.test.ts

.liquid/
├── container.yaml                # Optional config override

.github/
└── workflows/
    └── container-build.yml       # CI for container images
```

---

## Appendix A: Quick Start

### A.1 Local Development

```bash
# Build base image
cd server/container
docker build -f Dockerfile.base -t liquid-container-base:latest .
docker build -t liquid-container:latest .

# Run with local pool
cd server
LIQUID_PLACEMENT_STRATEGY=local bun run dev
```

### A.2 Remote Deployment

```bash
# Provision remote host
ssh root@your-server.com < scripts/setup-remote-host.sh

# Configure endpoint
export LIQUID_PLACEMENT_STRATEGY=remote
export LIQUID_REMOTE_ENDPOINTS='[{"id":"server-1","url":"ssh://deploy@your-server.com","maxContainers":10,"weight":1}]'

# Start orchestrator
bun run server
```

### A.3 Hybrid Mode

```bash
# Use both local and remote
export LIQUID_PLACEMENT_STRATEGY=hybrid
export LIQUID_PLACEMENT_LOCAL_WEIGHT=0.3
export LIQUID_REMOTE_ENDPOINTS='[...]'

bun run server
```

---

## Appendix B: Cost Optimization

### B.1 Hetzner Cloud Recommendation

For cost-sensitive deployments, Hetzner Cloud offers the best value:

| Instance | vCPU | RAM | Disk | Price/mo | Containers |
|----------|------|-----|------|----------|------------|
| CX22 | 2 | 4GB | 40GB | €4.35 | 4-6 |
| CX32 | 4 | 8GB | 80GB | €8.98 | 10-14 |
| CX42 | 8 | 16GB | 160GB | €17.98 | 20-28 |

**Recommended Setup:**
- 3x CX32 instances across 2 regions (FSN1, NBG1)
- Total: 30-42 containers, €26.94/month
- Redundancy: Any instance can fail without service disruption

### B.2 Spot Instance Strategy

For burstable workloads, use spot/preemptible instances:

```yaml
# .liquid/container.yaml
placement:
  type: hybrid
  localWeight: 0.2  # Keep some local for reliability
  remoteEndpoints:
    - id: spot-1
      url: ssh://deploy@spot-instance-1
      maxContainers: 20
      weight: 3
      labels:
        tier: spot
    - id: reserved-1
      url: ssh://deploy@reserved-instance
      maxContainers: 5
      weight: 1
      labels:
        tier: reserved
```

---

## Appendix C: Comparison with Alternatives

| Feature | LiquidContainer | AWS ECS | Kubernetes | Firecracker |
|---------|-----------------|---------|------------|-------------|
| Startup Time | ~100ms (warm) | 2-5s | 5-30s | 125ms |
| Min Cost | Free (local) | ~$50/mo | ~$70/mo | ~$20/mo |
| Complexity | Low | Medium | High | Medium |
| Multi-cloud | Yes | No | Yes | No |
| Warm Pool | Built-in | Custom | Custom | Custom |
| Nested Docker | Yes | No | Yes | No |

LiquidContainer is purpose-built for AI agent workloads, not general container orchestration. This focus allows for optimizations (warm pools, fast recycling) that generic platforms don't provide.
