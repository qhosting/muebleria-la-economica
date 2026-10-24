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

// PUT / PATCH - Modificar datos de una sucursal/bodega (Permite a cualquier vendedor editar número de contacto)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const userRole = (session.user as any)?.role?.toLowerCase();
    const isAdmin = userRole === 'admin';
    const isVendedor = ['vendedor', 'cobrador', 'gestor_cobranza'].includes(userRole);

    if (!isAdmin && !isVendedor) {
      return NextResponse.json(
        { error: 'No tienes permisos para modificar información de sucursales' },
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

    // Solo admin puede modificar el nombre oficial de la sucursal
    if (isAdmin && nombre && nombre.trim().toUpperCase() !== sucursalExistente.nombre.toUpperCase()) {
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

    // Datos a actualizar: cualquier vendedor puede modificar número de contacto (teléfono) y dirección
    const updateData: any = {};
    if (telefono !== undefined) {
      updateData.telefono = telefono ? telefono.trim() : null;
    }
    if (direccion !== undefined) {
      updateData.direccion = direccion ? direccion.trim() : null;
    }
    if (isAdmin) {
      if (nombre) updateData.nombre = nombre.trim().toUpperCase();
      if (typeof esBodega === 'boolean') updateData.esBodega = esBodega;
      if (typeof isActive === 'boolean') updateData.isActive = isActive;
    }

    const sucursalActualizada = await prisma.sucursal.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      sucursal: sucursalActualizada,
      message: 'Información de contacto de la sucursal actualizada exitosamente'
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
