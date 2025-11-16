const vault = require('node-vault');
const logger = require('./logger');

// Initialize Vault client
const vaultClient = vault({
  apiVersion: 'v1',
  endpoint: process.env.VAULT_ADDR || 'http://vault:8200',
  token: process.env.VAULT_TOKEN || 'dev-root-token'
});

// Cache for secrets to reduce Vault API calls
const secretsCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get a secret from Vault with caching
 * @param {string} path - The path to the secret in Vault (e.g., 'secret/bbf/backend')
 * @param {string} key - The specific key within the secret
 * @returns {Promise<string>} The secret value
 */
async function getSecret(path, key) {
  const cacheKey = `${path}:${key}`;
  const cached = secretsCache.get(cacheKey);

  // Return cached value if still valid
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.value;
  }

  try {
    // Fetch from Vault
    const result = await vaultClient.read(path);
    const value = result.data.data[key];

    if (!value) {
      logger.warn({
        type: 'vault_secret_not_found',
        path,
        key
      });
      return null;
    }

    // Cache the value
    secretsCache.set(cacheKey, {
      value,
      timestamp: Date.now()
    });

    logger.info({
      type: 'vault_secret_retrieved',
      path,
      key
    });

    return value;
  } catch (error) {
    logger.error({
      type: 'vault_error',
      error: error.message,
      path,
      key
    });
    throw error;
  }
}

/**
 * Get all secrets from a path
 * @param {string} path - The path to the secrets in Vault
 * @returns {Promise<object>} All secrets at the path
 */
async function getAllSecrets(path) {
  try {
    const result = await vaultClient.read(path);
    logger.info({
      type: 'vault_secrets_retrieved',
      path,
      count: Object.keys(result.data.data).length
    });
    return result.data.data;
  } catch (error) {
    logger.error({
      type: 'vault_error',
      error: error.message,
      path
    });
    throw error;
  }
}

/**
 * Load configuration from Vault and merge with environment variables
 * Environment variables take precedence over Vault secrets
 */
async function loadConfig() {
  try {
    const vaultSecrets = await getAllSecrets('secret/data/bbf/backend');
    const jwtSecrets = await getAllSecrets('secret/data/jwt');

    // Merge with environment variables (env vars take precedence)
    const config = {
      port: process.env.PORT || 3000,
      nodeEnv: process.env.NODE_ENV || 'production',
      logLevel: process.env.LOG_LEVEL || vaultSecrets.log_level || 'info',
      solanaNetwork: process.env.SOLANA_NETWORK || vaultSecrets.solana_network || 'devnet',
      solanaRpcUrl: process.env.SOLANA_RPC_URL || vaultSecrets.solana_rpc_url,
      allowedOrigins: process.env.ALLOWED_ORIGINS || vaultSecrets.allowed_origins,
      apiSecret: process.env.API_SECRET || vaultSecrets.api_secret,
      jwtSecret: process.env.JWT_SECRET || jwtSecrets.secret,
      jwtIssuer: process.env.JWT_ISSUER || jwtSecrets.issuer || 'bbf-api',
      jwtExpiry: process.env.JWT_EXPIRY || jwtSecrets.expiry || 3600,
      lokiUrl: process.env.LOKI_URL || 'http://loki:3100'
    };

    logger.info({
      type: 'config_loaded',
      source: 'vault_and_env',
      solanaNetwork: config.solanaNetwork
    });

    return config;
  } catch (error) {
    logger.warn({
      type: 'vault_config_load_failed',
      error: error.message,
      fallback: 'environment_variables'
    });

    // Fallback to environment variables only
    return {
      port: process.env.PORT || 3000,
      nodeEnv: process.env.NODE_ENV || 'production',
      logLevel: process.env.LOG_LEVEL || 'info',
      solanaNetwork: process.env.SOLANA_NETWORK || 'devnet',
      solanaRpcUrl: process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
      allowedOrigins: process.env.ALLOWED_ORIGINS || 'http://localhost:8080',
      apiSecret: process.env.API_SECRET,
      jwtSecret: process.env.JWT_SECRET,
      jwtIssuer: process.env.JWT_ISSUER || 'bbf-api',
      jwtExpiry: process.env.JWT_EXPIRY || 3600,
      lokiUrl: process.env.LOKI_URL || 'http://loki:3100'
    };
  }
}

/**
 * Health check for Vault connection
 */
async function healthCheck() {
  try {
    const health = await vaultClient.health();
    return {
      healthy: true,
      initialized: health.initialized,
      sealed: health.sealed
    };
  } catch (error) {
    return {
      healthy: false,
      error: error.message
    };
  }
}

module.exports = {
  getSecret,
  getAllSecrets,
  loadConfig,
  healthCheck,
  vaultClient
};
