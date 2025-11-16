const jwt = require('jsonwebtoken');
const logger = require('../logger');

let jwtSecret = null;
let jwtIssuer = 'bbf-api';

/**
 * Initialize JWT configuration
 * @param {object} config - Configuration object with jwtSecret and jwtIssuer
 */
function initializeAuth(config) {
  jwtSecret = config.jwtSecret;
  jwtIssuer = config.jwtIssuer;

  if (!jwtSecret) {
    logger.warn({
      type: 'auth_init_warning',
      message: 'JWT secret not configured, authentication will be disabled'
    });
  } else {
    logger.info({
      type: 'auth_initialized',
      issuer: jwtIssuer
    });
  }
}

/**
 * Generate a JWT token for a user
 * @param {object} payload - The payload to include in the token (e.g., { userId, walletAddress })
 * @param {number} expiresIn - Token expiry in seconds (default: 3600 = 1 hour)
 * @returns {string} JWT token
 */
function generateToken(payload, expiresIn = 3600) {
  if (!jwtSecret) {
    throw new Error('JWT secret not configured');
  }

  return jwt.sign(payload, jwtSecret, {
    expiresIn,
    issuer: jwtIssuer,
    algorithm: 'HS256'
  });
}

/**
 * Verify and decode a JWT token
 * @param {string} token - The JWT token to verify
 * @returns {object} Decoded token payload
 */
function verifyToken(token) {
  if (!jwtSecret) {
    throw new Error('JWT secret not configured');
  }

  try {
    return jwt.verify(token, jwtSecret, {
      issuer: jwtIssuer,
      algorithms: ['HS256']
    });
  } catch (error) {
    logger.warn({
      type: 'token_verification_failed',
      error: error.message
    });
    throw error;
  }
}

/**
 * Express middleware to authenticate requests using JWT
 * Checks for Authorization header with Bearer token
 */
function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    logger.warn({
      type: 'auth_missing',
      path: req.path,
      ip: req.ip
    });
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Missing Authorization header'
    });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    logger.warn({
      type: 'auth_invalid_format',
      path: req.path,
      ip: req.ip
    });
    return res.status(401).json({
      error: 'Invalid authentication format',
      message: 'Use Bearer token'
    });
  }

  const token = parts[1];

  try {
    const decoded = verifyToken(token);
    req.user = decoded;

    logger.info({
      type: 'auth_success',
      userId: decoded.userId || decoded.walletAddress,
      path: req.path
    });

    next();
  } catch (error) {
    logger.warn({
      type: 'auth_failed',
      error: error.message,
      path: req.path,
      ip: req.ip
    });

    return res.status(403).json({
      error: 'Invalid or expired token',
      message: error.message
    });
  }
}

/**
 * Optional JWT authentication - continues even if no token provided
 * Sets req.user if valid token is present
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return next();
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return next();
  }

  const token = parts[1];

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    logger.info({
      type: 'optional_auth_success',
      userId: decoded.userId || decoded.walletAddress
    });
  } catch (error) {
    // Continue without authentication
    logger.debug({
      type: 'optional_auth_skipped',
      error: error.message
    });
  }

  next();
}

/**
 * Middleware to check if user owns the specified wallet
 */
function requireWalletOwnership(req, res, next) {
  const { currentOwnerPublicKey } = req.body;
  const { walletAddress } = req.user || {};

  if (!walletAddress) {
    return res.status(401).json({
      error: 'Wallet verification required',
      message: 'No wallet address in token'
    });
  }

  if (currentOwnerPublicKey && walletAddress !== currentOwnerPublicKey) {
    logger.warn({
      type: 'wallet_ownership_violation',
      tokenWallet: walletAddress,
      requestedWallet: currentOwnerPublicKey,
      ip: req.ip
    });

    return res.status(403).json({
      error: 'Wallet ownership verification failed',
      message: 'Token wallet does not match request wallet'
    });
  }

  next();
}

module.exports = {
  initializeAuth,
  generateToken,
  verifyToken,
  authenticateJWT,
  optionalAuth,
  requireWalletOwnership
};
