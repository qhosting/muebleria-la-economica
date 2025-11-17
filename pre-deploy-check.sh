#!/bin/bash
# Pre-deploy check simplificado

set -e
GREEN='\033[0;32m'; RED='\033[0;31m'; NC='\033[0m'
print_ok() { echo -e "${GREEN}✓${NC} $1"; }
print_err() { echo -e "${RED}✗${NC} $1"; }

echo "🔍 Pre-deploy check..."
ERRORS=0

# 1. package-lock.json
if [ ! -f "app/package-lock.json" ]; then
    print_err "app/package-lock.json no existe"
    ERRORS=$((ERRORS + 1))
else
    print_ok "package-lock.json existe ($(du -h app/package-lock.json | cut -f1))"
fi

# 2. Prisma schema
if [ ! -f "app/prisma/schema.prisma" ]; then
    print_err "app/prisma/schema.prisma no existe"
    ERRORS=$((ERRORS + 1))
else
    ENUMS=$(grep -c "^enum " app/prisma/schema.prisma || echo 0)
    print_ok "Prisma schema OK ($ENUMS enums)"
fi

# 3. Dockerfile Alpine version
if grep -q "alpine3.19" Dockerfile; then
    print_ok "Dockerfile usa Alpine 3.19"
else
    print_err "Dockerfile debe usar Alpine 3.19"
    ERRORS=$((ERRORS + 1))
fi

# 4. Dockerfile usa npm
if grep -q "npm ci" Dockerfile; then
    print_ok "Dockerfile usa npm ci"
else
    print_err "Dockerfile debe usar npm ci"
    ERRORS=$((ERRORS + 1))
fi

echo ""
if [ $ERRORS -eq 0 ]; then
    echo "✅ Todo listo para deploy"
    exit 0
else
    echo "❌ $ERRORS problemas encontrados"
    exit 1
fi
