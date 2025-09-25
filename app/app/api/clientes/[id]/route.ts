
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const cliente = await prisma.cliente.findUnique({
      where: { id: params.id },
      include: {
        cobradorAsignado: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        pagos: {
          orderBy: { fechaPago: 'desc' },
          take: 10,
          include: {
            cobrador: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!cliente) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    const userRole = (session.user as any).role;
    if (userRole === 'cobrador' && cliente.cobradorAsignadoId !== (session.user as any).id) {
      return NextResponse.json({ error: 'No tienes acceso a este cliente' }, { status: 403 });
    }

    return NextResponse.json(cliente);
  } catch (error) {
    console.error('Error al obtener cliente:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (!['admin', 'gestor_cobranza'].includes(userRole)) {
      return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
    }

    const body = await request.json();
    const {
      nombreCompleto,
      telefono,
      vendedor,
      cobradorAsignadoId,
      statusCuenta,
      direccionCompleta,
      descripcionProducto,
      diaPago,
      montoPago,
      periodicidad,
      saldoActual,
      importe1,
      importe2,
      importe3,
      importe4,
      fechaVenta,
    } = body;

    const cliente = await prisma.cliente.update({
      where: { id: params.id },
      data: {
        nombreCompleto,
        telefono,
        vendedor,
        cobradorAsignadoId,
        statusCuenta,
        direccionCompleta,
        descripcionProducto,
        diaPago,
        montoPago: montoPago ? parseFloat(montoPago) : undefined,
        periodicidad,
        saldoActual: saldoActual ? parseFloat(saldoActual) : undefined,
        importe1: importe1 ? parseFloat(importe1) : null,
        importe2: importe2 ? parseFloat(importe2) : null,
        importe3: importe3 ? parseFloat(importe3) : null,
        importe4: importe4 ? parseFloat(importe4) : null,
        fechaVenta: fechaVenta ? new Date(fechaVenta) : undefined,
      },
      include: {
        cobradorAsignado: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(cliente);
  } catch (error) {
    console.error('Error al actualizar cliente:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Solo administradores pueden eliminar clientes' }, { status: 403 });
    }

    await prisma.cliente.update({
      where: { id: params.id },
      data: { statusCuenta: 'inactivo' },
    });

    return NextResponse.json({ message: 'Cliente desactivado exitosamente' });
  } catch (error) {
    console.error('Error al desactivar cliente:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
