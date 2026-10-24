export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Periodicidad, TipoVenta } from '@prisma/client';

// GET - Listar ventas recientes
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const tipo = searchParams.get('tipo');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      const folioNumber = parseInt(search);
      where.OR = [
        { nombreCliente: { contains: search, mode: 'insensitive' } },
        { telefonoCliente: { contains: search, mode: 'insensitive' } },
        ...(isNaN(folioNumber) ? [] : [{ folio: folioNumber }])
      ];
    }

    if (tipo && (tipo === 'contado' || tipo === 'credito')) {
      where.tipoVenta = tipo;
    }

    const [ventas, total] = await Promise.all([
      prisma.venta.findMany({
        where,
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
        },
        orderBy: { folio: 'desc' },
        skip,
        take: limit
      }),
      prisma.venta.count({ where })
    ]);

    return NextResponse.json({
      ventas,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        perPage: limit
      }
    });
  } catch (error: any) {
    console.error('Error al listar ventas:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// POST - Registrar venta y levantamiento de crédito
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      tipoVenta = 'credito',
      nombreCliente,
      direccionCliente = '',
      ciudadCliente = 'Aculco, Edo. de Méx.',
      telefonoCliente = '',
      sucursalId,
      vendedorId,
      vendedor = session.user.name || 'TIENDA',
      subtotal,
      descuento = 0,
      total,
      enganche = 0,
      saldoFinanciado,
      periodicidad = 'semanal',
      plazoSemanas = 26,
      montoCuota = 0,
      diaPago = '1',
      interesMoratorioMensual = 10,
      firmaCliente,
      observaciones,
      cobradorAsignadoId,
      clienteIdExistente,
      articulos = []
    } = body;

    const userId = (session.user as any)?.id;
    const userRole = (session.user as any)?.role;
    const userSucursalId = (session.user as any)?.sucursalId;

    // Autoasignación de vendedor
    const finalVendedorId = vendedorId || (userId || null);
    const finalVendedorNombre = (vendedor && vendedor !== 'TIENDA') ? vendedor : (session.user?.name || 'TIENDA');

    // Resolver sucursal activa: si no viene especificada, asignar la del usuario o por defecto SAN LUCAS 3ER CUARTEL
    let activeSucursalId = sucursalId || userSucursalId;
    if (!activeSucursalId) {
      const sucursalSanLucas = await prisma.sucursal.findFirst({
        where: { nombre: { contains: 'SAN LUCAS', mode: 'insensitive' } }
      });
      activeSucursalId = sucursalSanLucas?.id || null;
    }

    // Auto-asignación de cobrador: si no viene o es 'sin-asignar', asignar al usuario vendedor
    let finalCobradorId = cobradorAsignadoId && cobradorAsignadoId !== 'sin-asignar' ? cobradorAsignadoId : null;
    if (!finalCobradorId && (userRole === 'vendedor' || userRole === 'cobrador') && userId) {
      finalCobradorId = userId;
    }

    if (!nombreCliente || !articulos || articulos.length === 0) {
      return NextResponse.json(
        { error: 'Debe ingresar el nombre del cliente y al menos un artículo' },
        { status: 400 }
      );
    }

    // 1. Obtener próximo folio correlativo
    const ultimaVenta = await prisma.venta.findFirst({
      orderBy: { folio: 'desc' },
      select: { folio: true }
    });
    const proximoFolio = ultimaVenta ? ultimaVenta.folio + 1 : 454;

    // Resumen de conceptos para el campo descripcionProducto de Cliente
    const descripcionConceptos = articulos
      .map((a: any) => `${a.cantidad}x ${a.concepto}`)
      .join(', ');

    let clienteFinalId = clienteIdExistente || null;
    let nuevoCodigoCliente = '';

    // 2. Si es venta a crédito, gestionar la cuenta del cliente
    if (tipoVenta === 'credito') {
      if (!clienteFinalId) {
        // Generar nuevo código de cliente consecutivo (ej. CL1001)
        const totalClientes = await prisma.cliente.count();
        nuevoCodigoCliente = `CL${totalClientes + 1}`;

        const nuevoCliente = await prisma.cliente.create({
          data: {
            codigoCliente: nuevoCodigoCliente,
            fechaVenta: new Date(),
            nombreCompleto: nombreCliente.trim().toUpperCase(),
            telefono: telefonoCliente || null,
            vendedor: finalVendedorNombre,
            cobradorAsignadoId: finalCobradorId,
            sucursalId: activeSucursalId || null,
            statusCuenta: 'activo',
            direccionCompleta: `${direccionCliente}${ciudadCliente ? ', ' + ciudadCliente : ''}`.trim().toUpperCase(),
            descripcionProducto: descripcionConceptos.substring(0, 250).toUpperCase(),
            diaPago: diaPago ? diaPago.toString() : '1',
            montoPago: montoCuota > 0 ? Number(montoCuota) : 100,
            periodicidad: (periodicidad as Periodicidad) || 'semanal',
            saldoActual: Number(saldoFinanciado > 0 ? saldoFinanciado : total),
            importe1: Number(total),
            importe2: Number(enganche > 0 ? enganche : 0),
          }
        });
        clienteFinalId = nuevoCliente.id;
      } else {
        // Actualizar saldo del cliente existente sumando la nueva compra
        await prisma.cliente.update({
          where: { id: clienteFinalId },
          data: {
            saldoActual: {
              increment: Number(saldoFinanciado > 0 ? saldoFinanciado : total)
            },
            montoPago: montoCuota > 0 ? Number(montoCuota) : undefined,
            diaPago: diaPago ? diaPago.toString() : undefined,
            periodicidad: (periodicidad as Periodicidad) || undefined,
            descripcionProducto: descripcionConceptos.substring(0, 250)
          }
        });
      }

      // 3. Si hubo enganche inicial, registrar el primer pago en la cuenta
      if (Number(enganche) > 0 && clienteFinalId) {
        await prisma.pago.create({
          data: {
            clienteId: clienteFinalId,
            cobradorId: (session.user as any).id || (cobradorAsignadoId && cobradorAsignadoId !== 'sin-asignar' ? cobradorAsignadoId : (session.user as any).id),
            monto: Number(enganche),
            concepto: `Enganche Remisión Nº ${proximoFolio.toString().padStart(4, '0')}`,
            tipoPago: 'abono',
            metodoPago: 'efectivo',
            saldoAnterior: Number(total),
            saldoNuevo: Number(saldoFinanciado),
            ticketImpreso: true,
            sincronizado: true,
            numeroRecibo: `ENG-${proximoFolio}`
          }
        });
      }
    }

    // 4. Crear registro maestro de Venta
    const ventaCreada = await prisma.venta.create({
      data: {
        folio: proximoFolio,
        tipoVenta: tipoVenta as TipoVenta,
        clienteId: clienteFinalId,
        nombreCliente: nombreCliente.trim(),
        direccionCliente: direccionCliente.trim(),
        ciudadCliente: (ciudadCliente || 'Aculco, Edo. de Méx.').trim(),
        telefonoCliente: telefonoCliente.trim(),
        sucursalId: activeSucursalId || null,
        vendedorId: finalVendedorId,
        vendedor: finalVendedorNombre,
        subtotal: Number(subtotal),
        descuento: Number(descuento || 0),
        total: Number(total),
        enganche: Number(enganche || 0),
        saldoFinanciado: Number(saldoFinanciado || 0),
        periodicidad: (periodicidad as Periodicidad) || 'semanal',
        plazoSemanas: plazoSemanas ? parseInt(plazoSemanas) : null,
        montoCuota: montoCuota ? Number(montoCuota) : null,
        diaPago: diaPago ? diaPago.toString() : null,
        interesMoratorioMensual: Number(interesMoratorioMensual || 10),
        firmaCliente: firmaCliente || null,
        observaciones: observaciones || null,
        detalles: {
          create: articulos.map((item: any) => {
            const cant = Number(item.cantidad || 1);
            const pUnit = Number(item.precioUnitario !== undefined && item.precioUnitario !== null ? item.precioUnitario : (Number(item.importe || 0) / cant));
            const imp = Number(item.importe !== undefined && item.importe !== null ? item.importe : (pUnit * cant));
            return {
              productoId: item.productoId && !item.productoId.startsWith('est-') && !item.productoId.startsWith('lav-') && !item.productoId.startsWith('col-') && !item.productoId.startsWith('rop-') && !item.productoId.startsWith('sal-') && !item.productoId.startsWith('bas-') && !item.productoId.startsWith('tv-') && !item.productoId.startsWith('mue-') && !item.productoId.startsWith('aud-') && !item.productoId.startsWith('elc-') && !item.productoId.startsWith('lic-') && !item.productoId.startsWith('caf-') && !item.productoId.startsWith('pla-') && !item.productoId.startsWith('bat-')
                ? item.productoId
                : null,
              cantidad: cant,
              concepto: item.concepto,
              precioUnitario: pUnit,
              importe: imp
            };
          })
        }
      },
      include: {
        detalles: true,
        cliente: true,
        sucursal: true
      }
    });

    // 5. Descontar stock si los productos tienen sucursal y productoId real en DB
    if (activeSucursalId) {
      for (const art of articulos) {
        let dbProductoId = art.productoId && art.productoId.length > 20 ? art.productoId : null;
        
        // Si no es un CUID, buscar por código o nombre en la tabla Producto
        if (!dbProductoId && (art.codigo || art.concepto)) {
          try {
            const prodEncontrado = await prisma.producto.findFirst({
              where: {
                OR: [
                  ...(art.codigo ? [{ codigo: art.codigo }] : []),
                  ...(art.concepto ? [{ nombre: art.concepto }] : [])
                ]
              }
            });
            if (prodEncontrado) dbProductoId = prodEncontrado.id;
          } catch (e) {
            // Continuar si falla la búsqueda
          }
        }

        if (dbProductoId) {
          try {
            await prisma.stock.upsert({
              where: {
                productoId_sucursalId: {
                  productoId: dbProductoId,
                  sucursalId: activeSucursalId
                }
              },
              update: {
                cantidad: { decrement: Number(art.cantidad || 1) }
              },
              create: {
                productoId: dbProductoId,
                sucursalId: activeSucursalId,
                cantidad: -Number(art.cantidad || 1)
              }
            });

            await prisma.movimientoInventario.create({
              data: {
                productoId: dbProductoId,
                sucursalOrigenId: activeSucursalId,
                tipoMovimiento: 'venta',
                cantidad: Number(art.cantidad || 1),
                motivo: `Venta en Kiosco Remisión Nº ${proximoFolio}`,
                referencia: `REM-${proximoFolio}`,
                usuarioId: (session.user as any).id
              }
            });
          } catch (stockError) {
            console.warn('Advertencia actualizando stock:', stockError);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      venta: ventaCreada,
      folioFormateado: proximoFolio.toString().padStart(4, '0'),
      codigoCliente: nuevoCodigoCliente || (ventaCreada.cliente?.codigoCliente) || ''
    });
  } catch (error: any) {
    console.error('Error al registrar venta:', error);
    return NextResponse.json(
      { error: error.message || 'Error al procesar la venta' },
      { status: 500 }
    );
  }
}
