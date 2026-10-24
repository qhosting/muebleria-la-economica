export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { CATALOGO_PRODUCTOS_INICIAL, SUCURSALES_SISTEMA } from '@/lib/catalogo-kiosco';

// Helper para auto-asegurar productos en la BD si la tabla está vacía
async function asegurarCatalogoInicial() {
    try {
        const total = await prisma.producto.count();
        if (total > 0) return;

        console.log('📦 Auto-poblando catálogo de productos iniciales en la base de datos...');

        // Asegurar que exista la sucursal matriz SAN LUCAS 3ER CUARTEL
        let matriz = await prisma.sucursal.findFirst({
            where: { nombre: { contains: 'SAN LUCAS', mode: 'insensitive' } }
        });

        if (!matriz) {
            matriz = await prisma.sucursal.create({
                data: {
                    nombre: 'SAN LUCAS 3ER CUARTEL',
                    direccion: 'Domicilio Conocido, San Lucas 3er Cuartel, Aculco, Edo. de México',
                    telefono: '427 273 2216',
                    esBodega: false,
                    isActive: true
                }
            });
        }

        // Crear los productos
        for (const item of CATALOGO_PRODUCTOS_INICIAL) {
            const pContado = item.precioContado || item.precioVenta;
            const p12M = item.precioVenta;
            const p1M = item.precio1Mes || Math.round(pContado * 1.05);
            const p4M = item.precio4Meses || Math.round(pContado * 1.15);
            const desc = (item.descripcion || `Marca ${item.marca} ${item.modelo || ''}`.trim()).toUpperCase();

            const prod = await prisma.producto.upsert({
                where: { codigo: item.codigo },
                update: {
                    nombre: item.nombre.toUpperCase(),
                    categoria: item.categoria,
                    precioCompra: pContado,
                    precioContado: pContado,
                    precio1Mes: p1M,
                    precio4Meses: p4M,
                    precio12Meses: p12M,
                    precioVenta: p12M,
                    descripcion: desc,
                    isActive: true
                },
                create: {
                    codigo: item.codigo,
                    nombre: item.nombre.toUpperCase(),
                    descripcion: desc,
                    categoria: item.categoria,
                    precioCompra: pContado,
                    precioContado: pContado,
                    precio1Mes: p1M,
                    precio4Meses: p4M,
                    precio12Meses: p12M,
                    precioVenta: p12M,
                    unidadMedida: 'pieza',
                    stockMinimo: 2,
                    isActive: true
                }
            });

            if (matriz) {
                await prisma.stock.upsert({
                    where: {
                        productoId_sucursalId: {
                            productoId: prod.id,
                            sucursalId: matriz.id
                        }
                    },
                    update: {},
                    create: {
                        productoId: prod.id,
                        sucursalId: matriz.id,
                        cantidad: item.stockSugerido || 5
                    }
                });
            }
        }
    } catch (e) {
        console.error('⚠️ Error al auto-asegurar catálogo:', e);
    }
}

import { asegurarSucursalesYUsuarios } from '@/lib/ensure-sucursales-usuarios';

