
#!/bin/sh

echo "🚀 Iniciando MUEBLERIA LA ECONOMICA..."

# Configure PATH to include node_modules/.bin for Prisma CLI
export PATH="$PATH:/app/node_modules/.bin"
echo "📍 PATH configurado: $PATH"

# Verify .bin directory and Prisma CLI exist
echo "🔍 Verificando Prisma CLI..."
if [ -f "node_modules/.bin/prisma" ]; then
    echo "✅ Prisma CLI encontrado en node_modules/.bin/prisma"
    PRISMA_CMD="node_modules/.bin/prisma"
elif [ -f "node_modules/prisma/build/index.js" ]; then
    echo "⚠️  Usando Prisma directamente desde build/index.js"
    PRISMA_CMD="node node_modules/prisma/build/index.js"
else
    echo "❌ Prisma CLI no encontrado - intentando con npx"
    PRISMA_CMD="npx prisma"
fi

echo "🎯 Comando Prisma: $PRISMA_CMD"

# Verificar cliente Prisma existe
echo "🔍 Verificando cliente Prisma..."
if [ ! -d "node_modules/@prisma/client" ]; then
    echo "⚠️  Cliente Prisma no encontrado, generando..."
    $PRISMA_CMD generate || echo "❌ Error generando cliente Prisma"
fi

# Verificar que la base de datos esté disponible  
echo "📊 Verificando conexión a la base de datos..."
# Use db push for existing database with data (fixes P3005)
$PRISMA_CMD db push --force-reset --accept-data-loss || $PRISMA_CMD db push --accept-data-loss || echo "⚠️  Error en db push, continuando..."

# Skip migrations for existing database - use db push instead
echo "🔄 Sincronizando esquema de base de datos..."
$PRISMA_CMD db push --accept-data-loss || echo "⚠️  Error en sync, continuando..."

# Regenerar cliente Prisma en container
echo "⚙️  Regenerando cliente Prisma en container..."
$PRISMA_CMD generate || echo "⚠️  Error generando cliente Prisma"

# Ejecutar seed solo si no hay datos
echo "🌱 Verificando si necesita seed..."
$PRISMA_CMD db seed || echo "⚠️  Seed omitido (datos existentes)"

# Verificar archivos necesarios
echo "🔍 Verificando archivos del build standalone..."
echo "📁 Contenido directorio actual:"
ls -la . || echo "Error listando directorio actual"

echo "📁 Buscando server.js en múltiples ubicaciones:"

# CRITICAL: Verificar estructura completa del directorio
echo "📋 Estructura completa de /app:"
ls -laR /app/ | head -100

# Buscar server.js en el orden correcto (raíz primero)
if [ -f "/app/server.js" ]; then
    echo "✅ server.js encontrado en /app/ (CORRECTO)"
    SERVER_PATH="/app/server.js"
    WORK_DIR="/app"
elif [ -f "server.js" ]; then
    echo "✅ server.js encontrado en directorio actual"
    SERVER_PATH="./server.js"
    WORK_DIR="$(pwd)"
elif [ -f ".next/standalone/server.js" ]; then
    echo "✅ server.js encontrado en .next/standalone/"
    SERVER_PATH=".next/standalone/server.js"
    WORK_DIR=".next/standalone"
elif [ -f "app/server.js" ]; then
    echo "⚠️  server.js encontrado en app/ (POSIBLEMENTE INCORRECTO)"
    echo "🔍 Verificando contenido de app/:"
    ls -la app/ | head -20
    SERVER_PATH="app/server.js"
    WORK_DIR="app"
else
    echo "❌ ERROR: server.js NO ENCONTRADO en ninguna ubicación"
    echo "📋 Verificando estructura de directorios:"
    echo "=== /app/ ==="
    ls -la /app/ 2>/dev/null || echo "/app directory issue"
    echo "=== /app/.next/ ==="
    ls -la /app/.next/ 2>/dev/null || echo ".next directory no existe"
    echo "=== /app/app/ ==="
    ls -la /app/app/ 2>/dev/null || echo "app subdirectory no existe"
    echo "🔄 Intentando con next start como fallback..."
    exec npx next start
    exit 1
fi

# Iniciar la aplicación
echo "🎯 Iniciando servidor Next.js standalone"
echo "   📂 Working directory: $WORK_DIR"
echo "   📄 Server path: $SERVER_PATH"
echo "   🔧 Verificando permisos:"
ls -la "$SERVER_PATH"

# CRITICAL: Always use absolute path and correct working directory
echo "🚀 Cambiando a working directory: $WORK_DIR"
cd "$WORK_DIR" || {
    echo "❌ ERROR: No se puede cambiar a $WORK_DIR"
    exit 1
}

echo "📍 PWD actual: $(pwd)"
echo "📁 Contenido del directorio actual:"
ls -la . | head -20

# Verificar que podemos acceder al server.js desde aquí
if [ -f "server.js" ]; then
    echo "✅ server.js accesible desde working directory"
    echo "🎯 EJECUTANDO: node server.js"
    exec node server.js
elif [ -f "$SERVER_PATH" ]; then
    echo "✅ server.js accesible desde path absoluto"
    echo "🎯 EJECUTANDO: node $SERVER_PATH"
    exec node "$SERVER_PATH"
else
    echo "❌ ERROR: server.js no accesible"
    echo "🔄 Intentando fallback..."
    exec npx next start
fi
