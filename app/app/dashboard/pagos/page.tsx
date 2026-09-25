
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Receipt,
  Search,
  Filter,
  Download,
  Calendar,
  User,
  DollarSign,
  FileText,
  UserCheck,
  Users,
  TrendingUp,
  CalendarRange,
  RotateCcw,
  CheckCircle2,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { TicketModal } from '@/components/mobile/ticket-modal';
import { TicketData } from '@/lib/bluetooth-printer';

interface Pago {
  id: string;
  monto: number;
  concepto: string;
  tipoPago: 'regular' | 'moratorio';
  fechaPago: string;
  saldoAnterior: number;
  saldoNuevo: number;
  ticketImpreso: boolean;
  sincronizado: boolean;
  cliente: {
    nombreCompleto: string;
    codigoCliente: string;
  };
  cobradorId?: string | null;
  cobrador?: {
    name: string;
  } | null;
}

interface EstadisticasPagos {
  totalPagos: number;
  montoTotal: number;
  pagosRegulares: number;
  pagosMoratorios: number;
  ticketsImpresos: number;
}

interface ResumenGestor {
  id: string;
  nombre: string;
  totalCobrado: number;
  cantidadPagos: number;
  porcentaje: number;
}

// Cálculo de la semana de cobranza (Sábado a Viernes) tomando como base una fecha
function getSemanaSabadoViernes(fechaRef: Date = new Date()) {
  const d = new Date(fechaRef);
  const day = d.getDay(); // 0 = Dom, 1 = Lun, ..., 5 = Vie, 6 = Sáb
  const diffToSaturday = day === 6 ? 0 : (day + 1);

  const sabado = new Date(d);
  sabado.setDate(d.getDate() - diffToSaturday);

  const viernes = new Date(sabado);
  viernes.setDate(sabado.getDate() + 6);

  const formatYMD = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const dayStr = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${dayStr}`;
  };

  return {
    inicio: formatYMD(sabado),
    fin: formatYMD(viernes),
    sabadoDate: sabado,
    viernesDate: viernes,
  };
}

function getSemanaAnteriorSabadoViernes(fechaRef: Date = new Date()) {
  const { sabadoDate } = getSemanaSabadoViernes(fechaRef);
  const prevSabado = new Date(sabadoDate);
  prevSabado.setDate(sabadoDate.getDate() - 7);

  const prevViernes = new Date(prevSabado);
  prevViernes.setDate(prevSabado.getDate() + 6);

  const formatYMD = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const dayStr = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${dayStr}`;
  };

  return {
    inicio: formatYMD(prevSabado),
    fin: formatYMD(prevViernes),
  };
}

