
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

    // Verificar permisos: cobrador o vendedor solo pueden ver sus propios clientes asignados/vendidos
    if ((userRole === 'cobrador' || userRole === 'vendedor') && userId !== params.cobradorId) {
      return NextResponse.json({ error: 'No puedes ver clientes de otros cobradores o vendedores' }, { status: 403 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: params.cobradorId },
      select: { name: true, role: true }
    });

    const { searchParams } = new URL(request.url);
    const diaPago = searchParams.get('diaPago');
    const statusCuenta = searchParams.get('statusCuenta') || 'activo';

    const where: any = {
      OR: [
        { cobradorAsignadoId: params.cobradorId },
        ...(targetUser?.name ? [{ vendedor: targetUser.name }] : [])
      ],
      statusCuenta,
    };

    if (diaPago) {
      where.diaPago = diaPago;
    }

    const clientes = await prisma.cliente.findMany({
      where,
      include: {
        pagos: {
          orderBy: { fechaPago: 'desc' },
          take: 1,
        },
      },
      orderBy: { nombreCompleto: 'asc' },
    });

    return NextResponse.json(clientes);
  } catch (error) {
    console.error('Error al obtener clientes del cobrador:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
