
# ⚡ EasyPanel - Quick Start Guide

Guía rápida para desplegar en **5 minutos**.

---

## 🚀 Pasos Rápidos

### 1️⃣ Crear Proyecto
```
EasyPanel Dashboard → Create Project → "muebleria-la-economica"
```

### 2️⃣ Agregar PostgreSQL
```
Add Service → Database → PostgreSQL 17
Name: muebleria-postgres
Database: muebleria
Password: [genera una segura]
→ Deploy
```

### 3️⃣ Agregar Aplicación
```
Add Service → App → From GitHub
Repository: tu-usuario/muebleria_la_economica
Branch: main
Build Method: Dockerfile
Port: 3000
→ Next
```

### 4️⃣ Variables de Entorno
```bash
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://postgres:[PASSWORD]@muebleria-postgres:5432/muebleria
NEXTAUTH_URL=https://[TU_DOMINIO]
NEXTAUTH_SECRET=[openssl rand -base64 32]
JWT_SECRET=[openssl rand -base64 32]
```

### 5️⃣ Configurar Dominio
```
Domains → Add Domain → app.mueblerialaeconomica.com
Enable SSL/TLS → Save
```

### 6️⃣ Deploy
```
Review → Deploy → Wait for logs "✓ Ready in XXms"
```

### 7️⃣ Inicializar DB
```
Terminal (en EasyPanel) →
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
```

---

## ✅ Verificación

1. **Health Check**: `https://[TU_DOMINIO]/api/health`
2. **Login**: `https://[TU_DOMINIO]`
3. **Credenciales**: `admin@economica.com` / `admin123`

---

## 📝 DNS Configuration

En tu proveedor de dominio:

```
Type: A
Name: app
Value: [IP de tu servidor EasyPanel]
TTL: 3600
```

---

## 🆘 Troubleshooting

| Problema | Solución |
|----------|----------|
| App no inicia | Verifica logs en EasyPanel → Logs |
| Error DB | Verifica DATABASE_URL y que PostgreSQL esté Running |
| Dominio no resuelve | Espera propagación DNS (5-10 min) |
| 502 Error | Verifica que el puerto sea 3000 |

---

## 📚 Documentación Completa

Para una guía detallada, consulta: **EASYPANEL-DEPLOYMENT-GUIDE.md**

---

🎉 **¡Listo en 5 minutos!**
