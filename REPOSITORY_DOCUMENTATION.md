# BBF (Blockchain-Based Product Provenance) - Comprehensive Repository Documentation

## Executive Summary

The BBF project is a production-grade, cloud-native dApp (Decentralized Application) for tracking product lifecycle on the Solana blockchain. It features a complete enterprise security stack including runtime threat detection, WAF protection, policy-based access control, and comprehensive observability.

**Technology Stack**: Solana (Blockchain) | Node.js/Express (Backend) | React/Vite (Frontend) | Docker (Containerization) | NGINX/ModSecurity (Security) | Falco (Runtime Security) | OPA (Policy Engine) | Loki/Grafana (Observability)

**Project Maturity**: Hackathon-grade with production security patterns

---

## 1. DIRECTORY STRUCTURE & ORGANIZATION

```
bbf/
├── backend/                    # Node.js REST API
│   ├── src/
│   │   ├── index.js            # Express app initialization, middleware
│   │   ├── logger.js           # Pino-based structured logging
│   │   ├── loki-transport.js   # Loki log shipping integration
│   │   ├── routes/
│   │   │   └── products.js     # Product lifecycle API endpoints
│   │   └── services/
│   │       └── solana.js       # Solana blockchain integration
│   ├── Dockerfile              # Multi-stage production build
│   ├── Dockerfile.minimal      # CI/CD testing build
│   ├── package.json            # Dependencies & npm scripts
│   ├── .env.example            # Configuration template
│   └── README.md               # Backend documentation
│
├── frontend/                   # React SPA
│   ├── src/
│   │   ├── main.jsx            # React entry point
│   │   ├── App.jsx             # Main component with wallet setup
│   │   ├── App.css             # Styling
│   │   ├── index.css           # Global styles
│   │   ├── components/
│   │   │   └── ProductManager.jsx  # Main UI component
│   │   └── index.html          # HTML template (in root)
│   ├── Dockerfile              # Multi-stage Nginx build
│   ├── Dockerfile.minimal      # CI/CD testing build
│   ├── package.json            # Dependencies
│   ├── vite.config.js          # Build configuration
│   ├── nginx.conf              # Nginx serving config
│   ├── .env.example            # Environment template
│   ├── index.html              # SPA entry point
│   └── README.md               # Frontend documentation
│
├── solana-program/             # Rust on-chain program
│   ├── src/
│   │   └── lib.rs              # Solana program logic
│   ├── Cargo.toml              # Rust dependencies
│   ├── README.md               # Program documentation
│
├── nginx/                      # WAF & reverse proxy
│   ├── nginx.conf              # Main NGINX config with security
│   ├── modsecurity.conf        # ModSecurity WAF rules
│   └── scanner-user-agents.data # Detected scanner list
│
├── opa/                        # Policy engine
│   └── policies/
│       ├── api_authz.rego      # API authorization policies
│       └── container_authz.rego # Container operation policies
│
├── falco/                      # Runtime security
│   ├── falco.yaml              # Falco configuration
│   └── rules/
│       └── custom_rules.yaml   # Custom security rules (7 rules)
│
├── grafana/                    # Monitoring dashboards
│   ├── dashboards/
│   │   ├── security-monitoring.json    # Security events dashboard
│   │   └── application-logs.json       # Application logs dashboard
│   └── provisioning/
│       ├── datasources/
│       │   └── loki.yml        # Loki data source config
│       └── dashboards/
│           └── dashboard.yml   # Dashboard provisioning
│
├── loki/                       # Log aggregation
│   ├── loki-config.yml         # Loki server configuration
│   └── promtail-config.yml     # Log shipping agent config
│
├── .github/
│   └── workflows/
│       └── security-scan.yml   # CI/CD pipeline
│
├── docker-compose.yml          # Multi-container orchestration
├── start.sh                    # Startup helper script
├── DEPLOYMENT.md               # Detailed deployment guide
├── design.md                   # Architecture & design decisions
├── README.md                   # Main project documentation
├── .gitignore                  # Git exclusions
└── .gitattributes              # Git attributes

Total Source Files: 47 configuration/source files
Total Lines of Code: ~947 lines (excluding configs)
```

