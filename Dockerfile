# Multi-stage Dockerfile for TimeSheet Application
# Stage 1: Build Backend
FROM node:18-alpine AS backend-builder

WORKDIR /app/backend

# Copy backend package files
COPY backend/package*.json ./
RUN npm ci --only=production

# Copy backend source code
COPY backend/ ./

# Build backend
RUN npm run build

# Stage 2: Build Frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./
RUN npm ci

# Copy frontend source code
COPY frontend/ ./

# Build frontend for production
RUN npm run build

# Stage 3: Production Runtime
FROM node:18-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

WORKDIR /app

# Copy backend built application
COPY --from=backend-builder --chown=nextjs:nodejs /app/backend/dist ./backend/dist
COPY --from=backend-builder --chown=nextjs:nodejs /app/backend/node_modules ./backend/node_modules
COPY --from=backend-builder --chown=nextjs:nodejs /app/backend/package*.json ./backend/

# Copy frontend built application
COPY --from=frontend-builder --chown=nextjs:nodejs /app/frontend/.next/standalone ./frontend/
COPY --from=frontend-builder --chown=nextjs:nodejs /app/frontend/.next/static ./frontend/.next/static
COPY --from=frontend-builder --chown=nextjs:nodejs /app/frontend/public ./frontend/public

# Create startup script
COPY --chown=nextjs:nodejs <<EOF /app/start.sh
#!/bin/sh
set -e

# Start backend in background
echo "Starting backend..."
cd /app/backend
node dist/main.js &
BACKEND_PID=\$!

# Wait a moment for backend to start
sleep 5

# Start frontend
echo "Starting frontend..."
cd /app/frontend
node server.js &
FRONTEND_PID=\$!

# Wait for both processes
wait \$BACKEND_PID \$FRONTEND_PID
EOF

RUN chmod +x /app/start.sh

# Switch to non-root user
USER nextjs

# Expose ports
EXPOSE 3000 8181

# Environment variables with defaults
ENV NODE_ENV=production
ENV PORT=3000
ENV BACKEND_PORT=8181
ENV DB_HOST=localhost
ENV DB_PORT=5432
ENV DB_USER=postgres
ENV DB_PASSWORD=password
ENV DB_NAME=timesheet
ENV JWT_SECRET=your-secret-key-change-in-production
ENV NEXT_PUBLIC_GRAPHQL_URL=http://localhost:8181/graphql

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["/app/start.sh"]