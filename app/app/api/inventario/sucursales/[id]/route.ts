export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET - Obtener datos de una sucursal específica
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = params;
    const sucursal = await prisma.sucursal.findUnique({
      where: { id },
      include: {
        _count: {
          select: { stocks: true, usuarios: true, ventas: true }
        }
      }
    });

    if (!sucursal) {
      return NextResponse.json({ error: 'Sucursal no encontrada' }, { status: 404 });
    }

    return NextResponse.json(sucursal);
  } catch (error: any) {
    console.error('Error al obtener sucursal:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// PUT / PATCH - Modificar datos de una sucursal/bodega (Solo Administradores)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const userRole = (session.user as any)?.role;
    if (userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Solo administradores pueden modificar información de sucursales y bodegas' },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await request.json();
    const { nombre, direccion, telefono, esBodega, isActive } = body;

    const sucursalExistente = await prisma.sucursal.findUnique({
      where: { id }
    });

    if (!sucursalExistente) {
      return NextResponse.json({ error: 'Sucursal no encontrada' }, { status: 404 });
    }

    // Si se cambia el nombre, verificar que no choque con otra sucursal
    if (nombre && nombre.trim().toUpperCase() !== sucursalExistente.nombre.toUpperCase()) {
      const duplicada = await prisma.sucursal.findFirst({
        where: {
          nombre: { equals: nombre.trim(), mode: 'insensitive' },
          id: { not: id }
        }
      });
      if (duplicada) {
        return NextResponse.json(
          { error: 'Ya existe otra sucursal con ese nombre' },
          { status: 400 }
        );
      }
    }

    const sucursalActualizada = await prisma.sucursal.update({
      where: { id },
      data: {
        nombre: nombre ? nombre.trim().toUpperCase() : undefined,
        direccion: direccion !== undefined ? (direccion ? direccion.trim() : null) : undefined,
        telefono: telefono !== undefined ? (telefono ? telefono.trim() : null) : undefined,
        esBodega: typeof esBodega === 'boolean' ? esBodega : undefined,
        isActive: typeof isActive === 'boolean' ? isActive : undefined
      }
    });

    return NextResponse.json({
      success: true,
      sucursal: sucursalActualizada,
      message: 'Sucursal actualizada exitosamente'
    });
  } catch (error: any) {
    console.error('Error al actualizar sucursal:', error);
    return NextResponse.json(
      { error: error.message || 'Error al actualizar sucursal' },
      { status: 500 }
    );
  }
}

// DELETE - Desactivar o eliminar sucursal
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const userRole = (session.user as any)?.role;
    if (userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Solo administradores pueden eliminar o desactivar sucursales' },
        { status: 403 }
      );
    }

    const { id } = params;

    // Verificar si tiene ventas o stock relacionado
    const [ventasCount, stockCount] = await Promise.all([
      prisma.venta.count({ where: { sucursalId: id } }),
      prisma.stock.count({ where: { sucursalId: id, cantidad: { gt: 0 } } })
    ]);

    if (ventasCount > 0 || stockCount > 0) {
      // Si tiene historial, desactivar en lugar de borrar físicamente
      const desactivada = await prisma.sucursal.update({
        where: { id },
        data: { isActive: false }
      });
      return NextResponse.json({
        success: true,
        message: 'Sucursal desactivada (conserva historial de ventas y movimientos)'
      });
    }

    await prisma.sucursal.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Sucursal eliminada exitosamente'
    });
  } catch (error: any) {
    console.error('Error al eliminar sucursal:', error);
    return NextResponse.json(
      { error: error.message || 'Error al eliminar sucursal' },
      { status: 500 }
    );
  }
}
