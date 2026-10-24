'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Printer,
  Download,
  Share2,
  Check,
  Wifi,
  Copy,
  X,
  Laptop,
  Bluetooth,
  MessageCircle,
  FileText
} from 'lucide-react';
import { TicketData } from '@/lib/bluetooth-printer';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

import { imprimirTicketTermicoUSB } from '@/lib/ticket-usb-printer';

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
  const [tipoImpresora, setTipoImpresora] = useState<'usb' | 'bluetooth'>('usb');
  const [anchoPapel, setAnchoPapel] = useState<'80mm' | '58mm'>('80mm');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTipo = localStorage.getItem('ticket_tipo_impresora');
      const savedAncho = localStorage.getItem('ticket_ancho_papel');
      if (savedTipo === 'usb' || savedTipo === 'bluetooth') {
        setTipoImpresora(savedTipo);
      } else if (isPrinterConnected) {
        setTipoImpresora('bluetooth');
      } else {
        setTipoImpresora('usb');
      }

      if (savedAncho === '58mm' || savedAncho === '80mm') {
        setAnchoPapel(savedAncho);
      }
    }
  }, [isPrinterConnected]);

  const handleCambiarTipo = (tipo: 'usb' | 'bluetooth') => {
    setTipoImpresora(tipo);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ticket_tipo_impresora', tipo);
    }
  };

  const handleCambiarAncho = (ancho: '80mm' | '58mm') => {
    setAnchoPapel(ancho);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ticket_ancho_papel', ancho);
    }
  };

  if (!ticketData) return null;

  const fechaObj = new Date(ticketData.pago.fechaPago);
  const fechaFormatted = isNaN(fechaObj.getTime())
    ? ticketData.pago.fechaPago
    : format(fechaObj, 'dd/MM/yyyy HH:mm', { locale: es });

  const handlePrintBT = async () => {
    if (!onPrintBluetooth) {
      toast.info('No hay impresora Bluetooth vinculada en este navegador');
      return;
    }
    setPrintingBT(true);
    try {
      await onPrintBluetooth();
    } catch (error) {
      console.error('Error al imprimir por Bluetooth:', error);
      toast.error('Error al enviar a impresora Bluetooth');
    } finally {
      setPrintingBT(false);
    }
  };

  /**
   * Imprime directamente el ticket en cualquier impresora del sistema (USB POS 58mm/80mm, térmica o láser)
   * creando un documento limpio y aislado para que corte y ajuste exacto a papel de rollo térmico.
   */
  const handlePrintUSB = async () => {
    await imprimirTicketTermicoUSB(ticketData, anchoPapel);
  };

  const handleCopyText = () => {
    const text = `
=== ${ticketData.empresa.nombre} ===
RECIBO DE PAGO #${ticketData.numeroRecibo || 'N/A'}
--------------------------------
Fecha: ${fechaFormatted}
Cliente: ${ticketData.cliente.nombreCompleto}
${ticketData.cliente.codigoCliente ? `Código: ${ticketData.cliente.codigoCliente}\n` : ''}Dirección: ${ticketData.cliente.direccion}
Cobrador/Vendedor: ${ticketData.cobrador.nombre}
--------------------------------
Concepto: ${ticketData.pago.concepto || 'Pago de cuota'}
Tipo: ${ticketData.pago.tipoPago}
Método: ${ticketData.pago.metodoPago || 'Efectivo'}
MONTO COBRADO: ${formatCurrency(ticketData.pago.monto)}
${ticketData.pago.montoMoratorio ? `(Incluye Moratorio: ${formatCurrency(ticketData.pago.montoMoratorio)})\n` : ''}--------------------------------
Saldo Anterior: ${formatCurrency(ticketData.saldos.anterior)}
Saldo Nuevo:    ${formatCurrency(ticketData.saldos.nuevo)}
--------------------------------
¡GRACIAS POR SU PAGO!
Mueblería La Económica
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Ticket copiado al portapapeles');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const tel = ticketData.cliente.telefono?.replace(/\D/g, '') || '';
    const texto = `
*${ticketData.empresa.nombre}*
*COMPROBANTE DE PAGO #${ticketData.numeroRecibo || 'N/A'}*
--------------------------------
*Fecha:* ${fechaFormatted}
*Cliente:* ${ticketData.cliente.nombreCompleto}
${ticketData.cliente.codigoCliente ? `*Código:* ${ticketData.cliente.codigoCliente}\n` : ''}*Cobrador/Vendedor:* ${ticketData.cobrador.nombre}
--------------------------------
*Concepto:* ${ticketData.pago.concepto || 'Abono de cuota'}
*Método:* ${ticketData.pago.metodoPago || 'Efectivo'}
*MONTO PAGADO:* ${formatCurrency(ticketData.pago.monto)}
--------------------------------
*Saldo Anterior:* ${formatCurrency(ticketData.saldos.anterior)}
*SALDO NUEVO:* ${formatCurrency(ticketData.saldos.nuevo)}
--------------------------------
_¡Gracias por su pago! Mueblería La Económica_
    `.trim();

    const url = tel.length >= 10
      ? `https://wa.me/52${tel.slice(-10)}?text=${encodeURIComponent(texto)}`
      : `https://wa.me/?text=${encodeURIComponent(texto)}`;

    window.open(url, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden bg-white sm:rounded-xl">
        {/* Cabecera del Modal con Selector de Impresora */}
        <DialogHeader className="p-4 border-b bg-slate-900 text-white flex flex-col gap-2.5 print:hidden">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-white">
              <Printer className="w-4 h-4 text-emerald-400" />
              Comprobante de Pago #{ticketData.numeroRecibo || ''}
            </DialogTitle>
            <Badge variant="outline" className="text-[10px] bg-slate-800 text-emerald-300 border-emerald-500/40">
              Listo para imprimir
            </Badge>
          </div>

          {/* Selector de Dispositivo de Impresión: USB (PC Kiosco) vs Bluetooth (Móvil) */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800 text-xs">
            <div className="inline-flex bg-slate-800 p-0.5 rounded-lg border border-slate-700">
              <button
                type="button"
                onClick={() => handleCambiarTipo('usb')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1.5 ${
                  tipoImpresora === 'usb'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Impresora conectada por USB, cable o instalada en la computadora"
              >
                <Laptop className="w-3 h-3" />
                Impresora USB / PC
              </button>
              <button
                type="button"
                onClick={() => handleCambiarTipo('bluetooth')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1.5 ${
                  tipoImpresora === 'bluetooth'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Impresora térmica portátil conectada por Bluetooth"
              >
                <Bluetooth className="w-3 h-3" />
                Bluetooth
              </button>
            </div>

            {/* Si es USB, selector rápido de ancho de papel */}
            {tipoImpresora === 'usb' && (
              <div className="inline-flex bg-slate-800 p-0.5 rounded-lg border border-slate-700">
                <button
                  type="button"
                  onClick={() => handleCambiarAncho('80mm')}
                  className={`px-2 py-1 rounded-md text-[10px] font-bold ${
                    anchoPapel === '80mm'
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Papel de 80 mm (Estándar POS)"
                >
                  80 mm
                </button>
                <button
                  type="button"
                  onClick={() => handleCambiarAncho('58mm')}
                  className={`px-2 py-1 rounded-md text-[10px] font-bold ${
                    anchoPapel === '58mm'
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Papel de 58 mm (POS Compacta)"
                >
                  58 mm
                </button>
              </div>
            )}
          </div>
        </DialogHeader>

        {/* Vista del Ticket Estilo Térmico (Imprimible) */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[60vh] flex justify-center bg-slate-100 print:bg-white print:p-0 print:max-h-none">
          <div 
            id="printable-ticket"
            style={{ width: anchoPapel === '58mm' ? '240px' : '290px' }}
            className="bg-white p-4 shadow-md rounded border border-slate-300 text-xs font-mono text-gray-900 space-y-3 print:shadow-none print:border-none print:w-full print:p-0 transition-all"
          >
            {/* Encabezado del Negocio */}
            <div className="text-center space-y-1 pb-2 border-b border-dashed border-gray-400">
              <h2 className="font-black text-sm text-gray-900 tracking-wider">
                {ticketData.empresa.nombre}
              </h2>
              {ticketData.empresa.direccion && (
                <p className="text-[11px] text-gray-600">{ticketData.empresa.direccion}</p>
              )}
              {ticketData.empresa.telefono && (
                <p className="text-[11px] text-gray-600">Tel: {ticketData.empresa.telefono}</p>
              )}
              <div className="mt-2 pt-1 border-t border-gray-200">
                <span className="font-bold text-gray-900 text-[11px] block">COMPROBANTE DE PAGO</span>
                <p className="text-xs font-black text-blue-800">
                  RECIBO #{ticketData.numeroRecibo || 'SIN-NUMERO'}
                </p>
              </div>
            </div>

            {/* Datos del Cliente y Cobrador */}
            <div className="space-y-1 pb-2 border-b border-dashed border-gray-400 text-[11px]">
              <div>
                <span className="text-gray-500 font-semibold">Fecha: </span>
                <span className="font-bold text-gray-900">{fechaFormatted}</span>
              </div>
              <div>
                <span className="text-gray-500 font-semibold">Cliente: </span>
                <span className="font-bold text-gray-900">{ticketData.cliente.nombreCompleto}</span>
              </div>
              {ticketData.cliente.codigoCliente && (
                <div>
                  <span className="text-gray-500 font-semibold">Código: </span>
                  <span className="font-bold text-blue-900">{ticketData.cliente.codigoCliente}</span>
                </div>
              )}
              {ticketData.cliente.direccion && (
                <div className="line-clamp-2">
                  <span className="text-gray-500 font-semibold">Dirección: </span>
                  <span>{ticketData.cliente.direccion}</span>
                </div>
              )}
              {ticketData.cliente.telefono && (
                <div>
                  <span className="text-gray-500 font-semibold">Tel: </span>
                  <span>{ticketData.cliente.telefono}</span>
                </div>
              )}
              <div>
                <span className="text-gray-500 font-semibold">Cobrador/Vendedor: </span>
                <span className="font-bold text-gray-900">{ticketData.cobrador.nombre}</span>
              </div>
            </div>

            {/* Detalle del Pago */}
            <div className="space-y-1.5 pb-2 border-b border-dashed border-gray-400 text-[11px]">
              <div className="flex justify-between font-semibold">
                <span>Concepto:</span>
                <span className="text-right font-bold">{ticketData.pago.concepto || 'Pago de cuota'}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tipo:</span>
                <span className="capitalize font-semibold text-gray-800">{ticketData.pago.tipoPago}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Método:</span>
                <span className="capitalize font-semibold text-gray-800">{ticketData.pago.metodoPago || 'Efectivo'}</span>
              </div>
              
              <div className="pt-2 flex justify-between items-center text-sm font-black border-t border-gray-300 text-gray-900">
                <span>TOTAL:</span>
                <span className="text-base text-emerald-700">{formatCurrency(ticketData.pago.monto)}</span>
              </div>

              {ticketData.pago.montoMoratorio ? (
                <div className="text-[10px] text-red-600 flex justify-between">
                  <span>Monto Moratorio:</span>
                  <span>{formatCurrency(ticketData.pago.montoMoratorio)}</span>
                </div>
              ) : null}
            </div>

            {/* Saldos */}
            <div className="space-y-1 pb-2 border-b border-dashed border-gray-400 text-[11px]">
              <div className="flex justify-between text-gray-600">
                <span>Saldo Anterior:</span>
                <span>{formatCurrency(ticketData.saldos.anterior)}</span>
              </div>
              <div className="flex justify-between font-bold text-gray-900">
                <span>Saldo Nuevo:</span>
                <span className="text-blue-800">{formatCurrency(ticketData.saldos.nuevo)}</span>
              </div>
            </div>

            {/* Pie de ticket */}
            <div className="text-center pt-1 text-[10px] text-gray-500 space-y-1">
              <p className="font-bold text-gray-800">¡GRACIAS POR SU PAGO!</p>
              <p className="text-[9px] text-gray-500">Mueblería La Económica</p>
              <p className="text-[9px] text-gray-400">Conserve este comprobante para cualquier aclaración</p>
            </div>
          </div>
        </div>

        {/* Botones de Acción */}
        <DialogFooter className="p-3.5 border-t bg-slate-50 flex flex-col sm:flex-row gap-2 print:hidden">
          <Button variant="outline" size="sm" onClick={onClose} className="sm:w-auto text-xs">
            Cerrar
          </Button>

          <Button variant="outline" size="sm" onClick={handleCopyText} className="gap-1 text-xs">
            {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copiado' : 'Copiar'}
          </Button>

          {ticketData.cliente.telefono && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleShareWhatsApp}
              className="gap-1 text-xs text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 border-emerald-300"
              title="Compartir comprobante por WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
              WhatsApp
            </Button>
          )}

          {/* Botón principal según el modo seleccionado */}
          {tipoImpresora === 'usb' ? (
            <Button
              size="sm"
              onClick={handlePrintUSB}
              className="bg-blue-700 hover:bg-blue-800 text-white font-bold gap-1.5 text-xs shadow-sm flex-1 sm:flex-initial"
              title="Imprimir directamente en la impresora USB o de sistema conectada a esta computadora"
            >
              <Printer className="w-4 h-4" />
              Imprimir en Impresora USB / PC ({anchoPapel})
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handlePrintBT}
              disabled={printingBT}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 text-xs shadow-sm flex-1 sm:flex-initial"
              title="Imprimir vía conexión Bluetooth ESC/POS"
            >
              <Bluetooth className="w-4 h-4" />
              {printingBT ? 'Enviando a BT...' : 'Imprimir Bluetooth'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
