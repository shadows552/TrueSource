# Frontend Dockerfile - Multi-stage build with Alpine Linux
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    libusb-dev \
    linux-headers \
    eudev-dev
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Copy application code and build
COPY . .
RUN npm run build

# Production stage - Nginx Alpine for serving static files
FROM nginx:alpine

# Add security: Remove default nginx user and add custom user
RUN addgroup -g 1001 -S frontend && \
    adduser -S frontend -u 1001

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Set proper permissions
RUN chown -R frontend:frontend /usr/share/nginx/html && \
    chown -R frontend:frontend /var/cache/nginx && \
    chown -R frontend:frontend /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R frontend:frontend /var/run/nginx.pid

USER frontend

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
