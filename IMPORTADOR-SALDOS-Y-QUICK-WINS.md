
# 🚀 Importador de Saldos y Quick Wins - Mueblería La Económica

## 📋 Resumen Ejecutivo

Se han implementado dos grandes mejoras al sistema:

### 1. **Importador de Saldos**
Sistema completo para actualizar saldos de clientes de forma individual o masiva usando el código de cliente.

### 2. **Quick Wins (Mejoras Rápidas)**
- Búsqueda global instantánea
- Exportación de datos (CSV/JSON)
- Atajos de teclado
- Historial de cambios de saldo

---

## 🎯 1. IMPORTADOR DE SALDOS

### Características Principales

#### ✅ Importación Individual
- Buscar cliente por código
- Actualizar saldo manualmente
- Agregar motivo del ajuste
- Ver historial de cambios

#### ✅ Importación Masiva (CSV)
- Procesar múltiples clientes a la vez
- Formato simple: `codigo,saldo,motivo`
- Reporte detallado de éxitos y fallos
- Validación automática

### 📍 Ubicación
- **URL**: `/dashboard/saldos`
- **Menú**: "Importar Saldos" en el sidebar
- **Permisos**: Solo Admin y Gestor de Cobranza

### 💻 API Endpoints Creados

#### 1. **POST** `/api/saldos/importar`
Importa saldo individual de un cliente.

**Request:**
```json
{
  "codigoCliente": "CLI-001",
  "nuevoSaldo": 1500.00,
  "motivo": "Ajuste inicial"
}
```

**Response:**
```json
{
  "success": true,
  "cliente": {
    "codigoCliente": "CLI-001",
    "nombreCompleto": "Juan Pérez",
    "saldoAnterior": "2000.00",
    "saldoNuevo": "1500.00",
    "diferencia": "-500.00"
  }
}
```

#### 2. **POST** `/api/saldos/importar-lote`
Importa múltiples saldos en una sola operación.

**Request:**
```json
{
  "importes": [
    {
      "codigoCliente": "CLI-001",
      "saldo": 1500.00,
      "motivo": "Ajuste inicial"
    },
    {
      "codigoCliente": "CLI-002",
      "saldo": 2300.50,
      "motivo": "Corrección de saldo"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "totalProcesados": 2,
  "exitosos": 2,
  "fallidos": 0,
  "resultados": {
    "exitosos": [...],
    "fallidos": []
  }
}
```

#### 3. **GET** `/api/saldos/historial?codigoCliente=CLI-001`
Obtiene el historial de ajustes de un cliente.

**Response:**
```json
{
  "success": true,
  "cliente": {
    "codigoCliente": "CLI-001",
    "nombreCompleto": "Juan Pérez",
    "saldoActual": "1500.00"
  },
  "historial": [
    {
      "id": "...",
      "fecha": "2025-10-11T10:00:00Z",
      "saldoAnterior": "2000.00",
      "saldoNuevo": "1500.00",
      "diferencia": "500.00",
      "motivo": "Ajuste inicial",
      "realizadoPor": "Admin Usuario"
    }
  ]
}
```

### 📝 Formato CSV para Importación Masiva

```csv
CLI-001,1500.00,Ajuste inicial
CLI-002,2300.50,Corrección
CLI-003,890.00,Actualización mensual
```

**Formato:**
- Línea 1: `codigoCliente,saldo,motivo`
- Sin encabezados
- Un cliente por línea
- El motivo es opcional

### 🔒 Seguridad y Validaciones

- ✅ Solo usuarios autorizados (Admin, Gestor)
- ✅ Validación de código de cliente
- ✅ Validación de formato de saldo
- ✅ Registro de todos los cambios
- ✅ Historial completo de ajustes
- ✅ Transacciones atómicas

### 📊 Registro de Cambios

Todos los ajustes se registran como pagos tipo "ajuste" con:
- Saldo anterior
- Saldo nuevo
- Diferencia
- Motivo del cambio
- Usuario que realizó el cambio
- Fecha y hora exacta