---

## 2. COMPONENT BREAKDOWN

### 2.1 BACKEND (Node.js/Express)

**Location**: `/home/user/bbf/backend/`

**Files**:
- `src/index.js` (108 lines) - Main Express application
- `src/logger.js` (23 lines) - Structured logging with Pino
- `src/loki-transport.js` (35 lines) - Loki integration
- `src/routes/products.js` (177 lines) - REST API routes
- `src/services/solana.js` (82 lines) - Solana service layer

**Technology Stack**:
```json
{
  "runtime": "Node.js 20+",
  "framework": "Express 4.18.2",
  "blockchain": "@solana/web3.js 1.87.6",
  "logging": "Pino 8.17.2 + pino-loki 2.1.3",
  "security": "Helmet 7.1.0, express-rate-limit 7.1.5",
  "serialization": "Borsh 0.7.0",
  "devTools": "ESLint 8.56.0, Jest 29.7.0, Nodemon 3.0.2"
}
```

**API Endpoints**:
- `POST /api/products` - Create product (manufacturer)
- `POST /api/products/:productId/transfer` - Transfer ownership
- `POST /api/products/:productId/repair` - Record repair
- `GET /api/products/:productId/history` - Get product history
- `GET /health` - Health check

**Security Features**:
- Helmet.js security headers (CSP, HSTS, X-Frame-Options)
- CORS configuration with whitelist
- Rate limiting: 100 requests per 15 minutes per IP
- Structured JSON logging for observability
- Environment-based configuration

**Logging Architecture**:
- Pino for structured logging (JSON format)
- Log levels: info, warn, error, debug
- Automatic Loki log shipping via pino-loki
- Request/response logging middleware
- Error tracking with full stack traces

### 2.2 FRONTEND (React/Vite)

**Location**: `/home/user/bbf/frontend/`

**Files**:
- `src/main.jsx` (10 lines) - React entry
- `src/App.jsx` (37 lines) - Main app with wallet setup
- `src/components/ProductManager.jsx` (206 lines) - UI component
- `vite.config.js` (22 lines) - Build configuration
- `index.html` (13 lines) - HTML template
- `nginx.conf` (48 lines) - SPA serving config

**Technology Stack**:
```json
{
  "runtime": "Node.js 20+",
  "framework": "React 18.2.0",
  "bundler": "Vite 5.0.11",
  "blockchain": "@solana/wallet-adapter-react 0.15.35",
  "http": "axios 1.6.5",
  "server": "Nginx Alpine",
  "devTools": "ESLint 8.56.0"
}
```

**Components**:
- **ProductManager**: Main UI component handling all user interactions
  - Product creation form
  - Ownership transfer interface
  - Repair recording
  - Product history viewer
  - Real-time message feedback

- **Wallet Integration**:
  - Phantom wallet adapter
  - Devnet network configuration
  - Automatic wallet connection on page load
  - Wallet balance display

**Features**:
- Responsive grid layout (4-column action cards)
- Real-time loading states
- Error handling with user messages
- Auto-dismissing notifications (5 seconds)
- SPA routing with Nginx fallback

### 2.3 SOLANA PROGRAM (Rust)

**Location**: `/home/user/bbf/solana-program/`

**Files**:
- `src/lib.rs` (247 lines) - Complete on-chain program

