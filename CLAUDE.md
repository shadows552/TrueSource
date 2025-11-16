# CLAUDE.md - AI Assistant Guide for BBF Codebase

This document provides comprehensive guidance for AI assistants working on the Blockchain-Based Product Provenance (BBF) project.

## Project Overview

**Project Name**: Blockchain-Based Product Provenance (BBF)
**Type**: Cloud-native dApp for Solana blockchain
**Purpose**: Track product lifecycle on blockchain for provenance verification
**Maturity**: Hackathon project with production-grade security patterns
**Hackathon Score**: 14/15 (93%)

### Key Use Cases
- Second-hand resale with ownership verification
- Repair history tracking for increased resale value
- Anti-counterfeiting through tamper-resistant records
- Anti-theft with cryptographic ownership transfers
- Retail fraud prevention with provenance tracking

Similar to CarFax but for consumer electronics, bikes, and high-value goods.

---

## Repository Structure

```
bbf/
├── backend/                    # Node.js REST API (425 LOC)
│   ├── src/
│   │   ├── index.js            # Express app (108 lines) - Main entry point
│   │   ├── logger.js           # Pino logging (23 lines)
│   │   ├── loki-transport.js   # Loki integration (35 lines)
│   │   ├── routes/
│   │   │   └── products.js     # API routes (177 lines) - 5 endpoints
│   │   └── services/
│   │       └── solana.js       # Blockchain service (82 lines)
│   ├── Dockerfile              # Multi-stage production build
│   ├── Dockerfile.minimal      # CI/CD testing build
│   └── package.json            # Node.js 20+, Express 4.18
│
├── frontend/                   # React SPA (340+ LOC)
│   ├── src/
│   │   ├── main.jsx            # React entry (10 lines)
│   │   ├── App.jsx             # Wallet setup + network selector (72 lines)
│   │   ├── App.css             # Component styling (193 lines)
│   │   └── components/
│   │       └── ProductManager.jsx  # Main UI (206 lines)
│   ├── index.html              # HTML entry with CSP headers
│   ├── Dockerfile              # Multi-stage Nginx build
│   ├── package.json            # React 19, Vite 7
│   └── vite.config.js          # Build config
│
├── solana-program/             # Rust on-chain program (247 LOC)
│   ├── src/
│   │   └── lib.rs              # Solana program logic
│   └── Cargo.toml              # Rust dependencies
│
├── nginx/                      # WAF & reverse proxy
│   ├── nginx.conf              # Security config + rate limiting
│   └── modsecurity.conf        # 7 custom WAF rules
│
├── opa/                        # Policy engine
│   └── policies/
│       ├── api_authz.rego      # API authorization
│       └── container_authz.rego # Container policies
│
├── falco/                      # Runtime security
│   ├── falco.yaml              # Falco config
│   └── rules/
│       └── custom_rules.yaml   # 7 custom security rules
│
├── grafana/                    # Monitoring dashboards
│   ├── dashboards/
│   │   ├── security-monitoring.json
│   │   └── application-logs.json
│   └── provisioning/
│
├── loki/                       # Log aggregation
│   ├── loki-config.yml
│   └── promtail-config.yml
│
├── .github/workflows/
│   └── security-scan.yml       # CI/CD pipeline
│
├── docker-compose.yml          # 8-service orchestration
├── start.sh                    # Helper startup script
├── DEPLOYMENT.md               # Detailed deployment guide (340+ lines)
├── REPOSITORY_DOCUMENTATION.md # Comprehensive technical docs (797 lines)
├── design.md                   # Architecture & design
└── README.md                   # Main project docs

Total: 947 lines of application code + 1000+ lines of configuration
```

---

## Technology Stack

### Application Layer
- **Blockchain**: Solana Devnet
  - On-chain program in Rust (Solana Program v1.17)
  - Borsh serialization for data structures
- **Backend**: Node.js 20+
  - Express 5.1.0 (REST API framework)
  - Pino 10.1.0 (structured JSON logging)
  - @solana/web3.js 1.98.4 (blockchain integration)
  - Helmet 8.1.0 (security headers)
  - express-rate-limit 8.2.1 (API rate limiting)
- **Frontend**: React 19.2.0
  - Vite 7.2.2 (build tool)
  - @solana/wallet-adapter-react (wallet integration)
  - @solana/wallet-adapter-react-ui (wallet UI components)
  - Axios 1.13.2 (HTTP client)
  - Supports Devnet and Local Validator networks with runtime switching

