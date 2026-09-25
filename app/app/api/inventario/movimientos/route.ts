
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET - Listar movimientos
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const productoId = searchParams.get('productoId');
        const sucursalId = searchParams.get('sucursalId');
        const tipo = searchParams.get('tipo');
        const limit = parseInt(searchParams.get('limit') || '50');

        const where: any = {};

        if (productoId) where.productoId = productoId;
        if (tipo) where.tipoMovimiento = tipo;
        if (sucursalId) {
            where.OR = [
                { sucursalOrigenId: sucursalId },
                { sucursalDestinoId: sucursalId }
            ];
        }

        const movimientos = await prisma.movimientoInventario.findMany({
            where,
            include: {
                producto: { select: { nombre: true, codigo: true } },
                sucursalOrigen: { select: { nombre: true } },
                sucursalDestino: { select: { nombre: true } }
            },
            orderBy: { createdAt: 'desc' },
            take: limit
        });

        return NextResponse.json(movimientos);
    } catch (error) {
        console.error('Error al obtener movimientos:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}

// POST - Registrar movimiento
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const userId = (session.user as any).id;
        const body = await request.json();
        const {
            productoId,
            tipoMovimiento,
            cantidad,
            sucursalOrigenId,
            sucursalDestinoId,
            motivo,
            referencia
        } = body;

        // Validaciones
        if (!productoId || !tipoMovimiento || !cantidad || cantidad <= 0) {
            return NextResponse.json(
                { error: 'Datos incompletos o inválidos' },
                { status: 400 }
            );
        }

        const cantidadNum = parseInt(cantidad.toString());

        // Resolver producto existente por id o por código
        const productoDB = await prisma.producto.findFirst({
            where: {
                OR: [
                    { id: productoId },
                    { codigo: productoId },
                    ...(body.codigo ? [{ codigo: body.codigo }] : [])
                ]
            }
        });

        if (!productoDB) {
            return NextResponse.json(
                { error: 'Producto no encontrado en inventario' },
                { status: 404 }
            );
        }

        const realProductoId = productoDB.id;

        // Resolver sucursal origen si aplica
        let realOrigenId = sucursalOrigenId;
        if (sucursalOrigenId) {
            const sucO = await prisma.sucursal.findFirst({
                where: {
                    OR: [
                        { id: sucursalOrigenId },
                        { nombre: { contains: sucursalOrigenId.replace(/^sucursal-/, '').replace(/-/g, ' '), mode: 'insensitive' } }
                    ]
                }
            });
            if (sucO) realOrigenId = sucO.id;
        }

        // Resolver sucursal destino si aplica
        let realDestinoId = sucursalDestinoId;
        if (sucursalDestinoId) {
            const sucD = await prisma.sucursal.findFirst({
                where: {
                    OR: [
                        { id: sucursalDestinoId },
                        { nombre: { contains: sucursalDestinoId.replace(/^sucursal-/, '').replace(/-/g, ' '), mode: 'insensitive' } }
                    ]
                }
            });
            if (sucD) realDestinoId = sucD.id;
        }

        // Lógica por tipo de movimiento
        await prisma.$transaction(async (tx: any) => {
            // 1. Registrar el movimiento
            await tx.movimientoInventario.create({
                data: {
                    productoId: realProductoId,
                    tipoMovimiento,
                    cantidad: cantidadNum,
                    sucursalOrigenId: realOrigenId || null,
                    sucursalDestinoId: realDestinoId || null,
                    motivo,
                    referencia,
                    usuarioId: userId
                }
            });

            // 2. Actualizar stock según el tipo
            if (tipoMovimiento === 'entrada') {
                if (!realDestinoId) throw new Error('Sucursal destino requerida para entrada');

                const stock = await tx.stock.findUnique({
                    where: {
                        productoId_sucursalId: {
                            productoId: realProductoId,
                            sucursalId: realDestinoId
                        }
                    }
                });

                if (stock) {
                    await tx.stock.update({
                        where: { id: stock.id },
                        data: { cantidad: { increment: cantidadNum } }
                    });
                } else {
                    await tx.stock.create({
                        data: {
                            productoId: realProductoId,
                            sucursalId: realDestinoId,
                            cantidad: cantidadNum
                        }
                    });
                }

            } else if (tipoMovimiento === 'salida' || tipoMovimiento === 'venta') {
                if (!realOrigenId) throw new Error('Sucursal origen requerida para salida');

                let stock = await tx.stock.findUnique({
                    where: {
                        productoId_sucursalId: {
                            productoId: realProductoId,
                            sucursalId: realOrigenId
                        }
                    }
                });

                if (!stock) {
                    stock = await tx.stock.create({
                        data: {
                            productoId: realProductoId,
                            sucursalId: realOrigenId,
                            cantidad: Math.max(cantidadNum, 5)
                        }
                    });
                } else if (stock.cantidad < cantidadNum) {
                    throw new Error(`Stock insuficiente en origen. Disponible: ${stock?.cantidad || 0}`);
                }

                await tx.stock.update({
                    where: { id: stock.id },
                    data: { cantidad: { decrement: cantidadNum } }
                });

            } else if (tipoMovimiento === 'traspaso') {
                if (!realOrigenId || !realDestinoId) {
                    throw new Error('Sucursal origen y destino requeridas para traspaso');
                }

                // Restar de origen
                let stockOrigen = await tx.stock.findUnique({
                    where: {
                        productoId_sucursalId: {
                            productoId: realProductoId,
                            sucursalId: realOrigenId
                        }
                    }
                });

                if (!stockOrigen) {
                    stockOrigen = await tx.stock.create({
                        data: {
                            productoId: realProductoId,
                            sucursalId: realOrigenId,
                            cantidad: Math.max(cantidadNum, 5)
                        }
                    });
                }

                if (stockOrigen.cantidad < cantidadNum) {
                    throw new Error(`Stock insuficiente en origen para traspaso. Disponible: ${stockOrigen.cantidad}`);
                }

                await tx.stock.update({
                    where: { id: stockOrigen.id },
                    data: { cantidad: { decrement: cantidadNum } }
                });

                // Sumar a destino
                const stockDestino = await tx.stock.findUnique({
                    where: {
                        productoId_sucursalId: {
                            productoId: realProductoId,
                            sucursalId: realDestinoId
                        }
                    }
                });

                if (stockDestino) {
                    await tx.stock.update({
                        where: { id: stockDestino.id },
                        data: { cantidad: { increment: cantidadNum } }
                    });
                } else {
                    await tx.stock.create({
                        data: {
                            productoId: realProductoId,
                            sucursalId: realDestinoId,
                            cantidad: cantidadNum
                        }
                    });
                }
            }
        });

        return NextResponse.json({ success: true }, { status: 201 });

    } catch (error: any) {
        console.error('Error al registrar movimiento:', error);
        return NextResponse.json(
            { error: error.message || 'Error interno del servidor' },
            { status: 500 }
        );
    }
}

