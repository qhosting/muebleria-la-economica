'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  Download,
  Search,
  Filter,
  ShoppingBag,
  Store,
  CreditCard,
  Receipt,
  UserCheck,
  Award,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';

interface User {
  id: string;
  name: string;
  role: string;
}

interface ReporteCobranza {
  totales: {
    totalCobrado: number;
    totalMora: number;
    totalGeneral: number;
    pagosRegulares: number;
    pagosMoratorios: number;
    totalPagos: number;
  };
  reportePorCobrador: Array<{
    cobrador: string;
    cobradorId: string;
    totalCobrado: number;
    pagosRegulares: number;
    pagosMoratorios: number;
    cantidadPagos: number;
  }>;
  reportePorDia: Array<{
    fecha: string;
    pagos_regulares: number;
    pagos_moratorios: number;
    total_pagos: number;
  }>;
  pagos: Array<{
    fecha: string;
    cliente: string;
    concepto: string;
    tipo: string;
    monto: number;
    cobrador: string;
  }>;
  periodo: {
    desde: string;
    hasta: string;
  };
}

interface ReporteVentas {
  resumen: {
    totalVentas: number;
    totalContado: number;
    totalCredito: number;
    totalEnganches: number;
    totalSaldoFinanciado: number;
    cantidadVentas: number;
  };
  rankingVendedores: Array<{
    vendedorId: string;
    nombre: string;
    cantidadVentas: number;
    totalVendido: number;
    totalContado: number;
    totalCredito: number;
    totalEnganche: number;
  }>;
  desgloseSucursales: Array<{
    sucursalId: string;
    nombre: string;
    cantidadVentas: number;
    total: number;
  }>;
  ventas: Array<{
    id: string;
    folio: number;
    fecha: string;
    tipoVenta: string;
    nombreCliente: string;
    telefonoCliente?: string;
    codigoCliente?: string;
    sucursalNombre: string;
    vendedorNombre: string;
    vendedorId?: string;
    total: number;
    enganche: number;
    saldoFinanciado: number;
    montoCuota: number;
    periodicidad?: string;
    plazoSemanas?: number;
    detallesCount: number;
  }>;
}