### Infrastructure Layer
- **Containerization**: Docker + Docker Compose
- **Reverse Proxy**: NGINX Alpine
- **WAF**: ModSecurity + OWASP Core Rule Set
- **Policy Engine**: Open Policy Agent (OPA)
- **Runtime Security**: Falco with custom rules

### Observability Layer
- **Log Aggregation**: Loki 2.9.3
- **Log Shipping**: Promtail 2.9.3
- **Visualization**: Grafana 10.2.3
- **Storage**: BoltDB (filesystem-based)

### Development Tools
- **Linting**: ESLint 9.39.1
- **Testing**: Jest 30.2.0
- **Dev Server**: Nodemon 3.1.11, Vite dev server
- **CI/CD**: GitHub Actions
- **Security Scanning**: Trivy, npm audit

---

## Development Workflows

### Initial Setup

```bash
# Clone repository (if not already done)
git clone <repository-url>
cd bbf

# Copy environment templates
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Start all services
./start.sh
# OR
docker-compose up -d

# Wait ~30 seconds for health checks
```

### Backend Development

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Development mode (with auto-reload)
npm run dev

# Production mode
npm start

# Run linter
npm run lint

# Run tests
npm test
```

**Key Files**:
- `src/index.js:1-108` - Express app setup, middleware, routes
- `src/routes/products.js:1-177` - API endpoint implementations
- `src/services/solana.js:1-82` - Solana blockchain interactions
- `src/logger.js:1-23` - Structured logging configuration

**API Endpoints**:
- `POST /api/products` - Create product (manufacturer)
- `POST /api/products/:productId/transfer` - Transfer ownership
- `POST /api/products/:productId/repair` - Record repair
- `GET /api/products/:productId/history` - Get product history
- `GET /health` - Health check

### Frontend Development

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Development mode (http://localhost:5173)
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

**Key Files**:
- `src/main.jsx:1-10` - React app entry point
- `src/App.jsx:1-72` - Wallet adapter setup + network selector UI
- `src/App.css:1-193` - Application styling (network selector, cards, badges, etc.)
- `src/components/ProductManager.jsx:1-206` - Main UI component
- `index.html:1-14` - HTML entry with Content Security Policy headers

**Environment Variables**:
- `VITE_API_URL` - Backend API URL (default: http://localhost:3000/api)
- `VITE_SOLANA_NETWORK` - Solana network: `devnet`, `testnet`, `mainnet-beta`, or `validator` (default: devnet)
- `VITE_SOLANA_VALIDATOR_URL` - Local validator URL (default: http://localhost:8899) - Required when using local validator

**Network Selection**:
The frontend supports switching between Solana Devnet and a local validator at runtime via radio buttons in the header. Set `VITE_SOLANA_NETWORK=validator` in `.env` to default to local validator on startup. Users can toggle between networks without reloading the page.

**Wallet Adapter**:
Uses Solana Wallet Adapter with automatic wallet discovery. Phantom and other Standard Wallets are automatically detected without explicit configuration.

### Solana Program Development

```bash
# Navigate to solana-program
cd solana-program

# Build program
cargo build-bpf

# Test program
cargo test-bpf

# Deploy to devnet
solana program deploy target/deploy/product_provenance.so
```

**Data Structures**:
```rust
enum TransactionType {
    Manufacture,
    Repair,
    Transfer,
    EndOfLife,
}

struct ProductRecord {
    product_id: String,
    transaction_type: TransactionType,
    previous_record: Option<Pubkey>,
    current_owner: Pubkey,
    next_owner: Option<Pubkey>,
    timestamp: i64,
    metadata: String,
}
```

### Docker Development

```bash
# Build specific service
docker-compose build backend
docker-compose build frontend

# Start specific service
docker-compose up backend
docker-compose up -d frontend

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Restart service
docker-compose restart backend

# Stop all services
docker-compose down

