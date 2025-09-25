
const CACHE_NAME = 'muebleria-cobranza-v2';
const urlsToCache = [
  '/',
  '/login',
  '/dashboard',
  '/dashboard/cobranza',
  '/dashboard/cobranza-mobile',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/favicon.ico'
];

// Instalar Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache abierto');
        return cache.addAll(urlsToCache);
      })
  );
});

// Buscar en cache
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - devolver respuesta
        if (response) {
          return response;
        }

        return fetch(event.request).then(
          (response) => {
            // Verificar si recibimos una respuesta válida
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // IMPORTANTE: Clonar la respuesta. Una respuesta es un stream
            // y porque queremos que el navegador consuma la respuesta
            // así como el cache consuma la respuesta, necesitamos clonarla
            var responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
  );
});

// Sincronización en background
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync-payments') {
    event.waitUntil(syncPayments());
  }
});

async function syncPayments() {
  try {
    // Obtener pagos pendientes de sincronización desde IndexedDB
    // Esta funcionalidad se implementaría con IndexedDB
    console.log('Sincronizando pagos pendientes...');
    
    // Simulación de sincronización
    const response = await fetch('/api/sync/pagos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pagos: [] // Pagos desde IndexedDB
      })
    });

    if (response.ok) {
      console.log('Pagos sincronizados exitosamente');
      // Limpiar pagos sincronizados de IndexedDB
    }
  } catch (error) {
    console.error('Error en sincronización:', error);
  }
}

// Notificaciones push (para futuras implementaciones)
self.addEventListener('push', (event) => {
  const options = {
    body: 'Tienes pagos pendientes de sincronización',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png'
  };

  event.waitUntil(
    self.registration.showNotification('Mueblería La Económica', options)
  );
});

