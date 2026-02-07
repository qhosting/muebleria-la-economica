# 📱 Plan de Implementación - Aplicación Nativa Android para VertexERP Muebles

**Fecha:** 2026-02-07  
**Versión PWA Actual:** v1.4.0  
# 📱 Plan de Implementación: App Nativa Android (VertexERP)

> **⚠️ ACTUALIZACIÓN IMPORTANTE (2026-02-07):**
> Se ha decidido enfocar el desarrollo de la app nativa **exclusivamente para el perfil de Cobrador en Campo**.
> Para detalles técnicos específicos, scripts de instalación y guía de uso, consultar:
> - **Plan Técnico:** [PLAN-APP-COBRADOR-ANDROID.md](./PLAN-APP-COBRADOR-ANDROID.md)
> - **Guía Rápida:** [GUIA-APP-COBRADOR.md](./GUIA-APP-COBRADOR.md)

---

## 🎯 Objetivo General
Crear una aplicación nativa Android robusta para superar las limitaciones de compatibilidad de la PWA actual en dispositivos antiguos (Android 5.0 - 7.0), enfocada principalmente en la **operatividad de los cobradores en ruta**.

## 📱 Alcance del Proyecto (Actualizado)
El proyecto se dividirá en dos plataformas claramente diferenciadas:
1.  **Web Admin (Actual):** Gestión completa, administración, reportes (Para Administradores y Gestores).
2.  **App Nativa (Nueva):** Funcionalidades exclusivas de cobranza, offline y hardware (Para Cobradores).

---

## 🎯 Resumen Ejecutivo

Aunque VertexERP Muebles funciona como PWA en la mayoría de dispositivos Android modernos, algunos equipos (especialmente versiones antiguas de Android o navegadores sin soporte completo de PWA) no pueden instalarla correctamente. La solución es crear una **aplicación nativa Android** que envuelva la aplicación web existente.

### Ventajas de la Aplicación Nativa

✅ **Compatibilidad Universal** - Funciona en Android 5.0+ (API 21+)  
✅ **Distribución en Play Store** - Mayor alcance y credibilidad  
✅ **Mejor Integración** - Acceso nativo a hardware (Bluetooth, GPS, cámara)  
✅ **Notificaciones Push** - Más confiables que en PWA  
✅ **Rendimiento** - Mejor experiencia en dispositivos de gama baja  
✅ **Offline Robusto** - Control total sobre caché y sincronización  

---

## 🔧 Opciones de Implementación

### 1. **Estrategia Recomendada: Capacitor (Seleccionada)**

Esta es la opción más viable y rápida, ya que **reutiliza el 100% de la lógica de negocio y UI** de Next.js, añadiendo una capa nativa transparente.

**Ventajas clave:**
*   ✅ **Mantenimiento Único:** Un solo repositorio para Web y Android.
*   ✅ **Acceso Nativo:** Bluetooth LE, GPS, Storage Nativo ya integrados.
*   ✅ **Compatibilidad Windows:** Configuración con `cross-env` para desarrollo multiplataforma.
*   ✅ **Despliegue Rápido:** Build automatizado (`npm run cobrador:sync`).

### 2. **Configuración Técnica Implementada**

Se ha configurado el proyecto para **exportación estática** selectiva:
- Cuando `BUILD_TARGET=capacitor`, Next.js genera HTML/CSS/JS estático en `out/`.
- Capacitor toma este directorio y lo empaqueta en una App Android.
- Se usan **plugins comunitarios** (`@capacitor-community/bluetooth-le`) para hardware específico.

> **Nota Técnica:** Se solucionaron conflictos de tipos en `lib/bluetooth-printer.ts` renombrando las interfaces Web Bluetooth para evitar colisiones con los tipos globales de Capacitor.s:** 2-3 días
- **Testing y ajustes:** 2-3 días
- **Total:** ~1 semana

---

### Opción 2: **React Native**

**Descripción:** Framework de Facebook para crear aplicaciones nativas reales (no WebView).

#### Ventajas
- ✅ Rendimiento nativo superior
- ✅ Experiencia de usuario más fluida
- ✅ Acceso completo a APIs nativas
- ✅ Ecosistema maduro