# Remove volumes (WARNING: deletes data)
docker-compose down -v
```

---

## Common Tasks for AI Assistants

### Task 1: Adding a New API Endpoint

1. **Add route** in `backend/src/routes/products.js`
2. **Add service method** in `backend/src/services/solana.js` (if blockchain interaction needed)
3. **Add logging** using the logger: `logger.info({ type: 'action', ... })`
4. **Test manually** with curl or Postman
5. **Update OPA policy** in `opa/policies/api_authz.rego` if authorization needed

Example:
```javascript
// In backend/src/routes/products.js
router.get('/api/products/:productId/status', async (req, res) => {
  logger.info({
    type: 'product_status_request',
    productId: req.params.productId
  });
  // Implementation here
});
```

### Task 2: Modifying the Frontend UI

1. **Edit component** in `frontend/src/components/ProductManager.jsx` or `frontend/src/App.jsx`
2. **Follow React patterns**: Use useState for state, async/await for API calls
3. **Handle errors**: Set message state with error details
4. **Update CSP if needed**: If adding external connections, update Content-Security-Policy in `frontend/index.html`
5. **Update styling**: Modify `frontend/src/App.css` for visual changes
6. **Test in browser**: http://localhost:8080 (after docker-compose up)
7. **Check console** for errors and CSP violations
8. **Test network switching**: Verify functionality works on both Devnet and Local Validator

### Task 3: Adding Security Rules

**Falco Rules** (`falco/rules/custom_rules.yaml`):
```yaml
- rule: My Custom Rule
  desc: Description of what this detects
  condition: (container.name = "bbf-backend" and evt.type = spawn)
  output: "Alert message (container=%container.name)"
  priority: WARNING
```

**OPA Policies** (`opa/policies/api_authz.rego`):
```rego
allow {
  input.method == "GET"
  input.path[0] == "api"
  input.path[1] == "products"
}
```

**ModSecurity Rules** (`nginx/modsecurity.conf`):
```apache
SecRule REQUEST_URI "@contains /api/new-endpoint" \
    "id:200100,phase:1,deny,status:403,msg:'Custom rule'"
```

### Task 4: Debugging Issues

**Check service logs**:
```bash
docker-compose logs -f backend     # Backend logs
docker-compose logs -f frontend    # Frontend logs
docker-compose logs -f nginx-waf   # WAF logs
docker-compose logs falco | grep CRITICAL  # Security alerts
```

**Check Grafana dashboards**:
- Application Logs: http://localhost:3001/d/bbf-logs
- Security Monitoring: http://localhost:3001/d/bbf-security
- Login: admin/admin123

**Check service health**:
```bash
curl http://localhost:3000/health  # Backend health
docker-compose ps                  # All service status
```

### Task 5: Modifying Configuration

**Environment Variables**:
- Backend: `backend/.env`
- Frontend: `frontend/.env`
- After changes: `docker-compose restart <service>`

**Docker Compose**:
- Edit: `docker-compose.yml`
- After changes: `docker-compose down && docker-compose up -d`

**NGINX Configuration**:
- Edit: `nginx/nginx.conf`
- After changes: `docker-compose restart nginx-waf`

---

## Testing Procedures

### Manual Security Testing

**Test 1: Falco Runtime Detection**
```bash
# Trigger shell execution alert (CRITICAL)
docker exec -it bbf-backend sh

# Verify alert in logs
docker-compose logs falco | grep -i "shell"

# View in Grafana
# Navigate to http://localhost:3001/d/bbf-security
```

**Test 2: WAF Protection**
```bash
# SQL injection (should return 403)
curl "http://localhost/api/products?id=1' OR '1'='1"

# XSS attack (should return 403)
curl "http://localhost/api/products?search=<script>alert('xss')</script>"

# Check WAF logs
docker-compose logs nginx-waf | grep -i modsecurity
```

**Test 3: Rate Limiting**
```bash
# Send 150 requests (limit is 100/min)
for i in {1..150}; do curl http://localhost/api/products & done

# Should see 429 Too Many Requests after ~100 requests
```

**Test 4: OPA Policy Enforcement**
```bash
curl -X POST http://localhost:8181/v1/data/httpapi/authz \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "method": "GET",
      "path": ["api", "products", "123", "history"],
      "headers": {}
    }
  }'
```

**Test 5: Log Aggregation**
```bash
# Generate API activity
curl http://localhost:3000/health
curl -X POST http://localhost/api/products \
  -H "Content-Type: application/json" \
  -d '{"productId": "TEST123"}'

