
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, TrendingUp, Users, DollarSign, Calendar, Download, Search, Filter } from 'lucide-react';
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

export default function ReportesPage() {
  const { data: session } = useSession();
  const [reporte, setReporte] = useState<ReporteCobranza | null>(null);
  const [cobradores, setCobradores] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [selectedCobrador, setSelectedCobrador] = useState<string>('all');
  const [fechaDesde, setFechaDesde] = useState(() => {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() - 30); // Últimos 30 días por defecto
    return fecha.toISOString().split('T')[0];
  });
  const [fechaHasta, setFechaHasta] = useState(() => {
    const fecha = new Date();
    return fecha.toISOString().split('T')[0];
  });

  useEffect(() => {
    fetchCobradores();
  }, []);

  useEffect(() => {
    fetchReporte();
  }, [selectedCobrador, fechaDesde, fechaHasta]);

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

  const fetchReporte = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        fechaDesde: fechaDesde + 'T00:00:00.000Z',
        fechaHasta: fechaHasta + 'T23:59:59.999Z',
      });

      if (selectedCobrador !== 'all') {
        params.append('cobradorId', selectedCobrador);
      }

      const response = await fetch(`/api/reportes/cobranza?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Error al obtener el reporte');
      }

      const data = await response.json();
      setReporte(data);
    } catch (error) {
      console.error('Error al cargar reporte:', error);
      toast.error('Error al cargar el reporte');
    } finally {
      setLoading(false);
    }
  };

  const exportarReporte = () => {
    if (!reporte) return;

    const csvContent = [
      ['Reporte de Cobranza'],
      ['Período:', `${formatDate(new Date(fechaDesde))} - ${formatDate(new Date(fechaHasta))}`],
      ['Cobrador:', selectedCobrador === 'all' ? 'Todos' : cobradores.find(c => c.id === selectedCobrador)?.name || 'N/A'],
      [''],
      ['RESUMEN GENERAL'],
      ['Total Cobrado (Neto):', formatCurrency(reporte.totales.totalCobrado)],
      ['Total Mora:', formatCurrency(reporte.totales.totalMora)],
      ['Total General:', formatCurrency(reporte.totales.totalGeneral)],
      ['Total de Pagos:', reporte.totales.totalPagos.toString()],
      [''],
      ['LISTADO DETALLADO'],
      ['Fecha', 'Cliente', 'Concepto', 'Tipo', 'Monto', 'Cobrador'],
      ...reporte.pagos.map(p => [
        formatDate(new Date(p.fecha)),
        p.cliente,
        p.concepto || 'N/A',
        p.tipo,
        formatCurrency(p.monto),
        p.cobrador
      ]),
      [''],
      ['DETALLE POR COBRADOR'],
      ['Cobrador', 'Acumulado', 'Regular/Abono', 'Mora/Moratorio', 'Cantidad'],
      ...reporte.reportePorCobrador.map(c => [
        c.cobrador,
        formatCurrency(c.totalCobrado),
        formatCurrency(c.pagosRegulares),
        formatCurrency(c.pagosMoratorios),
        c.cantidadPagos.toString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte-cobranza-${fechaDesde}-${fechaHasta}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success('Reporte exportado exitosamente');
  };

  if (!session) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reportes de Cobranza</h1>
            <p className="text-gray-600">Análisis detallado por cobrador y período</p>
          </div>
          <Button
            onClick={exportarReporte}
            className="flex items-center gap-2"
            disabled={!reporte || loading}
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros de Reporte
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cobrador">Cobrador</Label>
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="fechaDesde">Fecha Desde</Label>
                <Input
                  id="fechaDesde"
                  type="date"
                  value={fechaDesde}
                  onChange={(e) => setFechaDesde(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fechaHasta">Fecha Hasta</Label>
                <Input
                  id="fechaHasta"
                  type="date"
                  value={fechaHasta}
                  onChange={(e) => setFechaHasta(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resumen General */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cobrado (Neto)</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {reporte ? formatCurrency(reporte.totales.totalCobrado) : formatCurrency(0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Abonos y liquidaciones
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Mora</CardTitle>
              <Users className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {reporte ? formatCurrency(reporte.totales.totalMora) : formatCurrency(0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Recargos cobrados
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total General</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {reporte ? formatCurrency(reporte.totales.totalGeneral) : formatCurrency(0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Cobrado + Mora
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cant. Movimientos</CardTitle>
              <BarChart3 className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {reporte ? reporte.totales.totalPagos : 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Total de recibos emitidos
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detalle por Cobrador */}
        {selectedCobrador === 'all' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Rendimiento por Cobrador
              </CardTitle>
              <CardDescription>
                Comparativo de productividad en el período seleccionado
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Cargando...</div>
              ) : reporte?.reportePorCobrador && reporte.reportePorCobrador.length > 0 ? (
                <div className="space-y-4">
                  {reporte.reportePorCobrador
                    .sort((a, b) => b.totalCobrado - a.totalCobrado)
                    .map((cobrador, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{cobrador.cobrador}</p>
                              <p className="text-sm text-gray-600">
                                {cobrador.cantidadPagos} cobros realizados
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right space-y-1">
                          <p className="font-bold text-lg text-green-600">
                            {formatCurrency(cobrador.totalCobrado)}
                          </p>
                          <div className="text-xs text-gray-600 space-y-0.5">
                            <div>Regular: {formatCurrency(cobrador.pagosRegulares)}</div>
                            <div>Moratorio: {formatCurrency(cobrador.pagosMoratorios)}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No hay datos de cobranza para el período seleccionado
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Cobranza por Día */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Evolución Diaria
            </CardTitle>
            <CardDescription>
              Cobranza día a día en el período seleccionado
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Cargando...</div>
            ) : reporte?.pagos && reporte.pagos.length > 0 ? (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                      <tr>
                        <th className="px-4 py-2">Fecha</th>
                        <th className="px-4 py-2">Cliente</th>
                        <th className="px-4 py-2">Concepto</th>
                        <th className="px-4 py-2">Tipo</th>
                        <th className="px-4 py-2 text-right">Monto</th>
                        <th className="px-4 py-2">Cobrador</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {reporte.pagos.map((pago, index) => (
                        <tr key={index} className="hover:bg-gray-50 border-b">
                          <td className="px-4 py-2 whitespace-nowrap">{formatDate(new Date(pago.fecha))}</td>
                          <td className="px-4 py-2 font-medium">{pago.cliente}</td>
                          <td className="px-4 py-2">{pago.concepto || '-'}</td>
                          <td className="px-4 py-2 uppercase text-xs">
                            <span className={`px-2 py-0.5 rounded-full ${['moratorio', 'mora'].includes(pago.tipo)
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-green-100 text-green-700'
                              }`}>
                              {pago.tipo}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-right font-semibold">
                            {formatCurrency(pago.monto)}
                          </td>
                          <td className="px-4 py-2">{pago.cobrador}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totales al final de la evolución diaria */}
                <div className="flex flex-col items-end space-y-2 pt-4 border-t-2">
                  <div className="grid grid-cols-2 gap-x-8 text-sm">
                    <span className="text-gray-600">Total Cobrado:</span>
                    <span className="text-right font-medium text-green-600">{formatCurrency(reporte.totales.totalCobrado)}</span>

                    <span className="text-gray-600">Total Mora:</span>
                    <span className="text-right font-medium text-orange-600">{formatCurrency(reporte.totales.totalMora)}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-8 text-lg border-t-2 border-gray-900 pt-2 font-bold">
                    <span>Total General:</span>
                    <span className="text-right text-purple-700">{formatCurrency(reporte.totales.totalGeneral)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No hay datos para el período seleccionado
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
