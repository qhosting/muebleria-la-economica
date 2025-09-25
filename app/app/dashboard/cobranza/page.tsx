
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  CreditCard, 
  Search, 
  MapPin, 
  Phone, 
  Calendar,
  DollarSign,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  Receipt,
  Smartphone,
  Wifi,
  WifiOff
} from 'lucide-react';
import { formatCurrency, getDayName } from '@/lib/utils';
import { toast } from 'sonner';
import { Cliente } from '@/lib/types';
import { CobranzaModal } from '@/components/cobranza/cobranza-modal';

export default function CobranzaPage() {
  const { data: session } = useSession();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDia, setSelectedDia] = useState('all');
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [showCobranzaModal, setShowCobranzaModal] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [cobranzaHoy, setCobranzaHoy] = useState(0);
  const [clientesVisitados, setClientesVisitados] = useState(0);

  const userRole = (session?.user as any)?.role;
  const userId = (session?.user as any)?.id;

  const diasSemana = [
    { value: '1', label: 'Lunes' },
    { value: '2', label: 'Martes' },
    { value: '3', label: 'Miércoles' },
    { value: '4', label: 'Jueves' },
    { value: '5', label: 'Viernes' },
    { value: '6', label: 'Sábado' },
    { value: '7', label: 'Domingo' },
  ];

  useEffect(() => {
    if (session && userRole === 'cobrador') {
      fetchClientes();
      fetchEstadisticasHoy();
    }

    // Monitor online status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [session, userRole, selectedDia]);

  const fetchClientes = async () => {
    try {
      const params = new URLSearchParams({
        diaPago: selectedDia === 'all' ? '' : selectedDia,
        statusCuenta: 'activo',
      });

      const response = await fetch(`/api/clientes/cobrador/${userId}?${params}`);
      if (response.ok) {
        const data = await response.json();
        setClientes(data);
      } else {
        throw new Error('Error al obtener clientes');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar clientes');
    } finally {
      setLoading(false);
    }
  };

  const fetchEstadisticasHoy = async () => {
    try {
      const hoy = new Date().toISOString().split('T')[0];
      const response = await fetch(`/api/pagos?cobradorId=${userId}&fechaDesde=${hoy}&fechaHasta=${hoy}`);
      if (response.ok) {
        const data = await response.json();
        const totalCobrado = data.pagos?.reduce((sum: number, pago: any) => sum + Number(pago.monto), 0) || 0;
        setCobranzaHoy(totalCobrado);
        setClientesVisitados(data.pagos?.length || 0);
      }
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
    }
  };

  const filteredClientes = clientes.filter(cliente =>
    cliente.nombreCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.codigoCliente.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePago = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setShowCobranzaModal(true);
  };

  const handlePagoSuccess = () => {
    setShowCobranzaModal(false);
    setSelectedCliente(null);
    fetchClientes();
    fetchEstadisticasHoy();
    toast.success('Pago registrado exitosamente');
  };

  // Verificar permisos
  if (userRole !== 'cobrador') {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Acceso Restringido
          </h3>
          <p className="text-gray-600">
            Esta sección es exclusiva para cobradores.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Offline Indicator */}
        {!isOnline && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <WifiOff className="h-5 w-5 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">
                Modo Offline - Los pagos se sincronizarán cuando haya conexión
              </span>
            </div>
          </div>
        )}

        {/* Header with Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Cobranza Móvil</h1>
            <p className="text-gray-600 mt-1 flex items-center space-x-2">
              <Smartphone className="h-4 w-4" />
              <span>Interfaz optimizada para trabajo en campo</span>
            </p>
          </div>
          <div className="flex items-center space-x-2 mt-4 sm:mt-0">
            {isOnline ? (
              <Badge variant="success" className="flex items-center space-x-1">
                <Wifi className="h-3 w-3" />
                <span>Online</span>
              </Badge>
            ) : (
              <Badge variant="warning" className="flex items-center space-x-1">
                <WifiOff className="h-3 w-3" />
                <span>Offline</span>
              </Badge>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center space-x-2">
                <DollarSign className="h-5 w-5" />
                <span>Cobranza Hoy</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(cobranzaHoy)}</div>
              <p className="text-green-100 text-sm">Total cobrado</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center space-x-2">
                <CheckCircle className="h-5 w-5" />
                <span>Visitas Realizadas</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{clientesVisitados}</div>
              <p className="text-blue-100 text-sm">Clientes atendidos</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Pendientes</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredClientes.length}</div>
              <p className="text-purple-100 text-sm">En la ruta</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filtrar Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar cliente o código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedDia} onValueChange={setSelectedDia}>
                <SelectTrigger>
                  <SelectValue placeholder="Día de pago" />
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
            </div>
          </CardContent>
        </Card>

        {/* Clientes List */}
        {loading ? (
          <div className="grid gap-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-full" />
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredClientes.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay clientes para hoy
              </h3>
              <p className="text-gray-600">
                No tienes clientes asignados para el día seleccionado.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredClientes.map((cliente) => (
              <Card 
                key={cliente.id} 
                className="animate-fade-in hover:shadow-md transition-all duration-200"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg text-gray-900">
                        {cliente.nombreCompleto}
                      </CardTitle>
                      <CardDescription className="flex items-center space-x-2 mt-1">
                        <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                          {cliente.codigoCliente}
                        </span>
                        <Badge variant={cliente.saldoActual > 0 ? "warning" : "success"}>
                          {cliente.saldoActual > 0 ? "Saldo pendiente" : "Al corriente"}
                        </Badge>
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    {cliente.telefono && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Phone className="h-4 w-4" />
                        <a 
                          href={`tel:${cliente.telefono}`}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          {cliente.telefono}
                        </a>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span className="flex-1">{cliente.direccionCompleta}</span>
                    </div>

                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {getDayName(cliente.diaPago)} - {formatCurrency(cliente.montoPago)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div>
                      <p className="text-sm text-gray-600">Saldo actual:</p>
                      <p className={`font-bold text-lg ${
                        cliente.saldoActual > 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {formatCurrency(cliente.saldoActual)}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center space-x-1"
                      >
                        <Receipt className="h-4 w-4" />
                        <span>Historial</span>
                      </Button>
                      <Button
                        onClick={() => handlePago(cliente)}
                        size="sm"
                        className="flex items-center space-x-1"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Registrar Pago</span>
                      </Button>
                    </div>
                  </div>

                  {cliente.saldoActual > cliente.montoPago && (
                    <div className="flex items-center space-x-2 text-sm text-orange-600 bg-orange-50 p-2 rounded">
                      <AlertCircle className="h-4 w-4" />
                      <span>Cliente con atraso en pagos</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Cobranza Modal */}
      {showCobranzaModal && selectedCliente && (
        <CobranzaModal
          cliente={selectedCliente}
          isOpen={showCobranzaModal}
          onClose={() => setShowCobranzaModal(false)}
          onSuccess={handlePagoSuccess}
        />
      )}
    </DashboardLayout>
  );
}
