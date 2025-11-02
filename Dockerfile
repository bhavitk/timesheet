# Multi-stage Dockerfile for TimeSheet Application
# Stage 1: Build Backend
FROM node:18-alpine AS backend-builder

WORKDIR /app/backend

# Copy backend package files and install full deps for build
COPY backend/package*.json ./
RUN npm ci

# Copy backend source code
COPY backend/ ./

# Build backend (TypeScript compile)
RUN npm run build

# Remove devDependencies to keep node_modules small
RUN npm prune --production

# Stage 2: Build Frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package files and install deps for build
COPY frontend/package*.json ./
RUN npm ci

# Copy frontend source code
COPY frontend/ ./

# Allow passing build-time NEXT_PUBLIC_GRAPHQL_URL without relying on a repo .env (which is usually ignored)
ARG NEXT_PUBLIC_GRAPHQL_URL=/graphql
# Create a small .env file for the frontend build using the build-arg
RUN printf "NEXT_PUBLIC_GRAPHQL_URL=%s\n" "$NEXT_PUBLIC_GRAPHQL_URL" > .env

# Build frontend for production (Next.js)
RUN npm run build

# Remove devDependencies to keep node_modules small
RUN npm prune --production

# Stage 3: Production Runtime
FROM node:18-alpine AS production

# Install dumb-init and curl for healthchecks
RUN apk add --no-cache dumb-init curl

# Install nginx for reverse proxy (will expose single external port 3000 and proxy /graphql to backend)
RUN apk add --no-cache nginx

# Nginx main configuration: copy from project file so it's easier to edit and review
COPY nginx.conf /etc/nginx/nginx.conf

WORKDIR /app

# Copy backend built application
COPY --from=backend-builder /app/backend/dist ./backend/dist
COPY --from=backend-builder /app/backend/node_modules ./backend/node_modules
COPY --from=backend-builder /app/backend/package*.json ./backend/

# Copy frontend built application (Next standalone) and production node_modules
# Copy the entire .next directory (not just static) so server chunks required at runtime are present.
COPY --from=frontend-builder /app/frontend/.next ./frontend/.next
COPY --from=frontend-builder /app/frontend/.next/standalone ./frontend/
COPY --from=frontend-builder /app/frontend/public ./frontend/public
COPY --from=frontend-builder /app/frontend/node_modules ./frontend/node_modules

# Copy startup script from repository and make executable
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Expose ports
EXPOSE 3000 8181

# Environment variables with defaults
ENV NODE_ENV=production
ENV PORT=3000
ENV BACKEND_PORT=8181
ENV DB_HOST=localhost
ENV DB_PORT=5432
ENV DB_USER=postgres
ENV DB_NAME=timesheet
# Note: Do NOT hardcode sensitive secrets here. Pass DB_PASSWORD and JWT_SECRET at runtime via --env or --env-file.
ENV NEXT_PUBLIC_GRAPHQL_URL=/graphql

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -fsS --max-time 2 http://localhost:3000/api/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["/app/start.sh"]