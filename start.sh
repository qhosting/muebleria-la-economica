
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
# Use db push for schema sync (without resetting data)
echo "🔄 Sincronizando esquema de base de datos..."
$PRISMA_CMD db push --skip-generate || echo "⚠️  Error en db push, continuando..."

# Regenerar cliente Prisma en container
echo "⚙️  Regenerando cliente Prisma en container..."
$PRISMA_CMD generate || echo "⚠️  Error generando cliente Prisma"

# Ejecutar seed solo si no hay datos
echo "🌱 Verificando si necesita seed..."
$PRISMA_CMD db seed || echo "⚠️  Seed omitido (datos existentes)"

# Crear usuario admin si no existe
echo "👤 Verificando usuario admin..."
if [ -f "/app/seed-admin.sh" ]; then
    sh /app/seed-admin.sh || echo "⚠️  Seed admin omitido"
else
    echo "⚠️  Script seed-admin.sh no encontrado"
fi

# Verificar archivos necesarios
echo "🔍 Verificando archivos de Next.js..."
echo "📁 Contenido directorio actual:"
ls -la . | head -20 || echo "Error listando directorio actual"

# Iniciar la aplicación con next start
echo ""
echo "🎯 Iniciando servidor Next.js..."
echo "   📂 Working directory: /app"
echo "   🌐 Hostname: 0.0.0.0"
echo "   🔌 Port: 3000"
echo ""

cd /app || {
    echo "❌ ERROR: No se puede cambiar a /app"
    exit 1
}

echo "🚀 EJECUTANDO: npm start (next start)"
exec npm start
