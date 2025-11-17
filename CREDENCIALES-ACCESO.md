# 🔐 Credenciales de Acceso - VertexERP Muebles

## Usuarios del Sistema

### 👑 Administrador
- **Email**: admin@economica.local
- **Contraseña**: admin123
- **Permisos**: Acceso completo al sistema

### 👤 Gestor de Cobranza
- **Email**: gestor@economica.local
- **Contraseña**: gestor123
- **Permisos**: Gestión de clientes y cobradores

### 📊 Reportes
- **Email**: reportes@economica.local
- **Contraseña**: reportes123
- **Permisos**: Solo lectura y reportes

### 🚚 Gestores de Campo (Cobradores)
1. **ruta0@local.com** / ruta123 - (Código: RUTA0) - 200 clientes: CL1-CL200
2. **ruta1@local.com** / ruta123 - (Código: RUTA1) - 200 clientes: CL201-CL400
3. **ruta2@local.com** / ruta123 - (Código: RUTA2) - 200 clientes: CL401-CL600
4. **ruta3@local.com** / ruta123 - (Código: RUTA3) - 200 clientes: CL601-CL800
5. **ruta4@local.com** / ruta123 - (Código: RUTA4) - 200 clientes: CL801-CL1000

## 📊 Datos del Sistema

- **Total Usuarios**: 8
- **Total Clientes**: 1000
- **Total Pagos Registrados**: 104
- **Plantillas de Ticket**: 2
- **Rutas de Cobranza**: 10

## ⚠️ IMPORTANTE: Solución de Problemas

### Si experimenta problemas de login (redirect loop):

1. **Limpiar cookies del navegador**:
   - Chrome: Settings → Privacy → Clear browsing data → Cookies
   - O usar modo incógnito (Ctrl+Shift+N)

2. **Verificar que la base de datos tiene datos**:
   ```bash
   cd /home/ubuntu/muebleria_la_economica/app
   npx tsx --require dotenv/config scripts/seed.ts
   ```

3. **Reiniciar el servidor de desarrollo**:
   ```bash
   pkill -f "yarn dev"
   cd /home/ubuntu/muebleria_la_economica/app
   yarn dev
   ```

## 🔧 Cambios Aplicados (v1.4.1)

### Correcciones de Autenticación:
1. ✅ Removido `PrismaAdapter` incompatible con `CredentialsProvider`
2. ✅ Simplificado middleware para evitar loops de redirección
3. ✅ Ejecutado seed de base de datos con 1000 clientes de prueba
4. ✅ Configuración JWT optimizada para sesiones

### Archivos Modificados:
- `/lib/auth.ts` - Removido PrismaAdapter
- `/middleware.ts` - Simplificado lógica de redirects

## 📱 URLs de Acceso

- **Login**: http://localhost:3000/login
- **Dashboard**: http://localhost:3000/dashboard
- **Gestión Clientes**: http://localhost:3000/dashboard/clientes
- **Cobranza Móvil**: http://localhost:3000/dashboard/cobranza-mobile

---

**Fecha**: 17 de Noviembre, 2025
**Versión**: 1.4.1
**Sistema**: VertexERP Muebles - Sistema de Cobranza
