# Blockchain-Based Product Provenance (BBF)

A production-grade, secure cloud-native dApp for tracking product lifecycle on Solana blockchain with security monitoring.
Similar to CarFax but for consumer electronics, bikes, and high-value goods.

## Quick Start

```bash
# Start the entire security stack
docker-compose up -d

# Access services:
# - Frontend: http://localhost:8080
# - API: http://localhost:3000
# - Grafana: http://localhost:3001 (admin/admin123)
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed setup instructions.

## Components

### Application Layer
- **solana-program/** - Rust-based on-chain program for product provenance
- **backend/** - Node.js REST API with structured logging
- **frontend/** - React frontend with Solana wallet integration

### Security Layer
- **nginx/** - NGINX with ModSecurity WAF & OWASP Core Rules
- **opa/** - Open Policy Agent for dynamic authorization
- **falco/** - Runtime security monitoring with custom rules

### Observability Layer
- **loki/** - Centralized log aggregation
- **grafana/** - Real-time monitoring dashboards
- **promtail/** - Log shipping agent

## Security Features

### Area 1: Pre-Deployment (Build, Test, Artifacts)
- **Trivy** container vulnerability scanning (blocks CRITICAL/HIGH)
- **npm audit** dependency scanning in CI/CD
- **Cosign/Sigstore** keyless image signing with OIDC
- **Alpine Linux** minimal base images
- **Multi-stage builds** for reduced attack surface
- **Non-root users** in all containers

### Area 2: Runtime Security (Deployment, Policy, Monitoring)
- **Falco** runtime threat detection with 7 custom security rules
- **ModSecurity WAF** with OWASP CRS + custom API rules
- **OPA** policy engine for API authorization
- **Loki + Grafana** for structured logging & visualization
- **Rate limiting** (100 req/min per IP at NGINX + WAF layers)
- **Security headers** (CSP, HSTS, X-Frame-Options, etc.)
- **Environment-based secrets** management

View live security events in Grafana: http://localhost:3001/d/bbf-security

## Documentation

- [Deployment Guide](./DEPLOYMENT.md) - Complete setup & testing instructions
- [Solana Program](./solana-program/README.md) - On-chain program details
- [Backend API](./backend/README.md) - REST API documentation
- [Frontend](./frontend/README.md) - Web UI setup
