
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

    const userRole = (session.user as any).role;
    if (!['admin', 'gestor_cobranza', 'reporte_cobranza'].includes(userRole)) {
      return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const fechaDesde = searchParams.get('fechaDesde') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const fechaHasta = searchParams.get('fechaHasta') || new Date().toISOString();
    const cobradorId = searchParams.get('cobradorId');

    const where: any = {
      fechaPago: {
        gte: new Date(fechaDesde),
        lte: new Date(fechaHasta),
      },
    };

    if (cobradorId) {
      where.cobradorId = cobradorId;
    }

    // Reporte general de cobranza
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

    // Obtener información de cobradores
    const cobradores = await prisma.user.findMany({
      where: {
        role: 'cobrador',
        isActive: true,
      },
      select: {
        id: true,
        name: true,
      },
    });

    // Organizar datos por cobrador
    const reportePorCobrador = cobradores.map(cobrador => {
      const pagosRegulares = reporteGeneral.find(
        r => r.cobradorId === cobrador.id && r.tipoPago === 'regular'
      ) || { _sum: { monto: 0 }, _count: { _all: 0 } };

      const pagosMoratorios = reporteGeneral.find(
        r => r.cobradorId === cobrador.id && r.tipoPago === 'moratorio'
      ) || { _sum: { monto: 0 }, _count: { _all: 0 } };

      return {
        cobrador: cobrador.name,
        cobradorId: cobrador.id,
        totalCobrado: Number(pagosRegulares._sum.monto || 0) + Number(pagosMoratorios._sum.monto || 0),
        pagosRegulares: Number(pagosRegulares._sum.monto || 0),
        pagosMoratorios: Number(pagosMoratorios._sum.monto || 0),
        cantidadPagos: pagosRegulares._count._all + pagosMoratorios._count._all,
      };
    });

    // Reporte por día
    const reportePorDia = await prisma.$queryRaw`
      SELECT 
        DATE(fecha_pago) as fecha,
        SUM(CASE WHEN tipo_pago = 'regular' THEN monto ELSE 0 END) as pagos_regulares,
        SUM(CASE WHEN tipo_pago = 'moratorio' THEN monto ELSE 0 END) as pagos_moratorios,
        COUNT(*) as total_pagos
      FROM pagos 
      WHERE fecha_pago >= ${new Date(fechaDesde)} 
        AND fecha_pago <= ${new Date(fechaHasta)}
        ${cobradorId ? prisma.$queryRaw`AND cobrador_id = ${cobradorId}` : prisma.$queryRaw``}
      GROUP BY DATE(fecha_pago)
      ORDER BY fecha DESC
    `;

    const totales = {
      totalCobrado: reportePorCobrador.reduce((sum, r) => sum + r.totalCobrado, 0),
      pagosRegulares: reportePorCobrador.reduce((sum, r) => sum + r.pagosRegulares, 0),
      pagosMoratorios: reportePorCobrador.reduce((sum, r) => sum + r.pagosMoratorios, 0),
      totalPagos: reportePorCobrador.reduce((sum, r) => sum + r.cantidadPagos, 0),
    };

    return NextResponse.json({
      totales,
      reportePorCobrador,
      reportePorDia,
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
