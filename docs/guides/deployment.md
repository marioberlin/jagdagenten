# LiquidContainer Remote Deployment Guide

A comprehensive guide to deploying LiquidContainer on various cloud providers and infrastructure platforms.

> [!NOTE]
> **Looking for production server deployment?** See [Production Deployment Guide](../infrastructure/DEPLOYMENT.md) for CI/CD, blue-green deployment, and server migration.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Quick Start](#2-quick-start)
   - [Configuration via Settings UI](#25-configuration-via-settings-ui)
3. [Provider Guides](#3-provider-guides)
   - [Hetzner Cloud](#31-hetzner-cloud-recommended)
   - [DigitalOcean](#32-digitalocean)
   - [Fly.io](#33-flyio)
   - [Railway](#34-railway)
   - [AWS EC2](#35-aws-ec2)
   - [Google Cloud (GCE)](#36-google-cloud-gce)
   - [Azure](#37-azure)
   - [Bare Metal](#38-bare-metal)
4. [Serverless Platforms](#4-serverless-platforms-limitations)
5. [Configuration Reference](#5-configuration-reference)
6. [Networking & Security](#6-networking--security)
7. [Monitoring & Observability](#7-monitoring--observability)
8. [Cost Optimization](#8-cost-optimization)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Overview

### What is LiquidContainer?

LiquidContainer is a container-based runtime for executing AI agents in isolated environments. It provides:

- **Warm pools** for <100ms container acquisition
- **Resource isolation** (memory, CPU, network)
- **Multi-provider support** (local, cloud, hybrid)
- **Automatic scaling** and health monitoring

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        LiquidCrypto Server                       │
│                    (Your main application)                       │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    Container Manager                        │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │ │
│  │  │  Local   │  │ Hetzner  │  │   AWS    │  │  Fly.io  │   │ │
│  │  │  Docker  │  │  Cloud   │  │   EC2    │  │          │   │ │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │ │
│  └───────┼─────────────┼─────────────┼─────────────┼─────────┘ │
└──────────┼─────────────┼─────────────┼─────────────┼───────────┘
           │             │             │             │
           ▼             ▼             ▼             ▼
      ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐
      │Container│   │Container│   │Container│   │Container│
      │  Pool   │   │  Pool   │   │  Pool   │   │  Pool   │
      └─────────┘   └─────────┘   └─────────┘   └─────────┘
```

### Requirements

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| Docker Engine | 20.10+ | 24.0+ |
| Memory | 2GB | 4GB+ |
| CPU | 1 vCPU | 2+ vCPU |
| Disk | 20GB | 40GB+ |
| Network | SSH access | SSH + private network |

---

## 2. Quick Start

### Step 1: Prepare SSH Key

```bash
# Generate a dedicated deploy key (if you don't have one)
ssh-keygen -t ed25519 -C "liquidcontainer-deploy" -f ~/.ssh/liquidcontainer

# View the public key (add this to remote servers)
cat ~/.ssh/liquidcontainer.pub
```

### Step 2: Provision Remote Host

```bash
# Copy setup script to remote host
scp scripts/setup-remote-host.sh root@your-server.com:/tmp/

# Run setup (as root)
ssh root@your-server.com "bash /tmp/setup-remote-host.sh"

# Add your SSH key
ssh root@your-server.com "echo '$(cat ~/.ssh/liquidcontainer.pub)' >> /home/deploy/.ssh/authorized_keys"
```

### Step 3: Configure LiquidCrypto

```bash
# Set environment variables
export LIQUID_PLACEMENT_STRATEGY=hybrid
export LIQUID_PLACEMENT_LOCAL_WEIGHT=0.3
export LIQUID_REMOTE_ENDPOINTS='[
  {
    "id": "your-server",
    "url": "ssh://deploy@your-server.com",
    "maxContainers": 10,
    "weight": 1,
    "labels": { "region": "us-east" }
  }
]'

# Or use a config file
cat > .liquid/container.yaml << 'EOF'
pool:
  minIdle: 5
  maxTotal: 50

placement:
  type: hybrid
  localWeight: 0.3
  remoteEndpoints:
    - id: your-server
      url: ssh://deploy@your-server.com
      maxContainers: 10
      weight: 1
EOF
```

### Step 4: Verify Connection

```bash
# Test SSH connection
ssh -i ~/.ssh/liquidcontainer deploy@your-server.com "docker ps"

# Start LiquidCrypto
bun run server
```

---

## 2.5 Configuration via Settings UI

LiquidCrypto provides a beautiful Settings UI for configuring LiquidContainer without editing config files.

### Accessing Container Settings

1. Open LiquidCrypto in your browser: `http://localhost:5173/os`
2. Click the **Gear icon** (⚙️) in the GlassDock to open Settings
3. Navigate to the **Containers** tab

### Settings UI Overview

The Container Settings panel provides 6 configuration tabs:

| Tab | Purpose |
|-----|---------|
| **Placement** | Choose local, remote, or hybrid deployment strategy |
| **Pool** | Configure warm pool size, timeouts, and container image |
| **Resources** | Set memory, CPU, process limits, and execution timeouts |
| **Network** | Configure network mode and allowed outbound hosts |
| **Secrets** | Choose secrets backend (Environment, Vault, AWS) |
| **Telemetry** | Enable/disable OpenTelemetry tracing |

### Adding Remote Endpoints via UI

1. Go to **Settings > Containers > Placement**
2. Select **Remote** or **Hybrid** placement type
3. Click **+ Add Endpoint**
4. Choose a provider preset (9 options):
   - Hetzner Cloud (Recommended)
   - DigitalOcean
   - Fly.io
   - Railway
   - AWS (EC2/ECS)
   - Google Cloud
   - Microsoft Azure
   - Bare Metal / VPS
   - Custom Endpoint
5. Fill in endpoint details:
   - **Name**: Friendly identifier (e.g., "Production EU")
   - **URL**: Connection URL (e.g., `ssh://deploy@1.2.3.4`)
   - **Max Containers**: Maximum containers for this endpoint
   - **Weight**: Relative priority (higher = more traffic)
   - **SSH Key** (optional): Path to SSH private key
6. Click **Add Endpoint**

### Dashboard View

The Settings UI includes a real-time dashboard showing:

```
┌─────────────────────────────────────────────────────────────┐
│                    Container Dashboard                       │
├─────────────────────────────────────────────────────────────┤
│  📦 Total Capacity    🌐 Endpoints    💾 Memory    🗺️ Mode  │
│       0 / 20              0           512 MB       local    │
└─────────────────────────────────────────────────────────────┘
```

### Configuration Persistence

All settings are automatically saved to browser localStorage under `liquid-container-config`. Changes take effect immediately without server restart.

To export configuration for use in CI/CD or server deployment:

```typescript
// In browser console
const config = JSON.parse(localStorage.getItem('liquid-container-config'));
console.log(JSON.stringify(config.state.config, null, 2));
```

---

## 3. Provider Guides

### 3.1 Hetzner Cloud (Recommended)

**Why Hetzner?**
- Best price/performance ratio in Europe
- Simple API, no hidden costs
- Excellent network performance
- €20 free credits for new accounts

#### Pricing

| Instance | vCPU | RAM | Disk | Price/mo | Containers |
|----------|------|-----|------|----------|------------|
| CX22 | 2 | 4GB | 40GB | €4.35 | 4-6 |
| CX32 | 4 | 8GB | 80GB | €8.98 | 10-14 |
| CX42 | 8 | 16GB | 160GB | €17.98 | 20-28 |
| CX52 | 16 | 32GB | 320GB | €35.98 | 40-56 |

#### Setup

```bash
# Install Hetzner CLI
brew install hcloud  # macOS
# or: curl -o hcloud https://github.com/hetznercloud/cli/releases/...

# Configure API token
hcloud context create liquidcontainer
# Enter your API token from Hetzner Cloud Console

# Create server
hcloud server create \
  --name liquid-agent-1 \
  --type cx32 \
  --image debian-12 \
  --location fsn1 \
  --ssh-key your-key-name

# Get server IP
hcloud server ip liquid-agent-1

# Run setup script
ssh root@<IP> < scripts/setup-remote-host.sh
```

#### Configuration

```yaml
# .liquid/container.yaml
placement:
  type: remote
  endpoints:
    - id: hetzner-fsn1
      url: ssh://deploy@<IP>
      maxContainers: 14
      weight: 2
      labels:
        provider: hetzner
        region: eu-central
        location: fsn1

    # Add multiple for redundancy
    - id: hetzner-nbg1
      url: ssh://deploy@<IP2>
      maxContainers: 14
      weight: 2
      labels:
        provider: hetzner
        region: eu-central
        location: nbg1
```

#### Hetzner-Specific Optimizations

```bash
# On the Hetzner server:

# Enable BBR congestion control (better network performance)
echo "net.core.default_qdisc=fq" >> /etc/sysctl.conf
echo "net.ipv4.tcp_congestion_control=bbr" >> /etc/sysctl.conf
sysctl -p

# Use Hetzner's private network (if you have multiple servers)
# Create via Cloud Console, then:
ip addr add 10.0.0.1/24 dev eth0  # Private IP
```

---

### 3.2 DigitalOcean

#### Pricing

| Droplet | vCPU | RAM | Disk | Price/mo | Containers |
|---------|------|-----|------|----------|------------|
| Basic 2GB | 1 | 2GB | 50GB | $12 | 2-4 |
| Basic 4GB | 2 | 4GB | 80GB | $24 | 6-10 |
| Basic 8GB | 4 | 8GB | 160GB | $48 | 14-20 |
| CPU-Opt 4GB | 2 | 4GB | 25GB | $42 | 8-12 |

#### Setup

```bash
# Install doctl
brew install doctl

# Authenticate
doctl auth init

# Create Droplet
doctl compute droplet create liquid-agent-1 \
  --size s-2vcpu-4gb \
  --image debian-12-x64 \
  --region nyc1 \
  --ssh-keys <your-key-fingerprint> \
  --tag-names liquidcontainer

# Get IP
doctl compute droplet get liquid-agent-1 --format PublicIPv4
```

#### Configuration

```yaml
# .liquid/container.yaml
placement:
  type: remote
  endpoints:
    - id: do-nyc1
      url: ssh://deploy@<IP>
      maxContainers: 10
      weight: 1
      labels:
        provider: digitalocean
        region: us-east
        datacenter: nyc1
```

---

### 3.3 Fly.io

Fly.io runs containers at the edge, but requires a different approach since it manages Docker internally.

**Note:** Fly.io doesn't expose Docker socket directly. You need to run a "Docker-in-Docker" setup or use their Machines API.

#### Recommended: Machines API Approach

```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Create app
fly apps create liquid-container-host

# Create machine
fly machine run \
  --app liquid-container-host \
  --region ord \
  --vm-size shared-cpu-2x \
  --vm-memory 2048 \
  docker:dind \
  --env DOCKER_TLS_CERTDIR="" \
  --privileged
```

#### Configuration

```yaml
# fly.toml
app = "liquid-container-host"
primary_region = "ord"

[build]
  image = "docker:dind"

[env]
  DOCKER_TLS_CERTDIR = ""

[[mounts]]
  source = "docker_data"
  destination = "/var/lib/docker"

[[services]]
  internal_port = 2375
  protocol = "tcp"

  [[services.ports]]
    port = 2375
```

```yaml
# .liquid/container.yaml
placement:
  type: remote
  endpoints:
    - id: fly-ord
      url: tcp://liquid-container-host.fly.dev:2375
      maxContainers: 8
      weight: 1
      labels:
        provider: fly
        region: us-central
```

---

### 3.4 Railway

Railway is great for the main LiquidCrypto server but **not recommended** for container hosts due to:
- No Docker-in-Docker support
- No persistent SSH access
- Container execution limits

**Recommendation:** Use Railway for your main server, but connect to external container hosts (Hetzner, DO, etc.)

---

### 3.5 AWS EC2

#### Pricing (On-Demand, us-east-1)

| Instance | vCPU | RAM | Price/hr | Price/mo | Containers |
|----------|------|-----|----------|----------|------------|
| t3.medium | 2 | 4GB | $0.0416 | ~$30 | 6-10 |
| t3.large | 2 | 8GB | $0.0832 | ~$60 | 12-18 |
| c6i.large | 2 | 4GB | $0.085 | ~$62 | 8-12 |
| c6i.xlarge | 4 | 8GB | $0.17 | ~$124 | 18-26 |

**Spot Instances:** Up to 90% cheaper, but can be interrupted.

#### Setup with AWS CLI

```bash
# Install AWS CLI
brew install awscli

# Configure
aws configure

# Create security group
aws ec2 create-security-group \
  --group-name liquid-container \
  --description "LiquidContainer hosts"

aws ec2 authorize-security-group-ingress \
  --group-name liquid-container \
  --protocol tcp --port 22 --cidr 0.0.0.0/0

# Launch instance
aws ec2 run-instances \
  --image-id ami-0c7217cdde317cfec \
  --instance-type t3.large \
  --key-name your-key \
  --security-groups liquid-container \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=liquid-agent-1}]'

# Get public IP
aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=liquid-agent-1" \
  --query "Reservations[0].Instances[0].PublicIpAddress"
```

#### Configuration

```yaml
# .liquid/container.yaml
placement:
  type: hybrid
  localWeight: 0.2
  remoteEndpoints:
    - id: aws-us-east-1a
      url: ssh://ubuntu@<IP>
      sshUser: ubuntu  # Default for AWS AMIs
      maxContainers: 18
      weight: 2
      labels:
        provider: aws
        region: us-east-1
        az: us-east-1a
        instance_type: t3.large
```

#### AWS-Specific: Using Spot Instances

```bash
# Request spot instance
aws ec2 request-spot-instances \
  --spot-price "0.03" \
  --instance-count 1 \
  --type "persistent" \
  --launch-specification '{
    "ImageId": "ami-0c7217cdde317cfec",
    "InstanceType": "t3.large",
    "KeyName": "your-key",
    "SecurityGroups": ["liquid-container"]
  }'
```

---

### 3.6 Google Cloud (GCE)

#### Pricing (us-central1)

| Machine Type | vCPU | RAM | Price/mo | Containers |
|--------------|------|-----|----------|------------|
| e2-medium | 2 | 4GB | ~$25 | 6-10 |
| e2-standard-2 | 2 | 8GB | ~$49 | 12-18 |
| e2-standard-4 | 4 | 16GB | ~$97 | 24-36 |
| c2-standard-4 | 4 | 16GB | ~$125 | 28-40 |

#### Setup

```bash
# Install gcloud
brew install google-cloud-sdk

# Authenticate
gcloud auth login
gcloud config set project your-project-id

# Create instance
gcloud compute instances create liquid-agent-1 \
  --zone=us-central1-a \
  --machine-type=e2-standard-2 \
  --image-family=debian-12 \
  --image-project=debian-cloud \
  --boot-disk-size=40GB \
  --tags=liquid-container

# Allow SSH
gcloud compute firewall-rules create allow-ssh \
  --allow=tcp:22 \
  --target-tags=liquid-container

# Get IP
gcloud compute instances describe liquid-agent-1 \
  --zone=us-central1-a \
  --format='get(networkInterfaces[0].accessConfigs[0].natIP)'
```

---

### 3.7 Azure

#### Pricing (East US)

| VM Size | vCPU | RAM | Price/mo | Containers |
|---------|------|-----|----------|------------|
| B2s | 2 | 4GB | ~$30 | 6-10 |
| B2ms | 2 | 8GB | ~$60 | 12-18 |
| D2s_v3 | 2 | 8GB | ~$70 | 14-20 |
| D4s_v3 | 4 | 16GB | ~$140 | 28-40 |

#### Setup

```bash
# Install Azure CLI
brew install azure-cli

# Login
az login

# Create resource group
az group create --name liquid-container --location eastus

# Create VM
az vm create \
  --resource-group liquid-container \
  --name liquid-agent-1 \
  --image Debian11 \
  --size Standard_B2ms \
  --admin-username deploy \
  --ssh-key-values ~/.ssh/liquidcontainer.pub

# Get IP
az vm list-ip-addresses \
  --resource-group liquid-container \
  --name liquid-agent-1 \
  --query "[0].virtualMachine.network.publicIpAddresses[0].ipAddress"
```

---

### 3.8 Bare Metal

For maximum performance and cost efficiency at scale.

#### Recommended Providers

| Provider | Location | Specs | Price/mo |
|----------|----------|-------|----------|
| Hetzner Dedicated | Germany/Finland | Ryzen 5600X, 64GB | €47 |
| OVH | France/Canada | Xeon E-2386G, 64GB | €89 |
| Vultr Bare Metal | Global | Xeon E-2286G, 32GB | $120 |
| Scaleway | France | EPYC 7543, 256GB | €290 |

#### Setup

```bash
# Bare metal typically comes with rescue mode
# Boot into rescue, then install OS

# Hetzner installimage (in rescue mode)
installimage -n liquid-agent-1 -r yes -l 0 -p /boot:ext4:1G,lvm:vg0:all -v vg0:root:/:ext4:all

# After reboot, run standard setup
ssh root@<IP> < scripts/setup-remote-host.sh
```

---

## 4. Serverless Platforms (Limitations)

### ⚠️ Not Recommended for Container Hosts

The following platforms are **not suitable** for running LiquidContainer hosts:

| Platform | Reason |
|----------|--------|
| **Vercel** | No Docker support, serverless functions only |
| **Netlify** | No Docker support, static sites + functions only |
| **Cloudflare Workers** | V8 isolates, no container support |
| **AWS Lambda** | No Docker daemon, container images only |
| **Google Cloud Run** | Managed containers, no Docker-in-Docker |

### ✅ Recommended Architecture

```
Vercel/Netlify (Frontend)
        │
        ▼
Railway/Fly.io (API Server)
        │
        ▼
Hetzner/AWS/DO (Container Hosts)
```

---

## 5. Configuration Reference

### Environment Variables

```bash
# Pool Configuration
LIQUID_POOL_MIN_IDLE=3              # Minimum warm containers
LIQUID_POOL_MAX_TOTAL=20            # Maximum containers across all endpoints
LIQUID_POOL_IDLE_TIMEOUT=300000     # 5 minutes before idle container cleanup
LIQUID_POOL_ACQUIRE_TIMEOUT=30000   # 30 seconds to acquire container
LIQUID_POOL_HEALTH_INTERVAL=10000   # 10 second health checks

# Resource Limits (per container)
LIQUID_CONTAINER_MEMORY=536870912   # 512MB
LIQUID_CONTAINER_CPU=0.5            # Half a core
LIQUID_CONTAINER_PIDS=100           # Max processes
LIQUID_MAX_EXECUTION_TIME=300000    # 5 minute timeout

# Container Image
LIQUID_CONTAINER_IMAGE=liquid-container:latest
LIQUID_CONTAINER_REGISTRY=ghcr.io/yourusername

# Placement Strategy
LIQUID_PLACEMENT_STRATEGY=hybrid    # local | remote | hybrid
LIQUID_PLACEMENT_LOCAL_WEIGHT=0.3   # 30% local, 70% remote (for hybrid)

# Remote Endpoints (JSON array)
LIQUID_REMOTE_ENDPOINTS='[
  {
    "id": "hetzner-1",
    "url": "ssh://deploy@1.2.3.4",
    "maxContainers": 10,
    "weight": 2,
    "labels": {"region": "eu", "tier": "standard"}
  }
]'

# Network Security
LIQUID_NETWORK_MODE=bridge
LIQUID_ALLOWED_HOSTS=api.anthropic.com,api.google.com,api.openai.com

# Secrets Backend
LIQUID_SECRETS_BACKEND=env          # env | vault | aws-sm
```

### YAML Configuration

```yaml
# .liquid/container.yaml

pool:
  minIdle: 5
  maxTotal: 100
  idleTimeout: 600000     # 10 minutes
  acquireTimeout: 30000
  healthCheckInterval: 10000
  image: ghcr.io/yourusername/liquid-container:latest

resources:
  memory: 1073741824      # 1GB
  cpuQuota: 1.0           # 1 core
  pidsLimit: 200
  maxExecutionTime: 600000  # 10 minutes

placement:
  type: hybrid
  localWeight: 0.2
  remoteEndpoints:
    # Production cluster
    - id: prod-eu-1
      url: ssh://deploy@prod-eu-1.example.com
      maxContainers: 30
      weight: 3
      labels:
        environment: production
        region: eu-central
        tier: standard

    - id: prod-eu-2
      url: ssh://deploy@prod-eu-2.example.com
      maxContainers: 30
      weight: 3
      labels:
        environment: production
        region: eu-central
        tier: standard

    # Burst capacity (spot instances)
    - id: burst-us-1
      url: ssh://ubuntu@burst-us-1.example.com
      sshUser: ubuntu
      maxContainers: 50
      weight: 1
      labels:
        environment: production
        region: us-east
        tier: spot

network:
  mode: bridge
  allowedHosts:
    - api.anthropic.com
    - api.google.com
    - api.openai.com
    - registry.npmjs.org
    - esm.sh

secrets:
  backend: vault
  config:
    address: https://vault.example.com
    role: liquid-container
```

### Affinity Rules

Route agents to specific endpoints:

```typescript
// In your code
const container = await pool.acquire({
  agentId: 'my-agent',
  affinity: [
    // Must be in EU region
    { key: 'region', operator: 'In', values: ['eu-central', 'eu-west'] },
    // Must not be spot instance for critical workloads
    { key: 'tier', operator: 'NotIn', values: ['spot'] },
    // Must be production environment
    { key: 'environment', operator: 'In', values: ['production'] },
  ],
});
```

---

## 6. Networking & Security

### SSH Key Management

```bash
# Generate dedicated keys per environment
ssh-keygen -t ed25519 -C "liquid-prod" -f ~/.ssh/liquid-prod
ssh-keygen -t ed25519 -C "liquid-staging" -f ~/.ssh/liquid-staging

# Use SSH config for easier management
cat >> ~/.ssh/config << 'EOF'
Host liquid-prod-*
  User deploy
  IdentityFile ~/.ssh/liquid-prod
  StrictHostKeyChecking accept-new

Host liquid-staging-*
  User deploy
  IdentityFile ~/.ssh/liquid-staging
  StrictHostKeyChecking accept-new
EOF
```

### Firewall Rules

```bash
# On remote hosts - only allow SSH from known IPs
ufw default deny incoming
ufw default allow outgoing
ufw allow from <your-server-ip> to any port 22
ufw enable

# For Docker internal traffic (if using private network)
ufw allow from 10.0.0.0/8 to any port 2375
```

### Network Isolation

Containers are isolated by default:
- **Bridge network**: Containers get private IPs
- **Egress whitelist**: Only allowed hosts reachable
- **No inbound**: Containers cannot receive external connections

```yaml
# Strict network policy
network:
  mode: bridge
  allowedHosts:
    - api.anthropic.com
    - api.google.com
  dns:
    - 1.1.1.1
    - 8.8.8.8
```

---

## 7. Monitoring & Observability

### Health Endpoint

```bash
# Check pool status
curl http://localhost:3000/api/v1/container/status
```

Response:
```json
{
  "idle": 5,
  "acquired": 3,
  "total": 8,
  "maxTotal": 20,
  "health": "healthy",
  "byEndpoint": {
    "local": { "idle": 2, "acquired": 1 },
    "hetzner-1": { "idle": 3, "acquired": 2 }
  }
}
```

### Prometheus Metrics

```bash
# If OTEL enabled
curl http://localhost:3000/metrics
```

Key metrics:
- `liquid_container_pool_idle` - Idle containers
- `liquid_container_pool_acquired` - Acquired containers
- `liquid_container_acquire_duration` - Acquisition latency
- `liquid_container_execution_duration` - Execution time
- `liquid_container_errors_total` - Error count

### Remote Host Monitoring

```bash
# On each remote host
liquid-container-status

# Or via SSH from main server
ssh deploy@remote-host liquid-container-status
```

### Grafana Dashboard

Import the provided dashboard:

```json
{
  "title": "LiquidContainer",
  "panels": [
    {
      "title": "Pool Status",
      "type": "stat",
      "targets": [
        { "expr": "liquid_container_pool_idle" },
        { "expr": "liquid_container_pool_acquired" }
      ]
    },
    {
      "title": "Acquisition Latency",
      "type": "graph",
      "targets": [
        { "expr": "histogram_quantile(0.95, liquid_container_acquire_duration_bucket)" }
      ]
    }
  ]
}
```

---

## 8. Cost Optimization

### Multi-Tier Strategy

```yaml
# Production: reliable, always-on
- id: prod-1
  url: ssh://deploy@prod-server
  maxContainers: 20
  weight: 3
  labels:
    tier: production

# Burst: spot/preemptible for overflow
- id: burst-1
  url: ssh://deploy@spot-server
  maxContainers: 50
  weight: 1
  labels:
    tier: burst
```

### Right-Sizing Guide

| Workload | Memory | CPU | Instance Type |
|----------|--------|-----|---------------|
| Light (code gen) | 256MB | 0.25 | Shared CPU |
| Medium (analysis) | 512MB | 0.5 | Standard |
| Heavy (training) | 1-2GB | 1.0 | CPU-optimized |

### Cost Comparison (10 containers, 24/7)

| Provider | Instance | Monthly Cost |
|----------|----------|--------------|
| Hetzner | CX32 | €9 |
| DigitalOcean | Basic 4GB | $24 |
| AWS (On-Demand) | t3.large | $60 |
| AWS (Spot) | t3.large | $18 |
| GCP | e2-standard-2 | $49 |

**Winner:** Hetzner CX32 at €9/month for 10-14 containers

---

## 9. Troubleshooting

### Connection Issues

```bash
# Test SSH connectivity
ssh -v deploy@remote-host

# Test Docker access
ssh deploy@remote-host "docker ps"

# Check Docker socket permissions
ssh deploy@remote-host "ls -la /var/run/docker.sock"
# Should show: srw-rw---- 1 root docker ...
```

### Container Creation Failures

```bash
# Check disk space
ssh deploy@remote-host "df -h"

# Check Docker status
ssh deploy@remote-host "systemctl status docker"

# View Docker logs
ssh deploy@remote-host "journalctl -u docker -n 100"

# Check image availability
ssh deploy@remote-host "docker images | grep liquid-container"
```

### Performance Issues

```bash
# Check host load
ssh deploy@remote-host "top -bn1 | head -20"

# Check network latency
ping -c 10 remote-host

# Check container stats
ssh deploy@remote-host "docker stats --no-stream"
```

### Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `Pool exhausted` | All containers in use | Increase `maxTotal` or add endpoints |
| `Container timeout` | Slow container startup | Check Docker daemon, increase timeout |
| `SSH connection refused` | SSH not running | Verify sshd, check firewall |
| `Permission denied` | Wrong user/key | Check `sshUser`, verify key added |
| `Image not found` | Image not pulled | Run `docker pull` on remote host |

---

## Appendix: Provider Quick Reference

### Create Server Commands

```bash
# Hetzner
hcloud server create --name liquid-1 --type cx32 --image debian-12 --location fsn1

# DigitalOcean
doctl compute droplet create liquid-1 --size s-2vcpu-4gb --image debian-12-x64 --region nyc1

# AWS
aws ec2 run-instances --image-id ami-0c7217cdde317cfec --instance-type t3.large

# GCP
gcloud compute instances create liquid-1 --machine-type=e2-standard-2 --zone=us-central1-a

# Azure
az vm create --resource-group liquid --name liquid-1 --size Standard_B2ms --image Debian11
```

### Get Server IP

```bash
# Hetzner
hcloud server ip liquid-1

# DigitalOcean
doctl compute droplet get liquid-1 --format PublicIPv4

# AWS
aws ec2 describe-instances --filters "Name=tag:Name,Values=liquid-1" --query "Reservations[0].Instances[0].PublicIpAddress"

# GCP
gcloud compute instances describe liquid-1 --format='get(networkInterfaces[0].accessConfigs[0].natIP)'

# Azure
az vm list-ip-addresses --name liquid-1 --query "[0].virtualMachine.network.publicIpAddresses[0].ipAddress"
```

### Destroy Server

```bash
# Hetzner
hcloud server delete liquid-1

# DigitalOcean
doctl compute droplet delete liquid-1

# AWS
aws ec2 terminate-instances --instance-ids i-xxx

# GCP
gcloud compute instances delete liquid-1

# Azure
az vm delete --resource-group liquid --name liquid-1
```