**Technology Stack**:
```toml
[dependencies]
solana-program = "1.17"
borsh = "0.10.3"          # Serialization
borsh-derive = "0.10.3"
thiserror = "1.0"

[dev-dependencies]
solana-program-test = "1.17"
solana-sdk = "1.17"
tokio = { version = "1.35" }
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

**Instructions Supported**:
1. `CreateProduct` - Manufacturer creates product record
2. `TransferOwnership` - Owner transfers to new owner
3. `RecordRepair` - Owner records repair details
4. `MarkEndOfLife` - Owner marks product as retired

**Security Features**:
- Signature verification on all operations
- Ownership validation
- Immutable chain of records
- Timestamp verification
- Account ownership checks

---

## 3. CONFIGURATION FILES

### 3.1 Docker Compose (`docker-compose.yml`)

**Services** (10 total):
1. **backend** (Port 3000) - Node.js API
   - Environment: NODE_ENV=production, LOG_LEVEL=info
   - Solana: Devnet configuration
   - Logging: Loki integration
   - Depends on: loki

2. **frontend** (Port 8080) - React SPA
   - Environment: VITE_API_URL, VITE_SOLANA_NETWORK
   - Depends on: backend, nginx-waf

3. **nginx-waf** (Port 80/443) - NGINX + ModSecurity
   - Image: owasp/modsecurity-crs:nginx-alpine
   - Features: WAF, rate limiting, security headers
   - Depends on: backend, opa

4. **opa** (Port 8181) - Open Policy Agent
   - Features: Policy-based access control
   - JSON logging enabled

5. **loki** (Port 3100) - Log aggregation
   - Storage: Filesystem with BoltDB indexing
   - Query caching: 100MB embedded cache

6. **promtail** - Log shipping agent
   - Scrapes Docker logs
   - Parses JSON structured logs
   - Ships to Loki

7. **grafana** (Port 3001) - Monitoring dashboards
   - Default creds: admin/admin123
   - Provisioned datasources and dashboards
   - Persistent volume: grafana-data

8. **falco** - Runtime security monitoring
   - Privileged mode for syscall monitoring
   - Custom rules in /etc/falco/rules.d
   - JSON output to stdout

**Network**: Bridge network (bbf-network)
**Volumes**: loki-data, grafana-data

### 3.2 Environment Configuration

**Backend (.env.example)**:
```bash
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
SOLANA_NETWORK=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_PROGRAM_ID=<placeholder>
ALLOWED_ORIGINS=http://localhost:8080,http://localhost:3000
API_SECRET=<placeholder>
```

**Frontend (.env.example)**:
```bash
VITE_API_URL=http://localhost:3000/api
VITE_SOLANA_NETWORK=devnet
```

---

## 4. SECURITY CONFIGURATIONS

### 4.1 NGINX + ModSecurity WAF

**File**: `nginx/nginx.conf` + `nginx/modsecurity.conf`

**NGINX Security Features**:
- Server tokens hidden (`server_tokens off`)
- Security headers on all responses:
  - X-Frame-Options: SAMEORIGIN
  - X-Content-Type-Options: nosniff
  - X-XSS-Protection: 1; mode=block
  - Referrer-Policy: strict-origin-when-cross-origin
  - Permissions-Policy: geolocation(), microphone(), camera()
- CSP headers with Solana RPC allowance
- Rate limiting zones:
  - API: 10 requests/second (100 in 5-min window)
  - Login: 5 requests/minute
  - Connection: 10 concurrent connections

**ModSecurity Rules** (7 custom rules):
1. **ID 200001**: JSON Content-Type detection
2. **ID 200002**: SQL injection blocking
3. **ID 200003**: XSS attack blocking
4. **ID 200004-200005**: Rate limiting (100 req/min)
5. **ID 200006**: Scanner detection (Nmap, Nikto, etc.)
6. **ID 200007**: API JSON validation

**OWASP Core Rule Set**: Integrated for comprehensive protection

### 4.2 OPA (Open Policy Agent)

**Files**: `opa/policies/api_authz.rego`, `opa/policies/container_authz.rego`

**API Authorization Policy** (`api_authz.rego`):
- Default: Deny all
- Allow: Health checks without auth
- Require: JWT Bearer token OR Solana wallet signature
- Endpoints:
  - GET /api/products/:id/history (unauthenticated)
  - POST /api/products (requires auth)
  - POST /api/products/:id/transfer (requires auth)
  - POST /api/products/:id/repair (requires auth)

**Container Policy** (`container_authz.rego`):
- Read operations: Always allowed
- Write operations: Restricted to /app, /tmp, /var/log
- Block: /bin, /sbin, /etc, /usr/bin, /usr/sbin, /root
- Network: Allow Solana RPC, internal services
- Process execution: Only node, nginx, authorized processes
- Deny: Interactive shells

### 4.3 Falco Runtime Security

**File**: `falco/falco.yaml` + `falco/rules/custom_rules.yaml`

**Custom Security Rules** (7 rules):

1. **Unauthorized Process Execution**
   - Priority: WARNING
   - Detects: Processes other than node/nginx/sh in containers

2. **Sensitive File Access**
   - Priority: CRITICAL
   - Detects: Access to /etc/shadow, /etc/passwd, /root/.ssh, /.env

3. **Suspicious Network Connections**
   - Priority: WARNING
   - Detects: Connections to non-standard ports (not 80,443,3000,3100,8080,8181)

4. **Shell Spawned in Container**
   - Priority: CRITICAL
   - Detects: bash, sh, ash, zsh, csh, ksh spawning

5. **Cryptomining Detection**
   - Priority: CRITICAL
   - Detects: minerd, xmrig, ethminer, cpuminer

6. **Package Manager Execution**
   - Priority: WARNING
   - Detects: npm, pip, apt, apk, yum, dnf (runtime execution)

7. **System Directory Write Protection**
   - Priority: CRITICAL
   - Detects: Writes to /bin, /sbin, /usr/bin, /usr/sbin

**Output**:
- JSON formatted for structured logging
- Sent to stdout (captured by Docker logging)
- Integrated with Grafana via Loki

---

## 5. CI/CD WORKFLOWS

**File**: `.github/workflows/security-scan.yml`

**Workflow Triggers**:
- Push to main and claude/** branches
- Pull requests to main

**Jobs**:

1. **Dependency Scan** (dependency-scan)
   - Matrix: backend, frontend
   - Steps:
     - Checkout code (v4)
     - Setup Node.js 20
     - Check for package.json
     - Install dependencies (npm ci or install)
     - Run `npm audit` (high severity, non-blocking)
   - Status: Parallel execution

2. **Container Scan** (container-scan)
   - Depends on: dependency-scan
   - Matrix: backend, frontend
   - Steps:
     - Setup Docker Buildx
     - Build Docker image
     - Trivy vulnerability scanning (CRITICAL/HIGH)
     - Save results as SARIF
     - Upload to GitHub Security tab
   - Status: Non-blocking for demo

3. **Build Status Check** (build-status)
   - Depends on: Both previous jobs
   - Output: Summary report
   - Score: "CI/CD Pipeline = 3/3"

**Security Tools**:
- **Trivy**: Container vulnerability scanning
- **npm audit**: Dependency vulnerability scanning
- **SARIF**: GitHub Security integration
- **Actions/checkout@v4**: Latest checkout action
- **docker/setup-buildx-action@v3**: Docker build
- **aquasecurity/trivy-action@master**: Trivy scanning

---

## 6. DOCUMENTATION FILES

### 6.1 README.md (Main Project)
- Project overview and features
- Architecture diagram
- Quick start guide
- Technology stack summary
- Hackathon scorecard (14/15)
- Security demonstrations
- Use cases
- 947 total lines of project code

### 6.2 DEPLOYMENT.md (Deployment Guide)
- Prerequisites (Docker 20.10+, Docker Compose 2.0+)
- Quick start commands
- Service URLs
- Architecture overview
- Detailed security component descriptions
- Monitoring dashboards documentation
- Testing procedures (5 security tests)
- Troubleshooting guide
- Production deployment recommendations
- Resource requirements (8GB RAM minimum)

### 6.3 design.md (Technical Design)
- Product architecture specification
- Use case scenarios
- Data structure design
- Problem statement and solutions
- Technology recommendations
- Gemini Wallet SDK notes

### 6.4 Component READMEs
- **backend/README.md**: API endpoints, environment variables, security features
- **frontend/README.md**: Features, wallet setup, security headers
- **solana-program/README.md**: Data structure, build/deploy instructions, security

---

## 7. DEVELOPMENT SCRIPTS & UTILITIES

### 7.1 start.sh (Startup Helper)
```bash
#!/bin/bash
# Features:
- Docker/Docker Compose validation
- Environment file initialization (.env.example → .env)
- Service startup orchestration
- 30-second health check wait
- Service URL display
- Security test examples
- Helpful commands reference
```

**Output Information**:
- Service URLs (Frontend, Backend, Grafana, OPA, Loki)
- Grafana credentials (admin/admin123)
- Dashboard URLs
- Security test commands
- Useful docker-compose commands

### 7.2 Package.json Scripts

**Backend**:
```json
{
  "start": "node src/index.js",
  "dev": "nodemon src/index.js",
  "lint": "eslint src/**/*.js",
  "test": "jest"
}
```

**Frontend**:
```json
{
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview",
  "lint": "eslint src --ext js,jsx"
}
```

---

## 8. TESTING APPROACHES

### 8.1 Automated Testing
- **Backend**: Jest configuration (configured but minimal tests)
- **Frontend**: ESLint configuration
- **Code Quality**: ESLint for both frontend and backend

### 8.2 Manual Security Testing

**Tests Documented in DEPLOYMENT.md**:

1. **Falco Runtime Detection**
   - Command: `docker exec -it bbf-backend sh`
   - Expected: CRITICAL alert logged
   - Verification: Grafana Security Dashboard

2. **ModSecurity WAF Testing**
   - SQL Injection: `curl "http://localhost/api/products?id=1' OR '1'='1"`
   - XSS Attack: `curl "http://localhost/api/products?search=<script>alert('xss')</script>"`
   - Expected: 403 Forbidden responses

3. **Rate Limiting Test**
   - Command: 150 rapid requests
   - Expected: 429 Too Many Requests after 100 requests
   - Verification: Nginx logs

4. **OPA Policy Test**
   - Query endpoint: POST /v1/data/httpapi/authz
   - Expected: Policy decision response
   - Verification: Authorization headers

5. **Log Aggregation Test**
   - Generate activity: API calls
   - Expected: Logs appear in Grafana
   - Verification: bbf-logs dashboard

---

## 9. BUILD & DEPLOYMENT CONFIGURATIONS

### 9.1 Docker Multi-Stage Builds

**Backend Dockerfile**:
```dockerfile
# Stage 1: Builder
FROM node:20-alpine
# Install dependencies

