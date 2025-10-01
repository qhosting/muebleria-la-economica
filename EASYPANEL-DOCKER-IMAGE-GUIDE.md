
# 🐳 Guía para Usar Imagen Docker en EasyPanel

Esta guía explica cómo crear y usar una imagen Docker pre-construida en EasyPanel.

---

## 🎯 ¿Por Qué Usar una Imagen Docker?

### Ventajas
- ✅ **Deploy más rápido**: No necesita compilar en EasyPanel
- ✅ **Sin errores de build**: La imagen ya está probada y funcionando
- ✅ **Consistencia**: La misma imagen funciona en todos lados
- ✅ **Cache optimizado**: Builds subsecuentes son instantáneos

### Cuándo Usar
- 🚀 Cuando el build en EasyPanel falla
- 🚀 Cuando quieres deploys ultra-rápidos
- 🚀 Cuando tienes un servidor potente para hacer el build

---

## 📦 OPCIÓN 1: Construir y Subir a Docker Hub (Recomendado)

### Paso 1: Preparar el Servidor

Conéctate a tu servidor donde tienes Docker instalado (por ejemplo, tu servidor de Coolify):

```bash
ssh root@vmi2822351.contaboserver.net
```

### Paso 2: Navegar al Proyecto

```bash
cd /ruta/a/muebleria_la_economica
# o
git clone https://github.com/qhosting/muebleria-la-economica.git
cd muebleria-la-economica
```

### Paso 3: Ejecutar el Script de Build

```bash
chmod +x build-docker-image.sh
./build-docker-image.sh
```

El script te preguntará:
1. ¿Construir localmente? → **Sí**
2. ¿Subir a Docker Hub? → **Sí**
3. Username de Docker Hub → Ingresa tu username
4. Login en Docker Hub → Ingresa tu password

### Paso 4: Configurar en EasyPanel

1. En EasyPanel, crea un nuevo servicio
2. Selecciona **"Imagen Docker"** en lugar de "GitHub"
3. Ingresa el nombre de la imagen:
   ```
   qhosting/muebleria-la-economica:latest
   ```
   *(Reemplaza `qhosting` con tu username de Docker Hub)*
4. Puerto: `3000`
5. Configura las variables de entorno (igual que antes)
6. Deploy

---

## 💾 OPCIÓN 2: Build Manual (Sin Docker Hub)

Si no quieres usar Docker Hub, puedes construir localmente:

### En tu Servidor de Coolify

```bash
cd /ruta/a/muebleria_la_economica

# Construir la imagen
docker build -t muebleria-la-economica:latest .

# Verificar que se construyó
docker images | grep muebleria
```

### Guardar como archivo .tar

```bash
# Guardar la imagen
docker save muebleria-la-economica:latest -o muebleria.tar

# Comprimir (opcional)
gzip muebleria.tar
```

### Transferir al servidor de EasyPanel

```bash
# Desde tu máquina local
scp muebleria.tar root@[IP_EASYPANEL_SERVER]:/tmp/

# En el servidor de EasyPanel
ssh root@[IP_EASYPANEL_SERVER]
docker load -i /tmp/muebleria.tar
```

### Configurar en EasyPanel

Usa la imagen local: `muebleria-la-economica:latest`

---

## 🚀 OPCIÓN 3: Usar GitHub Container Registry (GHCR)

Alternativa gratuita a Docker Hub usando GitHub Packages.

### Paso 1: Crear Personal Access Token en GitHub

1. Ve a GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token (classic)
3. Scopes: `write:packages`, `read:packages`, `delete:packages`
4. Copia el token

### Paso 2: Login en GHCR

```bash
echo "YOUR_TOKEN" | docker login ghcr.io -u qhosting --password-stdin
```

### Paso 3: Build y Push

```bash
# Build
docker build -t ghcr.io/qhosting/muebleria-la-economica:latest .

# Push
docker push ghcr.io/qhosting/muebleria-la-economica:latest
```

### Paso 4: Hacer la imagen pública (Opcional)

1. Ve a GitHub → tu perfil → Packages
2. Encuentra `muebleria-la-economica`
3. Package settings → Change visibility → Public

### Paso 5: Usar en EasyPanel

Imagen: `ghcr.io/qhosting/muebleria-la-economica:latest`

---

## 📋 Configuración Completa en EasyPanel

Una vez que tengas la imagen (Docker Hub, local, o GHCR):

### 1. Crear Servicio en EasyPanel

```
Dashboard → Proyecto → Add Service → Docker Image
```

### 2. Configuración del Servicio

