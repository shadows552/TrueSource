FROM owasp/modsecurity-crs:nginx-alpine

# Remove default templates to prevent entrypoint from overwriting our custom configs
USER root
RUN rm -rf /etc/nginx/templates/*


# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy custom ModSecurity configuration
COPY modsecurity.conf /etc/modsecurity.d/modsecurity.conf

# Copy scanner user agents data (if referenced in modsecurity.conf)
COPY scanner-user-agents.data /etc/modsecurity.d/scanner-user-agents.data

# Fix permissions for nginx user to access modsecurity.d directory
RUN chown -R nginx:nginx /etc/modsecurity.d && \
    chmod -R 755 /etc/modsecurity.d

# Expose ports
EXPOSE 80 443

USER nginx

# The default entrypoint will run but won't process any templates since we removed them
