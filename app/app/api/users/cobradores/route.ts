export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

import { asegurarSucursalesYUsuarios } from '@/lib/ensure-sucursales-usuarios';

// GET - Listar todos los cobradores / gestores de campo para asignación de cobranza
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
      await asegurarSucursalesYUsuarios();
    } catch (e) {
      console.warn('Aviso asegurando cobradores:', e);
    }

    const cobradores = await prisma.user.findMany({
      where: {
        role: { in: ['cobrador', 'gestor_cobranza', 'vendedor'] },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        codigoGestor: true,
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

    return NextResponse.json(cobradores);
  } catch (error) {
    console.error('Error al obtener cobradores:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
