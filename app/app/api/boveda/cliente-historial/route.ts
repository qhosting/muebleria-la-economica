export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const curp = searchParams.get('curp');
        const codigo = searchParams.get('codigo');
        const nombre = searchParams.get('nombre');

        if (!curp && !codigo && !nombre) {
            return NextResponse.json({ error: 'Se requiere CURP, código o nombre del cliente' }, { status: 400 });
        }

        const db = prisma as any;
        const whereClause: any = {
            OR: [
                curp ? { curp: curp } : undefined,
                codigo ? { codigoCliente: codigo } : undefined,
                nombre ? { nombreCompleto: { contains: nombre, mode: 'insensitive' } } : undefined
            ].filter(Boolean)
        };

        const cuentas = await db.cliente.findMany({
            where: whereClause,
            orderBy: {
                fechaVenta: 'desc'
            },
            select: {
                id: true,
                codigoCliente: true,
                nombreCompleto: true,
                numContrato: true,
                fechaVenta: true,
                statusCuenta: true,
                descripcionProducto: true,
                montoPago: true,
                periodicidad: true,
                saldoActual: true,
                createdAt: true
            }
        });

        return NextResponse.json(cuentas);

    } catch (error: any) {
        console.error('[Cliente Historial API] Error:', error);
        return NextResponse.json({ 
            error: 'Error interno del servidor al procesar la consulta de historial del cliente',
            details: error.message 
        }, { status: 500 });
    }
}
