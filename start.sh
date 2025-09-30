
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