---

## ⚡ 2. QUICK WINS (MEJORAS RÁPIDAS)

### 🔍 Búsqueda Global

#### Características:
- **Ubicación**: Header de todas las páginas del dashboard
- **Atajo**: `Ctrl + K` (o `Cmd + K` en Mac)
- **Busca en**:
  - Clientes (código, nombre, teléfono)
  - Usuarios (nombre, email) - solo Admin/Gestor
- **Resultados**: Instantáneos con debounce de 300ms
- **Acciones**: Click para navegar al detalle

#### API Endpoint

**GET** `/api/busqueda-global?q=texto`

**Response:**
```json
{
  "success": true,
  "clientes": [
    {
      "id": "...",
      "codigoCliente": "CLI-001",
      "nombreCompleto": "Juan Pérez",
      "telefono": "555-1234",
      "saldoActual": "1500.00",
      "statusCuenta": "activo",
      "cobrador": "Pedro López"
    }
  ],
  "usuarios": [
    {
      "id": "...",
      "name": "Admin Usuario",
      "email": "admin@example.com",
      "role": "admin",
      "isActive": true
    }
  ]
}
```

### 📤 Exportación de Datos

#### Características:
- **Ubicación**: Botón en página de Clientes
- **Formatos**: CSV y JSON
- **Datos incluidos**:
  - Código de cliente
  - Nombre completo
  - Teléfono
  - Dirección
  - Saldo actual
  - Monto de pago
  - Día de pago
  - Periodicidad
  - Status de cuenta
  - Cobrador asignado
  - Fecha de venta
  - Vendedor

#### API Endpoint

**GET** `/api/exportar/clientes?formato=csv`

**Parámetros:**
- `formato`: `csv` o `json` (default: `csv`)

**Response (CSV):**
```csv
"Código Cliente","Nombre","Teléfono","Dirección","Saldo Actual",...
"CLI-001","Juan Pérez","555-1234","Calle 123","1500.00",...
```

**Response (JSON):**
```json
{
  "success": true,
  "clientes": [...]
}
```

### ⌨️ Atajos de Teclado

| Atajo | Acción |
|-------|--------|
| `Ctrl + K` | Abrir búsqueda global |
| `Ctrl + D` | Ir al Dashboard |
| `Ctrl + C` | Ir a Clientes |
| `Ctrl + P` | Ir a Pagos |
| `Ctrl + R` | Ir a Reportes |
| `Shift + ?` | Mostrar ayuda de atajos |
| `Escape` | Cerrar búsqueda/modales |

**Nota:** En Mac, usa `Cmd` en lugar de `Ctrl`

---

## 🛠️ Archivos Creados

### Backend (API Routes)

```
app/app/api/
├── saldos/
│   ├── importar/route.ts          # Importación individual
│   ├── importar-lote/route.ts     # Importación masiva
│   └── historial/route.ts         # Historial de ajustes
├── busqueda-global/route.ts       # Búsqueda global
└── exportar/
    └── clientes/route.ts          # Exportación de clientes
```

### Frontend (Componentes y Páginas)

```
app/
├── app/dashboard/
│   └── saldos/page.tsx            # Página de importación
├── components/
│   ├── busqueda-global.tsx        # Componente de búsqueda
│   └── export-button.tsx          # Botón de exportación
└── hooks/
    ├── use-debounce.ts            # Hook de debounce
    └── use-keyboard-shortcuts.ts   # Hook de atajos
```

### Componentes Actualizados

- `components/layout/sidebar.tsx` - Agregado enlace "Importar Saldos"
- `components/layout/dashboard-layout.tsx` - Agregada búsqueda global en header
- `app/dashboard/clientes/page.tsx` - Agregado botón de exportación

---

## 📖 Guía de Uso

### 1. Importar Saldo Individual

1. Ir a **Importar Saldos** en el menú
2. Ingresar el código del cliente (ej: `CLI-001`)
3. Ingresar el nuevo saldo (ej: `1500.00`)
4. Agregar motivo opcional (ej: `Ajuste inicial`)
5. Click en **Actualizar Saldo**
6. Ver confirmación con saldos anterior y nuevo

