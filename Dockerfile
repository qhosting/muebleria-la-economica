
# Multi-stage build para optimizar el tamaño de la imagen
FROM node:18-alpine AS base

# Instalar dependencias necesarias para Prisma y Alpine
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Configurar yarn para usar cache
ENV YARN_CACHE_FOLDER=/app/.yarn-cache

# Instalar dependencias
FROM base AS deps
COPY app/package.json app/yarn.lock* ./
RUN --mount=type=cache,target=/app/.yarn-cache \
    yarn install --production=false

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY app/ .

# Generate Prisma client with complete runtime
RUN npx prisma generate --generator client

# Copy and prepare the standalone build script
COPY build-with-standalone.sh ./
RUN chmod +x build-with-standalone.sh

# Build the application with standalone output - FORCE REBUILD NO CACHE
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_OUTPUT_MODE=standalone
ENV BUILD_TIMESTAMP=20250930_073500_PRISMA_BIN_FIX
RUN echo "Force rebuild timestamp: $BUILD_TIMESTAMP" && ./build-with-standalone.sh

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# CRITICAL: Copy from standalone/app/* because outputFileTracingRoot creates nested structure
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone/app ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma files with CORRECT PERMISSIONS - COMPLETE RUNTIME + CLI
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.bin ./node_modules/.bin

# Copy start scripts with CORRECT PERMISSIONS
COPY --chown=nextjs:nodejs start.sh ./
COPY --chown=nextjs:nodejs emergency-start.sh ./
RUN chmod +x start.sh emergency-start.sh

# Create writable directory for Prisma with correct permissions
RUN mkdir -p node_modules/.prisma && chown -R nextjs:nodejs node_modules/.prisma
RUN mkdir -p node_modules/@prisma && chown -R nextjs:nodejs node_modules/@prisma
RUN mkdir -p node_modules/.bin && chown -R nextjs:nodejs node_modules/.bin

# Verify Prisma client installation - CRITICAL CHECKS
RUN ls -la node_modules/@prisma/ || echo "⚠️  @prisma directory missing"
RUN ls -la node_modules/.prisma/ || echo "⚠️  .prisma directory missing"
RUN ls -la node_modules/prisma/ || echo "⚠️  prisma directory missing"

# Verify Prisma CLI is available in node_modules/.bin - MUST EXIST
RUN ls -la node_modules/.bin/ || echo "⚠️  .bin directory missing"
RUN ls -la node_modules/.bin/prisma && echo "✅ Prisma CLI found in .bin" || echo "❌ CRITICAL: prisma CLI not found in .bin"

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Start with our custom script
CMD ["./start.sh"]
