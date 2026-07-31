export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

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

    const pago = await prisma.pago.findUnique({
      where: { id: pagoId },
      include: {
        cliente: true,
        cobrador: true,
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

    // Estructurar TicketData para el cliente
    const ticketData = {
      numeroRecibo: pago.numeroRecibo || `REC-${pago.id.slice(-8)}`,
      cliente: {
        nombreCompleto: pago.cliente.nombreCompleto,
        telefono: pago.cliente.telefono || undefined,
        direccion: pago.cliente.direccionCompleta || '',
        diaPago: pago.cliente.diaPago.toString(),
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
        nombre: 'MUEBLERIA LA ECONOMICA',
        direccion: 'Dirección de la empresa',
        telefono: 'Tel: (555) 123-4567',
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
