/**
 * Request Logging and Monitoring Middleware
 * Comprehensive logging for security, debugging, and analytics
 */

const morgan = require('morgan');
const fs = require('fs');
const path = require('path');

/**
 * Generate unique request ID
 */
const generateRequestId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Request ID Middleware
 * Attach unique ID to each request for tracing
 */
const requestIdMiddleware = (req, res, next) => {
  req.id = req.headers['x-request-id'] || generateRequestId();
  res.setHeader('X-Request-ID', req.id);
  next();
};

/**
 * Request Context Logger
 * Log detailed request information
 */
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Capture response finish
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    const logData = {
      requestId: req.id,
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      userId: req.user?.id || 'anonymous',
      query: Object.keys(req.query).length > 0 ? req.query : undefined,
      referer: req.get('referer'),
    };
    
    // Log based on status code
    if (res.statusCode >= 500) {
      console.error('[ERROR]', JSON.stringify(logData));
    } else if (res.statusCode >= 400) {
      console.warn('[WARN]', JSON.stringify(logData));
    } else if (process.env.NODE_ENV === 'development') {
      console.log('[INFO]', JSON.stringify(logData));
    }
  });
  
  next();
};

/**
 * Security Event Logger
 * Log security-related events
 */
const securityLogger = {
  /**
   * Log failed authentication attempt
   */
  authFailure: (req, reason) => {
    const logData = {
      event: 'AUTH_FAILURE',
      timestamp: new Date().toISOString(),
      requestId: req.id,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      username: req.body?.username,
      reason: reason,
      url: req.originalUrl,
    };
    
    console.warn('[SECURITY]', JSON.stringify(logData));
  },
  
  /**
   * Log successful authentication
   */
  authSuccess: (req, userId, username) => {
    const logData = {
      event: 'AUTH_SUCCESS',
      timestamp: new Date().toISOString(),
      requestId: req.id,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      userId: userId,
      username: username,
    };
    
    console.info('[SECURITY]', JSON.stringify(logData));
  },
  
  /**
   * Log suspicious activity
   */
  suspiciousActivity: (req, description) => {
    const logData = {
      event: 'SUSPICIOUS_ACTIVITY',
      timestamp: new Date().toISOString(),
      requestId: req.id,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      userId: req.user?.id || 'anonymous',
      description: description,
      url: req.originalUrl,
      method: req.method,
    };
    
    console.warn('[SECURITY]', JSON.stringify(logData));
  },
  
  /**
   * Log rate limit violation
   */
  rateLimitExceeded: (req, limitType) => {
    const logData = {
      event: 'RATE_LIMIT_EXCEEDED',
      timestamp: new Date().toISOString(),
      requestId: req.id,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      userId: req.user?.id || 'anonymous',
      limitType: limitType,
      url: req.originalUrl,
    };
    
    console.warn('[SECURITY]', JSON.stringify(logData));
  },
  
  /**
   * Log validation failure
   */
  validationFailure: (req, errors) => {
    const logData = {
      event: 'VALIDATION_FAILURE',
      timestamp: new Date().toISOString(),
      requestId: req.id,
      ip: req.ip,
      userId: req.user?.id || 'anonymous',
      url: req.originalUrl,
      errorCount: errors.length,
      errors: errors.map(e => ({ field: e.field, type: e.type })),
    };
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[VALIDATION]', JSON.stringify(logData));
    }
  },
  
  /**
   * Log unauthorized access attempt
   */
  unauthorizedAccess: (req, resource) => {
    const logData = {
      event: 'UNAUTHORIZED_ACCESS',
      timestamp: new Date().toISOString(),
      requestId: req.id,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      userId: req.user?.id || 'anonymous',
      resource: resource,
      url: req.originalUrl,
      method: req.method,
    };
    
    console.warn('[SECURITY]', JSON.stringify(logData));
  },
};

/**
 * Morgan Configuration
 * Different formats for different environments
 */
const getMorganFormat = () => {
  const env = process.env.NODE_ENV;
  
  if (env === 'production') {
    return 'combined'; // Apache combined format
  } else if (env === 'development') {
    return 'dev'; // Colorized, concise output
  } else {
    return 'common'; // Standard Apache format
  }
};

/**
 * Custom Morgan Token - Request ID
 */
morgan.token('id', (req) => req.id);

/**
 * Custom Morgan Token - User ID
 */
morgan.token('user-id', (req) => req.user?.id || 'anonymous');

/**
 * Custom Morgan Token - Response Time in ms
 */
morgan.token('response-time-ms', (req, res) => {
  if (!req._startAt || !res._startAt) {
    return '-';
  }
  
  const ms = (res._startAt[0] - req._startAt[0]) * 1000 +
             (res._startAt[1] - req._startAt[1]) / 1000000;
  
  return ms.toFixed(3);
});

/**
 * Custom Morgan Format for Production
 */
const productionFormat = ':remote-addr - :user-id [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time-ms ms - :id';

/**
 * Morgan Middleware Factory
 */
const getMorganMiddleware = () => {
  const env = process.env.NODE_ENV;
  
  if (env === 'production') {
    // In production, log to file and console
    const logDirectory = path.join(__dirname, '../../logs');
    
    // Ensure log directory exists
    if (!fs.existsSync(logDirectory)) {
      fs.mkdirSync(logDirectory, { recursive: true });
    }
    
    const accessLogStream = fs.createWriteStream(
      path.join(logDirectory, 'access.log'),
      { flags: 'a' }
    );
    
    return [
      morgan(productionFormat, { stream: accessLogStream }),
      morgan(productionFormat), // Also log to console
    ];
  } else {
    return morgan(getMorganFormat());
  }
};

