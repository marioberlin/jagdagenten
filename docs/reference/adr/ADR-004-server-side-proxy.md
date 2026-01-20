# ADR-004: Server-Side Proxy for API Key Protection

## Status

Accepted

## Context

The application uses AI services (Google Gemini, Anthropic Claude) that require API keys. Client-side API calls would expose these keys in the browser.

## Decision

We implemented a server-side proxy that:
1. Keeps API keys server-side
2. Routes requests to AI providers
3. Handles authentication transparently
4. Adds security headers and rate limiting

### Architecture

```
Client → Proxy Server → AI Provider
          ↓
    API Key (never exposed)
```

### Implementation

```typescript
// Express proxy server
app.post('/api/v1/chat', async (req, res) => {
  const { provider = 'gemini' } = req.body;

  // Server has access to keys via environment variables
  const apiKey = provider === 'claude'
    ? process.env.ANTHROPIC_API_KEY
    : process.env.GEMINI_API_KEY;

  // Forward request to provider
  const response = await fetch(providerUrl, {
    headers: { Authorization: `Bearer ${apiKey}` }
  });

  // Stream response back to client
  res.send(response.body);
});
```

## Consequences

### Positive

- API keys never exposed to client
- Can add caching layer
- Rate limiting protects API quotas
- Centralized error handling
- Can add request logging

### Negative

- Additional server complexity
- Latency added (extra hop)
- Server must be deployed and available

## References

- [Server Source](../../server/src/index.ts)
- [API Documentation](../../server/docs/API.md)
- [Security Features](../../server/src/index.ts#security-middleware)
