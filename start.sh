
#!/bin/sh

echo "🚀 Iniciando MUEBLERIA LA ECONOMICA..."

# Verificar que la base de datos esté disponible
echo "📊 Verificando conexión a la base de datos..."
npx prisma db push --accept-data-loss || echo "⚠️  Error en db push, continuando..."

# Ejecutar migraciones
echo "🔄 Aplicando migraciones..."
npx prisma migrate deploy || echo "⚠️  Error en migrations, continuando..."

# Generar cliente Prisma
echo "⚙️  Generando cliente Prisma..."
npx prisma generate || echo "⚠️  Error generando cliente Prisma"

# Ejecutar seed si es necesario
echo "🌱 Ejecutando seed..."
npx prisma db seed || echo "⚠️  Error en seed, continuando..."

# Verificar archivos necesarios
echo "🔍 Verificando archivos del build standalone..."
ls -la . || echo "Error listando directorio actual"
ls -la server.js || echo "⚠️  server.js NO ENCONTRADO"

# Iniciar la aplicación
echo "🎯 Iniciando servidor Next.js standalone..."
if [ -f "server.js" ]; then
    echo "✅ server.js encontrado, iniciando..."
    exec node server.js
else
    echo "❌ ERROR: server.js NO EXISTE"
    echo "📋 Contenido del directorio:"
    ls -la
    echo "❌ BUILD STANDALONE FAILED - NO SERVER.JS"
    exit 1
fi
