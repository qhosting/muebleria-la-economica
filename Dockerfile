
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
ENV BUILD_TIMESTAMP=20250930_071000_PRISMA_CLIENT_FIX
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
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma files with CORRECT PERMISSIONS - COMPLETE RUNTIME
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma

# Copy start scripts with CORRECT PERMISSIONS
COPY --chown=nextjs:nodejs start.sh ./
COPY --chown=nextjs:nodejs emergency-start.sh ./
RUN chmod +x start.sh emergency-start.sh

# Create writable directory for Prisma with correct permissions
RUN mkdir -p node_modules/.prisma && chown -R nextjs:nodejs node_modules/.prisma
RUN mkdir -p node_modules/@prisma && chown -R nextjs:nodejs node_modules/@prisma

# Install prisma globally in container to fix npx issues
RUN npm install -g prisma@6.16.3

# Verify Prisma client installation
RUN ls -la node_modules/@prisma/ || echo "⚠️  @prisma directory missing"
RUN ls -la node_modules/.prisma/ || echo "⚠️  .prisma directory missing"

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Start with our custom script
CMD ["./start.sh"]
