
# 🔍 Pre-Deploy Checklist

Script automatizado que verifica y corrige problemas comunes antes de hacer deploy a Coolify.

## Uso

```bash
bash pre-deploy-check.sh
```

## Verificaciones que Realiza

### 1. ✓ yarn.lock
- Detecta si es un symlink (causa errores en Docker)
- Lo convierte automáticamente a archivo real
- Regenera con `yarn install` si es necesario

### 2. ✓ Prisma Schema
- Verifica que exista `prisma/schema.prisma`
- Valida los 5 enums requeridos:
  - UserRole
  - StatusCuenta
  - Periodicidad
  - TipoPago
  - MotivoMotarario

### 3. ✓ Dockerfile
- Verifica que use `yarn` (si existe yarn.lock)
- Confirma que ejecute `prisma generate`
- Valida estructura correcta

### 4. ✓ Archivos Esenciales
- `app/package.json`
- `app/next.config.js`
- `app/tsconfig.json`
- `start.sh`

### 5. ✓ Variables de Entorno
- DATABASE_URL
- NEXTAUTH_URL
- NEXTAUTH_SECRET

### 6. ✓ Permisos de Scripts
Corrige automáticamente permisos de:
- `start.sh`
- `seed-admin.sh`
- `backup-manual.sh`
- `restore-backup.sh`

## Exit Codes

- **0**: Todo OK, listo para deploy
- **1**: Se encontraron problemas, revisar output

## Workflow Recomendado

```bash
# 1. Ejecutar pre-deploy check
bash pre-deploy-check.sh

# 2. Si todo OK, hacer commit y push
git add -A
git commit -m "Ready for deploy"
git push origin main

# 3. Deploy en Coolify
# Ve al panel de Coolify y haz clic en "Deploy"
```

## Problemas Comunes que Resuelve

### ❌ yarn.lock symlink roto
```
ERROR: "/app/yarn.lock": not found
```
**Solución**: Script detecta y convierte a archivo real

### ❌ Prisma Client sin generar
```
Module '"@prisma/client"' has no exported member 'UserRole'
```
**Solución**: Verifica que Dockerfile ejecute `prisma generate`

### ❌ Scripts sin permisos
```
/bin/sh: ./start.sh: Permission denied
```
**Solución**: Script corrige permisos automáticamente

## Integración con CI/CD

Puedes agregar este script como paso de pre-deploy en tu pipeline:

```yaml
# .github/workflows/deploy.yml
- name: Pre-deploy check
  run: bash pre-deploy-check.sh
```

## Output Ejemplo

```
🔍 PRE-DEPLOY CHECK
===================

ℹ 1. Verificando yarn.lock...
✓ yarn.lock es un archivo válido (448K)

ℹ 2. Verificando Prisma schema...
✓ Prisma schema válido (5/5 enums encontrados)

ℹ 3. Verificando Dockerfile...
✓ Dockerfile usa yarn (correcto para yarn.lock)
✓ Dockerfile genera Prisma client

ℹ 4. Verificando archivos esenciales...
✓   app/package.json ✓
✓   app/next.config.js ✓
✓   app/tsconfig.json ✓
✓   start.sh ✓

ℹ 5. Verificando .env (opcional)...
✓   DATABASE_URL definido
✓   NEXTAUTH_URL definido
✓   NEXTAUTH_SECRET definido

ℹ 6. Verificando permisos de scripts...
✓   start.sh tiene permisos de ejecución

==========================================
✓ 🎉 ¡TODO LISTO PARA DEPLOY!
```

## Notas

- El script es **idempotente**: puedes ejecutarlo múltiples veces sin problemas
- **Auto-corrige** problemas cuando es posible
- **No requiere** argumentos ni configuración
- **Compatible** con cualquier entorno Linux/Unix

---

**Última actualización**: 2025-11-17
**Versión**: 1.0.0
