
// Hook personalizado para manejo de estado de conectividad
'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    // Establecer estado inicial (solo en el cliente)
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
    }

    const handleOnline = () => {
      setIsOnline(true);
      
      if (wasOffline) {
        toast.success('Conexión restaurada', {
          description: 'Los datos se sincronizarán automáticamente',
          duration: 3000
        });
        setWasOffline(false);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      
      toast.info('Trabajando offline', {
        description: 'Los datos se guardarán localmente hasta que tengas conexión',
        duration: 4000
      });
    };

    // Event listeners (solo en el cliente)
    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }

    // Cleanup
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
    };
  }, [wasOffline]);

  return { isOnline, wasOffline };
}