// GET - Listar productos con stock consolidado
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const categoria = searchParams.get('categoria') || '';
        const activosParam = searchParams.get('activos') ?? searchParams.get('activo');
        const activos = activosParam !== 'false';

        // Auto-asegurar sucursales y usuarios en BD si hiciera falta
        await asegurarSucursalesYUsuarios();

        const where: any = {};

        if (search) {
            where.OR = [
                { nombre: { contains: search, mode: 'insensitive' } },
                { codigo: { contains: search, mode: 'insensitive' } },
                { descripcion: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (categoria && categoria !== 'Todos') {
            where.categoria = categoria;
        }

        if (activos) {
            where.isActive = true;
        }

        // Consultar productos con todo su stock y distribución real en cada sucursal
        const productos = await prisma.producto.findMany({
            where,
            include: {
                stocks: {
                    include: {
                        sucursal: {
                            select: { id: true, nombre: true, esBodega: true }
                        }
                    }
                }
            },
            orderBy: { nombre: 'asc' }
        });

        // Formatear productos calculando stocks y precios con enganche fijo 40%
        const productosConStock = productos.map((producto: any) => {
            const stocksList = producto.stocks || [];
            const stockTotal = stocksList.reduce((sum: number, s: any) => sum + (s.cantidad || 0), 0);
            
            // Distribución real en todas las sucursales donde el producto tenga inventario
            const stockPorSucursal = stocksList.map((s: any) => ({
                sucursalId: s.sucursal?.id || s.sucursalId || '',
                sucursalNombre: s.sucursal?.nombre || 'SUCURSAL',
                esBodega: s.sucursal?.esBodega || false,
                cantidad: s.cantidad || 0
            }));

            const pCompra = producto.precioCompra ? Math.round(parseFloat(producto.precioCompra.toString())) : 0;
            const pVenta = producto.precioVenta ? Math.round(parseFloat(producto.precioVenta.toString())) : 0;
            const pContado = producto.precioContado != null ? Math.round(parseFloat(producto.precioContado.toString())) : pCompra;
            const p1M = producto.precio1Mes != null ? Math.round(parseFloat(producto.precio1Mes.toString())) : 0;
            const p4M = producto.precio4Meses != null ? Math.round(parseFloat(producto.precio4Meses.toString())) : 0;
            const p12M = producto.precio12Meses != null ? Math.round(parseFloat(producto.precio12Meses.toString())) : pVenta;

            // Enganche del 40% fijo según el precio (sin decimales)
            const enganche1Mes = Math.round(p1M * 0.40);
            const enganche4Meses = Math.round(p4M * 0.40);
            const enganche12Meses = Math.round(p12M * 0.40);

            return {
                ...producto,
                nombre: (producto.nombre || '').toUpperCase(),
                descripcion: (producto.descripcion || '').toUpperCase(),
                precioCompra: pCompra,
                precioVenta: pVenta,
                precioContado: pContado,
                precio1Mes: p1M,
                precio4Meses: p4M,
                precio12Meses: p12M,
                enganche1Mes,
                enganche4Meses,
                enganche12Meses,
                stockTotal,
                stockPorSucursal,
                stockBajo: stockTotal <= (producto.stockMinimo || 0)
            };
        });

        // Categorías únicas
        const categoriasDB = await prisma.producto.findMany({
            where: { isActive: true },
            select: { categoria: true },
            distinct: ['categoria']
        });

        const listaCategorias = Array.from(
            new Set([
                'Estufas',
                'Lavadoras',
                'Electrodomésticos',
                'Audio y TV',
                'Salas',
                'Colchones',
                'Bases',
                'Roperos',
                'Cocinas y Muebles',
                ...categoriasDB.map((c: any) => c.categoria).filter(Boolean)
            ])
        );

        return NextResponse.json({
            productos: productosConStock,
            categorias: listaCategorias
        });
    } catch (error: any) {
        console.error('Error al obtener productos:', error);

        // Respaldo de resiliencia: si la base de datos falla temporalmente, devolver catálogo local
        const fallbackProductos = CATALOGO_PRODUCTOS_INICIAL.map(p => ({
            id: p.id,
            codigo: p.codigo,
            nombre: p.nombre,
            descripcion: p.descripcion || `Marca ${p.marca} ${p.modelo || ''}`.trim(),
            categoria: p.categoria,
            precioCompra: p.precioContado,
            precioVenta: p.precioVenta,
            unidadMedida: 'pieza',
            stockTotal: p.stockSugerido || 5,
            stockMinimo: 2,
            stockBajo: false,
            stockPorSucursal: [
                {
                    sucursalId: 'sucursal-san-lucas-3er-cuartel',
                    sucursalNombre: 'SAN LUCAS 3ER CUARTEL',
                    esBodega: false,
                    cantidad: p.stockSugerido || 5
                }
            ]
        }));

        return NextResponse.json({
            productos: fallbackProductos,
            categorias: [
                'Estufas',
                'Lavadoras',
                'Electrodomésticos',
                'Audio y TV',
                'Salas',
                'Colchones',
                'Bases',
                'Roperos',
                'Cocinas y Muebles'
            ]
        });
    }
}

// POST - Crear nuevo producto
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const body = await request.json();
        const {
            codigo,
            nombre,
            descripcion,
            categoria,
            precioCompra,
            precioContado,
            precio1Mes,
            precio4Meses,
            precio12Meses,
            precioVenta,
            unidadMedida,
            stockMinimo,
            stockInicial,
            sucursalId,
            imagenUrl
        } = body;

        if (!codigo || !nombre) {
            return NextResponse.json(
                { error: 'Código y nombre de producto son requeridos' },
                { status: 400 }
            );
        }

        const pCompra = Math.round(parseFloat(precioCompra) || 0);
        const pContado = precioContado !== undefined && precioContado !== '' ? Math.round(parseFloat(precioContado)) : pCompra;
        const p1M = precio1Mes !== undefined && precio1Mes !== '' ? Math.round(parseFloat(precio1Mes)) : 0;
        const p4M = precio4Meses !== undefined && precio4Meses !== '' ? Math.round(parseFloat(precio4Meses)) : 0;
        const p12M = precio12Meses !== undefined && precio12Meses !== '' ? Math.round(parseFloat(precio12Meses)) : 0;
        const pVenta = p12M || p4M || p1M || pContado;

        const codigoUpper = codigo.trim().toUpperCase();

        // Verificar código único
        const existente = await prisma.producto.findUnique({
            where: { codigo: codigoUpper }
        });

        if (existente) {
            return NextResponse.json(
                { error: 'Ya existe un producto con este código' },
                { status: 400 }
            );
        }

        const producto = await prisma.producto.create({
            data: {
                codigo: codigoUpper,
                nombre: nombre.trim().toUpperCase(),
                descripcion: descripcion ? descripcion.trim().toUpperCase() : null,
                categoria: categoria || 'Otros',
                precioCompra: pCompra,
                precioContado: pContado,
                precio1Mes: p1M,
                precio4Meses: p4M,
                precio12Meses: p12M,
                precioVenta: pVenta,
                unidadMedida: unidadMedida || 'pieza',
                stockMinimo: parseInt(stockMinimo) || 0,
                imagenUrl: imagenUrl || null,
                isActive: true
            }
        });

        // Asignar stock inicial y registrar movimiento de inventario en el almacén elegido
        const cantInicial = Math.max(0, parseInt(stockInicial) || 0);
        let targetSucursal = null;

        if (sucursalId && sucursalId !== 'todas') {
            targetSucursal = await prisma.sucursal.findFirst({
                where: {
                    OR: [
                        { id: sucursalId },
                        { nombre: { contains: sucursalId.replace(/^sucursal-/, '').replace(/-/g, ' '), mode: 'insensitive' } }
                    ]
                }
            });
        }

        if (!targetSucursal) {
            targetSucursal = await prisma.sucursal.findFirst({
                where: { nombre: { contains: 'SAN LUCAS', mode: 'insensitive' } }
            }) || await prisma.sucursal.findFirst({ where: { isActive: true } });
        }

        if (targetSucursal) {
            await prisma.stock.upsert({
                where: {
                    productoId_sucursalId: {
                        productoId: producto.id,
                        sucursalId: targetSucursal.id
                    }
                },
                update: {
                    cantidad: cantInicial
                },
                create: {
                    productoId: producto.id,
                    sucursalId: targetSucursal.id,
                    cantidad: cantInicial
                }
            });

            if (cantInicial > 0) {
                await prisma.movimientoInventario.create({
                    data: {
                        productoId: producto.id,
                        tipoMovimiento: 'entrada',
                        cantidad: cantInicial,
                        sucursalDestinoId: targetSucursal.id,
                        motivo: `Registro inicial de producto nuevo en almacén (${targetSucursal.nombre})`,
                        referencia: 'ALTA-INVENTARIO',
                        usuarioId: (session?.user as any)?.id || null
                    }
                });
            }
        }

        return NextResponse.json(producto, { status: 201 });
    } catch (error: any) {
        console.error('Error al crear producto:', error);
        return NextResponse.json(
            { error: error.message || 'Error al crear producto' },
            { status: 500 }
        );
    }
}

