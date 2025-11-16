# Backend API Dockerfile - Alpine Linux base for minimal attack surface
FROM node:20-alpine3.20 AS builder

WORKDIR /app

# Upgrade all packages to latest security patches and remove apk cache
RUN apk update && \
    apk upgrade --no-cache && \
    rm -rf /var/cache/apk/*

# Install dependencies
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci --only=production; else npm install --production; fi

# Copy application code
COPY . .

# Production stage
FROM node:20-alpine3.20

# Upgrade all packages to latest security patches and remove apk cache
RUN apk update && \
    apk upgrade --no-cache && \
    rm -rf /var/cache/apk/*

# Add security: Run as non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy dependencies and code from builder
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs . .

# Switch to non-root user
USER nodejs

EXPOSE 3000

CMD ["node", "src/index.js"]
