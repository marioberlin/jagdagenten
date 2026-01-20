# ADR-006: Distributed WebSocket Architecture

## Status
**Proposed** - January 2026

## Context

The current `WebSocketManager` stores all client connections in an in-memory `Map`:

```typescript
class WebSocketManager {
    private clients: Map<string, WebSocket> = new Map();
    private subscriptions: Map<string, Subscription> = new Map();
}
```

This architecture has scaling limitations:

1. **Single Server**: All WebSocket connections must go to one server instance
2. **No Failover**: If the server crashes, all connections are lost
3. **Memory Bound**: Maximum connections limited by single server's memory
4. **Load Balancing**: Cannot distribute WebSocket load across instances

As LiquidCrypto grows, we need horizontal scaling for:
- Price feed broadcasts to thousands of concurrent users
- Real-time chat across multiple server regions
- High availability with zero-downtime deployments

## Decision

Implement a **Redis Pub/Sub based distributed WebSocket architecture**:

```
┌─────────────────────────────────────────────────────────────┐
│                        Redis Pub/Sub                         │
│                                                              │
│   Channel: ws:broadcast          Channel: ws:instance:*      │
│   ┌───────────────────┐          ┌───────────────────┐      │
│   │  Message Payload  │          │ Instance Heartbeat│      │
│   └─────────┬─────────┘          └───────────────────┘      │
│             │                                                │
└─────────────┼────────────────────────────────────────────────┘
              │
    ┌─────────┴─────────┬─────────────────┐
    │                   │                 │
    ▼                   ▼                 ▼
┌───────────┐     ┌───────────┐     ┌───────────┐
│ Instance 1│     │ Instance 2│     │ Instance 3│
│           │     │           │     │           │
│ Clients:  │     │ Clients:  │     │ Clients:  │
│ A, B, C   │     │ D, E, F   │     │ G, H, I   │
└───────────┘     └───────────┘     └───────────┘
```

### Core Components

1. **DistributedWebSocketManager**: Extends base manager with Redis integration
2. **Redis Pub/Sub**: Message bus for cross-instance communication
3. **Redis Sets**: Subscription state storage (`subs:{symbol}` → client IDs)
4. **Instance Heartbeat**: Health monitoring for connected instances

### Message Flow

```typescript
// Client on Instance 1 broadcasts
client.broadcast({ type: 'chat', message: 'hello' });

// 1. Publish to Redis
redis.publish('ws:broadcast', JSON.stringify({
    sourceInstance: 'instance-1',
    payload: { type: 'chat', message: 'hello' },
    excludeIds: ['client-abc']
}));

// 2. All instances receive (including source)
redis.subscribe('ws:broadcast', (message) => {
    const data = JSON.parse(message);

    // 3. Skip if from self
    if (data.sourceInstance === this.instanceId) return;

    // 4. Broadcast to local clients
    this.localBroadcast(data.payload, data.excludeIds);
});
```

## Consequences

### Positive

1. **Horizontal Scaling**: Add instances as needed
2. **High Availability**: Clients reconnect to healthy instances
3. **Geographic Distribution**: Deploy instances in multiple regions
4. **Zero-Downtime Deploys**: Rolling updates without disconnecting all users

### Negative

1. **Redis Dependency**: Requires Redis for full functionality
2. **Latency**: ~1-5ms added for cross-instance messages
3. **Complexity**: More moving parts to monitor
4. **Cost**: Redis infrastructure costs

### Mitigations

- **Redis Fallback**: Graceful degradation to local-only when Redis unavailable
- **Latency**: Use Redis in same region/datacenter
- **Complexity**: Comprehensive logging and monitoring
- **Cost**: Redis is relatively cheap; can use managed services

## Alternatives Considered

### 1. Sticky Sessions with Load Balancer

Configure load balancer to route same client to same server.

```nginx
upstream websocket {
    ip_hash;
    server ws1:3001;
    server ws2:3001;
}
```

**Rejected**: Doesn't solve cross-instance broadcasts. Users on different servers can't see each other's messages.

### 2. Dedicated Message Queue (RabbitMQ, Kafka)

Use enterprise message queue for WebSocket coordination.

**Rejected**: Overkill for current scale. Redis Pub/Sub is simpler and sufficient.

### 3. WebSocket Gateway Service (Ably, Pusher)

Outsource WebSocket infrastructure entirely.

**Rejected**: Vendor lock-in, cost at scale, less control over protocol.

### 4. Server-Sent Events Only

Replace WebSocket with SSE for broadcasts, use REST for client→server.

**Rejected**: SSE is one-directional. Need bidirectional for chat, trades.

## Implementation Notes

### Redis Channel Design

| Channel | Purpose | Message Format |
|---------|---------|----------------|
| `ws:broadcast` | Cross-instance message broadcast | `{ sourceInstance, payload, excludeIds }` |
| `ws:instance:{id}:heartbeat` | Instance health | `{ timestamp, clientCount }` |
| `ws:direct:{clientId}` | Direct message to specific client | `{ payload }` |

### Subscription Storage

```
Redis Set: subs:BTC
Members: ["instance1:client-abc", "instance1:client-def", "instance2:client-ghi"]
```

When broadcasting price update for BTC:
1. Get all members of `subs:BTC`
2. Group by instance
3. For local clients: send directly
4. For remote clients: publish to `ws:direct:{clientId}`

### Failover Handling

```typescript
// Client-side reconnection logic
const ws = new ReconnectingWebSocket(url, null, {
    maxRetries: 10,
    reconnectionDelayGrowFactor: 1.5,
    maxReconnectionDelay: 30000,
    minReconnectionDelay: 1000
});

// Server-side: clean up dead subscriptions
setInterval(async () => {
    const deadInstances = await findDeadInstances();
    for (const instance of deadInstances) {
        await cleanupInstanceSubscriptions(instance);
    }
}, 60000);
```

### Configuration

```bash
# Required
REDIS_URL=redis://localhost:6379

# Optional
INSTANCE_ID=server-1              # Auto-generated if not set
WS_HEARTBEAT_INTERVAL=30000       # 30 seconds
WS_DEAD_INSTANCE_THRESHOLD=90000  # 90 seconds
```

## Performance Considerations

| Metric | Single Instance | Distributed (3 instances) |
|--------|-----------------|---------------------------|
| Max Connections | ~10,000 | ~30,000 |
| Broadcast Latency | <1ms | ~5ms (cross-instance) |
| Memory per Instance | ~1GB | ~400MB |
| Redis Ops/sec | N/A | ~1,000-10,000 |

## Monitoring

Add these metrics:
- `ws_connections_total` (per instance)
- `ws_messages_broadcast_total`
- `ws_redis_latency_ms`
- `ws_cross_instance_messages_total`

## Related Decisions

- ADR-001: 3-Layer Architecture (execution layer for WebSocket)
- ADR-005: Session-Scoped LiquidClient (client identity)

## References

- Redis Pub/Sub: https://redis.io/docs/manual/pubsub/
- Scaling WebSocket: https://ably.com/topic/scaling-websockets
- Bun WebSocket: https://bun.sh/docs/api/websockets
