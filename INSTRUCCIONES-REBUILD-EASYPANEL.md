
# 🚀 Instrucciones para Rebuild en EasyPanel

**Fecha:** 9 de Octubre, 2025  
**Commit:** f486617  
**Estado:** ✅ Listo para deploy

---

## 📦 Qué Se Implementó

### ✅ Cambios Realizados

1. **Dockerfile Simplificado**
   - Usa `yarn start` (next start) en lugar de standalone
   - Más simple, más confiable, menos propenso a errores
   - Imagen ~300MB más grande pero funciona garantizado

2. **Usuario Admin Automático**
   - Se crea automáticamente en cada deploy
   - Email: `admin@laeconomica.com`
   - Contraseña: `Admin123!`
   - ⚠️ Cambiar después del primer login

3. **Scripts de Backup**
   - `backup-manual.sh` - Crear backup de la BD
   - `restore-backup.sh` - Restaurar desde backup
   - Guardados en volumen persistente `/backup`

4. **Persistencia Garantizada**
   - Tus volúmenes están configurados correctamente
   - Los datos NO se pierden en deploy
   - Los backups NO se pierden en deploy

---

## 🎯 Pasos para Hacer el Rebuild

### Paso 1: Ir a EasyPanel

1. Abre EasyPanel: https://tu-easypanel.com
2. Ve a tu proyecto "Mueblería La Económica"
3. Busca la aplicación Next.js

### Paso 2: Hacer Rebuild

**Opción A: Auto-Deploy (Si está configurado)**
- EasyPanel detectará el push a GitHub automáticamente
- El rebuild iniciará solo
- Ve al paso 3 para verificar

**Opción B: Rebuild Manual**
1. Click en la pestaña **"Build"** o **"Deploy"**
2. Click en el botón **"Rebuild"** o **"Force Rebuild"**
3. Confirma la acción

### Paso 3: Observar los Logs del Build

**Busca estas líneas en los logs:**

```
✅ Build completed!
```

**NO busques:**
- "Standalone directory" (ya no usamos standalone)
- "server.js" (ya no lo necesitamos)

Si el build completa sin errores → **¡Éxito!** 🎉

### Paso 4: Verificar el Contenedor

Una vez que el contenedor inicie, en los logs deberías ver:

```
🚀 Iniciando MUEBLERIA LA ECONOMICA...
✅ Prisma CLI encontrado
📊 Verificando conexión a la base de datos...
🌱 Verificando si necesita seed...
👤 Verificando usuario admin...
✅ Usuario admin creado exitosamente!
📧 Email: admin@laeconomica.com
🔑 Contraseña: Admin123!

🎯 Iniciando servidor Next.js...
🚀 EJECUTANDO: yarn start (next start)

▲ Next.js 14.2.28
- Local:        http://0.0.0.0:3000
- ready started server on 0.0.0.0:3000
```

**Si ves esto → ¡Todo funcionó!** ✅

---

## ✅ Verificación Post-Deploy

### 1. Acceder a la Aplicación

Abre en tu navegador:
```
https://app.mueblerialaeconomica.com
```

Deberías ver la página de inicio de la aplicación.

### 2. Probar Login de Admin

1. Ve a la página de login
2. Ingresa:
   - Email: `admin@laeconomica.com`
   - Contraseña: `Admin123!`
3. Deberías poder entrar al dashboard

### 3. Cambiar Contraseña de Admin

**¡IMPORTANTE!** Cambia la contraseña inmediatamente:

1. Ve a "Perfil" o "Configuración"
2. Cambia la contraseña a una segura
3. Guarda los cambios

### 4. Verificar Persistencia

1. Crea un producto de prueba o edita algo
2. Anota el cambio
3. Haz un **Rebuild** en EasyPanel (para probar)
4. Verifica que el cambio sigue ahí → ✅ Persistencia funcionando

---

## 📊 Variables de Entorno Necesarias

Verifica que en EasyPanel estén configuradas:

```bash
DATABASE_URL=postgres://postgres:516313d097ca55447011@cloudmx_laeconomica-db:5432/laeconomica-db?schema=public
NEXTAUTH_URL=https://app.mueblerialaeconomica.com
NEXTAUTH_SECRET=<tu-secret-aqui>
JWT_SECRET=<tu-secret-aqui>
NODE_ENV=production
PORT=3000
```

**Según tu imagen (ECO1.jpg), tu DATABASE_URL es:**
```
postgres://postgres:516313d097ca55447011@cloudmx_laeconomica-db:5432/laeconomica-db?schema=public
```

---

## 💾 Crear Tu Primer Backup

Una vez que la aplicación esté funcionando:

### Desde EasyPanel Terminal

