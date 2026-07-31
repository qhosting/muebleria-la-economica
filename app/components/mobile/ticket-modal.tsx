'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Printer, Download, Share2, Check, Wifi, Copy, X } from 'lucide-react';
import { TicketData } from '@/lib/bluetooth-printer';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

interface TicketModalProps {
  ticketData: TicketData | null;
  isOpen: boolean;
  onClose: () => void;
  isPrinterConnected?: boolean;
  onPrintBluetooth?: () => Promise<boolean | void>;
}

export function TicketModal({
  ticketData,
  isOpen,
  onClose,
  isPrinterConnected = false,
  onPrintBluetooth
}: TicketModalProps) {
  const [printingBT, setPrintingBT] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!ticketData) return null;

  const fechaObj = new Date(ticketData.pago.fechaPago);
  const fechaFormatted = isNaN(fechaObj.getTime())
    ? ticketData.pago.fechaPago
    : format(fechaObj, 'dd/MM/yyyy HH:mm', { locale: es });

  const handlePrintBT = async () => {
    if (!onPrintBluetooth) return;
    setPrintingBT(true);
    try {
      await onPrintBluetooth();
    } catch (error) {
      console.error('Error al imprimir por Bluetooth:', error);
    } finally {
      setPrintingBT(false);
    }
  };

  const handleWebPrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    const text = `
=== ${ticketData.empresa.nombre} ===
RECIBO DE PAGO #${ticketData.numeroRecibo || 'N/A'}
--------------------------------
Fecha: ${fechaFormatted}
Cliente: ${ticketData.cliente.nombreCompleto}
Dirección: ${ticketData.cliente.direccion}
Cobrador: ${ticketData.cobrador.nombre}
--------------------------------
Concepto: ${ticketData.pago.concepto || 'Pago de cuota'}
Tipo: ${ticketData.pago.tipoPago}
Método: ${ticketData.pago.metodoPago || 'Efectivo'}
MONTO COBRADO: ${formatCurrency(ticketData.pago.monto)}
${ticketData.pago.montoMoratorio ? `(Incluye Moratorio: ${formatCurrency(ticketData.pago.montoMoratorio)})` : ''}
--------------------------------
Saldo Anterior: ${formatCurrency(ticketData.saldos.anterior)}
Saldo Nuevo:    ${formatCurrency(ticketData.saldos.nuevo)}
--------------------------------
¡GRACIAS POR SU PAGO!
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Ticket copiado al portapapeles');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden bg-white sm:rounded-lg">
        {/* Cabecera del Modal (Oculta al imprimir en papel) */}
        <DialogHeader className="p-4 border-b bg-gray-50 flex flex-row items-center justify-between space-y-0 print:hidden">
          <DialogTitle className="text-base font-semibold flex items-center gap-2">
            <Printer className="w-4 h-4 text-blue-600" />
            Recibo de Pago #{ticketData.numeroRecibo || ''}
          </DialogTitle>
          <div className="flex items-center gap-2">
            {isPrinterConnected && (
              <Badge variant="default" className="text-xs bg-green-600">
                Bluetooth Conectado
              </Badge>
            )}
          </div>
        </DialogHeader>

        {/* Vista del Ticket Estilo Térmico (Imprimible) */}
        <div className="p-6 overflow-y-auto max-h-[70vh] flex justify-center bg-gray-100 print:bg-white print:p-0 print:max-h-none">
          <div 
            id="printable-ticket"
            className="w-[280px] bg-white p-4 shadow-md rounded border border-gray-200 text-xs font-mono text-gray-800 space-y-3 print:shadow-none print:border-none print:w-full print:p-0"
          >
            {/* Encabezado del Negocio */}
            <div className="text-center space-y-1 pb-2 border-b border-dashed border-gray-300">
              <h2 className="font-bold text-sm text-gray-900 tracking-wider">
                {ticketData.empresa.nombre}
              </h2>
              {ticketData.empresa.direccion && (
                <p className="text-[11px] text-gray-600">{ticketData.empresa.direccion}</p>
              )}
              {ticketData.empresa.telefono && (
                <p className="text-[11px] text-gray-600">{ticketData.empresa.telefono}</p>
              )}
              <div className="mt-2 pt-1 border-t border-gray-200">
                <span className="font-bold text-gray-900 text-[11px]">RECIBO DE PAGO</span>
                <p className="text-[11px] font-semibold text-blue-700">
                  #{ticketData.numeroRecibo || 'SIN-NUMERO'}
                </p>
              </div>
            </div>

            {/* Datos del Cliente y Cobrador */}
            <div className="space-y-1 pb-2 border-b border-dashed border-gray-300 text-[11px]">
              <div>
                <span className="text-gray-500">Fecha: </span>
                <span className="font-medium text-gray-900">{fechaFormatted}</span>
              </div>
              <div>
                <span className="text-gray-500">Cliente: </span>
                <span className="font-semibold text-gray-900">{ticketData.cliente.nombreCompleto}</span>
              </div>
              {ticketData.cliente.direccion && (
                <div className="line-clamp-2">
                  <span className="text-gray-500">Dirección: </span>
                  <span>{ticketData.cliente.direccion}</span>
                </div>
              )}
              <div>
                <span className="text-gray-500">Cobrador: </span>
                <span>{ticketData.cobrador.nombre}</span>
              </div>
            </div>

            {/* Detalle del Pago */}
            <div className="space-y-1.5 pb-2 border-b border-dashed border-gray-300 text-[11px]">
              <div className="flex justify-between font-semibold">
                <span>Concepto:</span>
                <span className="text-right">{ticketData.pago.concepto || 'Pago de cuota'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tipo:</span>
                <span className="capitalize">{ticketData.pago.tipoPago}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Método:</span>
                <span className="capitalize">{ticketData.pago.metodoPago || 'Efectivo'}</span>
              </div>
              
              <div className="pt-2 flex justify-between items-center text-sm font-bold border-t border-gray-200 text-gray-900">
                <span>TOTAL:</span>
                <span className="text-base text-green-700">{formatCurrency(ticketData.pago.monto)}</span>
              </div>

              {ticketData.pago.montoMoratorio ? (
                <div className="text-[10px] text-red-600 flex justify-between">
                  <span>Monto Moratorio:</span>
                  <span>{formatCurrency(ticketData.pago.montoMoratorio)}</span>
                </div>
              ) : null}
            </div>

            {/* Saldos */}
            <div className="space-y-1 pb-2 border-b border-dashed border-gray-300 text-[11px]">
              <div className="flex justify-between text-gray-600">
                <span>Saldo Anterior:</span>
                <span>{formatCurrency(ticketData.saldos.anterior)}</span>
              </div>
              <div className="flex justify-between font-semibold text-gray-900">
                <span>Saldo Nuevo:</span>
                <span className="text-blue-700">{formatCurrency(ticketData.saldos.nuevo)}</span>
              </div>
            </div>

            {/* Pie de ticket */}
            <div className="text-center pt-1 text-[10px] text-gray-500 space-y-1">
              <p className="font-semibold">¡GRACIAS POR SU PAGO!</p>
              <p className="text-[9px] text-gray-400">Comprobante de operación</p>
            </div>
          </div>
        </div>

        {/* Botones de Acción (Ocultos al imprimir en papel) */}
        <DialogFooter className="p-4 border-t bg-gray-50 flex flex-col sm:flex-row gap-2 print:hidden">
          <Button variant="outline" onClick={onClose} className="sm:w-auto">
            Cerrar
          </Button>

          <Button variant="outline" onClick={handleCopyText} className="gap-1.5 text-xs">
            {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copiado' : 'Copiar Texto'}
          </Button>

          <Button variant="outline" onClick={handleWebPrint} className="gap-1.5 text-xs">
            <Printer className="w-3.5 h-3.5" />
            Imprimir / PDF
          </Button>

          {isPrinterConnected && onPrintBluetooth && (
            <Button
              onClick={handlePrintBT}
              disabled={printingBT}
              className="bg-green-600 hover:bg-green-700 text-white gap-1.5 text-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              {printingBT ? 'Enviando...' : 'Reimprimir BT'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
