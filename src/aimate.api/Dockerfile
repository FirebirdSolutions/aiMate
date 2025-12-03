# aiMate API Server Dockerfile
# Multi-stage build for production optimization

# ============================================================================
# Build Stage
# ============================================================================
FROM node:20-alpine AS builder

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Install dependencies first (better layer caching)
COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

# Generate Prisma client
RUN npx prisma generate

# Copy source and build
COPY tsconfig.json ./
COPY src ./src/

RUN npm run build

# ============================================================================
# Production Stage
# ============================================================================
FROM node:20-alpine AS production

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Install ALL dependencies (need tsx for seed script)
COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

# Generate Prisma client for production
RUN npx prisma generate

# Copy built application
COPY --from=builder /app/dist ./dist

# Runtime configuration
ENV NODE_ENV=production
ENV PORT=3001

# Expose API port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# Start with migrations and seed
CMD ["npm", "run", "start:prod"]
