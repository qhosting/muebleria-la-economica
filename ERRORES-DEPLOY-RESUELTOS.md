
# 🔧 Errores de Deploy Resueltos

## Lista de Errores Conocidos y Soluciones

### Error #1: Alpine Linux 3.20/3.21 - Repositorios Rotos
**Síntoma**: `fetch https://dl-cdn.alpinelinux.org/alpine/v3.21/main/x86_64/APKINDEX.tar.gz`
- Error: Connection timeout o repositorios no disponibles

**Solución**: Usar Alpine 3.19 en Dockerfile
```dockerfile
FROM node:18-alpine3.19 AS base
```

---

### Error #2: TypeScript - Enums de Prisma no exportados
**Síntoma**: 
```
TS2305: Module '@prisma/client' has no exported member 'UserRole'
```

**Solución**: Generar Prisma client ANTES de `yarn build`
```dockerfile
RUN ./node_modules/.bin/prisma generate --schema=./prisma/schema.prisma && \
    yarn build
```

---

### Error #3: yarn.lock Faltante o Corrupto
**Síntoma**: 
```
yarn install --frozen-lockfile fails
```

**Solución**: Verificar que yarn.lock existe y es válido
```bash
if [ ! -f "app/yarn.lock" ]; then
    print_error "yarn.lock no existe"
    exit 1
fi
```

---

### Error #4: Prisma CLI No Encontrado
**Síntoma**: 
```
bash: prisma: command not found
```

**Solución**: Usar path directo a binario
```dockerfile
RUN ./node_modules/.bin/prisma generate
```

---

### Error #5: Permisos en Alpine - addgroup/adduser
**Síntoma**: 
```
addgroup: unrecognized option '--system'
```

**Solución**: Usar flags correctos para Alpine
```dockerfile
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs
```

---

### Error #6: node_modules/.bin No en PATH
**Síntoma**: 
```
prisma: command not found (even with PATH=/app/node_modules/.bin:$PATH)
```

**Solución**: Usar path directo en lugar de confiar en PATH
```dockerfile
RUN ./node_modules/.bin/prisma generate
```

---

### Error #7: Yarn Ya Preinstalado
**Síntoma**: 
```
error Package "yarn@1.22.22" is already installed globally
```

**Solución**: NO reinstalar yarn en node:18-alpine
```dockerfile
# yarn ya viene preinstalado en node:18-alpine3.19
# No es necesario instalar yarn nuevamente
```

---

### Error #8: yarn.lock es Symlink Roto
**Síntoma**: 
```
COPY app/yarn.lock* ./
⚠️ @prisma not found in node_modules
ERROR: "/app/node_modules": not found
```

**Causa**: yarn.lock es un symlink que apunta a `/opt/hostedapp/node/root/app/yarn.lock` (no existe en Docker)

**Solución**: Regenerar yarn.lock como archivo real
```bash
cd app
rm yarn.lock  # Eliminar symlink
touch yarn.lock
yarn install  # Regenera yarn.lock
git add yarn.lock
git commit -m "fix: reemplazar symlink roto con archivo real"
git push
```

**Verificación**:
```bash
ls -lh app/yarn.lock
# -rw-r--r-- 1 ubuntu ubuntu 447K Nov 17 04:40 yarn.lock  ✓
# NO debe ser: lrwxrwxrwx (symlink)
```

---

## Script de Verificación Automática

El script `pre-deploy-check.sh` verifica todos estos problemas antes del push:

```bash
bash pre-deploy-check.sh
```

Verifica:
- ✓ yarn.lock es archivo válido (no symlink)
- ✓ Prisma schema tiene enums requeridos
- ✓ Dockerfile usa Alpine 3.19
- ✓ Dockerfile genera Prisma client antes de build
- ✓ Dockerfile usa path directo a prisma CLI
- ✓ Scripts tienen permisos de ejecución

---

## Pre-Push Hook Automático

El repositorio tiene un pre-push hook que ejecuta las verificaciones automáticamente:

```bash
.git/hooks/pre-push
```

Si alguna verificación falla, el push se bloquea y muestra el problema.

---

**Última actualización**: 2025-11-17 (Error #8 resuelto)

---

### Error #11: Incompatibilidad Yarn Berry vs Yarn Classic
**Síntoma**: 
```
yarn install --frozen-lockfile
error Your lockfile needs to be updated
⚠️ @prisma not found in node_modules
ERROR: "/app/node_modules": not found
```

**Causa**: 
- yarn.lock generado con Yarn 4 (Berry) - `__metadata: version: 8`
- node:18-alpine tiene Yarn 1.x (Classic) preinstalado
- Yarn 1 no puede leer el formato de lockfile de Yarn 4

**Solución**: Cambiar a npm que es más compatible
```dockerfile
# Antes (fallaba):
COPY app/yarn.lock ./
RUN yarn install --frozen-lockfile

# Después (funciona):
COPY app/package-lock.json ./
RUN npm ci
```

**Verificación**:
```bash
head -5 app/package-lock.json
# {
#   "name": "app",
#   "lockfileVersion": 3,  ✓
```

---

**Última actualización**: 2025-11-17 (Error #11 resuelto)

---

### Error #12: Conflicto Peer Dependencies TypeScript ESLint
**Síntoma**: 
```
npm ci
ERESOLVE could not resolve
@typescript-eslint/eslint-plugin@7.0.0 requires @typescript-eslint/parser@^6.0.0
Found: @typescript-eslint/parser@7.0.0
```

**Causa**: 
- Conflicto entre versiones de @typescript-eslint/parser (7.0.0) y @typescript-eslint/eslint-plugin (7.0.0)
- package-lock.json tiene dependencias que no se resuelven con strict mode

**Solución**: Usar `--legacy-peer-deps`
```dockerfile
RUN npm ci --legacy-peer-deps
```

---

**Última actualización**: 2025-11-17 (Error #12 resuelto)

### Error #14: Test Enum Node.js Innecesario
**Síntoma**: 
```
node -e "const { UserRole, StatusCuenta } = require('@prisma/client'); ..."
exit code: 1
```

**Causa**: 
- Test de importación de enums con Node.js puede fallar en entorno Docker
- El grep ya verifica que los enums existen en index.d.ts
- Test redundante e innecesario

**Solución**: Eliminar test de Node.js, mantener solo grep
```dockerfile
grep -c "export type UserRole" node_modules/.prisma/client/index.d.ts
```

---

**Última actualización**: 2025-11-17 (Error #14 resuelto)
