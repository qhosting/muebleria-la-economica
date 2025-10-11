
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'LaEconomica - Sistema de Cobranza',
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
        <meta name="apple-mobile-web-app-title" content="LaEconomica" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        
        {/* PWA - Theme Color */}
        <meta name="theme-color" content="#0F172A" />
        <meta name="msapplication-TileColor" content="#0F172A" />
        <meta name="msapplication-navbutton-color" content="#0F172A" />
        
        {/* PWA - Icons for other platforms */}
        <meta name="msapplication-TileImage" content="/icon-192x192.png" />
        
        {/* PWA - Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('✅ Service Worker registrado:', registration.scope);
                      
                      // Detectar si es instalable
                      let deferredPrompt;
                      window.addEventListener('beforeinstallprompt', (e) => {
                        e.preventDefault();
                        deferredPrompt = e;
                        console.log('🚀 PWA instalable detectada');
                        
                        // Opcional: Mostrar banner personalizado
                        const installBanner = document.createElement('div');
                        installBanner.id = 'pwa-install-banner';
                        installBanner.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#0F172A;color:white;padding:16px 24px;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.3);z-index:9999;display:flex;gap:12px;align-items:center;';
                        installBanner.innerHTML = '<span>📱 Instala LaEconomica en tu dispositivo</span><button id="pwa-install-btn" style="background:white;color:#0F172A;border:none;padding:8px 16px;border-radius:8px;font-weight:600;cursor:pointer;">Instalar</button><button id="pwa-dismiss-btn" style="background:transparent;color:white;border:1px solid white;padding:8px 16px;border-radius:8px;cursor:pointer;">Más tarde</button>';
                        document.body.appendChild(installBanner);
                        
                        document.getElementById('pwa-install-btn').addEventListener('click', async () => {
                          installBanner.remove();
                          deferredPrompt.prompt();
                          const { outcome } = await deferredPrompt.userChoice;
                          console.log('🎯 Resultado de instalación:', outcome);
                          deferredPrompt = null;
                        });
                        
                        document.getElementById('pwa-dismiss-btn').addEventListener('click', () => {
                          installBanner.remove();
                        });
                      });
                      
                      // Detectar cuando se instala
                      window.addEventListener('appinstalled', () => {
                        console.log('✅ PWA instalada exitosamente');
                        deferredPrompt = null;
                      });
                    })
                    .catch(function(err) {
                      console.error('❌ Error al registrar Service Worker:', err);
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
