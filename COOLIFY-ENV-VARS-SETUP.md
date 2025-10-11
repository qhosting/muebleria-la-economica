# 🔧 Configuración de Variables de Entorno en Coolify

## 🎯 Problema Actual

Error de NextAuth:
```
[next-auth][error][JWT_SESSION_ERROR] 
decryption operation failed
```

**Causa:** Variables de entorno incorrectas o no configuradas en Coolify.

---

## ✅ Variables Requeridas en Coolify

### Variables de NextAuth (CRÍTICAS)

```env
# NextAuth Configuration
NEXTAUTH_SECRET=MAVeh4oVyQwQsWuXfBZpz2u0tBXsWD2G
NEXTAUTH_URL=https://app.mueblerialaeconomica.com
```

**IMPORTANTE:**
- ✅ `NEXTAUTH_URL` **DEBE** ser `https://app.mueblerialaeconomica.com` (NO localhost)
- ✅ `NEXTAUTH_SECRET` debe ser un string seguro de 32+ caracteres

### Variables de Base de Datos

```env
# Database Configuration
DATABASE_URL=postgresql://usuario:password@host:puerto/database?sslmode=require
```

**Nota:** Esta variable ya debería estar configurada desde el deploy anterior.

---

## 📋 Checklist de Configuración

### En Coolify:

1. **Ve a tu aplicación** en el panel de Coolify
2. **Click en "Environment Variables"** o **"Secrets"**
3. **Verifica/Agrega** las siguientes variables:

   | Variable | Valor | Estado |
   |----------|-------|--------|
   | `NEXTAUTH_SECRET` | `MAVeh4oVyQwQsWuXfBZpz2u0tBXsWD2G` | ⬜ Verificado |
   | `NEXTAUTH_URL` | `https://app.mueblerialaeconomica.com` | ⬜ Verificado |
   | `DATABASE_URL` | `postgresql://...` | ⬜ Verificado |

4. **Guarda los cambios**
5. **Redeploy** la aplicación

### Después del Redeploy:

1. ⬜ **Limpiar cookies del navegador**
   - DevTools (F12) → Application → Cookies → Eliminar todas de `app.mueblerialaeconomica.com`
   
2. ⬜ **Probar login**
   - Ve a `https://app.mueblerialaeconomica.com/login`
   - Intenta iniciar sesión
   
3. ⬜ **Verificar logs**
   - Revisa los logs de Coolify para confirmar que no hay errores de NextAuth

---

## 🔄 Cómo Actualizar Variables en Coolify

### Interfaz Web de Coolify:

1. **Accede a Coolify**: Abre tu instancia de Coolify
2. **Selecciona tu aplicación**: "muebleria-la-economica"
3. **Ve a "Environment"** o **"Configuration"**
4. **Busca la sección "Environment Variables"**
5. **Agrega/Edita** cada variable:
   - Click en "Add Variable" o "Edit"
   - Nombre: `NEXTAUTH_URL`
   - Valor: `https://app.mueblerialaeconomica.com`
   - Click "Save"
6. **Repite** para cada variable necesaria
7. **Click "Redeploy"** para aplicar cambios

---

## 🆕 Generar Nuevo NEXTAUTH_SECRET (Opcional)

Si prefieres generar un nuevo secret más seguro:

```bash
# En tu servidor local
openssl rand -base64 32
```

**Resultado de ejemplo:**
```
LgIwSpJGyF+i69aVBhWN1TQjp4JLRSrSZk4+zn8e1MI=
```

Usa este valor para `NEXTAUTH_SECRET` en Coolify.

**IMPORTANTE:** Si cambias el secret:
- ⚠️ Todas las sesiones existentes se invalidarán
- ⚠️ Los usuarios deberán hacer login nuevamente
- ✅ Es más seguro usar un secret diferente entre local y producción

---

## 🧪 Verificación Post-Configuración

### 1. Verificar Variables de Entorno en el Container

Después del redeploy, puedes verificar que las variables estén correctas:

```bash
# En Coolify, ve a "Logs" o "Console"
docker exec -it [container-name] env | grep NEXTAUTH
```

**Debería mostrar:**
```
NEXTAUTH_SECRET=MAVeh4oVyQwQsWuXfBZpz2u0tBXsWD2G
NEXTAUTH_URL=https://app.mueblerialaeconomica.com
```

### 2. Verificar Logs de NextAuth

En los logs de Coolify, busca:

```
✅ BIEN:
[next-auth][info] Session loaded successfully
[next-auth][info] User authenticated

❌ MAL:
[next-auth][error][JWT_SESSION_ERROR]
```

### 3. Probar Login

1. Abre `https://app.mueblerialaeconomica.com/login`
2. Ingresa credenciales válidas
3. **Debería funcionar sin errores**

---

## 🐛 Troubleshooting

### Problema: Aún aparece el error después de configurar

**Solución:**
1. ✅ Verifica que las variables estén **guardadas** en Coolify
2. ✅ Haz **Redeploy** (no solo restart)
3. ✅ **Limpia cookies** del navegador completamente
4. ✅ Prueba en **modo incógnito**

### Problema: No sé cómo acceder a las variables en Coolify

**Depende de tu versión de Coolify:**
- **Coolify v4**: Ve a la aplicación → "Environment" tab
- **Coolify v3**: Ve a la aplicación → "Configuration" → "Environment Variables"
- **Si usas docker-compose**: Edita el archivo y redeploy

### Problema: Las cookies siguen causando errores

**Solución:**
1. Abre DevTools (F12)
2. Application → Storage → Clear site data
3. O simplemente usa modo incógnito para probar

---

## 📊 Comparación: Variables Local vs Producción

| Variable | Local (Desarrollo) | Producción (Coolify) |
|----------|-------------------|---------------------|
| `NEXTAUTH_URL` | `http://localhost:3000` | `https://app.mueblerialaeconomica.com` ✅ |
| `NEXTAUTH_SECRET` | Cualquier string | Mismo string o uno nuevo |
| `DATABASE_URL` | PostgreSQL local | PostgreSQL de producción |

---

## ✅ Checklist Final

Antes de decir que está resuelto, verifica:

- [ ] `NEXTAUTH_URL` = `https://app.mueblerialaeconomica.com` en Coolify
- [ ] `NEXTAUTH_SECRET` configurado en Coolify (mismo valor o nuevo)
- [ ] Variables guardadas en Coolify
- [ ] Redeploy ejecutado
- [ ] Cookies del navegador eliminadas
- [ ] Login probado exitosamente
- [ ] No hay errores de JWT en los logs

---

## 🎯 Resumen

**El error de JWT es por variables de entorno incorrectas en Coolify.**

**Solución en 3 pasos:**
1. Configura `NEXTAUTH_URL=https://app.mueblerialaeconomica.com` en Coolify
2. Redeploy la aplicación
3. Limpia cookies del navegador y prueba login

**¡Después de esto, NextAuth debería funcionar correctamente!** 🎉

---

**Fecha:** 2025-10-11  
**Prioridad:** 🔴 ALTA - Necesario para que login funcione
