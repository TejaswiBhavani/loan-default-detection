# Authentication & Security Documentation

## Overview

This API implements JWT-based authentication with secure refresh token rotation and comprehensive audit logging. All sensitive operations are logged to the `audit_logs` table for compliance and security monitoring.

## Security Features

### 1. **Hashed Refresh Tokens**

Refresh tokens are **never stored in plain text** in the database. Instead, they are hashed using bcrypt (salt rounds: 10) before storage.

**Why this matters:**
- If the database is compromised, attackers cannot use the stored refresh tokens
- Each refresh token hash is unique due to bcrypt's salt
- Provides defense-in-depth security posture

**How it works:**

```javascript
// On login or token refresh:
const refreshToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
// Store refreshTokenHash in database

// On token refresh request:
// 1. Fetch all active sessions for the user
// 2. Compare provided token against each stored hash
// 3. Find matching session
// 4. Issue new tokens and rotate refresh token
```

### 2. **Token Rotation**

Every time a refresh token is used:
- A new access token is issued
- A new refresh token is generated and hashed
- The old refresh token hash is replaced
- Session expiration is extended

This limits the window of opportunity for token theft and replay attacks.

### 3. **Session Management**

Sessions are tracked in the `user_sessions` table:
- **session_token**: First 50 characters of access token
- **refresh_token**: Bcrypt hash (60 characters) of refresh token
- **is_active**: Boolean flag for session validity
- **expires_at**: Automatic expiration timestamp
- **ip_address**: Client IP for security auditing
- **user_agent**: Browser/client information

### 4. **Audit Logging**

Every authentication event is logged:
- Login attempts (success/failure)
- Token refresh operations
- Logout events
- Session creation/termination

Audit logs include:
- User ID and session ID
- IP address and user agent
- Request method and path
- Response status
- Business reason (for sensitive operations)

## API Endpoints

### POST /api/auth/login

Authenticate user and receive access + refresh tokens.

**Request:**
```json
{
  "username": "admin",
  "password": "your_password"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid",
      "username": "admin",
      "email": "admin@example.com",
      "firstName": "Admin",
      "lastName": "User",
      "role": "admin",
      "department": "IT"
    }
  }
}
```

**Security notes:**
- Password is verified using bcrypt.compare()
- Refresh token is hashed before storing
- Session record created with 7-day expiration
- Audit log entry created

### POST /api/auth/refresh

Exchange refresh token for new access token.

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Security process:**
1. Verify JWT signature and expiration
2. Fetch all active sessions for the user
3. Compare provided token against stored hashes (bcrypt.compare)
4. If match found, issue new tokens
5. Hash new refresh token and update session
6. Log refresh event to audit_logs

**Why fetch all sessions?**
- Cannot query by hash directly (bcrypt hashes are non-deterministic)
- Allows detection of concurrent sessions
- Minimal performance impact (users typically have 1-3 active sessions)

### GET /api/auth/me

Get current authenticated user information.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "username": "admin",
      "email": "admin@example.com",
      "firstName": "Admin",
      "lastName": "User",
      "role": "admin",
      "department": "IT",
      "phone": "+1-555-1234",
      "is_active": true,
      "is_verified": true,
      "last_login_at": "2025-10-19T12:00:00.000Z",
      "created_at": "2025-01-01T00:00:00.000Z"
    }
  }
}
```

### POST /api/auth/logout

Invalidate current session and clear refresh token.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

**Security actions:**
1. Set `is_active = false` on session
2. Clear `refresh_token` from session (set to NULL)
3. Update `last_activity_at`
4. Log logout event to audit_logs

## Role-Based Access Control

The system supports 5 user roles with hierarchical permissions:

| Role | Permissions |
|------|------------|
| **admin** | Full access to all resources |
| **loan_officer** | Create/update applicants and loan applications |
| **underwriter** | Review and update loan application status |
| **analyst** | Read access to analytics and predictions |
| **viewer** | Read-only access to most resources |

### Using Role-Based Authorization

```javascript
const { authenticate, authorize } = require('./middleware/auth');

// Require authentication
router.get('/protected', authenticate, (req, res) => {
  // req.user contains authenticated user info
});

// Require specific roles
router.post('/applicants', 
  authenticate, 
  authorize('admin', 'loan_officer'), 
  createApplicant
);

