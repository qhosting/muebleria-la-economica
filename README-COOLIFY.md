
# Despliegue en Coolify v4.0.0 - MUEBLERIA LA ECONOMICA

## Requisitos Previos

1. **Servidor con Coolify v4.0.0 instalado**
2. **Repositorio Git** (GitHub, GitLab, etc.)
3. **Base de datos PostgreSQL** (puede ser externa o en el mismo servidor)

## Paso 1: Preparar el Repositorio

1. Subir el código a un repositorio Git:
```bash
cd /home/ubuntu/muebleria_la_economica
git init
git add .
git commit -m "Initial commit - MUEBLERIA LA ECONOMICA"
git remote add origin https://github.com/tu-usuario/muebleria-la-economica.git
git push -u origin main
```

## Paso 2: Configurar en Coolify

### 2.1 Crear Nuevo Proyecto
1. Accede a tu panel de Coolify
2. Click en **"+ New"** > **"Application"**
3. Selecciona **"Public Repository"** o **"Private Repository"**
4. Ingresa la URL del repositorio: `https://github.com/tu-usuario/muebleria-la-economica.git`
5. Branch: `main`
6. Build Pack: Selecciona **"Docker"**

### 2.2 Configurar Variables de Entorno
En la sección **Environment Variables**, agrega:

```
DATABASE_URL=postgresql://usuario:password@host:5432/database
NEXTAUTH_URL=https://tu-dominio.coolify.app
NEXTAUTH_SECRET=genera-un-secreto-muy-seguro-aqui
NODE_ENV=production
```

**Importante**: 
- Para `NEXTAUTH_SECRET`, genera uno seguro con: `openssl rand -base64 32`
- `NEXTAUTH_URL` debe coincidir exactamente con tu dominio de Coolify

### 2.3 Configurar Base de Datos (Opción A - PostgreSQL en Coolify)
1. En el mismo proyecto, click **"+ Add Resource"** > **"Database"** > **"PostgreSQL"**
2. Coolify generará automáticamente las credenciales
3. Usa la URL de conexión generada en `DATABASE_URL`

### 2.4 Configurar Base de Datos (Opción B - PostgreSQL Externa)
Si usas una base externa (como la actual):
```
DATABASE_URL=postgresql://role_7dbff157a:aRQiheGruVqcMNKA2fcu6h3czwuC2Mk9@db-7dbff157a.db002.hosteddb.reai.io:5432/7dbff157a?connect_timeout=15
```

## Paso 3: Configurar Dockerfile

El `Dockerfile` ya está creado en la raíz del proyecto. Asegúrate de que:

1. **Build Context**: Raíz del proyecto (`/home/ubuntu/muebleria_la_economica`)
2. **Dockerfile Path**: `./Dockerfile`

## Paso 4: Scripts de Despliegue

### 4.1 Comandos de Build (En Coolify)
En la configuración del proyecto, en **"Build"**:

- **Build Command**: `docker build -t muebleria-app .`
- **Start Command**: `node server.js`

### 4.2 Scripts Post-Deploy
Para ejecutar migraciones automáticamente, en **"Lifecycle Hooks"**:

**Post-Deploy Command**:
```bash
npx prisma migrate deploy && npx prisma generate
```

## Paso 5: Configurar Dominio

1. En la configuración del proyecto, ve a **"Domains"**
2. Agrega tu dominio personalizado o usa el subdominio de Coolify
3. Coolify configurará automáticamente SSL con Let's Encrypt

## Paso 6: Desplegar

1. Click **"Deploy"** en Coolify
2. Monitorea los logs de construcción
3. Una vez completado, tu aplicación estará disponible

## Estructura de Archivos para Coolify

```
muebleria_la_economica/
├── Dockerfile              # Configuración Docker
├── docker-compose.yml      # Para desarrollo local
├── .coolify/
│   └── docker-compose.yml  # Configuración específica Coolify
├── .env.example            # Variables de ejemplo
├── app/                    # Código de la aplicación Next.js
│   ├── package.json
│   ├── next.config.js
│   ├── prisma/
│   │   └── schema.prisma
│   └── start.sh           # Script de inicialización
└── README-COOLIFY.md      # Esta guía
```

## Comandos Útiles

### Generar NEXTAUTH_SECRET
```bash
openssl rand -base64 32
```

### Verificar logs en producción
En Coolify, ve a **"Logs"** para monitorear la aplicación.

### Ejecutar migraciones manualmente
```bash
# Conectarse al contenedor
docker exec -it <container_id> npx prisma migrate deploy
```

## Solución de Problemas

### Error de conexión a base de datos
- Verifica que `DATABASE_URL` sea correcta
- Asegúrate que el servidor de BD permite conexiones externas

### Error de NEXTAUTH_SECRET
- Genera un nuevo secreto seguro
- Reinicia la aplicación después de cambiar

### Error de construcción
- Revisa los logs de build en Coolify
- Verifica que todas las dependencias estén en `package.json`

### Error de Prisma
- Asegúrate que las migraciones se ejecuten correctamente
- Verifica que el schema de Prisma coincida con la BD

## Notas de Seguridad

1. **Nunca** commits archivos `.env` con credenciales reales
2. Usa variables de entorno seguras en producción
3. Configura firewall para la base de datos
4. Usa HTTPS siempre en producción (Coolify lo hace automáticamente)

## Usuarios de Producción

La aplicación viene con usuarios predefinidos:
- **Admin**: email configurado en setup inicial
- **Gestor**: role_gestor@economica.com
- **Cobrador**: role_cobrador@economica.com  
- **Reportes**: role_reportes@economica.com

**Cambiar contraseñas** en el primer acceso por seguridad.
