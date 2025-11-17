# 📊 Resumen de Datos - Sistema Mueblería La Económica

## 🎯 Datos Creados Exitosamente

### 👥 Usuarios (8 en total)

#### Usuarios Administrativos (3)
1. **Admin Principal**
   - Email: `admin@economica.local`
   - Password: `admin123`
   - Rol: Administrador
   - Función: Gestión completa del sistema

2. **Gestor de Cobranza**
   - Email: `gestor@economica.local`
   - Password: `gestor123`
   - Rol: Gestor de Cobranza
   - Función: Supervisión de cobradores y rutas

3. **Usuario de Reportes**
   - Email: `reportes@economica.local`
   - Password: `reportes123`
   - Rol: Reportes
   - Función: Consulta y generación de reportes

#### 🚚 Gestores de Campo (5)

| # | Email | Password | Código Gestor | Clientes Asignados | Rango Clientes |
|---|-------|----------|---------------|-------------------|----------------|
| 1 | `ruta0@local.com` | `ruta123` | **RUTA0** | 200 | CL1 - CL200 |
| 2 | `ruta1@local.com` | `ruta123` | **RUTA1** | 200 | CL201 - CL400 |
| 3 | `ruta2@local.com` | `ruta123` | **RUTA2** | 200 | CL401 - CL600 |
| 4 | `ruta3@local.com` | `ruta123` | **RUTA3** | 200 | CL601 - CL800 |
| 5 | `ruta4@local.com` | `ruta123` | **RUTA4** | 200 | CL801 - CL1000 |

---

### 👥 Clientes (1000 en total)

#### Especificaciones de los Clientes

- **Códigos**: CL1, CL2, CL3, ..., CL1000
- **Nombres**: CL1, CL2, CL3, ..., CL1000
- **Vendedor**: TIENDA (todos)
- **Saldo Actual**: $5,000.00 (todos)
- **Monto de Pago**: $500.00 semanal
- **Periodicidad**: Semanal
- **Total del Crédito**: $10,000.00
- **Estado**: Activo

#### Distribución por Gestor

```
RUTA0: 200 clientes (CL1 - CL200)
RUTA1: 200 clientes (CL201 - CL400)
RUTA2: 200 clientes (CL401 - CL600)
RUTA3: 200 clientes (CL601 - CL800)
RUTA4: 200 clientes (CL801 - CL1000)
```

#### Detalles Adicionales de Clientes

- **Teléfonos**: Generados aleatoriamente (formato 555-XXXX)
- **Direcciones**: Calles y colonias variadas de manera aleatoria
- **Productos**: Muebles variados (Salas, Recámaras, Comedores, etc.)
- **Días de Pago**: Distribuidos entre Lunes (1) a Domingo (7)
- **Fechas de Venta**: Últimos 180 días (aleatorio)

---

### 💰 Pagos (104 en total)

- **Pagos de Ejemplo**: 4 pagos iniciales
- **Pagos Aleatorios**: 100 pagos distribuidos en los últimos 30 días
- **Tipos de Pago**:
  - Regular: ~90%
  - Moratorio: ~10%
- **Tickets Impresos**: ~80%

---

### 🛣️ Rutas de Cobranza (10 en total)

- Distribuidas aleatoriamente entre los gestores de campo
- Últimos 30 días
- Clientes visitados por ruta: 3-10
- Total cobrado por ruta: $1,000 - $4,000

---

### 🎫 Plantillas de Ticket (2)

1. **Ticket Estándar**
   - Formato completo con todos los detalles
   - Estado: Activo

2. **Ticket Compacto**
   - Formato reducido para impresión rápida
   - Estado: Activo

---

## 📈 Estadísticas Generales

- **Total de Usuarios**: 8
- **Total de Clientes**: 1,000
- **Total de Pagos**: 104
- **Total de Rutas**: 10
- **Plantillas de Ticket**: 2

### Valor Total del Sistema

- **Saldo Total de Clientes**: $5,000,000 (1,000 clientes × $5,000)
- **Créditos Totales Otorgados**: $10,000,000 (1,000 clientes × $10,000)
- **Cobranza Semanal Esperada**: $500,000 (1,000 clientes × $500)

---

## 🔄 Cómo Re-ejecutar el Seed

Si necesitas volver a crear los datos desde cero:

```bash
cd /home/ubuntu/muebleria_la_economica/app
npx tsx --require dotenv/config scripts/seed.ts
```

**⚠️ ADVERTENCIA**: Este comando eliminará TODOS los datos existentes y creará nuevos datos.

---

## 🚀 Próximos Pasos

1. **Verificar en el Dashboard**:
   - Accede con `admin@economica.local` / `admin123`
   - Revisa la lista de clientes en `/dashboard/clientes`
   - Verifica los usuarios en `/dashboard/usuarios`

2. **Probar con Gestores de Campo**:
   - Inicia sesión con cualquier ruta (ej: `ruta0@local.com` / `ruta123`)
   - Verifica que solo veas tus 200 clientes asignados
   - Prueba registrar pagos

3. **Desplegar en Coolify**:
   - Los cambios ya están en GitHub
   - Coolify detectará el nuevo commit
   - Los datos se generarán automáticamente en el primer despliegue

---

## 📝 Notas Importantes

- Todos los gestores de campo comparten la misma contraseña: `ruta123`
- Los códigos de gestor (RUTA0-RUTA4) son importantes para la asignación automática de clientes
- Cada gestor tiene exactamente 200 clientes asignados
- El saldo de $5,000 por cliente es consistente para todos

---

**Fecha de Creación**: $(date '+%Y-%m-%d %H:%M:%S')
**Script de Seed**: `/app/scripts/seed.ts`
**Última Actualización**: Push a GitHub completado exitosamente
