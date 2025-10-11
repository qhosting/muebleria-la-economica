
#!/bin/bash

echo "🌱 Ejecutando seed de usuario admin..."
echo "========================================"
echo ""

# Verificar DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL no está configurado"
    exit 1
fi

echo "✅ DATABASE_URL configurado"
echo ""

# Navegar al directorio de la app
cd /app || cd app || {
    echo "❌ No se puede acceder al directorio de la app"
    exit 1
}

# Ejecutar seed
echo "🔨 Ejecutando seed..."
node --require ts-node/register scripts/seed-admin.ts || npx tsx scripts/seed-admin.ts || {
    echo "⚠️  Intentando con node directamente..."
    npx ts-node scripts/seed-admin.ts
}

echo ""
echo "========================================"
echo "✅ Seed completado"
echo "========================================"
