/**
 * Security Configuration
 * Centralized security settings for the API
 */

const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

/**
 * Enhanced Helmet Configuration
 * Comprehensive security headers for production
 */
const helmetConfig = {
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  
  // Cross-Origin policies
  crossOriginEmbedderPolicy: false, // Allow embedding in iframes if needed
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'same-origin' },
  
  // DNS Prefetch Control
  dnsPrefetchControl: { allow: false },
  
  // Expect-CT (deprecated but still useful)
  expectCt: {
    enforce: true,
    maxAge: 30,
  },
  
  // Frame Guard - prevent clickjacking
  frameguard: { action: 'deny' },
  
  // Hide X-Powered-By header
  hidePoweredBy: true,
  
  // HTTP Strict Transport Security
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  
  // IE No Open - prevent IE from executing downloads
  ieNoOpen: true,
  
  // X-Content-Type-Options
  noSniff: true,
  
  // Origin Agent Cluster
  originAgentCluster: true,
  
  // Permitted Cross-Domain Policies
  permittedCrossDomainPolicies: { permittedPolicies: 'none' },
  
  // Referrer Policy
  referrerPolicy: { policy: 'no-referrer' },
  
  // X-XSS-Protection (legacy but still useful)
  xssFilter: true,
};

/**
 * CORS Configuration
 * Configure Cross-Origin Resource Sharing
 */
const getCorsConfig = () => {
  const allowedOrigins = [
    // Development
    'https://probable-space-broccoli-jj456v5xx4p4c5x9j-3000.app.github.dev',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    
    // Production (replace with actual domains)
    process.env.FRONTEND_URL,
    'https://app.loanpredict.com'
  ].filter(Boolean); // Remove undefined values

  return {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or same-origin via proxy)
      if (!origin) {
        return callback(null, true);
      }

      // In development, be more permissive
      if (process.env.NODE_ENV === 'development') {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Range', 'X-Content-Range', 'X-Total-Count'],
    maxAge: 600, // 10 minutes
    preflightContinue: false,
    optionsSuccessStatus: 204
  };
};

/**
 * General Rate Limiter
 * Apply to all API routes
 */
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes',
  },
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health' || req.path === '/api';
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Too many requests',
      message: 'You have exceeded the rate limit. Please try again later.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),
    });
  },
});

/**
 * Strict Rate Limiter for Authentication
 * Prevent brute force attacks
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  skipSuccessfulRequests: true, // Don't count successful requests
  message: {
    success: false,
    error: 'Too many authentication attempts',
    retryAfter: '15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.warn(`[SECURITY] Authentication rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      error: 'Too many authentication attempts',
      message: 'Your account has been temporarily locked. Please try again in 15 minutes.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),
    });
  },
});

/**
 * Moderate Rate Limiter for Predictions
 * Balance between usability and resource protection
 */
const predictionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 predictions per minute
  message: {
    success: false,
    error: 'Too many prediction requests',
    retryAfter: '1 minute',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Rate limit by user ID if authenticated, otherwise by IP
    return req.user?.id || req.ip;
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Prediction rate limit exceeded',
      message: 'You have made too many prediction requests. Please wait before trying again.',
      retryAfter: 60,
    });
  },
});

/**
 * Strict Rate Limiter for Account Creation
 * Prevent spam registrations
 */
const createAccountLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 accounts per hour per IP
  skipSuccessfulRequests: false,
  message: {
    success: false,
    error: 'Too many accounts created',
    retryAfter: '1 hour',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.warn(`[SECURITY] Account creation rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      error: 'Account creation limit exceeded',
      message: 'Too many accounts created from this IP. Please try again later.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),
    });
  },
});

/**
 * Moderate Rate Limiter for Data Queries
 * Prevent database exhaustion
 */
const queryLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 queries per minute
  message: {
    success: false,
    error: 'Too many requests',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  },
});

/**
 * Security Headers Middleware
 * Additional custom security headers
 */
const securityHeaders = (req, res, next) => {
  // Add custom security headers
  res.setHeader('X-Request-ID', req.id || generateRequestId());
  res.setHeader('X-API-Version', '1.0.0');
  
  // Remove fingerprinting headers
  res.removeHeader('X-Powered-By');
  res.removeHeader('Server');
  
  next();
};

/**
 * Generate unique request ID
 */
const generateRequestId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Trusted Proxy Configuration
 * For deployment behind reverse proxy (nginx, AWS ALB, etc.)
 */
const getTrustedProxyConfig = () => {
  const env = process.env.NODE_ENV;
  
  if (env === 'production') {
    // Trust first proxy in production (reverse proxy)
    return 1;
  } else if (env === 'staging') {
    return 1;
  } else {
    // In development, don't trust any proxy
    return false;
  }
};

/**
 * IP Whitelist/Blacklist (Optional)
 * Can be used to block malicious IPs
 */
const ipFilter = (req, res, next) => {
  const ip = req.ip;
  const blacklist = process.env.IP_BLACKLIST 
    ? process.env.IP_BLACKLIST.split(',').map(ip => ip.trim())
    : [];
  
  if (blacklist.includes(ip)) {
    console.warn(`[SECURITY] Blocked IP: ${ip}`);
    return res.status(403).json({
      success: false,
      error: 'Access denied',
    });
  }
  
  next();
};

/**
 * Request Size Limits
 * Prevent DoS attacks through large payloads
 */
const requestSizeLimits = {
  json: { limit: '10mb' },
  urlencoded: { extended: true, limit: '10mb' },
};

/**
 * Security Configuration Summary
 */
const getSecurityConfig = () => {
  return {
    environment: process.env.NODE_ENV || 'development',
    helmet: {
      enabled: true,
      hsts: process.env.NODE_ENV === 'production',
    },
    cors: {
      enabled: true,
      allowedOrigins: process.env.CORS_ORIGIN || 'localhost',
    },
    rateLimit: {
      general: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
        max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
      },
      auth: {
        windowMs: 15 * 60 * 1000,
        max: 5,
      },
      prediction: {
        windowMs: 60 * 1000,
        max: 10,
      },
    },
    requestLimits: {
      jsonPayload: '10mb',
      urlEncodedPayload: '10mb',
    },
    trustedProxy: getTrustedProxyConfig(),
  };
};

module.exports = {
  helmetConfig,
  getCorsConfig,
  generalLimiter,
  authLimiter,
  predictionLimiter,
  createAccountLimiter,
  queryLimiter,
  securityHeaders,
  ipFilter,
  requestSizeLimits,
  getTrustedProxyConfig,
  getSecurityConfig,
};