# View logs in Grafana
# http://localhost:3001/d/bbf-logs
```

### Automated Testing

**Backend Tests**:
```bash
cd backend
npm test  # Runs Jest tests
npm run lint  # Runs ESLint
```

**Frontend Tests**:
```bash
cd frontend
npm run lint  # Runs ESLint
```

**CI/CD Pipeline** (`.github/workflows/security-scan.yml`):
- Runs on push to main, claude/**, and pull requests
- 3 jobs: dependency-scan → container-scan → build-status
- Tools: npm audit, Trivy, SARIF upload to GitHub Security

---

## Code Conventions

### Logging Convention
All logs use structured JSON format with Pino:

```javascript
logger.info({ type: 'action_name', key: 'value', ... });
logger.warn({ type: 'warning_type', details: '...' });
logger.error({ type: 'error_type', error: err.message, stack: err.stack });
```

**Common log types**:
- `server_start` - Server initialization
- `product_created` - Product creation
- `ownership_transferred` - Ownership transfer
- `repair_recorded` - Repair logged
- `history_retrieved` - History query

### Error Handling
```javascript
try {
  // Operation
} catch (error) {
  logger.error({ type: 'operation_failed', error: error.message });
  res.status(500).json({ error: 'Error message' });
}
```

### API Response Format
```javascript
// Success
res.status(200).json({
  message: 'Success message',
  data: { ... }
});

// Error
res.status(4xx/5xx).json({
  error: 'Error message'
});
```

### React Patterns
- Use functional components with hooks
- State management with useState
- Side effects with useEffect
- Async operations with async/await
- Error messages displayed to user via state

### Security Patterns
- **Defense in depth**: Multiple security layers
- **Zero trust**: Explicit authorization required
- **Least privilege**: Non-root containers, minimal permissions
- **Audit logging**: All security events logged
- **Rate limiting**: Applied at multiple layers (NGINX + WAF)

---

## Security Considerations

### 4-Layer Security Architecture

**Layer 1: NGINX + ModSecurity WAF**
- Entry point at port 80/443
- OWASP Core Rule Set
- 7 custom rules (SQL injection, XSS, rate limiting, scanner detection)
- Security headers (CSP, HSTS, X-Frame-Options)

**Layer 2: OPA (Open Policy Agent)**
- Policy-based access control
- API endpoint authorization
- Container operation policies
- Default deny, explicit allow

**Layer 3: Falco Runtime Security**
- 7 custom detection rules
- Shell execution detection (CRITICAL)
- Sensitive file access monitoring
- Cryptomining detection
- Package manager execution alerts

**Layer 4: Application Security**
- Helmet.js security headers (backend)
- Content Security Policy (CSP) headers in frontend/index.html
  - Restricts script sources to 'self' and 'unsafe-inline'
  - Restricts style sources to 'self' and 'unsafe-inline'
  - Allows connections to localhost:3000 (backend), localhost:8899 (local validator), and Solana RPC endpoints
  - Prevents XSS and unauthorized resource loading
- CORS configuration
- Express rate limiting (100 req/15min)
- Environment-based secrets
- Solana wallet signature verification

### Security Best Practices for AI Assistants

1. **Never commit secrets**: Use .env files (already gitignored)
2. **Validate input**: All user input should be validated
3. **Log security events**: Use structured logging for audit trails
4. **Follow rate limiting**: Don't remove existing rate limits
5. **Maintain WAF rules**: Don't disable ModSecurity rules without reason
6. **Test security changes**: Run security tests after modifications
7. **Review OPA policies**: Ensure new endpoints have authorization policies

### Common Security Issues to Avoid

- SQL injection (mitigated by WAF)
- XSS attacks (mitigated by WAF + CSP headers)
- CSRF (mitigated by Solana signature verification)
- Command injection (avoid shell execution)
- Path traversal (validate file paths)
- Insecure deserialization (use Borsh for Solana data)
- Sensitive data exposure (use environment variables)

---

## Deployment

### Local Development Deployment

```bash
# Quick start
./start.sh

# Manual start
docker-compose up -d

# Access services
Frontend:  http://localhost:8080
Backend:   http://localhost:3000
Grafana:   http://localhost:3001 (admin/admin123)
OPA:       http://localhost:8181
Loki:      http://localhost:3100
```

### Production Deployment Considerations

**Prerequisites**:
- Docker 20.10+
- Docker Compose 2.0+
- 8GB RAM minimum (16GB recommended)
- 4 CPU cores minimum (8 recommended)
- Ports 80, 443, 3000, 3001, 8080, 8181 available

**Production Checklist**:
- [ ] Change Grafana password (default: admin/admin123)
- [ ] Configure TLS/SSL certificates
- [ ] Set up HashiCorp Vault for secrets
- [ ] Configure log retention policies
- [ ] Set up Grafana alerting
- [ ] Review and tune OPA policies
- [ ] Configure persistent volumes
- [ ] Set up backups for Loki/Grafana data
- [ ] Add monitoring for monitoring stack
- [ ] Consider Kubernetes migration

**Environment Variables to Configure**:
```bash
# Backend
PORT=3000
NODE_ENV=production
LOG_LEVEL=info
SOLANA_NETWORK=devnet  # Change to mainnet-beta for production
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_PROGRAM_ID=<your-deployed-program-id>
ALLOWED_ORIGINS=https://your-domain.com
API_SECRET=<generate-strong-secret>

