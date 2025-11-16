const express = require('express');
const router = express.Router();
const logger = require('../logger');
const solanaService = require('../services/solana');

// Create a new product (manufacturer)
router.post('/', async (req, res, next) => {
  try {
    const { productId, metadata, manufacturerPublicKey } = req.body;

    logger.info({
      type: 'product_create_request',
      productId,
      manufacturer: manufacturerPublicKey
    });

    // Validate input
    if (!productId || !manufacturerPublicKey) {
      return res.status(400).json({
        error: 'Missing required fields: productId, manufacturerPublicKey'
      });
    }

    // Call Solana service to create product
    const result = await solanaService.createProduct(
      productId,
      metadata || '',
      manufacturerPublicKey
    );

    logger.info({
      type: 'product_created',
      productId,
      transaction: result.signature
    });

    res.status(201).json({
      success: true,
      productId,
      transaction: result.signature,
      account: result.account
    });
  } catch (error) {
    logger.error({
      type: 'product_create_error',
      error: error.message,
      stack: error.stack
    });
    next(error);
  }
});

// Transfer product ownership
router.post('/:productId/transfer', async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { currentOwnerPublicKey, nextOwnerPublicKey } = req.body;

    logger.info({
      type: 'ownership_transfer_request',
      productId,
      from: currentOwnerPublicKey,
      to: nextOwnerPublicKey
    });

    if (!currentOwnerPublicKey || !nextOwnerPublicKey) {
      return res.status(400).json({
        error: 'Missing required fields: currentOwnerPublicKey, nextOwnerPublicKey'
      });
    }

    const result = await solanaService.transferOwnership(
      productId,
      currentOwnerPublicKey,
      nextOwnerPublicKey
    );

    logger.info({
      type: 'ownership_transferred',
      productId,
      transaction: result.signature
    });

    res.json({
      success: true,
      productId,
      transaction: result.signature
    });
  } catch (error) {
    logger.error({
      type: 'ownership_transfer_error',
      productId: req.params.productId,
      error: error.message
    });
    next(error);
  }
});

// Record repair
router.post('/:productId/repair', async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { ownerPublicKey, repairMetadata } = req.body;

    logger.info({
      type: 'repair_record_request',
      productId,
      owner: ownerPublicKey
    });

    if (!ownerPublicKey || !repairMetadata) {
      return res.status(400).json({
        error: 'Missing required fields: ownerPublicKey, repairMetadata'
      });
    }

    const result = await solanaService.recordRepair(
      productId,
      ownerPublicKey,
      repairMetadata
    );

    logger.info({
      type: 'repair_recorded',
      productId,
      transaction: result.signature
    });

    res.json({
      success: true,
      productId,
      transaction: result.signature
    });
  } catch (error) {
    logger.error({
      type: 'repair_record_error',
      productId: req.params.productId,
      error: error.message
    });
    next(error);
  }
});

// Get product history
router.get('/:productId/history', async (req, res, next) => {
  try {
    const { productId } = req.params;

    logger.info({
      type: 'product_history_request',
      productId
    });

    const history = await solanaService.getProductHistory(productId);

    logger.info({
      type: 'product_history_retrieved',
      productId,
      recordCount: history.length
    });

    res.json({
      success: true,
      productId,
      history
    });
  } catch (error) {
    logger.error({
      type: 'product_history_error',
      productId: req.params.productId,
      error: error.message
    });
    next(error);
  }
});

// Get recent transactions
router.get('/recent/transactions', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    logger.info({
      type: 'recent_transactions_request',
      limit
    });

    const transactions = await solanaService.getRecentTransactions(limit);

    logger.info({
      type: 'recent_transactions_retrieved',
      count: transactions.length
    });

    res.json({
      success: true,
      transactions
    });
  } catch (error) {
    logger.error({
      type: 'recent_transactions_error',
      error: error.message
    });
    next(error);
  }
});

module.exports = router;
