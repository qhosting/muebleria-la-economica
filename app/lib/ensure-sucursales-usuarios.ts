import { prisma } from './db';
import bcrypt from 'bcryptjs';
import { CATALOGO_PRODUCTOS_INICIAL, SUCURSALES_SISTEMA } from './catalogo-kiosco';

export interface VendedorSucursalConfig {
  email: string;
  name: string;
  sucursalNombre: string;
  passwordDefecto: string;
}

export const VENDEDORES_SUCURSAL_SISTEMA: VendedorSucursalConfig[] = [
  {
    email: 'vendedor.sanlucas@economica.local',
    name: 'Vendedor San Lucas',
    sucursalNombre: 'SAN LUCAS 3ER CUARTEL',
    passwordDefecto: 'vendedor123',
  },
  {
    email: 'vendedor.amealco@economica.local',
    name: 'Vendedor Amealco',
    sucursalNombre: 'AMEALCO',
    passwordDefecto: 'vendedor123',
  },
  {
    email: 'vendedor.laestancia@economica.local',
    name: 'Vendedor La Estancia',
    sucursalNombre: 'LA ESTANCIA SJR',
    passwordDefecto: 'vendedor123',
  },
  {
    email: 'vendedor.sanildefonso@economica.local',
    name: 'Vendedor San Ildefonso',
    sucursalNombre: 'SAN ILDEFONSO',
    passwordDefecto: 'vendedor123',
  },
];

let lastSyncTimestamp = 0;
const SYNC_INTERVAL_MS = 60 * 1000; // Máximo una vez por minuto durante peticiones web normales

/**
 * Asegura la existencia de las 4 sucursales oficiales, 1 usuario vendedor para cada sucursal
 * y que cada sucursal cuente con existencias en su inventario para operar en el Kiosco.
 */
export async function asegurarSucursalesYUsuarios(force: boolean = false) {
  const now = Date.now();
  if (!force && now - lastSyncTimestamp < SYNC_INTERVAL_MS) {
    return { skipped: true };
  }
  lastSyncTimestamp = now;

  try {
    const sucursalesMap = new Map<string, any>();

    // 1. Asegurar las 4 sucursales oficiales
    for (const suc of SUCURSALES_SISTEMA) {
      const s = await prisma.sucursal.upsert({
        where: { nombre: suc.nombre },
        update: {
          direccion: suc.direccion,
          telefono: suc.telefono,
          esBodega: suc.esBodega,
          isActive: true,
        },
        create: {
          nombre: suc.nombre,
          direccion: suc.direccion,
          telefono: suc.telefono,
          esBodega: suc.esBodega,
          isActive: true,
        },
      });
      sucursalesMap.set(suc.nombre.toUpperCase().trim(), s);
    }

    // 2. Asegurar 1 usuario vendedor por cada sucursal
    const defaultPasswordHash = await bcrypt.hash('vendedor123', 12);
    const usuariosResultado = [];

    for (const v of VENDEDORES_SUCURSAL_SISTEMA) {
      const suc = sucursalesMap.get(v.sucursalNombre.toUpperCase().trim());
      const sucId = suc ? suc.id : null;

      const user = await prisma.user.upsert({
        where: { email: v.email },
        update: {
          name: v.name,
          role: 'vendedor',
          sucursalId: sucId,
          isActive: true,
        },
        create: {
          email: v.email,
          name: v.name,
          password: defaultPasswordHash,
          role: 'vendedor',
          sucursalId: sucId,
          isActive: true,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          sucursalId: true,
          sucursal: {
            select: { id: true, nombre: true }
          }
        }
      });
      usuariosResultado.push(user);
    }

    // 3. Asegurar catálogo de productos y stock por sucursal
    // Si alguna sucursal tiene 0 registros de stock, inicializamos sus existencias
    for (const [sucNombre, suc] of sucursalesMap.entries()) {
      try {
        const stockCount = await prisma.stock.count({
          where: { sucursalId: suc.id }
        });

        if (stockCount === 0) {
          const esMatrizSanLucas = sucNombre.includes('SAN LUCAS');
          for (const item of CATALOGO_PRODUCTOS_INICIAL) {
            const prod = await prisma.producto.findUnique({
              where: { codigo: item.codigo }
            });

            if (prod) {
              await prisma.stock.upsert({
                where: {
                  productoId_sucursalId: {
                    productoId: prod.id,
                    sucursalId: suc.id
                  }
                },
                update: {},
                create: {
                  productoId: prod.id,
                  sucursalId: suc.id,
                  cantidad: esMatrizSanLucas ? (item.stockSugerido || 5) : 3
                }
              });
            }
          }
        }
      } catch (stockErr) {
        console.warn(`Aviso asegurando stock para sucursal ${sucNombre}:`, stockErr);
      }
    }

    return {
      success: true,
      sucursales: Array.from(sucursalesMap.values()),
      usuarios: usuariosResultado,
    };
  } catch (error) {
    console.error('❌ Error en asegurarSucursalesYUsuarios:', error);
    return { success: false, error };
  }
}
