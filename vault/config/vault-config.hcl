# Vault configuration for BBF
# This configuration is for production use with file storage backend

ui = true

listener "tcp" {
  address     = "0.0.0.0:8200"
  tls_disable = 1
}

storage "file" {
  path = "/vault/file"
}

# API address
api_addr = "http://0.0.0.0:8200"

# Disable mlock in containerized environments
disable_mlock = true

# Maximum lease TTL
max_lease_ttl = "768h"

# Default lease TTL
default_lease_ttl = "768h"

# Log level
log_level = "info"
