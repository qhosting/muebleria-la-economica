
#!/bin/bash

# =============================================================================
# 🔍 PRE-DEPLOY CHECK - MUEBLERIA LA ECONOMICA
# =============================================================================
# Verifica y corrige problemas comunes antes de hacer deploy a Coolify
# Uso: bash pre-deploy-check.sh

set -e

# Colores
GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
print_success() { echo -e "${GREEN}✓${NC} $1"; }
print_error() { echo -e "${RED}✗${NC} $1"; }
print_warning() { echo -e "${YELLOW}⚠${NC} $1"; }
print_info() { echo -e "${BLUE}ℹ${NC} $1"; }

echo ""
echo "🔍 PRE-DEPLOY CHECK"
echo "==================="
echo ""

cd /home/ubuntu/muebleria_la_economica/app

ISSUES_FOUND=0

# =============================================================================
# 1. Verificar yarn.lock (no debe ser symlink)
# =============================================================================
print_info "1. Verificando yarn.lock..."

if [ -L "yarn.lock" ]; then
    print_warning "yarn.lock es un symlink, convirtiéndolo a archivo real..."
    
    # Backup del symlink target
    SYMLINK_TARGET=$(readlink yarn.lock)
    print_info "  Symlink apunta a: $SYMLINK_TARGET"
    
    # Eliminar symlink
    rm yarn.lock
    
    # Crear archivo vacío y regenerar
    touch yarn.lock
    
    # Verificar si existe .yarnrc.yml
    if [ ! -f ".yarnrc.yml" ]; then
        print_info "  Creando .yarnrc.yml..."
        cat > .yarnrc.yml << 'EOF'
nodeLinker: node-modules
EOF
    fi
    
    print_info "  Regenerando yarn.lock con 'yarn install'..."
    yarn install > /dev/null 2>&1 || {
        print_error "  Falló yarn install, intentando con npm..."
        npm install --package-lock-only --legacy-peer-deps > /dev/null 2>&1
        print_warning "  Usando package-lock.json en lugar de yarn.lock"
    }
    
    if [ -f "yarn.lock" ] && [ ! -L "yarn.lock" ]; then
        print_success "  yarn.lock convertido a archivo real ($(du -h yarn.lock | cut -f1))"
    else
        print_error "  No se pudo generar yarn.lock"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
else
    if [ -f "yarn.lock" ]; then
        print_success "yarn.lock es un archivo válido ($(du -h yarn.lock | cut -f1))"
    else
        print_warning "yarn.lock no existe, generándolo..."
        touch yarn.lock
        yarn install > /dev/null 2>&1 || print_warning "  No se pudo generar"
    fi
fi

# =============================================================================
# 2. Verificar Prisma schema
# =============================================================================
print_info "2. Verificando Prisma schema..."

if [ -f "prisma/schema.prisma" ]; then
    # Verificar que tenga los enums necesarios
    ENUMS_FOUND=0
    for enum_name in UserRole StatusCuenta Periodicidad TipoPago MotivoMotarario; do
        if grep -q "enum $enum_name" prisma/schema.prisma; then
            ENUMS_FOUND=$((ENUMS_FOUND + 1))
        else
            print_warning "  Enum '$enum_name' no encontrado"
        fi
    done
    
    if [ $ENUMS_FOUND -eq 5 ]; then
        print_success "Prisma schema válido (5/5 enums encontrados)"
    else
        print_warning "Prisma schema incompleto ($ENUMS_FOUND/5 enums)"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
else
    print_error "prisma/schema.prisma no encontrado"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

# =============================================================================
# 3. Verificar Dockerfile
# =============================================================================
print_info "3. Verificando Dockerfile..."

cd /home/ubuntu/muebleria_la_economica

