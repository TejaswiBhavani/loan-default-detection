/**
 * Express Server for Loan Default Prediction API
 * Complete REST API with JWT authentication, validation, and PostgreSQL integration
 * Enhanced with production-grade security features
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

// Import configuration
const { validateEnv, getConfig, printConfig, isProduction } = require('./config/environment');
const {
  helmetConfig,
  getCorsConfig,
  generalLimiter,
  authLimiter,
  predictionLimiter,
  queryLimiter,
  securityHeaders,
  ipFilter,
  getTrustedProxyConfig,
  getSecurityConfig,
} = require('./config/security');

// Import database and middleware
const { testConnection } = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
const { requestAudit } = require('./middleware/auditLogger');

// Import logging and monitoring
const {
  requestIdMiddleware,
  requestLogger,
  getMorganMiddleware,
  performanceMonitor,
  requestSizeMonitor,
  errorLogger,
  metricsMiddleware,
  getHealthStatus,
} = require('./middleware/requestLogger');

// Import XSS protection
const {
  xssProtection,
  xssDetector,
  sqlInjectionDetector,
  pathTraversalDetector,
  contentTypeValidation,
} = require('./middleware/xssProtection');

// Import routes
const authRoutes = require('./routes/auth');
const applicantsRoutes = require('./routes/applicants');
const loanApplicationsRoutes = require('./routes/loanApplications');
const predictionsRoutes = require('./routes/predictions');
const dashboardRoutes = require('./routes/dashboard');
const batchRoutes = require('./routes/batch');
const healthRoutes = require('./routes/health');

// Validate environment variables
try {
  validateEnv();
} catch (error) {
  console.error('❌ Environment validation failed:', error.message);
  process.exit(1);
}

// Get configuration
const config = getConfig();

// Initialize Express app
const app = express();
const PORT = config.port;

// Trust proxy (for deployment behind reverse proxy)
app.set('trust proxy', getTrustedProxyConfig());

// ============================================================================
// SECURITY MIDDLEWARE (Applied First)
// ============================================================================

// 1. Helmet - Security headers
app.use(helmet(helmetConfig));

// 2. Custom security headers
app.use(securityHeaders);

// 3. IP filtering (optional blacklist)
app.use(ipFilter);

// 4. Request ID tracking
app.use(requestIdMiddleware);

// 5. CORS configuration
app.use(cors(getCorsConfig()));

// 6. Body parsing with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 7. Content-Type validation for POST/PUT/PATCH (skip for file uploads)
app.use((req, res, next) => {
  // Skip validation for batch upload endpoints that need multipart/form-data
  if (req.path.includes('/batch/upload')) {
    return next();
  }
  
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    return contentTypeValidation(['application/json', 'application/x-www-form-urlencoded'])(req, res, next);
  }
  next();
});

// 8. XSS and injection protection
app.use(xssDetector);
app.use(sqlInjectionDetector);
app.use(pathTraversalDetector);
app.use(xssProtection({
  excludeFields: ['password', 'refreshToken'], // Don't sanitize encrypted data
  logSanitization: isProduction(),
}));

// ============================================================================
// LOGGING AND MONITORING
// ============================================================================

// Request logging with Morgan
const morganMiddleware = getMorganMiddleware();
if (Array.isArray(morganMiddleware)) {
  morganMiddleware.forEach(m => app.use(m));
} else {
  app.use(morganMiddleware);
}

// Custom request logger
app.use(requestLogger);

// Performance monitoring (log slow requests)
app.use(performanceMonitor(config.monitoring.slowRequestThreshold));

// Request size monitoring
app.use(requestSizeMonitor(config.monitoring.largePayloadThreshold));

// Metrics collection
app.use(metricsMiddleware);

// Audit logging (lightweight)
app.use(requestAudit);

// ============================================================================
// RATE LIMITING
// ============================================================================

// General rate limiter for all API routes
app.use('/api/', generalLimiter);

// ============================================================================
// ROUTES
// ============================================================================

// Root endpoint for Railway health checks
app.get('/', (req, res) => {
  res.json({
    success: true,
    service: 'Loan Default Prediction API',
    version: '1.0.0',
    status: 'healthy',
    endpoints: {
      health: '/health',
      api: '/api'
    }
  });
});

// Health check endpoint (no rate limit)
app.get('/health', (req, res) => {
  const healthStatus = getHealthStatus();
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    ...healthStatus,
  });
});

// Apply specialized rate limiters to high-risk routes
app.use('/api/auth', authLimiter);

// Security configuration endpoint (development only)
if (!isProduction()) {
  app.get('/api/security-config', (req, res) => {
    res.json({
      success: true,
      config: getSecurityConfig(),
    });
  });
}

// API information endpoint
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Loan Default Prediction API',
    version: config.app.version,
    environment: config.env,
    endpoints: {
      auth: '/api/auth',
      applicants: '/api/applicants',
      loanApplications: '/api/loan-applications',
      predictions: '/api/predictions',
      dashboard: '/api/dashboard',
    },
    documentation: '/api/docs',
    security: {
      cors: config.cors.origin,
      rateLimit: {
        window: `${config.rateLimit.windowMs / 1000}s`,
        maxRequests: config.rateLimit.maxRequests,
      },
    },
  });
});

// ============================================================================
// API ROUTES (With specific rate limiters)
// ============================================================================

// Auth routes - strict rate limiting
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth', authRoutes);

// Query routes - moderate rate limiting
app.use('/api/applicants', queryLimiter, applicantsRoutes);
app.use('/api/loan-applications', queryLimiter, loanApplicationsRoutes);

// Prediction routes - prediction-specific rate limiting
app.use('/api/predictions', predictionLimiter, predictionsRoutes);

// Batch processing routes - query rate limiting
app.use('/api/batch', queryLimiter, batchRoutes);

// Dashboard routes - query rate limiting
app.use('/api/dashboard', queryLimiter, dashboardRoutes);

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 handler
app.use((req, res) => {
  console.warn(`[404] ${req.method} ${req.originalUrl} - IP: ${req.ip}`);
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method,
  });
});

// Error logger middleware
app.use(errorLogger);

// Error handling middleware (must be last)
app.use(errorHandler);

// ============================================================================
// SERVER STARTUP
// ============================================================================

const startServer = async () => {
  try {
    console.log('🚀 Starting Loan Default Prediction API...\n');
    
    // Print configuration
    printConfig();
    
    // Test database connection
    console.log('🔍 Testing database connection...');
    const isConnected = await testConnection();

    if (!isConnected) {
      console.error('❌ Database connection failed. Please check your configuration.');
      console.error('💡 Tip: Make sure PostgreSQL is running and credentials in .env are correct.');
      process.exit(1);
    }

    console.log('✅ Database connected successfully\n');

    // Start Express server
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log('');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('  🏦  Loan Default Prediction API Server');
      console.log('═══════════════════════════════════════════════════════════');
      console.log(`  ✅  Server running on port ${PORT}`);
      console.log(`  🌍  Environment: ${config.env}`);
      console.log(`  🔗  Health check: http://localhost:${PORT}/health`);
      console.log(`  📡  API Base URL: http://localhost:${PORT}/api`);
      console.log(`  🗄️  Database: ${config.database.name}`);
      console.log('  ─────────────────────────────────────────────────────────');
      console.log('  🛡️  Security Features:');
      console.log(`     ✓ Helmet (${Object.keys(helmetConfig).length} policies)`);
      console.log(`     ✓ CORS (${config.cors.origin.length} origins)`);
      console.log(`     ✓ Rate Limiting (${config.rateLimit.maxRequests} req/${config.rateLimit.windowMs/1000}s)`);
      console.log('     ✓ XSS Protection');
      console.log('     ✓ SQL Injection Detection');
      console.log('     ✓ Path Traversal Protection');
      console.log('     ✓ Request Logging & Monitoring');
      console.log('     ✓ Input Sanitization');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('');
      console.log('📚 Available Endpoints:');
      console.log('  POST   /api/auth/login                 - User login (5 req/15min)');
      console.log('  POST   /api/auth/register              - Register user (5 req/15min)');
      console.log('  GET    /api/auth/me                    - Get current user');
      console.log('  POST   /api/auth/logout                - User logout');
      console.log('  POST   /api/auth/refresh               - Refresh token');
      console.log('  ─────────────────────────────────────────────────────────');
      console.log('  POST   /api/applicants                 - Create applicant (30 req/min)');
      console.log('  GET    /api/applicants                 - List applicants (30 req/min)');
      console.log('  GET    /api/applicants/:id             - Get applicant (30 req/min)');
      console.log('  ─────────────────────────────────────────────────────────');
      console.log('  POST   /api/loan-applications          - Create loan application (30 req/min)');
      console.log('  GET    /api/loan-applications          - List applications (30 req/min)');
      console.log('  GET    /api/loan-applications/:id      - Get application (30 req/min)');
      console.log('  PATCH  /api/loan-applications/:id      - Update application (30 req/min)');
      console.log('  ─────────────────────────────────────────────────────────');
      console.log('  POST   /api/predictions                - Create prediction (10 req/min)');
      console.log('  GET    /api/predictions/:id            - Get prediction (10 req/min)');
      console.log('  GET    /api/predictions/recent         - Recent predictions (10 req/min)');
      console.log('  ─────────────────────────────────────────────────────────');
      console.log('  GET    /api/dashboard                  - Dashboard overview (30 req/min)');
      console.log('  GET    /api/dashboard/risk-analytics   - Risk analytics (30 req/min)');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('');
      
      if (!isProduction()) {
        console.log('🔧 Development Mode:');
        console.log(`   • Security config: http://localhost:${PORT}/api/security-config`);
        console.log(`   • Detailed logging enabled`);
        console.log('');
      }
    });

    // Graceful shutdown handler
    const gracefulShutdown = (signal) => {
      console.log(`\n👋 ${signal} received. Shutting down gracefully...`);
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
      
      // Force shutdown after 10 seconds
      setTimeout(() => {
        console.error('⚠️  Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    console.error(error.stack);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('⚠️  Unhandled Promise Rejection:', err);
  // Close server & exit process
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('⚠️  Uncaught Exception:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;
