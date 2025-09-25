
const CACHE_NAME = 'laeconomica-v1.2.1';
const urlsToCache = [
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
        console.log('Cache LaEconomica v1.2.1 abierto');
        return cache.addAll(urlsToCache);
      })
  );
  // Forzar activación inmediata
  self.skipWaiting();
});

// Activar Service Worker y limpiar cachés antiguas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Eliminar cachés que no sean la actual
          if (cacheName !== CACHE_NAME && 
              (cacheName.startsWith('muebleria-cobranza-') || cacheName.startsWith('laeconomica-'))) {
            console.log('Eliminando caché antigua:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Tomar control de todas las páginas inmediatamente
  return self.clients.claim();
});

// Buscar en cache
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Si es la raíz, redirigir directamente a /login sin cachear
  if (url.pathname === '/' && url.origin === self.location.origin) {
    event.respondWith(Response.redirect('/login', 302));
    return;
  }

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

            // No cachear redirecciones
            if (response.type === 'opaqueredirect' || response.status >= 300) {
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
        ).catch(() => {
          // Si falla la red, intentar devolver login desde caché si existe
          if (url.pathname === '/login') {
            return caches.match('/login');
          }
          return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
        });
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
    self.registration.showNotification('LaEconomica', options)
  );
});

