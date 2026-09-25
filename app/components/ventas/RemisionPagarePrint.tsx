'use client';

import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Printer, Download, X, FileText, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { numeroALetras, formatearFechaLegal, SUCURSALES_SISTEMA } from '@/lib/catalogo-kiosco';
import { toast } from 'sonner';

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
    sucursalId?: string | number;
    sucursalNombre?: string;
    sucursal?: { nombre?: string };
    detalles: ItemVenta[];
  };
  onClose?: () => void;
}

export function RemisionPagarePrint({ venta, onClose }: RemisionPagarePrintProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const fechaObj = venta.fecha ? new Date(venta.fecha) : new Date();
  const fechaLegal = formatearFechaLegal(fechaObj);

  const folioFormateado = venta.folio.toString().padStart(4, '0');
  const montoPagare = venta.tipoVenta === 'credito' && (venta.saldoFinanciado || 0) > 0
    ? Number(venta.saldoFinanciado)
    : Number(venta.total);

  const importeEnLetras = numeroALetras(montoPagare);

  // Resolver datos de la sucursal de emisión
  const sucursalActiva = SUCURSALES_SISTEMA.find(s =>
    s.id === venta.sucursalId ||
    s.nombre.toUpperCase() === (venta.sucursalNombre || venta.sucursal?.nombre || '').toUpperCase()
  ) || SUCURSALES_SISTEMA[0];

  // Impresión aislada: crea un iframe independiente para que NUNCA se imprima el dashboard ni el sidebar
  const handlePrint = () => {
    if (!printRef.current) {
      window.print();
      return;
    }

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      window.print();
      return;
    }

    // Copiar estilos de la página para preservar Tailwind y tipografía
    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(el => el.outerHTML)
      .join('\n');

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <title>Remisión y Pagaré Nº ${folioFormateado} - Mueblería La Económica</title>
          <meta charset="utf-8" />
          ${styles}
          <style>
            @page {
              size: letter portrait;
              margin: 6mm 8mm;
            }
            html, body {
              background: #ffffff !important;
              color: #111827 !important;
              margin: 0 !important;
              padding: 0 !important;
              width: 100% !important;
              font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .remision-isolated-wrapper {
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 auto !important;
              padding: 0 !important;
              box-shadow: none !important;
              border: none !important;
            }
          </style>
        </head>
        <body>
          <div class="remision-isolated-wrapper">
            ${printRef.current.innerHTML}
          </div>
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } finally {
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 2000);
      }
    }, 300);
  };

  // Descarga directa a archivo PDF
  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    try {
      setGeneratingPdf(true);
      toast.info('Generando documento PDF...');

      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'letter',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      const margin = 8;
      const printWidth = pageWidth - (margin * 2);
      const printHeight = (canvas.height * printWidth) / canvas.width;

      pdf.addImage(
        imgData,
        'PNG',
        margin,
        margin,
        printWidth,
        Math.min(printHeight, pageHeight - (margin * 2)),
        undefined,
        'FAST'
      );
      
      const safeName = (venta.nombreCliente || 'cliente').trim().replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `Remision_${folioFormateado}_${safeName}.pdf`;
      pdf.save(filename);
      toast.success('Documento PDF descargado exitosamente');
    } catch (error) {
      console.error('Error al generar PDF:', error);
      toast.error('Error al generar archivo PDF');
    } finally {
      setGeneratingPdf(false);
    }
  };

  // Mínimo 6 filas para que el formato luzca idéntico a la remisión física
  const filasMinimas = Math.max(6, venta.detalles?.length || 0);
  const filasCompletas = Array.from({ length: filasMinimas }).map((_, i) => {
    return venta.detalles && venta.detalles[i] ? venta.detalles[i] : null;
  });

  return (
    <div
      id="remision-pagare-overlay"
      className="fixed inset-0 z-50 bg-black/70 flex flex-col items-center justify-start overflow-y-auto p-4 md:p-6 print:p-0 print:bg-white print:static"
    >
      {/* Estilos para impresión nativa con Ctrl+P */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body > *:not(#remision-pagare-overlay) {
            display: none !important;
          }
          #remision-pagare-overlay {
            position: static !important;
            background: transparent !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
          }
          #remision-pagare-documento {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          @page {
            size: letter portrait;
            margin: 6mm 8mm;
          }
        }
      `}} />

      {/* Barra de Acciones (Oculta al imprimir) */}
      <div className="w-full max-w-4xl bg-white rounded-t-xl p-3 md:p-4 flex flex-wrap items-center justify-between border-b gap-3 shadow-lg print:hidden">
        <div className="flex items-center gap-2">
          <FileText className="h-6 w-6 text-blue-700" />
          <div>
            <h2 className="font-bold text-gray-900 text-base md:text-lg">
              Remisión y Pagaré Oficial Nº {folioFormateado}
            </h2>
            <p className="text-xs text-gray-500">
              Mueblería La Económica • Sucursal {sucursalActiva.nombre}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Botón Bajar PDF */}
          <Button
            onClick={handleDownloadPDF}
            disabled={generatingPdf}
            variant="outline"
            className="border-emerald-600 text-emerald-700 hover:bg-emerald-50 gap-2 shadow-xs font-semibold"
          >
            {generatingPdf ? (
              <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
            ) : (
              <Download className="h-4 w-4 text-emerald-600" />
            )}
            Bajar PDF
          </Button>

          {/* Botón Imprimir */}
          <Button
            onClick={handlePrint}
            className="bg-blue-700 hover:bg-blue-800 text-white gap-2 shadow-md font-semibold"
          >
            <Printer className="h-4 w-4" />
            Imprimir Contrato
          </Button>

          {onClose && (
            <Button variant="outline" onClick={onClose} size="icon" title="Cerrar">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Contenedor del Documento Físico (Ajustado para caber en 1 sola hoja carta) */}
      <div
        id="remision-pagare-documento"
        ref={printRef}
        className="w-full max-w-4xl bg-white p-5 md:p-8 shadow-2xl rounded-b-xl border print:shadow-none print:border-none print:p-0 print:max-w-none print:w-full text-gray-900 font-sans"
      >
        {/* ENCABEZADO */}
        <div className="flex justify-between items-start border-b-2 border-blue-900 pb-2 mb-2">
          <div className="flex-1">
            <h1 className="text-xl md:text-2xl font-extrabold tracking-wider text-blue-900 uppercase font-serif">
              MUEBLERÍA LA ECONÓMICA
            </h1>
            <p className="text-xs font-bold text-blue-800 uppercase tracking-wide mt-0.5">
              SUCURSAL {sucursalActiva.nombre}
            </p>
            <p className="text-xs font-semibold text-gray-700 mt-0.5 uppercase tracking-tight">
              {sucursalActiva.direccion} • Tel. {sucursalActiva.telefono}
            </p>
            <p className="text-[10px] text-gray-500 font-medium">
              {sucursalActiva.ciudad}
            </p>
          </div>

          {/* Cuadro de Folio Remisión */}
          <div className="border-2 border-blue-900 rounded-md overflow-hidden text-center min-w-[130px] shadow-xs">
            <div className="bg-blue-900 text-white font-bold text-[11px] py-0.5 tracking-wider uppercase">
              REMISIÓN
            </div>
            <div className="py-1 px-3 text-lg md:text-xl font-black text-red-600 tracking-widest">
              Nº {folioFormateado}
            </div>
          </div>
        </div>

        {/* FECHA FORMAL */}
        <div className="text-right text-xs font-semibold text-gray-800 mb-2 tracking-wide">
          Aculco, Edo. de Méx., a{' '}
          <span className="border-b border-gray-900 px-2 font-bold">
            {fechaLegal.dia}
          </span>{' '}
          de{' '}
          <span className="border-b border-gray-900 px-3 font-bold">
            {fechaLegal.mes}
          </span>{' '}
          de 20
          <span className="border-b border-gray-900 px-2 font-bold">
            {fechaLegal.anio.slice(-2)}
          </span>
        </div>

        {/* DATOS DEL CLIENTE */}
        <div className="border-2 border-blue-900 rounded-lg p-2 space-y-1 mb-2.5 text-xs bg-blue-50/20">
          <div className="flex items-center">
            <span className="font-bold text-blue-950 w-20">Nombre:</span>
            <span className="flex-1 border-b border-dotted border-gray-600 font-semibold px-2 uppercase text-gray-900">
              {venta.nombreCliente}
            </span>
          </div>
          <div className="flex items-center">
            <span className="font-bold text-blue-950 w-20">Dirección:</span>
            <span className="flex-1 border-b border-dotted border-gray-600 px-2 text-gray-800">
              {venta.direccionCliente || 'Domicilio Conocido'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center flex-1">
              <span className="font-bold text-blue-950 w-20">Ciudad:</span>
              <span className="flex-1 border-b border-dotted border-gray-600 px-2 text-gray-800">
                {venta.ciudadCliente || 'Aculco, Edo. de Méx.'}
              </span>
            </div>
            {venta.telefonoCliente && (
              <div className="flex items-center ml-3">
                <span className="font-bold text-blue-950 mr-1.5">Teléfono:</span>
                <span className="border-b border-dotted border-gray-600 px-2 text-gray-800 font-medium">
                  {venta.telefonoCliente}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* TABLA DE PRODUCTOS CON MARCA DE AGUA */}
        <div className="relative border-2 border-blue-900 rounded-lg overflow-hidden mb-2">
          {/* Marca de agua central */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.05] rotate-[-15deg] z-0">
            <span className="text-5xl md:text-6xl font-black font-serif text-blue-900 uppercase text-center leading-tight">
              MUEBLERÍA<br />LA ECONÓMICA
            </span>
          </div>

          <table className="w-full text-xs relative z-10 border-collapse">
            <thead>
              <tr className="bg-blue-900 text-white font-bold tracking-wide">
                <th className="py-1 px-3 text-center border-r border-blue-800 w-[12%]">
                  CANT.
                </th>
                <th className="py-1 px-3 text-center border-r border-blue-800 w-[68%]">
                  CONCEPTO
                </th>
                <th className="py-1 px-3 text-center w-[20%]">
                  IMPORTE
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-200">
              {filasCompletas.map((item, idx) => (
                <tr key={idx} className="h-[26px]">
                  <td className="py-0.5 px-3 text-center font-bold text-gray-900 border-r border-blue-200">
                    {item ? item.cantidad : ''}
                  </td>
                  <td className="py-0.5 px-3 font-medium text-gray-900 border-r border-blue-200 uppercase truncate max-w-md">
                    {item ? item.concepto : ''}
                  </td>
                  <td className="py-0.5 px-3 text-right font-bold text-gray-900">
                    {item ? formatCurrency(item.importe) : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PIE DE TABLA: LEYENDA DEL 20% Y TOTAL */}
        <div className="flex flex-col sm:flex-row justify-between items-center border-2 border-blue-900 rounded-lg p-2 mb-2 bg-gray-50 gap-2">
          <div className="text-xs font-extrabold text-red-600 tracking-wide uppercase text-center sm:text-left">
            SE LE COBRARÁ EL 20% EN CASO DE DEVOLUCIÓN
          </div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-blue-950 text-sm md:text-base">
              TOTAL $
            </span>
            <div className="bg-white border-2 border-blue-900 rounded-md px-3 py-0.5 text-base md:text-lg font-black text-gray-950 tracking-wider">
              {formatCurrency(venta.total)}
            </div>
          </div>
        </div>

        {/* SECCIÓN DEL PAGARÉ MERCANTIL */}
        <div className="border-2 border-blue-900 rounded-lg p-2.5 md:p-3 bg-white shadow-xs">
          {/* Barra superior de pagaré */}
          <div className="flex flex-wrap items-center justify-between gap-1.5 border-b-2 border-blue-900 pb-1.5 mb-1.5">
            <div className="text-xs font-bold text-gray-900">
              No. DE CLIENTE:{' '}
              <span className="font-black text-blue-900 px-1.5 py-0.5 bg-blue-100 rounded border border-blue-300">
                {venta.codigoCliente || 'CL-PENDIENTE'}
              </span>
            </div>

            <div className="bg-blue-900 text-white font-black text-xs px-3 py-0.5 rounded tracking-widest uppercase">
              PAGARÉ
            </div>

            <div className="flex items-center gap-1 text-xs">
              <span className="font-bold text-blue-950">BUENO POR:</span>
              <span className="font-black text-sm text-blue-900 border-b-2 border-blue-900 px-1.5">
                {formatCurrency(montoPagare)}
              </span>
            </div>
          </div>

          {/* CUERPO LEGAL DEL PAGARÉ */}
          <div className="text-[10px] md:text-[11px] leading-snug text-gray-800 text-justify space-y-1">
            <p>
              A <span className="font-bold border-b border-gray-600 px-1.5">{fechaLegal.dia}</span> DE{' '}
              <span className="font-bold border-b border-gray-600 px-2 uppercase">{fechaLegal.mes}</span> DEL 20
              <span className="font-bold border-b border-gray-600 px-1.5">{fechaLegal.anio.slice(-2)}</span>.
            </p>
            <p className="tracking-tight">
              DEBO(EMOS) Y PAGARE(MOS) INCONDICIONALMENTE A LA ORDEN DE{' '}
              <strong className="text-blue-950">MUEBLERÍA LA ECONÓMICA</strong> LA CANTIDAD DE{' '}
              <strong className="border-b border-gray-800 px-1 text-gray-950 uppercase">
                {formatCurrency(montoPagare)} ({importeEnLetras})
              </strong>{' '}
              EL DÍA{' '}
              <strong className="border-b border-gray-800 px-1.5">
                {venta.diaPago ? `DÍA ${venta.diaPago} DE CADA SEMANA/PERÍODO` : 'A SU VENCIMIENTO'}
              </strong>{' '}
              EN EL DOMICILIO SEÑALADO O EN LA SUCURSAL / MATRIZ ({sucursalActiva.nombre} - {sucursalActiva.ciudad}).
            </p>
            <p className="tracking-tight">
              VALOR DE LA MERCANCÍA RECIBIDA A MI (NUESTRA) ENTERA SATISFACCIÓN. ESTE DOCUMENTO CAUSARÁ
              INTERÉS MORATORIO DEL{' '}
              <strong className="border-b border-gray-800 px-1.5 text-red-600 font-bold">
                {venta.interesMoratorioMensual || 10}%
              </strong>{' '}
              MENSUAL SI NO ES LIQUIDADO A SU VENCIMIENTO.
            </p>

            {/* RESUMEN DEL PLAN DE CRÉDITO SI APLICA */}
            {venta.tipoVenta === 'credito' && (
              <div className="bg-blue-50/70 border border-blue-200 rounded p-1.5 text-[9px] md:text-[10px] text-blue-950 flex flex-wrap justify-between gap-1.5 mt-1 print:bg-transparent print:border-gray-300">
                <span>Enganche: <strong>{formatCurrency(venta.enganche || 0)}</strong></span>
                <span>Saldo a Financiar: <strong>{formatCurrency(venta.saldoFinanciado || 0)}</strong></span>
                <span>Periodicidad: <strong className="capitalize">{venta.periodicidad || 'semanal'}</strong></span>
                <span>Abono / Cuota: <strong>{formatCurrency(venta.montoCuota || 0)}</strong></span>
              </div>
            )}
          </div>

          {/* FIRMA DE CONFORMIDAD */}
          <div className="mt-3 pt-1 flex justify-end">
            <div className="w-56 text-center">
              {venta.firmaCliente ? (
                <div className="mb-0.5 border-b border-gray-900 pb-0.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={venta.firmaCliente}
                    alt="Firma del cliente"
                    className="max-h-12 mx-auto object-contain"
                  />
                </div>
              ) : (
                <div className="border-b-2 border-gray-900 h-10 mb-0.5"></div>
              )}
              <div className="text-[11px] md:text-xs font-extrabold text-gray-900 tracking-wider uppercase">
                ACEPTO (AMOS)
              </div>
              <div className="text-[9px] text-gray-600 uppercase font-medium">
                Firma del Deudor / Comprador
              </div>
            </div>
          </div>
        </div>

        {/* PIE DE PÁGINA IMPRESO */}
        <div className="mt-2 text-center text-[9px] text-gray-500 font-medium">
          Mueblería La Económica • Sistema Integral de Kiosco y Crédito
        </div>
      </div>
    </div>
  );
}