# Frontend
VITE_API_URL=https://api.your-domain.com/api
VITE_SOLANA_NETWORK=devnet  # Options: devnet, testnet, mainnet-beta, validator
VITE_SOLANA_VALIDATOR_URL=http://localhost:8899  # Required when using local validator
```

---

## Troubleshooting

### Service Not Starting

```bash
# Check service status
docker-compose ps

# View logs for specific service
docker-compose logs <service-name>

# Common issues:
# 1. Port already in use - change port in docker-compose.yml
# 2. Insufficient memory - increase Docker memory limit
# 3. Missing .env file - copy from .env.example
```

### Frontend Can't Connect to Backend

```bash
# Check backend is running
curl http://localhost:3000/health

# Check CORS configuration in backend/src/index.js
# Ensure frontend origin is in ALLOWED_ORIGINS

# Check Content Security Policy in frontend/index.html
# Verify connect-src includes http://localhost:3000
# Example: connect-src 'self' http://localhost:3000 http://localhost:8899 https://api.devnet.solana.com

# Check browser console for CSP violations
# Look for "blocked by Content Security Policy" errors

# Check network configuration in docker-compose.yml
```

### Loki/Grafana Not Showing Logs

```bash
# Verify Loki is running
curl http://localhost:3100/ready

# Check Promtail is shipping logs
docker-compose logs promtail

# Verify Loki data source in Grafana
# http://localhost:3001/datasources

# Check backend is using Loki transport
# backend/src/loki-transport.js should be imported in logger.js
```

### Falco Not Detecting Events

```bash
# Verify Falco has privileged mode
# Check docker-compose.yml: privileged: true

# Check Falco logs for startup errors
docker-compose logs falco | head -50

# Verify custom rules loaded
docker-compose logs falco | grep "custom_rules"
```

### WAF Blocking Legitimate Requests

```bash
# Check WAF logs
docker-compose logs nginx-waf | grep -i modsecurity

# Identify rule ID that's blocking
# Look for "id:XXXXX" in logs

# Temporarily disable rule in nginx/modsecurity.conf
# SecRuleRemoveById XXXXX

# Restart NGINX
docker-compose restart nginx-waf
```

### Build Failures in CI/CD

```bash
# Check GitHub Actions logs in repository

# Common issues:
# 1. npm audit failures - review and fix vulnerabilities
# 2. Trivy scan failures - update base images or dependencies
# 3. Build timeouts - optimize Docker layer caching

# Local testing of Docker builds:
docker build -t test-backend backend/
docker build -t test-frontend frontend/
```

---

## Resource Requirements

### Minimum Requirements
- **CPU**: 4 cores
- **RAM**: 8GB
- **Disk**: 20GB
- **Docker**: 20.10+
- **Docker Compose**: 2.0+

### Recommended Requirements
- **CPU**: 8 cores
- **RAM**: 16GB
- **Disk**: 50GB SSD

### Service Resource Usage (Approximate)
- Backend: 256MB RAM, 0.5 CPU
- Frontend: 128MB RAM, 0.25 CPU
- NGINX WAF: 256MB RAM, 0.5 CPU
- Falco: 512MB RAM, 0.5 CPU (privileged)
- Loki: 512MB RAM, 0.5 CPU
- Grafana: 512MB RAM, 0.5 CPU
- OPA: 128MB RAM, 0.25 CPU
- Promtail: 128MB RAM, 0.25 CPU

---

## Important Files Reference

### Configuration Files
- `docker-compose.yml` - All service definitions (8 services)
- `backend/.env` - Backend environment variables
- `frontend/.env` - Frontend environment variables
- `.github/workflows/security-scan.yml` - CI/CD pipeline

### Security Configurations
- `nginx/nginx.conf` - NGINX + security headers + rate limiting
- `nginx/modsecurity.conf` - 7 WAF rules
- `opa/policies/api_authz.rego` - API authorization policy
- `opa/policies/container_authz.rego` - Container policy
- `falco/rules/custom_rules.yaml` - 7 runtime security rules

### Monitoring Configurations
- `loki/loki-config.yml` - Log aggregation config
- `loki/promtail-config.yml` - Log shipping config
- `grafana/dashboards/security-monitoring.json` - Security dashboard
- `grafana/dashboards/application-logs.json` - Application logs dashboard

### Documentation
- `README.md` - Project overview (main docs)
- `DEPLOYMENT.md` - Deployment guide (340+ lines)
- `REPOSITORY_DOCUMENTATION.md` - Technical documentation (797 lines)
- `design.md` - Architecture and design decisions
- `CLAUDE.md` - This file (AI assistant guide)

---

## Quick Command Reference

```bash
# Service Management
./start.sh                          # Start all services with helper
docker-compose up -d                # Start all services
docker-compose down                 # Stop all services
docker-compose restart <service>    # Restart specific service
docker-compose logs -f <service>    # Follow logs for service
docker-compose ps                   # Check service status

