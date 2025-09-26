
// Modal de cobro optimizado para móvil offline
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  DollarSign, 
  CreditCard, 
  Calculator,
  Save,
  Wifi,
  WifiOff,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { OfflineCliente } from '@/lib/offline-db';
import { syncService } from '@/lib/sync-service';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { generateLocalId } from '@/lib/offline-db';

interface CobroModalProps {
  cliente: OfflineCliente;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  isOnline: boolean;
}

export function CobroModal({ cliente, isOpen, onClose, onSuccess, isOnline }: CobroModalProps) {
  const { data: session } = useSession();
  const [monto, setMonto] = useState('');
  const [montoMoratorio, setMontoMoratorio] = useState('');
  const [tipoPago, setTipoPago] = useState<'regular' | 'abono' | 'liquidacion' | 'mora'>('regular');
  const [metodoPago, setMetodoPago] = useState<'efectivo' | 'transferencia' | 'cheque'>('efectivo');
  const [concepto, setConcepto] = useState('');
  const [numeroRecibo, setNumeroRecibo] = useState('');
  const [loading, setLoading] = useState(false);
  const [calculatedValues, setCalculatedValues] = useState({
    saldoAnterior: 0,
    saldoNuevo: 0,
    montoParaSaldo: 0,
    montoMoratorio: 0
  });

  const userId = (session?.user as any)?.id;

  // Reset form cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setMonto('');
      setMontoMoratorio('');
      setTipoPago('regular');
      setMetodoPago('efectivo');
      setConcepto('');
      setNumeroRecibo('');
      setCalculatedValues({
        saldoAnterior: cliente.saldoPendiente,
        saldoNuevo: cliente.saldoPendiente,
        montoParaSaldo: 0,
        montoMoratorio: 0
      });
    }
  }, [isOpen, cliente]);

  // Calcular nuevo saldo cuando cambia el monto o moratorio
  useEffect(() => {
    const montoNum = parseFloat(monto) || 0;
    const moratorioNum = parseFloat(montoMoratorio) || 0;
    
    // Validar que el moratorio no sea mayor al monto total
    const moratorioFinal = Math.min(moratorioNum, montoNum);
    const montoParaSaldo = montoNum - moratorioFinal;
    
    if (montoNum > 0) {
      const nuevoSaldo = Math.max(0, cliente.saldoPendiente - montoParaSaldo);
      
      setCalculatedValues({
        saldoAnterior: cliente.saldoPendiente,
        saldoNuevo: nuevoSaldo,
        montoParaSaldo: montoParaSaldo,
        montoMoratorio: moratorioFinal
      });
    } else {
      setCalculatedValues({
        saldoAnterior: cliente.saldoPendiente,
        saldoNuevo: cliente.saldoPendiente,
        montoParaSaldo: 0,
        montoMoratorio: 0
      });
    }
  }, [monto, montoMoratorio, cliente.saldoPendiente]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!monto || parseFloat(monto) <= 0) {
      toast.error('Por favor ingrese un monto válido');
      return;
    }

    if (!userId) {
      toast.error('Error de sesión');
      return;
    }

    setLoading(true);

    try {
      const pagoRegular = {
        id: '', // Se generará en el servidor
        clienteId: cliente.id,
        cobradorId: userId,
        monto: calculatedValues.montoParaSaldo, // Solo el monto que va al saldo
        tipoPago,
        concepto: concepto || `Pago ${tipoPago}`,
        fechaPago: new Date().toISOString(),
        metodoPago,
        numeroRecibo: numeroRecibo || undefined
      };

      const pagoMoratorio = calculatedValues.montoMoratorio > 0 ? {
        id: '', // Se generará en el servidor
        clienteId: cliente.id,
        cobradorId: userId,
        monto: calculatedValues.montoMoratorio,
        tipoPago: 'mora' as const,
        concepto: `Moratorio - ${concepto || 'Recargo por mora'}`,
        fechaPago: new Date().toISOString(),
        metodoPago,
        numeroRecibo: numeroRecibo ? `${numeroRecibo}-M` : undefined
      } : null;

      if (isOnline) {
        // Registrar pago regular
        const responsePrincipal = await fetch('/api/pagos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pagoRegular)
        });

        if (!responsePrincipal.ok) {
          throw new Error('Error al procesar el pago regular');
        }

        // Registrar pago moratorio si existe
        if (pagoMoratorio) {
          const responseMoratorio = await fetch('/api/pagos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pagoMoratorio)
          });

          if (!responseMoratorio.ok) {
            console.error('Error al registrar moratorio, pero pago regular fue exitoso');
          }
        }

        const mensaje = pagoMoratorio 
          ? `Pago registrado exitosamente: ${formatCurrency(calculatedValues.montoParaSaldo)} al saldo + ${formatCurrency(calculatedValues.montoMoratorio)} moratorio`
          : 'Pago registrado exitosamente';
        
        toast.success(mensaje);
        
      } else {
        // Si está offline, guardar localmente
        await syncService.addPagoOffline(pagoRegular);
        
        if (pagoMoratorio) {
          await syncService.addPagoOffline(pagoMoratorio);
        }
        
        const mensaje = pagoMoratorio 
          ? 'Pagos guardados offline (regular + moratorio)'
          : 'Pago guardado offline';
        
        toast.success(mensaje, {
          description: 'Se sincronizará cuando tengas conexión'
        });
      }

      onSuccess();
      onClose();

    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error('Error al procesar el pago');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAmount = (amount: number) => {
    setMonto(amount.toString());
  };

  const getQuickAmounts = () => {
    const acordado = cliente.montoAcordado;
    const pendiente = cliente.saldoPendiente;
    
    const amounts = [
      acordado,
      acordado * 0.5, // Mitad del pago acordado
      pendiente, // Todo el saldo
      Math.min(acordado * 2, pendiente) // Doble pago o todo el saldo
    ];

    return [...new Set(amounts.filter(a => a > 0))].sort((a, b) => a - b);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg">
              Registrar Cobro
            </DialogTitle>
            
            <div className="flex items-center gap-2">
              <Badge variant={isOnline ? 'default' : 'secondary'} className="text-xs">
                {isOnline ? (
                  <><Wifi className="w-3 h-3 mr-1" />Online</>
                ) : (
                  <><WifiOff className="w-3 h-3 mr-1" />Offline</>
                )}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Información del cliente */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{cliente.nombreCompleto}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Saldo Actual:</span>
                  <div className="font-semibold text-red-600">
                    {formatCurrency(cliente.saldoPendiente)}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Pago Acordado:</span>
                  <div className="font-semibold">
                    {formatCurrency(cliente.montoAcordado)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botones de monto rápido */}
          <div className="space-y-2">
            <Label className="text-sm">Montos Rápidos</Label>
            <div className="grid grid-cols-2 gap-2">
              {getQuickAmounts().map((amount, index) => (
                <Button
                  key={index}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAmount(amount)}
                  className="text-xs h-8"
                >
                  {formatCurrency(amount)}
                </Button>
              ))}
            </div>
          </div>

          {/* Monto personalizado */}
          <div className="space-y-2">
            <Label htmlFor="monto">Monto a Cobrar *</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="monto"
                type="number"
                step="0.01"
                min="0"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                placeholder="0.00"
                className="pl-9"
                required
              />
            </div>
          </div>

          {/* Monto Moratorio */}
          <div className="space-y-2">
            <Label htmlFor="montoMoratorio">Monto Moratorio (Opcional)</Label>
            <div className="relative">
              <AlertTriangle className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-orange-500" />
              <Input
                id="montoMoratorio"
                type="number"
                step="0.01"
                min="0"
                max={monto || "0"}
                value={montoMoratorio}
                onChange={(e) => setMontoMoratorio(e.target.value)}
                placeholder="0.00"
                className="pl-9"
              />
            </div>
            <div className="text-xs text-muted-foreground">
              El monto moratorio se registra por separado y NO se aplica al saldo pendiente
            </div>
          </div>

          {/* Tipo de pago */}
          <div className="space-y-2">
            <Label htmlFor="tipoPago">Tipo de Pago</Label>
            <Select value={tipoPago} onValueChange={(value: any) => setTipoPago(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="regular">Pago Regular</SelectItem>
                <SelectItem value="abono">Abono</SelectItem>
                <SelectItem value="mora">Pago de Mora</SelectItem>
                <SelectItem value="liquidacion">Liquidación</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Método de pago */}
          <div className="space-y-2">
            <Label htmlFor="metodoPago">Método de Pago</Label>
            <Select value={metodoPago} onValueChange={(value: any) => setMetodoPago(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="efectivo">Efectivo</SelectItem>
                <SelectItem value="transferencia">Transferencia</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Número de recibo */}
          <div className="space-y-2">
            <Label htmlFor="numeroRecibo">Número de Recibo (Opcional)</Label>
            <Input
              id="numeroRecibo"
              value={numeroRecibo}
              onChange={(e) => setNumeroRecibo(e.target.value)}
              placeholder="Ej: 001234"
            />
          </div>

          {/* Concepto */}
          <div className="space-y-2">
            <Label htmlFor="concepto">Concepto (Opcional)</Label>
            <Textarea
              id="concepto"
              value={concepto}
              onChange={(e) => setConcepto(e.target.value)}
              placeholder="Descripción adicional del pago..."
              rows={2}
            />
          </div>

          {/* Cálculo del nuevo saldo */}
          {monto && parseFloat(monto) > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calculator className="w-4 h-4" />
                  Resumen del Pago
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Saldo Anterior:</span>
                  <span className="font-medium text-red-600">
                    {formatCurrency(calculatedValues.saldoAnterior)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Monto Total Cobrado:</span>
                  <span className="font-medium text-blue-600">
                    {formatCurrency(parseFloat(monto) || 0)}
                  </span>
                </div>
                
                {calculatedValues.montoMoratorio > 0 && (
                  <>
                    <div className="flex justify-between text-sm text-orange-600">
                      <span>├ Moratorio:</span>
                      <span className="font-medium">
                        {formatCurrency(calculatedValues.montoMoratorio)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-green-600">
                      <span>└ Aplicado al saldo:</span>
                      <span className="font-medium">
                        -{formatCurrency(calculatedValues.montoParaSaldo)}
                      </span>
                    </div>
                  </>
                )}
                
                {calculatedValues.montoMoratorio === 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Aplicado al saldo:</span>
                    <span className="font-medium text-green-600">
                      -{formatCurrency(calculatedValues.montoParaSaldo)}
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between text-sm pt-2 border-t">
                  <span>Nuevo Saldo:</span>
                  <span className={`font-semibold ${
                    calculatedValues.saldoNuevo > 0 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {formatCurrency(calculatedValues.saldoNuevo)}
                  </span>
                </div>
                
                {calculatedValues.saldoNuevo === 0 && (
                  <div className="flex items-center gap-1 text-green-600 text-sm mt-2">
                    <CheckCircle className="w-4 h-4" />
                    ¡Cliente quedará al día!
                  </div>
                )}
                
                {calculatedValues.montoMoratorio > 0 && (
                  <div className="p-2 bg-orange-50 rounded text-xs text-orange-700 mt-2">
                    <AlertTriangle className="w-3 h-3 inline mr-1" />
                    Se registrarán 2 pagos: uno regular por {formatCurrency(calculatedValues.montoParaSaldo)} y uno moratorio por {formatCurrency(calculatedValues.montoMoratorio)}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Botones de acción */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancelar
            </Button>
            
            <Button
              type="submit"
              disabled={loading || !monto || parseFloat(monto) <= 0}
              className="flex-1"
            >
              {loading ? (
                'Procesando...'
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Registrar
                </>
              )}
            </Button>
          </div>

          {/* Advertencia offline */}
          {!isOnline && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg border-l-2 border-yellow-400">
              <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0" />
              <div className="text-sm text-yellow-800">
                Trabajando offline. El pago se sincronizará automáticamente cuando tengas conexión.
              </div>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
