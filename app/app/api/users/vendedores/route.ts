export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET - Listar vendedores de mostrador (opcionalmente por sucursal)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sucursalId = searchParams.get('sucursalId');

    const where: any = {
      role: { in: ['vendedor', 'admin'] },
      isActive: true,
    };

    if (sucursalId) {
      where.OR = [
        { sucursalId },
        { sucursalId: null } // También vendedores generales
      ];
    }

    const vendedores = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        sucursalId: true,
        sucursal: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(vendedores);
  } catch (error) {
    console.error('Error al obtener vendedores:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