// Admin only
router.delete('/users/:id', 
  authenticate, 
  authorize('admin'), 
  deleteUser
);
```

## Audit Logging

Use the `req.audit()` helper in controllers for detailed logging:

```javascript
const updateApplicant = async (req, res, next) => {
  try {
    // ... fetch old values ...
    
    // Perform update
    const result = await query('UPDATE applicants SET ... WHERE id = $1', [id]);
    
    // Log the change
    await req.audit({
      action: 'update',
      resource_type: 'applicants',
      resource_id: id,
      old_values: oldApplicant,
      new_values: req.body,
      response_status: 200,
      business_reason: 'Applicant information updated'
    });
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};
```

## Security Best Practices

### For Developers

1. **Never log sensitive data**: Don't log passwords, tokens, or PII in console/files
2. **Use parameterized queries**: All database queries use `$1, $2` placeholders to prevent SQL injection
3. **Validate all inputs**: Use Joi schemas in `middleware/validation.js`
4. **Hash passwords**: Always use bcrypt with minimum 10 salt rounds
5. **Set secure headers**: Helmet.js is configured in server.js
6. **Rate limit endpoints**: Rate limiting is enabled (100 req/15min per IP)
7. **Enable CORS selectively**: Configure `CORS_ORIGIN` in .env for production

### For Deployment

1. **Use strong JWT secret**: Set `JWT_SECRET` to a random 256-bit string
2. **Enable HTTPS only**: Never send tokens over unencrypted connections
3. **Set secure cookies**: If using cookies, set `httpOnly`, `secure`, `sameSite`
4. **Monitor audit logs**: Set up alerts for suspicious patterns
5. **Rotate secrets regularly**: Plan for JWT secret rotation
6. **Backup database**: Ensure audit_logs are included in backups
7. **Set short token expiry**: Default 24h for access tokens, 7d for refresh

## Environment Variables

```bash
# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=loan_db
DB_USER=postgres
DB_PASSWORD=your_password

# Security
CORS_ORIGIN=http://localhost:3000,http://localhost:8501
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Testing Authentication

### 1. Login and Get Tokens

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password123"}'
```

### 2. Use Access Token

```bash
TOKEN="eyJhbGciOiJIUzI1NiIs..."

curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

### 3. Refresh Token

```bash
REFRESH_TOKEN="eyJhbGciOiJIUzI1NiIs..."

curl -X POST http://localhost:5000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}"
```

### 4. Logout

```bash
curl -X POST http://localhost:5000/api/auth/logout \
  -H "Authorization: Bearer $TOKEN"
```

## Common Issues

### "Invalid refresh token" error

**Cause:** The provided refresh token doesn't match any active session hash.

**Solutions:**
- Token may have expired (7 days default)
- Session may have been logged out
- Login again to get new tokens

### "Token expired" error

**Cause:** Access token has exceeded its expiration time.

**Solution:**
- Use the refresh token to get a new access token
- Don't refresh too frequently (wait until token is near expiry)

### Session not found

**Cause:** Session was invalidated or expired.

**Solution:**
- Login again
- Check that `is_active = true` and `expires_at > NOW()` in user_sessions

## Database Schema

### user_sessions table

```sql
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    refresh_token VARCHAR(255),  -- Stores bcrypt hash (60 chars)
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### audit_logs table

```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    session_id UUID REFERENCES user_sessions(id),
    action audit_action NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    request_method VARCHAR(10),
    request_path VARCHAR(500),
    request_params JSONB,
    response_status INTEGER,
    response_time_ms INTEGER,
    business_reason TEXT,
    compliance_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## Performance Considerations

### Refresh Token Lookup

The refresh endpoint fetches all active sessions for a user and compares hashes:

```javascript
// Typical user has 1-3 active sessions
const sessions = await query(
  'SELECT ... FROM user_sessions WHERE user_id = $1 AND is_active = true',
  [userId]
);

// Compare against each (usually 1-3 iterations)
for (const session of sessions) {
  const match = await bcrypt.compare(refreshToken, session.refresh_token);
  if (match) return session;
}
```

**Performance characteristics:**
- Database query: ~1-5ms (indexed on user_id)
- Bcrypt comparison: ~50-100ms per session
- Total: ~50-300ms for typical 1-3 sessions

**Optimization options:**
- Add `last_activity_at` index for faster active session queries
- Implement session limit per user (e.g., max 5 concurrent sessions)
- Cache session hashes in Redis for high-traffic scenarios

## Compliance & Monitoring

### GDPR Considerations

- Audit logs contain PII (IP address, user agent)
- Implement data retention policies
- Provide user data export functionality
- Support "right to be forgotten" (cascade delete sessions)

### Monitoring Queries

```sql
-- Failed login attempts in last hour
SELECT user_id, COUNT(*) as attempts
FROM audit_logs
WHERE action = 'login' AND response_status != 200
  AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY user_id
HAVING COUNT(*) > 5;

-- Active sessions by user
SELECT u.username, COUNT(us.id) as session_count
FROM users u
LEFT JOIN user_sessions us ON u.id = us.user_id AND us.is_active = true
GROUP BY u.username
ORDER BY session_count DESC;

```sql
-- Token refresh rate (suspicious if too high)
SELECT user_id, COUNT(*) as refresh_count
FROM audit_logs
WHERE action = 'refresh_token'
  AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY user_id
HAVING COUNT(*) > 10;
```
```

## Future Enhancements

- [ ] Implement device fingerprinting for session management
- [ ] Add IP whitelist/blacklist for admin accounts
- [ ] Support OAuth2/OIDC providers (Google, Azure AD)
- [ ] Implement 2FA/MFA for high-privilege roles
- [ ] Add session management UI (view/terminate active sessions)
- [ ] Implement anomaly detection for audit logs
- [ ] Add rate limiting per user (not just per IP)
- [ ] Support JWT key rotation without downtime
