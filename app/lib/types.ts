
import { UserRole, StatusCuenta, Periodicidad, TipoPago } from '@prisma/client';

export { UserRole, StatusCuenta, Periodicidad, TipoPago };

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Cliente {
  id: string;
  codigoCliente: string;
  fechaVenta: Date;
  nombreCompleto: string;
  telefono?: string;
  vendedor?: string;
  cobradorAsignadoId?: string;
  statusCuenta: StatusCuenta;
  direccionCompleta: string;
  descripcionProducto: string;
  diaPago: string;
  montoPago: number;
  periodicidad: Periodicidad;
  saldoActual: number;
  importe1?: number;
  importe2?: number;
  importe3?: number;
  importe4?: number;
  cobradorAsignado?: User;
  createdAt: Date;
  updatedAt: Date;
}

export interface Pago {
  id: string;
  clienteId: string;
  cobradorId: string;
  monto: number;
  concepto?: string;
  tipoPago: TipoPago;
  fechaPago: Date;
  saldoAnterior: number;
  saldoNuevo: number;
  ticketImpreso: boolean;
  sincronizado: boolean;
  cliente?: Cliente;
  cobrador?: User;
  createdAt: Date;
}

export interface PlantillaTicket {
  id: string;
  nombre: string;
  contenido: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RutaCobranza {
  id: string;
  cobradorId: string;
  fecha: Date;
  clientesVisitados: any;
  totalCobrado: number;
  cobrador?: User;
  createdAt: Date;
}

export interface DashboardStats {
  totalClientes: number;
  clientesActivos: number;
  totalCobradores: number;
  cobranzaHoy: number;
  cobranzaMes: number;
  clientesMorosos: number;
  saldosTotales: number;
}

export interface ReporteCobranza {
  fecha: string;
  cobrador: string;
  totalCobrado: number;
  clientesVisitados: number;
  pagosRegulares: number;
  pagosMoratorios: number;
}

export interface ClienteMoroso {
  id: string;
  codigoCliente: string;
  nombreCompleto: string;
  diasAtraso: number;
  montoVencido: number;
  telefono?: string;
  cobrador?: string;
}
