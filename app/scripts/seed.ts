
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seeders...');

  try {
    // Limpiar datos existentes
    console.log('🧹 Limpiando datos existentes...');
    await prisma.pago.deleteMany();
    await prisma.rutaCobranza.deleteMany();
    await prisma.cliente.deleteMany();
    await prisma.plantillaTicket.deleteMany();
    await prisma.user.deleteMany();

    // Crear usuarios esenciales únicamente
    console.log('👤 Creando usuarios esenciales...');
    
    // Usuario admin
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@economica.local' },
      update: {},
      create: {
        email: 'admin@economica.local',
        name: 'Administrador Sistema',
        password: await bcrypt.hash('admin123', 12),
        role: 'admin',
        isActive: true,
      },
    });

    // Usuario gestor de cobranza
    const gestorUser = await prisma.user.upsert({
      where: { email: 'gestor@economica.local' },
      update: {},
      create: {
        email: 'gestor@economica.local',
        name: 'Gestor de Cobranza',
        password: await bcrypt.hash('gestor123', 12),
        role: 'gestor_cobranza',
        isActive: true,
      },
    });

    // Usuario cobrador
    const cobradorUser = await prisma.user.upsert({
      where: { email: 'cobrador@economica.local' },
      update: {},
      create: {
        email: 'cobrador@economica.local',
        name: 'Cobrador de Campo',
        password: await bcrypt.hash('cobrador123', 12),
        role: 'cobrador',
        isActive: true,
      },
    });

    // Usuario de reportes
    const reporteUser = await prisma.user.upsert({
      where: { email: 'reportes@economica.local' },
      update: {},
      create: {
        email: 'reportes@economica.local',
        name: 'Usuario de Reportes',
        password: await bcrypt.hash('reportes123', 12),
        role: 'reporte_cobranza',
        isActive: true,
      },
    });

    const cobradores = [cobradorUser];

    console.log('✅ Usuarios creados exitosamente');

    // Crear plantillas de ticket
    console.log('🎫 Creando plantillas de ticket...');
    
    await prisma.plantillaTicket.upsert({
      where: { nombre: 'Ticket Estándar' },
      update: {},
      create: {
        nombre: 'Ticket Estándar',
        contenido: `
================================
    MUEBLERÍA LA ECONÓMICA
================================
Cliente: {{cliente_nombre}}
Código: {{cliente_codigo}}
Fecha: {{fecha}}
--------------------------------
Concepto: {{concepto}}
Monto: {{monto}}
--------------------------------
Saldo Anterior: {{saldo_anterior}}
Saldo Nuevo: {{saldo_nuevo}}
--------------------------------
Cobrador: {{cobrador}}
================================
        ¡Gracias por su pago!
================================
        `.trim(),
        isActive: true,
      },
    });

    await prisma.plantillaTicket.upsert({
      where: { nombre: 'Ticket Compacto' },
      update: {},
      create: {
        nombre: 'Ticket Compacto',
        contenido: `
MUEBLERÍA LA ECONÓMICA
{{cliente_nombre}} - {{cliente_codigo}}
{{fecha}} - {{concepto}}
Monto: {{monto}}
Saldo: {{saldo_anterior}} → {{saldo_nuevo}}
Cobrador: {{cobrador}}
        `.trim(),
        isActive: true,
      },
    });

    console.log('✅ Plantillas de ticket creadas');

    // Crear clientes
    console.log('👥 Creando clientes...');

    const clientesData = [
      {
        nombreCompleto: 'Roberto Sánchez García',
        telefono: '555-1234',
        direccion: 'Av. Principal 123, Col. Centro',
        descripcionProducto: 'Juego de sala 3 piezas color café',
        diaPago: '1', // Lunes
        montoPago: 500,
        periodicidad: 'semanal' as const,
        saldoActual: 2500,
        cobrador: gestorUser.id, // Asignado al gestor
        vendedor: 'Mario López'
      },
      {
        nombreCompleto: 'Carmen Morales Vázquez',
        telefono: '555-5678',
        direccion: 'Calle 5 de Mayo 456, Col. Reforma',
        descripcionProducto: 'Recámara matrimonial 6 piezas',
        diaPago: '2', // Martes
        montoPago: 750,
        periodicidad: 'quincenal' as const,
        saldoActual: 4500,
        cobrador: gestorUser.id, // Asignado al gestor
        vendedor: 'Sandra Cruz'
      },
      {
        nombreCompleto: 'José Antonio Jiménez',
        telefono: '555-9012',
        direccion: 'Av. Revolución 789, Col. Industrial',
        descripcionProducto: 'Comedor 6 sillas madera',
        diaPago: '3', // Miércoles
        montoPago: 600,
        periodicidad: 'semanal' as const,
        saldoActual: 1800,
        cobrador: gestorUser.id, // Asignado al gestor
        vendedor: 'Mario López'
      },
      {
        nombreCompleto: 'María Elena Fernández',
        telefono: '555-3456',
        direccion: 'Calle Hidalgo 321, Col. Centro',
        descripcionProducto: 'Ropero 3 puertas con espejo',
        diaPago: '4', // Jueves
        montoPago: 400,
        periodicidad: 'semanal' as const,
        saldoActual: 1600,
        cobrador: cobradorUser.id,
        vendedor: 'Sandra Cruz'
      },
      {
        nombreCompleto: 'Pedro Ramírez Castro',
        telefono: '555-7890',
        direccion: 'Av. Juárez 654, Col. San José',
        descripcionProducto: 'Sala esquinera gris con cojines',
        diaPago: '5', // Viernes
        montoPago: 800,
        periodicidad: 'quincenal' as const,
        saldoActual: 3200,
        cobrador: cobradorUser.id,
        vendedor: 'Mario López'
      },
      {
        nombreCompleto: 'Guadalupe Torres Luna',
        telefono: '555-2468',
        direccion: 'Calle Morelos 987, Col. Moderna',
        descripcionProducto: 'Juego de mesa y 4 sillas',
        diaPago: '1', // Lunes
        montoPago: 350,
        periodicidad: 'semanal' as const,
        saldoActual: 1050,
        cobrador: cobradorUser.id,
        vendedor: 'Sandra Cruz'
      },
      {
        nombreCompleto: 'Francisco Herrera Díaz',
        telefono: '555-1357',
        direccion: 'Av. Independencia 147, Col. Libertad',
        descripcionProducto: 'Recámara individual juvenil',
        diaPago: '6', // Sábado
        montoPago: 450,
        periodicidad: 'semanal' as const,
        saldoActual: 2250,
        cobrador: cobradorUser.id,
        vendedor: 'Mario López'
      },
      {
        nombreCompleto: 'Rosa María Gutiérrez',
        telefono: '555-8642',
        direccion: 'Calle Aldama 258, Col. Progreso',
        descripcionProducto: 'Comedor redondo 4 personas',
        diaPago: '2', // Martes
        montoPago: 550,
        periodicidad: 'quincenal' as const,
        saldoActual: 2750,
        cobrador: cobradorUser.id,
        vendedor: 'Sandra Cruz'
      },
      {
        nombreCompleto: 'Miguel Ángel Vargas',
        telefono: '555-9753',
        direccion: 'Av. Constitución 369, Col. Nueva',
        descripcionProducto: 'Sala 3-2-1 color beige',
        diaPago: '3', // Miércoles
        montoPago: 700,
        periodicidad: 'semanal' as const,
        saldoActual: 0, // Cliente al corriente
        cobrador: cobradorUser.id,
        vendedor: 'Mario López'
      },
      {
        nombreCompleto: 'Ana Luz Mendoza',
        telefono: '555-1593',
        direccion: 'Calle Victoria 741, Col. Esperanza',
        descripcionProducto: 'Centro de entretenimiento',
        diaPago: '4', // Jueves
        montoPago: 300,
        periodicidad: 'semanal' as const,
        saldoActual: 900,
        cobrador: cobradorUser.id,
        vendedor: 'Sandra Cruz'
      },
    ];

    // Función para generar código de cliente
    function generarCodigoCliente(index: number): string {
      const fecha = new Date();
      const año = fecha.getFullYear().toString().slice(-2);
      const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
      const numero = (index + 1).toString().padStart(4, '0');
      return `CLI${año}${mes}${numero}`;
    }

    const clientes = [];
    
    for (let i = 0; i < clientesData.length; i++) {
      const clienteData = clientesData[i];
      const cliente = await prisma.cliente.create({
        data: {
          codigoCliente: generarCodigoCliente(i),
          fechaVenta: new Date(Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000), // Fecha aleatoria últimos 90 días
          nombreCompleto: clienteData.nombreCompleto,
          telefono: clienteData.telefono,
          vendedor: clienteData.vendedor,
          cobradorAsignadoId: clienteData.cobrador,
          statusCuenta: 'activo',
          direccionCompleta: clienteData.direccion,
          descripcionProducto: clienteData.descripcionProducto,
          diaPago: clienteData.diaPago,
          montoPago: clienteData.montoPago,
          periodicidad: clienteData.periodicidad,
          saldoActual: clienteData.saldoActual,
          importe1: clienteData.montoPago * 10, // Precio total estimado
        },
      });
      clientes.push(cliente);
    }

    // Generar más clientes para llegar a 200
    console.log('👥 Generando clientes adicionales...');
    
    const nombres = [
      'Juan Carlos López', 'María José Martín', 'Pedro Antonio Silva', 'Ana Cristina Ramos',
      'Luis Fernando Torres', 'Carmen Esperanza Vega', 'José Miguel Herrera', 'Rosa Elena Castro',
      'Ricardo Alejandro Ruiz', 'Patricia Guadalupe Morales', 'Fernando Gabriel Ortiz', 'Leticia Fernández',
      'Arturo Ramón Díaz', 'Esperanza Luna Rivera', 'Manuel Eduardo Guerrero', 'Silvia Patricia Mendoza',
      'Roberto Carlos Jiménez', 'Martha Alicia Vargas', 'Sergio Daniel Romero', 'Isabel Cristina Aguilar'
    ];

    const calles = [
      'Av. Benito Juárez', 'Calle Miguel Hidalgo', 'Av. Insurgentes', 'Calle Morelos',
      'Av. Revolución', 'Calle Allende', 'Av. Constitución', 'Calle Aldama',
      'Av. Independencia', 'Calle Victoria', 'Av. Reforma', 'Calle Guerrero',
      'Av. Madero', 'Calle Zaragoza', 'Av. Cuauhtémoc', 'Calle Matamoros'
    ];

    const colonias = [
      'Centro', 'Reforma', 'Industrial', 'San José', 'Moderna', 'Libertad',
      'Progreso', 'Nueva', 'Esperanza', 'Popular', 'Obrera', 'Jardines',
      'Valle', 'Lomas', 'Vista Hermosa', 'Las Flores'
    ];

    const productos = [
      'Sala 3 piezas moderna', 'Recámara matrimonial completa', 'Comedor 6 personas',
      'Juego de sala esquinera', 'Ropero 4 puertas', 'Mesa de centro cristal',
      'Recámara individual', 'Comedor redondo', 'Sala reclinable', 'Centro entretenimiento',
      'Tocador con espejo', 'Mesa de computadora', 'Librero 5 repisas', 'Cama king size',
      'Juego de mesas nido', 'Bancas de cocina'
    ];

    const vendedores = ['Mario López', 'Sandra Cruz', 'Roberto Mendoza', 'Diana Flores'];

    for (let i = clientesData.length; i < 200; i++) {
      const nombre = nombres[Math.floor(Math.random() * nombres.length)];
      const calle = calles[Math.floor(Math.random() * calles.length)];
      const colonia = colonias[Math.floor(Math.random() * colonias.length)];
      const producto = productos[Math.floor(Math.random() * productos.length)];
      const vendedor = vendedores[Math.floor(Math.random() * vendedores.length)];
      
      // Asignar algunos clientes al gestor (30%) y el resto a cobradores
      const todosCobradores = [...cobradores, gestorUser];
      const cobrador = Math.random() < 0.30 ? gestorUser : cobradores[Math.floor(Math.random() * cobradores.length)];
      
      const montoPago = [300, 400, 500, 600, 700, 800][Math.floor(Math.random() * 6)];
      const periodicidad = ['semanal', 'quincenal'][Math.floor(Math.random() * 2)] as 'semanal' | 'quincenal';
      const saldoActual = Math.random() > 0.3 ? montoPago * Math.floor(Math.random() * 8) : 0; // 70% tienen saldo
      
      const cliente = await prisma.cliente.create({
        data: {
          codigoCliente: generarCodigoCliente(i),
          fechaVenta: new Date(Date.now() - Math.floor(Math.random() * 180) * 24 * 60 * 60 * 1000),
          nombreCompleto: nombre,
          telefono: `555-${Math.floor(Math.random() * 9000) + 1000}`,
          vendedor,
          cobradorAsignadoId: cobrador.id,
          statusCuenta: Math.random() > 0.95 ? 'inactivo' : 'activo', // 5% inactivos
          direccionCompleta: `${calle} ${Math.floor(Math.random() * 999) + 100}, Col. ${colonia}`,
          descripcionProducto: producto,
          diaPago: (Math.floor(Math.random() * 7) + 1).toString(),
          montoPago,
          periodicidad,
          saldoActual,
          importe1: montoPago * (Math.floor(Math.random() * 15) + 8), // 8-22 pagos
        },
      });
      clientes.push(cliente);
    }

    console.log('✅ 200 clientes creados exitosamente');

    // Crear algunos pagos de ejemplo
    console.log('💰 Creando pagos de ejemplo...');

    const pagosEjemplo = [
      {
        clienteId: clientes[0].id,
        cobradorId: cobradorUser.id,
        monto: 500,
        tipoPago: 'regular' as const,
        concepto: 'Pago semanal',
        fechaPago: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Hace 7 días
        saldoAnterior: 3000,
        saldoNuevo: 2500,
      },
      {
        clienteId: clientes[1].id,
        cobradorId: cobradorUser.id,
        monto: 750,
        tipoPago: 'regular' as const,
        concepto: 'Pago quincenal',
        fechaPago: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // Hace 14 días
        saldoAnterior: 5250,
        saldoNuevo: 4500,
      },
      {
        clienteId: clientes[2].id,
        cobradorId: cobradorUser.id,
        monto: 600,
        tipoPago: 'regular' as const,
        concepto: 'Pago semanal',
        fechaPago: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // Hace 3 días
        saldoAnterior: 2400,
        saldoNuevo: 1800,
      },
      {
        clienteId: clientes[0].id,
        cobradorId: cobradorUser.id,
        monto: 100,
        tipoPago: 'moratorio' as const,
        concepto: 'Recargo por atraso',
        fechaPago: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Hace 2 días
        saldoAnterior: 2500,
        saldoNuevo: 2500, // No afecta saldo principal
      },
    ];

    for (const pagoData of pagosEjemplo) {
      await prisma.pago.create({
        data: {
          ...pagoData,
          ticketImpreso: true,
          sincronizado: true,
        },
      });
    }

    // Generar más pagos distribuidos en los últimos 30 días
    const clientesConSaldo = clientes.filter(c => Number(c.saldoActual) < (Number(c.importe1) || Number(c.montoPago) * 10));
    
    for (let i = 0; i < 50; i++) {
      const cliente = clientesConSaldo[Math.floor(Math.random() * clientesConSaldo.length)];
      const cobrador = cobradores.find(c => c.id === cliente.cobradorAsignadoId);
      
      if (cobrador) {
        const fechaPago = new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000);
        const montoClientePago = Number(cliente.montoPago);
        const montoPago = Math.random() > 0.8 ? montoClientePago / 2 : montoClientePago; // 20% pagos parciales
        const saldoAnterior = Number(cliente.saldoActual) + montoPago;
        
        await prisma.pago.create({
          data: {
            clienteId: cliente.id,
            cobradorId: cobrador.id,
            monto: montoPago,
            tipoPago: Math.random() > 0.9 ? 'moratorio' : 'regular', // 10% moratorios
            concepto: Math.random() > 0.9 ? 'Pago moratorio' : 'Pago de cuota',
            fechaPago,
            saldoAnterior,
            saldoNuevo: Math.random() > 0.9 ? saldoAnterior : saldoAnterior - montoPago,
            ticketImpreso: Math.random() > 0.2,
            sincronizado: true,
          },
        });
      }
    }

    console.log('✅ Pagos de ejemplo creados');

    // Crear rutas de cobranza
    console.log('🛣️ Creando rutas de cobranza...');

    for (let i = 0; i < 10; i++) {
      const cobrador = cobradores[Math.floor(Math.random() * cobradores.length)];
      const fecha = new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000);
      const clientesVisitados = Math.floor(Math.random() * 8) + 3; // 3-10 clientes
      const totalCobrado = (Math.floor(Math.random() * 3000) + 1000); // 1000-4000 pesos

      await prisma.rutaCobranza.create({
        data: {
          cobradorId: cobrador.id,
          fecha,
          clientesVisitados: {
            total: clientesVisitados,
            exitosos: Math.floor(clientesVisitados * 0.7),
            fallidos: Math.floor(clientesVisitados * 0.3),
          },
          totalCobrado,
        },
      });
    }

    console.log('✅ Rutas de cobranza creadas');

    console.log('\n🎉 ¡Seeders completados exitosamente!');
    console.log('\n📊 Resumen de datos creados:');
    console.log(`- ${await prisma.user.count()} usuarios`);
    console.log(`- ${await prisma.cliente.count()} clientes`);
    console.log(`- ${await prisma.pago.count()} pagos`);
    console.log(`- ${await prisma.plantillaTicket.count()} plantillas de ticket`);
    console.log(`- ${await prisma.rutaCobranza.count()} rutas de cobranza`);

    console.log('\n🔑 Credenciales de acceso (Solo usuarios esenciales):');
    console.log('👑 Admin:    admin@economica.local / admin123');
    console.log('👤 Gestor:   gestor@economica.local / gestor123');
    console.log('🚚 Cobrador: cobrador@economica.local / cobrador123');
    console.log('📊 Reportes: reportes@economica.local / reportes123');

  } catch (error) {
    console.error('❌ Error al ejecutar seeders:', error);
    throw error;
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
