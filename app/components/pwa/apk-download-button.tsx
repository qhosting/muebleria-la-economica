'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Smartphone, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Capacitor } from '@capacitor/core';
import { APP_VERSION } from '@/lib/version';

interface APKDownloadButtonProps {
  className?: string;
}

export function APKDownloadButton({ className }: APKDownloadButtonProps = {}) {
  const [isNative, setIsNative] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setIsNative(Capacitor.isNativePlatform());
  }, []);

  const handleDownload = () => {
    toast.success('Iniciando descarga del APK', {
      description: 'Guarda e instala LaEconomica.apk en tu teléfono Android'
    });

    const link = document.createElement('a');
    link.href = '/downloads/LaEconomica.apk';
    link.download = 'LaEconomica.apk';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isMounted) {
    return null;
  }

  // Si ya se está ejecutando dentro de la app nativa (APK instalada)
  if (isNative) {
    return (
      <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-xs text-emerald-400">
        <div className="flex items-center gap-2 font-medium">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>App Nativa Instalada (v{APP_VERSION})</span>
        </div>
        <button
          onClick={handleDownload}
          className="text-xs text-emerald-300 underline hover:text-emerald-200"
        >
          Re-descargar APK
        </button>
      </div>
    );
  }

  return (
    <Button
      onClick={handleDownload}
      variant="outline"
      size="sm"
      className={`w-full bg-slate-900 border-slate-700 hover:bg-slate-800 text-emerald-400 hover:text-emerald-300 font-medium h-11 flex items-center justify-center gap-2 shadow-md transition-all ${className || ''}`}
    >
      <Smartphone className="w-4 h-4 text-emerald-400" />
      <Download className="w-4 h-4 text-emerald-400" />
      <span>Descargar APK Android (v{APP_VERSION})</span>
    </Button>
  );
}
