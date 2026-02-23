# ─── Stage 1: Build ─────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install deps
COPY package*.json ./
COPY .npmrc ./
RUN npm cache clean --force && \
    npm ci --legacy-peer-deps && \
    npm cache clean --force

# Copy all source
COPY . .

# Inject API URL at build time (Railway passes this as a build ARG)
ARG API_URL
RUN if [ -n "$API_URL" ]; then \
      sed -i "s|apiUrl: '.*'|apiUrl: '$API_URL/api/v1'|g" src/environments/environment.prod.ts && \
      sed -i "s|wsUrl: '.*'|wsUrl: '$API_URL'|g" src/environments/environment.prod.ts; \
    fi

# Build → outputs to dist/smart-farm-frontend/browser/
RUN npm run build:prod

# Debug: confirm what the build actually produced
RUN echo "=== dist/smart-farm-frontend ===" && ls dist/smart-farm-frontend/ && \
    echo "=== browser/ ===" && ls dist/smart-farm-frontend/browser/ && \
    echo "=== browser/assets/ ===" && ls dist/smart-farm-frontend/browser/assets/ || true

# ─── Stage 2: Serve with nginx ───────────────────────────────────────────────
FROM nginx:alpine

# Remove nginx defaults
RUN rm -rf /usr/share/nginx/html/*

# Copy the Angular browser output DIRECTLY into nginx root.
# Angular 17+ @angular/build:application always puts browser output in browser/.
# We copy browser/* explicitly — no fragile glob mv tricks.
COPY --from=builder /app/dist/smart-farm-frontend/browser /usr/share/nginx/html

# Verify critical assets are present (fails the build if they're missing)
RUN echo "=== Verifying assets ===" && \
    test -f /usr/share/nginx/html/index.html && echo "✓ index.html" || (echo "✗ MISSING: index.html" && exit 1) && \
    test -d /usr/share/nginx/html/assets/i18n && echo "✓ assets/i18n/" || (echo "✗ MISSING: assets/i18n/" && exit 1) && \
    test -f /usr/share/nginx/html/assets/i18n/en-US.json && echo "✓ en-US.json" || (echo "✗ MISSING: en-US.json" && exit 1) && \
    ls /usr/share/nginx/html/assets/i18n/ && \
    echo "=== Root files ===" && ls /usr/share/nginx/html/*.webmanifest 2>/dev/null || echo "No .webmanifest at root"

# Permissions
RUN chmod -R 755 /usr/share/nginx/html

# Copy nginx config (port is set via $PORT env var, substituted by start.sh)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy startup script that substitutes $PORT
COPY start.sh /start.sh
RUN chmod +x /start.sh

EXPOSE 8080

CMD ["/start.sh"]