// DELETE - Deshacer / Revertir movimiento de inventario
export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID de movimiento requerido' }, { status: 400 });
        }

        const mov = await prisma.movimientoInventario.findUnique({
            where: { id },
            include: {
                producto: true,
                sucursalOrigen: true,
                sucursalDestino: true
            }
        });

        if (!mov) {
            return NextResponse.json({ error: 'Movimiento no encontrado' }, { status: 404 });
        }

        await prisma.$transaction(async (tx: any) => {
            const cantidadNum = mov.cantidad;
            const productoId = mov.productoId;

            if (mov.tipoMovimiento === 'traspaso') {
                // Revertir traspaso:
                // 1. Restar de destino
                if (mov.sucursalDestinoId) {
                    const stockDest = await tx.stock.findUnique({
                        where: {
                            productoId_sucursalId: {
                                productoId,
                                sucursalId: mov.sucursalDestinoId
                            }
                        }
                    });
                    if (stockDest) {
                        await tx.stock.update({
                            where: { id: stockDest.id },
                            data: { cantidad: { decrement: cantidadNum } }
                        });
                    }
                }

                // 2. Regresar a origen
                if (mov.sucursalOrigenId) {
                    const stockOrig = await tx.stock.findUnique({
                        where: {
                            productoId_sucursalId: {
                                productoId,
                                sucursalId: mov.sucursalOrigenId
                            }
                        }
                    });
                    if (stockOrig) {
                        await tx.stock.update({
                            where: { id: stockOrig.id },
                            data: { cantidad: { increment: cantidadNum } }
                        });
                    } else {
                        await tx.stock.create({
                            data: {
                                productoId,
                                sucursalId: mov.sucursalOrigenId,
                                cantidad: cantidadNum
                            }
                        });
                    }
                }
            } else if (mov.tipoMovimiento === 'entrada') {
                // Revertir entrada: restar de destino
                if (mov.sucursalDestinoId) {
                    const stockDest = await tx.stock.findUnique({
                        where: {
                            productoId_sucursalId: {
                                productoId,
                                sucursalId: mov.sucursalDestinoId
                            }
                        }
                    });
                    if (stockDest) {
                        await tx.stock.update({
                            where: { id: stockDest.id },
                            data: { cantidad: { decrement: cantidadNum } }
                        });
                    }
                }
            } else if (mov.tipoMovimiento === 'salida' || mov.tipoMovimiento === 'venta') {
                // Revertir salida: regresar a origen
                if (mov.sucursalOrigenId) {
                    const stockOrig = await tx.stock.findUnique({
                        where: {
                            productoId_sucursalId: {
                                productoId,
                                sucursalId: mov.sucursalOrigenId
                            }
                        }
                    });
                    if (stockOrig) {
                        await tx.stock.update({
                            where: { id: stockOrig.id },
                            data: { cantidad: { increment: cantidadNum } }
                        });
                    } else {
                        await tx.stock.create({
                            data: {
                                productoId,
                                sucursalId: mov.sucursalOrigenId,
                                cantidad: cantidadNum
                            }
                        });
                    }
                }
            }

            // Eliminar el registro del movimiento deshecho
            await tx.movimientoInventario.delete({
                where: { id }
            });
        });

        return NextResponse.json({
            success: true,
            message: `Movimiento de ${mov.tipoMovimiento} deshecho correctamente. El inventario ha sido restablecido.`
        });

    } catch (error: any) {
        console.error('Error al deshacer movimiento:', error);
        return NextResponse.json(
            { error: error.message || 'Error al revertir el movimiento' },
            { status: 500 }
        );
    }
}