### 2. Importar Saldos Masivos

1. Ir a **Importar Saldos** en el menú
2. En la sección **Importación Masiva**
3. Preparar datos en formato CSV:
   ```
   CLI-001,1500.00,Ajuste inicial
   CLI-002,2300.50,Corrección
   ```
4. Pegar en el área de texto
5. Click en **Importar Lote**
6. Ver reporte de éxitos y fallos

### 3. Ver Historial de Ajustes

1. En **Importar Saldos**
2. Ingresar código de cliente
3. Click en botón de **Historial** (ícono reloj)
4. Ver todos los ajustes realizados

### 4. Usar Búsqueda Global

1. Presionar `Ctrl + K` o click en el campo de búsqueda
2. Escribir nombre, código o teléfono del cliente
3. Ver resultados instantáneos
4. Click en resultado para ir al detalle

### 5. Exportar Clientes

1. Ir a **Clientes**
2. Click en botón **Exportar**
3. Seleccionar formato (CSV o JSON)
4. El archivo se descarga automáticamente

---

## 🎨 Interfaz de Usuario

### Página de Importación de Saldos

```
┌─────────────────────────────────────────────────────┐
│ 📊 Importación de Saldos                            │
│ Actualiza los saldos de clientes                    │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌────────────────┐  ┌────────────────────┐        │
│  │ 🔍 Individual  │  │ 📄 Masiva (CSV)    │        │
│  │                │  │                     │        │
│  │ Código Cliente │  │ Datos CSV:         │        │
│  │ [CLI-001    ]  │  │ CLI-001,1500.00... │        │
│  │                │  │ CLI-002,2300.50... │        │
│  │ Nuevo Saldo    │  │                     │        │
│  │ [1500.00    ]  │  │                     │        │
│  │                │  │                     │        │
│  │ Motivo         │  │ [Importar Lote]    │        │
│  │ [           ]  │  │                     │        │
│  │                │  │                     │        │
│  │ [Actualizar] 🕐│  │                     │        │
│  └────────────────┘  └────────────────────┘        │
│                                                      │
│  ┌──────────────────────────────────────────┐      │
│  │ ✅ Resultado                              │      │
│  │                                            │      │
│  │ Cliente: Juan Pérez (CLI-001)             │      │
│  │ Saldo Anterior: $2,000.00                 │      │
│  │ Saldo Nuevo:    $1,500.00                 │      │
│  │ Diferencia:     -$500.00                  │      │
│  └──────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────┘
```

### Búsqueda Global

