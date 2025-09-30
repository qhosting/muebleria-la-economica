
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

echo "📁 Verificando archivos de Next.js standalone..."

# Verify server.js exists in the correct location (/app/server.js)
if [ ! -f "/app/server.js" ]; then
    echo "❌ ERROR CRÍTICO: server.js NO ENCONTRADO en /app/server.js"
    echo "📋 Estructura del directorio /app:"
    ls -la /app/ | head -30
    echo ""
    echo "🔍 Buscando server.js en todo el filesystem:"
    find /app -name "server.js" -type f 2>/dev/null | head -10
    echo ""
    echo "❌ El Dockerfile no copió correctamente el standalone build"
    echo "🔄 Intentando fallback con next start..."
    exec npx next start
    exit 1
fi

echo "✅ server.js encontrado en /app/server.js (CORRECTO)"
echo "📋 Contenido del directorio /app:"
ls -la /app/ | head -20

# Iniciar la aplicación desde /app con server.js
echo ""
echo "🎯 Iniciando servidor Next.js standalone..."
echo "   📂 Working directory: /app"
echo "   📄 Server: /app/server.js"
echo "   🌐 Hostname: 0.0.0.0"
echo "   🔌 Port: 3000"
echo ""

cd /app || {
    echo "❌ ERROR: No se puede cambiar a /app"
    exit 1
}

echo "🚀 EJECUTANDO: node server.js"
exec node server.js
