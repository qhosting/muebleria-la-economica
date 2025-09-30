
# 🚀 Ejemplo Práctico - Despliegue en Coolify

## 📋 **Caso de Uso Real**

Supongamos que tienes:
- **Coolify URL**: `https://coolify.miempresa.com`
- **Dominio para la app**: `muebleria.miempresa.com`  
- **Base de datos**: PostgreSQL en el mismo servidor

---

## 🎯 **Opción 1: Setup Automático (Recomendado para principiantes)**

### **Paso 1: Ejecutar Setup Helper**
```bash
./coolify-setup-helper.sh
```

**Interacción del script:**
```
🔧 COOLIFY SETUP HELPER
================================

🌐 URL de tu servidor Coolify: https://coolify.miempresa.com
🔑 Token de API de Coolify: [ingresa-tu-token]

🔄 Verificando conexión con Coolify...
✓ Conexión establecida con Coolify

📡 SERVIDORES DISPONIBLES
==========================
🖥️  ID: 1 | Nombre: server-principal | IP: 192.168.1.100 | Estado: running
🖥️  ID: 2 | Nombre: server-backup | IP: 192.168.1.101 | Estado: running

📝 Ingresa el ID del servidor: 1

🎯 DESTINOS DISPONIBLES PARA SERVIDOR 1
===============================================
🔗 ID: 5 | Nombre: docker-local | Tipo: standalone | Red: coolify
🔗 ID: 6 | Nombre: docker-swarm | Tipo: swarm | Red: production

📝 Ingresa el ID del destino: 5

📋 CONFIGURACIÓN GENERADA
==========================
✓ Datos obtenidos exitosamente
✓ Configuración guardada en: coolify-auto-config.env
```

### **Paso 2: Editar Configuración**
```bash
nano coolify-auto-config.env
```

**Editar estas líneas:**
```env
APP_DOMAIN=muebleria.miempresa.com
DATABASE_URL=postgresql://postgres:password123@localhost:5432/muebleria_db
```

### **Paso 3: Desplegar Automáticamente**
```bash
./coolify-deploy.sh
```

**Output del despliegue:**
```
🚀 COOLIFY AUTO-DEPLOY - MUEBLERIA LA ECONOMICA
==================================================================

ℹ Cargando configuración existente...
ℹ Verificando conexión con Coolify...
✓ Conexión con Coolify establecida
ℹ Verificando si la aplicación ya existe...
✓ La aplicación 'muebleria-la-economica' no existe. Se creará una nueva.
ℹ Creando aplicación en Coolify...
✓ Aplicación creada exitosamente
ℹ UUID: abc123-def456-ghi789
ℹ Iniciando despliegue de la aplicación...
✓ Despliegue iniciado exitosamente
ℹ Puedes monitorear el progreso en: https://coolify.miempresa.com/applications/abc123-def456-ghi789

¿Deseas monitorear el despliegue en tiempo real? (Y/n): y

ℹ Monitoreando el despliegue (presiona Ctrl+C para salir)...
ℹ Estado actual: building
ℹ Estado actual: building
ℹ Estado actual: running
✓ ¡Aplicación desplegada y ejecutándose!

🎉 DESPLIEGUE COMPLETADO
✓ Aplicación: muebleria-la-economica
✓ Dominio: https://muebleria.miempresa.com
✓ Panel Coolify: https://coolify.miempresa.com/applications/abc123-def456-ghi789
```

---

## ⚡ **Opción 2: One-Click Deploy (Para expertos)**

### **Paso 1: Editar Script**
```bash
nano coolify-one-click.sh
```

**Modificar estas variables:**
```bash
COOLIFY_URL="https://coolify.miempresa.com"
COOLIFY_TOKEN="tu-token-real-aqui"
SERVER_ID="1"
DESTINATION_ID="5"
APP_DOMAIN="muebleria.miempresa.com"
DATABASE_URL="postgresql://postgres:password123@localhost:5432/muebleria_db"
```

### **Paso 2: Ejecutar**
```bash
./coolify-one-click.sh
```

**Output ultra-rápido:**
```
🚀 COOLIFY ONE-CLICK DEPLOY
==========================
ℹ Creando aplicación en Coolify...
✓ Aplicación creada: abc123-def456-ghi789
ℹ Iniciando despliegue...
🎉 ¡Despliegue iniciado!
🌐 Panel: https://coolify.miempresa.com/applications/abc123-def456-ghi789
🌍 App: https://muebleria.miempresa.com
```

---

## 🔗 **Opción 3: API Manual**

### **Crear App con curl:**
```bash
curl -X POST "https://coolify.miempresa.com/api/v1/applications" \
  -H "Authorization: Bearer tu-token" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "muebleria-la-economica",
    "git_repository": "https://github.com/qhosting/muebleria-la-economica.git",
    "git_branch": "main",
    "build_pack": "dockerfile",
    "server_id": "1",
    "destination_id": "5",
    "environment_variables": {
      "NODE_ENV": "production",
      "PORT": "3000",
      "DATABASE_URL": "postgresql://postgres:password123@localhost:5432/muebleria_db",
      "NEXTAUTH_URL": "https://muebleria.miempresa.com",
      "NEXTAUTH_SECRET": "secret-generado-automatico"
    },
    "domains": [{"domain": "muebleria.miempresa.com", "path": "/"}]
  }'
```

### **Iniciar Despliegue:**
```bash
curl -X POST "https://coolify.miempresa.com/api/v1/applications/ABC123/deploy" \
  -H "Authorization: Bearer tu-token"
```

---

## 🎯 **Resultado Final**

Sin importar qué opción uses, obtienes:

### **✅ Aplicación Funcionando**
- **URL**: https://muebleria.miempresa.com
- **SSL**: Configurado automáticamente
- **Estado**: Running en Coolify

### **✅ Configuración Completa**
- **Docker**: Imagen optimizada construida
- **Base de datos**: Conectada y migrada
- **Variables**: Todas configuradas
- **Dominio**: DNS apuntando correctamente

### **✅ Panel de Control**
- **Logs**: Visibles en tiempo real
- **Métricas**: CPU, RAM, red
- **Redeploy**: Con un click
- **Configuración**: Editable desde UI

---

## 🔧 **Comandos Útiles Post-Despliegue**

### **Ver Estado**
```bash
curl -H "Authorization: Bearer token" \
  "https://coolify.miempresa.com/api/v1/applications/UUID/status"
```

### **Ver Logs**
```bash
curl -H "Authorization: Bearer token" \
  "https://coolify.miempresa.com/api/v1/applications/UUID/logs"
```

### **Redeployar**
```bash
curl -X POST -H "Authorization: Bearer token" \
  "https://coolify.miempresa.com/api/v1/applications/UUID/deploy"
```

---

## ⏱️ **Tiempos Estimados**

- **Setup Helper**: 2 minutos
- **Configuración**: 1 minuto
- **Despliegue**: 3-5 minutos
- **Total**: ~8 minutos desde cero

---

## 🎉 **¡Tu app está lista para recibir visitantes!**

**URL de acceso**: https://muebleria.miempresa.com  
**Panel admin**: https://muebleria.miempresa.com/admin  
**Usuarios de prueba**: Admin, Gestor, Cobrador, Reportes
