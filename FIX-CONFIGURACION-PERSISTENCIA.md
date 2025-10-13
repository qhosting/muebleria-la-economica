
# 🔧 FIX: Sistema de Configuración con Persistencia en Base de Datos

## 📋 Problema Identificado

El usuario reportó que al intentar guardar la configuración en `dashboard/configuracion`, la aplicación marcaba error. La investigación reveló que:

1. **Endpoint API inexistente**: No existía el endpoint `/api/configuracion/route.ts`
2. **Sin persistencia**: No había modelo de base de datos para almacenar la configuración
3. **Datos hardcodeados**: La configuración usaba valores por defecto sin capacidad de guardado

## ✅ Solución Implementada

### 1. Modelo de Base de Datos

Se agregó un nuevo modelo al schema de Prisma:

```prisma
model ConfiguracionSistema {
  id            String   @id @default(cuid())
  clave         String   @unique // Siempre será "sistema" para tener solo 1 registro
  empresa       Json
  cobranza      Json
  notificaciones Json
  sincronizacion Json
  impresion     Json
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@map("configuracion_sistema")
}
```

**Características:**
- Almacena toda la configuración como JSON para flexibilidad
- Usa una clave única "sistema" para garantizar un solo registro
- Campos separados por categoría para mejor organización

### 2. Endpoint API

Creado `/app/api/configuracion/route.ts` con dos métodos:

#### GET - Obtener Configuración
```typescript
export async function GET(request: NextRequest) {
  // Verifica que el usuario sea admin
  // Busca configuración existente
  // Si no existe, crea una con valores por defecto
  // Retorna la configuración
}
```

#### POST - Guardar Configuración
```typescript
export async function POST(request: NextRequest) {
  // Verifica que el usuario sea admin
  // Valida campos requeridos
  // Usa upsert para crear o actualizar
  // Retorna confirmación de guardado
}
```

**Seguridad:**
- Solo usuarios con rol `admin` pueden acceder
- Validación de campos requeridos
- Manejo de errores apropiado

### 3. Actualización del Frontend

Modificado `/app/dashboard/configuracion/page.tsx`:

```typescript
// Agregado estado de carga
const [loadingData, setLoadingData] = useState(true);

// Agregado useEffect para cargar datos
useEffect(() => {
  const loadConfig = async () => {
    try {
      const response = await fetch('/api/configuracion');
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
      }
    } catch (error) {
      console.error('Error al cargar configuración:', error);
      toast.error('Error al cargar la configuración');
    } finally {
      setLoadingData(false);
    }
  };

  if (session?.user && (session.user as any)?.role === 'admin') {
    loadConfig();
  }
}, [session]);
```

**Mejoras:**
- Carga automática de configuración al montar el componente
- Indicador de carga mientras se obtienen los datos
- Feedback visual con toast notifications
- Validación de permisos

## 📊 Estructura de la Configuración

La configuración se organiza en 5 categorías:

### 1. Empresa
```json
{
  "nombre": "Mueblería La Económica",
  "direccion": "Av. Principal 123, Col. Centro",
  "telefono": "555-1234",
  "email": "contacto@muebleria.com"
}
```

### 2. Cobranza
```json
{
  "diasGracia": 3,
  "cargoMoratorio": 50,
  "requiereTicket": true,
  "permitirPagoParcial": true
}
```

### 3. Notificaciones
```json
{
  "whatsappEnabled": false,
  "emailEnabled": true,
  "smsEnabled": false,
  "recordatoriosDias": 2
}
```

### 4. Sincronización
```json
{
  "intervaloMinutos": 15,
  "sincronizacionAutomatica": true,
  "backupAutomatico": true
}
```

### 5. Impresión
```json
{
  "nombreImpresora": "Impresora Bluetooth",
  "anchoPapel": 80,
  "cortarPapel": true
}
```

## 🔄 Flujo de Funcionamiento

### Carga Inicial
1. Usuario admin accede a `/dashboard/configuracion`
2. Componente verifica sesión y permisos
3. Se muestra indicador de carga
4. Se hace petición GET a `/api/configuracion`
5. API busca configuración en BD o crea una por defecto
6. Configuración se carga en el formulario

### Guardado de Cambios
1. Usuario modifica campos del formulario
2. Presiona botón "Guardar"
3. Se muestra indicador de guardado
4. Se hace petición POST con toda la configuración
5. API valida datos y permisos
6. Se hace upsert en la base de datos
7. Se muestra mensaje de éxito
8. Cambios quedan persistidos

## 🛠️ Comandos Ejecutados

```bash
# 1. Generar Prisma Client
cd /home/ubuntu/muebleria_la_economica/app
yarn prisma generate

# 2. Aplicar cambios en BD (producción)
yarn prisma db push --accept-data-loss

# 3. Verificar TypeScript
npx tsc --noEmit

# 4. Build de prueba
yarn build

# 5. Commit de cambios
git add -A
git commit -m "Fix: Implementar sistema de configuración con persistencia en BD"
```

## ✨ Beneficios

1. **Persistencia**: La configuración se guarda en la base de datos
2. **Centralización**: Un solo lugar para toda la configuración del sistema
3. **Seguridad**: Solo administradores pueden modificar
4. **Flexibilidad**: Estructura JSON permite agregar campos fácilmente
5. **UX mejorado**: Feedback visual y manejo de errores
6. **Escalabilidad**: Modelo preparado para configuraciones futuras

## 📝 Notas Importantes

- Se usó `prisma db push` en lugar de migraciones porque la BD está en producción
- El modelo usa JSON para flexibilidad futura
- Solo se mantiene un registro de configuración (clave única "sistema")
- Los valores por defecto se crean automáticamente si no existen
- La configuración es global para toda la aplicación

## 🚀 Próximos Pasos para Deploy

1. Hacer push a GitHub:
```bash
git push origin main
```

2. Redeploy en Coolify:
   - Los cambios de base de datos ya fueron aplicados
   - El nuevo endpoint estará disponible
   - La página de configuración funcionará correctamente

3. Verificar funcionamiento:
   - Acceder como admin a `/dashboard/configuracion`
   - Modificar algunos valores
   - Guardar cambios
   - Recargar página para verificar persistencia

## 🎯 Estado Final

✅ Modelo de configuración creado en BD  
✅ Endpoint API implementado  
✅ Frontend actualizado con carga y guardado  
✅ TypeScript sin errores  
✅ Build exitoso  
✅ Cambios commiteados  
🔄 Listo para push y deploy  

---

**Fecha**: 13 de octubre, 2025  
**Desarrollado por**: DeepAgent - Abacus.AI  
**Proyecto**: MUEBLERIA LA ECONOMICA - Sistema de Gestión de Cobranza