# Stage 2: Production
FROM node:20-alpine
# Copy node_modules and code only
# Run as non-root user (nodejs:1001)
```

**Frontend Dockerfile**:
```dockerfile
# Stage 1: Builder
FROM node:20-alpine
# Install and build with Vite

# Stage 2: Production
FROM nginx:alpine
# Serve built assets
# Run as non-root user (frontend:1001)
```

**Key Security Patterns**:
- Alpine Linux base (minimal attack surface)
- Multi-stage builds (reduced final image size)
- Non-root user execution
- Production-only dependencies
- Proper file ownership

### 9.2 Dockerfile.minimal (CI/CD Testing)
- Fallback build for testing
- Creates minimal package.json if missing
- Implements graceful dependency installation
- Suitable for pipeline validation

### 9.3 Container Security Features
- Alpine Linux (5MB base)
- No root user in final stage
- Proper permission assignment
- Minimal final image size
- Health checks configured

---

## 10. TECHNOLOGY STACK SUMMARY

### Blockchain Layer
- **Network**: Solana Devnet
- **Language**: Rust (on-chain)
- **Program Model**: Instruction processor with signature verification

### Backend Layer
- **Framework**: Express.js 4.18.2
- **Language**: JavaScript (Node.js 20+)
- **Logging**: Pino 8.17.2
- **Authentication**: Solana wallet signatures, JWT Bearer tokens
- **Rate Limiting**: express-rate-limit
- **Security Headers**: Helmet

### Frontend Layer
- **Framework**: React 18.2.0
- **Bundler**: Vite 5.0.11
- **Language**: JSX
- **Wallet**: @solana/wallet-adapter-react
- **HTTP Client**: Axios
- **Styling**: CSS

### Infrastructure Layer
- **Containerization**: Docker, Docker Compose
- **Reverse Proxy**: NGINX
- **WAF**: ModSecurity + OWASP CRS
- **Policy Engine**: Open Policy Agent (OPA)
- **Runtime Security**: Falco

### Observability Layer
- **Log Aggregation**: Loki 2.9.3
- **Log Shipping**: Promtail 2.9.3
- **Visualization**: Grafana 10.2.3
- **Storage**: BoltDB (filesystem)

### Development Tools
- **Linting**: ESLint
- **Testing**: Jest
- **Version Control**: Git
- **CI/CD**: GitHub Actions

---

## 11. CONVENTIONS & PATTERNS OBSERVED

### Code Organization
- **Modular Structure**: Separation of concerns (routes, services, middleware)
- **Logging Convention**: Structured JSON logging with type field
- **Error Handling**: Centralized error middleware with stack traces
- **Environment Configuration**: 12-factor app pattern with .env files

### Security Patterns
- **Defense in Depth**: Multiple security layers (WAF, OPA, Falco, NGINX)
- **Zero Trust Architecture**: Explicit authorization on all endpoints
- **Least Privilege**: Non-root containers, minimal permissions
- **Audit Logging**: Structured logging for all security events
- **Signature Verification**: Solana transaction signing required

### Frontend Patterns
- **Component-Based**: React functional components
- **Wallet Integration**: Standard Solana wallet adapter pattern
- **Error Handling**: User-friendly toast-style notifications
- **State Management**: React hooks (useState)
- **API Integration**: Environment-based API URL configuration

### DevOps Patterns
- **Docker Compose**: Local development and testing
- **Health Checks**: Service readiness verification
- **Log Rotation**: Docker logging driver configuration (10MB, 3 files)
- **Volume Management**: Persistent data for Loki and Grafana
- **Network Isolation**: Internal bbf-network for service communication

### Testing Patterns
- **Security Scanning**: Trivy for container vulnerabilities
- **Dependency Scanning**: npm audit integration
- **Integration Testing**: Manual test procedures documented
- **Penetration Testing**: WAF and policy testing examples provided

---

## 12. KEY METRICS & STATISTICS

| Metric | Value |
|--------|-------|
| **Total Files** | 47 |
| **Source Code Lines** | 947 |
| **Configuration Files** | 20+ |
| **Docker Services** | 10 |
| **Custom Falco Rules** | 7 |
| **OPA Policies** | 2 |
| **API Endpoints** | 5 |
| **Security Layers** | 4 (WAF, OPA, Falco, NGINX) |
| **CI/CD Jobs** | 3 |
| **Monitoring Dashboards** | 2 |
| **Hackathon Score** | 14/15 (93%) |

---

## 13. DEPLOYMENT CHECKLIST

- [ ] Docker (20.10+) and Docker Compose (2.0+) installed
- [ ] Clone repository
- [ ] Copy .env.example → .env for backend and frontend
- [ ] Run `docker-compose up -d`
- [ ] Wait 30 seconds for services to initialize
- [ ] Access http://localhost:8080 (Frontend)
- [ ] Access http://localhost:3001 (Grafana - admin/admin123)
- [ ] Configure Phantom wallet for Devnet
- [ ] Test API endpoints
- [ ] Monitor security events in Grafana

---

## 14. IMPROVEMENT OPPORTUNITIES

1. **Testing**: Add comprehensive Jest tests for backend API
2. **Frontend Tests**: Add React Testing Library tests
3. **Documentation**: Add API OpenAPI/Swagger spec
4. **Secrets**: Integrate HashiCorp Vault for production
5. **CI/CD**: Add automated deployment steps
6. **TLS**: Configure SSL/TLS certificates
7. **Solana Program**: Complete mock transaction implementation
8. **Monitoring**: Add alerting rules to Grafana
9. **Database**: Add persistent state storage
10. **Documentation**: Generate API documentation

---

## 15. QUICK REFERENCE COMMANDS

```bash
# Start the system
./start.sh
# or
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Access services
Frontend:     http://localhost:8080
Backend API:  http://localhost:3000
Grafana:      http://localhost:3001 (admin/admin123)
OPA:          http://localhost:8181
Loki:         http://localhost:3100

# Test security features
# Falco alert
docker exec -it bbf-backend sh

# WAF SQL injection
curl "http://localhost/api/products?id=1' OR '1'='1"

# Rate limiting (150 requests)
for i in {1..150}; do curl http://localhost/api/products & done

# OPA policy test
curl -X POST http://localhost:8181/v1/data/httpapi/authz \
  -H "Content-Type: application/json" \
  -d '{"input":{"method":"GET","path":["api","products","123"],"headers":{}}}'
```

