
#!/bin/sh

echo "🚨 EMERGENCY START - Diagnóstico y Fix"
echo "====================================="

# Verificar entorno
echo "📋 Verificando entorno de ejecución..."
echo "NODE_ENV: $NODE_ENV"
echo "HOSTNAME: $HOSTNAME" 
echo "PORT: $PORT"
echo "PWD: $(pwd)"

# Listar contenido completo
echo ""
echo "📁 Contenido del directorio de trabajo:"
ls -la

echo ""
echo "📁 Verificando si existe .next/standalone:"
if [ -d ".next/standalone" ]; then
    echo "✅ .next/standalone EXISTS"
    ls -la .next/standalone/
else
    echo "❌ .next/standalone NO EXISTE"
    echo "📁 Contenido de .next/:"
    ls -la .next/ || echo "❌ .next directory no existe"
fi

# Verificar server.js
echo ""
echo "🔍 Buscando server.js..."
if [ -f "server.js" ]; then
    echo "✅ server.js encontrado en directorio raíz"
elif [ -f ".next/standalone/server.js" ]; then
    echo "✅ server.js encontrado en .next/standalone/"
    echo "🔧 Copiando server.js al directorio raíz..."
    cp .next/standalone/server.js .
    cp -r .next/standalone/.next .
else
    echo "❌ server.js NO ENCONTRADO - Build standalone falló"
fi

# Verificar variables críticas
echo ""
echo "🔍 Verificando variables de entorno críticas..."
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL no está definida"
else
    echo "✅ DATABASE_URL está configurada"
fi

if [ -z "$NEXTAUTH_SECRET" ]; then
    echo "❌ NEXTAUTH_SECRET no está definida"
else
    echo "✅ NEXTAUTH_SECRET está configurada"
fi

# Verificar base de datos
echo ""
echo "📊 Probando conexión a la base de datos..."
timeout 10 npx prisma db push --accept-data-loss || echo "⚠️  Timeout o error en conexión DB"

# Intentar diferentes métodos de inicio
echo ""
echo "🚀 Intentando iniciar la aplicación..."

if [ -f "server.js" ]; then
    echo "✅ Método 1: Iniciando con server.js standalone"
    exec node server.js
elif [ -f ".next/standalone/server.js" ]; then
    echo "✅ Método 2: Iniciando desde .next/standalone/"
    cd .next/standalone
    exec node server.js
else
    echo "⚠️  Método 3: Fallback a next start"
    exec npx next start
fi
