
# 🚨 **ERROR "NO AVAILABLE SERVER" - SOLUCIÓN COMPLETA**

## ✅ **ERROR IDENTIFICADO:**

```
no available server
```

Este error de Traefik significa que **NO puede conectarse al container** de tu aplicación.

---

## 🎯 **SOLUCIONES EN ORDEN DE PROBABILIDAD:**

---

### **🔴 SOLUCIÓN #1: VERIFICAR Y CONFIGURAR RED DE DOCKER**

#### **En Coolify:**

1. **Ve a tu aplicación "laeconomica"**
2. **Configuration → Network**
3. **Verifica que esté en la red de Coolify/Traefik**
   - Busca algo como: `coolify`, `coolify-network`, o similar
   - **NO debe ser**: `bridge` o `host`

#### **Si no está en la red correcta:**

1. **Detén la aplicación** (Stop)
2. **Ve a Configuration → Network**
3. **Cambia la red a**: La red que usa Traefik (usualmente `coolify` o verifica en el servicio Traefik)
4. **Guarda cambios**
5. **Redeploy**

---

### **🟡 SOLUCIÓN #2: CONFIGURAR CORRECTAMENTE LOS LABELS DE TRAEFIK**

El problema puede estar en los Container Labels. Necesitas estos labels exactos:

#### **Labels necesarios:**

```yaml
traefik.enable=true
traefik.http.routers.laeconomica.rule=Host(`app.mueblerialaeconomica.com`)
traefik.http.routers.laeconomica.entrypoints=websecure
traefik.http.routers.laeconomica.tls.certresolver=letsencrypt
traefik.http.services.laeconomica.loadbalancer.server.port=3000
traefik.http.routers.laeconomica-http.rule=Host(`app.mueblerialaeconomica.com`)
traefik.http.routers.laeconomica-http.entrypoints=web
traefik.http.routers.laeconomica-http.middlewares=redirect-to-https
traefik.http.middlewares.redirect-to-https.redirectscheme.scheme=https
```

#### **En Coolify:**

1. **Ve a Configuration → Container Labels**
2. **Copia y pega los labels de arriba** (reemplazando los existentes)
3. **Importante**: Cambia `laeconomica` por el nombre exacto que use Coolify si es diferente
4. **Save Changes**
5. **Redeploy**

---

### **🟢 SOLUCIÓN #3: VERIFICAR QUE EL CONTAINER ESTÉ CORRIENDO**

#### **En Coolify:**

1. **Ve a la página de tu aplicación**
2. **Verifica el estado**: Debe decir **"Running"** (no "Stopped", "Exited", o "Restarting")
3. **Verifica los logs**: Debe mostrar `✓ Ready in XXms`

#### **Si no está corriendo:**

1. **Clic en Restart**
2. **Espera 1-2 minutos**
3. **Verifica logs** para confirmar que inició correctamente

---

### **🟣 SOLUCIÓN #4: HEALTH CHECK CAUSANDO PROBLEMAS**

Si Traefik tiene health check activado y el endpoint no responde, marca el servicio como no disponible.

#### **Opción A: Desactivar temporalmente el health check de Traefik**

En los Container Labels, elimina o comenta estas líneas (si existen):
```yaml
traefik.http.services.laeconomica.loadbalancer.healthcheck.path=/api/health
traefik.http.services.laeconomica.loadbalancer.healthcheck.interval=30s
```

#### **Opción B: Asegurar que el health check funcione**

Ya agregamos el endpoint `/api/health`, pero verifica que esté deployado:

1. **Confirma que el último deploy incluye el commit `a06f3e5`**
2. **Accede a los logs** y busca: `✓ Ready in XXms`
3. **Prueba el health check internamente** (si tienes acceso al container):
   ```bash
   curl http://localhost:3000/api/health
   ```

---

### **🔵 SOLUCIÓN #5: PUERTO INCORRECTO EN LABELS**

Verifica que el label de puerto sea **exactamente 3000**:

```yaml
traefik.http.services.laeconomica.loadbalancer.server.port=3000
```

#### **En Coolify:**

1. **Ve a Container Labels**
2. **Busca la línea con `loadbalancer.server.port`**
3. **Debe ser**: `=3000` (no `=8080`, `=80`, etc.)
4. **Si es diferente, corrígelo**
5. **Save y Redeploy**

---

## 🚀 **SOLUCIÓN RÁPIDA - PASO A PASO:**

### **PASO 1: Verificar Estado del Container**

1. Ve a tu app en Coolify
2. Estado debe ser: **"Running"**
3. Logs deben mostrar: `✓ Ready in XXms`

### **PASO 2: Verificar Red**

1. **Configuration → Network**
2. Red debe ser: La misma que usa Traefik (NO `bridge`)
3. Si es diferente:
   - Stop → Cambiar red → Redeploy

### **PASO 3: Verificar Labels de Traefik**

1. **Configuration → Container Labels**
2. Debe tener el label:
   ```
   traefik.http.services.laeconomica.loadbalancer.server.port=3000
   ```
3. Si falta o es incorrecto:
   - Agregar/corregir → Save → Redeploy

### **PASO 4: Restart de Traefik**

1. Ve al servicio **Traefik/Proxy** en Coolify
2. Clic en **Restart**
3. Espera 30 segundos

### **PASO 5: Restart de la Aplicación**

1. Ve a tu app **laeconomica**
2. Clic en **Restart**
3. Espera 1 minuto

