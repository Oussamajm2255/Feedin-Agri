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
# Stage 2: Production runtime — nginx + Node.js SSR server
# =============================================================================
FROM node:20-alpine

# Install nginx + gettext (for envsubst to inject $PORT into nginx config)
RUN apk add --no-cache nginx gettext

# ── Copy built browser files (prerendered HTML + assets) ─────────────────
COPY --from=builder /app/dist/smart-farm-frontend/browser /usr/share/nginx/html

# ── Copy SSR server files ────────────────────────────────────────────────
COPY --from=builder /app/dist/smart-farm-frontend/server /app/server

# ── Copy nginx configuration ─────────────────────────────────────────────
COPY nginx.conf /etc/nginx/conf.d/default.conf

# ── Copy startup script ──────────────────────────────────────────────────
COPY start.sh /start.sh
RUN chmod +x /start.sh

# Expose ports: 80 (nginx) and 4000 (SSR server)
EXPOSE 80 4000

# Start nginx + Node.js SSR server
CMD ["/start.sh"]
