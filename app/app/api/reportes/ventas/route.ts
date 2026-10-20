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

    const userRole = (session.user as any)?.role;
    const userId = (session.user as any)?.id;
    const userName = session.user.name;

    const { searchParams } = new URL(request.url);
    const fechaDesde = searchParams.get('fechaDesde');
    const fechaHasta = searchParams.get('fechaHasta');
    const sucursalId = searchParams.get('sucursalId');
    const tipoVenta = searchParams.get('tipoVenta');
    const vendedorIdFiltro = searchParams.get('vendedorId');

    const where: any = {};

    // Filtro de fechas
    if (fechaDesde || fechaHasta) {
      where.fecha = {};
      if (fechaDesde) {
        where.fecha.gte = new Date(fechaDesde);
      }
      if (fechaHasta) {
        where.fecha.lte = new Date(fechaHasta);
      }
    }

    // Filtro de sucursal
    if (sucursalId && sucursalId !== 'todas') {
      where.sucursalId = sucursalId;
    }

    // Filtro de tipo de venta (contado vs credito)
    if (tipoVenta && (tipoVenta === 'contado' || tipoVenta === 'credito')) {
      where.tipoVenta = tipoVenta;
    }

    // Restricción por rol de vendedor:
    // Si el usuario es vendedor, SOLO puede ver sus propias ventas
    if (userRole === 'vendedor') {
      where.OR = [
        ...(userId ? [{ vendedorId: userId }] : []),
        ...(userName ? [{ vendedor: { equals: userName, mode: 'insensitive' } }] : [])
      ];
    } else if (vendedorIdFiltro && vendedorIdFiltro !== 'todos') {
      where.vendedorId = vendedorIdFiltro;
    }

    const ventas = await prisma.venta.findMany({
      where,
      include: {
        detalles: true,
        sucursal: {
          select: { id: true, nombre: true, direccion: true, telefono: true }
        },
        cliente: {
          select: { id: true, codigoCliente: true, statusCuenta: true, saldoActual: true }
        },
        vendedorUsuario: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { fecha: 'desc' }
    });

    // Cálculos consolidados
    let totalVentas = 0;
    let totalContado = 0;
    let totalCredito = 0;
    let totalEnganches = 0;
    let totalSaldoFinanciado = 0;

    const mapaVendedores = new Map<string, {
      vendedorId: string;
      nombre: string;
      cantidadVentas: number;
      totalVendido: number;
      totalContado: number;
      totalCredito: number;
      totalEnganche: number;
    }>();

    const mapaSucursales = new Map<string, {
      sucursalId: string;
      nombre: string;
      cantidadVentas: number;
      total: number;
    }>();

    for (const v of ventas) {
      const montoTotal = Number(v.total || 0);
      const montoEnganche = Number(v.enganche || 0);
      const montoSaldo = Number(v.saldoFinanciado || 0);

      totalVentas += montoTotal;
      totalEnganches += montoEnganche;
      totalSaldoFinanciado += montoSaldo;

      if (v.tipoVenta === 'contado') {
        totalContado += montoTotal;
      } else {
        totalCredito += montoTotal;
      }

      // Agrupación por Vendedor
      const vKey = v.vendedorId || v.vendedor || 'Sin Vendedor';
      const vNombre = v.vendedorUsuario?.name || v.vendedor || 'VENTA MOSTRADOR';
      const vendedorItem = mapaVendedores.get(vKey) || {
        vendedorId: v.vendedorId || vKey,
        nombre: vNombre,
        cantidadVentas: 0,
        totalVendido: 0,
        totalContado: 0,
        totalCredito: 0,
        totalEnganche: 0
      };
      vendedorItem.cantidadVentas += 1;
      vendedorItem.totalVendido += montoTotal;
      if (v.tipoVenta === 'contado') {
        vendedorItem.totalContado += montoTotal;
      } else {
        vendedorItem.totalCredito += montoTotal;
        vendedorItem.totalEnganche += montoEnganche;
      }
      mapaVendedores.set(vKey, vendedorItem);

      // Agrupación por Sucursal
      const sKey = v.sucursalId || 'sin-sucursal';
      const sNombre = v.sucursal?.nombre || 'SAN LUCAS 3ER CUARTEL';
      const sucursalItem = mapaSucursales.get(sKey) || {
        sucursalId: sKey,
        nombre: sNombre,
        cantidadVentas: 0,
        total: 0
      };
      sucursalItem.cantidadVentas += 1;
      sucursalItem.total += montoTotal;
      mapaSucursales.set(sKey, sucursalItem);
    }

    const rankingVendedores = Array.from(mapaVendedores.values())
      .sort((a, b) => b.totalVendido - a.totalVendido);

    const desgloseSucursales = Array.from(mapaSucursales.values())
      .sort((a, b) => b.total - a.total);

    return NextResponse.json({
      resumen: {
        totalVentas,
        totalContado,
        totalCredito,
        totalEnganches,
        totalSaldoFinanciado,
        cantidadVentas: ventas.length
      },
      rankingVendedores,
      desgloseSucursales,
      ventas: ventas.map(v => ({
        id: v.id,
        folio: v.folio,
        fecha: v.fecha,
        tipoVenta: v.tipoVenta,
        nombreCliente: v.nombreCliente,
        telefonoCliente: v.telefonoCliente,
        codigoCliente: v.cliente?.codigoCliente || '',
        sucursalNombre: v.sucursal?.nombre || 'SAN LUCAS 3ER CUARTEL',
        vendedorNombre: v.vendedorUsuario?.name || v.vendedor || 'TIENDA',
        vendedorId: v.vendedorId,
        total: Number(v.total),
        enganche: Number(v.enganche),
        saldoFinanciado: Number(v.saldoFinanciado),
        montoCuota: Number(v.montoCuota || 0),
        periodicidad: v.periodicidad,
        plazoSemanas: v.plazoSemanas,
        detallesCount: v.detalles?.length || 0,
        detalles: v.detalles
      }))
    });
  } catch (error: any) {
    console.error('Error al generar reporte de ventas:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno al generar el reporte de ventas' },
      { status: 500 }
    );
  }
}
