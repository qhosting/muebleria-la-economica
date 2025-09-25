
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
  Users, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Phone, 
  MapPin, 
  Calendar,
  DollarSign,
  Filter
} from 'lucide-react';
import { formatCurrency, formatDate, getDayName, getPeriodicidadLabel } from '@/lib/utils';
import { toast } from 'sonner';
import { Cliente, User } from '@/lib/types';

interface ClientesResponse {
  clientes: Cliente[];
  pagination: {
    total: number;
    pages: number;
    currentPage: number;
    perPage: number;
  };
}

export default function ClientesPage() {
  const { data: session } = useSession();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [cobradores, setCobradores] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCobrador, setSelectedCobrador] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 0,
    currentPage: 1,
    perPage: 20,
  });

  const userRole = (session?.user as any)?.role;

  useEffect(() => {
    if (session) {
      fetchClientes();
      fetchCobradores();
    }
  }, [session, currentPage, searchTerm, selectedCobrador, selectedStatus]);

  const fetchClientes = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        search: searchTerm,
        cobrador: selectedCobrador === 'all' ? '' : selectedCobrador,
        status: selectedStatus === 'all' ? '' : selectedStatus,
      });

      const response = await fetch(`/api/clientes?${params}`);
      if (response.ok) {
        const data: ClientesResponse = await response.json();
        setClientes(data.clientes);
        setPagination(data.pagination);
      } else if (response.status === 401) {
        console.log('Usuario no autenticado, redirigiendo al login');
        window.location.href = '/login';
        return;
      } else {
        throw new Error(`Error al obtener clientes: ${response.status}`);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar clientes. Verifique su conexión.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCobradores = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const users: User[] = await response.json();
        setCobradores(users.filter(u => u.role === 'cobrador' && u.isActive));
      } else if (response.status === 401) {
        console.log('Usuario no autenticado al obtener cobradores');
        return;
      }
    } catch (error) {
      console.error('Error al obtener cobradores:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'activo') {
      return <Badge variant="success">Activo</Badge>;
    }
    return <Badge variant="secondary">Inactivo</Badge>;
  };

  const getSaldoBadge = (saldo: number) => {
    if (saldo === 0) {
      return <Badge variant="success">Al corriente</Badge>;
    } else if (saldo > 0) {
      return <Badge variant="warning">Saldo pendiente</Badge>;
    }
    return <Badge variant="secondary">Sin saldo</Badge>;
  };

  // Verificar permisos
  if (!['admin', 'gestor_cobranza'].includes(userRole)) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Acceso Restringido
          </h3>
          <p className="text-gray-600">
            No tienes permisos para acceder a la gestión de clientes.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Clientes</h1>
            <p className="text-gray-600 mt-1">
              Administra la información y asignaciones de clientes
            </p>
          </div>
          <Button className="mt-4 sm:mt-0">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Cliente
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Filtros</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedCobrador} onValueChange={setSelectedCobrador}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cobrador" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los cobradores</SelectItem>
                  {cobradores.map((cobrador) => (
                    <SelectItem key={cobrador.id} value={cobrador.id}>
                      {cobrador.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado de cuenta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="activo">Activos</SelectItem>
                  <SelectItem value="inactivo">Inactivos</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center text-sm text-gray-600">
                Total: {pagination.total} clientes
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Clientes List */}
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
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
        ) : clientes.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay clientes
              </h3>
              <p className="text-gray-600 mb-4">
                No se encontraron clientes con los filtros aplicados.
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Crear primer cliente
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {clientes.map((cliente) => (
              <Card 
                key={cliente.id} 
                className="animate-fade-in hover:shadow-md transition-shadow"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {cliente.nombreCompleto}
                      </CardTitle>
                      <CardDescription className="flex items-center space-x-2">
                        <span className="font-mono text-sm">
                          {cliente.codigoCliente}
                        </span>
                        {getStatusBadge(cliente.statusCuenta)}
                      </CardDescription>
                    </div>
                    <div className="flex space-x-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Edit className="h-4 w-4" />
                      </Button>
                      {userRole === 'admin' && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {cliente.telefono && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4" />
                      <span>{cliente.telefono}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span className="truncate">{cliente.direccionCompleta}</span>
                  </div>

                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {getDayName(cliente.diaPago)} - {getPeriodicidadLabel(cliente.periodicidad)}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <DollarSign className="h-4 w-4" />
                    <span>Pago: {formatCurrency(cliente.montoPago)}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Saldo: {formatCurrency(cliente.saldoActual)}
                      </p>
                      {getSaldoBadge(cliente.saldoActual)}
                    </div>
                  </div>

                  {cliente.cobradorAsignado && (
                    <div className="pt-2 border-t border-gray-100">
                      <p className="text-xs text-gray-500">Cobrador asignado:</p>
                      <p className="text-sm font-medium text-gray-900">
                        {cliente.cobradorAsignado.name}
                      </p>
                    </div>
                  )}

                  <div className="text-xs text-gray-500">
                    Registrado: {formatDate(cliente.createdAt)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Mostrando {((currentPage - 1) * pagination.perPage) + 1} a{' '}
              {Math.min(currentPage * pagination.perPage, pagination.total)} de{' '}
              {pagination.total} clientes
            </p>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <div className="flex items-center space-x-1">
                {[...Array(Math.min(5, pagination.pages))].map((_, i) => {
                  const page = i + 1;
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="w-8"
                    >
                      {page}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(pagination.pages, prev + 1))}
                disabled={currentPage === pagination.pages}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
