'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { APP_VERSION, APP_VERSION_CODE } from '@/lib/version';
import { apiFetch, getFullPath } from '@/lib/api-config';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Wifi, 
  WifiOff, 
  Download, 
  RefreshCw, 
  ShieldAlert, 
  Smartphone, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight,
  HardDrive
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Network } from '@capacitor/network';
import { App } from '@capacitor/app';
import { toast } from 'sonner';

interface VersionResponse {
  latestVersion: string;
  minRequiredVersion: string;
  versionCode?: number;
  forceUpdate: boolean;
  apkSizeMb?: string;
  releaseDate?: string;
  downloadUrl: string;
  releaseNotes?: string;
}

function compareVersions(v1: string, v2: string): number {
  const parts1 = (v1 || '').split('.').map(p => parseInt(p, 10) || 0);
  const parts2 = (v2 || '').split('.').map(p => parseInt(p, 10) || 0);
  const maxLen = Math.max(parts1.length, parts2.length);

  for (let i = 0; i < maxLen; i++) {
    const num1 = parts1[i] || 0;
    const num2 = parts2[i] || 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
}

export function VersionCheckModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasUpdate, setHasUpdate] = useState(false);
  const [isMandatory, setIsMandatory] = useState(false);
  const [versionData, setVersionData] = useState<VersionResponse | null>(null);
  const [installedVersion, setInstalledVersion] = useState(APP_VERSION);
  const [installedVersionCode, setInstalledVersionCode] = useState(APP_VERSION_CODE);
  const [isWifi, setIsWifi] = useState(false);
  const [connectionType, setConnectionType] = useState<string>('unknown');
  const [isChecking, setIsChecking] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [dismissedUntilWifi, setDismissedUntilWifi] = useState(false);

  const hasUpdateRef = useRef(false);
  const isWifiRef = useRef(false);

  // Helper para verificar el tipo de red real
  const detectNetworkState = useCallback(async () => {
    let wifi = false;
    let type = 'unknown';

    if (Capacitor.isNativePlatform()) {
      try {
        const status = await Network.getStatus();
        type = status.connectionType || 'unknown';
        wifi = status.connected && status.connectionType === 'wifi';
      } catch (err) {
        console.warn('Error leyendo Network de Capacitor:', err);
      }
    } else if (typeof navigator !== 'undefined') {
      const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      if (conn?.type) {
        type = conn.type;
        wifi = conn.type === 'wifi';
      } else {
        // En navegadores de escritorio sin API de conexión detallada
        type = navigator.onLine ? 'online' : 'offline';
        wifi = navigator.onLine;
      }
    }

    setIsWifi(wifi);
    isWifiRef.current = wifi;
    setConnectionType(type);
    return { wifi, type };
  }, []);

  const checkVersion = useCallback(async () => {
    if (typeof window === 'undefined') return;
    if (!navigator.onLine) return; // Si no hay internet, no bloquear

    setIsChecking(true);
    try {
      // 1. Obtener versión nativa real instalada del APK si estamos en Android
      let curVer = APP_VERSION;
      let curCode = APP_VERSION_CODE;

      if (Capacitor.isNativePlatform()) {
        try {
          const info = await App.getInfo();
          if (info.version) curVer = info.version;
          if (info.build) {
            const parsedCode = parseInt(info.build, 10);
            if (!isNaN(parsedCode)) curCode = parsedCode;
          }
        } catch (e) {
          console.warn('Error obteniendo datos nativos de la aplicación:', e);
        }
      }

      setInstalledVersion(curVer);
      setInstalledVersionCode(curCode);

      // 2. Verificar estado de red
      const net = await detectNetworkState();

      // 3. Consultar endpoint de versión
      const response = await apiFetch('/api/app-version?_t=' + Date.now());
      if (response.ok) {
        const data: VersionResponse = await response.json();
        setVersionData(data);

        // Comparar versión del APK
        const isVersionOutdated = compareVersions(curVer, data.latestVersion) < 0;
        const isCodeOutdated = data.versionCode ? curCode < data.versionCode : false;
        const updateAvailable = isVersionOutdated || isCodeOutdated;

        const isMinOutdated = compareVersions(curVer, data.minRequiredVersion) < 0;
        const mandatory = isMinOutdated || Boolean(data.forceUpdate);

        hasUpdateRef.current = updateAvailable;
        setHasUpdate(updateAvailable);
        setIsMandatory(mandatory);

        if (updateAvailable) {
          // Lógica de apertura:
          // Si está en Wi-Fi: se abre automáticamente la ventana emergente.
          // Si está en datos móviles:
          //   - Si es obligatoria: se muestra avisando que está en red móvil pero recomendando Wi-Fi.
          //   - Si es opcional: NO interrumpir cobranza con modal bloqueante, solo se abrirá al pasar a Wi-Fi.
          if (net.wifi) {
            setIsOpen(true);
          } else if (mandatory) {
            setIsOpen(true);
          }
        } else {
          setIsOpen(false);
        }
      }
    } catch (error) {
      console.log('No se pudo verificar versión del servidor:', error);
    } finally {
      setIsChecking(false);
    }
  }, [detectNetworkState]);

  // Listener en tiempo real para cambios de red (Ej. cuando el cobrador se conecta a Wi-Fi)
  useEffect(() => {
    let networkListenerHandle: any = null;

    const setupNetwork = async () => {
      await detectNetworkState();

      if (Capacitor.isNativePlatform()) {
        try {
          networkListenerHandle = await Network.addListener('networkStatusChange', (status) => {
            const isNowWifi = status.connected && status.connectionType === 'wifi';
            setIsWifi(isNowWifi);
            isWifiRef.current = isNowWifi;
            setConnectionType(status.connectionType || 'unknown');

            // 🚀 REGLA CLAVE: En cuanto el cobrador se conecte a Wi-Fi, si hay actualización disponible,
            // salta automáticamente la ventana emergente
            if (isNowWifi && hasUpdateRef.current) {
              setDismissedUntilWifi(false);
              setIsOpen(true);
              toast.info('📶 Conectado a Wi-Fi', {
                description: 'Nueva actualización del APK disponible para descargar sin costo de datos.'
              });
            }
          });
        } catch (e) {
          console.warn('Error inicializando listener de Network:', e);
        }
      }
    };

    setupNetwork();
    checkVersion();

    // Re-verificar cada 15 minutos en segundo plano
    const interval = setInterval(checkVersion, 15 * 60 * 1000);

    const handleOnline = () => {
      detectNetworkState();
      checkVersion();
    };
    window.addEventListener('online', handleOnline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      if (networkListenerHandle && typeof networkListenerHandle.remove === 'function') {
        networkListenerHandle.remove();
      }
    };
  }, [detectNetworkState, checkVersion]);

  // Manejo de la descarga e instalación del APK
  const handleDownload = () => {
    if (!versionData?.downloadUrl) return;

    setIsDownloading(true);
    const fullUrl = getFullPath(versionData.downloadUrl);

    toast.success('Iniciando descarga del APK...', {
      description: 'Una vez descargado, toca el archivo o notificación para instalarlo.'
    });

    try {
      // 1. En Capacitor Android nativo, abrir con el sistema para lanzar el gestor de descargas/instalador
      if (Capacitor.isNativePlatform()) {
        window.open(fullUrl, '_system');
      } else {
        // 2. En PWA / navegador
        const link = document.createElement('a');
        link.href = fullUrl;
        link.download = 'LaEconomica.apk';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      console.error('Error al iniciar descarga:', err);
    } finally {
      setTimeout(() => {
        setIsDownloading(false);
      }, 3500);
    }
  };

  const handleDismiss = () => {
    setDismissedUntilWifi(true);
    setIsOpen(false);
    toast('Actualización pospuesta', {
      description: 'Te recordaremos cuando estés conectado a una red Wi-Fi.'
    });
  };

  // Si no hay actualización o ya está descartada y el modal está cerrado,
  // mostrar una pequeña píldora no intrusiva si está en datos móviles
  if (!hasUpdate || !versionData) {
    return null;
  }

  return (
    <>
      {/* Banner flotante discreto cuando hay actualización pendiente pero está en datos móviles */}
      {!isOpen && !isWifi && (
        <aside
          aria-label="Aviso de actualización pendiente"
          className="bg-amber-950/90 border-b border-amber-800/80 px-3 py-1.5 flex items-center justify-between text-xs text-amber-200 z-40 sticky top-0"
        >
          <div className="flex items-center gap-2 truncate">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="truncate">
              APK v{versionData.latestVersion} disponible (se actualizará con Wi-Fi)
            </span>
          </div>
          <button
            onClick={() => setIsOpen(true)}
            className="text-[11px] font-bold underline text-amber-100 hover:text-white ml-2 flex-shrink-0"
          >
            Ver
          </button>
        </aside>
      )}

      {/* Modal Emergente Principal */}
      <Dialog open={isOpen} onOpenChange={(open) => {
        // Si no es obligatoria se puede cerrar, si es obligatoria se previene cerrar fuera
        if (!isMandatory) setIsOpen(open);
      }}>
        <DialogContent 
          className="max-w-md w-[92%] bg-slate-900 border-slate-700 text-white p-6 rounded-3xl shadow-2xl [&>button]:hidden animate-in fade-in zoom-in-95 duration-200"
          onPointerDownOutside={(e) => {
            if (isMandatory) e.preventDefault();
          }}
          onEscapeKeyDown={(e) => {
            if (isMandatory) e.preventDefault();
          }}
        >
          <DialogHeader className="space-y-3 text-center">
            {/* Icono con badge de conexión */}
            <div className="relative mx-auto w-16 h-16 rounded-2xl flex items-center justify-center transition-all bg-emerald-500/10 border border-emerald-500/30">
              {isWifi ? (
                <div className="flex items-center justify-center">
                  <Wifi className="w-8 h-8 text-emerald-400" />
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <Smartphone className="w-8 h-8 text-amber-400" />
                </div>
              )}

              <span className={`absolute -bottom-1 -right-1 p-1 rounded-full text-white shadow ${
                isWifi ? 'bg-emerald-600' : 'bg-amber-600'
              }`}>
                <Download className="w-3.5 h-3.5" />
              </span>
            </div>

            <DialogTitle className="text-xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
              <span>Actualización del APK</span>
              {isMandatory && (
                <Badge variant="destructive" className="text-[10px] uppercase font-bold py-0.5 px-2 bg-red-600/90 text-white">
                  Requerida
                </Badge>
              )}
            </DialogTitle>

            <DialogDescription className="text-slate-300 text-xs leading-relaxed">
              {isWifi ? (
                <span className="text-emerald-300 font-medium">
                  📶 Estás conectado a Wi-Fi. Puedes actualizar el APK de forma rápida y sin consumir tus datos móviles.
                </span>
              ) : (
                <span className="text-amber-300 font-medium">
                  📱 Estás en datos móviles ({connectionType}). Te recomendamos conectarte a Wi-Fi para realizar la descarga.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {/* Caja con detalles de versión */}
          <div className="my-3 bg-slate-950/90 rounded-2xl p-4 border border-slate-800 space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="space-y-0.5">
                <span className="text-slate-400 text-[11px] block">Versión actual:</span>
                <span className="font-mono font-bold text-slate-300">v{installedVersion}</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500" />
              <div className="text-right space-y-0.5">
                <span className="text-slate-400 text-[11px] block">Nueva versión:</span>
                <span className="font-mono font-bold text-emerald-400 flex items-center gap-1 justify-end">
                  v{versionData.latestVersion}
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                </span>
              </div>
            </div>

            {/* Tamaño y Notas */}
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-slate-500" />
                Tamaño del APK:
              </span>
              <span className="font-semibold text-slate-200">
                ~{versionData.apkSizeMb || '8.2'} MB
              </span>
            </div>

            {versionData.releaseNotes && (
              <div className="pt-2 border-t border-slate-800">
                <span className="text-slate-400 block mb-1 font-semibold text-[11px]">
                  Novedades de esta versión:
                </span>
                <p className="text-slate-200 italic text-[11px] leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                  {versionData.releaseNotes}
                </p>
              </div>
            )}
          </div>

          {/* Acciones principales */}
          <div className="space-y-2 pt-1">
            {/* Si está en Wi-Fi: botón principal para descargar de inmediato */}
            {isWifi ? (
              <Button
                onClick={handleDownload}
                disabled={isDownloading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-12 text-sm rounded-xl shadow-lg shadow-emerald-950/60 transition-all active:scale-[0.98]"
              >
                <Download className={`w-5 h-5 mr-2 ${isDownloading ? 'animate-bounce' : ''}`} />
                {isDownloading ? 'Descargando APK...' : 'Descargar e Instalar APK'}
              </Button>
            ) : (
              // Si está en datos móviles:
              <>
                <Button
                  onClick={handleDismiss}
                  variant="outline"
                  className="w-full border-emerald-600/50 bg-emerald-950/30 text-emerald-300 hover:bg-emerald-950/60 font-semibold h-11 text-xs rounded-xl"
                >
                  <Wifi className="w-4 h-4 mr-2 text-emerald-400" />
                  Esperar a conectar a Wi-Fi (Recomendado)
                </Button>

                <Button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  variant="ghost"
                  className="w-full text-slate-400 hover:text-amber-300 hover:bg-slate-800 text-xs h-9 rounded-lg"
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  {isDownloading ? 'Descargando...' : 'Descargar con datos móviles de todos modos'}
                </Button>
              </>
            )}

            {/* Opción secundaria para cerrar si no es obligatoria */}
            {!isMandatory && isWifi && (
              <Button
                onClick={() => setIsOpen(false)}
                variant="ghost"
                className="w-full text-slate-400 hover:text-white hover:bg-slate-800 text-xs h-9 rounded-lg"
              >
                Recordarme más tarde
              </Button>
            )}

            {/* Reintentar o verificar */}
            <div className="pt-1 flex items-center justify-center">
              <button
                onClick={checkVersion}
                disabled={isChecking}
                className="text-[11px] text-slate-500 hover:text-slate-300 flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className={`w-3 h-3 ${isChecking ? 'animate-spin' : ''}`} />
                {isChecking ? 'Verificando red y versión...' : 'Comprobar de nuevo'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
