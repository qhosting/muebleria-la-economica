export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { asegurarSucursalesYUsuarios, VENDEDORES_SUCURSAL_SISTEMA } from '@/lib/ensure-sucursales-usuarios';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Permisos insuficientes. Solo administradores.' }, { status: 403 });
    }

    const resultado = await asegurarSucursalesYUsuarios(true);

    return NextResponse.json({
      success: true,
      mensaje: 'Sucursales, usuarios vendedores y existencias de catálogo verificados y sincronizados correctamente.',
      cuentasOficiales: VENDEDORES_SUCURSAL_SISTEMA.map(v => ({
        email: v.email,
        nombre: v.name,
        sucursal: v.sucursalNombre,
        passwordPorDefecto: v.passwordDefecto,
        rol: 'vendedor'
      })),
      detalles: resultado
    });
  } catch (error: any) {
    console.error('Error en /api/admin/setup-sucursales:', error);
    return NextResponse.json(
      { error: error?.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
