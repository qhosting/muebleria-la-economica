# 🔧 Solución: Dockerfile - Error yarn.lock no encontrado

## 📋 Problema Identificado

Durante el build en Coolify, el Dockerfile fallaba con el siguiente error:

```
ERROR: failed to build: failed to solve: failed to compute cache key: 
failed to calculate checksum of ref: "/app/yarn.lock": not found
```

### Causa Raíz

El archivo `yarn.lock` en el proyecto es un **symlink** que apunta a:
```
/opt/hostedapp/node/root/app/yarn.lock
```

Este es un archivo del sistema interno de Abacus.AI para gestionar dependencias. Durante el build de Docker, especialmente en entornos externos como Coolify, **los symlinks no se pueden resolver** porque apuntan a rutas que no existen en el contexto de build.

## ✅ Solución Implementada

Cambiamos el Dockerfile para usar **npm** en lugar de **yarn**, ya que el proyecto tiene un `package-lock.json` real (no symlink).

### Cambios en el Dockerfile

#### Antes:
```dockerfile
FROM base AS deps
COPY app/package.json app/yarn.lock* ./
RUN --mount=type=cache,target=/app/.yarn-cache \
    yarn install --production=false

# ...

RUN echo "🔨 Building Next.js application..." && \
    yarn build && \
    echo "✅ Build completed successfully!"
```

#### Después:
```dockerfile
FROM base AS deps
COPY app/package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --legacy-peer-deps

# ...

RUN echo "🔨 Building Next.js application..." && \
    npm run build && \
    echo "✅ Build completed successfully!"
```

### Ventajas de esta Solución

1. ✅ **Compatible con cualquier entorno**: npm es más universal y no depende de configuraciones específicas
2. ✅ **package-lock.json es un archivo real**: No es un symlink, se puede copiar sin problemas
3. ✅ **npm ci es más rápido**: Instala exactamente lo que dice el lock file, sin resolver dependencias
4. ✅ **--legacy-peer-deps**: Maneja conflictos de dependencias de manera más flexible
5. ✅ **Cache eficiente**: Usa el cache de npm para acelerar builds

## 🚀 Próximos Pasos en Coolify

### 1. Verificar que Coolify detecte el commit

```bash
# En Coolify, ir a la aplicación
# Deployments → Ver que el último commit es el correcto
```

El commit debe mostrar:
```
fix: Use npm instead of yarn in Dockerfile to avoid symlink issues
```

### 2. Forzar un nuevo Deploy

En Coolify:
1. Click en **"Deploy"**
2. Coolify clonará el repo actualizado
3. El build ahora usará npm y encontrará package-lock.json

### 3. Monitorear el Build

Observar los logs del build en Coolify:

```
✅ Debe ver:
[deps] COPY app/package*.json ./
[deps] npm ci --legacy-peer-deps
[builder] npm run build
[builder] ✅ Build completed successfully!
```

❌ Ya NO debe ver:
```
ERROR: "/app/yarn.lock": not found
```

### 4. Verificar el Container

Una vez deployed:

```bash
# Ver logs del container
docker logs <container-id> -f

# Debe mostrar:
✨ Server running on http://0.0.0.0:3000
```

### 5. Probar la Aplicación

Visitar en el navegador:
```
https://app.mueblerialaeconomica.com
```

Debe cargar la aplicación sin errores de "no available server".

## 📝 Notas Técnicas

### ¿Por qué npm ci y no npm install?

- `npm ci`: Más rápido, usa exactamente las versiones del lock file, limpia node_modules antes
- `npm install`: Más lento, puede actualizar el lock file, conserva node_modules

Para producción, `npm ci` es siempre preferible.

### ¿Qué hace --legacy-peer-deps?

Algunas dependencias del proyecto tienen peer dependencies que no coinciden exactamente con las versiones instaladas. `--legacy-peer-deps` permite continuar la instalación sin errores, usando el comportamiento de npm 6.

## 🔍 Verificación del Cambio

```bash
# Verificar el Dockerfile actualizado
cd /home/ubuntu/muebleria_la_economica
cat Dockerfile | grep -A 3 "FROM base AS deps"
```

Debe mostrar:
```dockerfile
FROM base AS deps
COPY app/package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --legacy-peer-deps
```

## 📊 Estado del Deploy

- ✅ **Dockerfile actualizado**: Usa npm en lugar de yarn
- ✅ **Cambios pusheados a GitHub**: Commit `a3d6c4f`
- ⏳ **Siguiente paso**: Re-deploy en Coolify
- ⏳ **Verificación final**: Probar el sitio en producción

---

**Fecha**: 11 de Octubre, 2025  
**Commit**: `a3d6c4f`  
**Mensaje**: `fix: Use npm instead of yarn in Dockerfile to avoid symlink issues`
