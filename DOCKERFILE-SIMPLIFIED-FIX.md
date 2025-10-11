# 🔧 Solución Definitiva: Dockerfile Simplificado

## 📋 Problema Original

El Dockerfile estaba fallando en Coolify con dos problemas principales:

1. **yarn.lock era un symlink**: Docker no podía resolverlo en el contexto de build
2. **Build fallaba con exit code 1**: El proceso de build no completaba exitosamente

### Errores Observados

```bash
# Error 1: yarn.lock no encontrado
ERROR: "/app/yarn.lock": not found

# Error 2: Build fallaba
ERROR: process "/bin/sh -c ... npm run build ..." did not complete successfully: exit code: 1
```

## ✅ Solución Implementada

### 1. **Dockerfile Simplificado y Robusto**

He creado un Dockerfile que:
- ✅ **Usa npm exclusivamente** (no depende de yarn.lock)
- ✅ **Copia archivos explícitamente** (más control y claridad)
- ✅ **No usa output: standalone** (evita problemas de outputFileTracingRoot)
- ✅ **Acepta variables de entorno como ARGs** (flexibilidad en build-time)
- ✅ **Genera Prisma client antes del build** (prerequisito esencial)

### Estructura del Dockerfile

```dockerfile
# 1. Stage: deps - Instalar dependencias
FROM node:18-alpine AS deps
COPY app/package*.json ./
RUN npm ci --legacy-peer-deps --no-audit --no-fund

# 2. Stage: builder - Build de la aplicación
FROM node:18-alpine AS builder
# Copiar node_modules
COPY --from=deps /app/node_modules ./node_modules
# Copiar código fuente explícitamente
COPY app/package*.json ./
COPY app/next.config.js ./
COPY app/app ./app
COPY app/components ./components
# ... (todos los archivos necesarios)

# Generar Prisma client
RUN npx prisma generate
# Build Next.js
RUN npm run build

# 3. Stage: runner - Imagen final de producción
FROM node:18-alpine AS runner
# Copiar solo lo necesario para runtime
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
# ... (scripts y configuración)
```

### 2. **start.sh Actualizado**

Cambios principales:
- ✅ **Usa npm start** en lugar de yarn start
- ✅ **db push sin --force-reset** (no borra datos)
- ✅ **--skip-generate** en db push (Prisma ya está generado)

```bash
# Antes (peligroso - borraba datos):
$PRISMA_CMD db push --force-reset --accept-data-loss

# Después (seguro - preserva datos):
$PRISMA_CMD db push --skip-generate
```

## 🚀 Ventajas de esta Solución

### 1. **Compatibilidad Universal**
- ✅ Funciona en cualquier entorno Docker (Coolify, Docker Compose, Kubernetes)
- ✅ No depende de symlinks o configuraciones específicas de Abacus.AI

### 2. **Más Robusto**
- ✅ Copia explícita de archivos (no hay sorpresas)
- ✅ No depende de output: standalone (evita problemas de outputFileTracingRoot)
- ✅ Manejo explícito de Prisma client generation

### 3. **Más Seguro**
- ✅ No borra datos de la base de datos durante el startup
- ✅ db push en lugar de migrate (mejor para producción con datos)

### 4. **Mejor Debugging**
- ✅ Logs claros en cada etapa
- ✅ Errores más descriptivos
- ✅ Más fácil identificar dónde falla

## 📊 Variables de Entorno Requeridas en Coolify

Para que el build funcione correctamente, configura estas variables en Coolify:

### Build-time (ARGs)
```bash
# Estas se pueden configurar en Coolify → Build Args
DATABASE_URL=postgresql://user:pass@host:5432/dbname
NEXTAUTH_URL=https://app.mueblerialaeconomica.com
NEXTAUTH_SECRET=tu-secret-seguro-aqui
```

