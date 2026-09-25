'use client';

import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Printer, Download, X, FileText, Loader2, Scissors, ShieldCheck, CheckCircle2 } from 'lucide-react';
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
              margin: 4mm 6mm;
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

  // Descarga directa a archivo PDF de alta definición
  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    try {
      setGeneratingPdf(true);
      toast.info('Generando documento PDF en alta definición...');

      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const canvas = await html2canvas(printRef.current, {
        scale: 2.5, // 2.5x para nitidez cristalina en textos
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 950,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'letter',
      });

      const pageWidth = pdf.internal.pageSize.getWidth(); // 215.9 mm
      const pageHeight = pdf.internal.pageSize.getHeight(); // 279.4 mm
      
      const margin = 8;
      const printWidth = pageWidth - (margin * 2); // 199.9 mm
      const printHeight = (canvas.height * printWidth) / canvas.width;

      // Centrar verticalmente si sobra espacio o colocar desde el margen superior
      const offsetY = printHeight < (pageHeight - margin * 2) 
        ? Math.max(margin, (pageHeight - printHeight) / 2)
        : margin;

      pdf.addImage(
        imgData,
        'PNG',
        margin,
        offsetY,
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

  // 3 filas compactas para asegurar proporción áurea de la remisión
  const filasMinimas = Math.max(3, venta.detalles?.length || 0);
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
              Formato de Hoja Completa: Original Tienda (Pagaré) + Copia Cliente (Cláusulas)
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

      {/* Contenedor de Hoja Completa (Mitad Superior: Original Tienda / Mitad Inferior: Copia Cliente) */}
      <div
        id="remision-pagare-documento"
        ref={printRef}
        className="w-full max-w-4xl bg-white p-6 md:p-8 shadow-2xl rounded-b-xl border print:shadow-none print:border-none print:p-0 print:max-w-none print:w-full text-gray-900 font-sans"
      >
        {/* ========================================================= */}
        {/* MITAD SUPERIOR: REMISIÓN + PAGARÉ (ORIGINAL TIENDA)      */}
        {/* ========================================================= */}
        <div className="border-2 border-blue-900 rounded-lg p-3.5 bg-white relative shadow-xs">
          {/* ENCABEZADO SUPERIOR */}
          <div className="flex justify-between items-start border-b-2 border-blue-900 pb-2 mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl md:text-2xl font-black tracking-wide text-blue-900 uppercase font-serif">
                  MUEBLERÍA LA ECONÓMICA
                </h1>
                <span className="bg-blue-900 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                  ORIGINAL TIENDA
                </span>
              </div>
              <p className="text-xs font-bold text-blue-800 uppercase tracking-tight mt-0.5">
                SUCURSAL {sucursalActiva.nombre} • Tel. {sucursalActiva.telefono}
              </p>
              <p className="text-[10px] text-gray-600 mt-0.5">
                {sucursalActiva.direccion}, {sucursalActiva.ciudad}
              </p>
            </div>

            {/* Cuadro de Folio Remisión */}
            <div className="border-2 border-blue-900 rounded-md overflow-hidden text-center min-w-[125px] shadow-xs">
              <div className="bg-blue-900 text-white font-extrabold text-[11px] py-0.5 uppercase tracking-wider">
                REMISIÓN
              </div>
              <div className="py-1 px-3 text-lg md:text-xl font-black text-red-600 tracking-widest">
                Nº {folioFormateado}
              </div>
            </div>
          </div>

          {/* FECHA Y DATOS DEL CLIENTE EN 1 BLOQUE LIMPIO */}
          <div className="border border-blue-200 bg-blue-50/30 rounded-md p-2 mb-2 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-blue-100 pb-1 mb-1">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-blue-950">Cliente:</span>
                <span className="font-extrabold text-gray-900 uppercase">{venta.nombreCliente}</span>
                <span className="text-[11px] text-gray-500 font-semibold">({venta.codigoCliente || 'CL-PENDIENTE'})</span>
              </div>
              <div className="text-[11px] font-medium text-gray-700">
                Aculco, Méx., a <strong className="text-gray-900">{fechaLegal.dia}</strong> de <strong className="text-gray-900 uppercase">{fechaLegal.mes}</strong> de 20<strong className="text-gray-900">{fechaLegal.anio.slice(-2)}</strong>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-gray-700">
              <span><strong>Dirección:</strong> {venta.direccionCliente || 'Domicilio Conocido'}, {venta.ciudadCliente || 'Aculco, Edo. de Méx.'}</span>
              {venta.telefonoCliente && <span><strong>Teléfono:</strong> {venta.telefonoCliente}</span>}
            </div>
          </div>

          {/* TABLA DE PRODUCTOS COMPACTA */}
          <div className="relative border-2 border-blue-900 rounded-md overflow-hidden mb-2">
            <table className="w-full text-xs relative z-10 border-collapse">
              <thead>
                <tr className="bg-blue-900 text-white font-bold">
                  <th className="py-1 px-3 text-center border-r border-blue-800 w-[12%]">CANT.</th>
                  <th className="py-1 px-3 text-left border-r border-blue-800 w-[68%]">CONCEPTO</th>
                  <th className="py-1 px-3 text-right w-[20%]">IMPORTE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-200">
                {filasCompletas.slice(0, 3).map((item, idx) => (
                  <tr key={idx} className="h-[24px]">
                    <td className="py-1 px-3 text-center font-bold text-gray-900 border-r border-blue-200">
                      {item ? item.cantidad : ''}
                    </td>
                    <td className="py-1 px-3 font-medium text-gray-900 border-r border-blue-200 uppercase truncate">
                      {item ? item.concepto : ''}
                    </td>
                    <td className="py-1 px-3 text-right font-bold text-gray-900">
                      {item ? formatCurrency(item.importe) : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* RESUMEN TOTAL SUPERIOR */}
          <div className="flex justify-between items-center bg-gray-50 border-2 border-blue-900 rounded-md px-3 py-1 mb-2 text-xs">
            <span className="font-extrabold text-red-600 uppercase text-[10px] tracking-wide">
              SE LE COBRARÁ EL 20% EN CASO DE DEVOLUCIÓN
            </span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-blue-950 text-sm">TOTAL:</span>
              <span className="font-black text-base text-gray-950 bg-white px-3 py-0.5 border-2 border-blue-900 rounded shadow-xs">
                {formatCurrency(venta.total)}
              </span>
            </div>
          </div>

          {/* SECCIÓN DEL PAGARÉ MERCANTIL (ORIGINAL) */}
          <div className="border-2 border-blue-900 rounded-md p-2.5 bg-blue-50/20">
            <div className="flex justify-between items-center border-b-2 border-blue-900 pb-1.5 mb-1.5 text-xs">
              <span className="bg-blue-900 text-white font-black px-3 py-0.5 rounded uppercase tracking-wider text-[10px]">
                PAGARÉ
              </span>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-blue-950">BUENO POR:</span>
                <span className="font-black text-sm text-blue-900 border-b-2 border-blue-900 px-1.5">
                  {formatCurrency(montoPagare)}
                </span>
              </div>
            </div>

            <p className="text-[10px] leading-relaxed text-gray-800 text-left my-1.5">
              DEBO(EMOS) Y PAGARE(MOS) INCONDICIONALMENTE A LA ORDEN DE <strong className="text-blue-950">MUEBLERÍA LA ECONÓMICA</strong> LA CANTIDAD DE{' '}
              <strong className="text-gray-950">{formatCurrency(montoPagare)} ({importeEnLetras})</strong> EL DÍA{' '}
              <strong className="text-blue-950">{venta.diaPago ? `DÍA ${venta.diaPago} DE CADA SEMANA/PERÍODO` : 'A SU VENCIMIENTO'}</strong> EN {sucursalActiva.nombre}. VALOR RECIBIDO A MI ENTERA SATISFACCIÓN. EN CASO DE MORA CAUSARÁ INTERÉS DEL <strong>{venta.interesMoratorioMensual || 10}%</strong> MENSUAL.
            </p>

            {venta.tipoVenta === 'credito' && (
              <div className="text-[10px] text-blue-950 bg-blue-100/50 border border-blue-200 rounded px-2 py-1 flex flex-wrap justify-between gap-2 mt-1.5 font-medium">
                <span>Enganche: <strong>{formatCurrency(venta.enganche || 0)}</strong></span>
                <span>Saldo Financiado: <strong>{formatCurrency(venta.saldoFinanciado || 0)}</strong></span>
                <span>Abono Semanal: <strong>{formatCurrency(venta.montoCuota || 0)} ({venta.periodicidad || 'semanal'})</strong></span>
              </div>
            )}

            {/* FIRMA DE CONFORMIDAD */}
            <div className="mt-2.5 flex justify-end">
              <div className="w-56 text-center">
                {venta.firmaCliente ? (
                  <div className="border-b border-gray-900 pb-0.5 mb-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={venta.firmaCliente}
                      alt="Firma del cliente"
                      className="max-h-10 mx-auto object-contain"
                    />
                  </div>
                ) : (
                  <div className="border-b-2 border-gray-900 h-8 mb-1"></div>
                )}
                <div className="text-[10px] font-extrabold text-gray-900 uppercase tracking-wide">
                  ACEPTO (AMOS) • FIRMA DEL COMPRADOR
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* LÍNEA DE CORTE DIVISORIA                                  */}
        {/* ========================================================= */}
        <div className="relative my-3 flex items-center justify-center text-[10px] text-gray-500 font-bold uppercase tracking-wider">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t-2 border-dashed border-gray-400"></div>
          </div>
          <span className="relative bg-white px-4 py-1 flex items-center gap-2 rounded-full border border-gray-300 shadow-xs">
            <Scissors className="h-3.5 w-3.5 text-gray-600" />
            LÍNEA DE CORTE • COPIA PARA EL CLIENTE
          </span>
        </div>

        {/* ========================================================= */}
        {/* MITAD INFERIOR: COMPROBANTE + CLÁUSULAS (COPIA CLIENTE)   */}
        {/* ========================================================= */}
        <div className="border-2 border-slate-700 rounded-lg p-3.5 bg-slate-50/40 relative shadow-xs">
          {/* ENCABEZADO INFERIOR */}
          <div className="flex justify-between items-start border-b-2 border-slate-400 pb-2 mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg md:text-xl font-black tracking-wide text-slate-900 uppercase font-serif">
                  MUEBLERÍA LA ECONÓMICA
                </h2>
                <span className="bg-emerald-700 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                  COPIA CLIENTE
                </span>
              </div>
              <p className="text-[10px] font-bold text-slate-700 uppercase mt-0.5">
                COMPROBANTE DE COMPRA Y CONTRATO DE CRÉDITO • SUCURSAL {sucursalActiva.nombre}
              </p>
            </div>

            <div className="text-right">
              <div className="text-sm font-black text-slate-900">
                REM. Nº {folioFormateado}
              </div>
              <div className="text-[10px] text-slate-600 font-semibold">
                Fecha: {fechaLegal.dia}/{fechaLegal.mes}/{fechaLegal.anio}
              </div>
            </div>
          </div>

          {/* RESUMEN DE PLAN DE PAGOS DEL CLIENTE */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2 text-center text-xs">
            <div className="bg-white border rounded-md p-1.5 shadow-2xs">
              <div className="text-[9px] text-gray-500 font-bold uppercase">Total Venta</div>
              <div className="font-extrabold text-sm text-gray-900">{formatCurrency(venta.total)}</div>
            </div>
            <div className="bg-white border rounded-md p-1.5 shadow-2xs">
              <div className="text-[9px] text-gray-500 font-bold uppercase">Enganche</div>
              <div className="font-extrabold text-sm text-blue-700">{formatCurrency(venta.enganche || 0)}</div>
            </div>
            <div className="bg-white border rounded-md p-1.5 shadow-2xs">
              <div className="text-[9px] text-gray-500 font-bold uppercase">Saldo a Pagar</div>
              <div className="font-extrabold text-sm text-amber-700">{formatCurrency(montoPagare)}</div>
            </div>
            <div className="bg-white border rounded-md p-1.5 shadow-2xs">
              <div className="text-[9px] text-gray-500 font-bold uppercase">Abono Semanal</div>
              <div className="font-extrabold text-sm text-emerald-700">
                {formatCurrency(venta.montoCuota || 0)}
              </div>
            </div>
          </div>

          {/* ARTÍCULOS AMPARADOS */}
          <div className="text-[10px] bg-white border rounded-md px-2.5 py-1 mb-2 text-gray-800">
            <strong>Artículos amparados: </strong>
            {venta.detalles && venta.detalles.length > 0 ? (
              venta.detalles.map((d, i) => `${d.cantidad}x ${d.concepto}`).join(' • ')
            ) : (
              'Artículos detallados en remisión original'
            )}
          </div>

          {/* CLÁUSULAS Y CONDICIONES GENERALES DE CRÉDITO Y GARANTÍA */}
          <div className="border border-slate-300 rounded-md p-2.5 bg-white mb-2 shadow-2xs">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 border-b pb-1.5 mb-2 uppercase tracking-wide">
              <ShieldCheck className="h-4 w-4 text-blue-700" />
              TÉRMINOS, CONDICIONES Y CLÁUSULAS DE GARANTÍA
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1.5 text-[9.5px] leading-relaxed text-gray-800 text-left">
              <div>
                <p className="mb-1">
                  <strong>1. PAGOS Y RECIBOS OFICIALES:</strong> El comprador se compromete a cubrir sus abonos puntualmente los días <strong>{venta.diaPago ? `DÍA ${venta.diaPago}` : 'pactados'}</strong> con el gestor de cobranza autorizado en su domicilio o en sucursal. <strong>Exija siempre su ticket/recibo impreso oficial</strong> como único comprobante válido de abono.
                </p>
                <p className="mb-1">
                  <strong>2. GARANTÍA DE MUEBLES:</strong> Toda la mercancía cuenta con garantía contra defectos de fabricación. La garantía no aplica en averías por mal uso, negligencia, sobrepeso, humedad o agentes externos ajenos a la calidad del mueble.
                </p>
                <p>
                  <strong>3. RESERVA DE DOMINIO:</strong> La propiedad formal de los artículos se transfiere en su totalidad al comprador al liquidar el 100% del saldo financiado.
                </p>
              </div>

              <div>
                <p className="mb-1">
                  <strong>4. DEVOLUCIÓN O CANCELACIÓN:</strong> En caso de cancelación voluntaria o devolución de la mercancía por causas ajenas a la mueblería, aplicará una penalización del <strong>20% del valor total</strong> por concepto de gastos administrativos, logística y depreciación del bien.
                </p>
                <p className="mb-1">
                  <strong>5. MORA Y VENCIMIENTO:</strong> Todo pago no cubierto en el plazo estipulado causará el interés moratorio del <strong>{venta.interesMoratorioMensual || 10}% mensual</strong> pactado en el pagaré mercantil original.
                </p>
                <p>
                  <strong>6. ATENCIÓN Y ACLARACIONES:</strong> Para aclaraciones, soporte o reportes comuníquese al teléfono <strong>{sucursalActiva.telefono}</strong> o visítenos en <strong>{sucursalActiva.direccion}</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* PIE DE COPIA CLIENTE */}
          <div className="flex flex-wrap justify-between items-center text-[10px] text-gray-600 px-1 pt-0.5">
            <span className="font-semibold text-emerald-800">
              ✓ ¡Gracias por su preferencia! Conserve este comprobante como póliza de garantía.
            </span>
            <span className="font-medium">Mueblería La Económica • Atención al Cliente</span>
          </div>
        </div>
      </div>
    </div>
  );
}
