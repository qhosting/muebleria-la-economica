
# 🌱 Ejecutar Seed en Producción - Guía Rápida

## 🚀 Inicio Rápido

### Para Contenedores Docker (EasyPanel, Coolify, Docker Compose):

```bash
# Detecta automáticamente el contenedor
./run-seed-docker.sh

# O especifica el contenedor manualmente
./run-seed-docker.sh nombre_del_contenedor
```

### Para Servidor Local/VPS:

```bash
./run-seed-production.sh
```

---

## 🎯 ¿Qué hace el seed?

Crea 4 usuarios esenciales para el sistema:

| Usuario | Email | Password | Rol |
|---------|-------|----------|-----|
| **Administrador** | admin@economica.local | admin123 | admin |
| **Gestor** | gestor@economica.local | gestor123 | gestor_cobranza |
| **Cobrador** | cobrador@economica.local | cobrador123 | cobrador |
| **Reportes** | reportes@economica.local | reportes123 | reporte_cobranza |

---

## ⚡ Ejemplos Prácticos

### EasyPanel

```bash
# Via SSH al servidor
ssh usuario@servidor
cd /ruta/al/proyecto
./run-seed-docker.sh nombre_contenedor_easypanel

# O desde la terminal de EasyPanel directamente
npx tsx --require dotenv/config scripts/seed.ts
```

### Coolify

```bash
# Opción 1: Via interfaz web
# Ve a tu app → Execute Command → Ejecuta:
npx tsx --require dotenv/config scripts/seed.ts

# Opción 2: Via SSH
docker ps | grep muebleria  # Encontrar nombre del contenedor
./run-seed-docker.sh nombre_contenedor
```

### Docker Compose Local

```bash
# Método automático
./run-seed-docker.sh

# Método manual
docker-compose exec app npx tsx --require dotenv/config scripts/seed.ts
```

---

## 🔧 Solución de Problemas

### "tsx: not found"
✅ **Solución:** Los scripts usan `npx tsx` que descarga la herramienta temporalmente.

### "Cannot find module '@prisma/client'"
```bash
docker exec contenedor npx prisma generate
```

### "Can't reach database"
```bash
# Verificar DATABASE_URL
docker exec contenedor env | grep DATABASE_URL

# Verificar conectividad
docker exec contenedor ping host_de_base_de_datos
```

### Seed no crea usuarios
```bash
# Ejecutar migraciones primero
docker exec contenedor npx prisma migrate deploy

# Luego ejecutar seed
./run-seed-docker.sh nombre_contenedor
```

---

## 📖 Documentación Completa

Para más detalles, consulta: [SEED-PRODUCTION-GUIDE.md](./SEED-PRODUCTION-GUIDE.md)

---

## ⚠️ Importante

- **El seed ELIMINA todos los datos existentes** antes de crear nuevos
- **Haz backup antes de ejecutar en producción con datos reales**
- El seed es idempotente (puedes ejecutarlo múltiples veces)

---

## 🆘 Ayuda Adicional

```bash
# Ver contenedores en ejecución
docker ps

# Ver logs del contenedor
docker logs -f nombre_contenedor

# Acceder al contenedor
docker exec -it nombre_contenedor sh

# Dentro del contenedor, ejecutar seed manualmente
npx tsx --require dotenv/config scripts/seed.ts
```

---

**¿Problemas?** Revisa la [guía completa](./SEED-PRODUCTION-GUIDE.md) o los logs del contenedor.