export default function PagosPage() {
  const { data: session } = useSession();
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [cobradores, setCobradores] = useState<{ id: string; name: string }[]>([]);
  const [estadisticas, setEstadisticas] = useState<EstadisticasPagos | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTipo, setSelectedTipo] = useState('all');
  const [selectedCobrador, setSelectedCobrador] = useState('all');

  // Filtro de Rango de Fechas - Por defecto: Esta Semana (Sábado a Viernes tomando fecha hoy)
  const [fechaInicio, setFechaInicio] = useState<string>(() => getSemanaSabadoViernes(new Date()).inicio);
  const [fechaFin, setFechaFin] = useState<string>(() => getSemanaSabadoViernes(new Date()).fin);
  const [presetFecha, setPresetFecha] = useState<string>('esta-semana');

  const [showTicketModal, setShowTicketModal] = useState(false);
  const [activeTicketData, setActiveTicketData] = useState<TicketData | null>(null);
  const [printingId, setPrintingId] = useState<string | null>(null);

  useEffect(() => {
    fetchCobradores();
  }, []);

  useEffect(() => {
    fetchPagos();
  }, [selectedTipo, selectedCobrador, fechaInicio, fechaFin]);

  const fetchPagos = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('limit', '2000');
      if (selectedTipo !== 'all') params.set('tipoPago', selectedTipo);
      if (selectedCobrador !== 'all') params.set('cobradorId', selectedCobrador);
      if (fechaInicio) params.set('fechaDesde', fechaInicio);
      if (fechaFin) params.set('fechaHasta', fechaFin);

      const response = await fetch(`/api/pagos?${params.toString()}`);
      const data = await response.json();
      setPagos(data.pagos || []);
      setEstadisticas(data.estadisticas || null);
    } catch (error) {
      console.error('Error al cargar pagos:', error);
      toast.error('Error al cargar pagos');
    } finally {
      setLoading(false);
    }
  };

  const aplicarPreset = (preset: string) => {
    setPresetFecha(preset);
    const hoy = new Date();
    const formatYMD = (date: Date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const dayStr = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${dayStr}`;
    };

    if (preset === 'esta-semana') {
      const { inicio, fin } = getSemanaSabadoViernes(hoy);
      setFechaInicio(inicio);
      setFechaFin(fin);
    } else if (preset === 'semana-anterior') {
      const { inicio, fin } = getSemanaAnteriorSabadoViernes(hoy);
      setFechaInicio(inicio);
      setFechaFin(fin);
    } else if (preset === 'hoy') {
      const hoyStr = formatYMD(hoy);
      setFechaInicio(hoyStr);
      setFechaFin(hoyStr);
    } else if (preset === 'este-mes') {
      const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
      setFechaInicio(formatYMD(primerDia));
      setFechaFin(formatYMD(ultimoDia));
    } else if (preset === 'todos') {
      setFechaInicio('');
      setFechaFin('');
    }
  };

  // Resumen calculado por gestor basado en los pagos actualmente cargados en el rango
  const resumenGestores: ResumenGestor[] = (() => {
    const map = new Map<string, ResumenGestor>();
    const totalRecaudado = pagos.reduce((acc, p) => acc + (p.monto || 0), 0);

    pagos.forEach(p => {
      const idCob = p.cobradorId || (p.cobrador?.name?.trim() ? `nombre_${p.cobrador.name.trim()}` : 'sin_asignar');
      const nombreCob = p.cobrador?.name?.trim() || 'Venta / Sin Asignar';
      const prev = map.get(idCob) || {
        id: idCob,
        nombre: nombreCob,
        totalCobrado: 0,
        cantidadPagos: 0,
        porcentaje: 0,
      };
      prev.totalCobrado += (p.monto || 0);
      prev.cantidadPagos += 1;
      map.set(idCob, prev);
    });

    return Array.from(map.values())
      .map(g => ({
        ...g,
        porcentaje: totalRecaudado > 0 ? (g.totalCobrado / totalRecaudado) * 100 : 0
      }))
      .sort((a, b) => b.totalCobrado - a.totalCobrado);
  })();

  const totalPeriodo = pagos.reduce((sum, p) => sum + (p.monto || 0), 0);
  const totalCantidadPagos = pagos.length;

  const fetchCobradores = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const users = await response.json();
        const filteredCobradores = users
          .filter((u: any) => u.role === 'cobrador' && u.isActive)
          .map((u: any) => ({ id: u.id, name: u.name }));
        setCobradores(filteredCobradores);
      }
    } catch (error) {
      console.error('Error al obtener cobradores:', error);
    }
  };

  const reimprimir = async (pagoId: string) => {
    try {
      setPrintingId(pagoId);
      const response = await fetch(`/api/pagos/${pagoId}/reimprimir`, {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok && data.ticketData) {
        setActiveTicketData(data.ticketData);
        setShowTicketModal(true);
        // Actualizar ticketImpreso en el estado local
        setPagos(prev =>
          prev.map(p => (p.id === pagoId ? { ...p, ticketImpreso: true } : p))
        );
      } else {
        throw new Error(data.error || 'Error al reimprimir');
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al reimprimir ticket');
    } finally {
      setPrintingId(null);
    }
  };

  const exportarPagos = () => {
    if (filteredPagos.length === 0) {
      toast.info('No hay pagos para exportar con los filtros seleccionados');
      return;
    }

    try {
      const headers = ['Fecha', 'Cliente', 'Código Cliente', 'Concepto', 'Tipo', 'Monto', 'Cobrador', 'Ticket Impreso'];
      const rows = filteredPagos.map(p => [
        `"${formatDate(new Date(p.fechaPago))}"`,
        `"${(p.cliente?.nombreCompleto || '').replace(/"/g, '""')}"`,
        `"${p.cliente?.codigoCliente || ''}"`,
        `"${(p.concepto || '').replace(/"/g, '""')}"`,
        p.tipoPago === 'regular' ? 'Regular' : 'Moratorio',
        p.monto || 0,
        `"${(p.cobrador?.name || 'Venta / Sin Asignar').replace(/"/g, '""')}"`,
        p.ticketImpreso ? 'Sí' : 'No'
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      const filename = `pagos_${fechaInicio || 'inicio'}_al_${fechaFin || 'fin'}.csv`;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Exportados ${filteredPagos.length} pagos exitosamente`);
    } catch (error) {
      console.error('Error al exportar pagos:', error);
      toast.error('Error al generar archivo CSV');
    }
  };

  const filteredPagos = pagos.filter(pago =>
    pago.cliente?.nombreCompleto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pago.cliente?.codigoCliente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pago.concepto?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!session) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Registro de Pagos</h1>
            <p className="text-gray-600">Historial completo y control de cobranza por ciclo de fechas</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchPagos}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RotateCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            <Button onClick={exportarPagos} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Exportar CSV
            </Button>
          </div>
        </div>

        {/* Filtros de Rango de Fechas y Búsqueda */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3 border-b bg-gray-50/50">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="flex items-center gap-2">
                <CalendarRange className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle className="text-base font-semibold text-gray-900">
                    Filtro de Fecha y Ciclo de Cobranza
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Ciclo semanal de la mueblería: Sábado a Viernes
                  </CardDescription>
                </div>
              </div>

              {/* Botones de Selección Rápida (Presets) */}
              <div className="flex flex-wrap items-center gap-1.5">
                <Button
                  type="button"
                  size="sm"
                  variant={presetFecha === 'esta-semana' ? 'default' : 'outline'}
                  onClick={() => aplicarPreset('esta-semana')}
                  className="h-8 text-xs font-medium"
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  Esta Semana (Sáb - Vie)
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={presetFecha === 'semana-anterior' ? 'default' : 'outline'}
                  onClick={() => aplicarPreset('semana-anterior')}
                  className="h-8 text-xs font-medium"
                >
                  Semana Anterior
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={presetFecha === 'hoy' ? 'default' : 'outline'}
                  onClick={() => aplicarPreset('hoy')}
                  className="h-8 text-xs font-medium"
                >
                  Hoy
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={presetFecha === 'este-mes' ? 'default' : 'outline'}
                  onClick={() => aplicarPreset('este-mes')}
                  className="h-8 text-xs font-medium"
                >
                  Este Mes
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={presetFecha === 'todos' ? 'default' : 'outline'}
                  onClick={() => aplicarPreset('todos')}
                  className="h-8 text-xs font-medium"
                >
                  Todo
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Fecha Desde */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Fecha Desde
                </label>
                <Input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => {
                    setFechaInicio(e.target.value);
                    setPresetFecha('personalizado');
                  }}
                  className="h-9 text-sm"
                />
              </div>

              {/* Fecha Hasta */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Fecha Hasta
                </label>
                <Input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => {
                    setFechaFin(e.target.value);
                    setPresetFecha('personalizado');
                  }}
                  className="h-9 text-sm"
                />
              </div>

              {/* Búsqueda por texto */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Buscar
                </label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Cliente, código..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 h-9 text-sm"
                  />
                </div>
              </div>

              {/* Tipo de Pago */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Tipo de Pago
                </label>
                <Select value={selectedTipo} onValueChange={setSelectedTipo}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Tipo de pago" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los tipos</SelectItem>
                    <SelectItem value="regular">Pagos regulares</SelectItem>
                    <SelectItem value="moratorio">Pagos moratorios</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Cobrador */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Gestor / Cobrador
                </label>
                <Select value={selectedCobrador} onValueChange={setSelectedCobrador}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Cobrador" />
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
              </div>
            </div>

            {/* Rango Activo Indicador */}
            <div className="flex flex-wrap items-center justify-between text-xs text-gray-600 bg-gray-50 px-3 py-2 rounded-md border border-gray-100">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-800">Periodo activo:</span>
                {fechaInicio && fechaFin ? (
                  <span>
                    Del <strong className="text-gray-900">{fechaInicio}</strong> al <strong className="text-gray-900">{fechaFin}</strong>
                  </span>
                ) : fechaInicio ? (
                  <span>Desde <strong className="text-gray-900">{fechaInicio}</strong> en adelante</span>
                ) : (
                  <span>Historial completo</span>
                )}
                {selectedCobrador !== 'all' && (
                  <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-800 text-xs font-normal">
                    Filtrando por cobrador
                    <button
                      onClick={() => setSelectedCobrador('all')}
                      className="ml-1 hover:text-red-600 font-bold"
                      title="Quitar filtro de cobrador"
                    >
                      ×
                    </button>
                  </Badge>
                )}
              </div>
              <div className="font-medium text-gray-700">
                Mostrando: <strong className="text-gray-900">{filteredPagos.length}</strong> pagos
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resumen de Cobranza por Gestor */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3 border-b bg-gradient-to-r from-blue-50/50 via-indigo-50/30 to-transparent">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    Resumen de Cobranza por Gestor
                  </CardTitle>
                  <CardDescription className="text-xs text-gray-600">
                    Recaudación acumulada y distribución por cobrador en el rango activo
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-lg border shadow-sm">
                <div className="text-right">
                  <div className="text-xs text-gray-500 font-medium">Total Recaudado</div>
                  <div className="text-base font-bold text-green-600">
                    {formatCurrency(totalPeriodo)}
                  </div>
                </div>
                <div className="h-8 w-px bg-gray-200" />
                <div className="text-right">
                  <div className="text-xs text-gray-500 font-medium">Total Recibos</div>
                  <div className="text-base font-bold text-gray-800">
                    {totalCantidadPagos}
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {loading ? (
              <div className="text-center py-6 text-sm text-gray-500">
                Calculando resumen por gestor...
              </div>
            ) : resumenGestores.length === 0 ? (
              <div className="text-center py-6 text-sm text-gray-500">
                No hay cobranza registrada para los filtros de fecha seleccionados.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {resumenGestores.map((gestor) => {
                  const isActive = selectedCobrador === gestor.id;
                  return (
                    <div
                      key={gestor.id}
                      onClick={() => {
                        // Si ya está seleccionado, quitar filtro; si no, seleccionarlo
                        if (gestor.id !== 'sin_asignar') {
                          setSelectedCobrador(isActive ? 'all' : gestor.id);
                        }
                      }}
                      className={`relative p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isActive
                          ? 'border-blue-500 bg-blue-50/50 shadow-sm ring-2 ring-blue-400/30'
                          : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                            isActive ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                          }`}>
                            <UserCheck className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-semibold text-gray-900 truncate" title={gestor.nombre}>
                              {gestor.nombre}
                            </h4>
                            <p className="text-xs text-gray-500">
                              {gestor.cantidadPagos} {gestor.cantidadPagos === 1 ? 'cobro' : 'cobros'}
                            </p>
                          </div>
                        </div>
                        {isActive && (
                          <Badge className="bg-blue-600 text-white text-[10px] px-1.5 py-0 h-4">
                            Filtrado
                          </Badge>
                        )}
                      </div>

                      <div className="mt-2 mb-2.5">
                        <div className="text-lg font-bold text-green-600 leading-tight">
                          {formatCurrency(gestor.totalCobrado)}
                        </div>
                        <div className="flex justify-between items-center text-xs text-gray-500 mt-0.5">
                          <span>Participación</span>
                          <span className="font-semibold text-gray-700">
                            {gestor.porcentaje.toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      {/* Barra de progreso de participación */}
                      <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-green-500 h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.max(0, gestor.porcentaje))}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lista de pagos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Historial de Pagos
            </CardTitle>
            <CardDescription>
              Registro detallado de los pagos del periodo seleccionado
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Cargando...</div>
            ) : filteredPagos.length === 0 ? (
              <div className="text-center py-8">
                <Receipt className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay pagos registrados</h3>
                <p className="text-gray-600">No se encontraron pagos con los filtros aplicados.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left p-3 font-medium text-gray-900">Fecha</th>
                      <th className="text-left p-3 font-medium text-gray-900">Cliente</th>
                      <th className="text-left p-3 font-medium text-gray-900">Concepto</th>
                      <th className="text-left p-3 font-medium text-gray-900">Tipo</th>
                      <th className="text-right p-3 font-medium text-gray-900">Monto</th>
                      <th className="text-left p-3 font-medium text-gray-900">Cobrador</th>
                      <th className="text-center p-3 font-medium text-gray-900">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPagos.map((pago) => (
                      <tr key={pago.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">{formatDate(new Date(pago.fechaPago))}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div>
                            <p className="font-medium text-gray-900">{pago.cliente.nombreCompleto}</p>
                            <p className="text-sm text-gray-600">{pago.cliente.codigoCliente}</p>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="text-sm text-gray-900">{pago.concepto}</span>
                        </td>
                        <td className="p-3">
                          <Badge
                            className={
                              pago.tipoPago === 'regular'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }
                          >
                            {pago.tipoPago === 'regular' ? 'Regular' : 'Moratorio'}
                          </Badge>
                        </td>
                        <td className="p-3 text-right">
                          <span className="font-medium text-green-600">
                            {formatCurrency(pago.monto)}
                          </span>
                          {pago.tipoPago === 'regular' && (
                            <div className="text-xs text-gray-500">
                              Saldo: {formatCurrency(pago.saldoAnterior)} → {formatCurrency(pago.saldoNuevo)}
                            </div>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">{pago.cobrador?.name || 'Venta / Sin Asignar'}</span>
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {pago.ticketImpreso && (
                              <Badge className="bg-blue-100 text-blue-800">
                                <FileText className="h-3 w-3 mr-1" />
                                Impreso
                              </Badge>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => reimprimir(pago.id)}
                              className="text-xs"
                            >
                              Reimprimir
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal para visualizar e imprimir ticket */}
      <TicketModal
        ticketData={activeTicketData}
        isOpen={showTicketModal}
        onClose={() => setShowTicketModal(false)}
      />
    </DashboardLayout>
  );
}
