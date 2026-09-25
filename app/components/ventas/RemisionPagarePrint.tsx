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
      
      const margin = 6;
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

  // 3 filas compactas para asegurar que quepa exactamente en la mitad de la hoja
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
            margin: 4mm 6mm;
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
        className="w-full max-w-4xl bg-white p-4 md:p-6 shadow-2xl rounded-b-xl border print:shadow-none print:border-none print:p-0 print:max-w-none print:w-full text-gray-900 font-sans"
      >
        {/* ========================================================= */}
        {/* MITAD SUPERIOR: REMISIÓN + PAGARÉ (ORIGINAL TIENDA)      */}
        {/* ========================================================= */}
        <div className="border-2 border-blue-900 rounded-lg p-2.5 bg-white relative">
          {/* ENCABEZADO SUPERIOR */}
          <div className="flex justify-between items-start border-b border-blue-900 pb-1.5 mb-1.5">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-lg md:text-xl font-extrabold tracking-wider text-blue-900 uppercase font-serif">
                  MUEBLERÍA LA ECONÓMICA
                </h1>
                <span className="bg-blue-900 text-white text-[9px] font-bold px-1.5 py-0.2 rounded uppercase tracking-wider">
                  ORIGINAL TIENDA
                </span>
              </div>
              <p className="text-[10px] font-bold text-blue-800 uppercase tracking-tight">
                SUCURSAL {sucursalActiva.nombre} • Tel. {sucursalActiva.telefono}
              </p>
              <p className="text-[9px] text-gray-600">
                {sucursalActiva.direccion}, {sucursalActiva.ciudad}
              </p>
            </div>

            {/* Cuadro de Folio Remisión */}
            <div className="border-2 border-blue-900 rounded overflow-hidden text-center min-w-[110px] shadow-xs">
              <div className="bg-blue-900 text-white font-bold text-[10px] py-0.5 uppercase tracking-wider">
                REMISIÓN
              </div>
              <div className="py-0.5 px-2 text-base md:text-lg font-black text-red-600 tracking-widest">
                Nº {folioFormateado}
              </div>
            </div>
          </div>

          {/* FECHA Y DATOS DEL CLIENTE EN 1 BLOQUE COMPACTO */}
          <div className="flex flex-wrap items-center justify-between text-[11px] mb-1.5 px-1 bg-gray-50/70 border border-gray-200 rounded p-1">
            <div className="flex items-center gap-1">
              <span className="font-bold text-blue-950">Cliente:</span>
              <span className="font-bold text-gray-900 uppercase">{venta.nombreCliente}</span>
              <span className="text-[10px] text-gray-500 font-medium">({venta.codigoCliente || 'CL-PENDIENTE'})</span>
            </div>
            <div className="text-[10px] font-semibold text-gray-700">
              Aculco, Méx., a <strong className="text-gray-900">{fechaLegal.dia}</strong> de <strong className="text-gray-900 uppercase">{fechaLegal.mes}</strong> de 20<strong className="text-gray-900">{fechaLegal.anio.slice(-2)}</strong>
            </div>
          </div>

          <div className="text-[10px] text-gray-700 px-1 mb-1.5 flex flex-wrap justify-between border-b pb-1">
            <span><strong>Dirección:</strong> {venta.direccionCliente || 'Domicilio Conocido'}, {venta.ciudadCliente || 'Aculco'}</span>
            {venta.telefonoCliente && <span><strong>Tel:</strong> {venta.telefonoCliente}</span>}
          </div>

          {/* TABLA DE PRODUCTOS COMPACTA */}
          <div className="relative border border-blue-900 rounded overflow-hidden mb-1.5">
            <table className="w-full text-[10px] relative z-10 border-collapse">
              <thead>
                <tr className="bg-blue-900 text-white font-bold">
                  <th className="py-0.5 px-2 text-center border-r border-blue-800 w-[10%]">CANT.</th>
                  <th className="py-0.5 px-2 text-left border-r border-blue-800 w-[70%]">CONCEPTO</th>
                  <th className="py-0.5 px-2 text-right w-[20%]">IMPORTE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-100">
                {filasCompletas.slice(0, 3).map((item, idx) => (
                  <tr key={idx} className="h-[20px]">
                    <td className="py-0.2 px-2 text-center font-bold text-gray-900 border-r border-blue-100">
                      {item ? item.cantidad : ''}
                    </td>
                    <td className="py-0.2 px-2 font-medium text-gray-900 border-r border-blue-100 uppercase truncate">
                      {item ? item.concepto : ''}
                    </td>
                    <td className="py-0.2 px-2 text-right font-bold text-gray-900">
                      {item ? formatCurrency(item.importe) : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* RESUMEN TOTAL SUPERIOR */}
          <div className="flex justify-between items-center bg-gray-50 border border-blue-900 rounded px-2 py-0.5 mb-1.5 text-[10px]">
            <span className="font-extrabold text-red-600 uppercase text-[9px]">
              SE LE COBRARÁ EL 20% EN CASO DE DEVOLUCIÓN
            </span>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-blue-950">TOTAL:</span>
              <span className="font-black text-sm text-gray-950 bg-white px-2 py-0.2 border border-blue-900 rounded">
                {formatCurrency(venta.total)}
              </span>
            </div>
          </div>

          {/* SECCIÓN DEL PAGARÉ MERCANTIL (ORIGINAL) */}
          <div className="border border-blue-900 rounded p-1.5 bg-blue-50/20">
            <div className="flex justify-between items-center border-b border-blue-900 pb-1 mb-1 text-[10px]">
              <span className="bg-blue-900 text-white font-black px-2 py-0.2 rounded uppercase tracking-wider text-[9px]">
                PAGARÉ
              </span>
              <div className="flex items-center gap-1">
                <span className="font-bold text-blue-950">BUENO POR:</span>
                <span className="font-black text-xs text-blue-900 border-b border-blue-900 px-1">
                  {formatCurrency(montoPagare)}
                </span>
              </div>
            </div>

            <p className="text-[8.5px] leading-tight text-gray-800 text-justify tracking-tight">
              DEBO(EMOS) Y PAGARE(MOS) INCONDICIONALMENTE A LA ORDEN DE <strong className="text-blue-950">MUEBLERÍA LA ECONÓMICA</strong> LA CANTIDAD DE{' '}
              <strong className="text-gray-950">{formatCurrency(montoPagare)} ({importeEnLetras})</strong> EL DÍA{' '}
              <strong>{venta.diaPago ? `DÍA ${venta.diaPago} DE CADA SEMANA/PERÍODO` : 'A SU VENCIMIENTO'}</strong> EN {sucursalActiva.nombre}. VALOR RECIBIDO A MI ENTERA SATISFACCIÓN. EN CASO DE MORA CAUSARÁ INTERÉS DEL <strong>{venta.interesMoratorioMensual || 10}%</strong> MENSUAL.
            </p>

            {venta.tipoVenta === 'credito' && (
              <div className="text-[8px] text-blue-950 flex justify-between gap-1 mt-0.5 font-medium border-t border-blue-100 pt-0.5">
                <span>Enganche: <strong>{formatCurrency(venta.enganche || 0)}</strong></span>
                <span>Saldo: <strong>{formatCurrency(venta.saldoFinanciado || 0)}</strong></span>
                <span>Abono: <strong>{formatCurrency(venta.montoCuota || 0)} ({venta.periodicidad || 'semanal'})</strong></span>
              </div>
            )}

            {/* FIRMA DE CONFORMIDAD */}
            <div className="mt-1 flex justify-end">
              <div className="w-48 text-center">
                {venta.firmaCliente ? (
                  <div className="border-b border-gray-900 pb-0.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={venta.firmaCliente}
                      alt="Firma del cliente"
                      className="max-h-8 mx-auto object-contain"
                    />
                  </div>
                ) : (
                  <div className="border-b border-gray-900 h-6 mb-0.5"></div>
                )}
                <div className="text-[9px] font-extrabold text-gray-900 uppercase tracking-wide">
                  ACEPTO (AMOS) • FIRMA DEL COMPRADOR
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* LÍNEA DE CORTE DIVISORIA                                  */}
        {/* ========================================================= */}
        <div className="relative my-2 flex items-center justify-center text-[9px] text-gray-500 font-bold uppercase tracking-wider">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-dashed border-gray-400"></div>
          </div>
          <span className="relative bg-white px-3 py-0.5 flex items-center gap-1.5 rounded-full border border-gray-300 shadow-xs">
            <Scissors className="h-3 w-3 text-gray-600" />
            LÍNEA DE CORTE • COPIA PARA EL CLIENTE
          </span>
        </div>

        {/* ========================================================= */}
        {/* MITAD INFERIOR: COMPROBANTE + CLÁUSULAS (COPIA CLIENTE)   */}
        {/* ========================================================= */}
        <div className="border-2 border-slate-700 rounded-lg p-2.5 bg-slate-50/40 relative">
          {/* ENCABEZADO INFERIOR */}
          <div className="flex justify-between items-start border-b border-slate-400 pb-1.5 mb-1.5">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-base md:text-lg font-extrabold tracking-wider text-slate-900 uppercase font-serif">
                  MUEBLERÍA LA ECONÓMICA
                </h2>
                <span className="bg-emerald-700 text-white text-[9px] font-bold px-1.5 py-0.2 rounded uppercase tracking-wider">
                  COPIA CLIENTE
                </span>
              </div>
              <p className="text-[9px] font-semibold text-slate-700 uppercase">
                COMPROBANTE DE COMPRA Y CONTRATO DE CRÉDITO • SUCURSAL {sucursalActiva.nombre}
              </p>
            </div>

            <div className="text-right">
              <div className="text-xs font-black text-slate-900">
                REM. Nº {folioFormateado}
              </div>
              <div className="text-[9px] text-slate-600 font-medium">
                Fecha: {fechaLegal.dia}/{fechaLegal.mes}/{fechaLegal.anio}
              </div>
            </div>
          </div>

          {/* RESUMEN DE PLAN DE PAGOS DEL CLIENTE */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-2 text-center text-[10px]">
            <div className="bg-white border rounded p-1">
              <div className="text-[8px] text-gray-500 font-bold uppercase">Total Venta</div>
              <div className="font-extrabold text-gray-900">{formatCurrency(venta.total)}</div>
            </div>
            <div className="bg-white border rounded p-1">
              <div className="text-[8px] text-gray-500 font-bold uppercase">Enganche</div>
              <div className="font-extrabold text-blue-700">{formatCurrency(venta.enganche || 0)}</div>
            </div>
            <div className="bg-white border rounded p-1">
              <div className="text-[8px] text-gray-500 font-bold uppercase">Saldo a Pagar</div>
              <div className="font-extrabold text-amber-700">{formatCurrency(montoPagare)}</div>
            </div>
            <div className="bg-white border rounded p-1">
              <div className="text-[8px] text-gray-500 font-bold uppercase">Abono Semanal</div>
              <div className="font-extrabold text-emerald-700">
                {formatCurrency(venta.montoCuota || 0)}
              </div>
            </div>
          </div>

          {/* ARTÍCULOS AMPARADOS */}
          <div className="text-[9px] bg-white border rounded px-2 py-1 mb-2 text-gray-800">
            <strong>Artículos: </strong>
            {venta.detalles && venta.detalles.length > 0 ? (
              venta.detalles.map((d, i) => `${d.cantidad}x ${d.concepto}`).join(' • ')
            ) : (
              'Artículos detallados en remisión original'
            )}
          </div>

          {/* CLÁUSULAS Y CONDICIONES GENERALES DE CRÉDITO Y GARANTÍA */}
          <div className="border border-slate-300 rounded p-2 bg-white mb-1.5">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-900 border-b pb-1 mb-1 uppercase tracking-wide">
              <ShieldCheck className="h-3.5 w-3.5 text-blue-700" />
              TÉRMINOS, CONDICIONES Y CLÁUSULAS DE GARANTÍA
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-3 gap-y-1 text-[8.5px] leading-tight text-gray-800 text-justify">
              <div>
                <p>
                  <strong>1. PAGO Y RECIBOS OFICIALES:</strong> El comprador se compromete a cubrir sus abonos semanales puntualmente los días <strong>{venta.diaPago ? `DÍA ${venta.diaPago}` : 'pactados'}</strong> con el gestor de cobranza autorizado en su domicilio o en sucursal. <strong>Exija siempre su ticket/recibo impreso</strong> como único comprobante válido de pago.
                </p>
                <p className="mt-1">
                  <strong>2. GARANTÍA DE MUEBLES:</strong> Toda la mercancía cuenta con garantía contra defectos de fabricación. La garantía no aplica en averías por mal uso, negligencia, sobrepeso, humedad o agentes externos no atribuibles a la calidad del mueble.
                </p>
                <p className="mt-1">
                  <strong>3. RESERVA DE DOMINIO:</strong> La propiedad de los artículos se transfiere formalmente al comprador al liquidar el 100% del saldo financiado.
                </p>
              </div>

              <div>
                <p>
                  <strong>4. DEVOLUCIÓN O CANCELACIÓN:</strong> En caso de cancelación voluntaria o devolución de la mercancía por causas ajenas a la mueblería, aplicará una penalización del <strong>20% del valor total</strong> por concepto de gastos administrativos, logística y depreciación del bien.
                </p>
                <p className="mt-1">
                  <strong>5. MORA Y VENCIMIENTO:</strong> Todo pago no cubierto en el plazo estipulado causará el interés moratorio del <strong>{venta.interesMoratorioMensual || 10}% mensual</strong> pactado en el pagaré mercantil original.
                </p>
                <p className="mt-1">
                  <strong>6. ATENCIÓN Y ACLARACIONES:</strong> Para aclaraciones, soporte o reportes comuníquese al teléfono <strong>{sucursalActiva.telefono}</strong> o en <strong>{sucursalActiva.direccion}</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* PIE DE COPIA CLIENTE */}
          <div className="flex justify-between items-center text-[8.5px] text-gray-600 px-1">
            <span className="font-semibold text-emerald-800">
              ✓ ¡Gracias por su compra! Conserve este comprobante como póliza de garantía.
            </span>
            <span>Mueblería La Económica • Atención al Cliente</span>
          </div>
        </div>
      </div>
    </div>
  );
}
