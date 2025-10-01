
# 🔐 USUARIOS DE ACCESO - Mueblería La Económica

## 🌐 URL de Acceso

**Producción (EasyPanel):**
- 🔗 https://app.mueblerialaeconomica.com

**Desarrollo Local:**
- 🔗 http://localhost:3000

---

## 👥 Credenciales de Acceso

### 👑 Administrador
- **Email:** `admin@economica.local`
- **Contraseña:** `admin123`
- **Rol:** Administrador
- **Permisos:** Acceso completo al sistema

**Funciones:**
- ✅ Gestión de usuarios
- ✅ Configuración del sistema
- ✅ Acceso a todos los módulos
- ✅ Reportes completos
- ✅ Auditoría del sistema

---

### 👤 Gestor de Cobranza
- **Email:** `gestor@economica.local`
- **Contraseña:** `gestor123`
- **Rol:** Gestor de Cobranza
- **Permisos:** Gestión de cobranza

**Funciones:**
- ✅ Gestión de clientes
- ✅ Asignación de rutas
- ✅ Supervisión de cobradores
- ✅ Reportes de cobranza
- ✅ Configuración de plantillas

---

### 🚚 Cobrador de Campo
- **Email:** `cobrador@economica.local`
- **Contraseña:** `cobrador123`
- **Rol:** Cobrador
- **Permisos:** Registro de pagos

**Funciones:**
- ✅ Ver clientes asignados
- ✅ Registrar pagos
- ✅ Imprimir tickets
- ✅ Rutas de cobranza
- ✅ Historial de pagos

---

### 📊 Usuario de Reportes
- **Email:** `reportes@economica.local`
- **Contraseña:** `reportes123`
- **Rol:** Reportes/Consulta
- **Permisos:** Solo lectura

**Funciones:**
- ✅ Ver reportes generales
- ✅ Consultar clientes
- ✅ Ver estadísticas
- ✅ Exportar información
- ❌ No puede modificar datos

---

## 🎯 Primeros Pasos

### 1. Acceder al Sistema

```
1. Ir a: https://app.mueblerialaeconomica.com
2. Usar cualquiera de los usuarios arriba
3. Explorar el dashboard según tu rol
```

### 2. Cambiar Contraseñas (Recomendado)

**Para seguridad, cambia las contraseñas desde:**
- 👤 Perfil → Cambiar Contraseña

### 3. Verificar Permisos

Cada rol tiene acceso a diferentes módulos:

| Módulo | Admin | Gestor | Cobrador | Reportes |
|--------|-------|--------|----------|----------|
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| Clientes | ✅ | ✅ | 👁️ Ver asignados | 👁️ Solo lectura |
| Pagos | ✅ | ✅ | ✅ Registrar | 👁️ Solo lectura |
| Rutas | ✅ | ✅ | 👁️ Mis rutas | 👁️ Solo lectura |
| Usuarios | ✅ | ❌ | ❌ | ❌ |
| Reportes | ✅ | ✅ | 👁️ Básicos | ✅ |
| Configuración | ✅ | 🔒 Limitado | ❌ | ❌ |

---

## 📱 Acceso Móvil

El sistema es **responsive** y funciona perfectamente en:
- 📱 Smartphones (iOS/Android)
- 📱 Tablets
- 💻 Laptops
- 🖥️ Desktops

**Recomendación para Cobradores:**
- Usar desde smartphone para registrar pagos en campo
- Funciona offline (próximamente)
- Impresión de tickets compatible con impresoras Bluetooth

---

## 🔒 Seguridad

### Mejores Prácticas

1. **Cambiar Contraseñas Predeterminadas**
   - Hazlo inmediatamente en producción
   - Usa contraseñas fuertes (mín. 8 caracteres)

2. **No Compartir Credenciales**
   - Cada usuario debe tener su propia cuenta
   - No usar cuentas compartidas

3. **Cerrar Sesión**
   - Siempre cerrar sesión en dispositivos compartidos
   - La sesión expira automáticamente después de 24 horas

4. **Revisar Actividad**
   - El admin puede ver logs de acceso
   - Auditoría de cambios importantes

---

## 🆘 Problemas Comunes

### No Puedo Iniciar Sesión

