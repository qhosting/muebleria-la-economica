import { TicketData } from './bluetooth-printer';
import { formatCurrency } from './utils';

/**
 * Imprime directamente un ticket en cualquier impresora del sistema
 * (Impresoras USB POS térmicas de 58mm y 80mm como Epson, Xprinter, POS-58, POS-80 o láser)
 * mediante un iframe aislado con CSS @page exacto para rollos térmicos sin márgenes.
 */
export function imprimirTicketTermicoUSB(
  ticketData: TicketData,
  anchoPapel: '58mm' | '80mm' = '80mm'
): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }

    try {
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
        resolve(true);
        return;
      }

      let fechaFormatted = '';
      try {
        fechaFormatted = new Date(ticketData.pago.fechaPago).toLocaleString('es-MX', {
          dateStyle: 'short',
          timeStyle: 'short',
        });
      } catch {
        fechaFormatted = ticketData.pago.fechaPago;
      }

      const anchoCss = anchoPapel === '58mm' ? '54mm' : '72mm';
      const fontSize = anchoPapel === '58mm' ? '11px' : '12px';

      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Recibo #${ticketData.numeroRecibo || ''}</title>
          <style>
            @page {
              margin: 0;
              size: ${anchoPapel === '58mm' ? '58mm auto' : '80mm auto'};
            }
            * {
              box-sizing: border-box;
            }
            body {
              margin: 0;
              padding: ${anchoPapel === '58mm' ? '4px 2px' : '6px 4px'};
              width: ${anchoCss};
              font-family: 'Courier New', Courier, monospace;
              font-size: ${fontSize};
              line-height: 1.25;
              color: #000;
              background: #fff;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .bold { font-weight: bold; }
            .border-b { border-bottom: 1px dashed #000; padding-bottom: 5px; margin-bottom: 5px; }
            .border-t { border-top: 1px dashed #000; padding-top: 5px; margin-top: 5px; }
            .flex { display: flex; justify-content: space-between; align-items: flex-start; }
            .title { font-size: 13px; font-weight: bold; letter-spacing: 0.5px; }
            .total { font-size: 14px; font-weight: 900; }
            @media print {
              body { width: 100%; margin: 0; padding: 2px; }
            }
          </style>
        </head>
        <body>
          <div class="text-center border-b">
            <div class="title">${ticketData.empresa.nombre}</div>
            ${ticketData.empresa.direccion ? `<div style="font-size:10px">${ticketData.empresa.direccion}</div>` : ''}
            ${ticketData.empresa.telefono ? `<div style="font-size:10px">Tel: ${ticketData.empresa.telefono}</div>` : ''}
            <div class="bold" style="margin-top:4px; font-size:11px">COMPROBANTE DE PAGO</div>
            <div class="bold" style="font-size:12px">RECIBO #${ticketData.numeroRecibo || 'N/A'}</div>
          </div>

          <div class="border-b" style="font-size:11px">
            <div><span class="bold">Fecha:</span> ${fechaFormatted}</div>
            <div><span class="bold">Cliente:</span> ${ticketData.cliente.nombreCompleto}</div>
            ${ticketData.cliente.codigoCliente ? `<div><span class="bold">Código:</span> ${ticketData.cliente.codigoCliente}</div>` : ''}
            ${ticketData.cliente.descripcionProducto ? `<div><span class="bold">Artículo:</span> ${ticketData.cliente.descripcionProducto}</div>` : ''}
            ${ticketData.cliente.direccion ? `<div><span class="bold">Dirección:</span> ${ticketData.cliente.direccion}</div>` : ''}
            ${ticketData.cliente.telefono ? `<div><span class="bold">Teléfono:</span> ${ticketData.cliente.telefono}</div>` : ''}
            <div><span class="bold">Cobrador/Vendedor:</span> ${ticketData.cobrador.nombre}</div>
          </div>

          <div class="border-b" style="font-size:11px">
            <div class="flex"><span class="bold">Concepto:</span> <span>${ticketData.pago.concepto || 'Pago de cuota'}</span></div>
            <div class="flex"><span>Tipo:</span> <span style="text-transform:capitalize">${ticketData.pago.tipoPago}</span></div>
            <div class="flex"><span>Método:</span> <span>${ticketData.pago.metodoPago || 'Efectivo'}</span></div>
            <div class="flex border-t total" style="padding-top:4px">
              <span>TOTAL COBRADO:</span>
              <span>${formatCurrency(ticketData.pago.monto)}</span>
            </div>
            ${ticketData.pago.montoMoratorio ? `<div class="flex" style="font-size:10px; color:#555"><span>Moratorio:</span> <span>${formatCurrency(ticketData.pago.montoMoratorio)}</span></div>` : ''}
          </div>

          <div class="border-b" style="font-size:11px">
            <div class="flex"><span>Saldo Anterior:</span> <span>${formatCurrency(ticketData.saldos.anterior)}</span></div>
            <div class="flex bold"><span>Saldo Nuevo:</span> <span>${formatCurrency(ticketData.saldos.nuevo)}</span></div>
          </div>

          <div class="text-center" style="font-size:10px; margin-top:6px; padding-bottom:12px">
            <div class="bold">¡GRACIAS POR SU PAGO!</div>
            <div>Mueblería La Económica</div>
            <div>Conserve este comprobante para cualquier aclaración</div>
          </div>
        </body>
        </html>
      `);
      doc.close();

      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        resolve(true);
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 3000);
      }, 250);
    } catch (err) {
      console.error('Error al imprimir por USB/PC:', err);
      resolve(false);
    }
  });
}
