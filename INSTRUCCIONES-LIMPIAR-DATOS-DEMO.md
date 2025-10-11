# 🧹 INSTRUCCIONES: Limpiar Datos Demo en Producción

## 🎯 Objetivo

Después del próximo deploy en Coolify, necesitas **eliminar todos los datos demo** para empezar con datos reales de producción.

---

## ⏱️ CUÁNDO Hacerlo

**Después del próximo deploy exitoso en Coolify**

Los cambios que acabamos de pushear incluyen:
- ✅ Seed automático desactivado
- ✅ Scripts de limpieza creados
- ✅ Documentación completa

**IMPORTANTE:** Espera a que Coolify haga el deploy y la app esté funcionando.

---

## 📋 PASOS PARA LIMPIAR DATOS DEMO

### Opción 1: Usando el Script (RECOMENDADO)

#### 1. Conectarse al Container de Coolify

```bash
# Desde tu servidor donde está Coolify, o desde la interfaz de Coolify
docker ps | grep muebleria

# Conectarse al container (reemplaza CONTAINER_ID con el ID real)
docker exec -it CONTAINER_ID sh
```

**O desde la interfaz de Coolify:**
- Ve a tu aplicación "muebleria-la-economica"
- Click en **"Console"** o **"Terminal"**
- Se abrirá una terminal dentro del container

#### 2. Ejecutar el Script de Limpieza

```bash
cd /app
sh clean-demo-data.sh
```

#### 3. Confirmar la Limpieza

- El script te mostrará qué datos se eliminarán
- Escribe **`SI`** (en mayúsculas) para confirmar
- Espera a que termine

#### 4. Verificar

```bash
# Debería mostrar:
✅ ¡Limpieza completada exitosamente!

📊 Resumen:
   - Todos los datos demo han sido eliminados
   - Usuario admin mantenido: admin@admin.com
```

---

### Opción 2: Usando SQL Directamente

Si prefieres más control, puedes ejecutar el SQL directamente:

#### 1. Conectarse a PostgreSQL

```bash
# Con psql (si tienes acceso directo a la BD)
psql "postgresql://usuario:password@host:5432/database"
```

#### 2. Ejecutar los Comandos SQL

```sql
BEGIN;

-- Eliminar todos los pagos
DELETE FROM "Payment";

-- Eliminar todos los abonos
DELETE FROM "Abono";

-- Eliminar todas las ventas
DELETE FROM "Venta";

-- Eliminar todos los clientes
DELETE FROM "Cliente";

-- Eliminar todos los productos
DELETE FROM "Producto";

-- Eliminar todos los proveedores
DELETE FROM "Proveedor";

-- Eliminar todos los gastos
DELETE FROM "Gasto";

-- Eliminar categorías de gastos
DELETE FROM "CategoriaGasto";

-- Eliminar usuarios que NO sean admin
DELETE FROM "User" WHERE email != 'admin@admin.com';

COMMIT;

-- Verificar
SELECT 'CLIENTES' as tabla, COUNT(*) as registros FROM "Cliente"
UNION ALL SELECT 'PRODUCTOS', COUNT(*) FROM "Producto"
UNION ALL SELECT 'VENTAS', COUNT(*) FROM "Venta"
UNION ALL SELECT 'USUARIOS', COUNT(*) FROM "User";
```

---

## ✅ VERIFICACIÓN Post-Limpieza

### 1. Verificar en la App

1. Ve a: **https://app.mueblerialaeconomica.com/login**
2. Inicia sesión con:
   - Email: `admin@admin.com`
   - Password: `admin123`
3. Revisa cada sección:
   - **Clientes**: Debe estar vacío ✅
   - **Productos**: Debe estar vacío ✅
   - **Ventas**: Debe estar vacío ✅
   - **Proveedores**: Debe estar vacío ✅
   - **Gastos**: Debe estar vacío ✅

### 2. Verificar en Logs

```bash
# Si usaste el script, los logs deberían mostrar:
CLIENTES    | 0
PRODUCTOS   | 0
PROVEEDORES | 0
VENTAS      | 0
ABONOS      | 0
PAGOS       | 0
GASTOS      | 0
USUARIOS    | 1  ← Solo el admin
```

---

## 🚀 EMPEZAR CON DATOS REALES

Después de limpiar los datos demo, puedes empezar a capturar datos reales:

