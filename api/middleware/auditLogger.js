/**
 * Audit Logger Middleware
 * Logs sensitive operations to the audit_logs table.
 */
const { query } = require('../config/database');

// Middleware that records basic request info on every request (keeps lightweight)
const requestAudit = async (req, res, next) => {
  // Attach a helper to req so controllers can call req.audit({ ... })
  req.audit = async (opts = {}) => {
    try {
      const {
        userId = req.user?.id || null,
        sessionId = null,
        action = opts.action || 'unknown',
        resource_type = opts.resource_type || 'unknown',
        resource_id = opts.resource_id || null,
        old_values = opts.old_values || null,
        new_values = opts.new_values || null,
        request_params = opts.request_params || null,
        response_status = opts.response_status || null,
        response_time_ms = opts.response_time_ms || null,
        business_reason = opts.business_reason || null,
      } = opts;

      await query(
        `INSERT INTO audit_logs (user_id, session_id, action, resource_type, resource_id, old_values, new_values, ip_address, user_agent, request_method, request_path, request_params, response_status, response_time_ms, business_reason)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
        [
          userId,
          sessionId,
          action,
          resource_type,
          resource_id,
          old_values ? JSON.stringify(old_values) : null,
          new_values ? JSON.stringify(new_values) : null,
          req.ip,
          req.get('user-agent'),
          req.method,
          req.originalUrl,
          request_params ? JSON.stringify(request_params) : null,
          response_status,
          response_time_ms,
          business_reason,
        ]
      );
    } catch (err) {
      // Do not block request on audit failures; log to console for operators
      console.error('Audit log error:', err.message);
    }
  };

  next();
};

module.exports = { requestAudit };