### **PASO 6: Probar**

Accede a: `https://app.mueblerialaeconomica.com`

---

## 🔍 **VERIFICACIÓN ADICIONAL - DESDE SERVIDOR:**

Si tienes acceso SSH al servidor Coolify (`38.242.250.40`):

### **1. Verificar que el container esté en la red de Traefik:**

```bash
# Listar containers y sus redes
docker ps --format "table {{.Names}}\t{{.Networks}}"

# Busca tu container (laeconomica) y verifica que esté en la misma red que Traefik
```

### **2. Verificar conectividad interna:**

```bash
# Obtener el nombre del container
docker ps | grep muebleria

# Ejecutar curl desde dentro de la red de Docker
docker exec -it <traefik_container_name> wget -O- http://laeconomica:3000/api/health
```

### **3. Ver logs de Traefik:**

```bash
docker logs <traefik_container_name> | grep "laeconomica"
docker logs <traefik_container_name> | grep "app.mueblerialaeconomica.com"
```

---

## 📋 **CHECKLIST DE VERIFICACIÓN:**

- [ ] Container está "Running" (no "Stopped" o "Exited")
- [ ] Logs muestran `✓ Ready in XXms`
- [ ] Container está en la red de Traefik (NO en `bridge`)
- [ ] Label `traefik.enable=true` existe
- [ ] Label `traefik.http.services.*.loadbalancer.server.port=3000` existe
- [ ] Label `traefik.http.routers.*.rule=Host(...)` existe
- [ ] Traefik está "Running"
- [ ] No hay health check bloqueando (o el health check responde correctamente)

---

## 🎯 **CONFIGURACIÓN COMPLETA DE LABELS (COPIA Y PEGA):**

Si quieres empezar de cero con los labels, usa estos:

```yaml
traefik.enable=true
traefik.http.routers.http-0-xoocck8sokg0wc8wwgo8k8w.rule=Host(`app.mueblerialaeconomica.com`)
traefik.http.routers.http-0-xoocck8sokg0wc8wwgo8k8w.entryPoints=http
traefik.http.routers.http-0-xoocck8sokg0wc8wwgo8k8w.middlewares=gzip,stripprefix,http-0-xoocck8sokg0wc8wwgo8k8w-stripprefix,gzip
traefik.http.middlewares.http-0-xoocck8sokg0wc8wwgo8k8w.redirect-to-https.redirectscheme.scheme=https
traefik.http.routers.http-0-xoocck8sokg0wc8wwgo8k8w.middlewares=http-0-xoocck8sokg0wc8wwgo8k8w.redirect-to-https
traefik.http.routers.https-0-xoocck8sokg0wc8wwgo8k8w.rule=Host(`app.mueblerialaeconomica.com`) && PathPrefix(`/`)
traefik.http.routers.https-0-xoocck8sokg0wc8wwgo8k8w.entryPoints=https
traefik.http.routers.https-0-xoocck8sokg0wc8wwgo8k8w.tls=true
traefik.http.routers.https-0-xoocck8sokg0wc8wwgo8k8w.tls.certresolver=letsencrypt
traefik.http.routers.https-0-xoocck8sokg0wc8wwgo8k8w.middlewares=gzip,stripprefix,http-0-xoocck8sokg0wc8wwgo8k8w-stripprefix,gzip
traefik.http.services.http-0-xoocck8sokg0wc8wwgo8k8w.loadbalancer.server.port=3000
traefik.http.middlewares.http-0-xoocck8sokg0wc8wwgo8k8w-stripprefix.stripprefix.prefixes=/
caddy_0.encode=zstd gzip
caddy_0.handle_path.0_reverse_proxy={{upstreams 3000}}
caddy_0.handle_path=app.mueblerialaeconomica.com/*
caddy_0.header=-Server
caddy_0.try_files={path} /index.html /index.php
```

**IMPORTANTE**: Estos labels son los que vi en tu captura. Solo cópialos si Coolify permite edición manual.

---

## 💡 **SOLUCIÓN MÁS PROBABLE:**

Basándome en el error "no available server", lo más probable es que:

1. **El container no esté en la red correcta** → Cambiar red a la de Traefik
2. **O el puerto en los labels sea incorrecto** → Verificar que sea `3000`

---

## 🚨 **ACCIÓN INMEDIATA:**

### **Haz esto AHORA:**

1. **Ve a Configuration → Network** en tu app
2. **Anota qué red tiene configurada**
3. **Ve al servicio Traefik/Proxy**
4. **Anota qué red usa Traefik**
5. **Si son DIFERENTES**:
   - Stop tu app
   - Cambia la red a la misma que Traefik
   - Redeploy

**Esto debería resolver el 90% de los casos de "no available server".**

---

## 📞 **INFORMACIÓN QUE NECESITO:**

Por favor, responde:

1. **¿En qué red está tu container?** (Configuration → Network)
2. **¿En qué red está Traefik?** (Ver servicio Traefik/Proxy)
3. **¿Coinciden las redes?** (Sí/No)
4. **¿El estado del container es "Running"?** (Sí/No)
5. **¿Los logs muestran `✓ Ready in XXms`?** (Sí/No)

Con esta información te doy la solución exacta. 🎯

---

**DOCUMENTACIÓN CREADA PARA RESOLVER "NO AVAILABLE SERVER"**  
**Commit ready para push si necesitas más cambios en el código.**
