'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';

export default function DebugSessionPage() {
  const { data: session, status } = useSession();
  const [apiTest, setApiTest] = useState<any>(null);
  
  useEffect(() => {
    if (session) {
      testClientesAPI();
    }
  }, [session]);

  const testClientesAPI = async () => {
    try {
      const response = await fetch('/api/clientes?limit=5');
      if (response.ok) {
        const data = await response.json();
        setApiTest({ success: true, data });
      } else {
        const errorData = await response.json();
        setApiTest({ success: false, error: errorData, status: response.status });
      }
    } catch (error) {
      setApiTest({ success: false, error: error instanceof Error ? error.message : 'Error desconocido' });
    }
  };

  if (status === 'loading') {
    return <div className="p-8">Cargando sesión...</div>;
  }

  if (status === 'unauthenticated') {
    return <div className="p-8">
      <h1 className="text-2xl mb-4">Debug Session - No Autenticado</h1>
      <p>Por favor inicia sesión primero.</p>
      <a href="/login" className="text-blue-600 underline">Ir al login</a>
    </div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Debug Session</h1>
      
      <div className="space-y-6">
        <div className="bg-gray-100 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Información de Sesión</h2>
          <pre className="text-sm overflow-x-auto">
            {JSON.stringify(session, null, 2)}
          </pre>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Test API Clientes</h2>
          {apiTest ? (
            <pre className="text-sm overflow-x-auto">
              {JSON.stringify(apiTest, null, 2)}
            </pre>
          ) : (
            <p>Ejecutando test...</p>
          )}
        </div>

        <div className="space-y-2">
          <a href="/dashboard" className="block bg-blue-600 text-white px-4 py-2 rounded text-center">
            Ir al Dashboard
          </a>
          <a href="/dashboard/clientes" className="block bg-green-600 text-white px-4 py-2 rounded text-center">
            Ir a Clientes Directamente
          </a>
          <button 
            onClick={() => testClientesAPI()} 
            className="block w-full bg-orange-600 text-white px-4 py-2 rounded text-center"
          >
            Reprobar API Clientes
          </button>
        </div>
      </div>
    </div>
  );
}