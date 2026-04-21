
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
  AlertTriangle,
  Printer,
  Settings
} from 'lucide-react';
import { OfflineCliente } from '@/lib/offline-db';
import { syncService } from '@/lib/sync-service';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { generateLocalId } from '@/lib/offline-db';
import { useBluetoothPrinter } from '@/hooks/use-bluetooth-printer';
import { TicketData } from '@/lib/bluetooth-printer';
import { PrinterConfigModal } from './printer-config-modal';
import { Switch } from '@/components/ui/switch';

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
  const [tipoPago, setTipoPago] = useState<'regular' | 'abono' | 'liquidacion' | 'mora' | 'cobro_mora'>('regular');
  const [metodoPago, setMetodoPago] = useState<'efectivo' | 'transferencia' | 'cheque'>('efectivo');
  const [concepto, setConcepto] = useState('');
  const [numeroRecibo, setNumeroRecibo] = useState('');
  const [loading, setLoading] = useState(false);
  const [imprimirTicket, setImprimirTicket] = useState(true);
  const [showPrinterConfig, setShowPrinterConfig] = useState(false);
  const [calculatedValues, setCalculatedValues] = useState({
    saldoAnterior: 0,
    saldoNuevo: 0,
    montoParaSaldo: 0,
    montoMoratorio: 0
  });

  const userId = (session?.user as any)?.id;
  const { isConnected: isPrinterConnected, printTicket } = useBluetoothPrinter();

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

  // Calcular nuevo saldo cuando cambia el monto, moratorio o tipo
  useEffect(() => {
    const montoNum = parseFloat(monto) || 0;
    const moratorioNum = parseFloat(montoMoratorio) || 0;
    const saldoPendienteNum = Number(cliente.saldoPendiente) || 0;

    // Si es cobro de mora (aumenta saldo), la lógica es diferente
    if (tipoPago === 'cobro_mora') {
      const nuevoSaldo = saldoPendienteNum + montoNum;
      setCalculatedValues({
        saldoAnterior: saldoPendienteNum,
        saldoNuevo: nuevoSaldo,
        montoParaSaldo: montoNum,
        montoMoratorio: 0
      });
      return;
    }

    // Si es pago de mora (no afecta saldo), el monto total viene de montoMoratorio
    if (tipoPago === 'mora') {
      setCalculatedValues({
        saldoAnterior: saldoPendienteNum,
        saldoNuevo: saldoPendienteNum,
        montoParaSaldo: 0,
        montoMoratorio: moratorioNum
      });
      return;
    }

    // Lógica para pagos normales (reducen saldo)
    const moratorioFinal = Math.min(moratorioNum, montoNum);
    const montoParaSaldo = montoNum - moratorioFinal;

    if (montoNum > 0 || moratorioNum > 0) {
      const nuevoSaldo = Math.max(0, saldoPendienteNum - montoParaSaldo);

      setCalculatedValues({
        saldoAnterior: saldoPendienteNum,
        saldoNuevo: nuevoSaldo,
        montoParaSaldo: montoParaSaldo,
        montoMoratorio: moratorioFinal
      });
    } else {
      setCalculatedValues({
        saldoAnterior: saldoPendienteNum,
        saldoNuevo: saldoPendienteNum,
        montoParaSaldo: 0,
        montoMoratorio: 0
      });
    }
  }, [monto, montoMoratorio, cliente.saldoPendiente, tipoPago]);

  // Cambiar concepto por defecto según tipo de pago
  useEffect(() => {
    if (tipoPago === 'cobro_mora') {
      setConcepto('Recargo por Mora');
    } else if (concepto === 'Recargo por Mora') {
      setConcepto('Pago de cuota');
    }
  }, [tipoPago]);

  const createTicketData = (fechaPago: string, numeroReciboFinal: string): TicketData => {
    return {
      numeroRecibo: numeroReciboFinal,
      cliente: {
        nombreCompleto: cliente.nombreCompleto,
        telefono: cliente.telefono,
        direccion: cliente.direccion,
        diaPago: cliente.diaPago
      },
      cobrador: {
        nombre: (session?.user as any)?.name || 'Cobrador',
        id: userId
      },
      pago: {
        monto: parseFloat(monto) || 0,
        montoMoratorio: calculatedValues.montoMoratorio,
        montoNeto: calculatedValues.montoParaSaldo,
        tipoPago: tipoPago,
        metodoPago: metodoPago,
        concepto: concepto,
        fechaPago: fechaPago
      },
      saldos: {
        anterior: calculatedValues.saldoAnterior,
        nuevo: calculatedValues.saldoNuevo
      },
      empresa: {
        nombre: 'MUEBLERIA LA ECONOMICA',
        direccion: 'Dirección de la empresa',
        telefono: 'Tel: (555) 123-4567'
      }
    };
  };

  const handleSubmit = async (e: React.FormEvent, forceConfirm = false) => {
    e.preventDefault();

    const montoNum = parseFloat(monto) || 0;
    const moratorioNum = parseFloat(montoMoratorio) || 0;

    // VALIDACIÓN DE SEGURIDAD: Prevenir errores de dedo (Saldos de millones)
    if (!forceConfirm) {
      if (tipoPago === 'cobro_mora' && montoNum > 5000) {
        if (!window.confirm(`⚠️ EL MONTO DE MORA (${formatCurrency(montoNum)}) ES MUY ALTO.\n\n¿Está seguro de que desea AUMENTAR la deuda del cliente por esta cantidad?`)) {
          return;
        }
      }
      
      if (tipoPago !== 'cobro_mora' && montoNum > 10000) {
        if (!window.confirm(`⚠️ ESTÁ REGISTRANDO UN PAGO DE ${formatCurrency(montoNum)}.\n\n¿El monto es correcto?`)) {
          return;
        }
      }
    }

    if (tipoPago === 'mora' && moratorioNum <= 0) {
      toast.error('Por favor ingrese el monto de la mora');
      return;
    }

    if (tipoPago !== 'mora' && montoNum < 0 || (montoNum === 0 && tipoPago !== 'cobro_mora' && tipoPago !== 'mora')) {
      toast.error('Por favor ingrese un monto válido');
      return;
    }

    if (!userId) {
      toast.error('Error de sesión');
      return;
    }

    setLoading(true);

    try {
      const crearPagoRegular = calculatedValues.montoParaSaldo > 0 || calculatedValues.montoMoratorio === 0;

      const pagoRegular = crearPagoRegular ? {
        id: '', // Se generará en el servidor
        clienteId: cliente.id,
        cobradorId: userId,
        monto: calculatedValues.montoParaSaldo, // Solo el monto que va al saldo
        tipoPago,
        concepto: concepto || `Pago ${tipoPago}`,
        fechaPago: new Date().toISOString(),
        metodoPago,
        numeroRecibo: numeroRecibo || undefined,
        saldoAnterior: calculatedValues.saldoAnterior,
        saldoNuevo: calculatedValues.saldoNuevo
      } : null;

      const pagoMoratorio = calculatedValues.montoMoratorio > 0 ? {
        id: '', // Se generará en el servidor
        clienteId: cliente.id,
        cobradorId: userId,
        monto: calculatedValues.montoMoratorio,
        tipoPago: 'mora' as const,
        concepto: `Moratorio - ${concepto || 'Recargo por mora'}`,
        fechaPago: new Date().toISOString(),
        metodoPago,
        numeroRecibo: numeroRecibo ? `${numeroRecibo}-M` : undefined,
        saldoAnterior: calculatedValues.saldoAnterior, // Nota: El moratorio técnicamente no cambia el saldo de la deuda de mercancía
        saldoNuevo: calculatedValues.saldoAnterior
      } : null;

      if (isOnline) {
        // Registrar pago regular si existe
        if (pagoRegular) {
          const responsePrincipal = await fetch('/api/pagos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pagoRegular)
          });

          if (!responsePrincipal.ok) {
            throw new Error('Error al procesar el pago regular');
          }
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

        // Imprimir ticket si está habilitado y la impresora está conectada
        if (imprimirTicket && isPrinterConnected) {
          try {
            const fechaTicket = pagoRegular ? pagoRegular.fechaPago : (pagoMoratorio ? pagoMoratorio.fechaPago : new Date().toISOString());
            const reciboTicket = (pagoRegular ? pagoRegular.numeroRecibo : (pagoMoratorio ? pagoMoratorio.numeroRecibo : '')) || '';
            const ticketData = createTicketData(fechaTicket, reciboTicket);
            await printTicket(ticketData);
          } catch (error) {
            console.error('Error imprimiendo ticket:', error);
            toast.error('El pago se registró correctamente, pero hubo un error al imprimir el ticket');
          }
        }

      } else {
        // Si está offline, guardar localmente
        if (pagoRegular) {
          console.log('Guardando pago regular offline:', pagoRegular);
          await syncService.addPagoOffline(pagoRegular);
        }

        if (pagoMoratorio) {
          console.log('Guardando pago moratorio offline:', pagoMoratorio);
          await syncService.addPagoOffline(pagoMoratorio);
        }

        const mensaje = pagoMoratorio
          ? `Pagos guardados offline: Regular (${formatCurrency(calculatedValues.montoParaSaldo)}) + Moratorio (${formatCurrency(calculatedValues.montoMoratorio)})`
          : 'Pago guardado offline';

        toast.success(mensaje, {
          description: 'Se sincronizará cuando tengas conexión'
        });

        console.log(`Pagos offline guardados - Regular: ${!!pagoRegular}, Moratorio: ${!!pagoMoratorio}`);

        // Imprimir ticket si está habilitado y la impresora está conectada (también offline)
        if (imprimirTicket && isPrinterConnected) {
          try {
            const fechaTicket = pagoRegular ? pagoRegular.fechaPago : (pagoMoratorio ? pagoMoratorio.fechaPago : new Date().toISOString());
            const reciboTicket = (pagoRegular ? pagoRegular.numeroRecibo : (pagoMoratorio ? pagoMoratorio.numeroRecibo : '')) || '';
            const ticketData = createTicketData(fechaTicket, reciboTicket);
            await printTicket(ticketData);
          } catch (error) {
            console.error('Error imprimiendo ticket:', error);
            toast.error('El pago se guardó offline correctamente, pero hubo un error al imprimir el ticket');
          }
        }
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
                  <span className="text-muted-foreground uppercase text-[10px] font-bold">Saldo Actual:</span>
                  <div className="font-bold text-lg text-red-600">
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

          {/* Tipo de pago */}
          <div className="space-y-2">
            <Label htmlFor="tipoPago">Tipo de Pago</Label>
            <Select 
              value={tipoPago} 
              onValueChange={(value: any) => {
                setTipoPago(value);
                if (value === 'mora') {
                  setMonto('0');
                  setMontoMoratorio('');
                }
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="regular">Pago Regular</SelectItem>
                <SelectItem value="abono">Abono</SelectItem>
                <SelectItem value="mora">Pago de Mora (Sin afectar saldo)</SelectItem>
                <SelectItem value="cobro_mora">Cobro de Mora (Aumenta Saldo)</SelectItem>
                <SelectItem value="liquidacion">Liquidación</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Botones de monto rápido - Solo se muestran si NO es Pago de Mora */}
          {tipoPago !== 'mora' && (
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
          )}

          {/* Monto personalizado - Solo se muestra si NO es Pago de Mora */}
          {tipoPago !== 'mora' && (
            <div className="space-y-2">
              <Label htmlFor="monto">
                {tipoPago === 'cobro_mora' ? 'Monto Recargo Mora (Aumenta Saldo) *' : 'Monto a Cobrar *'}
              </Label>
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
          )}

          {/* Monto Moratorio o Pago de Mora - Solo para regular, abono o pago de mora (no cobro_mora) */}
          {(tipoPago === 'regular' || tipoPago === 'abono' || tipoPago === 'mora') && (
            <div className="space-y-2">
              <Label htmlFor="montoMoratorio">
                {tipoPago === 'mora' ? 'Monto Pago de Mora *' : 'Monto Moratorio (Opcional)'}
              </Label>
              <div className="relative">
                <AlertTriangle className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-orange-500" />
                <Input
                  id="montoMoratorio"
                  type="number"
                  step="0.01"
                  min={tipoPago === 'mora' ? "0.01" : "0"}
                  max={tipoPago === 'mora' ? undefined : (monto || "0")}
                  value={montoMoratorio}
                  onChange={(e) => setMontoMoratorio(e.target.value)}
                  placeholder="0.00"
                  className="pl-9"
                  required={tipoPago === 'mora'}
                />
              </div>
              <div className="text-xs text-muted-foreground">
                {tipoPago === 'mora' 
                  ? 'Este monto se registra como cobro de mora y NO afecta el saldo pendiente'
                  : 'El monto moratorio se registra por separado y NO se aplica al saldo pendiente'}
              </div>
            </div>
          )}

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
                    {formatCurrency((parseFloat(monto) || 0) + (parseFloat(montoMoratorio) || 0))}
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
                    <div className={`flex justify-between text-sm ${tipoPago === 'cobro_mora' ? 'text-red-500' : 'text-green-600'}`}>
                      <span>{tipoPago === 'cobro_mora' ? '├ Recargo al saldo:' : '├ Aplicado al saldo:'}</span>
                      <span className="font-medium">
                        {tipoPago === 'cobro_mora' ? '+' : '-'}{formatCurrency(calculatedValues.montoParaSaldo)}
                      </span>
                    </div>
                  </>
                )}

                {calculatedValues.montoMoratorio === 0 && (
                  <div className={`flex justify-between text-sm ${tipoPago === 'cobro_mora' ? 'text-red-500' : 'text-green-600'}`}>
                    <span>{tipoPago === 'cobro_mora' ? 'Recargo al saldo:' : 'Aplicado al saldo:'}</span>
                    <span className="font-medium">
                      {tipoPago === 'cobro_mora' ? '+' : '-'}{formatCurrency(calculatedValues.montoParaSaldo)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-sm pt-2 border-t">
                  <span>Nuevo Saldo:</span>
                  <span className={`font-semibold ${calculatedValues.saldoNuevo > 0 ? 'text-red-600' : 'text-green-600'
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

          {/* Configuración de Impresión */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Printer className="w-4 h-4" />
                Impresión de Ticket
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Estado de la impresora */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Estado de Impresora
                </span>
                <div className="flex items-center gap-2">
                  <Badge variant={isPrinterConnected ? 'default' : 'secondary'} className="text-xs">
                    {isPrinterConnected ? 'Conectada' : 'Desconectada'}
                  </Badge>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPrinterConfig(true)}
                    className="h-6 w-6 p-0"
                  >
                    <Settings className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              {/* Switch para imprimir automáticamente */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-sm font-medium">
                    Imprimir ticket automáticamente
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Se imprimirá después de registrar el pago
                  </div>
                </div>
                <Switch
                  checked={imprimirTicket}
                  onCheckedChange={setImprimirTicket}
                  disabled={!isPrinterConnected}
                />
              </div>

              {!isPrinterConnected && (
                <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded">
                  <AlertTriangle className="w-3 h-3 inline mr-1" />
                  Conecta una impresora para habilitar la impresión automática
                </div>
              )}
            </CardContent>
          </Card>

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

        {/* Modal de Configuración de Impresora */}
        <PrinterConfigModal
          isOpen={showPrinterConfig}
          onClose={() => setShowPrinterConfig(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
