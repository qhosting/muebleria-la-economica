
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { format, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { useBluetoothPrinter } from '@/hooks/use-bluetooth-printer';

interface CorteModalProps {
  isOpen: boolean;
  onClose: () => void;
  isOnline: boolean;
}

export function CorteModal({ isOpen, onClose, isOnline }: CorteModalProps) {
  const { data: session } = useSession();
  const [fechaDesde, setFechaDesde] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [fechaHasta, setFechaHasta] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(false);
  const [pagosCorte, setPagosCorte] = useState<any[]>([]);
  
  const userId = (session?.user as any)?.id;
  const { isConnected: isPrinterConnected, printCorte } = useBluetoothPrinter();

  useEffect(() => {
    if (isOpen && userId) {
      cargarPagosCorte();
    }
  }, [isOpen, fechaDesde, fechaHasta, userId, isOnline]);

  const cargarPagosCorte = async () => {
    if (!userId) return;
    setLoading(true);
    
    try {
      // 1. Siempre cargar datos locales primero (para offline o datos aún no sincronizados)
      const start = new Date(fechaDesde);
      start.setHours(0, 0, 0, 0);
      const end = new Date(fechaHasta);
      end.setHours(23, 59, 59, 999);
      
      const pagosLocales = await db.pagos
        .where('cobradorId').equals(userId)
        .toArray();
      
      // Filtrar por fecha localmente
      const pagosFiltrados = pagosLocales.filter(p => {
        const fechaPago = new Date(p.fechaPago);
        return fechaPago >= start && fechaPago <= end;
      });

      // 2. Si hay conexión, intentar complementar con datos del servidor
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
            // Si el servidor tiene datos más completos, podríamos usarlos
            // Por ahora, para el cobrador en campo, sus datos locales suelen ser suficientes
            // pero el API también nos da los pagos ya sincronizados por otros medios.
            if (data.pagos && data.pagos.length > 0) {
              // Combinar o preferir servidor? 
              // Para el "Corte del Cobrador", lo más importante es lo que él ha cobrado hoy.
              // Usaremos el listado detallado del servidor si está disponible.
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
    } catch (error) {
      console.error('Error al imprimir corte:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-6 pb-2 border-b bg-white sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl flex items-center gap-2">
              <Calculator className="w-6 h-6 text-blue-600" />
              Corte del Día
            </DialogTitle>
            <Badge variant={isOnline ? 'default' : 'secondary'} className="text-[10px]">
              {isOnline ? <Wifi className="w-3 h-3 mr-1" /> : <WifiOff className="w-3 h-3 mr-1" />}
              {isOnline ? 'Online' : 'Offline'}
            </Badge>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* Filtros de Fecha */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="fechaDesde" className="text-xs font-bold uppercase text-muted-foreground">Desde</Label>
              <Input
                id="fechaDesde"
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fechaHasta" className="text-xs font-bold uppercase text-muted-foreground">Hasta</Label>
              <Input
                id="fechaHasta"
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
          </div>

          {/* Resumen de Totales */}
          <div className="space-y-3">
            <Card className="bg-blue-600 text-white border-none shadow-lg">
              <CardContent className="p-4 flex justify-between items-center">
                <div>
                  <p className="text-xs font-medium opacity-80 uppercase tracking-wider">Total General</p>
                  <h2 className="text-3xl font-bold">{formatCurrency(stats.totalGeneral)}</h2>
                </div>
                <div className="bg-white/20 p-2 rounded-lg">
                  <DollarSign className="w-8 h-8" />
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-3">
              <Card className="border-l-4 border-l-green-500">
                <CardContent className="p-3">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Efectivo 💵</p>
                  <p className="text-lg font-bold text-green-600">{formatCurrency(stats.totalEfectivo)}</p>
                </CardContent>
              </Card>
              
              <Card className="border-l-4 border-l-purple-500">
                <CardContent className="p-3">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Transf. 📱</p>
                  <p className="text-lg font-bold text-purple-600">{formatCurrency(stats.totalTransferencia)}</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Detalles de Pagos */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase text-muted-foreground flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Desglose de Pagos ({stats.cantidadPagos})
              </h3>
              <Button variant="ghost" size="sm" onClick={cargarPagosCorte} className="h-8 w-8 p-0">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {pagosCorte.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed">
                  <Clock className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                  <p className="text-sm text-muted-foreground italic">No hay cobros en este rango</p>
                </div>
              ) : (
                pagosCorte.map((pago, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-white border rounded-lg shadow-sm">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate">
                        {pago.cliente?.nombreCompleto || pago.cliente || 'Pago Directo'}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-[9px] h-4">
                          {(pago.tipoPago || pago.tipo || '').toUpperCase()}
                        </Badge>
                        <span className="text-[9px] text-muted-foreground">
                          {format(new Date(pago.fechaPago || pago.fecha), 'HH:mm')}
                        </span>
                        {(pago.metodoPago || pago.metodo) === 'efectivo' ? 
                          <Badge className="bg-green-100 text-green-700 text-[9px] h-4">EFECTIVO</Badge> : 
                          <Badge className="bg-purple-100 text-purple-700 text-[9px] h-4">TRANSF.</Badge>
                        }
                      </div>
                    </div>
                    <div className="text-right ml-2">
                      <p className="text-sm font-bold">{formatCurrency(pago.monto)}</p>
                      {pago.syncStatus === 'pending' || !pago.id ? (
                        <span className="text-[8px] text-orange-500 font-bold uppercase">Local</span>
                      ) : (
                        <CheckCircle className="w-3 h-3 text-green-500 ml-auto" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cerrar
            </Button>
            <Button 
               onClick={handleImprimirCorte} 
               disabled={stats.cantidadPagos === 0 || !isPrinterConnected}
               className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <Printer className="w-4 h-4 mr-2" />
              Imprimir Corte
            </Button>
          </div>
          
          {!isPrinterConnected && stats.cantidadPagos > 0 && (
            <p className="text-[10px] text-center text-orange-600 bg-orange-50 p-2 rounded font-medium">
              Conecta una impresora Bluetooth para imprimir el corte
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
