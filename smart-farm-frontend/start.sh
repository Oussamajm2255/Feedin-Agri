#!/bin/sh
set -e

# ── Start the Node.js SSR server ──────────────────────────────────────────
# Railway provides its own reverse proxy, so nginx is not needed here.
# The server listens on the port defined by the $PORT environment variable.
echo "Starting Node.js SSR server..."
node dist/smart-farm-frontend/server/server.mjs