/**
 * Performance Monitor
 * Track slow requests
 */
const performanceMonitor = (threshold = 1000) => {
  return (req, res, next) => {
    const startTime = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      
      if (duration > threshold) {
        console.warn('[PERFORMANCE]', JSON.stringify({
          event: 'SLOW_REQUEST',
          requestId: req.id,
          duration: `${duration}ms`,
          threshold: `${threshold}ms`,
          method: req.method,
          url: req.originalUrl,
          statusCode: res.statusCode,
          userId: req.user?.id || 'anonymous',
        }));
      }
    });
    
    next();
  };
};

/**
 * Request Size Monitor
 * Track large payloads
 */
const requestSizeMonitor = (threshold = 1024 * 1024) => { // 1MB default
  return (req, res, next) => {
    const contentLength = parseInt(req.get('content-length') || 0);
    
    if (contentLength > threshold) {
      console.warn('[PERFORMANCE]', JSON.stringify({
        event: 'LARGE_REQUEST',
        requestId: req.id,
        size: `${(contentLength / 1024 / 1024).toFixed(2)}MB`,
        threshold: `${(threshold / 1024 / 1024).toFixed(2)}MB`,
        method: req.method,
        url: req.originalUrl,
        userId: req.user?.id || 'anonymous',
      }));
    }
    
    next();
  };
};

/**
 * Error Logger
 * Enhanced error logging
 */
const errorLogger = (err, req, res, next) => {
  const logData = {
    event: 'ERROR',
    requestId: req.id,
    timestamp: new Date().toISOString(),
    error: {
      message: err.message,
      name: err.name,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      code: err.code,
    },
    request: {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userId: req.user?.id || 'anonymous',
    },
  };
  
  console.error('[ERROR]', JSON.stringify(logData));
  next(err);
};

/**
 * Metrics Collector
 * Collect basic metrics for monitoring
 */
class MetricsCollector {
  constructor() {
    this.metrics = {
      requests: {
        total: 0,
        success: 0,
        clientError: 0,
        serverError: 0,
      },
      responseTime: {
        sum: 0,
        count: 0,
        avg: 0,
      },
      endpoints: {},
    };
  }
  
  /**
   * Record request
   */
  recordRequest(req, res, duration) {
    this.metrics.requests.total++;
    
    if (res.statusCode >= 200 && res.statusCode < 300) {
      this.metrics.requests.success++;
    } else if (res.statusCode >= 400 && res.statusCode < 500) {
      this.metrics.requests.clientError++;
    } else if (res.statusCode >= 500) {
      this.metrics.requests.serverError++;
    }
    
    this.metrics.responseTime.sum += duration;
    this.metrics.responseTime.count++;
    this.metrics.responseTime.avg = 
      this.metrics.responseTime.sum / this.metrics.responseTime.count;
    
    // Track by endpoint
    const endpoint = `${req.method} ${req.route?.path || req.path}`;
    if (!this.metrics.endpoints[endpoint]) {
      this.metrics.endpoints[endpoint] = {
        count: 0,
        avgDuration: 0,
        totalDuration: 0,
      };
    }
    
    this.metrics.endpoints[endpoint].count++;
    this.metrics.endpoints[endpoint].totalDuration += duration;
    this.metrics.endpoints[endpoint].avgDuration = 
      this.metrics.endpoints[endpoint].totalDuration / 
      this.metrics.endpoints[endpoint].count;
  }
  
  /**
   * Get metrics summary
   */
  getSummary() {
    return {
      ...this.metrics,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString(),
    };
  }
  
  /**
   * Reset metrics
   */
  reset() {
    this.metrics = {
      requests: {
        total: 0,
        success: 0,
        clientError: 0,
        serverError: 0,
      },
      responseTime: {
        sum: 0,
        count: 0,
        avg: 0,
      },
      endpoints: {},
    };
  }
}

// Global metrics instance
const metricsCollector = new MetricsCollector();

/**
 * Metrics Middleware
 */
const metricsMiddleware = (req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    metricsCollector.recordRequest(req, res, duration);
  });
  
  next();
};

/**
 * Health Check with Metrics
 */
const getHealthStatus = () => {
  const metrics = metricsCollector.getSummary();
  
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(metrics.uptime)}s`,
    metrics: {
      totalRequests: metrics.requests.total,
      successRate: metrics.requests.total > 0 
        ? ((metrics.requests.success / metrics.requests.total) * 100).toFixed(2) + '%'
        : '0%',
      avgResponseTime: `${metrics.responseTime.avg.toFixed(2)}ms`,
    },
    memory: {
      used: `${(metrics.memory.heapUsed / 1024 / 1024).toFixed(2)}MB`,
      total: `${(metrics.memory.heapTotal / 1024 / 1024).toFixed(2)}MB`,
    },
  };
};

module.exports = {
  requestIdMiddleware,
  requestLogger,
  securityLogger,
  getMorganMiddleware,
  performanceMonitor,
  requestSizeMonitor,
  errorLogger,
  metricsMiddleware,
  metricsCollector,
  getHealthStatus,
};
