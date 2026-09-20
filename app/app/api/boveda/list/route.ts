export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkPermission } from '@/lib/permissions';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const curp = searchParams.get('curp');
        const codigo = searchParams.get('codigo');
        const folio = searchParams.get('folio');
        const search = searchParams.get('search');
        const mine = searchParams.get('mine') === 'true';
        const status = searchParams.get('status');

        const db = prisma as any;

        // Si se consulta un expediente específico por identificador único
        if (curp || codigo || folio) {
            const documentos = await db.documentoBoveda.findMany({
                where: {
                    OR: [
                        curp ? { clienteCurp: curp } : undefined,
                        codigo ? { codigoCliente: codigo } : undefined,
                        folio ? { folioContrato: folio } : undefined
                    ].filter(Boolean) as any
                },
                orderBy: {
                    createdAt: 'desc'
                },
                include: {
                    validadoPor: {
                        select: {
                            name: true
                        }
                    }
                }
            });
            return NextResponse.json(documentos);
        }

        const userRole = (session.user as any).role;
        const hasModuleAccess = await checkPermission(userRole, 'boveda');

        // Para búsquedas o listados generales:
        // 1. Determinar si se restringe al usuario actual
        const restrictToUser = !hasModuleAccess || mine;
        const userId = (session.user as any).id;

        // 2. Construir filtros para la consulta de DocumentoBoveda
        const bovedaWhere: any = {};
        if (restrictToUser) {
            bovedaWhere.vendedorId = userId;
        }
        if (status) {
            bovedaWhere.status = status;
        }
        if (search) {
            bovedaWhere.OR = [
                { nombreCliente: { contains: search, mode: 'insensitive' } },
                { clienteCurp: { contains: search, mode: 'insensitive' } },
                { codigoCliente: { contains: search, mode: 'insensitive' } },
                { folioContrato: { contains: search, mode: 'insensitive' } },
                { telefono: { contains: search, mode: 'insensitive' } }
            ];
        }

        const documentos = await db.documentoBoveda.findMany({
            where: bovedaWhere,
            orderBy: { createdAt: 'desc' },
            take: 5000
        });

        // 3. Consultar la tabla Cliente para incluir clientes del sistema
        const clienteWhere: any = {
            statusCuenta: 'activo'
        };
        if (restrictToUser) {
            clienteWhere.OR = [
                { cobradorAsignadoId: userId },
                { vendedor: (session.user as any).name || (session.user as any).email }
            ];
        }
        if (search) {
            clienteWhere.OR = [
                { nombreCompleto: { contains: search, mode: 'insensitive' } },
                { codigoCliente: { contains: search, mode: 'insensitive' } },
                { telefono: { contains: search, mode: 'insensitive' } },
                { direccionCompleta: { contains: search, mode: 'insensitive' } }
            ];
        }

        const clientes = await db.cliente.findMany({
            where: clienteWhere,
            orderBy: { createdAt: 'desc' },
            take: 200
        });

        // 4. Agrupar y unificar resultados por expediente (CURP o Código o Contrato)
        const expedientesMap = new Map<string, any>();

        // Primero agregamos los expedientes que ya tienen documentos
        documentos.forEach((doc: any) => {
            const key = doc.clienteCurp || doc.codigoCliente || doc.folioContrato || doc.nombreCliente;
            if (!key) return;

            const normalizedKey = key.trim().toUpperCase();
            if (!expedientesMap.has(normalizedKey)) {
                expedientesMap.set(normalizedKey, {
                    nombreCompleto: doc.nombreCliente || 'Sin Nombre',
                    curp: doc.clienteCurp || '',
                    codigoCliente: doc.codigoCliente || '',
                    folioContrato: doc.folioContrato || '',
                    telefono: doc.telefono || '',
                    recent: true,
                    hasDocuments: true,
                    lastDocCreatedAt: doc.createdAt
                });
            }
        });

        // Luego agregamos los clientes de la base de datos que coincidan con la búsqueda
        clientes.forEach((cli: any) => {
            const key = cli.curp || cli.codigoCliente || cli.numContrato || cli.nombreCompleto;
            if (!key) return;

            const normalizedKey = key.trim().toUpperCase();
            if (!expedientesMap.has(normalizedKey)) {
                if (status) return; // Si filtró por estatus de documento no mostrar clientes sin documentos

                expedientesMap.set(normalizedKey, {
                    nombreCompleto: cli.nombreCompleto || 'Sin Nombre',
                    curp: cli.curp || '',
                    codigoCliente: cli.codigoCliente || '',
                    folioContrato: cli.numContrato || '',
                    telefono: cli.telefono || '',
                    recent: false,
                    hasDocuments: false,
                    lastDocCreatedAt: new Date(0)
                });
            } else {
                const existing = expedientesMap.get(normalizedKey);
                existing.nombreCompleto = existing.nombreCompleto || cli.nombreCompleto;
                existing.curp = existing.curp || cli.curp;
                existing.codigoCliente = existing.codigoCliente || cli.codigoCliente;
                existing.folioContrato = existing.folioContrato || cli.numContrato;
                existing.telefono = existing.telefono || cli.telefono;
                existing.hasDocuments = true;
            }
        });

        let expedientes = Array.from(expedientesMap.values());

        // Ordenar expedientes: primero los que tienen actividad reciente
        expedientes.sort((a, b) => {
            if (a.hasDocuments && b.hasDocuments) {
                return new Date(b.lastDocCreatedAt).getTime() - new Date(a.lastDocCreatedAt).getTime();
            }
            if (a.hasDocuments) return -1;
            if (b.hasDocuments) return 1;
            return 0;
        });

        if (!search) {
            expedientes = expedientes.slice(0, 150);
        }

        return NextResponse.json(expedientes);

    } catch (error: any) {
        console.error('Error en boveda list:', error);
        return NextResponse.json({ 
            error: 'Error al listar documentos',
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}
