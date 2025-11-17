
#!/bin/bash

# Script para instalar git hooks automáticamente
# Ejecutar: bash install-git-hooks.sh

echo "🔧 Instalando Git Hooks..."

# Verificar que estamos en el directorio correcto
if [ ! -d ".git" ]; then
    echo "❌ Error: Este no es un repositorio git"
    echo "   Ejecuta este script desde la raíz del proyecto"
    exit 1
fi

# Crear directorio hooks si no existe
mkdir -p .git/hooks

# Crear pre-push hook
cat > .git/hooks/pre-push << 'HOOK_EOF'
#!/bin/bash

# Git Hook: Pre-Push Verification
# Ejecuta pre-deploy-check.sh antes de cada push
# Si falla, cancela el push

echo "🔍 Ejecutando verificaciones pre-push..."
echo ""

# Ejecutar pre-deploy check
if bash pre-deploy-check.sh; then
    echo ""
    echo "✅ Verificaciones OK - Continuando con push..."
    exit 0
else
    echo ""
    echo "❌ Verificaciones fallaron - Push cancelado"
    echo ""
    echo "💡 Revisa los errores arriba y corrige antes de pushear"
    echo "   Para saltear este check (no recomendado): git push --no-verify"
    exit 1
fi
HOOK_EOF

# Dar permisos de ejecución
chmod +x .git/hooks/pre-push

echo "✅ Hook pre-push instalado correctamente"
echo ""
echo "📝 Ahora cada 'git push' ejecutará automáticamente:"
echo "   → pre-deploy-check.sh"
echo "   → Si falla, el push se cancela"
echo ""
echo "💡 Para desinstalar: rm .git/hooks/pre-push"
echo "   Para saltear: git push --no-verify"
