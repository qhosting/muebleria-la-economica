
// Servicio de impresión por Bluetooth para tickets de cobranza
'use client';

// Definiciones de tipos para Web Bluetooth API
declare global {
  interface Navigator {
    bluetooth: Bluetooth;
  }
  
  interface Bluetooth {
    requestDevice(options: RequestDeviceOptions): Promise<BluetoothDevice>;
  }

  interface RequestDeviceOptions {
    filters?: BluetoothLEScanFilter[];
    optionalServices?: BluetoothServiceUUID[];
  }

  interface BluetoothLEScanFilter {
    services?: BluetoothServiceUUID[];
    name?: string;
    namePrefix?: string;
  }

  interface BluetoothDevice {
    id: string;
    name?: string;
    gatt?: BluetoothRemoteGATTServer;
    addEventListener(type: 'gattserverdisconnected', listener: () => void): void;
  }

  interface BluetoothRemoteGATTServer {
    device: BluetoothDevice;
    connected: boolean;
    connect(): Promise<BluetoothRemoteGATTServer>;
    disconnect(): void;
    getPrimaryService(service: BluetoothServiceUUID): Promise<BluetoothRemoteGATTService>;
  }

  interface BluetoothRemoteGATTService {
    device: BluetoothDevice;
    isPrimary: boolean;
    uuid: string;
    getCharacteristic(characteristic: BluetoothServiceUUID): Promise<BluetoothRemoteGATTCharacteristic>;
  }

  interface BluetoothRemoteGATTCharacteristic {
    service: BluetoothRemoteGATTService;
    uuid: string;
    value?: DataView;
    writeValue(value: BufferSource): Promise<void>;
  }

  type BluetoothServiceUUID = string;
}

export interface PrinterConnection {
  device: BluetoothDevice | null;
  server: BluetoothRemoteGATTServer | null;
  service: BluetoothRemoteGATTService | null;
  characteristic: BluetoothRemoteGATTCharacteristic | null;
  isConnected: boolean;
}

export interface TicketData {
  numeroRecibo?: string;
  cliente: {
    nombreCompleto: string;
    telefono?: string;
    direccion: string;
    diaPago: string;
  };
  cobrador: {
    nombre: string;
    id: string;
  };
  pago: {
    monto: number;
    tipoPago: string;
    metodoPago: string;
    concepto?: string;
    fechaPago: string;
  };
  saldos: {
    anterior: number;
    nuevo: number;
  };
  empresa: {
    nombre: string;
    direccion?: string;
    telefono?: string;
  };
}

class BluetoothPrinterService {
  private connection: PrinterConnection = {
    device: null,
    server: null,
    service: null,
    characteristic: null,
    isConnected: false
  };

  private readonly SERVICE_UUID = '000018f0-0000-1000-8000-00805f9b34fb';
  private readonly CHARACTERISTIC_UUID = '00002af1-0000-1000-8000-00805f9b34fb';

  // Comandos ESC/POS básicos
  private readonly ESC = '\x1b';
  private readonly LF = '\x0a';
  private readonly CR = '\x0d';
  private readonly FF = '\x0c';
  private readonly GS = '\x1d';
  
  // Comandos de formato
  private readonly COMMANDS = {
    INIT: this.ESC + '@',
    BOLD_ON: this.ESC + 'E' + '\x01',
    BOLD_OFF: this.ESC + 'E' + '\x00',
    CENTER: this.ESC + 'a' + '\x01',
    LEFT: this.ESC + 'a' + '\x00',
    RIGHT: this.ESC + 'a' + '\x02',
    CUT: this.GS + 'V' + '\x42' + '\x00',
    FEED: this.LF + this.LF + this.LF,
    UNDERLINE_ON: this.ESC + '-' + '\x01',
    UNDERLINE_OFF: this.ESC + '-' + '\x00',
  };

  async isBluetoothAvailable(): Promise<boolean> {
    return 'bluetooth' in navigator && 'requestDevice' in (navigator.bluetooth as any);
  }

