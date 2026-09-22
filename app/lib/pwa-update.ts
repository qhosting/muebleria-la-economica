/**
 * Utilidades para gestión del ciclo de vida y actualización de PWA / Caché
 */

export async function forcePwaHardReset(): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    console.log('🧹 Iniciando purga completa de caché y PWA...');

    // 1. Limpiar todos los caches de CacheStorage
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(
        keys.map((key) => {
          console.log('[PWA] Eliminando cache:', key);
          return caches.delete(key);
        })
      );
    }

    // 2. Notificar al Service Worker y desregistrarlo
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of registrations) {
        if (reg.active) {
          reg.active.postMessage({ type: 'CLEAR_ALL_CACHES' });
          reg.active.postMessage({ type: 'SKIP_WAITING' });
        }
        await reg.unregister();
      }
    }

    // 3. Limpiar almacenamiento de sesión temporal
    sessionStorage.clear();

    // 4. Recargar la ventana saltando la caché HTTP del navegador
    const cleanUrl = window.location.origin + window.location.pathname + '?_t=' + Date.now();
    window.location.href = cleanUrl;
  } catch (error) {
    console.error('Error durante la purga de caché PWA:', error);
    window.location.reload();
  }
}

export async function checkForPwaUpdate(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const reg = await navigator.serviceWorker.getRegistration();
    if (reg) {
      await reg.update();
      if (reg.waiting) {
        reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        return true;
      }
    }
  } catch (err) {
    console.warn('Error al verificar actualización de PWA:', err);
  }

  return false;
}
