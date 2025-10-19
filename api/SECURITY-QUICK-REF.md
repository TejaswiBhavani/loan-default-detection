# Security Quick Reference

## 🚨 Emergency Contacts
- **Security Issues**: security@example.com
- **On-Call**: +1-XXX-XXX-XXXX

## 🔑 Critical Environment Variables

```bash
# MUST be set for production
NODE_ENV=production
JWT_SECRET=<32+ chars>
JWT_REFRESH_SECRET=<32+ chars, different from JWT_SECRET>
DB_PASSWORD=<strong password>
CORS_ORIGIN=<specific domains, NO spaces>
TRUST_PROXY=true  # if behind reverse proxy
```

## 🛡️ Security Layers (in order of execution)

1. **Trust Proxy** - Recognize IPs behind reverse proxy
2. **Helmet** - Security headers (CSP, HSTS, etc.)
3. **IP Filtering** - Block blacklisted IPs
4. **Request ID** - Track requests
5. **CORS** - Control cross-origin access
6. **Body Parsing** - Limit request size (10MB)
7. **Content-Type Validation** - Ensure proper formats
8. **XSS Detection** - Block XSS attempts
9. **SQL Injection Detection** - Block SQL injection
10. **Path Traversal Detection** - Block directory traversal
11. **Input Sanitization** - Clean input data
12. **Logging** - Request/security event logging
13. **Performance Monitoring** - Track slow requests
14. **Metrics** - Collect statistics
15. **Rate Limiting** - Prevent abuse

## 📊 Rate Limits

| Endpoint Type | Limit | Window |
|--------------|-------|--------|
| General API | 100 req | 15 min |
| Auth (/login, /register) | 5 req | 15 min |
| Predictions | 10 req | 1 min |
| Queries | 30 req | 1 min |
| Account Creation | 3 req | 1 hour |

## 🔍 Security Event Types

```javascript
securityLogger.authFailure(req, 'Invalid credentials');
securityLogger.authSuccess(req, userId);
securityLogger.suspiciousActivity(req, 'XSS attempt detected', payload);
securityLogger.rateLimitExceeded(req);
securityLogger.validationFailure(req, errors);
securityLogger.unauthorizedAccess(req, resource);
```

## 📝 Log File Locations

```
logs/
├── access.log      # All requests (Morgan + custom)
├── pm2-error.log   # PM2 error logs (if using PM2)
└── pm2-out.log     # PM2 output logs (if using PM2)
```

## 🧪 Quick Tests

### Test Rate Limiting
```bash
for i in {1..120}; do curl http://localhost:5000/api; done
```

### Test XSS Protection
```bash
curl -X POST http://localhost:5000/api \
  -H "Content-Type: application/json" \
  -d '{"test": "<script>alert(1)</script>"}'
```

### Check Health & Metrics
```bash
curl http://localhost:5000/health | jq
```

### Check Security Headers
```bash
curl -I http://localhost:5000/health
```

## 🚀 Quick Start Commands

```bash
# Validate deployment configuration
./scripts/validate-deployment.sh

# Run security tests
./tests/security-tests.sh

# Start server
npm start

# Start with PM2 (production)
pm2 start ecosystem.config.js

# View logs
pm2 logs loan-api
tail -f logs/access.log

# Monitor in real-time
pm2 monit
```

## 🔧 Common Configuration Issues

### Rate Limiting Not Working?
- Set `TRUST_PROXY=true` in .env
- Ensure nginx passes X-Real-IP header
- Check reverse proxy configuration

### CORS Errors?
- Add frontend domain to CORS_ORIGIN
- Remove spaces: `domain1.com,domain2.com`
- Set CORS_CREDENTIALS=true for auth

### Logs Not Writing?
- Check LOG_DIRECTORY permissions
- Verify LOG_LEVEL setting
- Create logs directory: `mkdir -p logs`

## 📈 Monitoring Endpoints

| Endpoint | Purpose | Auth Required |
|----------|---------|---------------|
| `/health` | Health check + metrics | No |
| `/api` | API info | No |
| `/api/security-config` | Security config (dev only) | No |

## 🚨 Incident Response

### Suspected Attack
1. Check logs: `tail -f logs/access.log | grep SECURITY`
2. Identify attacking IP
3. Add to IP_BLACKLIST in .env
4. Restart server
5. Document incident

### Rate Limit Abuse
1. Check metrics: `curl localhost:5000/health`
2. Review rate limit violations in logs
3. Adjust rate limits if needed
4. Consider IP blocking

### Data Breach
1. Rotate all secrets immediately
2. Force logout all users (clear refresh tokens)
3. Notify security team
4. Review audit logs
5. Follow incident response plan

## 🔄 Maintenance Schedule

### Daily
- Monitor health endpoint
- Check error logs

### Weekly
- Review security event logs
- Check npm audit: `npm audit`
- Monitor metrics trends

### Monthly
- Update dependencies: `npm update`
- Review rate limit settings
- Audit user access

### Quarterly
- Rotate JWT secrets
- Security audit
- Review and test incident response plan
- Update security documentation

## 📞 Escalation Path

1. **Developer** → Monitor logs, first response
2. **DevOps** → Infrastructure issues, scaling
3. **Security Team** → Security incidents, breaches
4. **Management** → Major incidents, communication

## 🎯 Key Performance Indicators

### Security KPIs
- Rate limit violations per day: < 50
- XSS/SQL injection attempts: Track trends
- Failed auth attempts per IP: < 10/hour
- Average response time: < 100ms
- 99th percentile response time: < 500ms

### Health Thresholds
- Memory usage: < 80%
- CPU usage: < 70%
- Request success rate: > 99%
- Database connection pool: < 80% utilized

## 🔐 Password Requirements

```javascript
// Minimum requirements
- Length: 8+ characters
- Uppercase: 1+ letters
- Lowercase: 1+ letters
- Numbers: 1+ digits
- Special chars: 1+ (!@#$%^&*)
- Bcrypt rounds: 10
```

## 🌐 Environment-Specific Settings

### Development
```bash
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
TRUST_PROXY=false
LOG_LEVEL=debug
DB_SSL=false
```

### Staging
```bash
NODE_ENV=staging
CORS_ORIGIN=https://staging.example.com
TRUST_PROXY=true
LOG_LEVEL=info
DB_SSL=true
```

### Production
```bash
NODE_ENV=production
CORS_ORIGIN=https://app.example.com
TRUST_PROXY=true
LOG_LEVEL=warn
DB_SSL=true
```

## 📚 Documentation Links

- [Full Security Documentation](./docs/SECURITY.md)
- [Security Features README](./README-SECURITY.md)
- [Deployment Checklist](./docs/SECURITY.md#deployment-checklist)
- [API Documentation](./README.md)

## 🆘 Support Channels

- **Slack**: #loan-api-support
- **Email**: support@example.com
- **Documentation**: https://docs.example.com
- **Status Page**: https://status.example.com

---

**Keep this document updated and accessible to all team members!**

Last Updated: January 2024
