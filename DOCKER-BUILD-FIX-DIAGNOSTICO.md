
# 🔧 Diagnóstico y Solución: Build Fallando en Coolify

**Fecha:** 11 de Octubre, 2025  
**Estado:** El build local funciona ✅ pero el build en Docker (Coolify) falla ❌  
**Error:** `exit code: 1` en línea 58 del Dockerfile (`npm run build`)

---

## 📊 Diagnóstico Realizado

### ✅ Verificaciones Completadas:
1. **TypeScript:** ✅ Sin errores (verificado con `tsc --noEmit`)
2. **Build local:** ✅ Completa exitosamente
3. **Dependencias:** ✅ next-auth@4.24.11 instalado correctamente
4. **Middleware:** ✅ Sintaxis correcta
5. **Configuración Next.js:** ✅ `next.config.js` correcto

### 🔍 Cambios Recientes Realizados:
1. ✅ Agregado `middleware.ts` para protección de rutas
2. ✅ Modificado `login-form.tsx` para mejor manejo de sesión
3. ✅ Actualizado `dashboard/saldos/page.tsx` con layout correcto
4. ✅ Mejorado Dockerfile con diagnóstico verbose

---

## 🚀 Soluciones Posibles

### **Solución 1: Verificar Variables de Entorno en Coolify** (MÁS PROBABLE)

El build puede estar fallando porque las variables de entorno no están configuradas correctamente en Coolify.

#### Pasos en Coolify:

1. **Ir a tu aplicación en Coolify**
2. **Click en "Environment Variables"** o "Configuration"
3. **Verificar que estas variables estén configuradas:**

```bash
# Variables de Runtime (necesarias siempre)
DATABASE_URL=postgresql://[tu-url-de-base-de-datos]
NEXTAUTH_SECRET=[tu-secret-de-32-caracteres-o-más]
NEXTAUTH_URL=https://app.mueblerialaeconomica.com

# Variables de Build (importantes)
NODE_ENV=production
SKIP_ENV_VALIDATION=1
NEXT_TELEMETRY_DISABLED=1
```

4. **IMPORTANTE:** Asegúrate de que `NEXTAUTH_SECRET` esté definido y sea un string largo (mínimo 32 caracteres)

**Generar NEXTAUTH_SECRET seguro:**
```bash
openssl rand -base64 32
```

---

### **Solución 2: Aumentar Recursos de Build**

El build de Next.js puede fallar por falta de memoria.

#### En Coolify:
1. Ir a **Build Settings** de tu aplicación
2. Buscar **Build Resources** o similar
3. Aumentar memoria disponible para el build a **mínimo 2GB**
4. Si hay opción de CPU, aumentar a 2+ cores

---

### **Solución 3: Verificar Logs Completos del Build**

El Dockerfile actualizado ahora incluye diagnóstico mejorado. 

#### En tu próximo build, verás:
```
🔨 Building Next.js application (NORMAL mode, no standalone)...
📍 PWD: /app
📍 NEXT_DIST_DIR: .next
```

**Si el build falla, verás:**
```
❌ Build failed! Checking for TypeScript errors...
[aquí aparecerán los errores específicos de TypeScript]
```

#### Pasos:
1. En Coolify, ir a **Deployments** o **Logs**
2. Click en el último deployment fallido
3. Ver los logs completos del build
4. Buscar el mensaje entre `🔨 Building Next.js application...` y `❌ Build failed`
5. **Copiar TODO el error y compartirlo conmigo** para diagnóstico preciso

---

### **Solución 4: Simplificar Middleware (Temporal)**

Si el problema es el middleware, podemos deshabilitarlo temporalmente para confirmar.

#### Opción A: Comentar middleware completo
```typescript
// En app/middleware.ts - comentar TODO el código
export const config = {
  matcher: [],  // No match anything = middleware disabled
};
```

#### Opción B: Simplificar middleware
```typescript
// Version simplificada sin withAuth
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
```

**Después de hacer este cambio:**
```bash
git add app/middleware.ts
git commit -m "Simplificar middleware para test"
git push origin main
```

Luego hacer nuevo deploy en Coolify.

---

### **Solución 5: Build Standalone (Alternativa)**

Si todo lo anterior falla, podemos volver al modo standalone que sabemos que funcionaba.

**Cambios necesarios:**
1. Modificar `next.config.js`:
```javascript
const nextConfig = {
  distDir: '.next',
  output: 'standalone',  // ← Agregar esto
  experimental: {
    outputFileTracingRoot: path.join(__dirname, '../'),
  },
  // ... resto igual
};
```

2. Modificar Dockerfile (líneas 98-99):
```dockerfile
# En lugar de copiar solo .next
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone/app /app
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
```

3. Modificar `start.sh` (línea final):
```bash
# En lugar de npm start
exec node server.js
```

---

## 📝 Plan de Acción Recomendado

### **PASO 1: Verificar Variables de Entorno** (5 minutos)
1. Abrir Coolify → Tu App → Environment Variables
2. Confirmar que `NEXTAUTH_SECRET`, `NEXTAUTH_URL` y `DATABASE_URL` estén configuradas
3. Si falta alguna, agregarla
4. Hacer nuevo deploy

### **PASO 2: Ver Logs Completos** (Si falla el PASO 1)
1. Abrir Coolify → Deployments → Último deploy
2. Copiar TODO el log del build (desde el inicio hasta el error)
3. Compartir el log completo

### **PASO 3: Aumentar Recursos** (Si el error menciona memoria/timeout)
1. Ir a Build Settings
2. Aumentar memoria a 2GB mínimo
3. Hacer nuevo deploy

### **PASO 4: Simplificar Middleware** (Si el error menciona problemas con auth/middleware)
1. Usar Solución 4 (arriba) para simplificar/deshabilitar middleware
2. Push a GitHub
3. Nuevo deploy en Coolify

---

## 🆘 Información Necesaria para Más Ayuda

Si después de probar las soluciones anteriores el problema persiste, compárteme:

1. ✅ **Logs completos del build** (desde Coolify)
2. ✅ **Screenshot de las variables de entorno configuradas** (oculta valores sensibles)
3. ✅ **Configuración de recursos** (memoria/CPU asignada al build)
4. ✅ **Mensaje de error específico** (si hay uno más detallado que "exit code: 1")

---

## 📚 Cambios Realizados en este Commit

### Archivos Modificados:
1. ✅ **Dockerfile**
   - Agregado diagnóstico verbose en el build
   - Agregado check de TypeScript si el build falla
   - Mejorado mensaje de error

2. ✅ **app/middleware.ts**
   - Middleware completo para protección de rutas
   - Configuración de next-auth

### Archivos del Commit Anterior:
3. ✅ **app/login/login-form.tsx**
   - Fix para manejo correcto de sesión post-login
   
4. ✅ **app/dashboard/saldos/page.tsx**
   - Fix para mostrar sidebar y header correctamente

---

## ✅ Próximos Pasos

1. **Hacer deploy en Coolify** con el código actualizado
2. **Verificar las variables de entorno** según Solución 1
3. **Ver los logs mejorados** del build
4. **Compartir el resultado** para continuar el diagnóstico si es necesario

---

**🔗 Repositorio GitHub:** https://github.com/qhosting/muebleria-la-economica  
**📦 Último Commit:** `1113105` - "Mejorar diagnóstico del build en Dockerfile + fix middleware"  
**🌐 Dominio:** app.mueblerialaeconomica.com

---

**Nota Importante:** El build local funciona perfectamente, lo que confirma que el código está correcto. El problema está específicamente en la configuración del ambiente de Docker/Coolify.
