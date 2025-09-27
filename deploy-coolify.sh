
#!/bin/bash
set -e

echo "🚀 Script de despliegue para Coolify - MUEBLERIA LA ECONOMICA"
echo "=================================================="

# Verificar que estamos en el directorio correcto
if [ ! -f "Dockerfile" ]; then
    echo "❌ Error: Dockerfile no encontrado. Ejecuta este script desde el directorio raíz del proyecto."
    exit 1
fi

# Verificar que git esté inicializado
if [ ! -d ".git" ]; then
    echo "🔧 Inicializando repositorio Git..."
    git init
fi

# Verificar archivos necesarios
echo "🔍 Verificando archivos necesarios..."
required_files=("Dockerfile" "docker-compose.yml" "app/package.json" "app/prisma/schema.prisma")
for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Error: Archivo requerido no encontrado: $file"
        exit 1
    fi
done

echo "✅ Todos los archivos necesarios están presentes."

# Mostrar estructura de archivos
echo "📁 Estructura del proyecto:"
echo "├── Dockerfile"
echo "├── docker-compose.yml"
echo "├── .coolify/"
echo "│   └── docker-compose.yml"
echo "├── app/"
echo "│   ├── package.json"
echo "│   ├── prisma/"
echo "│   │   └── schema.prisma"
echo "│   └── start.sh"
echo "└── README-COOLIFY.md"

# Verificar variables de entorno
echo ""
echo "🔑 Variables de entorno requeridas para Coolify:"
echo "   DATABASE_URL - URL de conexión a PostgreSQL"
echo "   NEXTAUTH_URL - URL pública de tu aplicación"
echo "   NEXTAUTH_SECRET - Secreto para NextAuth"
echo ""

# Generar secreto si es necesario
if command -v openssl > /dev/null; then
    echo "🔐 Secreto sugerido para NEXTAUTH_SECRET:"
    openssl rand -base64 32
    echo ""
fi

# Preparar para commit
echo "📝 Preparando archivos para commit..."
git add .

# Mostrar status
echo "📊 Estado del repositorio:"
git status --short

echo ""
echo "✅ Preparación completada!"
echo ""
echo "📋 Próximos pasos:"
echo "1. Revisar y ajustar las variables en .env.example"
echo "2. Commit y push a tu repositorio:"
echo "   git commit -m 'Configuración inicial para Coolify'"
echo "   git remote add origin https://github.com/tu-usuario/muebleria-la-economica.git"
echo "   git push -u origin main"
echo ""
echo "3. En Coolify:"
echo "   - Crear nueva aplicación"
echo "   - Usar repositorio Git"
echo "   - Configurar variables de entorno"
echo "   - Deploy!"
echo ""
echo "📖 Lee README-COOLIFY.md para instrucciones detalladas."