| Campo | Valor |
|-------|-------|
| **Image** | `qhosting/muebleria-la-economica:latest` |
| **Port** | `3000` |
| **Restart Policy** | `unless-stopped` |

### 3. Variables de Entorno

```bash
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://postgres:[PASSWORD]@muebleria-postgres:5432/muebleria
NEXTAUTH_URL=https://[TU_DOMINIO]
NEXTAUTH_SECRET=[openssl rand -base64 32]
JWT_SECRET=[openssl rand -base64 32]
```

### 4. Health Check (Opcional)

```
Path: /api/health
Interval: 30s
Timeout: 10s
```

### 5. Deploy

Haz clic en **"Deploy"** y espera a que el servicio esté **Running**.

---

## 🔄 Actualizar la Imagen

Cuando hagas cambios en el código:

### Opción A: Con Docker Hub

```bash
# En tu servidor de desarrollo
cd /ruta/a/muebleria_la_economica
git pull  # Si usas Git

# Rebuild y push
docker build -t qhosting/muebleria-la-economica:latest .
docker push qhosting/muebleria-la-economica:latest

# En EasyPanel
# Ve al servicio → Redeploy (EasyPanel descargará la nueva imagen)
```

### Opción B: Con Tags Versionados

```bash
# Build con tag de versión
docker build -t qhosting/muebleria-la-economica:v1.0.1 .
docker push qhosting/muebleria-la-economica:v1.0.1

# Actualizar latest
docker tag qhosting/muebleria-la-economica:v1.0.1 qhosting/muebleria-la-economica:latest
docker push qhosting/muebleria-la-economica:latest
```

---

## 🐛 Troubleshooting

### Problema: "pull access denied"

**Causa**: La imagen es privada y EasyPanel no tiene acceso.

**Solución**:
1. Haz la imagen pública en Docker Hub/GHCR
2. O configura credenciales de registry en EasyPanel

### Problema: Error al construir la imagen

**Causa**: Falta de recursos o errores de build.

**Solución**:
```bash
# Ver logs detallados
docker build -t muebleria-la-economica:latest . --progress=plain

# Limpiar cache y rebuild
docker builder prune -a
docker build --no-cache -t muebleria-la-economica:latest .
```

### Problema: Imagen muy grande

**Causa**: Cache o archivos innecesarios.

**Solución**:
```bash
# Ver tamaño de la imagen
docker images | grep muebleria

# Optimizar Dockerfile (ya está optimizado en tu caso)
# Verificar layers
docker history muebleria-la-economica:latest
```

---

## 📊 Comparación de Opciones

| Opción | Velocidad | Complejidad | Recomendado para |
|--------|-----------|-------------|------------------|
| **Docker Hub** | ⚡⚡⚡ Rápida | 🟢 Fácil | Producción |
| **GitHub Container Registry** | ⚡⚡⚡ Rápida | 🟡 Media | Open Source |
| **Archivo .tar** | ⚡ Lenta | 🔴 Compleja | Casos específicos |
| **Build desde GitHub** | ⚡⚡ Media | 🟢 Fácil | Desarrollo |

---

## ✅ Checklist Pre-Deploy

Antes de usar la imagen en EasyPanel:

- [ ] Imagen construida sin errores
- [ ] Imagen subida al registry (Docker Hub/GHCR) o cargada localmente
- [ ] PostgreSQL creado en EasyPanel
- [ ] Variables de entorno preparadas
- [ ] Secrets generados (NEXTAUTH_SECRET, JWT_SECRET)
- [ ] Dominio configurado en DNS

---

## 🎉 Resultado Esperado

Después del deploy con imagen Docker:

- ✅ Deploy en **menos de 30 segundos**
- ✅ Sin errores de compilación
- ✅ Aplicación funcionando inmediatamente
- ✅ Health check respondiendo

---

## 📚 Comandos Útiles

```bash
# Ver imágenes locales
docker images

# Ver contenedores corriendo
docker ps

# Ver logs de un contenedor
docker logs [CONTAINER_ID]

# Eliminar imagen local
docker rmi muebleria-la-economica:latest

# Limpiar imágenes no usadas
docker image prune -a

# Ver tamaño de todas las imágenes
docker system df
```

---

## 🆘 Soporte

Si encuentras problemas:

1. Verifica los logs del build: `docker build ... --progress=plain`
2. Verifica que el Dockerfile sea el correcto
3. Asegúrate de estar en el directorio correcto
4. Verifica tu conexión a Docker Hub/GHCR

---

**¡Listo para construir tu imagen Docker!** 🐳🚀

Sigue las instrucciones de la **OPCIÓN 1** para la experiencia más sencilla.
