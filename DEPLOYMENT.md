# BBF Deployment Guide

Complete guide for deploying the Blockchain-Based Product Provenance system with full security stack.

## Prerequisites

- Docker (20.10+)
- Docker Compose (2.0+)
- Git
- 8GB RAM minimum
- Ports available: 80, 443, 3000, 3001, 8080, 8181

## Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd bbf

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

## Service URLs

Once deployed, access the following services:

- **Frontend Application**: http://localhost:8080
- **Backend API**: http://localhost:3000
- **Grafana Dashboard**: http://localhost:3001 (admin/admin123)
- **OPA Policy Server**: http://localhost:8181
- **Loki (Log Aggregation)**: http://localhost:3100

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    NGINX + ModSecurity WAF              │
│              (Port 80 - Entry Point)                    │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
┌───────────────┐         ┌──────────────┐
│   Frontend    │         │   Backend    │
│  (React+Vite) │         │  (Node.js)   │
│   Port 8080   │         │  Port 3000   │
└───────────────┘         └──────┬───────┘
                                 │
                    ┌────────────┼────────────┐
                    │            │            │
                    ▼            ▼            ▼
              ┌─────────┐  ┌────────┐  ┌─────────┐
              │   OPA   │  │  Loki  │  │ Solana  │
              │  Policy │  │  Logs  │  │ Devnet  │
              └─────────┘  └────┬───┘  └─────────┘
                                │
                    ┌───────────┼───────────┐
                    │           │           │
                    ▼           ▼           ▼
              ┌─────────┐  ┌────────┐  ┌─────────┐
              │ Grafana │  │ Falco  │  │Promtail │
              │Dashboard│  │Runtime │  │  Agent  │
              └─────────┘  └────────┘  └─────────┘
```
