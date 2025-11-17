
# 👥 USUARIOS POR DEFECTO - MUEBLERIA LA ECONOMICA

## 📋 Lista de Usuarios del Sistema

### 👑 ADMINISTRADORES (Acceso Total)

#### 1. Usuario Admin Principal
- **Email:** `admin@economica.local`
- **Contraseña:** `admin123`
- **Nombre:** Administrador Sistema
- **Rol:** `admin`
- **Permisos:**
  - ✅ Gestión de usuarios
  - ✅ Configuración del sistema
  - ✅ Acceso a todos los módulos
  - ✅ Reportes completos
  - ✅ Gestión de rutas y cobradores

#### 2. Usuario Cristal
- **Email:** `cristal@muebleria.com`
- **Contraseña:** ⚠️ **Desconocida** (usuario creado manualmente)
- **Nombre:** Cristal
- **Rol:** `admin`
- **Permisos:** Los mismos que admin principal
- **Nota:** Si no recuerdas la contraseña, puedes restablecerla (ver sección abajo)

---

### 👥 USUARIOS OPERATIVOS

#### 3. Gestor de Cobranza
- **Email:** `gestor@economica.local`
- **Contraseña:** `gestor123`
- **Nombre:** Gestor de Cobranza
- **Rol:** `gestor_cobranza`
- **Permisos:**
  - ✅ Gestión de clientes
  - ✅ Asignación de rutas
  - ✅ Ver reportes de cobranza
  - ✅ Gestión de cobradores
  - ❌ No puede modificar configuración del sistema
  - ❌ No puede gestionar usuarios

#### 4. Cobrador de Campo
- **Email:** `cobrador@economica.local`
- **Contraseña:** `cobrador123`
- **Nombre:** Cobrador de Campo
- **Rol:** `cobrador`
- **Permisos:**
  - ✅ Ver sus clientes asignados
  - ✅ Registrar pagos
  - ✅ Ver rutas de cobranza
  - ✅ Sincronizar datos móviles
  - ❌ No puede ver otros cobradores
  - ❌ No puede modificar configuración

#### 5. Usuario de Reportes
- **Email:** `reportes@economica.local`
- **Contraseña:** `reportes123`
- **Nombre:** Usuario de Reportes
- **Rol:** `reporte_cobranza`
- **Permisos:**
  - ✅ Ver todos los reportes
  - ✅ Exportar datos
  - ✅ Ver dashboard general
  - ❌ No puede modificar datos
  - ❌ No puede registrar pagos

---

## 🔑 Resumen de Credenciales

| Usuario | Email | Contraseña | Rol |
|---------|-------|-----------|-----|
| **Admin Principal** | `admin@economica.local` | `admin123` | admin |
| **Cristal** | `cristal@muebleria.com` | ⚠️ Desconocida | admin |
| **Gestor** | `gestor@economica.local` | `gestor123` | gestor_cobranza |
| **Cobrador** | `cobrador@economica.local` | `cobrador123` | cobrador |
| **Reportes** | `reportes@economica.local` | `reportes123` | reporte_cobranza |

---

## 🔧 Restablecer Contraseña del Usuario Cristal

Si no recuerdas la contraseña de `cristal@muebleria.com`, puedes restablecerla con este comando:

```bash
cd /home/ubuntu/muebleria_la_economica/app && node -e "
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const newPassword = 'cristal123'; // Cambia esto por la contraseña que quieras

bcrypt.hash(newPassword, 12)
  .then(hashedPassword => {
    return prisma.user.update({
      where: { email: 'cristal@muebleria.com' },
      data: { password: hashedPassword }
    });
  })
  .then(() => {
    console.log('✅ Contraseña actualizada para cristal@muebleria.com');
    console.log('Nueva contraseña:', newPassword);
    return prisma.\$disconnect();
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
    prisma.\$disconnect();
  });
"
```

---

## 🆕 Crear un Nuevo Usuario Admin

Si necesitas crear un nuevo usuario administrador:

```bash
cd /home/ubuntu/muebleria_la_economica/app && node -e "
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const newUser = {
  email: 'nuevo@muebleria.com',      // Cambia el email
  name: 'Nuevo Administrador',        // Cambia el nombre
  password: 'contraseña123',          // Cambia la contraseña
  role: 'admin'                       // admin, gestor_cobranza, cobrador, reporte_cobranza
};

bcrypt.hash(newUser.password, 12)
  .then(hashedPassword => {
    return prisma.user.create({
      data: {
        email: newUser.email,
        name: newUser.name,
        password: hashedPassword,
        role: newUser.role,
        isActive: true
      }
    });
  })
  .then(user => {
    console.log('✅ Usuario creado exitosamente:');
    console.log('   Email:', user.email);
    console.log('   Nombre:', user.name);
    console.log('   Rol:', user.role);
    console.log('   Contraseña:', newUser.password);
    return prisma.\$disconnect();
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
    prisma.\$disconnect();
  });
"
```

---

## 📝 Roles del Sistema

| Rol | Clave | Descripción |
|-----|-------|-------------|
| **Administrador** | `admin` | Acceso total al sistema |
| **Gestor de Cobranza** | `gestor_cobranza` | Gestiona cobradores y rutas |
| **Cobrador** | `cobrador` | Cobra en campo y registra pagos |
| **Reportes** | `reporte_cobranza` | Solo consulta reportes |

---

## 🔐 Seguridad

### ⚠️ IMPORTANTE: Cambiar Contraseñas por Defecto

**Las contraseñas por defecto deben ser cambiadas en producción:**

1. Inicia sesión con el usuario admin
2. Ve a **Dashboard → Usuarios**
3. Haz clic en el usuario que quieres modificar
4. Cambia la contraseña
5. Guarda los cambios

### 🛡️ Recomendaciones de Seguridad

- ✅ Usa contraseñas de al menos 8 caracteres
- ✅ Combina letras, números y símbolos
- ✅ No compartas las credenciales de admin
- ✅ Desactiva usuarios que ya no trabajen en la empresa
- ✅ Revisa regularmente los accesos al sistema

---

## 🎯 Uso Recomendado

### Para Pruebas/Desarrollo
Puedes usar cualquier usuario, pero se recomienda:
- **Admin:** `admin@economica.local` / `admin123`

### Para Producción
1. Cambia todas las contraseñas por defecto
2. Crea usuarios específicos para cada persona
3. Usa el rol apropiado según las responsabilidades
4. Desactiva los usuarios demo que no uses

---

**Fecha:** 13 de octubre, 2025  
**Sistema:** MUEBLERIA LA ECONOMICA - Gestión de Cobranza  
**Versión:** 1.0
