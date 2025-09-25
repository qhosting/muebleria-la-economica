
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, TrendingUp, Users, DollarSign, Calendar, Download } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

interface ReporteCobranza {
  totalCobrado: number;
  totalPendiente: number;
  clientesAtendidos: number;
  porcentajeExito: number;
  cobranzaPorDia: Array<{
    fecha: string;
    total: number;
    cobros: number;
  }>;
  cobranzaPorCobrador: Array<{
    cobrador: string;
    total: number;
    cobros: number;
    eficiencia: number;
  }>;
}

export default function ReportesPage() {
  const { data: session } = useSession();
  const [reporte, setReporte] = useState<ReporteCobranza | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriodo, setSelectedPeriodo] = useState('30');

  useEffect(() => {
    fetchReporte();
  }, [selectedPeriodo]);

  const fetchReporte = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/reportes/cobranza?periodo=${selectedPeriodo}`);
      const data = await response.json();
      setReporte(data);
    } catch (error) {
      console.error('Error al cargar reporte:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportarReporte = () => {
    // Implementar exportación de reporte
    console.log('Exportando reporte...');
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
            <p className="text-gray-600">Análisis detallado de la cobranza</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={selectedPeriodo} onValueChange={setSelectedPeriodo}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Seleccionar período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 días</SelectItem>
                <SelectItem value="30">Últimos 30 días</SelectItem>
                <SelectItem value="90">Últimos 3 meses</SelectItem>
                <SelectItem value="365">Último año</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={exportarReporte} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Estadísticas principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cobrado</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(reporte?.totalCobrado || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                En los últimos {selectedPeriodo} días
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pendiente</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(reporte?.totalPendiente || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Saldos pendientes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clientes Atendidos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {reporte?.clientesAtendidos || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Clientes con cobros
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">% de Éxito</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {reporte?.porcentajeExito || 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                Eficiencia de cobranza
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Cobranza por día */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Cobranza por Día
            </CardTitle>
            <CardDescription>
              Evolución diaria de la cobranza
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Cargando...</div>
            ) : (
              <div className="space-y-4">
                {reporte?.cobranzaPorDia?.map((dia, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{formatDate(new Date(dia.fecha))}</p>
                      <p className="text-sm text-gray-600">{dia.cobros} cobros</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">{formatCurrency(dia.total)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cobranza por cobrador */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Rendimiento por Cobrador
            </CardTitle>
            <CardDescription>
              Comparativo de productividad por cobrador
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Cargando...</div>
            ) : (
              <div className="space-y-4">
                {reporte?.cobranzaPorCobrador?.map((cobrador, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{cobrador.cobrador}</p>
                      <p className="text-sm text-gray-600">{cobrador.cobros} cobros realizados</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">{formatCurrency(cobrador.total)}</p>
                      <p className="text-sm text-gray-600">{cobrador.eficiencia}% eficiencia</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