**Verificar:**
1. ✅ Email correcto (incluir `@economica.local`)
2. ✅ Contraseña correcta (case-sensitive)
3. ✅ Cuenta activa (el admin puede desactivar usuarios)

**Soluciones:**
```bash
# Si olvidaste la contraseña, contacta al administrador
# O resetea desde el servidor:

docker exec -it muebleria-app-1 npx prisma studio
# Luego edita el usuario manualmente
```

### Sesión Expirada

**Solución:**
- Simplemente vuelve a iniciar sesión
- Las sesiones duran 24 horas

### Sin Permisos para Módulo

**Causa:**
- Tu rol no tiene acceso a ese módulo

**Solución:**
- Contacta al administrador para:
  - Cambiar tu rol
  - O solicitar permisos específicos

---

## 👨‍💻 Administración Avanzada

### Crear Nuevos Usuarios

**Desde el Panel Admin:**
1. Ir a: Dashboard → Usuarios → Nuevo Usuario
2. Llenar formulario:
   - Email
   - Nombre completo
   - Contraseña temporal
   - Rol
3. El usuario debe cambiar la contraseña en primer acceso

### Modificar Roles

**Roles Disponibles:**
- `admin` - Acceso total
- `gestor_cobranza` - Gestión de cobranza
- `cobrador` - Registro de pagos
- `reporte_cobranza` - Solo lectura

### Desactivar Usuarios

**En lugar de eliminar:**
1. Ir a: Usuarios → [Usuario] → Editar
2. Cambiar estado a "Inactivo"
3. El usuario no podrá iniciar sesión

---

## 📊 Datos de Demo

El sistema incluye **200 clientes de demostración** distribuidos así:

- 👥 **200 clientes** con información completa
- 💰 **~50 pagos** de ejemplo en los últimos 30 días
- 🛣️ **10 rutas** de cobranza de ejemplo
- 🎫 **2 plantillas** de ticket predefinidas

### Datos Clave:
- 70% de clientes con saldo pendiente
- 30% al corriente
- 5% de cuentas inactivas
- Ventas de los últimos 6 meses

**Para limpiar datos de demo:**
```bash
# Conectar al servidor
docker exec -it muebleria-app-1 sh

# Ejecutar limpieza
npm run seed
```

---

## 🔄 Resetear Sistema

### Limpiar Todo y Volver a Estado Inicial

```bash
# 1. Conectar al contenedor
docker exec -it muebleria-app-1 sh

# 2. Ejecutar seed (borra todo y recrea)
npm run seed

# Esto:
# ✅ Elimina todos los clientes
# ✅ Elimina todos los pagos
# ✅ Mantiene los 4 usuarios base
# ✅ Crea 200 nuevos clientes de demo
```

---

## 📞 Soporte

### Contacto Técnico
- 📧 Email: [tu-email-soporte]
- 🐛 Issues: [GitHub Issues]
- 📚 Docs: `/home/ubuntu/muebleria_la_economica/`

### Documentación Adicional
- 📘 README-DOCKER.md - Deployment con Docker
- 📗 EASYPANEL-COMPLETE-GUIDE.md - Guía de EasyPanel
- 📙 GUIA-IMPORTACION-DEEPAGENT.md - Importar a otros proyectos

---

## ✅ Checklist Post-Instalación

Después de instalar, verificar:

- [ ] ✅ Puedo acceder con usuario admin
- [ ] ✅ Puedo acceder con usuario gestor
- [ ] ✅ Puedo acceder con usuario cobrador
- [ ] ✅ Puedo acceder con usuario reportes
- [ ] ✅ Dashboard carga correctamente
- [ ] ✅ Puedo ver la lista de clientes
- [ ] ✅ Puedo registrar un pago de prueba
- [ ] ✅ Sistema es responsive en móvil
- [ ] ✅ Cambié las contraseñas predeterminadas

---

## 🎉 ¡Listo para Usar!

El sistema está completamente configurado y listo para producción.

**Siguiente paso:**
1. Accede con el usuario `admin@economica.local`
2. Explora el dashboard
3. Cambia las contraseñas
4. Empieza a trabajar con clientes reales

**¡Éxito con Mueblería La Económica!** 🚀

