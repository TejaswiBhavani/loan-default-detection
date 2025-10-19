# Security Features Implementation

## Overview

This API has been enhanced with production-grade security features implementing a defense-in-depth approach with 12+ security layers.

## 🛡️ Security Features

### 1. Security Headers (Helmet.js)
- **Content Security Policy (CSP)**: Prevents XSS attacks by controlling resource loading
- **HTTP Strict Transport Security (HSTS)**: Forces HTTPS connections for 1 year
- **X-Frame-Options**: Prevents clickjacking attacks
- **X-Content-Type-Options**: Prevents MIME type sniffing
- **Referrer Policy**: Controls referrer information
- **Permissions Policy**: Restricts browser features

### 2. Multi-Tiered Rate Limiting
- **General API**: 100 requests per 15 minutes
- **Authentication**: 5 requests per 15 minutes (strictest)
- **Predictions**: 10 requests per minute
- **Query Endpoints**: 30 requests per minute
- **Account Creation**: 3 accounts per hour per IP

### 3. CORS Configuration
- Dynamic origin validation based on environment
- Credentials support for authenticated requests
- Pre-flight request handling

### 4. Input Validation & Sanitization
- **XSS Protection**: Detects and blocks 10+ XSS attack patterns
- **SQL Injection Detection**: Blocks common SQL injection attempts
- **Path Traversal Protection**: Prevents directory traversal attacks
- **Content-Type Validation**: Ensures proper request formats

### 5. Comprehensive Logging
- **Request Logging**: Morgan + custom logger with unique request IDs
- **Security Event Logging**: Authentication failures, suspicious activity, rate limit violations
- **Performance Monitoring**: Tracks slow requests (>1000ms) and large payloads (>1MB)
- **Access Logs**: File-based logging for audit trails

### 6. Metrics Collection
- Real-time request counting
- Response time tracking
- Endpoint-specific statistics
- Health endpoint with metrics summary

### 7. Environment-Based Configuration
- Centralized configuration management
- Environment variable validation
- Secret sanitization for logs
- Development/staging/production modes

## 📁 File Structure

```
api/
├── config/
│   ├── security.js          # Security middleware configurations
│   └── environment.js        # Environment configuration
├── middleware/
│   ├── requestLogger.js      # Request logging & monitoring
│   └── xssProtection.js      # XSS & injection protection
├── docs/
│   └── SECURITY.md           # Comprehensive security documentation
├── tests/
│   └── security-tests.sh     # Security testing script
├── scripts/
│   └── validate-deployment.sh # Deployment validation script
├── .env.example              # Environment configuration template
└── server.js                 # Main server with security integration
```

## 🚀 Quick Start

### 1. Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your configuration
nano .env
```

**Critical variables to set:**
- `JWT_SECRET` (minimum 32 characters)
- `JWT_REFRESH_SECRET` (different from JWT_SECRET)
- `DB_PASSWORD` (strong password)
- `CORS_ORIGIN` (specific domains, not *)
- `NODE_ENV=production`
- `TRUST_PROXY=true` (if behind reverse proxy)

### 2. Generate Secure Secrets

```bash
# Generate JWT secret
openssl rand -base64 32

# Generate refresh secret
openssl rand -base64 32

# Generate session secret
openssl rand -base64 32
```

### 3. Validate Deployment Configuration

```bash
# Run the deployment validation script
./scripts/validate-deployment.sh
```

This will check:
- Environment variables
- Security secrets
- Database configuration
- CORS settings
- Dependencies
- File permissions

### 4. Start the Server

```bash
# Install dependencies
npm install

# Start in production mode
npm start

# Or with PM2 for production
pm2 start server.js --name loan-api
```

### 5. Run Security Tests

```bash
# Test all security features
./tests/security-tests.sh

# Or specify API URL
API_URL=https://api.example.com ./tests/security-tests.sh
```

## 🧪 Testing Security Features

### Manual Testing

#### Test Rate Limiting
```bash
# Send multiple requests quickly
for i in {1..120}; do
  curl http://localhost:5000/api
  echo "Request $i"
done
# Should get 429 Too Many Requests after limit
```

#### Test XSS Protection
```bash
curl -X POST http://localhost:5000/api \
  -H "Content-Type: application/json" \
  -d '{"test": "<script>alert(\"XSS\")</script>"}'
# Should return 400 Bad Request
```

#### Test SQL Injection Detection
```bash
curl -X POST http://localhost:5000/api \
  -H "Content-Type: application/json" \
  -d '{"username": "admin\" OR \"1\"=\"1"}'
# Should return 400 Bad Request
```

#### Test CORS
```bash
curl -I -H "Origin: http://malicious-site.com" \
  http://localhost:5000/api
