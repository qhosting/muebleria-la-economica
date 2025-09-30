
# 🚀 Despliegue en tu servidor Coolify Escalafin

## ✅ **Configuración Detectada Automáticamente**

Ya tengo toda la información de tu servidor Coolify:

- **🌐 Coolify URL**: https://adm.escalafin.com  
- **🔑 API Token**: Configurado ✓
- **🖥️ Server ID**: 0 (detectado automáticamente)
- **🚀 Dominio App**: app.mueblerialaeconomica.com
- **📦 Repositorio**: https://github.com/qhosting/muebleria-la-economica.git

---

## 🎯 **Opciones de Despliegue**

### **Opción 1: Despliegue Automático (Recomendado)**

Solo necesitas configurar la URL de tu base de datos PostgreSQL:

```bash
# Ejecutar el script de despliegue rápido
./escalafin-quick-deploy.sh
```

**El script te pedirá:**
- 🗄️ URL de PostgreSQL (ej: `postgresql://user:pass@localhost:5432/muebleria_db`)

**Todo lo demás se configura automáticamente:**
- ✅ Detecta el servidor y destino
- ✅ Genera secrets de seguridad  
- ✅ Configura variables de entorno
- ✅ Crea la aplicación en Coolify
- ✅ Inicia el despliegue

### **Opción 2: Configuración Manual en Panel Web**

Si prefieres usar la interfaz web de Coolify:

1. **Accede a**: https://adm.escalafin.com
2. **Ve a**: Applications → Create New
3. **Usa esta configuración**:

```
📦 Nombre: muebleria-la-economica
🔗 Repositorio: https://github.com/qhosting/muebleria-la-economica.git  
🌿 Rama: main
🐳 Build Pack: Dockerfile
📁 Dockerfile: ./Dockerfile
🖥️ Server: 0
🌐 Dominio: app.mueblerialaeconomica.com
```

4. **Variables de entorno**:
```env
NODE_ENV=production
PORT=3000
NEXTAUTH_URL=https://app.mueblerialaeconomica.com
NEXTAUTH_SECRET=auto-generado-por-script
JWT_SECRET=auto-generado-por-script  
DATABASE_URL=tu-conexión-postgresql
```

---

## ⚡ **Ejecución Rápida**

```bash
# Opción más rápida - Un comando
./escalafin-quick-deploy.sh
```

**Output esperado:**
```
🚀 DESPLIEGUE ESCALAFIN - CONFIGURADO AUTOMÁTICAMENTE
===================================================
ℹ Usando configuración detectada:
   🖥️  Server ID: 0
   🌐 Coolify: https://adm.escalafin.com
   🚀 App: https://app.mueblerialaeconomica.com

🎯 Obteniendo destinos del servidor...
✓ Destinos encontrados
🗄️  Ingresa la URL de tu base de datos PostgreSQL: [TU_ENTRADA]
🚀 Creando aplicación...
✓ ¡Aplicación creada exitosamente!
🚀 Iniciando despliegue...
✓ ¡Despliegue iniciado!

🎉 DESPLIEGUE COMPLETADO
=======================
🌐 Tu aplicación: https://app.mueblerialaeconomica.com
🛠️  Panel Coolify: https://adm.escalafin.com/applications/[UUID]
```

---

## 🗄️ **Configuración de Base de Datos**

**Formatos de conexión PostgreSQL:**

```bash
# Servidor local
postgresql://postgres:password@localhost:5432/muebleria_db

# Servidor remoto  
postgresql://username:password@host.com:5432/database

# Con SSL
postgresql://user:pass@host:5432/db?sslmode=require

# Docker Compose (mismo servidor)
postgresql://postgres:password@postgres:5432/muebleria_db
```

---

## 👥 **Usuarios del Sistema (ya configurados)**

Una vez desplegada la aplicación, podrás acceder con:

- **Admin**: `admin` / `admin123`
- **Gestor**: `gestor` / `gestor123`  
- **Cobrador**: `cobrador` / `cobrador123`
- **Reportes**: `reportes` / `reportes123`

---

## 🎯 **Siguiente Paso**

**¡Ejecuta el despliegue ahora!**

```bash
./escalafin-quick-deploy.sh
```

Tu aplicación estará funcionando en **app.mueblerialaeconomica.com** en menos de 5 minutos.

---

*📋 Los scripts generarán un archivo con toda la información de tu despliegue para referencia futura.*
