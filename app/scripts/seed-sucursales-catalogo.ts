import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { CATALOGO_PRODUCTOS_INICIAL, SUCURSALES_SISTEMA } from '../lib/catalogo-kiosco';

const prisma = new PrismaClient();

export async function seedSucursalesCatalogo() {
  console.log('🏛️  Iniciando configuración Multi-Sucursal, Vendedores e Inventario...');

  try {
    const passwordHash = await bcrypt.hash('vendedor123', 12);
    const sucursalesCreadas: Record<string, any> = {};

    // 1. Crear / actualizar las 4 sucursales oficiales
    console.log('📍 Registrando las 4 sucursales oficiales...');
    for (const suc of SUCURSALES_SISTEMA) {
      const sucursalDB = await prisma.sucursal.upsert({
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
      sucursalesCreadas[suc.nombre] = sucursalDB;
      console.log(`   ✅ Sucursal: ${sucursalDB.nombre} (ID: ${sucursalDB.id})`);
    }

    // 2. Crear vendedores de mostrador para cada sucursal
    console.log('\n👤 Registrando vendedores de mostrador por sucursal...');
    const vendedoresData = [
      {
        email: 'vendedor.sanlucas@economica.local',
        name: 'Vendedor San Lucas',
        sucursalNombre: 'SAN LUCAS 3ER CUARTEL',
      },
      {
        email: 'vendedor.amealco@economica.local',
        name: 'Vendedor Amealco',
        sucursalNombre: 'AMEALCO',
      },
      {
        email: 'vendedor.laestancia@economica.local',
        name: 'Vendedor La Estancia',
        sucursalNombre: 'LA ESTANCIA SJR',
      },
      {
        email: 'vendedor.sanildefonso@economica.local',
        name: 'Vendedor San Ildefonso',
        sucursalNombre: 'SAN ILDEFONSO',
      },
    ];

    for (const vend of vendedoresData) {
      const suc = sucursalesCreadas[vend.sucursalNombre];
      const user = await prisma.user.upsert({
        where: { email: vend.email },
        update: {
          name: vend.name,
          role: 'vendedor',
          sucursalId: suc ? suc.id : null,
          isActive: true,
        },
        create: {
          email: vend.email,
          name: vend.name,
          password: passwordHash,
          role: 'vendedor',
          sucursalId: suc ? suc.id : null,
          isActive: true,
        },
      });
      console.log(`   ✅ Vendedor: ${user.name} (${user.email}) -> ${vend.sucursalNombre}`);
    }

    // 3. Registrar los productos iniciales y asignar stock a las sucursales
    console.log('\n📦 Registrando productos e inicializando inventario...');
    const sanLucasSucursal = sucursalesCreadas['SAN LUCAS 3ER CUARTEL'];

    let totalProds = 0;
    for (const item of CATALOGO_PRODUCTOS_INICIAL) {
      const prod = await prisma.producto.upsert({
        where: { codigo: item.codigo },
        update: {
          nombre: item.nombre,
          descripcion: item.descripcion || `Marca ${item.marca} ${item.modelo || ''}`.trim(),
          categoria: item.categoria,
          precioCompra: item.precioContado,
          precioVenta: item.precioVenta,
          unidadMedida: 'pieza',
          stockMinimo: 1,
          isActive: true,
        },
        create: {
          codigo: item.codigo,
          nombre: item.nombre,
          descripcion: item.descripcion || `Marca ${item.marca} ${item.modelo || ''}`.trim(),
          categoria: item.categoria,
          precioCompra: item.precioContado,
          precioVenta: item.precioVenta,
          unidadMedida: 'pieza',
          stockMinimo: 1,
          isActive: true,
        },
      });

      totalProds++;

      // Stock en SAN LUCAS 3ER CUARTEL (sucursal matriz de los productos cargados primero)
      if (sanLucasSucursal) {
        await prisma.stock.upsert({
          where: {
            productoId_sucursalId: {
              productoId: prod.id,
              sucursalId: sanLucasSucursal.id,
            },
          },
          update: {},
          create: {
            productoId: prod.id,
            sucursalId: sanLucasSucursal.id,
            cantidad: item.stockSugerido || 5,
          },
        });
      }

      // Inicializar ranuras de stock en las demás sucursales
      for (const sucNombre of ['AMEALCO', 'LA ESTANCIA SJR', 'SAN ILDEFONSO']) {
        const suc = sucursalesCreadas[sucNombre];
        if (suc) {
          await prisma.stock.upsert({
            where: {
              productoId_sucursalId: {
                productoId: prod.id,
                sucursalId: suc.id,
              },
            },
            update: {},
            create: {
              productoId: prod.id,
              sucursalId: suc.id,
              cantidad: 2, // stock inicial de muestra para las sucursales
            },
          });
        }
      }
    }

    console.log(`✅ ${totalProds} productos registrados con inventario en las 4 sucursales.`);

    // 4. Clientes existentes sin sucursal se asignan a San Lucas
    if (sanLucasSucursal) {
      const act = await prisma.cliente.updateMany({
        where: { sucursalId: null },
        data: { sucursalId: sanLucasSucursal.id },
      });
      if (act.count > 0) {
        console.log(`👥 ${act.count} clientes vinculados a ${sanLucasSucursal.nombre}.`);
      }
    }

    console.log('\n✨ Configuración Multi-Sucursal finalizada exitosamente.');
    return { sucursales: sucursalesCreadas, totalProds };
  } catch (err) {
    console.error('❌ Error en seedSucursalesCatalogo:', err);
    throw err;
  }
}

// Alias para compatibilidad con scripts existentes
export const seedProductosSanLucas = seedSucursalesCatalogo;

// Ejecución directa
if (require.main === module) {
  seedSucursalesCatalogo()
    .catch((err) => {
      console.error(err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
