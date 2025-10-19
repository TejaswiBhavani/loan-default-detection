/**
 * XSS Protection Middleware
 * Advanced input sanitization to prevent Cross-Site Scripting attacks
 */

const validator = require('validator');

/**
 * Sanitize string to prevent XSS
 * @param {string} input - Input string
 * @returns {string} Sanitized string
 */
const sanitizeString = (input) => {
  if (typeof input !== 'string') {
    return input;
  }
  
  // Escape HTML entities
  let sanitized = validator.escape(input);
  
  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');
  
  // Remove any remaining script tags
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove iframe tags
  sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
  
  // Remove event handlers (onclick, onerror, etc.)
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  
  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '');
  
  return sanitized;
};

/**
 * Recursively sanitize an object
 * @param {Object|Array} obj - Object or array to sanitize
 * @returns {Object|Array} Sanitized object
 */
const sanitizeObject = (obj) => {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  
  if (typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    // Sanitize the key as well
    const sanitizedKey = sanitizeString(key);
    sanitized[sanitizedKey] = sanitizeObject(value);
  }
  
  return sanitized;
};

/**
 * XSS Protection Middleware for Request Body
 */
const xssProtection = (options = {}) => {
  const {
    excludeFields = [], // Fields to skip sanitization (e.g., encrypted data)
    logSanitization = false,
  } = options;
  
  return (req, res, next) => {
    if (req.body && typeof req.body === 'object') {
      const originalBody = JSON.stringify(req.body);
      
      // Create a copy to avoid modifying during iteration
      const sanitized = {};
      
      for (const [key, value] of Object.entries(req.body)) {
        if (excludeFields.includes(key)) {
          // Skip sanitization for excluded fields
          sanitized[key] = value;
        } else {
          sanitized[key] = sanitizeObject(value);
        }
      }
      
      req.body = sanitized;
      
      // Log if sanitization changed the body
      if (logSanitization && JSON.stringify(sanitized) !== originalBody) {
        console.warn('[XSS] Sanitization applied', {
          requestId: req.id,
          path: req.path,
          userId: req.user?.id || 'anonymous',
        });
      }
    }
    
    // Sanitize query parameters
    if (req.query && typeof req.query === 'object') {
      for (const [key, value] of Object.entries(req.query)) {
        if (typeof value === 'string') {
          req.query[key] = sanitizeString(value);
        }
      }
    }
    
    // Sanitize URL parameters
    if (req.params && typeof req.params === 'object') {
      for (const [key, value] of Object.entries(req.params)) {
        if (typeof value === 'string') {
          req.params[key] = sanitizeString(value);
        }
      }
    }
    
    next();
  };
};

/**
 * Detect potential XSS attacks
 * @param {string} input - Input to check
 * @returns {boolean} True if potential XSS detected
 */
const detectXSS = (input) => {
  if (typeof input !== 'string') {
    return false;
  }
  
  const xssPatterns = [
    /<script/i,
    /<iframe/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<object/i,
    /<embed/i,
    /vbscript:/i,
    /data:text\/html/i,
    /<svg.*onload/i,
    /<img.*onerror/i,
  ];
  
  return xssPatterns.some(pattern => pattern.test(input));
};

/**
 * XSS Detection Middleware
 * Blocks requests with obvious XSS attempts
 */
const xssDetector = (req, res, next) => {
  let xssDetected = false;
  let suspiciousFields = [];
  
  // Check body
  if (req.body && typeof req.body === 'object') {
    const checkObject = (obj, path = '') => {
      for (const [key, value] of Object.entries(obj)) {
        const currentPath = path ? `${path}.${key}` : key;
        
        if (typeof value === 'string' && detectXSS(value)) {
          xssDetected = true;
          suspiciousFields.push(currentPath);
        } else if (typeof value === 'object' && value !== null) {
          checkObject(value, currentPath);
        }
      }
    };
    
    checkObject(req.body);
  }
  
  // Check query parameters
  if (req.query && typeof req.query === 'object') {
    for (const [key, value] of Object.entries(req.query)) {
      if (typeof value === 'string' && detectXSS(value)) {
        xssDetected = true;
        suspiciousFields.push(`query.${key}`);
      }
    }
  }
  
  if (xssDetected) {
    console.error('[SECURITY] XSS attempt detected', {
      requestId: req.id,
      ip: req.ip,
      path: req.path,
      method: req.method,
      userId: req.user?.id || 'anonymous',
      suspiciousFields: suspiciousFields,
    });
    
    return res.status(400).json({
      success: false,
      error: 'Invalid input detected',
      message: 'Your request contains potentially malicious content and has been blocked.',
      fields: suspiciousFields,
    });
  }
  
  next();
};

/**
 * Content Type Validation
 * Ensure request content-type is acceptable
 */