#### Desventajas
- ❌ Requiere reescribir gran parte de la aplicación
- ❌ Tiempo de desarrollo: 2-3 meses
- ❌ Curva de aprendizaje
- ❌ Mantenimiento de dos códigos base (web + mobile)

#### Tiempo de Implementación
- **Total:** 2-3 meses

---

### Opción 3: **TWA (Trusted Web Activity)**

**Descripción:** Tecnología de Google que permite empaquetar PWAs como aplicaciones Android nativas.

#### Ventajas
- ✅ Muy rápida de implementar (1-2 días)
- ✅ Usa Chrome Custom Tabs (no WebView)
- ✅ Tamaño de APK mínimo (~1-2 MB)
- ✅ Actualizaciones automáticas desde la web

#### Desventajas
- ⚠️ Requiere que el sitio esté en HTTPS
- ⚠️ Limitaciones en acceso a hardware nativo
- ⚠️ Menos control sobre la experiencia

#### Tiempo de Implementación
- **Total:** 1-2 días

---

### Opción 4: **Cordova/PhoneGap**

**Descripción:** Framework clásico para convertir apps web en nativas (predecesor de Capacitor).

#### Ventajas
- ✅ Maduro y estable
- ✅ Gran cantidad de plugins

#### Desventajas
- ⚠️ Menos moderno que Capacitor
- ⚠️ Comunidad en declive
- ⚠️ Capacitor es su evolución mejorada

#### Tiempo de Implementación
- **Total:** ~1 semana

---

## 🏆 Recomendación: **Capacitor**

### ¿Por qué Capacitor?

1. **Balance perfecto** entre facilidad de implementación y funcionalidad
2. **Reutiliza el 100%** del código web existente
3. **Plugins nativos** para impresoras Bluetooth, GPS, etc.
4. **Actualizaciones OTA** - Puedes actualizar la app sin pasar por Play Store
5. **Preparado para iOS** - Si en el futuro quieres una app para iPhone
6. **Comunidad activa** - Ionic mantiene activamente el proyecto

---

## 📋 Plan de Implementación con Capacitor

### Fase 1: Configuración Inicial (1-2 días)

#### 1.1 Instalar Capacitor
```bash
cd app
npm install @capacitor/core @capacitor/cli
npx cap init "VertexERP Muebles" "com.vertexerp.muebles" --web-dir=out
```

#### 1.2 Agregar Plataforma Android
```bash
npm install @capacitor/android
npx cap add android
```

#### 1.3 Configurar Build Estático
Modificar `next.config.js` para exportar estático:
```javascript
const nextConfig = {
  output: 'export',
  distDir: 'out',
  images: { unoptimized: true },
  trailingSlash: true,
};
```

#### 1.4 Build y Sincronización
```bash
npm run build
npx cap sync
```

---

### Fase 2: Plugins Nativos (2-3 días)

#### 2.1 Impresión Bluetooth
```bash
npm install @capacitor-community/bluetooth-le
```

**Código de ejemplo:**
```typescript
import { BluetoothLe } from '@capacitor-community/bluetooth-le';

// Buscar impresoras Bluetooth
async function buscarImpresoras() {
  await BluetoothLe.initialize();
  const devices = await BluetoothLe.requestDevice({
    services: ['000018f0-0000-1000-8000-00805f9b34fb'] // UUID de impresoras
  });
  return devices;
}

// Imprimir ticket
async function imprimirTicket(deviceId: string, contenido: string) {
  await BluetoothLe.connect({ deviceId });
  const data = new TextEncoder().encode(contenido);
  await BluetoothLe.write({
    deviceId,
    service: '000018f0-0000-1000-8000-00805f9b34fb',
    characteristic: '00002af1-0000-1000-8000-00805f9b34fb',
    value: data
  });
}
```

#### 2.2 Geolocalización
```bash
npm install @capacitor/geolocation
```

**Código de ejemplo:**
```typescript
import { Geolocation } from '@capacitor/geolocation';

async function obtenerUbicacion() {
  const coordinates = await Geolocation.getCurrentPosition();
  return {
    lat: coordinates.coords.latitude,
    lng: coordinates.coords.longitude
  };
}
```

