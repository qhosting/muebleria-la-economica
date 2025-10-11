# Multi-stage build para optimizar el tamaño de la imagen
FROM node:18-alpine AS base

# Instalar dependencias necesarias para Prisma y Alpine
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Instalar dependencias
FROM base AS deps
WORKDIR /app
COPY app/package*.json ./
RUN npm ci --legacy-peer-deps --no-audit --no-fund

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Accept build-time environment variables
ARG DATABASE_URL
ARG NEXTAUTH_URL
ARG NEXTAUTH_SECRET

# Copy node_modules from deps
COPY --from=deps /app/node_modules ./node_modules

# Copy app source
COPY app/package*.json ./
COPY app/next.config.js ./
COPY app/next-env.d.ts* ./
COPY app/tsconfig.json ./
COPY app/postcss.config.js ./
COPY app/tailwind.config.ts ./
COPY app/components.json ./
COPY app/.env* ./
COPY app/app ./app
COPY app/components ./components
COPY app/hooks ./hooks
COPY app/lib ./lib
COPY app/prisma ./prisma
COPY app/public ./public

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV SKIP_ENV_VALIDATION=1
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Generate Prisma client first
RUN echo "📦 Generating Prisma client..." && \
    npx prisma generate && \
    echo "✅ Prisma client generated"

# Build Next.js with increased memory and error handling
RUN echo "🔨 Building Next.js application..." && \
    npm run build 2>&1 | tee build.log && \
    echo "✅ Build completed successfully!" || \
    (echo "❌ Build failed! Last 50 lines:" && tail -50 build.log && exit 1)

# Production image - Keep it simple, copy everything
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/package*.json ./
COPY --from=builder --chown=nextjs:nodejs /app/next.config.js ./
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Copy scripts
COPY --chown=nextjs:nodejs seed-admin.sh backup-manual.sh restore-backup.sh start.sh ./
RUN chmod +x seed-admin.sh backup-manual.sh restore-backup.sh start.sh

# Create backup directory
RUN mkdir -p /backup && chown nextjs:nodejs /backup

USER nextjs

EXPOSE 3000

# Use custom start script
CMD ["sh", "start.sh"]
