# Error Codes Documentation

## HTTP Status Codes

| Status Code | Name | Description |
|-------------|------|-------------|
| 200 | OK | Request succeeded |
| 400 | Bad Request | Invalid request parameters |
| 404 | Not Found | Resource not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Server temporarily unavailable |

---

## API Error Responses

### 400 - Validation Error

**When:** Request body fails validation

**Response:**
```json
{
  "error": "Validation Error",
  "details": [
    {
      "type": "field",
      "path": "provider",
      "msg": "Provider must be \"gemini\" or \"claude\""
    }
  ]
}
```

**Common Issues:**
- Invalid `provider` value (must be "gemini" or "claude")
- `messages` is not an array
- Request body exceeds 10KB limit

**Recovery:** Fix the invalid field and retry.

---

### 404 - Not Found

**When:** Route doesn't exist

**Response:**
```json
{
  "error": "Not Found",
  "path": "/api/v2/chat"
}
```

**Recovery:** Use the correct endpoint path (`/api/v1/chat`).

---

### 429 - Rate Limit Exceeded

**When:** Too many requests in the time window

**Response:**
```json
{
  "error": "Chat rate limit exceeded. Please wait before sending more requests.",
  "retryAfter": 15
}
```

**Headers:**
```
RateLimit-Limit: 30
RateLimit-Remaining: 0
RateLimit-Reset: 1704825600
```

**Recovery:** Wait `retryAfter` minutes before retrying.

**Limits:**
- Global: 100 requests per 15 minutes
- Chat API: 30 requests per 15 minutes

---

### 500 - Internal Server Error

**When:** Unexpected server error

**Development Response:**
```json
{
  "error": "Detailed error message",
  "stack": "Error stack trace..."
}
```

**Production Response:**
```json
{
  "error": "An unexpected error occurred"
}
```

**Recovery:**
1. Check server logs for details
2. Verify API keys are set
3. Retry the request
4. If persistent, open an issue

---

## SSE Event Errors

### Error Event

**Format:**
```
event: error
data: {"message": "Error description"}
```

**Common Causes:**
- Invalid API key
- API rate limits (provider-side)
- Network interruption
- Model unavailable

**Recovery:**
1. Verify API keys in `.env`
2. Check provider service status
3. Retry with exponential backoff

---

## Client-Side Errors

### ERR_CONNECTION_REFUSED

**When:** Cannot connect to server

**Cause:** Server not running or wrong port

**Recovery:** Start server with `./start.sh`

---

### CORS Error

**When:** Origin not allowed

**Console:**
```
Access to fetch at 'http://localhost:3000/api/v1/chat' from origin 'http://localhost:8080' has been blocked by CORS policy
```

**Recovery:** Add origin to `ALLOWED_ORIGINS` in `.env`

---

## Error Code Reference

| Code | Message | HTTP Status | Recovery |
|------|---------|-------------|----------|
| VAL001 | Invalid provider | 400 | Use "gemini" or "claude" |
| VAL002 | Messages must be array | 400 | Wrap messages in array |
| VAL003 | Request too large | 400 | Reduce payload size |
| RAT001 | Global rate limit | 429 | Wait 15 minutes |
| RAT002 | Chat rate limit | 429 | Wait 15 minutes |
| SVR001 | Internal error | 500 | Check logs, retry |
| SVR002 | Provider error | 500 | Verify API keys |
| NOT001 | Not found | 404 | Check endpoint path |

---

## Debugging Tips

### Enable Verbose Logging

```bash
# In development, the bootstrap script handles logging
./start.sh
```

### Check Server Health

```bash
curl http://localhost:3000/health
```

### Test API Key

```bash
curl -X POST http://localhost:3000/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"provider": "gemini", "messages": [{"role": "user", "content": "test"}]}'
```

---

## Contact Support

If you encounter errors not documented here:
1. Check server logs
2. Note the error code and message
3. Open an issue with reproduction steps
