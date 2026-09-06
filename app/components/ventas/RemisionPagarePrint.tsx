'use client';

import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Printer, Download, X, CheckCircle, FileText } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { numeroALetras, formatearFechaLegal } from '@/lib/catalogo-kiosco';

interface ItemVenta {
  cantidad: number;
  concepto: string;
  precioUnitario: number;
  importe: number;
}

interface RemisionPagarePrintProps {
  venta: {
    folio: number | string;
    fecha?: Date | string;
    tipoVenta?: string;
    nombreCliente: string;
    direccionCliente?: string;
    ciudadCliente?: string;
    telefonoCliente?: string;
    total: number;
    enganche?: number;
    saldoFinanciado?: number;
    periodicidad?: string;
    montoCuota?: number;
    plazoSemanas?: number;
    diaPago?: string;
    interesMoratorioMensual?: number;
    firmaCliente?: string;
    codigoCliente?: string;
    detalles: ItemVenta[];
  };
  onClose?: () => void;
}

export function RemisionPagarePrint({ venta, onClose }: RemisionPagarePrintProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const fechaObj = venta.fecha ? new Date(venta.fecha) : new Date();
  const fechaLegal = formatearFechaLegal(fechaObj);

  const folioFormateado = venta.folio.toString().padStart(4, '0');
  const montoPagare = venta.tipoVenta === 'credito' && (venta.saldoFinanciado || 0) > 0
    ? Number(venta.saldoFinanciado)
    : Number(venta.total);

  const importeEnLetras = numeroALetras(montoPagare);

  const handlePrint = () => {
    window.print();
  };

  // Mínimo 6 filas para que el formato luzca idéntico a la remisión física
  const filasMinimas = Math.max(6, venta.detalles?.length || 0);
  const filasCompletas = Array.from({ length: filasMinimas }).map((_, i) => {
    return venta.detalles && venta.detalles[i] ? venta.detalles[i] : null;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex flex-col items-center justify-start overflow-y-auto p-4 md:p-6 print:p-0 print:bg-white print:static">
      {/* Barra de Acciones (Oculta al imprimir) */}
      <div className="w-full max-w-4xl bg-white rounded-t-xl p-4 flex flex-wrap items-center justify-between border-b gap-3 shadow-lg print:hidden">
        <div className="flex items-center gap-2">
          <FileText className="h-6 w-6 text-blue-700" />
          <div>
            <h2 className="font-bold text-gray-900 text-lg">
              Remisión y Pagaré Oficial Nº {folioFormateado}
            </h2>
            <p className="text-xs text-gray-500">
              Mueblería La Económica • Documento Mercantil
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handlePrint}
            className="bg-blue-700 hover:bg-blue-800 text-white gap-2 shadow-md"
          >
            <Printer className="h-4 w-4" />
            Imprimir Contrato (Ctrl + P)
          </Button>
          {onClose && (
            <Button variant="outline" onClick={onClose} size="icon">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Contenedor del Documento Físico (Réplica exacta de la imagen 5) */}
      <div
        ref={printRef}
        className="w-full max-w-4xl bg-white p-6 md:p-10 shadow-2xl rounded-b-xl border print:shadow-none print:border-none print:p-4 print:max-w-none print:w-full text-gray-900 font-sans"
        style={{ minHeight: '900px' }}
      >
        {/* ENCABEZADO */}
        <div className="flex justify-between items-start border-b-2 border-blue-900 pb-3 mb-3">
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-wider text-blue-900 uppercase font-serif">
              MUEBLERÍA LA ECONÓMICA
            </h1>
            <p className="text-xs md:text-sm font-semibold text-gray-700 mt-1 uppercase tracking-tight">
              Carretera Aculco-Amealco San Lucas 3er. Cuartel • Tel. 427 273 2216
            </p>
            <p className="text-[11px] text-gray-500 font-medium">
              Aculco, Estado de México
            </p>
          </div>

          {/* Cuadro de Folio Remisión */}
          <div className="border-2 border-blue-900 rounded-md overflow-hidden text-center min-w-[150px] shadow-sm">
            <div className="bg-blue-900 text-white font-bold text-xs py-1 tracking-wider uppercase">
              REMISIÓN
            </div>
            <div className="py-2 px-3 text-xl md:text-2xl font-black text-red-600 tracking-widest">
              Nº {folioFormateado}
            </div>
          </div>
        </div>

        {/* FECHA FORMAL */}
        <div className="text-right text-xs md:text-sm font-semibold text-gray-800 mb-3 tracking-wide">
          Aculco, Edo. de Méx., a{' '}
          <span className="border-b border-gray-900 px-2 font-bold">
            {fechaLegal.dia}
          </span>{' '}
          de{' '}
          <span className="border-b border-gray-900 px-4 font-bold">
            {fechaLegal.mes}
          </span>{' '}
          de 20
          <span className="border-b border-gray-900 px-2 font-bold">
            {fechaLegal.anio.slice(-2)}
          </span>
        </div>

        {/* DATOS DEL CLIENTE */}
        <div className="border-2 border-blue-900 rounded-lg p-2.5 space-y-1.5 mb-4 text-xs md:text-sm bg-blue-50/20">
          <div className="flex items-center">
            <span className="font-bold text-blue-950 w-24">Nombre:</span>
            <span className="flex-1 border-b border-dotted border-gray-600 font-semibold px-2 uppercase text-gray-900">
              {venta.nombreCliente}
            </span>
          </div>
          <div className="flex items-center">
            <span className="font-bold text-blue-950 w-24">Dirección:</span>
            <span className="flex-1 border-b border-dotted border-gray-600 px-2 text-gray-800">
              {venta.direccionCliente || 'Domicilio Conocido'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center flex-1">
              <span className="font-bold text-blue-950 w-24">Ciudad:</span>
              <span className="flex-1 border-b border-dotted border-gray-600 px-2 text-gray-800">
                {venta.ciudadCliente || 'Aculco, Edo. de Méx.'}
              </span>
            </div>
            {venta.telefonoCliente && (
              <div className="flex items-center ml-4">
                <span className="font-bold text-blue-950 mr-2">Teléfono:</span>
                <span className="border-b border-dotted border-gray-600 px-2 text-gray-800 font-medium">
                  {venta.telefonoCliente}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* TABLA DE PRODUCTOS CON MARCA DE AGUA */}
        <div className="relative border-2 border-blue-900 rounded-lg overflow-hidden mb-3">
          {/* Marca de agua central idéntica a la remisión */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.06] rotate-[-15deg] z-0">
            <span className="text-5xl md:text-7xl font-black font-serif text-blue-900 uppercase text-center leading-tight">
              MUEBLERÍA<br />LA ECONÓMICA
            </span>
          </div>

          <table className="w-full text-xs md:text-sm relative z-10 border-collapse">
            <thead>
              <tr className="bg-blue-900 text-white font-bold tracking-wide">
                <th className="py-1.5 px-3 text-center border-r border-blue-800 w-[12%]">
                  CANT.
                </th>
                <th className="py-1.5 px-4 text-center border-r border-blue-800 w-[68%]">
                  CONCEPTO
                </th>
                <th className="py-1.5 px-4 text-center w-[20%]">
                  IMPORTE
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-200">
              {filasCompletas.map((item, idx) => (
                <tr key={idx} className="min-h-[32px] h-[34px]">
                  <td className="py-1 px-3 text-center font-bold text-gray-900 border-r border-blue-200">
                    {item ? item.cantidad : ''}
                  </td>
                  <td className="py-1 px-4 font-medium text-gray-900 border-r border-blue-200 uppercase">
                    {item ? item.concepto : ''}
                  </td>
                  <td className="py-1 px-4 text-right font-bold text-gray-900">
                    {item ? formatCurrency(item.importe) : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PIE DE TABLA: LEYENDA DEL 20% Y TOTAL */}
        <div className="flex flex-col sm:flex-row justify-between items-center border-2 border-blue-900 rounded-lg p-2.5 mb-4 bg-gray-50 gap-2">
          <div className="text-xs md:text-sm font-extrabold text-red-600 tracking-wide uppercase text-center sm:text-left">
            SE LE COBRARÁ EL 20% EN CASO DE DEVOLUCIÓN
          </div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-blue-950 text-base md:text-lg">
              TOTAL $
            </span>
            <div className="bg-white border-2 border-blue-900 rounded-md px-4 py-1 text-lg md:text-xl font-black text-gray-950 tracking-wider">
              {formatCurrency(venta.total)}
            </div>
          </div>
        </div>

        {/* SECCIÓN DEL PAGARÉ MERCANTIL */}
        <div className="border-2 border-blue-900 rounded-lg p-3 md:p-4 bg-white shadow-xs">
          {/* Barra superior de pagaré */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-blue-900 pb-2 mb-2.5">
            <div className="text-xs md:text-sm font-bold text-gray-900">
              No. DE CLIENTE:{' '}
              <span className="font-black text-blue-900 px-2 py-0.5 bg-blue-100 rounded border border-blue-300">
                {venta.codigoCliente || 'CL-PENDIENTE'}
              </span>
            </div>

            <div className="bg-blue-900 text-white font-black text-xs md:text-sm px-4 py-1 rounded tracking-widest uppercase">
              PAGARÉ
            </div>

            <div className="flex items-center gap-1.5 text-xs md:text-sm">
              <span className="font-bold text-blue-950">BUENO POR:</span>
              <span className="font-black text-base text-blue-900 border-b-2 border-blue-900 px-2">
                {formatCurrency(montoPagare)}
              </span>
            </div>
          </div>

          {/* CUERPO LEGAL DEL PAGARÉ */}
          <div className="text-[11px] md:text-xs leading-relaxed text-gray-800 text-justify space-y-2">
            <p>
              A <span className="font-bold border-b border-gray-600 px-2">{fechaLegal.dia}</span> DE{' '}
              <span className="font-bold border-b border-gray-600 px-3 uppercase">{fechaLegal.mes}</span> DEL 20
              <span className="font-bold border-b border-gray-600 px-2">{fechaLegal.anio.slice(-2)}</span>.
            </p>
            <p className="tracking-tight">
              DEBO(EMOS) Y PAGARE(MOS) INCONDICIONALMENTE A LA ORDEN DE{' '}
              <strong className="text-blue-950">MUEBLERÍA LA ECONÓMICA</strong> LA CANTIDAD DE{' '}
              <strong className="border-b border-gray-800 px-1 text-gray-950 uppercase">
                {formatCurrency(montoPagare)} ({importeEnLetras})
              </strong>{' '}
              EL DÍA{' '}
              <strong className="border-b border-gray-800 px-2">
                {venta.diaPago ? `DÍA ${venta.diaPago} DE CADA SEMANA/PERÍODO` : 'A SU VENCIMIENTO'}
              </strong>{' '}
              EN EL DOMICILIO SEÑALADO O EN LA MATRIZ DE ACULCO, EDO. DE MÉX.
            </p>
            <p className="tracking-tight">
              VALOR DE LA MERCANCÍA RECIBIDA A MI (NUESTRA) ENTERA SATISFACCIÓN. ESTE DOCUMENTO CAUSARÁ
              INTERÉS MORATORIO DEL{' '}
              <strong className="border-b border-gray-800 px-2 text-red-600 font-bold">
                {venta.interesMoratorioMensual || 10}%
              </strong>{' '}
              MENSUAL SI NO ES LIQUIDADO A SU VENCIMIENTO.
            </p>

            {/* RESUMEN DEL PLAN DE CRÉDITO SI APLICA */}
            {venta.tipoVenta === 'credito' && (
              <div className="bg-blue-50 border border-blue-200 rounded p-2 text-[10px] md:text-[11px] text-blue-950 flex flex-wrap justify-between gap-2 mt-1 print:bg-transparent print:border-gray-300">
                <span>Enganche: <strong>{formatCurrency(venta.enganche || 0)}</strong></span>
                <span>Saldo a Financiar: <strong>{formatCurrency(venta.saldoFinanciado || 0)}</strong></span>
                <span>Periodicidad: <strong className="capitalize">{venta.periodicidad || 'semanal'}</strong></span>
                <span>Abono / Cuota: <strong>{formatCurrency(venta.montoCuota || 0)}</strong></span>
              </div>
            )}
          </div>

          {/* FIRMA DE CONFORMIDAD */}
          <div className="mt-6 pt-3 flex justify-end">
            <div className="w-64 text-center">
              {venta.firmaCliente ? (
                <div className="mb-1 border-b border-gray-900 pb-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={venta.firmaCliente}
                    alt="Firma del cliente"
                    className="max-h-16 mx-auto object-contain"
                  />
                </div>
              ) : (
                <div className="border-b-2 border-gray-900 h-14 mb-1"></div>
              )}
              <div className="text-xs md:text-sm font-extrabold text-gray-900 tracking-wider uppercase">
                ACEPTO (AMOS)
              </div>
              <div className="text-[10px] text-gray-600 uppercase font-medium">
                Firma del Deudor / Comprador
              </div>
            </div>
          </div>
        </div>

        {/* PIE DE PÁGINA IMPRESO */}
        <div className="mt-3 text-center text-[10px] text-gray-500 font-medium">
          Mueblería La Económica • Sistema Integral de Kiosco y Crédito
        </div>
      </div>
    </div>
  );
}
