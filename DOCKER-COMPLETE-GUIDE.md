
# 🚀 MUEBLERIA LA ECONOMICA - Guía Completa Docker

## 📋 Resumen del Sistema

**MUEBLERIA LA ECONOMICA** es un sistema completo de gestión y cobranza diseñado para mueblería que incluye:

- 👨‍💼 **Módulo Administrativo Web**: Dashboard completo con gestión de clientes, cobradores y reportes
- 📱 **PWA Móvil para Cobradores**: Aplicación offline-first para cobradores en campo
- 🗄️ **Base de Datos PostgreSQL**: Almacenamiento robusto y escalable
- 🔐 **Autenticación por Roles**: Admin, Gestor, Cobrador, Reportes
- 📊 **Sistema de Reportes**: Estadísticas y análisis completos

## 🐳 Despliegue con Docker

### 🎯 Opciones de Despliegue

#### Opción 1: 🚀 Despliegue Rápido (Recomendado)
```bash
# Paso 1: Instalar Docker (si no está instalado)
chmod +x install-docker.sh
./install-docker.sh

# Paso 2: Reiniciar terminal o ejecutar
newgrp docker

# Paso 3: Desplegar aplicación
chmod +x quick-deploy.sh
./quick-deploy.sh
```

#### Opción 2: 🔧 Despliegue Manual Completo
```bash
# Con base de datos PostgreSQL interna
docker-compose up --build -d

# Solo la aplicación (usando BD externa)
docker-compose -f docker-compose.external-db.yml up --build -d
```

#### Opción 3: 🏭 Despliegue de Producción
```bash
# Con Nginx, balanceador de carga y optimizaciones
docker-compose -f docker-production.yml up --build -d
```

### 📊 Servicios Incluidos

| **Componente** | **Puerto** | **Descripción** |
|----------------|------------|-----------------|
| 🌐 **Aplicación Web** | 3000 | Next.js con PWA |
| 🗄️ **PostgreSQL** | 5432 | Base de datos |
| ⚡ **Nginx** | 80/443 | Proxy reverso (producción) |

### 👥 Usuarios del Sistema

| **Email** | **Contraseña** | **Rol** | **Permisos** |
|-----------|----------------|---------|-------------|
| admin@muebleria.com | password123 | **Administrador** | Acceso total |
| gestor@muebleria.com | password123 | **Gestor Cobranza** | Gestión de cobradores y clientes |
| cobrador@muebleria.com | password123 | **Cobrador** | App móvil, registrar pagos |
| reportes@muebleria.com | password123 | **Reportes** | Solo lectura y estadísticas |

## 🔧 Configuración Avanzada

### Variables de Entorno Críticas

```env
# Base de datos (automática con Docker)
DATABASE_URL="postgresql://postgres:muebleria2024@postgres:5432/muebleria_db"

# Autenticación
NEXTAUTH_URL="http://localhost:3000"  # Cambiar en producción
NEXTAUTH_SECRET="muebleria-secret-key-2024-super-secure"

# Configuración
NODE_ENV=production
```

### Para Producción
1. **Cambiar NEXTAUTH_URL** a tu dominio real
2. **Cambiar NEXTAUTH_SECRET** a un valor único y seguro
3. **Configurar SSL/HTTPS** (certificados en `./ssl/`)
4. **Configurar backup automático de BD**

## 📱 Características PWA

- ✅ **Instalable**: Se instala como app nativa en móviles
- 🔄 **Offline-first**: Funciona sin conexión a internet
- 🔁 **Sincronización automática**: Cuando hay conexión
- 📊 **Cache inteligente**: Datos importantes siempre disponibles
- 🎯 **Optimizado móvil**: Interface táctil intuitiva

## 🛠️ Comandos Útiles

### Monitoreo
```bash
# Ver estado de contenedores
docker-compose ps

# Ver logs de la aplicación
docker-compose logs -f app

# Ver logs de la base de datos
docker-compose logs -f postgres

# Estadísticas de uso
docker stats
```

### Mantenimiento
```bash
# Reiniciar servicios
docker-compose restart

# Parar todo
docker-compose down

# Parar y eliminar volúmenes (¡CUIDADO! Borra la BD)
docker-compose down -v

# Backup de base de datos
docker-compose exec postgres pg_dump -U postgres -d muebleria_db > backup_$(date +%Y%m%d).sql

# Restaurar backup
docker-compose exec -T postgres psql -U postgres -d muebleria_db < backup.sql
```

### Desarrollo
```bash
# Ver logs en tiempo real
docker-compose logs -f

# Acceder al contenedor de la app
docker-compose exec app bash

# Ejecutar migraciones Prisma
docker-compose exec app npx prisma migrate deploy

# Ejecutar seed de datos
docker-compose exec app npx prisma db seed
```

## 🔍 Verificación del Sistema

### 1. Health Check
```bash
curl http://localhost:3000/api/health
```

### 2. Test de Login
1. Abrir `http://localhost:3000`
2. Usar credenciales: admin@muebleria.com / password123
3. Verificar acceso al dashboard

### 3. Test PWA (móvil)
1. Abrir la app en un dispositivo móvil
2. Verificar funcionalidad offline
3. Probar instalación como app nativa

## 🚀 Proceso de Despliegue Completo

### Para Desarrollo Local
1. Ejecutar `./quick-deploy.sh`
2. Seleccionar opción 1 (BD interna)
3. Acceder a `http://localhost:3000`

### Para Servidor de Producción
1. Clonar repositorio en servidor
2. Configurar variables de entorno para producción
3. Ejecutar `docker-compose -f docker-production.yml up -d`
4. Configurar dominio y SSL
5. Configurar backup automático

## 📞 Soporte y Troubleshooting

### Problemas Comunes

**La aplicación no inicia:**
```bash
# Ver logs detallados
docker-compose logs app

# Verificar variables de entorno
docker-compose config
```

**Error de conexión a BD:**
```bash
# Verificar estado de PostgreSQL
docker-compose logs postgres

# Reiniciar solo la BD
docker-compose restart postgres
```

**Problemas de permisos:**
```bash
# Corregir permisos en Linux/Mac
sudo chown -R $USER:$USER .
chmod +x *.sh
```

## 🎯 Características del Sistema

### 📊 Dashboard Administrativo
- Gestión completa de clientes
- Asignación de cobradores
- Reportes y estadísticas
- Control de usuarios y roles

### 📱 App Móvil PWA
- Interfaz optimizada para móviles
- Geolocalización de clientes
- Registro de pagos offline
- Sincronización automática
- Generación de tickets

### 🔐 Seguridad
- Autenticación con NextAuth
- Roles y permisos granulares
- Cifrado de contraseñas
- Sesiones seguras

### 📈 Reportes
- Cobranza por periodo
- Rendimiento por cobrador
- Clientes morosos
- Estadísticas financieras

---

## 🎉 ¡Sistema Completamente Dockerizado!

La aplicación **MUEBLERIA LA ECONOMICA** está lista para desplegarse con Docker en cualquier entorno:

- ✅ **Desarrollo**: Rápido y sencillo con `./quick-deploy.sh`
- ✅ **Producción**: Escalable con `docker-production.yml`
- ✅ **Multi-entorno**: Configuraciones flexibles
- ✅ **Mantenimiento**: Scripts automatizados incluidos

**¡Ejecuta `./quick-deploy.sh` y en minutos tendrás el sistema completo funcionando!** 🚀