// PUT - Actualizar producto y precios
export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const body = await request.json();
        const {
            id,
            codigo,
            nombre,
            descripcion,
            categoria,
            precioCompra,
            precioContado,
            precio1Mes,
            precio4Meses,
            precio12Meses,
            precioVenta,
            unidadMedida,
            stockMinimo,
            stockTotal,
            sucursalId,
            sucursalIdOriginal
        } = body;

        if (!id) {
            return NextResponse.json({ error: 'ID del producto es requerido' }, { status: 400 });
        }

        const updateData: any = {};
        if (codigo) updateData.codigo = codigo.trim().toUpperCase();
        if (nombre) updateData.nombre = nombre.trim().toUpperCase();
        if (descripcion !== undefined) updateData.descripcion = descripcion ? descripcion.trim().toUpperCase() : null;
        if (categoria) updateData.categoria = categoria;
        if (precioCompra !== undefined) updateData.precioCompra = Math.round(parseFloat(precioCompra) || 0);
        if (precioContado !== undefined) updateData.precioContado = Math.round(parseFloat(precioContado) || 0);
        if (precio1Mes !== undefined) updateData.precio1Mes = Math.round(parseFloat(precio1Mes) || 0);
        if (precio4Meses !== undefined) updateData.precio4Meses = Math.round(parseFloat(precio4Meses) || 0);
        if (precio12Meses !== undefined) {
            const p12 = Math.round(parseFloat(precio12Meses) || 0);
            updateData.precio12Meses = p12;
            updateData.precioVenta = p12 || updateData.precio4Meses || updateData.precio1Mes || updateData.precioContado || Math.round(parseFloat(precioVenta) || 0);
        } else if (precioVenta !== undefined) {
            updateData.precioVenta = Math.round(parseFloat(precioVenta) || 0);
        }
        if (unidadMedida) updateData.unidadMedida = unidadMedida;
        if (stockMinimo !== undefined) updateData.stockMinimo = parseInt(stockMinimo) || 0;

        const productoActualizado = await prisma.producto.update({
            where: { id },
            data: updateData
        });

        // Actualizar stock en la sucursal elegida
        if (stockTotal !== undefined && stockTotal !== null && stockTotal !== '') {
            const cant = Math.max(0, parseInt(stockTotal) || 0);

            let targetSucursal = null;
            if (sucursalId && sucursalId !== 'todas') {
                targetSucursal = await prisma.sucursal.findFirst({
                    where: {
                        OR: [
                            { id: sucursalId },
                            { nombre: { contains: sucursalId.replace(/^sucursal-/, '').replace(/-/g, ' '), mode: 'insensitive' } },
                            { nombre: { equals: sucursalId, mode: 'insensitive' } }
                        ]
                    }
                });
            }

            if (!targetSucursal) {
                targetSucursal = await prisma.sucursal.findFirst({
                    where: { nombre: { contains: 'SAN LUCAS', mode: 'insensitive' } }
                }) || await prisma.sucursal.findFirst({ where: { isActive: true } });
            }

            if (targetSucursal) {
                await prisma.stock.upsert({
                    where: {
                        productoId_sucursalId: {
                            productoId: id,
                            sucursalId: targetSucursal.id
                        }
                    },
                    update: { cantidad: cant },
                    create: {
                        productoId: id,
                        sucursalId: targetSucursal.id,
                        cantidad: cant
                    }
                });

                // Si se cambió de sucursal (sucursalIdOriginal difiere de la sucursal elegida)
                if (sucursalIdOriginal && sucursalIdOriginal !== 'todas' && sucursalIdOriginal !== targetSucursal.id) {
                    const origSuc = await prisma.sucursal.findFirst({
                        where: {
                            OR: [
                                { id: sucursalIdOriginal },
                                { nombre: { contains: sucursalIdOriginal.replace(/^sucursal-/, '').replace(/-/g, ' '), mode: 'insensitive' } },
                                { nombre: { equals: sucursalIdOriginal, mode: 'insensitive' } }
                            ]
                        }
                    });

                    if (origSuc && origSuc.id !== targetSucursal.id) {
                        // Limpiar stock de la sucursal anterior
                        await prisma.stock.deleteMany({
                            where: {
                                productoId: id,
                                sucursalId: origSuc.id
                            }
                        });

                        // Registrar traslado en el historial
                        await prisma.movimientoInventario.create({
                            data: {
                                productoId: id,
                                tipoMovimiento: 'traspaso',
                                cantidad: cant,
                                sucursalOrigenId: origSuc.id,
                                sucursalDestinoId: targetSucursal.id,
                                motivo: `Reubicación de sucursal desde edición de inventario (${origSuc.nombre} ➔ ${targetSucursal.nombre})`,
                                referencia: 'EDICION-SUCURSAL',
                                usuarioId: (session?.user as any)?.id || null
                            }
                        });
                    }
                }
            }
        }

        return NextResponse.json({
            success: true,
            producto: productoActualizado,
            message: 'Producto y precios actualizados exitosamente'
        });
    } catch (error: any) {
        console.error('Error al actualizar producto:', error);
        return NextResponse.json(
            { error: error.message || 'Error al actualizar producto' },
            { status: 500 }
        );
    }
}
