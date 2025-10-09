
# 🔐 Solución: Problemas de Login y Funcionalidades Faltantes

**Fecha:** 9 de Octubre, 2025  
**Estado:** 🔍 DIAGNÓSTICO COMPLETO

---

## 🔍 Problemas Reportados

### 1. ❌ No puedo iniciar sesión con las credenciales
**Causa:** Los usuarios no existen en la base de datos de producción.

### 2. ❌ Errores en funcionalidades que no existen:
- No puedo editar citas - **no carga datos de la cita**
- Al crear una nueva cita - **no aparecen clientes**
- Error en `dashboard/services` - **al crear servicios**
- No puedo crear `inventory/products/new`
- Error 404 en `dashboard/commissions`

**Causa:** Estas funcionalidades **NO EXISTEN** en el sistema actual.

---

## 📊 Sistema Actual: Gestión de Cobranza

Este es un **Sistema de Gestión de Cobranza** para mueblería, NO un sistema de:
- ❌ Citas médicas/servicios
- ❌ Inventario de productos
- ❌ Comisiones de ventas

### ✅ Funcionalidades Existentes

| Módulo | Ruta | Funcionalidad |
|--------|------|---------------|
| **Dashboard** | `/dashboard` | Panel principal con métricas |
| **Clientes** | `/dashboard/clientes` | Gestión de clientes deudores |
| **Cobranza** | `/dashboard/cobranza` | Gestión de rutas de cobranza |
| **Morosidad** | `/dashboard/morosidad` | Control de clientes morosos |
| **Pagos** | `/dashboard/pagos` | Registro de pagos recibidos |
| **Rutas** | `/dashboard/rutas` | Asignación de rutas a cobradores |
| **Plantillas** | `/dashboard/plantillas` | Plantillas de tickets |
| **Reportes** | `/dashboard/reportes` | Reportes de cobranza |
| **Usuarios** | `/dashboard/usuarios` | Gestión de usuarios del sistema |
| **Configuración** | `/dashboard/configuracion` | Configuración general |

---

## ✅ Solución 1: Crear Usuarios en Base de Datos

### Opción A: Script Automático (Recomendado)

```bash
cd /home/ubuntu/muebleria_la_economica
chmod +x ejecutar-seed-produccion.sh
./ejecutar-seed-produccion.sh
```

Este script:
1. Verifica la conexión a la base de datos
2. Ejecuta las migraciones necesarias
3. Crea los usuarios esenciales con sus credenciales

### Opción B: Manual desde el Contenedor

Si estás usando Docker/EasyPanel:

```bash
# Entrar al contenedor
docker exec -it <container-name> sh

# Ejecutar el seed
cd /app
npx tsx scripts/seed.ts

# O si tsx no está disponible
npx ts-node scripts/seed.ts
```

### Opción C: Desde tu servidor local

```bash
cd /home/ubuntu/muebleria_la_economica/app

# Asegurarte de tener las variables de entorno
export DATABASE_URL="postgresql://user:pass@host:5432/dbname"

# Ejecutar seed
npx tsx scripts/seed.ts
```

### 👤 Credenciales que se Crearán

Una vez ejecutado el seed, podrás iniciar sesión con:

| Usuario | Email | Contraseña | Rol |
|---------|-------|------------|-----|
| **Admin** | admin@economica.local | admin123 | admin |
| **Gestor** | gestor@economica.local | gestor123 | gestor_cobranza |
| **Cobrador** | cobrador@economica.local | cobrador123 | cobrador |
| **Reportes** | reportes@economica.local | reportes123 | reporte_cobranza |

---

## 🤔 Solución 2: ¿Necesitas las Funcionalidades Faltantes?

### Si NECESITAS agregar estos módulos:

Puedo crear las siguientes funcionalidades nuevas:

#### 📅 Módulo de Citas
- Crear/editar/eliminar citas
- Asignar clientes a citas
- Calendario de citas
- Recordatorios

#### 🛠️ Módulo de Servicios
- Catálogo de servicios
- Precios y descripciones
- Servicios por cliente

#### 📦 Módulo de Inventario/Productos
- Gestión de productos
- Control de stock
- Categorías de productos
- Precios y proveedores

#### 💰 Módulo de Comisiones
- Cálculo de comisiones
- Asignación a cobradores/vendedores
- Reportes de comisiones

### Si NO necesitas estos módulos:

Entonces el sistema actual está completo y funcional. Solo necesitas:
1. Ejecutar el seed para crear los usuarios
2. Iniciar sesión con las credenciales correctas
3. Usar las funcionalidades existentes de cobranza

---

## 🚀 Próximos Pasos

### Paso 1: Solucionar Login ✅

```bash
cd /home/ubuntu/muebleria_la_economica
./ejecutar-seed-produccion.sh
```

### Paso 2: Probar Login

1. Ir a: https://app.mueblerialaeconomica.com/login
2. Usar: `admin@economica.local` / `admin123`
3. Verificar que accedes al dashboard

### Paso 3: Decidir sobre Funcionalidades Adicionales

**Pregunta clave:** ¿Necesitas que agregue los módulos de:
- Citas
- Servicios
- Productos/Inventario
- Comisiones

O el sistema actual de cobranza es suficiente?

---

## 📝 Verificación del Sistema

### Comprobar que el seed funcionó:

```bash
# Entrar a Postgres
psql $DATABASE_URL

# Ver usuarios creados
SELECT id, email, name, role, "isActive" FROM "User";

# Salir
\q
```

Deberías ver los 4 usuarios listados.

### Probar la autenticación:

```bash
cd /home/ubuntu/muebleria_la_economica/app
npx tsx scripts/test-login.ts
```

---

## ⚠️ Notas Importantes

1. **Las contraseñas están hasheadas** con bcrypt (factor 12)
2. **Solo usuarios activos** (`isActive: true`) pueden iniciar sesión
3. **Las sesiones duran 30 días** por defecto
4. **El rol del usuario** determina qué puede ver/hacer en el sistema

---

## 🆘 Si Persisten los Problemas

### Error: "Usuario no encontrado"
- Ejecutar el seed otra vez
- Verificar que el usuario existe en la BD
- Verificar que `isActive = true`

### Error: "Contraseña incorrecta"
- Usar exactamente las contraseñas documentadas
- Verificar que no haya espacios extra
- Considerar resetear la contraseña manualmente

### Error de conexión a BD
- Verificar DATABASE_URL en .env
- Verificar que la base de datos está corriendo
- Verificar conectividad de red

---

## 📞 Información de Contacto

**Sistema:** Mueblería La Económica - Gestión de Cobranza  
**Tipo:** Next.js + PostgreSQL + Prisma  
**Deployment:** EasyPanel  
**URL:** https://app.mueblerialaeconomica.com

