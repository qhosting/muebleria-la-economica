'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Printer,
  Calendar,
  DollarSign,
  User,
  Phone,
  MapPin,
  CheckCircle,
  Receipt,
  Store,
  CreditCard,
  PlusCircle,
  X
} from 'lucide-react';
import { formatCurrency, formatDate, getDayName, getPeriodicidadLabel } from '@/lib/utils';
import { Cliente } from '@/lib/types';
import { TicketModal } from '@/components/mobile/ticket-modal';
import { TicketData } from '@/lib/bluetooth-printer';

interface EstadoDeCuentaModalProps {
  cliente: Cliente | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenCobranza?: (cliente: Cliente) => void;
}

export function EstadoDeCuentaModal({
  cliente,
  isOpen,
  onClose,
  onOpenCobranza
}: EstadoDeCuentaModalProps) {
  const [ticketData, setTicketData] = useState<TicketData | null>(null);
  const [showTicketModal, setShowTicketModal] = useState(false);

  if (!isOpen || !cliente) return null;

  const pagos = (cliente as any).pagos || [];
  const totalAbonado = pagos.reduce((sum: number, p: any) => sum + (parseFloat(p.monto) || 0), 0);

  const handlePrint = () => {
    window.print();
  };

  const handleReimprimirTicket = (pago: any) => {
    const data: TicketData = {
      numeroRecibo: pago.numeroRecibo || pago.id?.slice(-6)?.toUpperCase(),
      cliente: {
        nombreCompleto: cliente.nombreCompleto,
        codigoCliente: cliente.codigoCliente,
        descripcionProducto: cliente.descripcionProducto,
        telefono: cliente.telefono,
        direccion: cliente.direccionCompleta,
        diaPago: cliente.diaPago,
      },
      cobrador: {
        nombre: pago.cobrador?.name || cliente.vendedor || 'Cobrador / Vendedor',
        id: pago.cobradorId || 'SISTEMA',
      },
      pago: {
        monto: parseFloat(pago.monto) || 0,
        tipoPago: pago.tipoPago || 'regular',
        metodoPago: pago.metodoPago || 'Efectivo',
        concepto: pago.concepto || 'Abono de cuota',
        fechaPago: pago.fechaPago || pago.createdAt,
      },
      saldos: {
        anterior: parseFloat(pago.saldoAnterior) || (parseFloat(cliente.saldoActual.toString()) + parseFloat(pago.monto)),
        nuevo: parseFloat(pago.saldoNuevo) || parseFloat(cliente.saldoActual.toString()),
      },
      empresa: {
        nombre: 'Mueblería La Económica',
        direccion: 'Av. Principal #100, San Lucas Tecopilco',
        telefono: '241-123-4567',
      },
    };

    setTicketData(data);
    setShowTicketModal(true);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto p-0 bg-white">
          {/* Header con acciones */}
          <DialogHeader className="p-4 sm:p-6 border-b bg-slate-900 text-white rounded-t-lg print:bg-white print:text-black print:border-b-2 print:border-black">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <FileText className="h-6 w-6 text-emerald-400 print:hidden" />
                  <DialogTitle className="text-xl font-black tracking-wide text-white print:text-black">
                    ESTADO DE CUENTA
                  </DialogTitle>
                </div>
                <p className="text-xs text-slate-300 font-medium mt-1 print:text-gray-600">
                  Mueblería La Económica • Consulta y reimpresión de movimientos
                </p>
              </div>

              {/* Botones de acción rápida */}
              <div className="flex items-center gap-2 print:hidden">
                {onOpenCobranza && cliente.saldoActual > 0 && (
                  <Button
                    size="sm"
                    onClick={() => {
                      onClose();
                      onOpenCobranza(cliente);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 shadow"
                  >
                    <DollarSign className="h-4 w-4" />
                    Registrar Cobro
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handlePrint}
                  className="bg-white/10 hover:bg-white/20 text-white border-white/30 text-xs font-semibold gap-1.5"
                >
                  <Printer className="h-4 w-4" />
                  Imprimir Estado
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="p-4 sm:p-6 space-y-6 print:p-2">
            {/* Tarjeta de Datos del Cliente */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs">
              <div>
                <span className="text-gray-500 font-semibold block">Cliente:</span>
                <span className="font-bold text-sm text-gray-900">{cliente.nombreCompleto}</span>
                <span className="font-mono text-[11px] text-blue-700 block mt-0.5 font-bold">
                  Código: {cliente.codigoCliente}
                </span>
              </div>

              <div>
                <span className="text-gray-500 font-semibold block">Dirección:</span>
                <span className="font-medium text-gray-800">{cliente.direccionCompleta}</span>
                {cliente.telefono && (
                  <span className="text-gray-600 block mt-0.5 font-medium">
                    Tel: {cliente.telefono}
                  </span>
                )}
              </div>

              <div>
                <span className="text-gray-500 font-semibold block">Plan y Artículo:</span>
                <span className="font-bold text-gray-900">{cliente.descripcionProducto}</span>
                <span className="text-gray-600 block mt-0.5">
                  Día de pago: {getDayName(cliente.diaPago)} ({getPeriodicidadLabel(cliente.periodicidad)})
                </span>
              </div>

              {(cliente as any).sucursal?.nombre && (
                <div>
                  <span className="text-gray-500 font-semibold block">Sucursal de Venta:</span>
                  <span className="font-bold text-blue-900 flex items-center gap-1">
                    <Store className="h-3.5 w-3.5 text-blue-700" />
                    {(cliente as any).sucursal.nombre}
                  </span>
                </div>
              )}

              {cliente.cobradorAsignado?.name && (
                <div>
                  <span className="text-gray-500 font-semibold block">Cobrador de Ruta:</span>
                  <span className="font-semibold text-gray-800">{cliente.cobradorAsignado.name}</span>
                </div>
              )}

              {cliente.vendedor && (
                <div>
                  <span className="text-gray-500 font-semibold block">Vendedor:</span>
                  <span className="font-semibold text-gray-800">{cliente.vendedor}</span>
                </div>
              )}
            </div>

            {/* Resumen Financiero */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                <span className="text-[11px] font-bold text-blue-800 uppercase block">Saldo Actual</span>
                <span className="text-xl font-black text-blue-950 mt-1 block">
                  {formatCurrency(cliente.saldoActual)}
                </span>
                <Badge
                  variant="outline"
                  className={`mt-1 text-[10px] font-bold ${
                    cliente.saldoActual <= 0
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-amber-100 text-amber-800 border-amber-300'
                  }`}
                >
                  {cliente.saldoActual <= 0 ? 'Liquidado' : 'Con Saldo Activo'}
                </Badge>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <span className="text-[11px] font-bold text-emerald-800 uppercase block">Total Abonado</span>
                <span className="text-xl font-black text-emerald-950 mt-1 block">
                  {formatCurrency(totalAbonado)}
                </span>
                <span className="text-[10px] text-emerald-700 mt-1 block font-medium">
                  {pagos.length} pago(s) registrado(s)
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[11px] font-bold text-slate-700 uppercase block">Cuota Regular</span>
                <span className="text-xl font-black text-slate-900 mt-1 block">
                  {formatCurrency(cliente.montoPago)}
                </span>
                <span className="text-[10px] text-slate-500 mt-1 block capitalize">
                  {getPeriodicidadLabel(cliente.periodicidad)}
                </span>
              </div>

              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl">
                <span className="text-[11px] font-bold text-purple-800 uppercase block">Estatus Cuenta</span>
                <span className="text-lg font-black text-purple-950 mt-1 block capitalize">
                  {cliente.statusCuenta || 'Activo'}
                </span>
                <span className="text-[10px] text-purple-700 mt-1 block font-medium">
                  Venta: {formatDate(cliente.fechaVenta)}
                </span>
              </div>
            </div>

            {/* Tabla de Pagos / Abonos Registrados */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                  <Receipt className="h-4 w-4 text-emerald-700" />
                  Historial de Pagos y Abonos
                </h4>
                <span className="text-xs text-gray-500 font-medium">
                  {pagos.length} movimientos
                </span>
              </div>

              {pagos.length === 0 ? (
                <div className="text-center py-8 px-4 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-gray-500 text-xs">
                  Aún no se han registrado abonos para esta cuenta.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 text-gray-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Fecha</th>
                        <th className="py-2.5 px-3">Recibo / Folio</th>
                        <th className="py-2.5 px-3">Concepto</th>
                        <th className="py-2.5 px-3">Registró</th>
                        <th className="py-2.5 px-3 text-right">Abono</th>
                        <th className="py-2.5 px-3 text-right">Saldo Restante</th>
                        <th className="py-2.5 px-3 text-center print:hidden">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {pagos.map((pago: any) => (
                        <tr key={pago.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2.5 px-3 text-gray-800 whitespace-nowrap font-medium">
                            {formatDate(pago.fechaPago || pago.createdAt)}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-blue-900">
                            {pago.numeroRecibo || `#${pago.id.slice(-6).toUpperCase()}`}
                          </td>
                          <td className="py-2.5 px-3 text-gray-700">
                            {pago.concepto || 'Abono'}
                          </td>
                          <td className="py-2.5 px-3 text-gray-600">
                            {pago.cobrador?.name || 'Vendedor / Cobrador'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-black text-emerald-700">
                            {formatCurrency(pago.monto)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-gray-900">
                            {pago.saldoNuevo !== undefined ? formatCurrency(pago.saldoNuevo) : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-center print:hidden">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleReimprimirTicket(pago)}
                              className="h-7 px-2 text-xs text-blue-700 hover:text-blue-900 hover:bg-blue-50 font-semibold gap-1"
                              title="Reimprimir ticket térmico"
                            >
                              <Printer className="h-3 w-3" />
                              Reimprimir
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Pie de página membretado para impresión */}
            <div className="pt-4 border-t border-slate-200 text-center text-xs text-gray-500 space-y-1">
              <p className="font-semibold text-gray-700">Mueblería La Económica • Calidad y Confianza para su Hogar</p>
              <p>Conserve este estado de cuenta para cualquier aclaración o garantía.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal para Reimprimir el Ticket seleccionado */}
      {showTicketModal && (
        <TicketModal
          ticketData={ticketData}
          isOpen={showTicketModal}
          onClose={() => setShowTicketModal(false)}
        />
      )}
    </>
  );
}
