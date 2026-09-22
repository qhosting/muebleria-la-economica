
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'VertexERP Muebles - Sistema de Cobranza',
  description: 'Sistema integral de gestión de clientes y cobranza en campo',
  manifest: '/manifest.json',
};

// 🚀 OPTIMIZACIÓN MÓVIL: Viewport optimizado para mejor rendimiento
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5, // Permitir zoom para accesibilidad
  userScalable: true, // Permitir zoom para accesibilidad
  themeColor: '#0F172A',
  viewportFit: 'cover', // Optimización para pantallas con notch
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />
        
        {/* PWA - Apple Touch Icons */}
        <link rel="apple-touch-icon" href="/icon-192x192.png" sizes="192x192" />
        <link rel="apple-touch-icon" href="/icon-512x512.png" sizes="512x512" />
        
        {/* PWA - Manifest */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* PWA - Mobile Web App Capable */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="VertexERP Muebles" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        
        {/* PWA - Theme Color */}
        <meta name="theme-color" content="#0F172A" />
        <meta name="msapplication-TileColor" content="#0F172A" />
        <meta name="msapplication-navbutton-color" content="#0F172A" />
        
        {/* PWA - Icons for other platforms */}
        <meta name="msapplication-TileImage" content="/icon-192x192.png" />
        
        {/* PWA - Service Worker Registration & Auto-Update */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('✅ Service Worker registrado:', registration.scope);

                      // Forzar verificación de nueva versión de inmediato
                      registration.update().catch(function() {});

                      // Verificar periódicamente cada 30 minutos
                      setInterval(function() {
                        registration.update().catch(function() {});
                      }, 30 * 60 * 1000);

                      // Verificar cada vez que la app vuelve a primer plano
                      document.addEventListener('visibilitychange', function() {
                        if (document.visibilityState === 'visible') {
                          registration.update().catch(function() {});
                        }
                      });

                      // Detectar cuando hay un nuevo Service Worker instalándose
                      registration.addEventListener('updatefound', function() {
                        var newWorker = registration.installing;
                        if (newWorker) {
                          newWorker.addEventListener('statechange', function() {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                              console.log('🔄 Nueva versión detectada, forzando activación...');
                              newWorker.postMessage({ type: 'SKIP_WAITING' });
                            }
                          });
                        }
                      });

                      // Detectar cuando se instala por primera vez
                      window.addEventListener('appinstalled', function() {
                        console.log('✅ PWA instalada exitosamente');
                      });
                    })
                    .catch(function(err) {
                      console.error('❌ Error al registrar Service Worker:', err);
                    });

                  // Cuando el nuevo Service Worker toma el control, recargar para limpiar caché y servir nueva versión
                  var isRefreshing = false;
                  navigator.serviceWorker.addEventListener('controllerchange', function() {
                    if (!isRefreshing) {
                      isRefreshing = true;
                      console.log('✨ Nuevo Service Worker activo. Recargando página...');
                      window.location.reload();
                    }
                  });
                });
              }
            `,
          }}
        />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