### 1. Crear Categorías de Gastos (si las necesitas)

- Ve a: **Finanzas** → **Categorías de Gastos**
- Crea categorías como:
  - Renta
  - Servicios (luz, agua, internet)
  - Sueldos
  - Materiales
  - Etc.

### 2. Agregar Proveedores

- Ve a: **Proveedores** → **Nuevo Proveedor**
- Agrega tus proveedores reales

### 3. Agregar Productos

- Ve a: **Inventario** → **Nuevo Producto**
- Agrega tu inventario real

### 4. Agregar Clientes

- Ve a: **Clientes** → **Nuevo Cliente**
- Agrega tus clientes reales

### 5. Registrar Ventas

- Ve a: **Ventas** → **Nueva Venta**
- Registra tus ventas reales

---

## 🔒 GARANTÍA DE PERSISTENCIA

Después de limpiar los datos demo, **TODOS los datos que captures serán persistentes**:

- ✅ **En cada deploy**: Los datos se mantienen
- ✅ **Force deploy**: Los datos se mantienen
- ✅ **Restart container**: Los datos se mantienen
- ✅ **Update código**: Los datos se mantienen

**¿Por qué?**
- El seed automático está **DESACTIVADO**
- La base de datos PostgreSQL es **EXTERNA** al container
- Solo el esquema se actualiza, **no los datos**

---

## ⚠️ IMPORTANTE: Verificar en Logs

Después del deploy, verifica que en los logs de Coolify aparezca:

```
✅ CORRECTO:
🚫 Seed automático DESACTIVADO (modo producción)
ℹ️  Los datos existentes serán preservados

❌ INCORRECTO (si ves esto, avísame):
🌱 Seeding database...
✅ Database seeded successfully
```

Si ves el mensaje incorrecto, **NO limpies los datos** y contáctame.

---

## 🐛 Troubleshooting

### Error: "DATABASE_URL no está configurada"

**Solución:**
```bash
# Configurar la variable antes de ejecutar el script
export DATABASE_URL="postgresql://usuario:password@host:5432/database"

# Ejecutar script nuevamente
sh clean-demo-data.sh
```

### Error: "psql: command not found"

**No te preocupes**, el script automáticamente intentará usar Prisma en su lugar.

Solo asegúrate de estar en el directorio correcto:
```bash
cd /app
sh clean-demo-data.sh
```

### Error: Los datos no se eliminaron

**Verifica:**
1. ¿Se ejecutó el script sin errores?
2. ¿Apareció "✅ ¡Limpieza completada exitosamente!"?
3. ¿Refrescaste la página de la app?

Si el problema persiste, intenta la **Opción 2** (SQL directo).

---

## 📞 Soporte

Si tienes problemas:

1. **Copia los logs** del script
2. **Toma screenshots** de lo que ves
3. **Describe el problema** específicamente
4. Comparte la información conmigo

---

## 📊 Resumen del Flujo

```
1. ⏳ Esperar próximo deploy en Coolify
   ↓
2. ✅ Verificar que el deploy fue exitoso
   ↓
3. 🔍 Verificar logs: "Seed automático DESACTIVADO"
   ↓
4. 🧹 Ejecutar clean-demo-data.sh
   ↓
5. ✅ Confirmar con "SI"
   ↓
6. 🎯 Verificar datos limpiados en la app
   ↓
7. 🚀 Empezar a capturar datos reales
   ↓
8. 🔒 ¡Datos persistentes para siempre!
```

---

## 🎉 Checklist Final

Marca cuando completes cada paso:

- [ ] Deploy completado en Coolify
- [ ] Logs verificados (sin seed automático)
- [ ] Script de limpieza ejecutado
- [ ] Datos demo eliminados verificados en app
- [ ] Solo usuario admin existe
- [ ] Categorías de gastos creadas
- [ ] Primer proveedor agregado
- [ ] Primer producto agregado
- [ ] Primer cliente agregado
- [ ] Primera venta registrada
- [ ] Redeploy de prueba ejecutado
- [ ] Datos persisten después del redeploy ✅

---

**Fecha:** 2025-10-11  
**Versión:** 1.0  
**Autor:** Sistema MUEBLERIA LA ECONOMICA

---

**¡Tu sistema está listo para producción! Solo falta limpiar los datos demo después del próximo deploy.** 🎉