  async connectToPrinter(): Promise<boolean> {
    try {
      if (!await this.isBluetoothAvailable()) {
        throw new Error('Bluetooth no está disponible en este dispositivo');
      }

      // Buscar dispositivos Bluetooth
      this.connection.device = await navigator.bluetooth.requestDevice({
        filters: [
          { services: [this.SERVICE_UUID] },
          { namePrefix: 'POS' },
          { namePrefix: 'Printer' },
          { namePrefix: 'RP' },
          { namePrefix: 'MTP' }
        ],
        optionalServices: ['battery_service', 'device_information']
      });

      if (!this.connection.device) {
        throw new Error('No se seleccionó ningún dispositivo');
      }

      // Conectar al servidor GATT
      if (!this.connection.device.gatt) {
        throw new Error('GATT no disponible en el dispositivo');
      }
      
      this.connection.server = await this.connection.device.gatt.connect();
      
      if (!this.connection.server) {
        throw new Error('No se pudo conectar al servidor GATT');
      }

      // Obtener el servicio
      this.connection.service = await this.connection.server.getPrimaryService(this.SERVICE_UUID);
      
      // Obtener la característica
      this.connection.characteristic = await this.connection.service.getCharacteristic(this.CHARACTERISTIC_UUID);

      this.connection.isConnected = true;

      // Listener para desconexión
      this.connection.device.addEventListener('gattserverdisconnected', () => {
        this.connection.isConnected = false;
        console.log('Impresora desconectada');
      });

      return true;
    } catch (error) {
      console.error('Error conectando a impresora:', error);
      this.connection.isConnected = false;
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.connection.device && this.connection.isConnected) {
      this.connection.server?.disconnect();
      this.connection.isConnected = false;
    }
  }

  isConnected(): boolean {
    return this.connection.isConnected;
  }

  getConnectedDevice(): string | null {
    return this.connection.device?.name || null;
  }

  private async sendData(data: string): Promise<void> {
    if (!this.connection.characteristic || !this.connection.isConnected) {
      throw new Error('Impresora no conectada');
    }

    const encoder = new TextEncoder();
    const uint8Array = encoder.encode(data);
    
    // Dividir en chunks para evitar problemas con MTU
    const chunkSize = 20;
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.slice(i, i + chunkSize);
      await this.connection.characteristic.writeValue(chunk);
      // Pequeña pausa entre chunks
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  }

  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private getDayName(dayNumber: string): string {
    const days: { [key: string]: string } = {
      '1': 'LUNES',
      '2': 'MARTES',
      '3': 'MIÉRCOLES',
      '4': 'JUEVES',
      '5': 'VIERNES',
      '6': 'SÁBADO',
      '7': 'DOMINGO'
    };
    return days[dayNumber] || dayNumber;
  }

  private centerText(text: string, width: number = 32): string {
    if (text.length >= width) return text;
    const padding = Math.floor((width - text.length) / 2);
    return ' '.repeat(padding) + text;
  }

  private rightAlignText(text: string, width: number = 32): string {
    if (text.length >= width) return text;
    return ' '.repeat(width - text.length) + text;
  }

  private createDivider(char: string = '-', length: number = 32): string {
    return char.repeat(length);
  }