#### 2.3 Cámara (para futuras funcionalidades)
```bash
npm install @capacitor/camera
```

#### 2.4 Almacenamiento Local
```bash
npm install @capacitor/preferences
```

#### 2.5 Notificaciones Push
```bash
npm install @capacitor/push-notifications
```

---

### Fase 3: Configuración Android (1 día)

#### 3.1 Configurar `AndroidManifest.xml`
```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <application
        android:name=".MainApplication"
        android:label="@string/app_name"
        android:icon="@mipmap/ic_launcher"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:theme="@style/AppTheme"
        android:usesCleartextTraffic="true">
        
        <activity
            android:name=".MainActivity"
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode"
            android:label="@string/title_activity_main"
            android:launchMode="singleTask"
            android:theme="@style/AppTheme.NoActionBarLaunch"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
    
    <!-- Permisos -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.BLUETOOTH" />
    <uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />
    <uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
    <uses-permission android:name="android.permission.BLUETOOTH_SCAN" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
</manifest>
```

#### 3.2 Configurar `capacitor.config.ts`
```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.vertexerp.muebles',
  appName: 'VertexERP Muebles',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    cleartext: true,
    // Para desarrollo local:
    // url: 'http://192.168.1.100:3000',
    // cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0F172A',
      showSpinner: true,
      spinnerColor: '#ffffff'
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    }
  }
};

export default config;
```

#### 3.3 Personalizar Iconos y Splash Screen
```bash
# Generar iconos automáticamente desde tu logo
npm install -g cordova-res
cordova-res android --skip-config --copy
```

---

### Fase 4: Adaptación del Código Web (2-3 días)

#### 4.1 Crear Hook para Detección de Plataforma
```typescript
// hooks/usePlatform.ts
import { Capacitor } from '@capacitor/core';

export function usePlatform() {
  const isNative = Capacitor.isNativePlatform();
  const platform = Capacitor.getPlatform(); // 'android', 'ios', 'web'
  
  return {
    isNative,
    isAndroid: platform === 'android',
    isIOS: platform === 'ios',
    isWeb: platform === 'web'
  };
}
```

#### 4.2 Adaptar Impresión Bluetooth
```typescript
// lib/printer-native.ts
import { BluetoothLe } from '@capacitor-community/bluetooth-le';
import { usePlatform } from '@/hooks/usePlatform';

export async function imprimirTicketNativo(contenido: string) {
  const { isNative } = usePlatform();
  
  if (isNative) {
    // Usar plugin nativo de Bluetooth
    const impresora = await obtenerImpresoraGuardada();
    if (impresora) {
      await BluetoothLe.connect({ deviceId: impresora.id });
      await enviarComandosESCPOS(impresora.id, contenido);
    }
  } else {
    // Usar Web Bluetooth API (PWA)
    await imprimirTicketWeb(contenido);
  }
}
```

#### 4.3 Adaptar Geolocalización
```typescript
// lib/location-native.ts
import { Geolocation } from '@capacitor/geolocation';
import { usePlatform } from '@/hooks/usePlatform';

export async function obtenerUbicacionActual() {
  const { isNative } = usePlatform();
  
  if (isNative) {
    const position = await Geolocation.getCurrentPosition();
    return {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      accuracy: position.coords.accuracy
    };
  } else {
    // Usar Geolocation API del navegador
    return obtenerUbicacionWeb();
  }
}
```

#### 4.4 Adaptar Almacenamiento
```typescript
// lib/storage-native.ts
import { Preferences } from '@capacitor/preferences';
import { usePlatform } from '@/hooks/usePlatform';

export async function guardarDato(key: string, value: any) {
  const { isNative } = usePlatform();
  
  if (isNative) {
    await Preferences.set({
      key,
      value: JSON.stringify(value)
    });
  } else {
    localStorage.setItem(key, JSON.stringify(value));
  }
}

export async function obtenerDato(key: string) {
  const { isNative } = usePlatform();
  
  if (isNative) {
    const { value } = await Preferences.get({ key });
    return value ? JSON.parse(value) : null;
  } else {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  }
}
```

