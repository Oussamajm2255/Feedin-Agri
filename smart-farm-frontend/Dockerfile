# Use Node.js 20 LTS for building
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY .npmrc ./

# Install all dependencies (including dev dependencies for build)
RUN npm cache clean --force && \
    npm ci --legacy-peer-deps && \
    npm cache clean --force

# Copy source code
COPY . .

# Inject API URL if provided (to avoid hardcoded URLs in environment.prod.ts)
ARG API_URL
RUN if [ -n "$API_URL" ]; then \
      sed -i "s|apiUrl: '.*'|apiUrl: '$API_URL/api/v1'|g" src/environments/environment.prod.ts && \
      sed -i "s|wsUrl: '.*'|wsUrl: '$API_URL'|g" src/environments/environment.prod.ts; \
    fi

# Build the application
RUN npm run build:prod

# Production stage with nginx
FROM nginx:alpine

# Clean default nginx directory
RUN rm -rf /usr/share/nginx/html/*

# Copy built files
COPY --from=builder /app/dist/smart-farm-frontend /usr/share/nginx/html

# Flatten ANY subfolder (browser, server, etc.) into the root
# This finds where index.html is and moves everything from that level up
RUN cd /usr/share/nginx/html && \
    export DIR=$(find . -name index.html -not -path "./index.html" | head -n 1 | cut -d '/' -f 2) && \
    if [ -n "$DIR" ] && [ -d "$DIR" ]; then \
        mv "$DIR"/* . && \
        rm -rf "$DIR"; \
    fi

# Final check: list files for debugging in Railway logs
RUN echo "Final Nginx Root Contents:" && ls -R /usr/share/nginx/html

# Ensure permissions
RUN chmod -R 755 /usr/share/nginx/html

# Copy nginx configuration with security headers
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy startup script
COPY start.sh /start.sh
RUN chmod +x /start.sh

# Expose port
EXPOSE 80

# Start nginx
CMD ["/start.sh"]
