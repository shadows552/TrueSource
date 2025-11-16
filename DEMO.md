# BBF Security Features Demonstration Guide

This guide provides step-by-step instructions for demonstrating the comprehensive security features implemented in the Blockchain-Based Product Provenance (BBF) system.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [System Startup](#system-startup)
3. [Demo 1: Runtime Security Monitoring (Falco)](#demo-1-runtime-security-monitoring-falco)
4. [Demo 2: Web Application Firewall (ModSecurity)](#demo-2-web-application-firewall-modsecurity)
5. [Demo 3: Rate Limiting](#demo-3-rate-limiting)
6. [Demo 4: CORS Protection](#demo-4-cors-protection)
7. [Demo 5: OPA Policy Enforcement](#demo-5-opa-policy-enforcement)
8. [Demo 6: JWT Authentication](#demo-6-jwt-authentication)
9. [Demo 7: Secrets Management with Vault](#demo-7-secrets-management-with-vault)
10. [Demo 8: CI/CD Quality Gates](#demo-8-cicd-quality-gates)
11. [Monitoring and Observability](#monitoring-and-observability)

---

## Prerequisites

- Docker and Docker Compose installed
- curl or similar HTTP client
- jq (optional, for JSON formatting)
- Access to http://localhost:8080 (Frontend)
- Access to http://localhost:3000 (Backend API)
- Access to http://localhost:3001 (Grafana)

## System Startup

```bash
# Start all services
docker-compose up -d

# Wait for all services to be healthy (approximately 30-60 seconds)
docker-compose ps

# Initialize Vault with secrets (if not auto-initialized)
docker exec -it bbf-vault sh /vault/scripts/init-vault.sh

# Verify all services are running
docker-compose ps
```

Expected output: All services should show status "Up" or "Up (healthy)".

---

## Demo 1: Runtime Security Monitoring (Falco)

**Objective**: Demonstrate Falco detecting unauthorized shell access in containers.

### Test 1.1: Detect Shell Execution (CRITICAL Alert)

```bash
# Open a shell in the backend container (triggers CRITICAL alert)
docker exec -it bbf-backend sh

# Type 'exit' to close the shell
exit
```

**Expected Behavior**:
- Falco immediately detects the shell execution
- A CRITICAL priority alert is generated

**Verification**:
```bash
# View Falco logs
docker-compose logs falco | grep -i "shell"

# Expected output (similar to):
# bbf-falco | {
#   "priority": "Critical",
#   "rule": "Shell Execution in Backend Container",
#   "output": "Shell spawned in backend container (user=root shell=sh container=bbf-backend)",
#   "time": "2025-11-16T..."
# }
```

**View in Grafana**:
1. Open http://localhost:3001 (Login: admin/admin123)
2. Navigate to "Security Monitoring" dashboard
3. View "Critical Security Events" panel
4. See the shell execution alert with timestamp

### Test 1.2: Detect Sensitive File Access

```bash
# Attempt to read /etc/shadow in the container
docker exec bbf-backend cat /etc/shadow
```

**Expected Behavior**:
- Falco detects sensitive file access
- WARNING priority alert is generated

**Verification**:
```bash
docker-compose logs falco | grep -i "sensitive"
```

### Test 1.3: Detect Package Manager Execution

```bash
# Run package manager in container (triggers WARNING)
docker exec bbf-backend apt-get update
```

**Expected Behavior**:
- Falco detects unexpected package manager execution
- WARNING alert is logged

---

## Demo 2: Web Application Firewall (ModSecurity)

**Objective**: Demonstrate WAF blocking common attack patterns.

### Test 2.1: SQL Injection Attack

```bash
# Attempt SQL injection in API request
curl -X GET "http://localhost/api/products?id=1' OR '1'='1" -v

# Alternative test
curl -X POST "http://localhost/api/products" \
  -H "Content-Type: application/json" \
  -d '{"productId": "1; DROP TABLE products--"}'
```

**Expected Behavior**:
- Request is blocked by ModSecurity
- HTTP 403 Forbidden response
- ModSecurity log entry created

**Verification**:
```bash
# Check WAF logs
docker-compose logs nginx-waf | grep -i modsecurity | grep -i "sql"

# Expected output includes:
# ModSecurity: Access denied with code 403
# Rule: SQL Injection Attack
```

### Test 2.2: Cross-Site Scripting (XSS) Attack

```bash
# Attempt XSS attack
curl -X GET "http://localhost/api/products?search=<script>alert('xss')</script>" -v

# Alternative payload
curl "http://localhost/api/products?name=<img src=x onerror=alert(1)>"
```

**Expected Behavior**:
- Request blocked by ModSecurity
- HTTP 403 Forbidden
- XSS attack logged

### Test 2.3: Path Traversal Attack

```bash
# Attempt directory traversal
curl "http://localhost/api/../../etc/passwd" -v
```

**Expected Behavior**:
- Request blocked
- HTTP 403 Forbidden

### Test 2.4: Security Scanner Detection

```bash
# Simulate security scanner user-agent
curl "http://localhost/api/products" \
  -H "User-Agent: sqlmap/1.0" -v
```

**Expected Behavior**:
- Request blocked based on user-agent
- HTTP 403 Forbidden

**View All WAF Blocks**:
```bash
# Summary of blocked requests
docker-compose logs nginx-waf | grep "ModSecurity.*denied" | wc -l

# Detailed view of last 10 blocks
docker-compose logs nginx-waf | grep "ModSecurity" | tail -20
```

---

## Demo 3: Rate Limiting

**Objective**: Demonstrate multi-layer rate limiting preventing abuse.

### Test 3.1: NGINX Rate Limiting (10 req/second)

```bash
# Send 20 rapid requests
for i in {1..20}; do
  echo "Request $i:"
  curl -s -o /dev/null -w "%{http_code}\n" "http://localhost/api/products/TEST123/history"
  sleep 0.05  # 50ms delay = 20 req/sec
done
```

**Expected Behavior**:
- First ~10 requests: HTTP 200
- Subsequent requests: HTTP 503 (Service Unavailable) or 429 (Too Many Requests)
- Burst allowance of 20 requests exhausted

**Verification**:
```bash
# Check rate limit logs
docker-compose logs nginx-waf | grep "limiting requests"
```

### Test 3.2: Backend Rate Limiting (100 req/15 minutes)

```bash
# Send 150 requests to trigger backend rate limit
for i in {1..150}; do
  curl -s "http://localhost:3000/api/products/TEST$i/history" &
done
wait

# Check for 429 responses
```

**Expected Behavior**:
- After ~100 requests within 15 minutes: HTTP 429
- Error message: "Too many requests from this IP, please try again later."

### Test 3.3: Monitor Rate Limits in Grafana

1. Open http://localhost:3001
2. Navigate to "Security Monitoring" dashboard
3. View "Rate Limit Events" panel
4. See spikes in request rates and subsequent blocks

---

## Demo 4: CORS Protection

**Objective**: Demonstrate CORS preventing unauthorized cross-origin requests.

### Test 4.1: Allowed Origin Request

```bash
# Request from allowed origin
curl -X POST "http://localhost/api/products" \
  -H "Origin: http://localhost:8080" \
  -H "Content-Type: application/json" \
  -d '{"productId": "TEST001", "manufacturerPublicKey": "test"}' -v
```

**Expected Behavior**:
- Request processed
- Response includes CORS headers:
  - `Access-Control-Allow-Origin: http://localhost:8080`
  - `Access-Control-Allow-Credentials: true`

### Test 4.2: Blocked Origin Request

```bash
# Request from disallowed origin
curl -X POST "http://localhost/api/products" \
  -H "Origin: http://malicious-site.com" \
  -H "Content-Type: application/json" \
  -d '{"productId": "TEST002", "manufacturerPublicKey": "test"}' -v
```

**Expected Behavior**:
- Request reaches backend but browser would block response
- No `Access-Control-Allow-Origin` header for unauthorized origin

### Test 4.3: Preflight Request

```bash
# OPTIONS preflight request
curl -X OPTIONS "http://localhost/api/products" \
  -H "Origin: http://localhost:8080" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type, Authorization" -v
```

**Expected Behavior**:
- HTTP 204 No Content
- CORS headers returned:
  - `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS`
  - `Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Wallet-Signature, X-Wallet-Pubkey`
  - `Access-Control-Max-Age: 1728000` (20 days)

### Test 4.4: Verify CORS Headers

```bash
# Check CORS headers in response
curl -X GET "http://localhost/api/products/TEST123/history" \
  -H "Origin: http://localhost:8080" -v 2>&1 | grep -i "access-control"
```

**Expected Headers**:
```
Access-Control-Allow-Origin: http://localhost:8080
Access-Control-Allow-Credentials: true
Access-Control-Expose-Headers: Content-Length, Content-Range, X-Policy-Decision, X-Policy-Reason
```

---

## Demo 5: OPA Policy Enforcement

**Objective**: Demonstrate Open Policy Agent enforcing API authorization policies.

### Test 5.1: Query OPA Policy Directly

```bash
# Test policy decision for allowed endpoint
curl -X POST http://localhost:8181/v1/data/httpapi/authz \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "method": "GET",
      "path": ["api", "products", "TEST123", "history"],
      "headers": {
        "authorization": "Bearer test-token"
      }
    }
  }' | jq
```

**Expected Response**:
```json
{
  "result": {
    "allow": true,
    "response": {
      "allow": true,
      "headers": {
        "X-Policy-Decision": true,
        "X-Policy-Reason": null
      }
    }
  }
}
```

### Test 5.2: Test Policy Denial

```bash
# Test unauthorized endpoint
curl -X POST http://localhost:8181/v1/data/httpapi/authz \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "method": "DELETE",
      "path": ["api", "products", "TEST123"],
      "headers": {}
    }
  }' | jq
```

**Expected Response**:
```json
{
  "result": {
    "allow": false,
    "deny_reason": "Method not allowed"
  }
}
```

### Test 5.3: Test Authentication Requirement

```bash
# Request without auth headers
curl -X POST http://localhost:8181/v1/data/httpapi/authz \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "method": "POST",
      "path": ["api", "products"],
      "headers": {}
    }
  }' | jq
```

**Expected Response**:
```json
{
  "result": {
    "allow": false,
    "deny_reason": "Authentication required"
  }
}
```

### Test 5.4: Check OPA Integration in NGINX

```bash
# Make API request and check for OPA decision headers
curl -X GET "http://localhost/api/products/TEST123/history" \
  -H "Authorization: Bearer test-token" -v 2>&1 | grep -i "x-opa"
```

**Note**: In current demo configuration, OPA is integrated but returns 200 for all requests (see nginx/nginx.conf line 151). In production, this would make actual policy calls.

---

## Demo 6: JWT Authentication

**Objective**: Demonstrate JWT-based authentication protecting API endpoints.

### Test 6.1: Generate JWT Token (Login)

```bash
# Note: This requires a valid Solana wallet signature
# For demo purposes, we'll test the endpoint structure

# Login endpoint (returns JWT if signature valid)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "YOUR_WALLET_PUBLIC_KEY",
    "message": "Sign this message to authenticate",
    "signature": "YOUR_SIGNATURE"
  }'
```

**Expected Response (with valid signature)**:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "walletAddress": "YOUR_WALLET_PUBLIC_KEY",
  "expiresIn": 3600
}
```

### Test 6.2: Verify JWT Token

```bash
# Verify if token is valid
curl -X GET http://localhost:3000/api/auth/verify \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response (valid token)**:
```json
{
  "valid": true,
  "walletAddress": "YOUR_WALLET_PUBLIC_KEY",
  "loginTime": 1700000000000,
  "expiresAt": 1700003600000
}
```

### Test 6.3: Refresh JWT Token

```bash
# Refresh existing token before expiry
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response**:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600
}
```

### Test 6.4: Access Protected Endpoint Without Token

```bash
# Attempt to access protected endpoint without JWT
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "TEST999",
    "manufacturerPublicKey": "test"
  }'
```

**Expected Behavior**:
- If authentication is enforced: HTTP 401 Unauthorized
- Error: "Authentication required"

### Test 6.5: Access with Invalid Token

```bash
# Use invalid/expired token
curl -X POST http://localhost:3000/api/products \
  -H "Authorization: Bearer invalid.token.here" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "TEST999",
    "manufacturerPublicKey": "test"
  }'
```

**Expected Behavior**:
- HTTP 403 Forbidden
- Error: "Invalid or expired token"

---

## Demo 7: Secrets Management with Vault

**Objective**: Demonstrate HashiCorp Vault managing application secrets.

### Test 7.1: Verify Vault is Running

```bash
# Check Vault health
curl http://localhost:8200/v1/sys/health | jq

# Expected: initialized=true, sealed=false
```

### Test 7.2: List Secrets (requires token)

```bash
# Set Vault token
export VAULT_TOKEN="dev-root-token"
export VAULT_ADDR="http://localhost:8200"

# List secret paths
docker exec bbf-vault vault kv list secret/bbf/
```

**Expected Output**:
```
Keys
----
backend
frontend
```

### Test 7.3: Read Backend Secrets

```bash
# Read backend secrets from Vault
docker exec bbf-vault vault kv get secret/bbf/backend
```

**Expected Output**:
```
====== Data ======
Key                Value
---                -----
allowed_origins    http://localhost:8080
api_secret         [REDACTED]
log_level          info
solana_network     devnet
solana_rpc_url     https://api.devnet.solana.com
```

### Test 7.4: Read JWT Secrets

```bash
# Read JWT configuration
docker exec bbf-vault vault kv get secret/jwt
```

**Expected Output**:
```
====== Data ======
Key       Value
---       -----
expiry    3600
issuer    bbf-api
secret    [REDACTED]
```

### Test 7.5: Verify Backend Loads Config from Vault

```bash
# Check backend health endpoint (shows config status)
curl http://localhost:3000/health | jq

# Expected: "config": "loaded", "vault": {"healthy": true}
```

### Test 7.6: Access Vault UI

1. Open http://localhost:8200/ui
2. Login with token: `dev-root-token`
3. Navigate to "secret/bbf/"
4. View all application secrets
5. Verify secrets are not exposed in environment variables

### Test 7.7: Test Secret Rotation

```bash
# Update a secret in Vault
docker exec bbf-vault vault kv put secret/bbf/backend \
  allowed_origins=http://localhost:8080,https://production.example.com

# Backend will load new value on next request (within 5-minute cache TTL)
```

---

## Demo 8: CI/CD Quality Gates

**Objective**: Demonstrate deployment blocking on critical vulnerabilities.

### Test 8.1: Review CI/CD Pipeline Configuration

```bash
# View the security scan workflow
cat .github/workflows/security-scan.yml
```

**Key Features**:
- Dependency vulnerability scanning with npm audit
- Container image scanning with Trivy
- SARIF uploads to GitHub Security
- Deployment blocked on CRITICAL or HIGH severity issues

### Test 8.2: Simulate Dependency Vulnerability Scan

```bash
# Run npm audit locally
cd backend
npm audit --audit-level=high

# Exit code 0 = no critical/high vulnerabilities
# Exit code 1 = vulnerabilities found (would block deployment)
```

### Test 8.3: Simulate Container Scan

```bash
# Build Docker image
docker build -t bbf-backend:test backend/

# Scan with Trivy
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy:latest image \
  --severity CRITICAL,HIGH \
  --exit-code 1 \
  bbf-backend:test
```

**Expected Behavior**:
- If vulnerabilities found: Exit code 1 (would block deployment)
- If clean: Exit code 0 (deployment proceeds)

### Test 8.4: View GitHub Security Tab

1. Navigate to GitHub repository → Security tab
2. View "Code scanning alerts"
3. See Trivy scan results uploaded via SARIF
4. Review vulnerability details and severity

**Example Workflow**:
1. Developer pushes code with vulnerable dependency
2. CI/CD runs npm audit
3. High severity vulnerability detected
4. Pipeline fails with exit code 1
5. Deployment blocked until vulnerability fixed
6. Alert visible in GitHub Security tab

---

## Monitoring and Observability

### Grafana Dashboards

**Access**: http://localhost:3001 (admin/admin123)

#### Security Monitoring Dashboard

**Panels**:
1. **Critical Security Events** - Falco critical alerts
2. **WAF Block Rate** - ModSecurity blocks over time
3. **Rate Limit Violations** - Rate limiting hits
4. **Authentication Failures** - Failed JWT verifications
5. **Top Blocked IPs** - Most blocked source IPs
6. **Attack Type Distribution** - SQL injection, XSS, etc.

**Usage**:
```bash
# Generate some events first
# Then view in Grafana

# Trigger some WAF blocks
curl "http://localhost/api/products?id=1' OR 1=1--"

# Trigger rate limits
for i in {1..50}; do curl http://localhost/api/products/TEST/history & done

# Trigger Falco alert
docker exec -it bbf-backend sh
```

#### Application Logs Dashboard

**Panels**:
1. **Request Volume** - API requests over time
2. **Error Rate** - 4xx/5xx responses
3. **Response Time** - API latency
4. **Log Level Distribution** - info, warn, error counts
5. **Recent Errors** - Latest error messages
6. **Product Operations** - Create, transfer, repair counts

**Query Examples**:
```
# View all errors in last hour
{container_name="bbf-backend"} |= "error"

# View security events
{container_name="bbf-falco"} |= "priority" |= "Critical"

# View WAF blocks
{container_name="bbf-nginx-waf"} |= "ModSecurity"
```

### Loki Log Queries

**Access**: http://localhost:3100 (or via Grafana)

```bash
# Query logs via API
curl -G -s "http://localhost:3100/loki/api/v1/query_range" \
  --data-urlencode 'query={container_name="bbf-backend"}' \
  --data-urlencode 'limit=10' | jq

# Filter by log level
curl -G -s "http://localhost:3100/loki/api/v1/query_range" \
  --data-urlencode 'query={container_name="bbf-backend"} |= "error"' | jq
```

### Falco Alerts

```bash
# Real-time Falco alerts
docker-compose logs -f falco

# Filter by priority
docker-compose logs falco | jq 'select(.priority=="Critical")'

# Count alerts by rule
docker-compose logs falco | jq -r '.rule' | sort | uniq -c
```

---

## Complete Security Demo Script

Run all demos in sequence:

```bash
#!/bin/bash
echo "🔐 BBF Security Features Demo"
echo "=============================="

echo "\n1️⃣ Testing Runtime Security (Falco)..."
docker exec bbf-backend sh -c "exit"
docker-compose logs falco | tail -5

echo "\n2️⃣ Testing WAF (SQL Injection)..."
curl -s "http://localhost/api/products?id=1' OR 1=1" | head -5

echo "\n3️⃣ Testing Rate Limiting..."
for i in {1..15}; do
  curl -s -o /dev/null -w "Request $i: %{http_code}\n" \
    "http://localhost/api/products/TEST/history"
done

echo "\n4️⃣ Testing CORS..."
curl -s -X OPTIONS "http://localhost/api/products" \
  -H "Origin: http://localhost:8080" -v 2>&1 | grep -i access-control

echo "\n5️⃣ Testing OPA Policy..."
curl -s -X POST http://localhost:8181/v1/data/httpapi/authz \
  -H "Content-Type: application/json" \
  -d '{"input": {"method": "GET", "path": ["health"]}}' | jq .result.allow

echo "\n6️⃣ Testing Vault Health..."
curl -s http://localhost:8200/v1/sys/health | jq .initialized

echo "\n7️⃣ Testing Backend Health..."
curl -s http://localhost:3000/health | jq

echo "\n✅ Demo Complete!"
echo "📊 View dashboards at http://localhost:3001 (admin/admin123)"
```

Save as `demo-script.sh`, make executable, and run:
```bash
chmod +x demo-script.sh
./demo-script.sh
```

---

## Cleanup

```bash
# Stop all services
docker-compose down

# Remove volumes (WARNING: deletes all data)
docker-compose down -v

# Remove all images
docker-compose down --rmi all
```

---

## Troubleshooting

### Falco Not Generating Alerts

```bash
# Check Falco is running
docker-compose ps falco

# Check Falco logs for errors
docker-compose logs falco | grep -i error

# Verify Falco rules loaded
docker-compose logs falco | grep "rules file"
```

### WAF Not Blocking

```bash
# Check ModSecurity is enabled
docker-compose logs nginx-waf | grep "ModSecurity.*on"

# Verify rules loaded
docker-compose exec nginx-waf cat /etc/modsecurity.d/modsecurity.conf | grep SecRuleEngine
```

### Vault Not Accessible

```bash
# Check Vault health
docker-compose ps vault
curl http://localhost:8200/v1/sys/health

# Re-initialize if needed
docker-compose restart vault
docker exec bbf-vault sh /vault/scripts/init-vault.sh
```

### Grafana Dashboards Empty

```bash
# Verify Loki is receiving logs
curl http://localhost:3100/ready

# Check Promtail is shipping logs
docker-compose logs promtail | tail -20

# Generate some activity
curl http://localhost:3000/health
```

---

## Summary

This demo guide covers all major security features:

✅ **Runtime Security** - Falco detecting unauthorized container activity
✅ **Web Application Firewall** - ModSecurity blocking attacks
✅ **Rate Limiting** - Multi-layer request throttling
✅ **CORS Protection** - Cross-origin request validation
✅ **Policy Enforcement** - OPA authorization decisions
✅ **Authentication** - JWT-based API security
✅ **Secrets Management** - Vault protecting sensitive data
✅ **CI/CD Quality Gates** - Blocking vulnerable deployments
✅ **Observability** - Comprehensive monitoring and logging

Each feature is demonstrated with practical examples, expected outputs, and verification steps.

For questions or issues, refer to the main project documentation in `README.md` and `REPOSITORY_DOCUMENTATION.md`.
