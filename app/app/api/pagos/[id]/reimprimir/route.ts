export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { SUCURSALES_SISTEMA, SUCURSAL_SAN_LUCAS } from '@/lib/catalogo-kiosco';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const pagoId = params.id;

    // Obtener el pago con cliente, cobrador y sus relaciones de sucursal
    const pago = await prisma.pago.findUnique({
      where: { id: pagoId },
      include: {
        cliente: {
          include: {
            sucursal: true,
            ventas: {
              where: {
                sucursalId: { not: null },
              },
              include: {
                sucursal: true,
              },
              orderBy: { fecha: 'desc' },
              take: 1,
            },
          },
        },
        cobrador: {
          include: {
            sucursal: true,
          },
        },
      },
    });

    if (!pago) {
      return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 });
    }

    // Actualizar estado de ticketImpreso si no estaba marcado
    if (!pago.ticketImpreso) {
      await prisma.pago.update({
        where: { id: pagoId },
        data: { ticketImpreso: true },
      });
    }

    // 1. Obtener configuración general del sistema si existe (guardada desde /dashboard/configuracion)
    const configSistema = await prisma.configuracionSistema.findUnique({
      where: { clave: 'sistema' },
    });
    const configEmpresa = configSistema?.empresa as {
      nombre?: string;
      direccion?: string;
      telefono?: string;
      email?: string;
    } | undefined;

    // 2. Obtener sucursal del usuario en sesión activa si existe
    const sessionUserId = (session.user as any)?.id;
    const sessionUser = sessionUserId
      ? await prisma.user.findUnique({
          where: { id: sessionUserId },
          include: { sucursal: true },
        })
      : null;

    // 3. Obtener primera sucursal activa en base de datos como respaldo
    const sucursalFallbackDB = await prisma.sucursal.findFirst({
      where: { isActive: true, esBodega: false },
      orderBy: { createdAt: 'asc' },
    });

    // 4. Determinar la sucursal más específica para este cobro:
    // Prioridad:
    // a) Sucursal asignada directamente al cliente
    // b) Sucursal de la venta más reciente del cliente
    // c) Sucursal del cobrador/vendedor que registró el cobro
    // d) Sucursal del usuario actual que está reimprimiendo
    // e) Primera sucursal activa de la BD
    const sucursalCandidata =
      pago.cliente?.sucursal ||
      pago.cliente?.ventas?.[0]?.sucursal ||
      pago.cobrador?.sucursal ||
      sessionUser?.sucursal ||
      sucursalFallbackDB ||
      null;

    // 5. Vincular con catálogo maestro para ciudad y metadatos
    const sucursalCatalogo = sucursalCandidata
      ? SUCURSALES_SISTEMA.find(
          s =>
            s.id === sucursalCandidata.id ||
            s.nombre.toUpperCase().trim() === sucursalCandidata.nombre?.toUpperCase().trim()
        )
      : null;

    // 6. Dirección dinámica
    let direccionFinal =
      sucursalCandidata?.direccion?.trim() ||
      configEmpresa?.direccion?.trim() ||
      '';

    if (!direccionFinal && sucursalCatalogo) {
      direccionFinal = sucursalCatalogo.direccion
        ? (sucursalCatalogo.ciudad ? `${sucursalCatalogo.direccion}, ${sucursalCatalogo.ciudad}` : sucursalCatalogo.direccion)
        : (sucursalCatalogo.ciudad || '');
    }

    if (!direccionFinal) {
      direccionFinal = `${SUCURSAL_SAN_LUCAS.direccion}, ${SUCURSAL_SAN_LUCAS.ciudad}`;
    }

    // 7. Teléfono dinámico
    let telefonoFinal =
      sucursalCandidata?.telefono?.trim() ||
      configEmpresa?.telefono?.trim() ||
      sucursalCatalogo?.telefono?.trim() ||
      SUCURSAL_SAN_LUCAS.telefono ||
      '';

    // Limpiar prefijo 'Tel:' para que no se duplique al formatear
    telefonoFinal = telefonoFinal.replace(/^tel[:.]?\s*/i, '').trim();

    // 8. Nombre de la empresa / marca
    const sucursalNombre = (sucursalCandidata?.nombre || sucursalCatalogo?.nombre || '').toUpperCase().trim();
    const esHogarYEstilo = sucursalNombre.includes('HOGAR Y ESTILO');
    const baseNombre = esHogarYEstilo
      ? 'HOGAR Y ESTILO'
      : (configEmpresa?.nombre?.trim() || 'MUEBLERÍA LA ECONÓMICA');

    const nombreEmpresa = esHogarYEstilo
      ? 'HOGAR Y ESTILO'
      : (baseNombre.toUpperCase().includes('ECONÓMICA') || baseNombre.toUpperCase().includes('ECONOMICA'))
        ? 'MUEBLERÍA LA ECONÓMICA'
        : baseNombre;

    // Estructurar TicketData completo para el cliente con información dinámica
    const ticketData = {
      numeroRecibo: pago.numeroRecibo || `REC-${pago.id.slice(-8).toUpperCase()}`,
      cliente: {
        nombreCompleto: pago.cliente.nombreCompleto,
        codigoCliente: pago.cliente.codigoCliente || undefined,
        descripcionProducto: pago.cliente.descripcionProducto || undefined,
        telefono: pago.cliente.telefono || undefined,
        direccion: pago.cliente.direccionCompleta || '',
        diaPago: pago.cliente.diaPago ? pago.cliente.diaPago.toString() : '',
      },
      cobrador: {
        nombre: pago.cobrador.name || 'Cobrador',
        id: pago.cobradorId,
      },
      pago: {
        monto: Number(pago.monto),
        tipoPago: pago.tipoPago,
        metodoPago: pago.metodoPago || 'efectivo',
        concepto: pago.concepto || 'Pago de cuota',
        fechaPago: pago.fechaPago.toISOString(),
      },
      saldos: {
        anterior: Number(pago.saldoAnterior),
        nuevo: Number(pago.saldoNuevo),
      },
      empresa: {
        nombre: nombreEmpresa,
        direccion: direccionFinal,
        telefono: telefonoFinal,
      },
    };

    return NextResponse.json({
      success: true,
      message: 'Ticket preparado para reimpresión',
      ticketData,
    });
  } catch (error: any) {
    console.error('Error al reimprimir ticket:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
