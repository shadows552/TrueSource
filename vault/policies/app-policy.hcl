# Policy for BBF application to read secrets
# This policy allows the backend and frontend services to read secrets

# Allow reading secrets from the KV v2 secrets engine
path "secret/data/bbf/*" {
  capabilities = ["read", "list"]
}

# Allow listing secret paths
path "secret/metadata/bbf/*" {
  capabilities = ["list"]
}

# Allow reading database credentials
path "secret/data/database/*" {
  capabilities = ["read"]
}

# Allow reading API keys
path "secret/data/api-keys/*" {
  capabilities = ["read"]
}

# Allow reading JWT secrets
path "secret/data/jwt/*" {
  capabilities = ["read"]
}

# Deny all other paths by default
