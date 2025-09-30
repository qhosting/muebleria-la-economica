
// Página principal de cobranza móvil PWA - VERSIÓN SIMPLIFICADA
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import CobranzaMobile from '@/components/mobile/cobranza-mobile';
import { OfflineCliente } from '@/lib/offline-db';

export default function CobranzaMobilePage() {
  const { data: session, status } = useSession();
  const [initialClientes, setInitialClientes] = useState<OfflineCliente[]>([]);
  const [loading, setLoading] = useState(true);

  const userRole = (session?.user as any)?.role;
  const userId = (session?.user as any)?.id;

  // 🚀 OPTIMIZACIÓN CRÍTICA: Simplificar lógica de carga
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

    // Cargar datos de forma simple sin dependencias complejas
    loadInitialData();
  }, [session, status, userRole, userId]);

  const loadInitialData = async () => {
    try {
      if (!userId) {
        setLoading(false);
        return;
      }

      // Intentar cargar clientes solo si hay conexión
      if (typeof window !== 'undefined' && navigator.onLine) {
        const response = await fetch(`/api/sync/clientes/${userId}?full=true`);
        if (response.ok) {
          const clientes = await response.json();
          setInitialClientes(clientes || []);
        }
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      // En caso de error, continuar con array vacío
      setInitialClientes([]);
    } finally {
      setLoading(false);
    }
  };

  // Estados de carga simplificados
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    redirect('/login');
    return null;
  }

  if (userRole !== 'cobrador') {
    redirect('/dashboard');
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando datos...</p>
        </div>
      </div>
    );
  }

  return <CobranzaMobile initialClientes={initialClientes} />;
}
