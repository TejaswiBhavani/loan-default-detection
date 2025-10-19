/**
 * Environment Configuration
 * Centralized environment variable management with validation
 */

require('dotenv').config();

/**
 * Validate required environment variables
 */
const validateEnv = () => {
  const required = [
    'DB_HOST',
    'DB_PORT',
    'DB_NAME',
    'DB_USER',
    'DB_PASSWORD',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(key => console.error(`   - ${key}`));
    throw new Error('Missing required environment variables');
  }
  
  console.log('✅ All required environment variables are set');
};

/**
 * Get environment configuration
 */
const getConfig = () => {
  return {
    // Environment
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT) || 5000,
    
    // Database
    database: {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT) || 5432,
      name: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: process.env.DB_SSL === 'true',
      poolMin: parseInt(process.env.DB_POOL_MIN) || 2,
      poolMax: parseInt(process.env.DB_POOL_MAX) || 10,
    },
    
    // JWT
    jwt: {
      secret: process.env.JWT_SECRET,
      refreshSecret: process.env.JWT_REFRESH_SECRET,
      expiresIn: process.env.JWT_EXPIRES_IN || '1h',
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
      issuer: process.env.JWT_ISSUER || 'loan-prediction-api',
    },
    
    // CORS
    cors: {
      origin: process.env.CORS_ORIGIN 
        ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
        : ['http://localhost:3000'],
      credentials: true,
    },
    
    // Rate Limiting
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    },
    
    // Security
    security: {
      bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 10,
      sessionSecret: process.env.SESSION_SECRET || process.env.JWT_SECRET,
      trustProxy: process.env.TRUST_PROXY === 'true',
      ipBlacklist: process.env.IP_BLACKLIST 
        ? process.env.IP_BLACKLIST.split(',').map(ip => ip.trim())
        : [],
    },
    
    // Logging
    logging: {
      level: process.env.LOG_LEVEL || 'info',
      format: process.env.LOG_FORMAT || 'json',
      directory: process.env.LOG_DIRECTORY || './logs',
    },
    
    // Application
    app: {
      name: process.env.APP_NAME || 'Loan Prediction API',
      version: process.env.APP_VERSION || '1.0.0',
      apiPrefix: process.env.API_PREFIX || '/api',
    },
    
    // Machine Learning Model
    ml: {
      modelPath: process.env.ML_MODEL_PATH || './models/loan_default_model.joblib',
      scalerPath: process.env.ML_SCALER_PATH || './models/scaler.joblib',
      pythonPath: process.env.PYTHON_PATH || 'python',
      predictionTimeout: parseInt(process.env.PREDICTION_TIMEOUT) || 30000,
    },
    
    // File Upload
    upload: {
      maxSize: parseInt(process.env.UPLOAD_MAX_SIZE) || 10 * 1024 * 1024, // 10MB
      allowedTypes: process.env.UPLOAD_ALLOWED_TYPES 
        ? process.env.UPLOAD_ALLOWED_TYPES.split(',')
        : ['application/pdf', 'image/jpeg', 'image/png'],
      directory: process.env.UPLOAD_DIRECTORY || './uploads',
    },
    
    // Email (if needed)
    email: {
      enabled: process.env.EMAIL_ENABLED === 'true',
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT) || 587,
      user: process.env.EMAIL_USER,
      password: process.env.EMAIL_PASSWORD,
      from: process.env.EMAIL_FROM || 'noreply@loanprediction.com',
    },
    
    // Monitoring
    monitoring: {
      enabled: process.env.MONITORING_ENABLED === 'true',
      slowRequestThreshold: parseInt(process.env.SLOW_REQUEST_THRESHOLD) || 1000,
      largePayloadThreshold: parseInt(process.env.LARGE_PAYLOAD_THRESHOLD) || 1024 * 1024,
    },
  };
};

/**
 * Check if running in production
 */
const isProduction = () => {
  return process.env.NODE_ENV === 'production';
};

/**
 * Check if running in development
 */
const isDevelopment = () => {
  return process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
};

/**
 * Check if running in test environment
 */
const isTest = () => {
  return process.env.NODE_ENV === 'test';
};

/**
 * Get database connection string
 */
const getDatabaseUrl = () => {
  const config = getConfig().database;
  
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  
  const auth = `${config.user}:${config.password}`;
  const host = `${config.host}:${config.port}`;
  const ssl = config.ssl ? '?ssl=true' : '';
  
  return `postgresql://${auth}@${host}/${config.name}${ssl}`;
};

/**
 * Print configuration summary (sanitized)
 */
const printConfig = () => {
  const config = getConfig();
  
  console.log('\n📋 Configuration Summary:');
  console.log('─────────────────────────────────────');
  console.log(`Environment:     ${config.env}`);
  console.log(`Port:            ${config.port}`);
  console.log(`Database:        ${config.database.host}:${config.database.port}/${config.database.name}`);
  console.log(`CORS Origins:    ${config.cors.origin.join(', ')}`);
  console.log(`Rate Limit:      ${config.rateLimit.maxRequests} requests per ${config.rateLimit.windowMs / 1000}s`);
  console.log(`JWT Expiry:      ${config.jwt.expiresIn}`);
  console.log(`Trust Proxy:     ${config.security.trustProxy}`);
  console.log(`Logging Level:   ${config.logging.level}`);
  console.log(`ML Model:        ${config.ml.modelPath}`);
  console.log('─────────────────────────────────────\n');
};

/**
 * Sanitize config for logging (remove secrets)
 */
const sanitizeConfig = (config) => {
  const sanitized = JSON.parse(JSON.stringify(config));
  
  // Remove sensitive data
  if (sanitized.database) {
    sanitized.database.password = '***REDACTED***';
  }
  
  if (sanitized.jwt) {
    sanitized.jwt.secret = '***REDACTED***';
    sanitized.jwt.refreshSecret = '***REDACTED***';
  }
  
  if (sanitized.security) {
    sanitized.security.sessionSecret = '***REDACTED***';
  }
  
  if (sanitized.email) {
    sanitized.email.password = '***REDACTED***';
  }
  
  return sanitized;
};

/**
 * Export configuration as JSON for debugging
 */
const exportConfig = () => {
  const config = getConfig();
  return sanitizeConfig(config);
};

module.exports = {
  validateEnv,
  getConfig,
  isProduction,
  isDevelopment,
  isTest,
  getDatabaseUrl,
  printConfig,
  sanitizeConfig,
  exportConfig,
};
