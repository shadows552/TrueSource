#!/bin/sh
# Initialize Vault with BBF secrets
# This script is run after Vault starts to populate secrets

set -e

# Wait for Vault to be ready
echo "Waiting for Vault to be ready..."
until vault status > /dev/null 2>&1; do
  sleep 1
done

echo "Vault is ready. Initializing secrets..."

# Login to Vault (in dev mode, we use the root token)
vault login -no-print "${VAULT_DEV_ROOT_TOKEN_ID:-dev-root-token}"

# Enable KV v2 secrets engine if not already enabled
vault secrets enable -version=2 -path=secret kv 2>/dev/null || echo "KV secrets engine already enabled"

# Create BBF application secrets
echo "Creating BBF application secrets..."

# Backend secrets
vault kv put secret/bbf/backend \
  solana_network=devnet \
  solana_rpc_url=https://api.devnet.solana.com \
  allowed_origins=http://localhost:8080 \
  log_level=info \
  api_secret="$(openssl rand -hex 32)"

# JWT secrets
vault kv put secret/jwt \
  secret="$(openssl rand -hex 64)" \
  issuer="bbf-api" \
  expiry=3600

# Frontend secrets
vault kv put secret/bbf/frontend \
  api_url=http://localhost:3000/api \
  solana_network=devnet

# Database secrets (for future use)
vault kv put secret/database \
  host=postgres \
  port=5432 \
  username=bbf_user \
  password="$(openssl rand -hex 32)" \
  database=bbf_db

# API keys (for future use)
vault kv put secret/api-keys \
  solana_api_key=placeholder \
  monitoring_api_key=placeholder

# Create and apply application policy
echo "Creating application policy..."
vault policy write bbf-app /vault/policies/app-policy.hcl

# Create a token for the application with the policy
echo "Creating application token..."
APP_TOKEN=$(vault token create -policy=bbf-app -format=json | jq -r '.auth.client_token')
echo "Application token: $APP_TOKEN"
echo "$APP_TOKEN" > /vault/file/app-token.txt

echo "Vault initialization complete!"
echo ""
echo "==================================================================="
echo "VAULT SECRETS SUMMARY"
echo "==================================================================="
echo "Root Token: ${VAULT_DEV_ROOT_TOKEN_ID:-dev-root-token}"
echo "App Token: $APP_TOKEN"
echo "Vault UI: http://localhost:8200/ui"
echo "==================================================================="
echo ""
echo "Secrets created:"
vault kv list secret/bbf/
vault kv list secret/
echo ""
