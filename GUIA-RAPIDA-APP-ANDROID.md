# 🚀 Guía Rápida - Crear App Nativa Android

**Tiempo estimado:** 1-2 semanas  
**Dificultad:** Media  
**Costo:** $25 USD (Google Play Developer Account)

---

## ⚡ Inicio Rápido (5 minutos)

### Opción A: Script Automatizado (Recomendado)

```bash
# 1. Ir al directorio de la app
cd app

# 2. Ejecutar script de configuración
bash ../setup-capacitor.sh

# 3. Abrir Android Studio
npm run cap:open:android

# 4. ¡Listo! Ejecutar en emulador o dispositivo
```

### Opción B: Manual

```bash
# 1. Instalar Capacitor
cd app
npm install @capacitor/core @capacitor/cli

# 2. Inicializar
npx cap init "VertexERP Muebles" "com.vertexerp.muebles" --web-dir=out

# 3. Agregar Android
npm install @capacitor/android
npx cap add android

# 4. Build y sincronizar
npm run build
npx cap sync

# 5. Abrir Android Studio
npx cap open android
```

---

## 📋 Requisitos Previos

### Software Necesario

✅ **Node.js 18+** - Ya instalado  
✅ **Android Studio** - [Descargar aquí](https://developer.android.com/studio)  
✅ **JDK 11+** - Incluido con Android Studio  

### Configuración de Android Studio

1. **Instalar Android Studio**
2. **Abrir SDK Manager** (Tools → SDK Manager)
3. **Instalar:**
   - Android SDK Platform 33 (Android 13)
   - Android SDK Build-Tools 33.0.0
   - Android Emulator
   - Android SDK Platform-Tools

4. **Configurar variables de entorno:**

**Windows (PowerShell):**
```powershell
# Agregar al PATH
$env:ANDROID_HOME = "C:\Users\TuUsuario\AppData\Local\Android\Sdk"
$env:Path += ";$env:ANDROID_HOME\platform-tools"
$env:Path += ";$env:ANDROID_HOME\tools"
```

**Linux/Mac:**
```bash
# Agregar a ~/.bashrc o ~/.zshrc
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
```

---

## 🎯 Flujo de Trabajo Diario

### Desarrollo

```bash
# 1. Desarrollar normalmente en Next.js
npm run dev

# 2. Cuando quieras probar en Android:
npm run build:capacitor
npx cap sync
npx cap run android
```

### Testing Rápido

```bash
# Un solo comando para todo:
npm run android:dev
```

---

## 📱 Probar en Dispositivo Real

### Android

1. **Habilitar modo desarrollador:**
   - Ir a Configuración → Acerca del teléfono
   - Tocar 7 veces en "Número de compilación"

2. **Habilitar depuración USB:**
   - Configuración → Opciones de desarrollador
   - Activar "Depuración USB"

3. **Conectar por USB y ejecutar:**
```bash
npx cap run android
```

---

## 🔧 Plugins Principales

### Bluetooth (Impresoras)

```typescript
import { BluetoothLe } from '@capacitor-community/bluetooth-le';

// Buscar dispositivos
const devices = await BluetoothLe.requestDevice();

// Conectar
await BluetoothLe.connect({ deviceId: device.id });

// Enviar datos
await BluetoothLe.write({
  deviceId: device.id,
  service: 'SERVICE_UUID',
  characteristic: 'CHAR_UUID',
  value: dataBuffer
});
```

### Geolocalización

```typescript
import { Geolocation } from '@capacitor/geolocation';

const position = await Geolocation.getCurrentPosition();
console.log('Lat:', position.coords.latitude);
console.log('Lng:', position.coords.longitude);
```

### Notificaciones Push

```typescript
import { PushNotifications } from '@capacitor/push-notifications';

// Solicitar permisos
await PushNotifications.requestPermissions();

// Registrar
await PushNotifications.register();

// Escuchar notificaciones
PushNotifications.addListener('pushNotificationReceived', (notification) => {
  console.log('Notificación recibida:', notification);
});
```

---

## 🏗️ Generar APK para Distribución

### APK de Prueba (Debug)

```bash
cd android
./gradlew assembleDebug
```

**Ubicación:** `android/app/build/outputs/apk/debug/app-debug.apk`

### APK de Producción (Release)

```bash
# 1. Generar keystore (solo la primera vez)
keytool -genkey -v -keystore vertexerp-release.keystore \
  -alias vertexerp -keyalg RSA -keysize 2048 -validity 10000

# 2. Configurar en android/gradle.properties
echo "VERTEXERP_RELEASE_STORE_FILE=../vertexerp-release.keystore" >> android/gradle.properties
echo "VERTEXERP_RELEASE_KEY_ALIAS=vertexerp" >> android/gradle.properties
echo "VERTEXERP_RELEASE_STORE_PASSWORD=tu_password" >> android/gradle.properties
echo "VERTEXERP_RELEASE_KEY_PASSWORD=tu_password" >> android/gradle.properties

# 3. Generar APK firmado
cd android
./gradlew assembleRelease
```

**Ubicación:** `android/app/build/outputs/apk/release/app-release.apk`

### AAB para Play Store (Recomendado)

```bash
cd android
./gradlew bundleRelease
```

**Ubicación:** `android/app/build/outputs/bundle/release/app-release.aab`

---

## 📤 Publicar en Google Play Store

### 1. Crear Cuenta de Desarrollador

- **URL:** https://play.google.com/console
- **Costo:** $25 USD (pago único)
- **Tiempo de aprobación:** 1-2 días hábiles

### 2. Crear Nueva Aplicación

1. Ir a Play Console
2. Click en "Crear aplicación"
3. Completar información básica

### 3. Preparar Assets

**Iconos:**
- Icono de la app: 512x512 px (PNG)
- Feature graphic: 1024x500 px (PNG o JPG)

**Screenshots (mínimo 2):**
- Teléfono: 320-3840 px (ancho o alto)
- Tablet 7": 1024-7680 px
- Tablet 10": 1024-7680 px

**Textos:**
- Título: Máximo 50 caracteres
- Descripción corta: Máximo 80 caracteres
- Descripción completa: Máximo 4000 caracteres

### 4. Subir AAB

1. Ir a "Producción" → "Crear nueva versión"
2. Subir el archivo `app-release.aab`
3. Completar notas de la versión
4. Revisar y publicar

### 5. Revisión

- **Tiempo:** 1-7 días
- **Notificación:** Por email
- **Estado:** Visible en Play Console

---

## 🐛 Solución de Problemas Comunes

### Error: "ANDROID_HOME not set"

```bash
# Windows
$env:ANDROID_HOME = "C:\Users\TuUsuario\AppData\Local\Android\Sdk"

# Linux/Mac
export ANDROID_HOME=$HOME/Android/Sdk
```

### Error: "Gradle build failed"

```bash
# Limpiar y reconstruir
cd android
./gradlew clean
./gradlew build
```

### Error: "Device not found"

```bash
# Verificar dispositivos conectados
adb devices

# Si no aparece, verificar:
# 1. Depuración USB habilitada
# 2. Cable USB funcional
# 3. Drivers instalados (Windows)
```

### App no se actualiza en el dispositivo

```bash
# Desinstalar app anterior
adb uninstall com.vertexerp.muebles

# Reinstalar
npx cap run android
```

---

## 📊 Checklist de Lanzamiento

### Pre-lanzamiento
- [ ] Probar en múltiples dispositivos Android
- [ ] Probar en diferentes versiones de Android (5.0, 8.0, 13.0)
- [ ] Verificar funcionalidad offline
- [ ] Probar impresión Bluetooth
- [ ] Probar sincronización de datos
- [ ] Optimizar tamaño del APK
- [ ] Configurar ProGuard (ofuscación)

### Assets
- [ ] Icono 512x512 px
- [ ] Feature graphic 1024x500 px
- [ ] Screenshots (mínimo 2)
- [ ] Descripción corta (80 caracteres)
- [ ] Descripción completa (4000 caracteres)
- [ ] Video promocional (opcional)

### Configuración
- [ ] Generar keystore de firma
- [ ] Configurar versión (versionCode y versionName)
- [ ] Configurar permisos en AndroidManifest.xml
- [ ] Configurar política de privacidad
- [ ] Configurar términos de servicio

### Publicación
- [ ] Crear cuenta Google Play Developer ($25)
- [ ] Generar AAB de producción
- [ ] Subir a Play Console
- [ ] Completar ficha de la app
- [ ] Configurar precios (gratis/pago)
- [ ] Seleccionar países de distribución
- [ ] Enviar a revisión

---

## 💡 Tips y Mejores Prácticas

### Rendimiento

1. **Minimizar tamaño del APK:**
   ```gradle
   android {
     buildTypes {
       release {
         minifyEnabled true
         shrinkResources true
       }
     }
   }
   ```

2. **Usar imágenes optimizadas:**
   - Formato WebP en lugar de PNG/JPG
   - Comprimir imágenes antes de incluirlas

3. **Lazy loading:**
   - Cargar componentes bajo demanda
   - Usar React.lazy() y Suspense

### Seguridad

1. **Ofuscar código:**
   - Habilitar ProGuard en build de producción
   
2. **Proteger API keys:**
   - Usar variables de entorno
   - No incluir keys en el código fuente

3. **HTTPS obligatorio:**
   - Todas las comunicaciones deben ser HTTPS

### UX Móvil

1. **Splash Screen:**
   - Usar logo de la empresa
   - Fondo del color del tema

2. **Status Bar:**
   - Configurar color acorde al diseño
   - Usar modo claro/oscuro según el tema

3. **Orientación:**
   - Bloquear a portrait para cobradores
   - Permitir landscape para tablets

---

## 📞 Recursos Adicionales

### Documentación
- **Capacitor:** https://capacitorjs.com/docs
- **Android Developers:** https://developer.android.com
- **Play Console:** https://support.google.com/googleplay/android-developer

### Comunidad
- **Capacitor Discord:** https://discord.gg/UPYYRhtyzp
- **Stack Overflow:** Tag `capacitor`
- **Ionic Forum:** https://forum.ionicframework.com

### Herramientas
- **Android Studio:** https://developer.android.com/studio
- **Capacitor CLI:** https://capacitorjs.com/docs/cli
- **Gradle:** https://gradle.org

---

## ✅ Resumen

1. **Ejecutar:** `bash setup-capacitor.sh`
2. **Desarrollar:** Continuar con Next.js normalmente
3. **Probar:** `npm run android:dev`
4. **Publicar:** Generar AAB y subir a Play Store

**¡Eso es todo!** En 1-2 semanas tendrás tu app nativa en Google Play Store.

---

**Creado por:** DeepAgent  
**Fecha:** 2026-02-07  
**Versión:** 1.0