# Should not include CORS headers for unauthorized origin
```

#### Check Metrics
```bash
curl http://localhost:5000/health
# Should show metrics including request count and response times
```

## 📊 Monitoring

### Health Endpoint
```bash
GET /health
```

Returns:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-06T10:30:00.000Z",
  "uptime": 3600,
  "metrics": {
    "totalRequests": 1250,
    "averageResponseTime": 45.5,
    "requestsPerMinute": 20.8,
    "endpoints": {
      "/api/predictions": { "count": 500, "avgTime": 120.5 },
      "/api/auth/login": { "count": 50, "avgTime": 25.3 }
    }
  }
}
```

### Log Files

- **Access Logs**: `logs/access.log` (Morgan + custom logging)
- **Error Logs**: Captured in access.log with ERROR prefix
- **Security Events**: Logged with SECURITY prefix

### Security Events Logged

1. **Authentication Failures**: Failed login attempts with IP
2. **Authentication Success**: Successful logins with user ID
3. **Suspicious Activity**: XSS/SQL injection attempts
4. **Rate Limit Exceeded**: IP addresses hitting rate limits
5. **Validation Failures**: Invalid input with details
6. **Unauthorized Access**: Permission denied events

## 🔒 Production Deployment Checklist

### Pre-Deployment

- [ ] All environment variables configured in `.env`
- [ ] JWT secrets are at least 32 characters
- [ ] JWT_SECRET and JWT_REFRESH_SECRET are different
- [ ] Database password is strong (20+ characters)
- [ ] CORS_ORIGIN set to specific domains (not *)
- [ ] NODE_ENV=production
- [ ] Database SSL enabled (DB_SSL=true)
- [ ] Dependencies updated (`npm audit fix`)
- [ ] Run `./scripts/validate-deployment.sh` successfully

### Infrastructure

- [ ] HTTPS configured in reverse proxy (nginx/ALB)
- [ ] TRUST_PROXY=true if behind reverse proxy
- [ ] Reverse proxy passes X-Real-IP and X-Forwarded-For headers
- [ ] Firewall rules configured
- [ ] Database accessible only from API server
- [ ] Log rotation configured

### Monitoring & Alerting

- [ ] Set up monitoring for `/health` endpoint
- [ ] Configure alerts for rate limit violations
- [ ] Monitor log files for security events
- [ ] Set up error tracking (e.g., Sentry)
- [ ] Configure uptime monitoring
- [ ] Set up performance monitoring

### Security Hardening

- [ ] File permissions set correctly (`chmod 600 .env`)
- [ ] `.env` in `.gitignore`
- [ ] No secrets committed to version control
- [ ] Regular security audits scheduled
- [ ] Backup strategy in place
- [ ] Incident response plan documented

## 🔧 Configuration Examples

### nginx Reverse Proxy Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name api.example.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Security headers (already set by Helmet, but can add more)
    add_header X-Real-IP $remote_addr;

    # Increase client body size to match API limits
    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        
        # Required for rate limiting by IP
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Host $host;
        
        # WebSocket support (if needed)
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Log Rotation Configuration

Create `/etc/logrotate.d/loan-api`:

```
/path/to/loan-api/logs/*.log {
    daily
    rotate 30
    missingok
    notifempty
    compress
    delaycompress
    sharedscripts
    postrotate
        killall -SIGUSR1 node
    endscript
}
```

### PM2 Ecosystem File

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'loan-api',
    script: './server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    max_memory_restart: '1G'
  }]
};
```

Start with: `pm2 start ecosystem.config.js`

## 🐛 Troubleshooting

### Rate Limiting Not Working

**Issue**: Requests not being rate limited

**Solutions**:
1. Check `TRUST_PROXY=true` if behind reverse proxy
2. Verify reverse proxy passes X-Real-IP header
3. Check rate limit configuration in `.env`
4. Review logs for rate limit events

### CORS Errors

**Issue**: Frontend can't connect to API

**Solutions**:
1. Add frontend domain to `CORS_ORIGIN`
2. Ensure CORS_ORIGIN has no spaces: `https://app.com,https://admin.com`
3. Check browser console for specific CORS error
4. Verify `CORS_CREDENTIALS=true` if using auth

### Security Headers Not Appearing

**Issue**: Security headers missing in response

**Solutions**:
1. Check if Helmet is initialized in server.js
2. Verify NODE_ENV is set correctly
3. Check reverse proxy isn't stripping headers
4. Review Helmet configuration in config/security.js

### Logs Not Being Written

**Issue**: Log files not created or empty

**Solutions**:
1. Check `LOG_DIRECTORY` exists and is writable
2. Verify Morgan and custom logger are initialized
3. Check file permissions on log directory
4. Review LOG_LEVEL setting (may filter too much)

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Helmet.js Documentation](https://helmetjs.github.io/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Node.js Security Checklist](https://github.com/goldbergyoni/nodebestpractices#6-security-best-practices)
- [SECURITY.md](./docs/SECURITY.md) - Detailed security documentation

## 🤝 Support

For security issues, please email: security@example.com

For general support: support@example.com

## 📄 License

[Your License Here]

---

**Last Updated**: January 2024  
**Version**: 1.0.0