---

### Fase 5: Testing y Optimización (2-3 días)

#### 5.1 Testing en Emulador
```bash
# Abrir Android Studio
npx cap open android

# Ejecutar en emulador desde Android Studio
# O desde línea de comandos:
npx cap run android
```

#### 5.2 Testing en Dispositivo Real
```bash
# Habilitar modo desarrollador en el dispositivo Android
# Conectar por USB
# Ejecutar:
npx cap run android --target=<device-id>
```

#### 5.3 Optimizaciones
- Minimizar tamaño del APK
- Optimizar imágenes
- Configurar ProGuard para ofuscar código
- Habilitar compresión de recursos

---

### Fase 6: Publicación en Play Store (3-5 días)

#### 6.1 Generar APK de Producción
```bash
cd android
./gradlew assembleRelease
```

#### 6.2 Firmar APK
```bash
# Generar keystore
keytool -genkey -v -keystore vertexerp-release.keystore -alias vertexerp -keyalg RSA -keysize 2048 -validity 10000

# Firmar APK
jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 -keystore vertexerp-release.keystore app-release-unsigned.apk vertexerp
```

#### 6.3 Generar AAB (Android App Bundle)
```bash
./gradlew bundleRelease
```

#### 6.4 Crear Cuenta de Desarrollador
- Costo: $25 USD (pago único)
- URL: https://play.google.com/console

#### 6.5 Preparar Assets para Play Store
- **Icono:** 512x512 px
- **Feature Graphic:** 1024x500 px
- **Screenshots:** Mínimo 2 (teléfono y tablet)
- **Descripción corta:** Máximo 80 caracteres
- **Descripción completa:** Máximo 4000 caracteres
- **Video promocional:** (opcional)

---

## 📦 Estructura del Proyecto con Capacitor

```
muebleria-la-economica/
├── app/                          # Aplicación Next.js (existente)
│   ├── app/
│   ├── components/
│   ├── lib/
│   │   ├── printer-native.ts     # ✨ NUEVO: Impresión nativa
│   │   ├── location-native.ts    # ✨ NUEVO: Geolocalización nativa
│   │   └── storage-native.ts     # ✨ NUEVO: Almacenamiento nativo
│   ├── hooks/
│   │   └── usePlatform.ts        # ✨ NUEVO: Detección de plataforma
│   ├── public/
│   ├── out/                      # ✨ NUEVO: Build estático para Capacitor
│   ├── android/                  # ✨ NUEVO: Proyecto Android
│   │   ├── app/
│   │   │   ├── src/
│   │   │   └── build.gradle
│   │   ├── gradle/
│   │   └── build.gradle
│   ├── ios/                      # ✨ NUEVO: Proyecto iOS (futuro)
│   ├── capacitor.config.ts       # ✨ NUEVO: Configuración Capacitor
│   └── package.json
```

---

## 🔄 Flujo de Desarrollo

### Desarrollo Local
```bash
# 1. Desarrollar en Next.js como siempre
npm run dev

# 2. Cuando esté listo, hacer build
npm run build

# 3. Sincronizar con Capacitor
npx cap sync

# 4. Abrir en Android Studio para testing
npx cap open android

# 5. Ejecutar en dispositivo/emulador
npx cap run android
```

### Actualizaciones OTA (Over-The-Air)
```typescript
// Configurar Capacitor Live Updates (opcional)
import { CapacitorUpdater } from '@capgo/capacitor-updater';

// Verificar actualizaciones al iniciar la app
async function verificarActualizaciones() {
  const update = await CapacitorUpdater.download({
    url: 'https://tu-servidor.com/updates/latest.zip'
  });
  
  if (update) {
    await CapacitorUpdater.set({ id: update.id });
  }
}
```

---

## 💰 Costos Estimados

### Desarrollo
- **Tiempo de desarrollo:** 1-2 semanas
- **Costo de desarrollador (si contratas):** $2,000 - $5,000 USD

