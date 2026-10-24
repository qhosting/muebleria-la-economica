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
  {
    email: 'vendedor.hogaryestilo@economica.local',
    name: 'Vendedor Hogar y Estilo',
    sucursalNombre: 'HOGAR Y ESTILO',
    passwordDefecto: 'vendedor123',
  },
];

let lastSyncTimestamp = 0;
const SYNC_INTERVAL_MS = 60 * 1000; // Máximo una vez por minuto durante peticiones web normales

/**
 * Asegura la existencia de las sucursales oficiales, un único usuario integral por sucursal
 * (que atiende tanto ventas como cobranza para no duplicar cuentas),
 * y que ÚNICAMENTE la sucursal matriz SAN LUCAS 3ER CUARTEL conserve existencias iniciales de productos.
 */
export async function asegurarSucursalesYUsuarios(force: boolean = false) {
  const now = Date.now();
  if (!force && now - lastSyncTimestamp < SYNC_INTERVAL_MS) {
    return { skipped: true };
  }
  lastSyncTimestamp = now;

  try {
    const sucursalesMap = new Map<string, any>();

    // 1. Asegurar las sucursales oficiales respetando dirección y teléfono personalizados
    for (const suc of SUCURSALES_SISTEMA) {
      const existente = await prisma.sucursal.findFirst({
        where: {
          OR: [
            { nombre: { equals: suc.nombre, mode: 'insensitive' } },
            { id: suc.id }
          ]
        }
      });

      let s;
      if (existente) {
        // Preservar la dirección y teléfono asignados por los vendedores en la base de datos
        s = await prisma.sucursal.update({
          where: { id: existente.id },
          data: {
            isActive: true,
            direccion: existente.direccion || suc.direccion,
            telefono: existente.telefono || suc.telefono,
          }
        });
      } else {
        s = await prisma.sucursal.create({
          data: {
            nombre: suc.nombre,
            direccion: suc.direccion,
            telefono: suc.telefono,
            esBodega: suc.esBodega,
            isActive: true,
          }
        });
      }
      sucursalesMap.set(suc.nombre.toUpperCase().trim(), s);
    }

    // 2. Asegurar 1 usuario único por sucursal (atiende ventas y cobranza)
    const defaultPasswordHash = await bcrypt.hash('vendedor123', 12);
    const usuariosResultado = [];

    // Limpiar usuarios duplicados temporales si existieran
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            'cobrador.sanlucas@economica.local',
            'cobrador.amealco@economica.local',
            'cobrador.laestancia@economica.local',
            'cobrador.sanildefonso@economica.local',
            'cobrador.hogaryestilo@economica.local',
          ]
        }
      }
    });

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

    // Si existe cobrador general de ruta sin sucursal asignada, vincularlo a San Lucas
    const matrizSanLucas = Array.from(sucursalesMap.values()).find(
      s => s.nombre.toUpperCase().includes('SAN LUCAS')
    );
    if (matrizSanLucas) {
      await prisma.user.updateMany({
        where: {
          role: 'cobrador',
          sucursalId: null,
        },
        data: {
          sucursalId: matrizSanLucas.id
        }
      });
    }

    // 3. Asegurar existencias de productos iniciales sin sobreescribir las sucursales elegidas por el usuario
    if (matrizSanLucas) {
      // Solo para productos nuevos que NO tengan stock en NINGUNA sucursal, asignar stock por defecto en la matriz
      const productosSinStock = await prisma.producto.findMany({
        where: {
          stocks: {
            none: {}
          }
        },
        select: { id: true, codigo: true }
      });

      for (const prod of productosSinStock) {
        const catalogoItem = CATALOGO_PRODUCTOS_INICIAL.find(c => c.codigo === prod.codigo);
        const cantDefault = catalogoItem?.stockSugerido || 5;

        await prisma.stock.create({
          data: {
            productoId: prod.id,
            sucursalId: matrizSanLucas.id,
            cantidad: cantDefault
          }
        });
      }
    }

    // 4. Asegurar que los clientes existentes estén estandarizados en MAYÚSCULAS
    try {
      await prisma.$executeRawUnsafe(`
        UPDATE "clientes"
        SET 
          "nombreCompleto" = UPPER("nombreCompleto"),
          "direccionCompleta" = UPPER("direccionCompleta"),
          "descripcionProducto" = UPPER("descripcionProducto"),
          "vendedor" = CASE WHEN "vendedor" IS NOT NULL THEN UPPER("vendedor") ELSE NULL END,
          "codigoCliente" = UPPER("codigoCliente"),
          "curp" = CASE WHEN "curp" IS NOT NULL THEN UPPER("curp") ELSE NULL END
        WHERE 
          "nombreCompleto" != UPPER("nombreCompleto")
          OR "direccionCompleta" != UPPER("direccionCompleta")
          OR "descripcionProducto" != UPPER("descripcionProducto")
          OR ("vendedor" IS NOT NULL AND "vendedor" != UPPER("vendedor"))
          OR "codigoCliente" != UPPER("codigoCliente")
          OR ("curp" IS NOT NULL AND "curp" != UPPER("curp"));
      `);
    } catch (clientErr) {
      console.warn('Aviso asegurando mayusculas de clientes:', clientErr);
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
