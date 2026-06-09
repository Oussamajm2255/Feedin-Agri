#!/bin/sh
set -e

# ── 1. Substitute $PORT in nginx config ──────────────────────────────────
# The PORT env var is set by the cloud platform (Railway, etc.)
envsubst '$PORT' < /etc/nginx/conf.d/default.conf > /tmp/default.conf
mv /tmp/default.conf /etc/nginx/conf.d/default.conf

# ── 2. Start the Node.js SSR server in the background ────────────────────
# Listens on port 4000 — nginx proxies SSR requests here
echo "Starting Node.js SSR server..."
node /app/server/server.mjs &

# ── 3. Wait briefly for SSR server to start ──────────────────────────────
sleep 2

# ── 4. Start nginx in the foreground ─────────────────────────────────────
echo "Starting nginx..."
nginx -g "daemon off;"
