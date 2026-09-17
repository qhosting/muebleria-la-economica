'use client';

import { useState, useEffect } from 'react';
import { APP_VERSION, APP_VERSION_CODE } from '@/lib/version';
import { apiFetch, getFullPath } from '@/lib/api-config';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Download, RefreshCw, ShieldAlert } from 'lucide-react';

interface VersionResponse {
  latestVersion: string;
  minRequiredVersion: string;
  versionCode?: number;
  forceUpdate: boolean;
  releaseDate?: string;
  downloadUrl: string;
  releaseNotes?: string;
}

function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(p => parseInt(p, 10) || 0);
  const parts2 = v2.split('.').map(p => parseInt(p, 10) || 0);
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
  const [updateRequired, setUpdateRequired] = useState(false);
  const [versionData, setVersionData] = useState<VersionResponse | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkVersion = async () => {
    if (typeof window === 'undefined') return;
    if (!navigator.onLine) return; // Si no hay red, no bloquear localmente

    setIsChecking(true);
    try {
      const response = await apiFetch('/api/app-version?_t=' + Date.now());
      if (response.ok) {
        const data: VersionResponse = await response.json();
        setVersionData(data);

        // Comparar versión
        const isOutdated = compareVersions(APP_VERSION, data.minRequiredVersion) < 0;
        const isCodeOutdated = data.versionCode ? APP_VERSION_CODE < data.versionCode : false;

        if ((isOutdated || isCodeOutdated) && data.forceUpdate) {
          setUpdateRequired(true);
        } else {
          setUpdateRequired(false);
        }
      }
    } catch (error) {
      console.log('No se pudo verificar versión del servidor:', error);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkVersion();

    // Re-verificar cada 15 minutos
    const interval = setInterval(checkVersion, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleDownload = () => {
    if (!versionData?.downloadUrl) return;
    const fullUrl = getFullPath(versionData.downloadUrl);
    window.open(fullUrl, '_system');
  };

  if (!updateRequired || !versionData) {
    return null;
  }

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent 
        className="max-w-md w-[92%] bg-slate-900 border-slate-700 text-white p-6 rounded-2xl shadow-2xl [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="space-y-3 text-center">
          <div className="mx-auto w-14 h-14 bg-amber-500/20 border border-amber-500/40 rounded-2xl flex items-center justify-center">
            <ShieldAlert className="w-8 h-8 text-amber-400" />
          </div>
          <DialogTitle className="text-xl font-bold tracking-tight text-white">
            Actualización Requerida
          </DialogTitle>
          <DialogDescription className="text-slate-300 text-sm">
            Existe una nueva versión obligatoria para continuar cobrando y sincronizando en campo.
          </DialogDescription>
        </DialogHeader>

        <div className="my-4 bg-slate-950/80 rounded-xl p-4 border border-slate-800 space-y-2.5 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-400">Versión instalada:</span>
            <span className="font-mono font-bold text-red-400">v{APP_VERSION}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Versión requerida:</span>
            <span className="font-mono font-bold text-emerald-400">v{versionData.minRequiredVersion}</span>
          </div>
          {versionData.releaseNotes && (
            <div className="pt-2 border-t border-slate-800">
              <span className="text-slate-400 block mb-1">Novedades:</span>
              <p className="text-slate-200 italic">{versionData.releaseNotes}</p>
            </div>
          )}
        </div>

        <div className="space-y-2.5 pt-2">
          <Button
            onClick={handleDownload}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-12 text-sm shadow-lg shadow-emerald-950/50"
          >
            <Download className="w-5 h-5 mr-2" />
            Descargar e Instalar APK
          </Button>

          <Button
            onClick={checkVersion}
            disabled={isChecking}
            variant="ghost"
            className="w-full text-slate-400 hover:text-white hover:bg-slate-800 text-xs h-9"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isChecking ? 'animate-spin' : ''}`} />
            {isChecking ? 'Verificando...' : 'Reintentar verificación'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
