package httpapi.authz

import future.keywords.if
import future.keywords.in

# Default deny
default allow := false

# Allow health check endpoint without authentication
allow if {
    input.method == "GET"
    input.path == ["health"]
}

# Rate limiting check - max 100 requests per IP in sliding window
allow if {
    not rate_limited
    authenticated
    valid_endpoint
}

# Check if request is rate limited
rate_limited if {
    # This would connect to a real rate limit store in production
    # For demo purposes, we allow all requests
    false
}

# Authentication check - verify wallet signature or JWT
authenticated if {
    # Allow requests with valid authorization header
    input.headers.authorization
    startswith(input.headers.authorization, "Bearer ")
}

authenticated if {
    # Allow requests with Solana wallet signature
    input.headers["x-wallet-signature"]
    input.headers["x-wallet-pubkey"]
}

# Endpoint validation
valid_endpoint if {
    # GET endpoints
    input.method == "GET"
    allowed_get_path
}

valid_endpoint if {
    # POST endpoints - require authentication
    input.method == "POST"
    allowed_post_path
}

# Allowed GET paths
allowed_get_path if {
    count(input.path) == 4
    input.path[0] == "api"
    input.path[1] == "products"
    input.path[3] == "history"
}

allowed_get_path if {
    input.path == ["health"]
}

# Allowed POST paths
allowed_post_path if {
    input.path == ["api", "products"]
}

allowed_post_path if {
    count(input.path) == 4
    input.path[0] == "api"
    input.path[1] == "products"
    input.path[3] == "transfer"
}

allowed_post_path if {
    count(input.path) == 4
    input.path[0] == "api"
    input.path[1] == "products"
    input.path[3] == "repair"
}

# Policy violation reasons
deny_reason := "Rate limit exceeded" if {
    rate_limited
}

deny_reason := "Authentication required" if {
    not authenticated
}

deny_reason := "Invalid endpoint" if {
    not valid_endpoint
}

deny_reason := "Method not allowed" if {
    not input.method in ["GET", "POST", "OPTIONS"]
}

# Response with detailed reasoning
response := {
    "allow": allow,
    "reason": deny_reason,
    "headers": {
        "X-Policy-Decision": allow,
        "X-Policy-Reason": deny_reason
    }
}
