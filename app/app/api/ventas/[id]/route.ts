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

    const { id } = params;

    const venta = await prisma.venta.findUnique({
      where: { id },
      include: {
        detalles: true,
        cliente: {
          select: {
            id: true,
            codigoCliente: true,
            cobradorAsignado: {
              select: { id: true, name: true, codigoGestor: true }
            }
          }
        },
        sucursal: {
          select: { id: true, nombre: true, direccion: true, telefono: true }
        }
      }
    });

    if (!venta) {
      return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 });
    }

    return NextResponse.json(venta);
  } catch (error: any) {
    console.error('Error al obtener venta:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// DELETE - Eliminar venta/remisión (SOLO PERMITIDO PARA ADMINISTRADORES)
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
        { error: 'Acceso denegado: Solo el administrador tiene permiso para eliminar ventas del historial de remisiones' },
        { status: 403 }
      );
    }

    const { id } = params;

    const venta = await prisma.venta.findUnique({
      where: { id },
      include: {
        detalles: true,
        cliente: true
      }
    });

    if (!venta) {
      return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 });
    }

    // 1. Reintegrar stock a la sucursal de origen
    if (venta.sucursalId && venta.detalles && venta.detalles.length > 0) {
      for (const det of venta.detalles) {
        let dbProductoId = det.productoId;

        // Si no tiene productoId directo, buscar por concepto/código
        if (!dbProductoId && det.concepto) {
          try {
            const prod = await prisma.producto.findFirst({
              where: {
                OR: [
                  { nombre: { equals: det.concepto, mode: 'insensitive' } },
                  { descripcion: { contains: det.concepto, mode: 'insensitive' } }
                ]
              }
            });
            if (prod) dbProductoId = prod.id;
          } catch (e) {
            console.warn('Advertencia buscando producto para revertir stock:', e);
          }
        }

        if (dbProductoId) {
          try {
            await prisma.stock.upsert({
              where: {
                productoId_sucursalId: {
                  productoId: dbProductoId,
                  sucursalId: venta.sucursalId
                }
              },
              update: {
                cantidad: { increment: Number(det.cantidad || 1) }
              },
              create: {
                productoId: dbProductoId,
                sucursalId: venta.sucursalId,
                cantidad: Number(det.cantidad || 1)
              }
            });

            await prisma.movimientoInventario.create({
              data: {
                productoId: dbProductoId,
                sucursalDestinoId: venta.sucursalId,
                tipoMovimiento: 'ajuste',
                cantidad: Number(det.cantidad || 1),
                motivo: `Restablecimiento de inventario por eliminación de Remisión Nº ${venta.folio}`,
                referencia: `DEL-REM-${venta.folio}`,
                usuarioId: (session.user as any).id
              }
            });
          } catch (stockErr) {
            console.warn('Advertencia al restituir stock:', stockErr);
          }
        }
      }
    }

    // 2. Gestionar saldos y pagos vinculados del cliente
    if (venta.clienteId) {
      const folioRecibo = `ENG-${venta.folio}`;

      // Eliminar recibo de enganche si se generó para esta venta
      try {
        await prisma.pago.deleteMany({
          where: {
            clienteId: venta.clienteId,
            OR: [
              { numeroRecibo: folioRecibo },
              { concepto: { contains: `Remisión Nº ${venta.folio.toString().padStart(4, '0')}` } }
            ]
          }
        });
      } catch (pagoErr) {
        console.warn('Advertencia al eliminar pago de enganche:', pagoErr);
      }

      // Verificar si el cliente tiene otras ventas o abonos
      const [otrasVentasCount, otrosPagosCount] = await Promise.all([
        prisma.venta.count({
          where: {
            clienteId: venta.clienteId,
            id: { not: venta.id }
          }
        }),
        prisma.pago.count({
          where: { clienteId: venta.clienteId }
        })
      ]);

      if (otrasVentasCount === 0 && otrosPagosCount === 0) {
        // Si no tiene nada más, eliminar el registro del cliente
        try {
          await prisma.cliente.delete({
            where: { id: venta.clienteId }
          });
        } catch (delCliErr) {
          // Si tiene restricciones foráneas, desactivar
          await prisma.cliente.update({
            where: { id: venta.clienteId },
            data: { statusCuenta: 'inactivo', saldoActual: 0 }
          });
        }
      } else {
        // Restar el saldo de esta venta al cliente
        const saldoFinanciadoNum = Number(venta.saldoFinanciado || 0);
        const montoRestar = saldoFinanciadoNum > 0 ? saldoFinanciadoNum : Number(venta.total || 0);
        await prisma.cliente.update({
          where: { id: venta.clienteId },
          data: {
            saldoActual: {
              decrement: montoRestar
            }
          }
        });
      }
    }

    // 3. Eliminar la venta físicamente (detalles_venta se elimina en cascada)
    await prisma.venta.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: `Remisión Nº ${venta.folio.toString().padStart(4, '0')} eliminada y existencias reintegradas exitosamente.`
    });
  } catch (error: any) {
    console.error('Error al eliminar venta:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno al eliminar la venta' },
      { status: 500 }
    );
  }
}

