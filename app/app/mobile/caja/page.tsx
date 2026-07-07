'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Calculator, 
  Calendar, 
  DollarSign, 
  Printer, 
  RefreshCw, 
  Wifi, 
  WifiOff,
  FileText,
  Clock,
  CheckCircle,
  CreditCard
} from 'lucide-react';
import { db } from '@/lib/offline-db';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useBluetoothPrinter } from '@/hooks/use-bluetooth-printer';

export default function MobileCajaPage() {
  const { data: session } = useSession();
  const [fechaDesde, setFechaDesde] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [fechaHasta, setFechaHasta] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(false);
  const [pagosCorte, setPagosCorte] = useState<any[]>([]);
  const [isOnline, setIsOnline] = useState(typeof window !== 'undefined' ? navigator.onLine : true);
  const [printing, setPrinting] = useState(false);
  
  const userId = (session?.user as any)?.id;
  const { isConnected: isPrinterConnected, printCorte } = useBluetoothPrinter();

  // Escuchar estado de red
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (userId) {
      cargarPagosCorte();
    }
  }, [fechaDesde, fechaHasta, userId, isOnline]);

  const cargarPagosCorte = async () => {
    if (!userId) return;
    setLoading(true);
    
    try {
      const start = new Date(fechaDesde);
      start.setHours(0, 0, 0, 0);
      const end = new Date(fechaHasta);
      end.setHours(23, 59, 59, 999);
      
      const pagosLocales = await db.pagos
        .where('cobradorId').equals(userId)
        .toArray();
      
      const pagosFiltrados = pagosLocales.filter(p => {
        const fechaPago = new Date(p.fechaPago);
        return fechaPago >= start && fechaPago <= end;
      });

      if (isOnline) {
        try {
          const params = new URLSearchParams({
            fechaDesde: start.toISOString(),
            fechaHasta: end.toISOString(),
            cobradorId: userId
          });
          
          const response = await fetch(`/api/reportes/cobranza?${params}`);
          if (response.ok) {
            const data = await response.json();
            if (data.pagos && data.pagos.length > 0) {
              setPagosCorte(data.pagos);
            } else {
              setPagosCorte(pagosFiltrados);
            }
          } else {
            setPagosCorte(pagosFiltrados);
          }
        } catch (apiError) {
          console.error("Error fetching report API, using local data", apiError);
          setPagosCorte(pagosFiltrados);
        }
      } else {
        setPagosCorte(pagosFiltrados);
      }
    } catch (error) {
      console.error('Error cargando datos del corte:', error);
      toast.error('Error al cargar datos del corte');
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const totalEfectivo = pagosCorte
      .filter(p => (p.metodoPago || p.metodo) === 'efectivo')
      .reduce((sum, p) => sum + (Number(p.monto) || 0), 0);
      
    const totalTransferencia = pagosCorte
      .filter(p => (p.metodoPago || p.metodo) === 'transferencia')
      .reduce((sum, p) => sum + (Number(p.monto) || 0), 0);
      
    const totalGeneral = totalEfectivo + totalTransferencia;
    
    return {
      totalEfectivo,
      totalTransferencia,
      totalGeneral,
      cantidadPagos: pagosCorte.length
    };
  }, [pagosCorte]);

  const handleImprimirCorte = async () => {
    if (!isPrinterConnected) {
      toast.error('Impresora no conectada');
      return;
    }

    setPrinting(true);
    try {
      await printCorte({
        cobrador: session?.user?.name || 'Cobrador',
        fechaDesde: new Date(fechaDesde).toISOString(),
        fechaHasta: new Date(fechaHasta).toISOString(),
        totalGeneral: stats.totalGeneral,
        totalEfectivo: stats.totalEfectivo,
        totalTransferencia: stats.totalTransferencia,
        cantidadPagos: stats.cantidadPagos
      });
      toast.success('Corte impreso correctamente');
    } catch (error) {
      console.error('Error al imprimir corte:', error);
      toast.error('Error al imprimir el ticket del corte');
    } finally {
      setPrinting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Caja Diaria</h2>
          <p className="text-sm text-slate-400">Resumen y corte de transacciones</p>
        </div>
        <Badge variant={isOnline ? 'default' : 'secondary'} className="h-8">
          {isOnline ? (
            <><Wifi className="w-4 h-4 mr-1 text-green-500" />Online</>
          ) : (
            <><WifiOff className="w-4 h-4 mr-1 text-slate-400" />Offline</>
          )}
        </Badge>
      </div>

      {/* Filtros de Fecha */}
      <div className="grid grid-cols-2 gap-3 bg-slate-900 p-3 rounded-lg border border-slate-800">
        <div className="space-y-1">
          <Label htmlFor="fechaDesde" className="text-[10px] font-bold uppercase text-slate-400">Desde</Label>
          <Input
            id="fechaDesde"
            type="date"
            value={fechaDesde}
            onChange={(e) => setFechaDesde(e.target.value)}
            className="h-9 text-xs bg-slate-950 border-slate-800 text-white"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="fechaHasta" className="text-[10px] font-bold uppercase text-slate-400">Hasta</Label>
          <Input
            id="fechaHasta"
            type="date"
            value={fechaHasta}
            onChange={(e) => setFechaHasta(e.target.value)}
            className="h-9 text-xs bg-slate-950 border-slate-800 text-white"
          />
        </div>
      </div>

      {/* Resumen de Totales */}
      <div className="space-y-3">
        <Card className="bg-emerald-600 text-white border-none shadow-lg">
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="text-[10px] font-bold opacity-80 uppercase tracking-wider">Total Recaudado</p>
              <h2 className="text-3xl font-bold">{formatCurrency(stats.totalGeneral)}</h2>
            </div>
            <div className="bg-white/20 p-2 rounded-lg">
              <DollarSign className="w-8 h-8" />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-slate-900 border-slate-800 border-l-4 border-l-green-500 text-white">
            <CardContent className="p-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Efectivo 💵</p>
              <p className="text-lg font-bold text-green-500">{formatCurrency(stats.totalEfectivo)}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-900 border-slate-800 border-l-4 border-l-purple-500 text-white">
            <CardContent className="p-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Transferencia 📱</p>
              <p className="text-lg font-bold text-purple-400">{formatCurrency(stats.totalTransferencia)}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Desglose de Pagos */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase text-slate-400 flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-500" />
            Movimientos ({stats.cantidadPagos})
          </h3>
          <Button variant="ghost" size="sm" onClick={cargarPagosCorte} className="h-8 w-8 p-0 text-slate-400 hover:text-white">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
          {loading ? (
            <div className="text-center py-8 bg-slate-900/50 rounded-lg border border-slate-800">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-slate-400" />
              <p className="text-xs text-slate-400">Cargando transacciones...</p>
            </div>
          ) : pagosCorte.length === 0 ? (
            <div className="text-center py-8 bg-slate-900/50 rounded-lg border border-slate-800 border-dashed">
              <Clock className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              <p className="text-xs text-slate-400 italic">No hay cobros registrados en este rango</p>
            </div>
          ) : (
            pagosCorte.map((pago, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-lg shadow-sm text-white">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate">
                    {pago.cliente?.nombreCompleto || pago.cliente || 'Pago Registrado'}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="outline" className="text-[9px] h-4 border-slate-700 text-slate-300">
                      {(pago.tipoPago || pago.tipo || '').toUpperCase()}
                    </Badge>
                    <span className="text-[9px] text-slate-500">
                      {format(new Date(pago.fechaPago || pago.fecha), 'HH:mm')}
                    </span>
                    {(pago.metodoPago || pago.metodo) === 'efectivo' ? 
                      <Badge className="bg-green-500/10 text-green-400 border border-green-500/20 text-[9px] h-4">EFECTIVO</Badge> : 
                      <Badge className="bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[9px] h-4">TRANSF.</Badge>
                    }
                  </div>
                </div>
                <div className="text-right ml-2 flex flex-col items-end">
                  <p className="text-sm font-bold text-white">{formatCurrency(pago.monto)}</p>
                  {pago.syncStatus === 'pending' || !pago.id ? (
                    <span className="text-[8px] text-orange-400 font-bold uppercase bg-orange-950/30 px-1.5 py-0.5 rounded border border-orange-900/40">Local</span>
                  ) : (
                    <CheckCircle className="w-3 h-3 text-green-400" />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Botones de acción */}
      <div className="pt-2">
        <Button 
          onClick={handleImprimirCorte} 
          disabled={stats.cantidadPagos === 0 || !isPrinterConnected || printing}
          className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center justify-center gap-2 shadow-lg"
        >
          {printing ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <Printer className="w-5 h-5" />
          )}
          {printing ? 'Imprimiendo...' : 'Imprimir Corte de Caja'}
        </Button>

        {!isPrinterConnected && stats.cantidadPagos > 0 && (
          <p className="text-[10px] text-center text-amber-400 bg-amber-950/20 border border-amber-900/40 p-2 rounded mt-2 font-medium">
            ⚠️ Conecta una impresora Bluetooth en tu Perfil para imprimir el recibo de caja.
          </p>
        )}
      </div>
    </div>
  );
}