const contentTypeValidation = (allowedTypes = ['application/json']) => {
  return (req, res, next) => {
    // Skip for GET, DELETE, HEAD requests (no body)
    if (['GET', 'DELETE', 'HEAD'].includes(req.method)) {
      return next();
    }
    
    const contentType = req.get('content-type');
    
    if (!contentType) {
      return res.status(400).json({
        success: false,
        error: 'Missing Content-Type header',
      });
    }
    
    // Check if content type is allowed
    const isAllowed = allowedTypes.some(type => contentType.includes(type));
    
    if (!isAllowed) {
      return res.status(415).json({
        success: false,
        error: 'Unsupported Media Type',
        message: `Content-Type must be one of: ${allowedTypes.join(', ')}`,
      });
    }
    
    next();
  };
};

/**
 * SQL Injection Pattern Detection
 * Detect potential SQL injection attempts
 */
const detectSQLInjection = (input) => {
  if (typeof input !== 'string') {
    return false;
  }
  
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
    /(UNION.*SELECT)/i,
    /(\bOR\b.*=.*)/i,
    /(\bAND\b.*=.*)/i,
    /(--|;|\/\*|\*\/)/,
    /('|\"|`|;|\\)/,
    /(\bxp_|\bsp_)/i,
  ];
  
  return sqlPatterns.some(pattern => pattern.test(input));
};

/**
 * SQL Injection Detection Middleware
 */
const sqlInjectionDetector = (req, res, next) => {
  let sqlDetected = false;
  let suspiciousFields = [];
  
  const checkValue = (value, fieldPath) => {
    if (typeof value === 'string' && detectSQLInjection(value)) {
      sqlDetected = true;
      suspiciousFields.push(fieldPath);
    }
  };
  
  // Check body
  if (req.body && typeof req.body === 'object') {
    const checkObject = (obj, path = '') => {
      for (const [key, value] of Object.entries(obj)) {
        const currentPath = path ? `${path}.${key}` : key;
        
        if (typeof value === 'string') {
          checkValue(value, currentPath);
        } else if (typeof value === 'object' && value !== null) {
          checkObject(value, currentPath);
        }
      }
    };
    
    checkObject(req.body);
  }
  
  // Check query parameters
  if (req.query && typeof req.query === 'object') {
    for (const [key, value] of Object.entries(req.query)) {
      checkValue(value, `query.${key}`);
    }
  }
  
  if (sqlDetected) {
    console.error('[SECURITY] Potential SQL injection detected', {
      requestId: req.id,
      ip: req.ip,
      path: req.path,
      method: req.method,
      userId: req.user?.id || 'anonymous',
      suspiciousFields: suspiciousFields,
    });
    
    return res.status(400).json({
      success: false,
      error: 'Invalid input detected',
      message: 'Your request contains potentially malicious SQL patterns and has been blocked.',
    });
  }
  
  next();
};

/**
 * Path Traversal Detection
 * Prevent directory traversal attacks
 */
const pathTraversalDetector = (req, res, next) => {
  const pathTraversalPattern = /(\.\.|\/\.\/|\\\.\\)/;
  
  let detected = false;
  
  // Check all string values in request
  const checkString = (str) => {
    if (typeof str === 'string' && pathTraversalPattern.test(str)) {
      detected = true;
      return true;
    }
    return false;
  };
  
  // Check URL params
  if (req.params) {
    Object.values(req.params).forEach(checkString);
  }
  
  // Check query params
  if (req.query) {
    Object.values(req.query).forEach(checkString);
  }
  
  // Check body
  if (req.body && typeof req.body === 'object') {
    JSON.stringify(req.body).split('').forEach(char => {
      if (pathTraversalPattern.test(char)) {
        detected = true;
      }
    });
  }
  
  if (detected) {
    console.error('[SECURITY] Path traversal attempt detected', {
      requestId: req.id,
      ip: req.ip,
      path: req.path,
      userId: req.user?.id || 'anonymous',
    });
    
    return res.status(400).json({
      success: false,
      error: 'Invalid input detected',
      message: 'Path traversal attempt blocked.',
    });
  }
  
  next();
};

/**
 * Combined Security Middleware
 * Applies all security checks
 */
const securityMiddleware = (options = {}) => {
  return [
    contentTypeValidation(['application/json', 'application/x-www-form-urlencoded']),
    xssDetector,
    sqlInjectionDetector,
    pathTraversalDetector,
    xssProtection(options),
  ];
};

module.exports = {
  xssProtection,
  xssDetector,
  sqlInjectionDetector,
  pathTraversalDetector,
  contentTypeValidation,
  securityMiddleware,
  sanitizeString,
  sanitizeObject,
  detectXSS,
  detectSQLInjection,
};
