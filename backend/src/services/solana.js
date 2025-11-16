const { Connection, PublicKey, Keypair } = require('@solana/web3.js');
const logger = require('../logger');

class SolanaService {
  constructor() {
    const network = process.env.SOLANA_NETWORK || 'devnet';
    const rpcUrl = process.env.SOLANA_RPC_URL || `https://api.${network}.solana.com`;

    this.connection = new Connection(rpcUrl, 'confirmed');
    this.programId = new PublicKey(process.env.SOLANA_PROGRAM_ID || '11111111111111111111111111111111');

    // In-memory storage for product transactions
    // productId -> array of transactions
    this.productHistory = new Map();

    // Array of all transactions for recent entries
    this.allTransactions = [];

    logger.info({
      type: 'solana_service_initialized',
      network,
      programId: this.programId.toString()
    });
  }

  async createProduct(productId, metadata, manufacturerPublicKey) {
    logger.info({
      type: 'solana_create_product',
      productId,
      manufacturer: manufacturerPublicKey
    });

    // Check if product already exists
    if (this.productHistory.has(productId)) {
      throw new Error('Product ID already exists');
    }

    // Create transaction record
    const transaction = {
      type: 'Manufacture',
      timestamp: Date.now(),
      owner: manufacturerPublicKey,
      metadata: metadata || '',
      productId
    };

    // Store in product history
    this.productHistory.set(productId, [transaction]);

    // Add to all transactions
    this.allTransactions.push(transaction);

    // TODO: Implement actual Solana transaction
    // This is a placeholder that should be replaced with actual Solana program interaction

    return {
      signature: 'mock_signature_' + Date.now(),
      account: Keypair.generate().publicKey.toString()
    };
  }

  async transferOwnership(productId, currentOwner, nextOwner) {
    logger.info({
      type: 'solana_transfer_ownership',
      productId,
      from: currentOwner,
      to: nextOwner
    });

    // Check if product exists
    if (!this.productHistory.has(productId)) {
      throw new Error('Product ID does not exist');
    }

    // Get product history and verify current owner
    const history = this.productHistory.get(productId);
    const latestRecord = history[history.length - 1];

    if (latestRecord.owner !== currentOwner) {
      throw new Error(`Ownership verification failed. Current owner is ${latestRecord.owner}, not ${currentOwner}`);
    }

    // Create transaction record
    const transaction = {
      type: 'Transfer',
      timestamp: Date.now(),
      owner: nextOwner,
      previousOwner: currentOwner,
      productId
    };

    // Add to product history
    history.push(transaction);
    this.productHistory.set(productId, history);

    // Add to all transactions
    this.allTransactions.push(transaction);

    // TODO: Implement actual Solana transaction

    return {
      signature: 'mock_signature_' + Date.now()
    };
  }

  async recordRepair(productId, owner, metadata) {
    logger.info({
      type: 'solana_record_repair',
      productId,
      owner
    });

    // Check if product exists
    if (!this.productHistory.has(productId)) {
      throw new Error('Product ID does not exist');
    }

    // Get product history and verify current owner
    const history = this.productHistory.get(productId);
    const latestRecord = history[history.length - 1];

    if (latestRecord.owner !== owner) {
      throw new Error(`Ownership verification failed. Current owner is ${latestRecord.owner}, not ${owner}`);
    }

    // Create transaction record
    const transaction = {
      type: 'Repair',
      timestamp: Date.now(),
      owner,
      metadata,
      productId
    };

    // Add to product history
    history.push(transaction);
    this.productHistory.set(productId, history);

    // Add to all transactions
    this.allTransactions.push(transaction);

    // TODO: Implement actual Solana transaction

    return {
      signature: 'mock_signature_' + Date.now()
    };
  }

  async getProductHistory(productId) {
    logger.info({
      type: 'solana_get_history',
      productId
    });

    // Check if product exists
    if (!this.productHistory.has(productId)) {
      throw new Error('Product ID does not exist');
    }

    // Return product history
    return this.productHistory.get(productId);
  }

  async getRecentTransactions(limit = 10) {
    logger.info({
      type: 'solana_get_recent_transactions',
      limit
    });

    // Return the most recent transactions
    return this.allTransactions.slice(-limit).reverse();
  }
}

module.exports = new SolanaService();
