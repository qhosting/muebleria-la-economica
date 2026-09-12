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
            const prod = await prisma.producto.upsert({
                where: { codigo: item.codigo },
                update: {
                    nombre: item.nombre,
                    categoria: item.categoria,
                    precioCompra: item.precioContado,
                    precioVenta: item.precioVenta,
                    descripcion: item.descripcion || `Marca ${item.marca} ${item.modelo || ''}`.trim(),
                    isActive: true
                },
                create: {
                    codigo: item.codigo,
                    nombre: item.nombre,
                    descripcion: item.descripcion || `Marca ${item.marca} ${item.modelo || ''}`.trim(),
                    categoria: item.categoria,
                    precioCompra: item.precioContado,
                    precioVenta: item.precioVenta,
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

        // Auto-asegurar si la base de datos está vacía
        await asegurarCatalogoInicial();

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

        // Formatear productos calculando stocks de forma 100% segura contra nulos
        const productosConStock = productos.map((producto: any) => {
            const stocksList = producto.stocks || [];
            const stockTotal = stocksList.reduce((sum: number, s: any) => sum + (s.cantidad || 0), 0);
            
            const stockPorSucursal = stocksList.map((s: any) => ({
                sucursalId: s.sucursal?.id || s.sucursalId || '',
                sucursalNombre: s.sucursal?.nombre || 'SAN LUCAS 3ER CUARTEL',
                esBodega: s.sucursal?.esBodega || false,
                cantidad: s.cantidad || 0
            }));

            const pCompra = producto.precioCompra ? parseFloat(producto.precioCompra.toString()) : 0;
            const pVenta = producto.precioVenta ? parseFloat(producto.precioVenta.toString()) : 0;

            return {
                ...producto,
                precioCompra: pCompra,
                precioVenta: pVenta,
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
            precioVenta,
            unidadMedida,
            stockMinimo,
            stockInicial,
            sucursalId,
            imagenUrl
        } = body;

        if (!codigo || !nombre || precioCompra === undefined || precioVenta === undefined) {
            return NextResponse.json(
                { error: 'Código, nombre, precio de compra y precio de venta son requeridos' },
                { status: 400 }
            );
        }

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
                descripcion: descripcion ? descripcion.trim() : null,
                categoria: categoria || 'Otros',
                precioCompra: parseFloat(precioCompra) || 0,
                precioVenta: parseFloat(precioVenta) || 0,
                unidadMedida: unidadMedida || 'pieza',
                stockMinimo: parseInt(stockMinimo) || 0,
                imagenUrl: imagenUrl || null,
                isActive: true
            }
        });

        // Asignar stock inicial si se proporcionó
        const cantInicial = parseInt(stockInicial) || 0;
        if (cantInicial > 0) {
            let targetSucursalId = sucursalId;
            if (!targetSucursalId || targetSucursalId === 'todas') {
                const matriz = await prisma.sucursal.findFirst({
                    where: { nombre: { contains: 'SAN LUCAS', mode: 'insensitive' } }
                }) || await prisma.sucursal.findFirst();
                targetSucursalId = matriz?.id;
            }

            if (targetSucursalId) {
                await prisma.stock.create({
                    data: {
                        productoId: producto.id,
                        sucursalId: targetSucursalId,
                        cantidad: cantInicial
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
            precioVenta,
            unidadMedida,
            stockMinimo,
            stockTotal,
            sucursalId
        } = body;

        if (!id) {
            return NextResponse.json({ error: 'ID del producto es requerido' }, { status: 400 });
        }

        const updateData: any = {};
        if (codigo) updateData.codigo = codigo.trim().toUpperCase();
        if (nombre) updateData.nombre = nombre.trim().toUpperCase();
        if (descripcion !== undefined) updateData.descripcion = descripcion ? descripcion.trim() : null;
        if (categoria) updateData.categoria = categoria;
        if (precioCompra !== undefined) updateData.precioCompra = parseFloat(precioCompra) || 0;
        if (precioVenta !== undefined) updateData.precioVenta = parseFloat(precioVenta) || 0;
        if (unidadMedida) updateData.unidadMedida = unidadMedida;
        if (stockMinimo !== undefined) updateData.stockMinimo = parseInt(stockMinimo) || 0;

        const productoActualizado = await prisma.producto.update({
            where: { id },
            data: updateData
        });

        // Actualizar stock si fue especificado
        if (stockTotal !== undefined && stockTotal !== null && stockTotal !== '') {
            const cant = Math.max(0, parseInt(stockTotal) || 0);

            if (sucursalId && sucursalId !== 'todas') {
                await prisma.stock.upsert({
                    where: {
                        productoId_sucursalId: {
                            productoId: id,
                            sucursalId
                        }
                    },
                    update: { cantidad: cant },
                    create: {
                        productoId: id,
                        sucursalId,
                        cantidad: cant
                    }
                });
            } else {
                // Si es general, actualizar la sucursal matriz SAN LUCAS
                const matriz = await prisma.sucursal.findFirst({
                    where: { nombre: { contains: 'SAN LUCAS', mode: 'insensitive' } }
                }) || await prisma.sucursal.findFirst();

                if (matriz) {
                    await prisma.stock.upsert({
                        where: {
                            productoId_sucursalId: {
                                productoId: id,
                                sucursalId: matriz.id
                            }
                        },
                        update: { cantidad: cant },
                        create: {
                            productoId: id,
                            sucursalId: matriz.id,
                            cantidad: cant
                        }
                    });
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
