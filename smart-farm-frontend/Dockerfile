# =============================================================================
# Stage 1: Build the Angular application with SSR
# =============================================================================
FROM node:20-alpine AS builder

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

# Build the application with SSR prerendering
RUN npm run build:prod

# =============================================================================
# Stage 2: Production runtime — Node.js SSR server only
# Railway provides its own reverse proxy layer, so nginx is not needed.
# =============================================================================
FROM node:20-alpine

WORKDIR /app

# Copy built application
COPY --from=builder /app/dist ./dist

# Copy startup script (Railway expects /start.sh as the entrypoint)
COPY start.sh /start.sh
RUN chmod +x /start.sh

# Expose the port Railway assigns via $PORT
EXPOSE ${PORT:-8080}

# Railway uses /start.sh as configured in the project dashboard
CMD ["/start.sh"]
