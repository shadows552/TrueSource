const express = require('express');
const router = express.Router();
const logger = require('../logger');
const { generateToken } = require('../middleware/auth');
const nacl = require('tweetnacl');
const bs58 = require('bs58');

/**
 * POST /api/auth/login
 * Authenticate a user with their Solana wallet signature
 *
 * Request body:
 * {
 *   "walletAddress": "string",  // Solana wallet public key
 *   "message": "string",         // Message that was signed
 *   "signature": "string"        // Base58-encoded signature
 * }
 */
router.post('/login', async (req, res, next) => {
  try {
    const { walletAddress, message, signature } = req.body;

    logger.info({
      type: 'login_attempt',
      walletAddress,
      ip: req.ip
    });

    // Validate input
    if (!walletAddress || !message || !signature) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'walletAddress, message, and signature are required'
      });
    }

    // Verify the signature
    try {
      const messageBytes = new TextEncoder().encode(message);
      const signatureBytes = bs58.decode(signature);
      const publicKeyBytes = bs58.decode(walletAddress);

      const isValid = nacl.sign.detached.verify(
        messageBytes,
        signatureBytes,
        publicKeyBytes
      );

      if (!isValid) {
        logger.warn({
          type: 'login_failed',
          reason: 'invalid_signature',
          walletAddress,
          ip: req.ip
        });

        return res.status(401).json({
          error: 'Authentication failed',
          message: 'Invalid signature'
        });
      }

      // Generate JWT token
      const token = generateToken({
        walletAddress,
        loginTime: Date.now()
      });

      logger.info({
        type: 'login_success',
        walletAddress,
        ip: req.ip
      });

      res.json({
        success: true,
        token,
        walletAddress,
        expiresIn: 3600 // 1 hour
      });
    } catch (error) {
      logger.error({
        type: 'signature_verification_error',
        error: error.message,
        walletAddress
      });

      return res.status(400).json({
        error: 'Signature verification failed',
        message: error.message
      });
    }
  } catch (error) {
    logger.error({
      type: 'login_error',
      error: error.message,
      stack: error.stack
    });
    next(error);
  }
});

/**
 * POST /api/auth/refresh
 * Refresh an existing JWT token
 * Requires valid JWT in Authorization header
 */
router.post('/refresh', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Missing or invalid Authorization header'
      });
    }

    const oldToken = authHeader.split(' ')[1];
    const { verifyToken } = require('../middleware/auth');

    try {
      const decoded = verifyToken(oldToken);

      // Generate new token with same wallet address
      const newToken = generateToken({
        walletAddress: decoded.walletAddress,
        loginTime: Date.now()
      });

      logger.info({
        type: 'token_refreshed',
        walletAddress: decoded.walletAddress
      });

      res.json({
        success: true,
        token: newToken,
        expiresIn: 3600
      });
    } catch (error) {
      return res.status(401).json({
        error: 'Invalid or expired token',
        message: error.message
      });
    }
  } catch (error) {
    logger.error({
      type: 'token_refresh_error',
      error: error.message
    });
    next(error);
  }
});

/**
 * GET /api/auth/verify
 * Verify if a JWT token is valid
 */
router.get('/verify', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        valid: false,
        error: 'Missing or invalid Authorization header'
      });
    }

    const token = authHeader.split(' ')[1];
    const { verifyToken } = require('../middleware/auth');

    try {
      const decoded = verifyToken(token);

      res.json({
        valid: true,
        walletAddress: decoded.walletAddress,
        loginTime: decoded.loginTime,
        expiresAt: decoded.exp * 1000 // Convert to milliseconds
      });
    } catch (error) {
      res.status(401).json({
        valid: false,
        error: 'Invalid or expired token',
        message: error.message
      });
    }
  } catch (error) {
    logger.error({
      type: 'token_verification_error',
      error: error.message
    });
    next(error);
  }
});

module.exports = router;