export default function ReportesPage() {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role;
  const esAdminOGestor = userRole === 'admin' || userRole === 'gestor_cobranza' || userRole === 'reporte_cobranza';

  // Estados Reporte Cobranza
  const [reporteCobranza, setReporteCobranza] = useState<ReporteCobranza | null>(null);
  const [cobradores, setCobradores] = useState<User[]>([]);
  const [loadingCobranza, setLoadingCobranza] = useState(false);
  const [selectedCobrador, setSelectedCobrador] = useState<string>('all');
  const [fechaDesdeCobranza, setFechaDesdeCobranza] = useState(() => {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() - 30);
    return fecha.toISOString().split('T')[0];
  });
  const [fechaHastaCobranza, setFechaHastaCobranza] = useState(() => {
    const fecha = new Date();
    return fecha.toISOString().split('T')[0];
  });

  // Estados Reporte Ventas
  const [reporteVentas, setReporteVentas] = useState<ReporteVentas | null>(null);
  const [vendedores, setVendedores] = useState<any[]>([]);
  const [sucursales, setSucursales] = useState<any[]>([]);
  const [loadingVentas, setLoadingVentas] = useState(false);
  const [selectedVendedor, setSelectedVendedor] = useState<string>('todos');
  const [selectedSucursal, setSelectedSucursal] = useState<string>('todas');
  const [selectedTipoVenta, setSelectedTipoVenta] = useState<string>('todos');
  const [fechaDesdeVentas, setFechaDesdeVentas] = useState(() => {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() - 30);
    return fecha.toISOString().split('T')[0];
  });
  const [fechaHastaVentas, setFechaHastaVentas] = useState(() => {
    const fecha = new Date();
    return fecha.toISOString().split('T')[0];
  });

  useEffect(() => {
    fetchCobradores();
    fetchVendedores();
    fetchSucursales();
  }, []);

  useEffect(() => {
    fetchReporteCobranza();
  }, [selectedCobrador, fechaDesdeCobranza, fechaHastaCobranza]);

  useEffect(() => {
    fetchReporteVentas();
  }, [selectedVendedor, selectedSucursal, selectedTipoVenta, fechaDesdeVentas, fechaHastaVentas]);

  const fetchCobradores = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const users = await response.json();
        const cobradoresData = users.filter((user: User) => user.role === 'cobrador');
        setCobradores(cobradoresData);
      }
    } catch (error) {
      console.error('Error al cargar cobradores:', error);
    }
  };

  const fetchVendedores = async () => {
    try {
      const response = await fetch('/api/users/vendedores');
      if (response.ok) {
        const data = await response.json();
        setVendedores(data || []);
      }
    } catch (error) {
      console.error('Error al cargar vendedores:', error);
    }
  };

  const fetchSucursales = async () => {
    try {
      const response = await fetch('/api/inventario/sucursales');
      if (response.ok) {
        const data = await response.json();
        setSucursales(data || []);
      }
    } catch (error) {
      console.error('Error al cargar sucursales:', error);
    }
  };

  const fetchReporteCobranza = async () => {
    try {
      setLoadingCobranza(true);
      const params = new URLSearchParams({
        fechaDesde: fechaDesdeCobranza + 'T00:00:00.000Z',
        fechaHasta: fechaHastaCobranza + 'T23:59:59.999Z',
      });

      if (selectedCobrador !== 'all') {
        params.append('cobradorId', selectedCobrador);
      }

      const response = await fetch(`/api/reportes/cobranza?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Error al obtener el reporte de cobranza');
      }

      const data = await response.json();
      setReporteCobranza(data);
    } catch (error) {
      console.error('Error al cargar reporte de cobranza:', error);
      toast.error('Error al cargar el reporte de cobranza');
    } finally {
      setLoadingCobranza(false);
    }
  };

  const fetchReporteVentas = async () => {
    try {
      setLoadingVentas(true);
      const params = new URLSearchParams({
        fechaDesde: fechaDesdeVentas + 'T00:00:00.000Z',
        fechaHasta: fechaHastaVentas + 'T23:59:59.999Z',
      });

      if (selectedSucursal !== 'todas') {
        params.append('sucursalId', selectedSucursal);
      }

      if (selectedTipoVenta !== 'todos') {
        params.append('tipoVenta', selectedTipoVenta);
      }

      if (selectedVendedor !== 'todos') {
        params.append('vendedorId', selectedVendedor);
      }

      const response = await fetch(`/api/reportes/ventas?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Error al obtener el reporte de ventas');
      }

      const data = await response.json();
      setReporteVentas(data);
    } catch (error) {
      console.error('Error al cargar reporte de ventas:', error);
      toast.error('Error al cargar el reporte de ventas');
    } finally {
      setLoadingVentas(false);
    }
  };

  const exportarReporteVentas = () => {
    if (!reporteVentas || reporteVentas.ventas.length === 0) {
      toast.error('No hay ventas para exportar');
      return;
    }

    const csvContent = [
      ['Reporte de Ventas y Remisiones - Mueblería La Económica'],
      ['Período:', `${fechaDesdeVentas} al ${fechaHastaVentas}`],
      ['Sucursal:', selectedSucursal === 'todas' ? 'Todas' : sucursales.find(s => s.id === selectedSucursal)?.nombre || 'N/A'],
      ['Vendedor:', selectedVendedor === 'todos' ? 'Todos' : vendedores.find(v => v.id === selectedVendedor)?.name || 'N/A'],
      ['Tipo:', selectedTipoVenta.toUpperCase()],
      [''],
      ['RESUMEN GENERAL'],
      ['Total Ventas:', formatCurrency(reporteVentas.resumen.totalVentas)],
      ['Total Contado:', formatCurrency(reporteVentas.resumen.totalContado)],
      ['Total Crédito:', formatCurrency(reporteVentas.resumen.totalCredito)],
      ['Total Enganches:', formatCurrency(reporteVentas.resumen.totalEnganches)],
      ['Total Saldo Financiado:', formatCurrency(reporteVentas.resumen.totalSaldoFinanciado)],
      ['Cantidad de Remisiones:', reporteVentas.resumen.cantidadVentas.toString()],
      [''],
      ['DETALLE DE VENTAS'],
      ['Remisión', 'Fecha', 'Cliente', 'Teléfono', 'Sucursal', 'Vendedor', 'Tipo', 'Total', 'Enganche', 'Saldo Financiado', 'Cuota'],
      ...reporteVentas.ventas.map(v => [
        `Nº ${v.folio.toString().padStart(4, '0')}`,
        new Date(v.fecha).toLocaleDateString('es-MX'),
        v.nombreCliente,
        v.telefonoCliente || '',
        v.sucursalNombre,
        v.vendedorNombre,
        v.tipoVenta.toUpperCase(),
        v.total.toString(),
        v.enganche.toString(),
        v.saldoFinanciado.toString(),
        v.montoCuota ? v.montoCuota.toString() : '0'
      ])
    ];

    const csvString = csvContent.map(row => row.map(val => `"${val}"`).join(',')).join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `reporte_ventas_${fechaDesdeVentas}_${fechaHastaVentas}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Reporte de ventas exportado exitosamente');
  };

  const exportarReporteCobranza = () => {
    if (!reporteCobranza) return;

    const csvContent = [
      ['Reporte de Cobranza - Mueblería La Económica'],
      ['Período:', `${formatDate(new Date(fechaDesdeCobranza))} - ${formatDate(new Date(fechaHastaCobranza))}`],
      ['Cobrador:', selectedCobrador === 'all' ? 'Todos' : cobradores.find(c => c.id === selectedCobrador)?.name || 'N/A'],
      [''],
      ['RESUMEN GENERAL'],
      ['Total Cobrado (Neto):', formatCurrency(reporteCobranza.totales.totalCobrado)],
      ['Total Mora:', formatCurrency(reporteCobranza.totales.totalMora)],
      ['Total General:', formatCurrency(reporteCobranza.totales.totalGeneral)],
      ['Total de Pagos:', reporteCobranza.totales.totalPagos.toString()],
      [''],
      ['DETALLE DE PAGOS'],
      ['Fecha', 'Cliente', 'Concepto', 'Tipo', 'Monto', 'Cobrador'],
      ...reporteCobranza.pagos.map(p => [
        formatDate(new Date(p.fecha)),
        p.cliente,
        p.concepto || '',
        p.tipo,
        p.monto.toString(),
        p.cobrador
      ])
    ];

    const csvString = csvContent.map(row => row.map(val => `"${val}"`).join(',')).join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `reporte_cobranza_${fechaDesdeCobranza}_${fechaHastaCobranza}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Reporte de cobranza exportado exitosamente');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* ENCABEZADO */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border shadow-xs">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-blue-700" />
              Módulo de Reportes Operativos
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              {esAdminOGestor
                ? 'Monitoreo consolidado de ventas, ranking de vendedores, sucursales y recuperación de cartera'
                : 'Consulta de tus ventas generadas, remisiones emitidas y comisiones en mostrador'}
            </p>
          </div>
        </div>

        {/* PESTAÑAS PRINCIPALES: VENTAS VS COBRANZA */}
        <Tabs defaultValue="ventas" className="w-full space-y-4">
          <TabsList className="bg-slate-100 p-1 border rounded-xl">
            <TabsTrigger value="ventas" className="gap-2 font-bold text-xs">
              <ShoppingBag className="h-4 w-4" />
              Reporte de Ventas y Remisiones
              {reporteVentas?.resumen?.cantidadVentas ? (
                <Badge variant="secondary" className="text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0">
                  {reporteVentas.resumen.cantidadVentas}
                </Badge>
              ) : null}
            </TabsTrigger>
            <TabsTrigger value="cobranza" className="gap-2 font-bold text-xs">
              <Receipt className="h-4 w-4" />
              Reporte de Cobranza y Abonos
            </TabsTrigger>
          </TabsList>

          {/* ======================================================== */}
          {/* TAB 1: REPORTE DE VENTAS Y REMISIONES                    */}
          {/* ======================================================== */}
          <TabsContent value="ventas" className="space-y-4">
            {/* BARRA DE FILTROS */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <Filter className="h-4 w-4 text-blue-700" />
                      Filtros de Ventas
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Selecciona rango de fechas, sucursal o vendedor para filtrar
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={fetchReporteVentas}
                      disabled={loadingVentas}
                      className="gap-1.5 text-xs h-8"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${loadingVentas ? 'animate-spin' : ''}`} />
                      Actualizar
                    </Button>
                    <Button
                      size="sm"
                      onClick={exportarReporteVentas}
                      disabled={!reporteVentas || reporteVentas.ventas.length === 0}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white gap-1.5 text-xs h-8"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Exportar CSV
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
                  <div>
                    <Label className="text-[11px] font-semibold text-gray-600">Fecha Desde</Label>
                    <Input
                      type="date"
                      value={fechaDesdeVentas}
                      onChange={(e) => setFechaDesdeVentas(e.target.value)}
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] font-semibold text-gray-600">Fecha Hasta</Label>
                    <Input
                      type="date"
                      value={fechaHastaVentas}
                      onChange={(e) => setFechaHastaVentas(e.target.value)}
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] font-semibold text-gray-600">Sucursal</Label>
                    <Select value={selectedSucursal} onValueChange={setSelectedSucursal}>
                      <SelectTrigger className="h-8 text-xs mt-1">
                        <SelectValue placeholder="Todas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todas">Todas las sucursales</SelectItem>
                        {sucursales.map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-[11px] font-semibold text-gray-600">Tipo de Venta</Label>
                    <Select value={selectedTipoVenta} onValueChange={setSelectedTipoVenta}>
                      <SelectTrigger className="h-8 text-xs mt-1">
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos (Contado + Crédito)</SelectItem>
                        <SelectItem value="contado">Solo Contado</SelectItem>
                        <SelectItem value="credito">Solo Crédito</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {esAdminOGestor && (
                    <div>
                      <Label className="text-[11px] font-semibold text-gray-600">Vendedor</Label>
                      <Select value={selectedVendedor} onValueChange={setSelectedVendedor}>
                        <SelectTrigger className="h-8 text-xs mt-1">
                          <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todos los vendedores</SelectItem>
                          {vendedores.map(v => (
                            <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* KPIS DE VENTAS */}
            {loadingVentas ? (
              <div className="text-center py-12 text-gray-500 flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-blue-700" />
                Cargando reporte de ventas...
              </div>
            ) : reporteVentas ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <Card className="bg-gradient-to-br from-blue-50 to-indigo-50/50 border-blue-200">
                    <CardHeader className="p-3 pb-1">
                      <CardTitle className="text-xs text-blue-800 font-bold uppercase">Total Facturado</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <div className="text-lg md:text-xl font-black text-blue-950">
                        {formatCurrency(reporteVentas.resumen.totalVentas)}
                      </div>
                      <p className="text-[10px] text-blue-700 font-semibold mt-0.5">
                        {reporteVentas.resumen.cantidadVentas} remisiones emitidas
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-emerald-50 to-teal-50/50 border-emerald-200">
                    <CardHeader className="p-3 pb-1">
                      <CardTitle className="text-xs text-emerald-800 font-bold uppercase">Ventas Contado</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <div className="text-lg md:text-xl font-black text-emerald-950">
                        {formatCurrency(reporteVentas.resumen.totalContado)}
                      </div>
                      <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                        Cobro inmediato
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-purple-50 to-pink-50/50 border-purple-200">
                    <CardHeader className="p-3 pb-1">
                      <CardTitle className="text-xs text-purple-800 font-bold uppercase">Ventas a Crédito</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <div className="text-lg md:text-xl font-black text-purple-950">
                        {formatCurrency(reporteVentas.resumen.totalCredito)}
                      </div>
                      <p className="text-[10px] text-purple-700 font-semibold mt-0.5">
                        Financiamiento otorgado
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-amber-50 to-yellow-50/50 border-amber-200">
                    <CardHeader className="p-3 pb-1">
                      <CardTitle className="text-xs text-amber-800 font-bold uppercase">Enganches Cobrados</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <div className="text-lg md:text-xl font-black text-amber-950">
                        {formatCurrency(reporteVentas.resumen.totalEnganches)}
                      </div>
                      <p className="text-[10px] text-amber-700 font-semibold mt-0.5">
                        Recaudación 40% inicial
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-50 border-slate-200 col-span-2 md:col-span-1">
                    <CardHeader className="p-3 pb-1">
                      <CardTitle className="text-xs text-slate-700 font-bold uppercase">Saldo por Cobrar</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <div className="text-lg md:text-xl font-black text-slate-900">
                        {formatCurrency(reporteVentas.resumen.totalSaldoFinanciado)}
                      </div>
                      <p className="text-[10px] text-slate-600 font-semibold mt-0.5">
                        Pagarés en cartera
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* RANKING DE VENDEDORES (Para Admin/Gestor) */}
                {esAdminOGestor && reporteVentas.rankingVendedores.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <Award className="h-4 w-4 text-amber-600" />
                        Desempeño y Ranking por Vendedor
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-slate-100 text-gray-700 font-bold uppercase text-[10px]">
                            <tr>
                              <th className="py-2 px-3">Vendedor</th>
                              <th className="py-2 px-3 text-center">Remisiones</th>
                              <th className="py-2 px-3 text-right">Contado</th>
                              <th className="py-2 px-3 text-right">Crédito</th>
                              <th className="py-2 px-3 text-right">Enganche (40%)</th>
                              <th className="py-2 px-3 text-right">Total Facturado</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {reporteVentas.rankingVendedores.map((v, idx) => (
                              <tr key={v.vendedorId || idx} className="hover:bg-slate-50">
                                <td className="py-2.5 px-3 font-bold text-gray-900 flex items-center gap-2">
                                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                                    idx === 0 ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                                    idx === 1 ? 'bg-slate-200 text-slate-700' :
                                    'bg-slate-100 text-gray-600'
                                  }`}>
                                    {idx + 1}
                                  </span>
                                  {v.nombre}
                                </td>
                                <td className="py-2.5 px-3 text-center font-bold">
                                  {v.cantidadVentas}
                                </td>
                                <td className="py-2.5 px-3 text-right font-semibold text-emerald-800">
                                  {formatCurrency(v.totalContado)}
                                </td>
                                <td className="py-2.5 px-3 text-right font-semibold text-purple-800">
                                  {formatCurrency(v.totalCredito)}
                                </td>
                                <td className="py-2.5 px-3 text-right font-bold text-blue-900">
                                  {formatCurrency(v.totalEnganche)}
                                </td>
                                <td className="py-2.5 px-3 text-right font-black text-gray-950 text-sm">
                                  {formatCurrency(v.totalVendido)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* LISTADO DETALLADO DE REMISIONES */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <Receipt className="h-4 w-4 text-blue-700" />
                      Listado Detallado de Ventas ({reporteVentas.ventas.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {reporteVentas.ventas.length === 0 ? (
                      <div className="text-center py-10 text-gray-400 text-xs">
                        No se encontraron ventas para los filtros seleccionados
                      </div>
                    ) : (
                      <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-slate-100 text-gray-700 font-bold uppercase text-[10px] sticky top-0 z-10">
                            <tr>
                              <th className="py-2.5 px-3">Remisión</th>
                              <th className="py-2.5 px-3">Fecha</th>
                              <th className="py-2.5 px-3">Cliente</th>
                              <th className="py-2.5 px-3">Sucursal</th>
                              <th className="py-2.5 px-3">Vendedor</th>
                              <th className="py-2.5 px-3">Tipo</th>
                              <th className="py-2.5 px-3 text-right">Total</th>
                              <th className="py-2.5 px-3 text-right">Enganche</th>
                              <th className="py-2.5 px-3 text-right">Saldo Financiado</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {reporteVentas.ventas.map((v) => (
                              <tr key={v.id} className="hover:bg-slate-50">
                                <td className="py-2.5 px-3 font-black text-blue-900">
                                  Nº {v.folio.toString().padStart(4, '0')}
                                </td>
                                <td className="py-2.5 px-3 text-gray-600 whitespace-nowrap">
                                  {new Date(v.fecha).toLocaleDateString('es-MX')}
                                </td>
                                <td className="py-2.5 px-3 font-bold text-gray-900">
                                  {v.nombreCliente}
                                  {v.codigoCliente && (
                                    <span className="text-[10px] text-gray-500 block font-normal">
                                      {v.codigoCliente}
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-gray-700">
                                  {v.sucursalNombre}
                                </td>
                                <td className="py-2.5 px-3 font-medium text-gray-800">
                                  {v.vendedorNombre}
                                </td>
                                <td className="py-2.5 px-3">
                                  <Badge
                                    variant={v.tipoVenta === 'credito' ? 'default' : 'secondary'}
                                    className="capitalize text-[10px]"
                                  >
                                    {v.tipoVenta}
                                  </Badge>
                                </td>
                                <td className="py-2.5 px-3 text-right font-black text-gray-950">
                                  {formatCurrency(v.total)}
                                </td>
                                <td className="py-2.5 px-3 text-right font-bold text-blue-900">
                                  {formatCurrency(v.enganche)}
                                </td>
                                <td className="py-2.5 px-3 text-right font-bold text-amber-900">
                                  {formatCurrency(v.saldoFinanciado)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : null}
          </TabsContent>

          {/* ======================================================== */}
          {/* TAB 2: REPORTE DE COBRANZA Y ABONOS                     */}
          {/* ======================================================== */}
          <TabsContent value="cobranza" className="space-y-4">
            {/* Filtros Cobranza */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <Filter className="h-4 w-4 text-blue-700" />
                      Filtros de Cobranza
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Selecciona período y cobrador para auditar la recaudación
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={fetchReporteCobranza}
                      disabled={loadingCobranza}
                      className="gap-1.5 text-xs h-8"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${loadingCobranza ? 'animate-spin' : ''}`} />
                      Actualizar
                    </Button>
                    <Button
                      size="sm"
                      onClick={exportarReporteCobranza}
                      disabled={!reporteCobranza}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white gap-1.5 text-xs h-8"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Exportar CSV
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <Label className="text-[11px] font-semibold text-gray-600">Fecha Desde</Label>
                    <Input
                      type="date"
                      value={fechaDesdeCobranza}
                      onChange={(e) => setFechaDesdeCobranza(e.target.value)}
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] font-semibold text-gray-600">Fecha Hasta</Label>
                    <Input
                      type="date"
                      value={fechaHastaCobranza}
                      onChange={(e) => setFechaHastaCobranza(e.target.value)}
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                  {esAdminOGestor && (
                    <div>
                      <Label className="text-[11px] font-semibold text-gray-600">Cobrador</Label>
                      <Select value={selectedCobrador} onValueChange={setSelectedCobrador}>
                        <SelectTrigger className="h-8 text-xs mt-1">
                          <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos los cobradores</SelectItem>
                          {cobradores.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Resumen Cobranza */}
            {loadingCobranza ? (
              <div className="text-center py-12 text-gray-500 flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-blue-700" />
                Cargando reporte de cobranza...
              </div>
            ) : reporteCobranza ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Card className="bg-emerald-50 border-emerald-200">
                    <CardHeader className="p-3 pb-1">
                      <CardTitle className="text-xs text-emerald-800 font-bold uppercase">Total Cobrado (Neto)</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <div className="text-lg md:text-xl font-black text-emerald-950">
                        {formatCurrency(reporteCobranza.totales.totalCobrado)}
                      </div>
                      <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                        {reporteCobranza.totales.pagosRegulares} abonos regulares
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-amber-50 border-amber-200">
                    <CardHeader className="p-3 pb-1">
                      <CardTitle className="text-xs text-amber-800 font-bold uppercase">Total Mora Recaudada</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <div className="text-lg md:text-xl font-black text-amber-950">
                        {formatCurrency(reporteCobranza.totales.totalMora)}
                      </div>
                      <p className="text-[10px] text-amber-700 font-semibold mt-0.5">
                        {reporteCobranza.totales.pagosMoratorios} cobros moratorios
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-purple-50 border-purple-200">
                    <CardHeader className="p-3 pb-1">
                      <CardTitle className="text-xs text-purple-800 font-bold uppercase">Recaudación General</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <div className="text-lg md:text-xl font-black text-purple-950">
                        {formatCurrency(reporteCobranza.totales.totalGeneral)}
                      </div>
                      <p className="text-[10px] text-purple-700 font-semibold mt-0.5">
                        Neto + Moratorios
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-blue-50 border-blue-200">
                    <CardHeader className="p-3 pb-1">
                      <CardTitle className="text-xs text-blue-800 font-bold uppercase">Total Transacciones</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <div className="text-lg md:text-xl font-black text-blue-950">
                        {reporteCobranza.totales.totalPagos}
                      </div>
                      <p className="text-[10px] text-blue-700 font-semibold mt-0.5">
                        Recibos emitidos
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Cobranza por Cobrador */}
                {esAdminOGestor && reporteCobranza.reportePorCobrador.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-700" />
                        Recaudación por Cobrador
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-slate-100 text-gray-700 font-bold uppercase text-[10px]">
                            <tr>
                              <th className="py-2 px-3">Cobrador</th>
                              <th className="py-2 px-3 text-right">Abonos Regulares</th>
                              <th className="py-2 px-3 text-right">Recargos Mora</th>
                              <th className="py-2 px-3 text-right">Total Cobrado</th>
                              <th className="py-2 px-3 text-center">Transacciones</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {reporteCobranza.reportePorCobrador.map((c, i) => (
                              <tr key={i} className="hover:bg-slate-50">
                                <td className="py-2.5 px-3 font-bold text-gray-900">{c.cobrador}</td>
                                <td className="py-2.5 px-3 text-right font-medium text-emerald-800">
                                  {formatCurrency(c.totalCobrado)}
                                </td>
                                <td className="py-2.5 px-3 text-right font-medium text-amber-800">
                                  {formatCurrency(c.pagosMoratorios)}
                                </td>
                                <td className="py-2.5 px-3 text-right font-black text-gray-950">
                                  {formatCurrency(c.totalCobrado + c.pagosMoratorios)}
                                </td>
                                <td className="py-2.5 px-3 text-center font-semibold">
                                  {c.cantidadPagos}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Listado de Pagos */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <Receipt className="h-4 w-4 text-emerald-700" />
                      Detalle de Abonos Recientes ({reporteCobranza.pagos.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-100 text-gray-700 font-bold uppercase text-[10px] sticky top-0 z-10">
                          <tr>
                            <th className="py-2.5 px-3">Fecha</th>
                            <th className="py-2.5 px-3">Cliente</th>
                            <th className="py-2.5 px-3">Concepto</th>
                            <th className="py-2.5 px-3">Tipo</th>
                            <th className="py-2.5 px-3 text-right">Monto</th>
                            <th className="py-2.5 px-3">Cobrador</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {reporteCobranza.pagos.map((p, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="py-2 px-3 text-gray-600 whitespace-nowrap">
                                {formatDate(new Date(p.fecha))}
                              </td>
                              <td className="py-2 px-3 font-bold text-gray-900">{p.cliente}</td>
                              <td className="py-2 px-3 text-gray-700">{p.concepto || '-'}</td>
                              <td className="py-2 px-3">
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] ${
                                    ['moratorio', 'mora'].includes(p.tipo)
                                      ? 'bg-amber-50 text-amber-800 border-amber-300'
                                      : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                  }`}
                                >
                                  {p.tipo}
                                </Badge>
                              </td>
                              <td className="py-2 px-3 text-right font-black text-gray-950">
                                {formatCurrency(p.monto)}
                              </td>
                              <td className="py-2 px-3 text-gray-600 font-medium">{p.cobrador}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : null}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
