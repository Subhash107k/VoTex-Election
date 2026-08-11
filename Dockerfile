# =========================================================
# VoTex Enterprise Multi-Stage Production Dockerfile
# =========================================================

# Stage 1: Build Frontend & Backend Bundles
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package manifests
COPY package*.json tsconfig.json vite.config.ts ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy application source code
COPY . .

# Set production environment for client & server build
ENV NODE_ENV=production

# Execute complete build pipeline (clean, build:client, build:server)
RUN npm run build

# Stage 2: Minimal Production Runtime
FROM node:20-alpine AS runner

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built bundles from builder stage
COPY --from=builder /app/dist ./dist

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000

# Expose default HTTP port
EXPOSE 3000

# Start production server
CMD ["node", "dist/server.cjs"]