```
┌─────────────────────────────────────────────────┐
│ 🔍 [Buscar clientes, usuarios... (Ctrl+K)]     │
└─────────────────────────────────────────────────┘
          ↓ (al escribir)
┌─────────────────────────────────────────────────┐
│ Clientes (3)                                    │
│ ┌──────────────────────────────────────────┐   │
│ │ 👤 Juan Pérez                             │   │
│ │    CLI-001 • 555-1234         $1,500.00  │   │
│ │    Cobrador: Pedro López                  │   │
│ └──────────────────────────────────────────┘   │
│                                                  │
│ Usuarios (1)                                    │
│ ┌──────────────────────────────────────────┐   │
│ │ 👤 Admin Usuario                          │   │
│ │    admin@example.com           [admin]   │   │
│ └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

---

## 🔧 Configuración Técnica

### Dependencias Requeridas

Todas las dependencias ya están incluidas en el proyecto:
- `@prisma/client` - Base de datos
- `next-auth` - Autenticación
- `lucide-react` - Iconos
- `sonner` / `react-hot-toast` - Notificaciones

### Variables de Entorno

No se requieren nuevas variables de entorno. El sistema usa la configuración existente.

### Base de Datos

Los ajustes de saldo se registran en la tabla `pagos` con:
- `tipoPago: 'abono'`
- `metodoPago: 'ajuste'`
- `numeroRecibo: 'ADJ-{timestamp}-{codigo}'`

---

## 📊 Casos de Uso

### Caso 1: Ajuste de Saldo Único
**Escenario:** Un cliente pagó $500 en efectivo fuera del sistema.

1. Ir a Importar Saldos
2. Código: `CLI-001`
3. Nuevo saldo: `Saldo actual - 500`
4. Motivo: `Pago en efectivo no registrado`
5. Actualizar

### Caso 2: Corrección Masiva Mensual
**Escenario:** Fin de mes, ajustar 50 clientes con nuevos saldos.

1. Exportar clientes actuales (CSV)
2. Calcular nuevos saldos en Excel
3. Preparar CSV de importación
4. Importar lote
5. Revisar reporte

### Caso 3: Búsqueda Rápida
**Escenario:** Llamada de cliente, necesitas su info rápido.

1. Presionar `Ctrl + K`
2. Escribir nombre o teléfono
3. Click en resultado
4. Ver detalle completo

### Caso 4: Reporte de Clientes
**Escenario:** Gerencia solicita lista de todos los clientes.

1. Ir a Clientes
2. Aplicar filtros si es necesario
3. Click en Exportar → CSV
4. Enviar archivo

---

## ⚠️ Consideraciones Importantes

### Seguridad
- ✅ Solo Admin y Gestor pueden importar saldos
- ✅ Todos los cambios quedan registrados
- ✅ No se puede eliminar el historial
- ✅ Validación de permisos en cada endpoint

### Performance
- ✅ Búsqueda con debounce (no sobrecarga)
- ✅ Paginación en resultados
- ✅ Índices en base de datos
- ✅ Carga asíncrona de datos

### Auditoría
- ✅ Cada ajuste registra quién lo hizo
- ✅ Fecha y hora exacta
- ✅ Saldo anterior y nuevo
- ✅ Motivo del cambio

---

## 🚀 Próximas Mejoras Potenciales

### Corto Plazo
- [ ] Plantillas de ajuste frecuentes
- [ ] Notificaciones al cobrador cuando su cliente cambia saldo
- [ ] Dashboard de ajustes recientes
- [ ] Filtros avanzados en historial

### Mediano Plazo
- [ ] Importación desde Excel directamente
- [ ] Validación de saldos vs pagos
- [ ] Reportes de discrepancias
- [ ] Autorización de dos factores para ajustes grandes

### Largo Plazo
- [ ] IA para detectar patrones de ajuste sospechosos
- [ ] Integración con contabilidad
- [ ] App móvil para aprobar ajustes
- [ ] Blockchain para auditoría inmutable

---

## 📞 Soporte

Para problemas o dudas:
1. Revisar esta documentación
2. Verificar permisos del usuario
3. Revisar logs del servidor
4. Verificar consola del navegador

### Logs Importantes

```bash
# Ver logs de importación
grep "importar saldo" logs/app.log

# Ver logs de búsqueda
grep "busqueda global" logs/app.log

# Ver logs de exportación
grep "exportar clientes" logs/app.log
```

---

## ✅ Checklist de Implementación

- [x] API de importación individual
- [x] API de importación masiva
- [x] API de historial
- [x] Página de importación
- [x] Búsqueda global
- [x] Exportación de clientes
- [x] Atajos de teclado
- [x] Integración en sidebar
- [x] Integración en dashboard
- [x] Validaciones de seguridad
- [x] Documentación completa

---

## 🎉 Conclusión

Este sistema proporciona:

1. **Control Total**: Importa y ajusta saldos de forma precisa
2. **Productividad**: Búsqueda global y atajos de teclado
3. **Transparencia**: Historial completo de todos los cambios
4. **Eficiencia**: Exportación rápida de datos
5. **Seguridad**: Permisos y auditoría completa

**¡Todo listo para usar en producción!** 🚀

---

*Documento generado: 11 de Octubre, 2025*
*Versión: 1.0.0*
*Sistema: Mueblería La Económica - Gestión de Cobranza*
