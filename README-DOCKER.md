
# 🚀 MUEBLERIA LA ECONOMICA - Docker Deployment

Sistema completo de gestión y cobranza para Mueblería La Económica con despliegue Docker.

## 📋 Requisitos Previos

- Docker 20.10+
- Docker Compose 2.0+
- 2GB RAM mínimo
- 10GB espacio en disco

## 🛠️ Instalación Rápida

### 1. Clonar el Repositorio
```bash
git clone <tu-repositorio>
cd muebleria_la_economica
```

### 2. Configurar Variables de Entorno
```bash
cp .env.example .env
# Edita .env con tus configuraciones
```

### 3. Desplegar con Docker
```bash
chmod +x docker-deploy.sh
./docker-deploy.sh
```

## 🏗️ Construcción Manual

### Desarrollo
```bash
docker-compose up --build
```

### Producción
```bash
docker-compose -f docker-production.yml up --build -d
```

## 📊 Servicios Incluidos

| Servicio | Puerto | Descripción |
|----------|--------|-------------|
| App Web  | 3000   | Aplicación Next.js |
| PostgreSQL | 5432 | Base de datos |
| Nginx    | 80/443 | Proxy reverso (producción) |

## 👥 Usuarios Predeterminados

| Email | Contraseña | Rol |
|-------|------------|-----|
| admin@muebleria.com | password123 | Administrador |
| gestor@muebleria.com | password123 | Gestor Cobranza |
| cobrador@muebleria.com | password123 | Cobrador |
| reportes@muebleria.com | password123 | Reportes |

## 🔧 Comandos Útiles

### Ver Logs
```bash
docker-compose logs -f app
docker-compose logs -f postgres
```

### Acceder a la Base de Datos
```bash
docker-compose exec postgres psql -U postgres -d muebleria_db
```

### Backup de Base de Datos
```bash
docker-compose exec postgres pg_dump -U postgres -d muebleria_db > backup.sql
```

### Restaurar Backup
```bash
docker-compose exec -T postgres psql -U postgres -d muebleria_db < backup.sql
```

### Reiniciar Servicios
```bash
docker-compose restart
docker-compose restart app  # Solo la app
```

### Parar Todo
```bash
docker-compose down
docker-compose down -v  # También borra volúmenes
```

## 🌐 Configuración de Producción

### 1. Variables de Entorno Críticas
```env
DATABASE_URL="postgresql://usuario:password@postgres:5432/muebleria_db"
NEXTAUTH_URL="https://tu-dominio.com"
NEXTAUTH_SECRET="tu-secreto-super-seguro"
NODE_ENV=production
```

### 2. SSL/HTTPS
Para habilitar HTTPS, coloca los certificados en `./ssl/`:
- `cert.pem`
- `key.pem`

### 3. Escalabilidad
El archivo `docker-production.yml` incluye:
- 2 réplicas de la aplicación
- Balanceador de carga Nginx
- Límites de recursos
- Health checks

## 🔍 Monitoreo

### Health Checks
```bash
curl http://localhost:3000/api/health
```

### Métricas del Sistema
```bash
docker stats
docker-compose ps
```

## 📱 Características PWA

La aplicación es una PWA (Progressive Web App) que funciona offline:
- Se instala como app nativa
- Cache automático de datos
- Sincronización cuando hay conexión
- Optimizado para móviles

## 🛠️ Desarrollo

### Configuración de Desarrollo
```bash
# Modo desarrollo con hot reload
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

### Ejecutar Migraciones
```bash
docker-compose exec app npx prisma migrate deploy
```

### Seed de Datos
```bash
docker-compose exec app npx prisma db seed
```

## 🔧 Troubleshooting

### La app no inicia
1. Verificar logs: `docker-compose logs app`
2. Verificar base de datos: `docker-compose logs postgres`
3. Verificar variables de entorno en `.env`

### Error de conexión a BD
```bash
# Verificar que la BD esté corriendo
docker-compose ps postgres
# Recrear la BD
docker-compose down postgres
docker volume rm muebleria_la_economica_postgres_data
docker-compose up postgres -d
```

### Problemas de permisos
```bash
# En sistemas Linux/Mac
sudo chown -R $USER:$USER .
chmod +x *.sh
```

## 📞 Soporte

Para problemas técnicos:
1. Revisar logs
2. Verificar configuración
3. Recrear contenedores si es necesario

---

🎯 **¡El sistema está listo para usar!**