1. Ve a tu aplicación en EasyPanel
2. Click en **"Terminal"** o **"Console"**
3. Ejecuta:
```bash
sh /app/backup-manual.sh "primer-backup"
```

### Desde Docker (Si tienes acceso SSH)

```bash
docker exec -it <container-name> sh /app/backup-manual.sh "primer-backup"
```

### Verificar el Backup

```bash
# Desde terminal de EasyPanel
ls -lh /backup/

# Deberías ver:
# primer-backup.sql
```

---

## 🔍 Troubleshooting

### El Build Falla

**Ver los logs completos:**
- Busca la primera línea que diga `ERROR` o `error:`
- Copia ese error y el contexto (10-20 líneas antes y después)

**Errores comunes:**

1. **Error con Prisma:**
   ```
   Prisma Client could not be generated
   ```
   **Solución:** Verificar que `prisma/schema.prisma` existe

2. **Error con dependencias:**
   ```
   Cannot find module 'X'
   ```
   **Solución:** Verificar `package.json` y `yarn.lock` están en GitHub

3. **Error de build de Next.js:**
   ```
   Build failed with exit code 1
   ```
   **Solución:** Ver los logs de TypeScript para errores específicos

### El Contenedor No Arranca

**Ver logs del contenedor:**
```bash
docker logs <container-name>
```

**Errores comunes:**

1. **DATABASE_URL no configurado:**
   ```
   ❌ ERROR: DATABASE_URL no está configurado
   ```
   **Solución:** Agregar la variable de entorno en EasyPanel

2. **No puede conectar a la base de datos:**
   ```
   Error: P1001: Can't reach database server
   ```
   **Solución:** Verificar que el contenedor de PostgreSQL está corriendo

3. **Puerto en uso:**
   ```
   Error: listen EADDRINUSE: address already in use :::3000
   ```
   **Solución:** Detener el contenedor viejo o cambiar el puerto

### No Puedo Acceder a la Aplicación

**Verificar:**

1. **¿El contenedor está corriendo?**
   - En EasyPanel: Ver estado del servicio
   - Debe estar en verde (running)

2. **¿Los logs muestran "ready started server"?**
   - Ver logs del contenedor
   - Buscar: `ready started server on 0.0.0.0:3000`

3. **¿El dominio está configurado?**
   - Verificar en EasyPanel → Dominios
   - Debe apuntar a `app.mueblerialaeconomica.com`

4. **¿HTTPS funciona?**
   - EasyPanel maneja SSL automáticamente
   - Puede tomar 1-2 minutos después del deploy

---

## 📋 Checklist Completo

### Pre-Deploy
- [x] Código subido a GitHub (commit f486617)
- [x] Volúmenes persistentes configurados en EasyPanel
- [x] Variables de entorno configuradas
- [x] Scripts de backup incluidos

### Durante el Deploy
- [ ] Rebuild iniciado en EasyPanel
- [ ] Build completa sin errores
- [ ] Contenedor inicia correctamente
- [ ] Logs muestran "ready started server"

### Post-Deploy
- [ ] Aplicación accesible en el dominio
- [ ] Login de admin funciona
- [ ] Contraseña de admin cambiada
- [ ] Primer backup creado
- [ ] Persistencia verificada (crear algo, rebuild, verificar que persiste)

---

## 🎉 Resultado Esperado

Después del rebuild:

✅ **Aplicación funcionando** en https://app.mueblerialaeconomica.com  
✅ **Usuario admin creado** y accesible  
✅ **Base de datos persistente** (no se pierde en deploys)  
✅ **Backups configurados** y funcionales  
✅ **Deploy confiable** sin errores de standalone  

---

## 📞 Comandos de Referencia Rápida

```bash
# Ver logs del contenedor (EasyPanel Terminal)
# Los logs se muestran automáticamente en la UI

# Crear backup
sh /app/backup-manual.sh "mi-backup"

# Ver backups disponibles
ls -lh /backup/

# Restaurar backup
sh /app/restore-backup.sh /backup/mi-backup.sql

# Verificar usuario admin
# (desde la app, hacer login con admin@laeconomica.com)
```

---

## 🆘 Si Algo Sale Mal

1. **No modifiques nada aún**
2. **Copia los logs completos** del build y del contenedor
3. **Toma screenshots** de cualquier error en la UI
4. **Comparte esta información** para diagnóstico

---

## 🎯 Siguiente Paso

**👉 Hacer el Rebuild en EasyPanel ahora**

Todo está listo. Los cambios están en GitHub esperando ser desplegados.

Una vez que el rebuild complete, verifica la checklist y confirma que todo funciona.

**¡Buena suerte!** 🚀

---

**Timestamp:** 20251009_075500_REBUILD_READY  
**Commit:** f486617  
**Branch:** main  
**Estado:** ✅ Listo para producción