  async printTicket(ticketData: TicketData): Promise<void> {
    if (!this.connection.isConnected) {
      throw new Error('Impresora no conectada');
    }

    try {
      let ticket = '';

      // Inicializar impresora
      ticket += this.COMMANDS.INIT;

      // Encabezado de empresa
      ticket += this.COMMANDS.CENTER;
      ticket += this.COMMANDS.BOLD_ON;
      ticket += ticketData.empresa.nombre.toUpperCase() + this.LF;
      ticket += this.COMMANDS.BOLD_OFF;
      
      if (ticketData.empresa.direccion) {
        ticket += ticketData.empresa.direccion + this.LF;
      }
      if (ticketData.empresa.telefono) {
        ticket += 'Tel: ' + ticketData.empresa.telefono + this.LF;
      }

      // Separador
      ticket += this.COMMANDS.LEFT;
      ticket += this.createDivider() + this.LF;

      // Título
      ticket += this.COMMANDS.CENTER;
      ticket += this.COMMANDS.BOLD_ON;
      ticket += 'COMPROBANTE DE PAGO' + this.LF;
      ticket += this.COMMANDS.BOLD_OFF;

      if (ticketData.numeroRecibo) {
        ticket += 'No. ' + ticketData.numeroRecibo + this.LF;
      }

      // Separador
      ticket += this.COMMANDS.LEFT;
      ticket += this.createDivider() + this.LF;

      // Información del cliente
      ticket += this.COMMANDS.BOLD_ON;
      ticket += 'CLIENTE:' + this.LF;
      ticket += this.COMMANDS.BOLD_OFF;
      ticket += ticketData.cliente.nombreCompleto + this.LF;
      
      if (ticketData.cliente.telefono) {
        ticket += 'Tel: ' + ticketData.cliente.telefono + this.LF;
      }
      
      ticket += 'Dir: ' + ticketData.cliente.direccion + this.LF;
      ticket += 'Dia Pago: ' + this.getDayName(ticketData.cliente.diaPago) + this.LF;

      // Separador
      ticket += this.createDivider() + this.LF;

      // Información del pago
      ticket += this.COMMANDS.BOLD_ON;
      ticket += 'DETALLE DEL PAGO:' + this.LF;
      ticket += this.COMMANDS.BOLD_OFF;
      
      ticket += 'Fecha: ' + this.formatDate(ticketData.pago.fechaPago) + this.LF;
      ticket += 'Tipo: ' + ticketData.pago.tipoPago.toUpperCase() + this.LF;
      ticket += 'Metodo: ' + ticketData.pago.metodoPago.toUpperCase() + this.LF;
      
      if (ticketData.pago.concepto) {
        ticket += 'Concepto: ' + ticketData.pago.concepto + this.LF;
      }

      // Separador
      ticket += this.createDivider() + this.LF;

      // Importes
      ticket += this.COMMANDS.BOLD_ON;
      ticket += 'IMPORTES:' + this.LF;
      ticket += this.COMMANDS.BOLD_OFF;
      
      ticket += 'Saldo Anterior:' + this.rightAlignText(this.formatCurrency(ticketData.saldos.anterior)) + this.LF;
      ticket += 'Pago Recibido:' + this.rightAlignText(this.formatCurrency(ticketData.pago.monto)) + this.LF;
      ticket += this.createDivider() + this.LF;
      ticket += this.COMMANDS.BOLD_ON;
      ticket += 'Saldo Actual:' + this.rightAlignText(this.formatCurrency(ticketData.saldos.nuevo)) + this.LF;
      ticket += this.COMMANDS.BOLD_OFF;

      // Estado del cliente
      if (ticketData.saldos.nuevo <= 0) {
        ticket += this.LF;
        ticket += this.COMMANDS.CENTER;
        ticket += this.COMMANDS.BOLD_ON;
        ticket += '*** CLIENTE AL DIA ***' + this.LF;
        ticket += this.COMMANDS.BOLD_OFF;
      }

      // Separador
      ticket += this.COMMANDS.LEFT;
      ticket += this.createDivider() + this.LF;

      // Información del cobrador
      ticket += 'Cobrador: ' + ticketData.cobrador.nombre + this.LF;
      ticket += 'ID: ' + ticketData.cobrador.id + this.LF;

      // Separador final
      ticket += this.createDivider() + this.LF;

      // Mensaje final
      ticket += this.COMMANDS.CENTER;
      ticket += 'GRACIAS POR SU PAGO' + this.LF;
      ticket += this.formatDate(new Date().toISOString()) + this.LF;

      // Alimentar papel y cortar
      ticket += this.COMMANDS.FEED;
      ticket += this.COMMANDS.CUT;

      // Enviar a imprimir
      await this.sendData(ticket);

      console.log('Ticket impreso exitosamente');

    } catch (error) {
      console.error('Error imprimiendo ticket:', error);
      throw error;
    }
  }

  async printTestPage(): Promise<void> {
    if (!this.connection.isConnected) {
      throw new Error('Impresora no conectada');
    }

    try {
      let ticket = '';
      
      ticket += this.COMMANDS.INIT;
      ticket += this.COMMANDS.CENTER;
      ticket += this.COMMANDS.BOLD_ON;
      ticket += 'PRUEBA DE IMPRESION' + this.LF;
      ticket += this.COMMANDS.BOLD_OFF;
      ticket += this.createDivider() + this.LF;
      ticket += this.COMMANDS.LEFT;
      ticket += 'Fecha: ' + new Date().toLocaleString() + this.LF;
      ticket += 'Dispositivo: ' + (this.connection.device?.name || 'Desconocido') + this.LF;
      ticket += 'Estado: Conectado' + this.LF;
      ticket += this.createDivider() + this.LF;
      ticket += this.COMMANDS.CENTER;
      ticket += 'Prueba exitosa' + this.LF;
      ticket += this.COMMANDS.FEED;
      ticket += this.COMMANDS.CUT;

      await this.sendData(ticket);

    } catch (error) {
      console.error('Error en prueba de impresión:', error);
      throw error;
    }
  }
}

// Instancia singleton del servicio
export const bluetoothPrinter = new BluetoothPrinterService();