### Publicación
- **Google Play Developer Account:** $25 USD (pago único)
- **Certificado de firma:** Gratis (autogenerado)

### Mantenimiento Anual
- **Actualizaciones de la app:** Incluido en desarrollo web
- **Soporte de Capacitor:** Gratis (open source)

---

## 📊 Comparativa: PWA vs Nativa

| Característica | PWA Actual | App Nativa (Capacitor) |
|---|---|---|
| **Compatibilidad Android** | Android 8.0+ con Chrome | Android 5.0+ (API 21+) |
| **Instalación** | Desde navegador | Google Play Store |
| **Tamaño descarga** | ~5 MB | ~20-30 MB |
| **Acceso Bluetooth** | Web Bluetooth API | Plugin nativo (más confiable) |
| **Notificaciones Push** | Limitadas | Completas y confiables |
| **Modo Offline** | Service Worker | Service Worker + almacenamiento nativo |
| **Actualizaciones** | Automáticas | Play Store + OTA |
| **Credibilidad** | Media | Alta (app oficial) |
| **Tiempo de desarrollo** | Ya implementado | 1-2 semanas |

---

## ✅ Checklist de Implementación

### Preparación
- [ ] Instalar Android Studio
- [ ] Instalar JDK 11+
- [ ] Configurar variables de entorno (ANDROID_HOME, JAVA_HOME)
- [ ] Crear cuenta de Google Play Developer

### Fase 1: Setup
- [ ] Instalar Capacitor
- [ ] Agregar plataforma Android
- [ ] Configurar build estático en Next.js
- [ ] Hacer primer build y sincronización

### Fase 2: Plugins
- [ ] Instalar plugin Bluetooth
- [ ] Instalar plugin Geolocalización
- [ ] Instalar plugin Cámara
- [ ] Instalar plugin Notificaciones
- [ ] Instalar plugin Almacenamiento

### Fase 3: Código
- [ ] Crear hook usePlatform
- [ ] Adaptar impresión Bluetooth
- [ ] Adaptar geolocalización
- [ ] Adaptar almacenamiento local
- [ ] Adaptar sincronización offline

### Fase 4: Testing
- [ ] Probar en emulador Android
- [ ] Probar en dispositivo real (Android 5.0)
- [ ] Probar en dispositivo real (Android 13+)
- [ ] Probar impresión Bluetooth
- [ ] Probar modo offline
- [ ] Probar sincronización

### Fase 5: Publicación
- [ ] Generar keystore de firma
- [ ] Generar AAB de producción
- [ ] Crear assets para Play Store
- [ ] Subir a Play Console
- [ ] Configurar ficha de la app
- [ ] Enviar a revisión

---

## 🚀 Próximos Pasos Recomendados

1. **Validar la opción Capacitor** - Confirmar que es la mejor opción para tu caso
2. **Preparar entorno de desarrollo** - Instalar Android Studio y dependencias
3. **Implementar Fase 1** - Setup inicial de Capacitor (1-2 días)
4. **Testing inicial** - Verificar que la app funciona en Android
5. **Implementar plugins** - Bluetooth, GPS, etc. (2-3 días)
6. **Testing completo** - En múltiples dispositivos
7. **Publicar en Play Store** - Proceso de revisión (1-7 días)

---

## 📞 Soporte y Recursos

### Documentación Oficial
- **Capacitor:** https://capacitorjs.com/docs
- **Ionic Framework:** https://ionicframework.com/docs
- **Android Developers:** https://developer.android.com

### Plugins Útiles
- **Bluetooth:** https://github.com/capacitor-community/bluetooth-le
- **Geolocation:** https://capacitorjs.com/docs/apis/geolocation
- **Camera:** https://capacitorjs.com/docs/apis/camera
- **Push Notifications:** https://capacitorjs.com/docs/apis/push-notifications

### Comunidad
- **Capacitor Discord:** https://discord.gg/UPYYRhtyzp
- **Stack Overflow:** Tag `capacitor`
- **GitHub Issues:** https://github.com/ionic-team/capacitor/issues

---

**Documento creado por:** DeepAgent  
**Fecha:** 2026-02-07  
**Versión:** 1.0
