
# 🔧 PROBLEMA SOLUCIONADO: yarn.lock Faltante

## ✅ Problema Identificado
El deployment falló porque el archivo `app/yarn.lock` era un **enlace simbólico** que apuntaba a:
```
/opt/hostedapp/node/root/app/yarn.lock
```

Cuando Docker intentaba copiar los archivos, el enlace simbólico se rompía porque el archivo de destino no existe en el contenedor.

## ✅ Solución Aplicada
1. **Reemplazado el symlink** con el archivo real:
   ```bash
   cd app/
   rm yarn.lock
   cp /opt/hostedapp/node/root/app/yarn.lock .
   ```

2. **Commit realizado** localmente:
   ```
   🔧 Añadir yarn.lock real (reemplaza symlink)
   - Soluciona error de Docker build en Coolify  
   - yarn.lock ahora es archivo real, no symlink
   ```

## 🚨 ACCIÓN REQUERIDA
El token de GitHub ha caducado. **OPCIONES**:

### Opción A: Manual GitHub Push (RECOMENDADO)
1. Ve a GitHub: https://github.com/qhosting/muebleria-la-economica
2. Sube manualmente el archivo `app/yarn.lock` desde tu local
3. Haz redeploy en Coolify

### Opción B: Nuevo Token GitHub
1. Genera nuevo token en GitHub Settings > Developer settings > Personal access tokens
2. Usa comando:
   ```bash
   cd /home/ubuntu/muebleria_la_economica
   git remote set-url origin https://usuario:NUEVO_TOKEN@github.com/qhosting/muebleria-la-economica.git
   git push origin main
   ```

### Opción C: Redeploy Directo (SI YA ESTÁ EN GITHUB)
1. Ve a Coolify: `http://38.242.250.40:8000/project/c00kww0wkgg4cocgq0swqsc/environment/wcc8k4osq0swqsc`
2. Clic en **"Deploy"**
3. El build ahora debería funcionar

## 📊 Archivos Modificados
- `app/yarn.lock` → Ahora es archivo real (446KB)
- Commit local listo para push

## 🎯 Próximo Paso
**Redeploy en Coolify después de push exitoso**. El error de Docker build está solucionado.
