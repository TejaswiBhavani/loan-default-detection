# ⚠️ IMPORTANT: Database Audit Action Enum Constraints

## Critical Information

**This database's `audit_action` enum has ONLY 3 valid values:**

```sql
CREATE TYPE audit_action AS ENUM (
    'create',
    'login',
    'predict'
);
```

## ❌ Values That DO NOT EXIST

The following values are **NOT** in the enum and will cause SQL errors:
- `'refresh_token'`
- `'logout'`
- `'update'`
- `'delete'`
- `'approve'`
- `'reject'`
- `'export'`

## ✅ How Authentication Events Are Logged

Since the enum is limited, we use the available values creatively:

| Event | Action Used | Resource Type | Request Path | Purpose |
|-------|-------------|---------------|--------------|---------|
| Login | `'login'` | `user_sessions` | `/api/auth/login` | User authentication |
| Logout | `'create'` | `user_sessions` | `/api/auth/logout` | Session termination |
| Token Refresh | `'create'` | `user_sessions` | `/api/auth/refresh` | Token rotation |

## 📊 Correct Query Patterns

### ✅ Valid Queries (will work)

```sql
-- View all authentication-related events
SELECT user_id, action, resource_type, request_path, created_at
FROM audit_logs
WHERE action IN ('login', 'create')
  AND resource_type = 'user_sessions'
ORDER BY created_at DESC;

-- View only logins
SELECT user_id, action, ip_address, request_path, created_at
FROM audit_logs
WHERE action = 'login'
ORDER BY created_at DESC;

-- View logout and refresh events (both use 'create')
SELECT user_id, action, request_path, created_at
FROM audit_logs
WHERE action = 'create'
  AND resource_type = 'user_sessions'
  AND request_path IN ('/api/auth/logout', '/api/auth/refresh')
ORDER BY created_at DESC;

-- Distinguish by request path
SELECT 
    user_id,
    action,
    CASE 
        WHEN request_path = '/api/auth/login' THEN 'Login'
        WHEN request_path = '/api/auth/logout' THEN 'Logout'
        WHEN request_path = '/api/auth/refresh' THEN 'Token Refresh'
        ELSE 'Other'
    END as event_type,
    ip_address,
    created_at
FROM audit_logs
WHERE resource_type = 'user_sessions'
ORDER BY created_at DESC;
```

### ❌ Invalid Queries (will fail)

```sql
-- THIS WILL FAIL - 'refresh_token' doesn't exist
SELECT * FROM audit_logs WHERE action = 'refresh_token';

-- THIS WILL FAIL - 'logout' doesn't exist
SELECT * FROM audit_logs WHERE action IN ('login', 'logout');

-- THIS WILL FAIL - 'update', 'delete' don't exist
SELECT * FROM audit_logs WHERE action IN ('update', 'delete');
```

## 🎯 How to Identify Different Auth Events

Since we use `'create'` for both logout and refresh, use `request_path` to distinguish:

```sql
-- Count auth events by type
SELECT 
    CASE 
        WHEN action = 'login' THEN 'Login'
        WHEN action = 'create' AND request_path = '/api/auth/logout' THEN 'Logout'
        WHEN action = 'create' AND request_path = '/api/auth/refresh' THEN 'Token Refresh'
        ELSE 'Other'
    END as event_type,
    COUNT(*) as count
FROM audit_logs
WHERE resource_type = 'user_sessions'
GROUP BY event_type
ORDER BY count DESC;
```

## 🔍 Monitoring Queries (Updated for Actual Enum)

```sql
-- Failed login attempts (last 24 hours)
SELECT user_id, ip_address, response_status, created_at
FROM audit_logs
WHERE action = 'login'
  AND response_status != 200
  AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Recent authentication activity
SELECT 
    user_id,
    action,
    request_path,
    ip_address,
    response_status,
    TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') as timestamp
FROM audit_logs
WHERE resource_type = 'user_sessions'
ORDER BY created_at DESC
LIMIT 20;

-- High refresh rate (suspicious activity)
SELECT 
    user_id,
    COUNT(*) as refresh_count
FROM audit_logs
WHERE action = 'create'
  AND request_path = '/api/auth/refresh'
  AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY user_id
HAVING COUNT(*) > 10
ORDER BY refresh_count DESC;
```

## 📝 Summary

**ALWAYS use these values for audit_logs queries:**
- ✅ `'login'` - for login events
- ✅ `'create'` - for logout and refresh events
- ✅ `'predict'` - for prediction events

**NEVER use these (they don't exist):**
- ❌ `'refresh_token'`
- ❌ `'logout'`
- ❌ `'update'`, `'delete'`, `'approve'`, `'reject'`, `'export'`

**Use `request_path` to distinguish between events that share the same action value.**
