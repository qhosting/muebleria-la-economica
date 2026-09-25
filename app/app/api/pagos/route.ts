
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

    const { searchParams } = new URL(request.url);
    const clienteId = searchParams.get('clienteId');
    const cobradorId = searchParams.get('cobradorId');
    const fechaDesde = searchParams.get('fechaDesde');
    const fechaHasta = searchParams.get('fechaHasta');
    const tipoPago = searchParams.get('tipoPago');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const skip = (page - 1) * limit;
    const where: any = {};

    if (clienteId) where.clienteId = clienteId;
    if (cobradorId) where.cobradorId = cobradorId;
    if (tipoPago) where.tipoPago = tipoPago;

    if (fechaDesde || fechaHasta) {
      where.fechaPago = {};
      if (fechaDesde) {
        const dDesde = new Date(fechaDesde.length === 10 ? `${fechaDesde}T00:00:00` : fechaDesde);
        where.fechaPago.gte = dDesde;
      }
      if (fechaHasta) {
        const dHasta = new Date(fechaHasta.length === 10 ? `${fechaHasta}T23:59:59.999` : fechaHasta);
        where.fechaPago.lte = dHasta;
      }
    }

    const userRole = (session.user as any).role;
    if (userRole === 'cobrador') {
      where.cobradorId = (session.user as any).id;
    }

    const [pagos, total, estadisticas] = await Promise.all([
      prisma.pago.findMany({
        where,
        include: {
          cliente: {
            select: {
              codigoCliente: true,
              nombreCompleto: true,
            },
          },
          cobrador: {
            select: {
              name: true,
            },
          },
        },
        orderBy: { fechaPago: 'desc' },
        skip,
        take: limit,
      }),
      prisma.pago.count({ where }),
      // Calcular estadísticas
      prisma.pago.groupBy({
        by: ['tipoPago'],
        where,
        _count: { id: true },
        _sum: { monto: true },
      }),
    ]);

    // Calcular estadísticas para el frontend
    const totalPagos = pagos.length;
    const montoTotal = pagos.reduce((sum: any, p: any) => sum + parseFloat(p.monto.toString()), 0);
    const pagosRegulares = pagos.filter((p: any) => p.tipoPago === 'regular').length;
    const pagosMoratorios = pagos.filter((p: any) => p.tipoPago === 'moratorio').length;
    const ticketsImpresos = pagos.filter((p: any) => p.ticketImpreso).length;

    // Resumen agrupado por cobrador para el rango consultado
    const cobradorMap = new Map<string, { id: string; nombre: string; totalCobrado: number; cantidadPagos: number }>();
    pagos.forEach((p: any) => {
      const cId = p.cobradorId || 'sin_asignar';
      const cNombre = p.cobrador?.name || 'Venta / Sin Asignar';
      const prev = cobradorMap.get(cId) || { id: cId, nombre: cNombre, totalCobrado: 0, cantidadPagos: 0 };
      prev.totalCobrado += parseFloat(p.monto.toString());
      prev.cantidadPagos += 1;
      cobradorMap.set(cId, prev);
    });
    const resumenPorCobrador = Array.from(cobradorMap.values()).sort((a, b) => b.totalCobrado - a.totalCobrado);

    // Convert Decimal fields to numbers for JSON serialization
    const pagosSerializados = pagos.map((pago: any) => ({
      ...pago,
      monto: parseFloat(pago.monto.toString()),
      saldoAnterior: parseFloat(pago.saldoAnterior.toString()),
      saldoNuevo: parseFloat(pago.saldoNuevo.toString()),
    }));

    return NextResponse.json({
      pagos: pagosSerializados,
      estadisticas: {
        totalPagos,
        montoTotal,
        pagosRegulares,
        pagosMoratorios,
        ticketsImpresos,
      },
      resumenPorCobrador,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        perPage: limit,
      },
    });
  } catch (error) {
    console.error('Error al obtener pagos:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    const userId = (session.user as any).id;

    const body = await request.json();
    const {
      clienteId,
      monto,
      concepto,
      tipoPago = 'regular',
      fechaPago,
      metodoPago = 'efectivo',
      numeroRecibo,
      localId
    } = body;

    console.log('Recibiendo pago:', { clienteId, monto, tipoPago, concepto, metodoPago, numeroRecibo, localId });

    if (!clienteId || monto === undefined || monto === null) {
      return NextResponse.json(
        { error: 'Cliente y monto son requeridos' },
        { status: 400 }
      );
    }

    // Obtener cliente para verificar permisos y calcular saldos
    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId },
    });

    if (!cliente) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    // Si es cobrador y el cliente tenía otro cobrador asignado, se registra el pago respetando la autoría del cobro
    if (userRole === 'cobrador' && cliente.cobradorAsignadoId && cliente.cobradorAsignadoId !== userId) {
      console.warn(`Cobrador ${userId} cobrando a cliente ${clienteId} (asignado a ${cliente.cobradorAsignadoId}). Se acepta el pago para resguardar la recaudación en campo.`);
    }

    const round2 = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;
    const montoNumerico = round2(parseFloat(monto));
    const saldoAnterior = round2(parseFloat(cliente.saldoActual.toString()));
    let saldoNuevo = saldoAnterior;

    // Calcular nuevo saldo
    // regular, abono, liquidacion -> REDUCEN el saldo (son pagos a la deuda)
    // cobro_mora -> AUMENTA el saldo (es un recargo que se suma a la deuda)
    const reduceSaldo = ['regular', 'abono', 'liquidacion'].includes(tipoPago);
    const aumentaSaldo = tipoPago === 'cobro_mora';

    // Sanity check para cobro_mora: no permitir montos absurdos que inflen el saldo
    if (aumentaSaldo) {
      // Si el monto de mora es mayor al 50% del saldo actual y mayor a 1000, o mayor a 5000 absoluto
      if ((montoNumerico > saldoAnterior * 0.5 && montoNumerico > 1000) || montoNumerico > 5000) {
        console.error(`Intento de cobro de mora inusual: Cliente ${clienteId}, Saldo: ${saldoAnterior}, Mora: ${montoNumerico}`);
        // No bloqueamos totalmente, pero podrías querer registrar esto o requerir un flag 'confirmado'
        // Por ahora, limitemos o retornemos error si es exagerado (más de 100k por ejemplo)
        if (montoNumerico > 10000) {
           return NextResponse.json({ error: 'Monto de mora fuera de límites razonables' }, { status: 400 });
        }
      }
    }
    const afectaSaldo = reduceSaldo || aumentaSaldo;

    if (reduceSaldo) {
      saldoNuevo = Math.max(0, round2(saldoAnterior - montoNumerico));
    } else if (aumentaSaldo) {
      saldoNuevo = round2(saldoAnterior + montoNumerico);
    }

    // 🚀 IDEMPOTENCIA: Si se envía localId, verificar si ya fue procesado para evitar duplicados
    if (localId) {
      const pagoExistente = await prisma.pago.findFirst({
        where: { localId },
        include: {
          cliente: {
            select: {
              codigoCliente: true,
              nombreCompleto: true,
            },
          },
          cobrador: {
            select: {
              name: true,
            },
          },
        },
      });

      if (pagoExistente) {
        console.log(`Pago con localId ${localId} ya registrado previamente, devolviendo existente.`);
        return NextResponse.json(pagoExistente, { status: 200 });
      }
    }

    // Crear el pago en una transacción
    const resultado = await prisma.$transaction(async (prisma: any) => {
      const pago = await prisma.pago.create({
        data: {
          clienteId,
          cobradorId: userRole === 'cobrador' ? userId : (body.cobradorId || userId),
          monto: montoNumerico,
          concepto: concepto || 'Pago de cuota',
          tipoPago,
          fechaPago: fechaPago ? new Date(fechaPago) : new Date(),
          metodoPago: metodoPago || 'efectivo',
          numeroRecibo: numeroRecibo || null,
          localId: localId || null,
          saldoAnterior,
          saldoNuevo,
          sincronizado: true,
        },
        include: {
          cliente: {
            select: {
              codigoCliente: true,
              nombreCompleto: true,
            },
          },
          cobrador: {
            select: {
              name: true,
            },
          },
        },
      });

      // Actualizar saldo del cliente y asignar cobrador si estaba sin asignar
      const clienteUpdateData: any = {};
      if (afectaSaldo) {
        clienteUpdateData.saldoActual = saldoNuevo;
      }
      if (userRole === 'cobrador' && !cliente.cobradorAsignadoId) {
        clienteUpdateData.cobradorAsignadoId = userId;
      }

      if (Object.keys(clienteUpdateData).length > 0) {
        await prisma.cliente.update({
          where: { id: clienteId },
          data: clienteUpdateData,
        });
      }

      return pago;
    });

    return NextResponse.json(resultado, { status: 201 });
  } catch (error) {
    console.error('Error al registrar pago:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
