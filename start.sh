
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

# Iniciar la aplicación
echo "🎯 Iniciando servidor Next.js..."
exec node server.js
