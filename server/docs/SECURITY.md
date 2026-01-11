# Security Documentation - LiquidCrypto

## Security Score

Current security score: **90/100** ✅

---

## Security Features Implemented

### 1. Security Headers

All responses include these security headers:

| Header | Value | Protection |
|--------|-------|------------|
| `X-Content-Type-Options` | `nosniff` | MIME type sniffing |
| `X-Frame-Options` | `DENY` | Clickjacking |
| `X-XSS-Protection` | `1; mode=block` | XSS filtering |
| `Content-Security-Policy` | See below | XSS, injection attacks |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Privacy |
| `Permissions-Policy` | Restricted | Feature access control |
| `Strict-Transport-Security` | `max-age=31536000` | HTTPS enforcement |

### 2. Input Validation

- **Request size limit**: 10KB max
- **XSS protection**: Detects `<script>`, `javascript:`, `on*=`
- **Injection protection**: Sanitizes special characters
- **API key validation**: Format and length checks

### 3. Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| Chat API | 30 requests | 15 minutes |
| Global | 100 requests | 15 minutes |

### 4. CORS Configuration

- Configurable allowed origins
- Explicit allowed methods and headers
- Credentials support

---

## Running Security Audit

```bash
# Run the automated security audit
curl http://localhost:3000/api/v1/security/audit

# Response:
{
  "score": 90,
  "checks": {
    "headers": "PASS",
    "cors": "PASS",
    "rateLimit": "PASS",
    "validation": "PASS",
    "apiKeys": "PASS"
  },
  "recommendations": [
    "Consider enabling Redis for production rate limiting"
  ]
}
```

---

## Environment Variables

### Required for Production

```bash
# API Keys
ANTHROPIC_API_KEY=sk-ant-api03-...  # Anthropic Claude
GEMINI_API_KEY=AIza...              # Google Gemini

# Redis (for caching and rate limiting)
REDIS_URL=redis://localhost:6379

# CORS
ALLOWED_ORIGINS=https://your-domain.com

# Security
NODE_ENV=production
```

### Optional

```bash
# Rate limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=900000  # 15 minutes

# Cache
CACHE_TTL_AI=3600         # 1 hour
CACHE_TTL_PRICE=10        # 10 seconds
CACHE_TTL_PORTFOLIO=30    # 30 seconds
```

---

## Security Best Practices

### 1. API Key Management

- Never commit API keys to git
- Use environment variables
- Rotate keys periodically
- Use read-only keys where possible

### 2. Network Security

- Use HTTPS in production
- Configure firewall rules
- Limit exposed ports
- Use VPN for admin access

### 3. Data Protection

- Encrypt sensitive data at rest
- Use HTTPS for all communications
- Implement proper access controls
- Regular backups

### 4. Monitoring

- Log all authentication attempts
- Monitor for unusual patterns
- Set up alerts for security events
- Regular security audits

---

## Vulnerability Reporting

If you find a security vulnerability, please:

1. Do not disclose publicly
2. Contact the development team
3. Provide detailed reproduction steps
4. Allow time for remediation

---

## Compliance

This implementation follows security best practices:

- [x] OWASP Top 10 awareness
- [x] Input validation
- [x] Output encoding
- [x] Authentication controls
- [x] Session management
- [x] Access control
- [x] Cryptographic practices
- [x] Error handling
- [x] Data protection
- [x] Communication security

---

## Future Improvements

1. **WebAuthn/FIDO2** - Passwordless authentication
2. **OAuth 2.0** - Third-party login
3. **JWT verification** - Token-based auth
4. **Audit logging** - Comprehensive access logs
5. **Intrusion detection** - Anomaly detection
6. **Penetration testing** - Regular security tests