### Runtime (ENV)
```bash
# Estas se configuran en Coolify → Environment Variables
DATABASE_URL=postgresql://user:pass@host:5432/dbname
NEXTAUTH_URL=https://app.mueblerialaeconomica.com
NEXTAUTH_SECRET=tu-secret-seguro-aqui
PORT=3000
NODE_ENV=production
```

## 🔍 Checklist de Verificación en Coolify

### 1. Verificar el Commit
```bash
# En Coolify → Deployments
# Debe mostrar:
Commit: 357092f
Message: "fix: Simplify Dockerfile and use npm instead of yarn"
```

### 2. Configurar Variables de Entorno

En Coolify → Settings → Environment Variables:

```env
DATABASE_URL=postgresql://tu-usuario:tu-password@tu-host:5432/tu-database
NEXTAUTH_URL=https://app.mueblerialaeconomica.com
NEXTAUTH_SECRET=genera-un-secret-seguro-con-openssl-rand-base64-32
```

### 3. Iniciar el Deploy

1. Click en **"Deploy"**
2. Monitorear los logs del build

### 4. Logs Esperados en el Build

Deberías ver:

```
✅ Esperado:
[deps] Copying package*.json
[deps] npm ci --legacy-peer-deps --no-audit --no-fund
[deps] added XXX packages

[builder] Copying files...
[builder] 📦 Generating Prisma client...
[builder] ✅ Prisma client generated
[builder] 🔨 Building Next.js application...
[builder] ✓ Compiled successfully
[builder] ✅ Build completed successfully!

[runner] Copying built files...
```

❌ **NO deberías ver**:
```
ERROR: "/app/yarn.lock": not found
ERROR: exit code: 1 during build
```

### 5. Verificar el Container Running

Una vez deployed:

```bash
# En Coolify → Logs (Container)
# Debe mostrar:
🚀 Iniciando MUEBLERIA LA ECONOMICA...
📦 Generating Prisma client...
✅ Prisma client generated
🔄 Sincronizando esquema de base de datos...
🚀 EJECUTANDO: npm start (next start)
▲ Next.js 14.2.28
- Local: http://0.0.0.0:3000
✔ Ready in XXXms
```

### 6. Probar la Aplicación

Visitar: `https://app.mueblerialaeconomica.com`

Debe cargar sin errores de Traefik.

## 🛠️ Troubleshooting

### Si el build sigue fallando:

1. **Verificar logs completos en Coolify**
   - Click en el deployment → View logs
   - Buscar el error específico

2. **Verificar variables de entorno**
   - DATABASE_URL debe apuntar a una base de datos accesible
   - NEXTAUTH_SECRET debe estar configurado

3. **Verificar que GitHub tiene el último código**
   ```bash
   # Verificar el commit más reciente
   git log -1 --oneline
   # Debe mostrar: 357092f fix: Simplify Dockerfile and use npm instead of yarn
   ```

### Si el container se reinicia constantemente:

1. **Ver logs del container**
   ```bash
   docker logs <container-id> -f
   ```

2. **Verificar conexión a la base de datos**
   - El DATABASE_URL debe ser correcto
   - La base de datos debe ser accesible desde el container

3. **Verificar que Prisma puede conectarse**
   ```bash
   # Dentro del container
   npx prisma db push --skip-generate
   ```

## 📝 Archivos Modificados

- ✅ **Dockerfile**: Simplificado, usa npm, copia explícita
- ✅ **start.sh**: Usa npm start, db push seguro sin --force-reset

## 🎯 Próximos Pasos

1. ✅ Cambios pusheados a GitHub (commit `357092f`)
2. ⏳ Configurar variables de entorno en Coolify
3. ⏳ Iniciar el deploy en Coolify
4. ⏳ Verificar que el sitio carga correctamente

---

**Fecha**: 11 de Octubre, 2025  
**Commit**: `357092f`  
**Mensaje**: `fix: Simplify Dockerfile and use npm instead of yarn`  
**Estado**: ✅ Listo para deploy en Coolify
