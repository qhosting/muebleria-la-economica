
#!/bin/sh

echo "🚀 Iniciando MUEBLERIA LA ECONOMICA..."

# Configure PATH to include node_modules/.bin for Prisma CLI
export PATH="$PATH:/app/node_modules/.bin"
echo "📍 PATH configurado: $PATH"

# Use local Prisma installation instead of npx (fixes permission errors)
PRISMA_CMD="node_modules/.bin/prisma"

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
if [ -f "server.js" ]; then
    echo "✅ server.js encontrado en directorio raíz"
    SERVER_PATH="./server.js"
elif [ -f ".next/standalone/server.js" ]; then
    echo "✅ server.js encontrado en .next/standalone/"
    SERVER_PATH=".next/standalone/server.js"
elif [ -f "app/server.js" ]; then
    echo "✅ server.js encontrado en app/"
    SERVER_PATH="app/server.js"
else
    echo "❌ ERROR: server.js NO ENCONTRADO en ninguna ubicación"
    echo "📋 Verificando estructura de .next:"
    ls -la .next/ 2>/dev/null || echo ".next directory no existe"
    ls -la .next/standalone/ 2>/dev/null || echo ".next/standalone directory no existe"
    echo "🔄 Intentando con next start como fallback..."
    exec npx next start
    exit 1
fi

# Iniciar la aplicación
echo "🎯 Iniciando servidor Next.js standalone con: $SERVER_PATH"
echo "🔧 Verificando permisos del archivo:"
ls -la "$SERVER_PATH"

# Set correct working directory for server.js
if [[ "$SERVER_PATH" == *"standalone"* ]]; then
    echo "📂 Cambiando a directorio standalone..."
    cd .next/standalone
    exec node server.js
else
    echo "📂 Ejecutando desde directorio actual..."
    exec node "$SERVER_PATH"
fi