if [ -f "Dockerfile" ]; then
    # Verificar versión de Alpine (debe ser 3.19, no 3.21)
    if grep -q "alpine3.19" Dockerfile; then
        print_success "Dockerfile usa Alpine 3.19 (correcto)"
    elif grep -q "alpine3.21" Dockerfile; then
        print_error "Dockerfile usa Alpine 3.21 (causará errores de repos)"
        print_info "  Cambiar a: FROM node:18-alpine3.19"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    else
        ALPINE_VERSION=$(grep -o "alpine[0-9.]*" Dockerfile | head -1)
        if [ -n "$ALPINE_VERSION" ]; then
            print_warning "Dockerfile usa $ALPINE_VERSION (verificar compatibilidad)"
        fi
    fi
    
    # Verificar que use yarn si existe yarn.lock
    if [ -f "app/yarn.lock" ]; then
        if grep -q "yarn install" Dockerfile; then
            print_success "Dockerfile usa yarn (correcto para yarn.lock)"
            
            # Verificar --frozen-lockfile
            if grep -q "yarn install --frozen-lockfile" Dockerfile; then
                print_success "Dockerfile usa --frozen-lockfile (correcto)"
            else
                print_warning "Dockerfile no usa --frozen-lockfile"
                print_info "  Considera agregar: yarn install --frozen-lockfile"
            fi
        else
            print_warning "Dockerfile no usa yarn, pero yarn.lock existe"
            print_info "  Considera actualizar Dockerfile para usar yarn"
        fi
    fi
    
    # Verificar que tenga prisma generate
    if grep -q "prisma generate" Dockerfile; then
        print_success "Dockerfile genera Prisma client"
        
        # Verificar validación de enums (test con node -e)
        if grep -q "node -e.*UserRole.*require" Dockerfile; then
            print_success "Dockerfile valida enums de Prisma"
        else
            print_warning "Dockerfile no valida enums después de generar"
            print_info "  Recomendado: Agregar test con node -e para validar enums"
        fi
    else
        print_warning "Dockerfile no ejecuta 'prisma generate'"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
    
    # Verificar que use ./node_modules/.bin/prisma en lugar de npx
    if grep -q "npx prisma generate" Dockerfile; then
        print_warning "Dockerfile usa 'npx prisma' (puede causar problemas)"
        print_info "  Recomendado: ./node_modules/.bin/prisma generate"
    elif grep -q "./node_modules/.bin/prisma generate" Dockerfile; then
        print_success "Dockerfile usa path directo a prisma CLI (correcto)"
    fi
else
    print_error "Dockerfile no encontrado"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

# =============================================================================
# 4. Verificar archivos esenciales
# =============================================================================
print_info "4. Verificando archivos esenciales..."

ESSENTIAL_FILES=(
    "app/package.json"
    "app/next.config.js"
    "app/tsconfig.json"
    "start.sh"
)

MISSING_FILES=0
for file in "${ESSENTIAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        print_success "  $file ✓"
    else
        print_error "  $file ✗ (FALTA)"
        MISSING_FILES=$((MISSING_FILES + 1))
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
done

# =============================================================================
# 5. Verificar variables de entorno requeridas
# =============================================================================
print_info "5. Verificando .env (opcional)..."

if [ -f "app/.env" ]; then
    REQUIRED_VARS=("DATABASE_URL" "NEXTAUTH_URL" "NEXTAUTH_SECRET")
    MISSING_VARS=0
    
    for var in "${REQUIRED_VARS[@]}"; do
        if grep -q "^${var}=" app/.env; then
            print_success "  $var definido"
        else
            print_warning "  $var no definido en .env (se usarán vars de Coolify)"
            MISSING_VARS=$((MISSING_VARS + 1))
        fi
    done
else
    print_warning ".env no encontrado (se usarán variables de entorno de Coolify)"
fi

# =============================================================================
# 6. Verificar permisos de scripts
# =============================================================================
print_info "6. Verificando permisos de scripts..."

SCRIPTS=("start.sh" "seed-admin.sh" "backup-manual.sh" "restore-backup.sh")
for script in "${SCRIPTS[@]}"; do
    if [ -f "$script" ]; then
        if [ -x "$script" ]; then
            print_success "  $script tiene permisos de ejecución"
        else
            print_warning "  $script no tiene permisos de ejecución, corrigiendo..."
            chmod +x "$script"
            print_success "  Permisos corregidos para $script"
        fi
    fi
done

# =============================================================================
# RESUMEN
# =============================================================================
echo ""
echo "=========================================="

if [ $ISSUES_FOUND -eq 0 ]; then
    print_success "🎉 ¡TODO LISTO PARA DEPLOY!"
    echo ""
    print_info "Próximos pasos:"
    echo "  1. git add -A"
    echo "  2. git commit -m 'Pre-deploy check: Todo OK'"
    echo "  3. git push origin main"
    echo "  4. Deploy en Coolify"
    echo ""
    exit 0
else
    print_warning "⚠️  Se encontraron $ISSUES_FOUND problemas"
    echo ""
    print_info "Revisa los problemas anteriores antes de hacer deploy"
    echo ""
    exit 1
fi
