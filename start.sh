#!/bin/sh
set -e

echo "Starting backend..."
cd /app/backend
# Run backend on internal port 8181
export PORT=8181
# Some Node builds (alpine) may not expose a global `crypto` automatically; ensure it's available
# by preloading it in a small wrapper expression so Nest/TypeORM code can use crypto.randomUUID().
nohup node -e "global.crypto=require('crypto'); require('./dist/main.js')" > /app/backend.log 2>&1 &
BACKEND_PID=$!

sleep 2

echo "Starting frontend on internal port 3001..."
cd /app/frontend
# Frontend standalone should respect PORT env
export PORT=3001
# Ensure the frontend binds to all interfaces so nginx (127.0.0.1) can reach it.
export HOST=0.0.0.0
export HOSTNAME=0.0.0.0
nohup node server.js > /app/frontend.log 2>&1 &
FRONTEND_PID=$!

sleep 2

echo "Starting nginx (foreground)..."
# Start nginx in foreground; it will listen on port 3000 and proxy /graphql to backend and / to frontend
nginx -g 'daemon off;'

trap "kill -TERM $BACKEND_PID $FRONTEND_PID 2>/dev/null; nginx -s quit 2>/dev/null" TERM INT
wait $BACKEND_PID $FRONTEND_PID
