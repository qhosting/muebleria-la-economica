# Multi-stage build para optimizar el tamaño de la imagen
FROM node:18-alpine AS base

# Instalar dependencias necesarias para Prisma y Alpine
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Instalar dependencias
FROM base AS deps
COPY app/package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --legacy-peer-deps

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY app/ .

# Generate Prisma client
RUN npx prisma generate

# Build Next.js
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build the application - MUST succeed
RUN echo "🔨 Building Next.js application..." && \
    npm run build && \
    echo "✅ Build completed successfully!" && \
    ls -la .next/

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy everything from builder
COPY --from=builder --chown=nextjs:nodejs /app ./

# Copy backup and admin scripts
COPY --chown=nextjs:nodejs seed-admin.sh backup-manual.sh restore-backup.sh start.sh ./

# Ensure scripts are executable
RUN chmod +x seed-admin.sh backup-manual.sh restore-backup.sh start.sh

# Create backup directory
RUN mkdir -p /backup && chown nextjs:nodejs /backup

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Use custom start script that handles admin seed
CMD ["sh", "start.sh"]
