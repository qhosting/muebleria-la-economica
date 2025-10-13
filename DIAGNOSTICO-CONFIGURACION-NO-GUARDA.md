
# 🔍 DIAGNÓSTICO: Configuración No Se Guarda

## 🎯 Estado Actual

He implementado mejoras significativas de debugging para identificar exactamente por qué no se puede guardar la configuración.

## ✅ Verificaciones Realizadas

1. **✓ Tabla en Base de Datos**: La tabla `configuracion_sistema` existe correctamente
2. **✓ Endpoint API**: El endpoint `/api/configuracion` está funcionando
3. **✓ Usuarios Admin**: Existen usuarios con rol `admin` en la base de datos:
   - `cristal@muebleria.com`
   - `admin@economica.local`
4. **✓ Prisma Client**: Generado correctamente

## 🛠️ Mejoras Implementadas

### 1. Endpoint de Diagnóstico
He creado `/api/test-config` que te mostrará:
- Si hay sesión activa
- Datos del usuario actual
- Rol del usuario
- Estado de cookies

**Cómo usarlo:**
1. Inicia sesión como admin en la aplicación
2. Abre la consola del navegador (F12)
3. Ejecuta:
```javascript
fetch('/api/test-config')
  .then(r => r.json())
  .then(d => console.log('Estado de sesión:', d));
```

### 2. Logs Detallados

He agregado logs tanto en el servidor como en el cliente:

**En el Servidor (logs de Coolify):**
```
POST /api/configuracion - Session: {
  hasSession: true/false,
  user: {...},
  role: 'admin'/'cobrador'/etc
}
```

**En el Cliente (consola del navegador):**
```
Guardando configuración... {config data}
Respuesta del servidor: {status, data}
```

### 3. Mensajes de Error Mejorados

Ahora el sistema mostrará exactamente qué está fallando:

- **"No hay sesión activa"**: El usuario no está autenticado
- **"Rol actual: X. Se requiere rol: admin"**: El usuario no tiene permisos de admin
- **"Faltan campos requeridos (Faltan: X, Y, Z)"**: Hay campos faltantes en los datos

## 📋 Pasos para Diagnosticar

### Paso 1: Verificar Sesión
1. Inicia sesión en la aplicación con un usuario admin
2. Ve a `/dashboard/configuracion`
3. Abre la consola del navegador (F12)
4. Ejecuta:
```javascript
fetch('/api/test-config')
  .then(r => r.json())
  .then(d => console.log('Diagnóstico:', JSON.stringify(d, null, 2)));
```

**Resultado esperado:**
```json
{
  "hasSession": true,
  "user": {
    "email": "cristal@muebleria.com",
    "name": "Cristal"
  },
  "role": "admin",
  "isAdmin": true,
  "cookies": [...]
}
```

### Paso 2: Intentar Guardar
1. Modifica algún campo en la configuración
2. Abre la consola del navegador (F12)
3. Haz clic en "Guardar"
4. Observa los logs en la consola

**Logs esperados:**
```
Guardando configuración... {empresa: {...}, cobranza: {...}, ...}
Respuesta del servidor: {status: 200, data: {...}}
```

### Paso 3: Revisar Logs del Servidor
Si estás en Coolify:
1. Ve a los logs del contenedor de la aplicación
2. Busca líneas que contengan "POST /api/configuracion"
3. Observa el estado de la sesión

## 🚨 Posibles Causas y Soluciones

### Causa 1: No hay sesión activa
**Síntoma:** `"No hay sesión activa"`

**Solución:**
- Cierra sesión completamente
- Limpia las cookies del navegador
- Vuelve a iniciar sesión
- Intenta de nuevo

### Causa 2: Usuario no es admin
**Síntoma:** `"Rol actual: cobrador. Se requiere rol: admin"`

**Solución:**
- Verifica que estás usando un usuario admin
- Usuarios admin disponibles:
  - Email: `cristal@muebleria.com`
  - Email: `admin@economica.local`

### Causa 3: Problema con cookies de sesión
**Síntoma:** La sesión no persiste entre peticiones

**Solución:**
Verificar configuración de cookies en `lib/auth.ts`:
```typescript
cookies: {
  sessionToken: {
    name: `__Secure-next-auth.session-token`,
    options: {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: process.env.NODE_ENV === 'production'
    }
  }
}
```

### Causa 4: CORS o problemas de red
**Síntoma:** La petición falla en el navegador

**Solución:**
- Verifica que estés accediendo desde el mismo dominio
- Revisa que no haya errores de red en la pestaña "Network" del DevTools

## 🔧 Comandos Útiles

### Verificar usuarios en BD:
```bash
cd /home/ubuntu/muebleria_la_economica/app && node -e "
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.findMany({ select: { email: true, role: true, isActive: true }})
  .then(users => { console.table(users); prisma.\$disconnect(); });
"
```

### Verificar tabla de configuración:
```bash
cd /home/ubuntu/muebleria_la_economica/app && node -e "
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.configuracionSistema.findMany()
  .then(config => { console.log('Configuración:', config); prisma.\$disconnect(); });
"
```

## 📸 Capturas Necesarias para Diagnóstico

Si el problema persiste, necesitaré las siguientes capturas de pantalla:

1. **Consola del navegador:**
   - Los logs al hacer clic en "Guardar"
   - El resultado de ejecutar `/api/test-config`

2. **Network tab:**
   - La petición POST a `/api/configuracion`
   - Los headers de la petición
   - La respuesta del servidor

3. **Logs del servidor (Coolify):**
   - Las líneas que contengan "POST /api/configuracion"

## 🎯 Próximos Pasos

1. **Redeploy en Coolify** (los cambios ya están en GitHub)
2. **Ejecutar diagnóstico** siguiendo los pasos de arriba
3. **Reportar resultados** con las capturas de pantalla si es necesario

## 📊 Estado de Archivos

```
✅ app/app/api/configuracion/route.ts (mejorado con logs)
✅ app/app/api/test-config/route.ts (nuevo, para diagnóstico)
✅ app/app/dashboard/configuracion/page.tsx (mejorado con logs)
✅ app/prisma/schema.prisma (modelo ConfiguracionSistema)
```

---

**Fecha**: 13 de octubre, 2025  
**Estado**: Mejoras de debugging implementadas - Listo para diagnóstico  
**Proyecto**: MUEBLERIA LA ECONOMICA - Sistema de Gestión de Cobranza
