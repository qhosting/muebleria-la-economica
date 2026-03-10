
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (!['admin', 'gestor_cobranza', 'reporte_cobranza'].includes(userRole)) {
      return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const fechaDesde = searchParams.get('fechaDesde') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const fechaHasta = searchParams.get('fechaHasta') || new Date().toISOString();
    const cobradorId = searchParams.get('cobradorId');

    console.log('Parámetros recibidos:', { fechaDesde, fechaHasta, cobradorId });

    const where: any = {
      fechaPago: {
        gte: new Date(fechaDesde),
        lte: new Date(fechaHasta),
      },
    };

    if (cobradorId && cobradorId !== 'all') {
      where.cobradorId = cobradorId;
    }

    // Reporte general de cobranza agrupado
    const reporteGeneral = await prisma.pago.groupBy({
      by: ['cobradorId', 'tipoPago'],
      where,
      _sum: {
        monto: true,
      },
      _count: {
        _all: true,
      },
    });

    // Listado detallado de pagos para "Evolución Diaria"
    const pagosDetallados = await prisma.pago.findMany({
      where,
      include: {
        cliente: {
          select: {
            nombreCompleto: true,
            codigoCliente: true,
          }
        },
        cobrador: {
          select: {
            name: true,
          }
        }
      },
      orderBy: {
        fechaPago: 'desc',
      },
    });

    // Obtener información de cobradores
    let cobradoresQuery: any = {
      role: 'cobrador',
      isActive: true,
    };

    const cobradores = await prisma.user.findMany({
      where: cobradoresQuery,
      select: {
        id: true,
        name: true,
      },
    });

    // Definir qué tipos son de cuenta y cuáles son moras
    const tiposCuenta = ['regular', 'abono', 'liquidacion'];
    const tiposMora = ['moratorio', 'mora'];

    // Organizar datos por cobrador
    const reportePorCobrador = cobradores.map((cobrador: any) => {
      const pagosReg = reporteGeneral.filter(
        (r: any) => r.cobradorId === cobrador.id && tiposCuenta.includes(r.tipoPago)
      );

      const pagosMor = reporteGeneral.filter(
        (r: any) => r.cobradorId === cobrador.id && tiposMora.includes(r.tipoPago)
      );

      const totalReg = pagosReg.reduce((sum, r) => sum + Number(r._sum.monto || 0), 0);
      const cantReg = pagosReg.reduce((sum, r) => sum + r._count._all, 0);

      const totalMor = pagosMor.reduce((sum, r) => sum + Number(r._sum.monto || 0), 0);
      const cantMor = pagosMor.reduce((sum, r) => sum + r._count._all, 0);

      return {
        cobrador: cobrador.name,
        cobradorId: cobrador.id,
        totalCobrado: totalReg + totalMor,
        pagosRegulares: totalReg,
        pagosMoratorios: totalMor,
        cantidadPagos: cantReg + cantMor,
      };
    }).filter((cobrador: any) => cobrador.totalCobrado > 0 || cobrador.cantidadPagos > 0);

    // Reporte por día (agregado)
    const reportePorDia = await prisma.$queryRaw`
      SELECT 
        DATE("fechaPago") as fecha,
        SUM(CASE WHEN "tipoPago" IN ('regular', 'abono', 'liquidacion') THEN "monto" ELSE 0 END) as pagos_regulares,
        SUM(CASE WHEN "tipoPago" IN ('moratorio', 'mora') THEN "monto" ELSE 0 END) as pagos_moratorios,
        COUNT(*) as total_pagos
      FROM "pagos" 
      WHERE "fechaPago" >= ${new Date(fechaDesde)} 
        AND "fechaPago" <= ${new Date(fechaHasta)}
        ${cobradorId && cobradorId !== 'all' ? Prisma.sql`AND "cobradorId" = ${cobradorId}` : Prisma.sql``}
      GROUP BY DATE("fechaPago")
      ORDER BY fecha DESC
    `;

    const totales = {
      totalCobrado: reportePorCobrador.reduce((sum: any, r: any) => sum + r.pagosRegulares, 0),
      totalMora: reportePorCobrador.reduce((sum: any, r: any) => sum + r.pagosMoratorios, 0),
      totalGeneral: reportePorCobrador.reduce((sum: any, r: any) => sum + r.totalCobrado, 0),
      totalPagos: reportePorCobrador.reduce((sum: any, r: any) => sum + r.cantidadPagos, 0),
    };

    // Serializar pagos detallados
    const pagosFormatted = pagosDetallados.map(p => ({
      fecha: p.fechaPago,
      cliente: p.cliente.nombreCompleto,
      concepto: p.concepto,
      tipo: p.tipoPago,
      monto: Number(p.monto),
      cobrador: p.cobrador.name
    }));

    // Convertir BigInt a Number para serialización JSON
    const reportePorDiaFormatted = (reportePorDia as any[]).map((row: any) => ({
      fecha: row.fecha,
      pagos_regulares: Number(row.pagos_regulares),
      pagos_moratorios: Number(row.pagos_moratorios),
      total_pagos: Number(row.total_pagos),
    }));

    return NextResponse.json({
      totales,
      reportePorCobrador,
      reportePorDia: reportePorDiaFormatted,
      pagos: pagosFormatted,
      periodo: {
        desde: fechaDesde,
        hasta: fechaHasta,
      },
    });
  } catch (error) {
    console.error('Error al generar reporte de cobranza:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