# Development
cd backend && npm run dev           # Backend dev mode
cd frontend && npm run dev          # Frontend dev mode (port 5173)
docker-compose build <service>      # Rebuild specific service

# Testing
curl http://localhost:3000/health   # Backend health check
npm test                            # Run Jest tests (in backend/)
npm run lint                        # Run ESLint

# Security Testing
docker exec -it bbf-backend sh      # Trigger Falco alert
curl "http://localhost/api/products?id=1' OR '1'='1"  # Test WAF

# Monitoring
http://localhost:3001               # Grafana (admin/admin123)
http://localhost:3001/d/bbf-logs    # Application logs dashboard
http://localhost:3001/d/bbf-security # Security monitoring dashboard

# Cleanup
docker-compose down -v              # Remove containers and volumes
docker system prune -a              # Clean up all unused Docker resources
```

---

## Version Information

- **Project Version**: 1.0.0
- **Node.js**: 20+
- **React**: 19.2.0
- **Vite**: 7.2.2
- **Solana Program**: 1.17
- **Supported Networks**: Devnet, Local Validator (Testnet and Mainnet-beta ready)
- **Documentation Last Updated**: 2025-11-16

### Recent Changes

**2025-11-16**:
- Added local Solana validator support with runtime network switching
- Removed explicit Phantom wallet adapter (now auto-discovered as Standard Wallet)
- Fixed Content Security Policy to allow API requests to localhost:3000 and localhost:8899
- Added network selector UI with radio buttons in header
- Enhanced App.css with styling for network selector and status badges

---

## Additional Resources

- **Solana Documentation**: https://docs.solana.com/
- **Express.js Documentation**: https://expressjs.com/
- **React Documentation**: https://react.dev/
- **Vite Documentation**: https://vitejs.dev/
- **Falco Rules**: https://falco.org/docs/rules/
- **OPA Policy Language**: https://www.openpolicyagent.org/docs/latest/policy-language/
- **ModSecurity**: https://github.com/SpiderLabs/ModSecurity
- **OWASP Core Rule Set**: https://coreruleset.org/

---

## Notes for AI Assistants

### When Making Changes

1. **Read relevant files first**: Always read files before editing
2. **Understand context**: Review REPOSITORY_DOCUMENTATION.md for architecture
3. **Test changes**: Use manual tests or CI/CD to verify
4. **Update documentation**: Update this file if adding new patterns
5. **Check security impact**: Consider security implications of changes
6. **Maintain consistency**: Follow existing code patterns and conventions
7. **Log appropriately**: Add structured logging for new operations

### When Debugging

1. **Check logs first**: docker-compose logs -f <service>
2. **Use Grafana**: Visual debugging via dashboards
3. **Test incrementally**: Isolate issues by testing components individually
4. **Review security logs**: Check Falco, WAF, and OPA logs
5. **Verify configuration**: Ensure .env files are properly set

### When Adding Features

1. **Plan security**: Consider all 4 security layers
2. **Add logging**: Structured logs for observability
3. **Update policies**: OPA authorization for new endpoints
4. **Test thoroughly**: Manual + automated testing
5. **Document**: Update relevant README files

---

**End of CLAUDE.md**

This document should be updated as the project evolves. When making significant changes to architecture, workflows, or conventions, please update this guide accordingly.
