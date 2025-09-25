
// Componente principal de cobranza móvil con funcionalidad offline
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  Filter,
  Users,
  TrendingUp,
  DollarSign,
  Calendar,
  RefreshCw,
  Grid3x3,
  List,
  SortAsc,
  SortDesc,
  MapPin,
  Wifi,
  WifiOff,
  Database
} from 'lucide-react';
import { OfflineCliente, db, getSyncStats } from '@/lib/offline-db';
import { syncService } from '@/lib/sync-service';
import { SyncStatus } from './sync-status';
import { ClientCard } from './client-card';
import { CobroModal } from './cobro-modal';
import { MotararioModal } from './motarario-modal';
import { formatCurrency, getDayName } from '@/lib/utils';
import { toast } from 'sonner';
import { useLiveQuery } from 'dexie-react-hooks';
import { FooterVersion } from '@/components/version-info';

interface CobranzaMobileProps {
  initialClientes?: OfflineCliente[];
}

export default function CobranzaMobile({ initialClientes = [] }: CobranzaMobileProps) {
  const { data: session } = useSession();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDia, setSelectedDia] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [sortBy, setSortBy] = useState<'nombre' | 'saldo' | 'dia'>('nombre');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedCliente, setSelectedCliente] = useState<OfflineCliente | null>(null);
  const [showCobroModal, setShowCobroModal] = useState(false);
  const [showMotararioModal, setShowMotararioModal] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const userRole = (session?.user as any)?.role;
  const userId = (session?.user as any)?.id;

  // Query live de clientes offline usando Dexie
  const clientesOffline = useLiveQuery(
    () => {
      if (!userId) return [];
      
      return db.clientes
        .where('cobradorAsignadoId')
        .equals(userId)
        .and(cliente => cliente.statusCuenta === 'activo')
        .toArray();
    },
    [userId]
  ) || [];

  const diasSemana = [
    { value: '1', label: 'Lunes' },
    { value: '2', label: 'Martes' },
    { value: '3', label: 'Miércoles' },
    { value: '4', label: 'Jueves' },
    { value: '5', label: 'Viernes' },
    { value: '6', label: 'Sábado' },
    { value: '7', label: 'Domingo' }
  ];

  useEffect(() => {
    // Listeners para estado de conexión
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (userId && userRole === 'cobrador') {
      loadInitialData();
    }
  }, [userId, userRole]);

  const loadInitialData = async () => {
    if (!userId) return;

    setLoading(true);

    try {
      // Cargar estadísticas
      const stats = await getSyncStats(userId);
      setStats(stats);

      // Si hay clientes iniciales del servidor, guardarlos offline
      if (initialClientes.length > 0 && clientesOffline.length === 0) {
        await Promise.all(
          initialClientes.map(cliente => 
            db.clientes.put({
              ...cliente,
              lastSync: Date.now(),
              syncStatus: 'synced' as const
            })
          )
        );
      }

      // Si estamos online y no hay datos locales, sincronizar
      if (isOnline && clientesOffline.length === 0) {
        await syncService.syncAll(userId, false);
      }

    } catch (error) {
      console.error('Error loading initial data:', error);
      toast.error('Error cargando datos');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar y ordenar clientes
  const filteredClientes = clientesOffline
    .filter(cliente => {
      const matchesSearch = cliente.nombreCompleto
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
        cliente.telefono?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cliente.direccion.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDia = selectedDia === 'all' || cliente.diaPago === selectedDia;
      
      return matchesSearch && matchesDia;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'nombre':
          comparison = a.nombreCompleto.localeCompare(b.nombreCompleto);
          break;
        case 'saldo':
          comparison = a.saldoPendiente - b.saldoPendiente;
          break;
        case 'dia':
          comparison = parseInt(a.diaPago) - parseInt(b.diaPago);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  // Estadísticas calculadas
  const totalSaldoPendiente = filteredClientes.reduce((sum, c) => sum + c.saldoPendiente, 0);
  const clientesConDeuda = filteredClientes.filter(c => c.saldoPendiente > 0).length;
  const clientesAlDia = filteredClientes.filter(c => c.saldoPendiente <= 0).length;

  const handleCobrar = (cliente: OfflineCliente) => {
    setSelectedCliente(cliente);
    setShowCobroModal(true);
  };

  const handleMotarario = (cliente: OfflineCliente) => {
    setSelectedCliente(cliente);
    setShowMotararioModal(true);
  };

  const handleModalSuccess = () => {
    // Recargar estadísticas
    if (userId) {
      loadInitialData();
    }
  };

  const toggleSort = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  if (userRole !== 'cobrador') {
    return (
      <DashboardLayout>
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            Esta sección es solo para cobradores
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-md mx-auto space-y-4 pb-20">
        {/* Header con estado de conexión */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Cobranza Móvil</h1>
            <p className="text-sm text-muted-foreground">
              {filteredClientes.length} clientes
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant={isOnline ? 'default' : 'secondary'}>
              {isOnline ? (
                <><Wifi className="w-3 h-3 mr-1" />Online</>
              ) : (
                <><WifiOff className="w-3 h-3 mr-1" />Offline</>
              )}
            </Badge>
          </div>
        </div>

        {/* Estado de sincronización */}
        <SyncStatus />

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-3 gap-2">
          <Card className="text-center">
            <CardContent className="p-3">
              <div className="text-lg font-semibold text-green-600">{clientesAlDia}</div>
              <div className="text-xs text-muted-foreground">Al día</div>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="p-3">
              <div className="text-lg font-semibold text-red-600">{clientesConDeuda}</div>
              <div className="text-xs text-muted-foreground">Con deuda</div>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="p-3">
              <div className="text-sm font-semibold">{formatCurrency(totalSaldoPendiente)}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros y búsqueda */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex gap-2">
            <Select value={selectedDia} onValueChange={setSelectedDia}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Día" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los días</SelectItem>
                {diasSemana.map((dia) => (
                  <SelectItem key={dia.value} value={dia.value}>
                    {dia.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nombre">Por nombre</SelectItem>
                <SelectItem value="saldo">Por saldo</SelectItem>
                <SelectItem value="dia">Por día</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              onClick={toggleSort}
              className="flex-shrink-0"
            >
              {sortOrder === 'asc' ? (
                <SortAsc className="w-4 h-4" />
              ) : (
                <SortDesc className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Lista de clientes */}
        {loading ? (
          <div className="text-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
            <p className="text-muted-foreground">Cargando clientes...</p>
          </div>
        ) : filteredClientes.length === 0 ? (
          <div className="text-center py-8">
            <Database className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
            <p className="text-muted-foreground">
              {searchTerm || selectedDia !== 'all' 
                ? 'No se encontraron clientes con los filtros aplicados'
                : 'No hay clientes asignados'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredClientes.map((cliente) => (
              <ClientCard
                key={cliente.id}
                cliente={cliente}
                isOnline={isOnline}
                onCobrar={handleCobrar}
                onMotarario={handleMotarario}
                showSyncStatus={true}
              />
            ))}
          </div>
        )}

        {/* Modales */}
        {selectedCliente && (
          <>
            <CobroModal
              cliente={selectedCliente}
              isOpen={showCobroModal}
              onClose={() => setShowCobroModal(false)}
              onSuccess={handleModalSuccess}
              isOnline={isOnline}
            />

            <MotararioModal
              cliente={selectedCliente}
              isOpen={showMotararioModal}
              onClose={() => setShowMotararioModal(false)}
              onSuccess={handleModalSuccess}
              isOnline={isOnline}
            />
          </>
        )}

        {/* Footer con información de versión */}
        <div className="mt-8 pt-4 border-t">
          <FooterVersion />
        </div>
      </div>
    </DashboardLayout>
  );
}
