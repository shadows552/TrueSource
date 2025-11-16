const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const logger = require('./logger');
const productRoutes = require('./routes/products');
const authRoutes = require('./routes/auth');
const { loadConfig, healthCheck: vaultHealthCheck } = require('./vault');
const { initializeAuth } = require('./middleware/auth');
require('dotenv').config();

const app = express();

// Global configuration object (will be loaded from Vault)
let config = null;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:8080'],
  methods: ['GET', 'POST', 'PUT'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Body parser
app.use(express.json({ limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info({
    type: 'http_request',
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// Health check endpoint
app.get('/health', async (req, res) => {
  logger.info({ type: 'health_check', status: 'healthy' });

  const vaultStatus = await vaultHealthCheck();

  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    vault: vaultStatus,
    config: config ? 'loaded' : 'not_loaded'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error({
    type: 'error',
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
      status: err.status || 500
    }
  });
});

// 404 handler
app.use((req, res) => {
  logger.warn({
    type: 'not_found',
    path: req.path,
    method: req.method
  });
  res.status(404).json({ error: 'Not found' });
});

// Async server startup with Vault configuration loading
async function startServer() {
  try {
    // Load configuration from Vault
    logger.info({ type: 'loading_config', source: 'vault' });
    config = await loadConfig();

    // Initialize authentication with JWT secret
    initializeAuth(config);

    // Start server
    const PORT = config.port;
    app.listen(PORT, () => {
      logger.info({
        type: 'server_start',
        port: PORT,
        environment: config.nodeEnv,
        solanaNetwork: config.solanaNetwork,
        jwtEnabled: !!config.jwtSecret,
        vaultIntegration: true
      });
    });
  } catch (error) {
    logger.error({
      type: 'server_start_error',
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
}

// Start the server
startServer();

module.exports = app;
