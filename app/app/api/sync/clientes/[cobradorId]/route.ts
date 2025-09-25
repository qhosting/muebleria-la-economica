
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { cobradorId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    const userId = (session.user as any).id;

    // Verificar permisos
    if (userRole === 'cobrador' && userId !== params.cobradorId) {
      return NextResponse.json({ error: 'No puedes sincronizar clientes de otros cobradores' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const lastSync = searchParams.get('lastSync');

    const where: any = {
      cobradorAsignadoId: params.cobradorId,
      statusCuenta: 'activo',
    };

    // Si hay fecha de última sincronización, solo obtener actualizados después de esa fecha
    if (lastSync) {
      where.updatedAt = {
        gt: new Date(lastSync),
      };
    }

    const clientes = await prisma.cliente.findMany({
      where,
      select: {
        id: true,
        codigoCliente: true,
        fechaVenta: true,
        nombreCompleto: true,
        telefono: true,
        direccionCompleta: true,
        descripcionProducto: true,
        diaPago: true,
        montoPago: true,
        periodicidad: true,
        saldoActual: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({
      clientes,
      total: clientes.length,
      lastSync: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error en sincronización de clientes:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
