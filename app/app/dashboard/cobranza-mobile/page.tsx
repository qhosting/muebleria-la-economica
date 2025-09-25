
// Página principal de cobranza móvil PWA
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import CobranzaMobile from '@/components/mobile/cobranza-mobile';
import { OfflineCliente } from '@/lib/offline-db';
import { useNetworkStatus } from '@/hooks/use-network-status';

export default function CobranzaMobilePage() {
  const { data: session, status } = useSession();
  const [initialClientes, setInitialClientes] = useState<OfflineCliente[]>([]);
  const [loading, setLoading] = useState(true);
  const { isOnline } = useNetworkStatus();

  const userRole = (session?.user as any)?.role;
  const userId = (session?.user as any)?.id;

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      redirect('/login');
      return;
    }

    if (userRole !== 'cobrador') {
      redirect('/dashboard');
      return;
    }

    loadInitialData();
  }, [session, status, userRole]);

  const loadInitialData = async () => {
    if (!userId || !isOnline) {
      setLoading(false);
      return;
    }

    try {
      // Cargar clientes desde el servidor si estamos online
      const response = await fetch(`/api/sync/clientes/${userId}?full=true`);
      if (response.ok) {
        const clientes = await response.json();
        setInitialClientes(clientes);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (userRole !== 'cobrador') {
    redirect('/dashboard');
    return null;
  }

  return <CobranzaMobile initialClientes={initialClientes} />;
}
