
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const userRole = (session.user as any).role;
        if (userRole !== 'admin') {
            return NextResponse.json({ error: 'Solo administradores pueden eliminar clientes masivamente' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const cobradorId = searchParams.get('cobradorId');

        if (!cobradorId) {
            return NextResponse.json({ error: 'ID de cobrador requerido' }, { status: 400 });
        }

        // 1. Obtener IDs de clientes a eliminar
        const clientes = await prisma.cliente.findMany({
            where: { cobradorAsignadoId: cobradorId },
            select: { id: true }
        });

        const clienteIds = clientes.map(c => c.id);

        if (clienteIds.length === 0) {
            return NextResponse.json({ message: 'No se encontraron clientes para este cobrador', count: 0 });
        }

        // 2. Transacción para eliminar todo lo relacionado
        await prisma.$transaction([
            prisma.pago.deleteMany({ where: { clienteId: { in: clienteIds } } }),
            prisma.motarario.deleteMany({ where: { clienteId: { in: clienteIds } } }),
            prisma.cliente.deleteMany({ where: { id: { in: clienteIds } } }),
        ]);

        return NextResponse.json({ message: 'Clientes eliminados exitosamente', count: clienteIds.length });
    } catch (error: any) {
        console.error('Error al eliminar clientes masivamente:', error);
        return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
    }
}
