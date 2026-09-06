export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Buscar la última venta para obtener el folio más alto
    // El ejemplo físico de la remisión es Nº 0453, por lo que el folio inicial por defecto es 454
    const ultimaVenta = await prisma.venta.findFirst({
      orderBy: { folio: 'desc' },
      select: { folio: true }
    });

    const proximoFolio = ultimaVenta ? ultimaVenta.folio + 1 : 454;

    return NextResponse.json({
      proximoFolio,
      folioFormateado: proximoFolio.toString().padStart(4, '0')
    });
  } catch (error: any) {
    console.error('Error al obtener próximo folio:', error);
    // Si la tabla aún no tiene ventas o hay error, fallback seguro a 454
    return NextResponse.json({ proximoFolio: 454, folioFormateado: '0454' });
  }
}
