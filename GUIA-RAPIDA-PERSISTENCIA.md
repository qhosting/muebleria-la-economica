
# 🚀 Guía Rápida: Persistencia y Respaldos

## Mueblería La Económica

---

## ✅ Estado de la Configuración

Tu aplicación ya está configurada con:

- ✅ **Volumen persistente de PostgreSQL** - Los datos NO se perderán en deploys
- ✅ **Seed inteligente** - Solo inserta datos si no existen
- ✅ **Sistema de respaldos** - Scripts listos para usar
- ✅ **Validación automática** - Verifica la configuración en cualquier momento

---

## 📝 Comandos Esenciales

### 1. Validar Configuración

```bash
./validate-persistence.sh
```

**Cuándo usar**: Antes del primer deploy o cuando tengas dudas sobre la configuración.

### 2. Ejecutar Seed Seguro (Producción)

```bash
./run-seed-safe.sh
```

**Cuándo usar**: 
- ✅ Primera vez que inicias la aplicación
- ✅ Cuando necesites usuarios esenciales
- ✅ En cualquier momento en producción

**NO hace**:
- ❌ NO elimina datos existentes
- ❌ NO crea datos de demo
- ❌ NO afecta clientes ni pagos existentes

**SÍ hace**:
- ✅ Crea usuarios esenciales si no existen
- ✅ Crea plantillas de ticket si no existen
- ✅ Preserva TODOS los datos de producción

### 3. Crear Respaldo

```bash
./backup-database.sh
```

**Cuándo usar**:
- ✅ Antes de migraciones de base de datos
- ✅ Antes de cambios importantes
- ✅ Regularmente (o usa respaldos automáticos)

### 4. Configurar Respaldos Automáticos

```bash
./cron-backup.sh
```

**Cuándo usar**: Una sola vez, después del primer deploy exitoso.

**Opciones recomendadas**:
- **Aplicación con uso moderado**: Opción 1 (Diario a las 2:00 AM)
- **Aplicación activa**: Opción 2 (Cada 12 horas)
- **Aplicación crítica**: Opción 3 (Cada 6 horas)

### 5. Restaurar desde Respaldo

```bash
./restore-database.sh
```

**⚠️ CUIDADO**: Esto eliminará los datos actuales.

**Cuándo usar**:
- 🆘 Recuperación de desastres
- 🔙 Revertir cambios problemáticos
- 🧪 Restaurar estado conocido en desarrollo

---

## 🎯 Flujo de Trabajo Recomendado

### Para el Primer Deploy

```bash
# 1. Validar configuración
./validate-persistence.sh

# 2. Iniciar servicios
docker compose up -d

# 3. Ejecutar seed seguro (crea usuarios esenciales)
./run-seed-safe.sh

# 4. Crear primer respaldo
./backup-database.sh

# 5. Configurar respaldos automáticos
./cron-backup.sh
```

### Para Deploys Subsecuentes

```bash
# 1. Crear respaldo antes del deploy
./backup-database.sh

# 2. Hacer el deploy
docker compose up -d --build

# 3. Verificar que todo funcione
./validate-persistence.sh
```

### Si Algo Sale Mal

```bash
# 1. Detener servicios
docker compose down

# 2. Restaurar desde respaldo
./restore-database.sh

# 3. Reiniciar servicios
docker compose up -d
```

---

## 🔐 Usuarios Creados por Seed Seguro

| Usuario | Email | Contraseña | Rol |
|---------|-------|------------|-----|
| Admin | `admin@economica.local` | `admin123` | admin |
| Gestor | `gestor@economica.local` | `gestor123` | gestor_cobranza |
| Cobrador | `cobrador@economica.local` | `cobrador123` | cobrador |
| Reportes | `reportes@economica.local` | `reportes123` | reporte_cobranza |

**⚠️ IMPORTANTE**: Cambia estas contraseñas después del primer login.

---

## 📊 Verificar Estado de la Base de Datos

### Desde el Host

```bash
# Ver estado de contenedores
docker compose ps

# Ver logs de PostgreSQL
docker compose logs -f postgres

# Ver estadísticas de la base de datos
docker compose exec postgres psql -U postgres -d muebleria_db -c "
SELECT 
    'Usuarios' as tabla, COUNT(*) as registros FROM \"User\"
UNION ALL
SELECT 
    'Clientes' as tabla, COUNT(*) as registros FROM \"Cliente\"
UNION ALL
SELECT 
    'Pagos' as tabla, COUNT(*) as registros FROM \"Pago\";
"
```

### Verificar Respaldos

```bash
# Ver respaldos disponibles
ls -lh backups/

# Ver el último respaldo
ls -lh backups/latest.sql.gz

# Ver log de respaldos automáticos
tail -f backups/backup.log
```

---

## ❓ FAQ

### ¿Los datos se perderán en cada deploy?

**NO**. Los datos están en un volumen persistente de Docker (`postgres_data`) que se mantiene entre deploys.

### ¿Debo ejecutar el seed en cada deploy?

**NO**. El seed seguro detecta si ya hay datos y solo crea lo que falta. Pero no es necesario ejecutarlo en cada deploy, solo la primera vez.

### ¿Qué pasa si ejecuto el seed original por error?

El seed original (`scripts/seed.ts`) **SÍ elimina todos los datos**. Si esto ocurre:

1. Detén todo inmediatamente
2. Ejecuta `./restore-database.sh`
3. Selecciona el último respaldo
4. En el futuro, usa solo `./run-seed-safe.sh`

### ¿Dónde están los respaldos?

En el directorio `backups/` del proyecto. Los archivos tienen el formato:

```
backup_2025-10-09_14-30-00.sql.gz
```

### ¿Cuántos respaldos se mantienen?

Por defecto, se mantienen los últimos **30 respaldos**. Los más antiguos se eliminan automáticamente.

### ¿Puedo cambiar la frecuencia de respaldos automáticos?

Sí, ejecuta nuevamente `./cron-backup.sh` y selecciona una opción diferente.

### ¿Cómo desactivo los respaldos automáticos?

```bash
crontab -e
# Elimina la línea que contiene: cron-backup-wrapper.sh
```

---

## 🆘 Comandos de Emergencia

### Recuperar Datos Perdidos

```bash
./restore-database.sh
# Selecciona el respaldo más reciente
```

### Verificar Integridad de Respaldos

```bash
gunzip -t backups/*.sql.gz
```

### Ver Qué Hay en un Respaldo

```bash
gunzip -c backups/latest.sql.gz | head -100
```

### Crear Respaldo Urgente

```bash
./backup-database.sh
# Guarda el nombre del archivo que genera
```

---

## 📖 Documentación Completa

Para información más detallada, consulta:

- 📄 **[PERSISTENCIA-Y-RESPALDOS.md](./PERSISTENCIA-Y-RESPALDOS.md)** - Documentación completa
- 📄 **[list-seed-resources.sh](./list-seed-resources.sh)** - Lista de usuarios y recursos

---

## ✅ Checklist Post-Deploy

Después de cada deploy, verifica:

- [ ] Los contenedores están corriendo: `docker compose ps`
- [ ] La aplicación responde: `curl http://localhost:3000/api/health`
- [ ] Puedes hacer login con los usuarios esenciales
- [ ] Los respaldos automáticos están funcionando: `crontab -l`
- [ ] El último respaldo es reciente: `ls -lh backups/latest.sql.gz`

---

**Proyecto**: Mueblería La Económica  
**Versión**: 1.0.0  
**Última actualización**: 9 de octubre de 2025

---
