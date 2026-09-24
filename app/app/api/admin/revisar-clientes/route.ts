export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

function isNotUpper(str: string | null | undefined): boolean {
  if (!str) return false;
  return str !== str.toUpperCase();
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    const convertir = searchParams.get('convertir') === 'true';

    // Permite sesión de administrador o clave secreta administrativa
    const isAdmin = (session?.user as any)?.role === 'admin';
    const isSecretValid = secret === process.env.NEXTAUTH_SECRET || secret === 'la-economica-admin-2026';

    if (!isAdmin && !isSecretValid) {
      return NextResponse.json({ error: 'No autorizado. Se requiere sesión de administrador o clave secreta.' }, { status: 401 });
    }

    const total = await prisma.cliente.count();

    const clientes = await prisma.cliente.findMany({
      select: {
        id: true,
        codigoCliente: true,
        nombreCompleto: true,
        vendedor: true,
        direccionCompleta: true,
        descripcionProducto: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    const noMayusculas: any[] = [];

    for (const c of clientes) {
      const camposNoMayusculas: string[] = [];
      if (isNotUpper(c.nombreCompleto)) camposNoMayusculas.push(`nombreCompleto: "${c.nombreCompleto}"`);
      if (isNotUpper(c.vendedor)) camposNoMayusculas.push(`vendedor: "${c.vendedor}"`);
      if (isNotUpper(c.direccionCompleta)) camposNoMayusculas.push(`direccionCompleta: "${c.direccionCompleta}"`);
      if (isNotUpper(c.descripcionProducto)) camposNoMayusculas.push(`descripcionProducto: "${c.descripcionProducto}"`);
      if (isNotUpper(c.codigoCliente)) camposNoMayusculas.push(`codigoCliente: "${c.codigoCliente}"`);

      if (camposNoMayusculas.length > 0) {
        noMayusculas.push({
          id: c.id,
          codigoCliente: c.codigoCliente,
          nombreCompleto: c.nombreCompleto,
          camposNoMayusculas
        });
      }
    }

    let actualizados = 0;
    if (convertir && noMayusculas.length > 0) {
      for (const item of noMayusculas) {
        const clienteOriginal = clientes.find(c => c.id === item.id);
        if (clienteOriginal) {
          await prisma.cliente.update({
            where: { id: item.id },
            data: {
              codigoCliente: clienteOriginal.codigoCliente ? clienteOriginal.codigoCliente.toUpperCase() : clienteOriginal.codigoCliente,
              nombreCompleto: clienteOriginal.nombreCompleto ? clienteOriginal.nombreCompleto.toUpperCase() : clienteOriginal.nombreCompleto,
              vendedor: clienteOriginal.vendedor ? clienteOriginal.vendedor.toUpperCase() : null,
              direccionCompleta: clienteOriginal.direccionCompleta ? clienteOriginal.direccionCompleta.toUpperCase() : clienteOriginal.direccionCompleta,
              descripcionProducto: clienteOriginal.descripcionProducto ? clienteOriginal.descripcionProducto.toUpperCase() : clienteOriginal.descripcionProducto,
            }
          });
          actualizados++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      totalClientes: total,
      clientesEnMayusculas: total - noMayusculas.length,
      clientesConMinusculas: noMayusculas.length,
      estanTodosEnMayusculas: noMayusculas.length === 0,
      actualizadosSiConvertir: actualizados,
      ejemplosNoMayusculas: noMayusculas.slice(0, 20),
    });
  } catch (error: any) {
    console.error('Error al revisar clientes:', error);
    return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
