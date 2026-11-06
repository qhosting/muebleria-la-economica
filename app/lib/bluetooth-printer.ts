
// Servicio de impresión por Bluetooth para tickets de cobranza
'use client';

import { Capacitor } from '@capacitor/core';
import { numeroALetras } from './catalogo-kiosco';

// Lista ampliada de UUIDs de servicios de impresoras térmicas ESC/POS (BLE)
export const KNOWN_PRINTER_SERVICES = [
  '000018f0-0000-1000-8000-00805f9b34fb', // Estándar ESC/POS BLE
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // Xprinter / POS-58
  '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISSC transparent UART (muy popular en POS móviles)
  '0000ffe0-0000-1000-8000-00805f9b34fb', // HM-10 BLE Serial (POS-58, PT-210)
  '0000ff00-0000-1000-8000-00805f9b34fb', // ESC/POS genérico chino
  '0000fee7-0000-1000-8000-00805f9b34fb', // Tencent / Ali POS
  '0000fff0-0000-1000-8000-00805f9b34fb', // Impresoras portátiles
  '0000ae00-0000-1000-8000-00805f9b34fb', // Impresoras térmicas
  '0000af30-0000-1000-8000-00805f9b34fb', // Impresoras térmicas
];

export const KNOWN_WRITE_CHARACTERISTICS = [
  '00002af1-0000-1000-8000-00805f9b34fb',
  'bef8d6c9-9c21-4c9e-b632-bd58c1009f9f',
  '49535343-aca3-481c-91ec-d31002b96163',
  '49535343-8841-43f4-a8d4-ecbe34729bb3',
  '0000ffe1-0000-1000-8000-00805f9b34fb',
  '0000ff02-0000-1000-8000-00805f9b34fb',
  '0000ff01-0000-1000-8000-00805f9b34fb',
  '0000fec7-0000-1000-8000-00805f9b34fb',
  '0000fff2-0000-1000-8000-00805f9b34fb',
  '0000fff1-0000-1000-8000-00805f9b34fb',
  '0000ae01-0000-1000-8000-00805f9b34fb',
  '0000af31-0000-1000-8000-00805f9b34fb',
];

// Definiciones de tipos para Web Bluetooth API
declare global {
  interface Navigator {
    bluetooth: Bluetooth;
  }

  interface Bluetooth {
    requestDevice(options: WebBluetoothRequestDeviceOptions): Promise<WebBluetoothDevice>;
  }

  interface WebBluetoothRequestDeviceOptions {
    filters?: WebBluetoothLEScanFilter[];
    optionalServices?: WebBluetoothServiceUUID[];
    acceptAllDevices?: boolean;
  }

  interface WebBluetoothLEScanFilter {
    services?: WebBluetoothServiceUUID[];
    name?: string;
    namePrefix?: string;
  }

  interface WebBluetoothDevice {
    id: string;
    name?: string;
    gatt?: WebBluetoothRemoteGATTServer;
    addEventListener(type: 'gattserverdisconnected', listener: () => void): void;
  }

  interface WebBluetoothRemoteGATTServer {
    device: WebBluetoothDevice;
    connected: boolean;
    connect(): Promise<WebBluetoothRemoteGATTServer>;
    disconnect(): void;
    getPrimaryService(service: WebBluetoothServiceUUID): Promise<WebBluetoothRemoteGATTService>;
  }

  interface WebBluetoothRemoteGATTService {
    device: WebBluetoothDevice;
    isPrimary: boolean;
    uuid: string;
    getCharacteristic(characteristic: WebBluetoothServiceUUID): Promise<WebBluetoothRemoteGATTCharacteristic>;
  }

  interface WebBluetoothRemoteGATTCharacteristic {
    service: WebBluetoothRemoteGATTService;
    uuid: string;
    value?: DataView;
    writeValue(value: BufferSource): Promise<void>;
  }

  type WebBluetoothServiceUUID = string;
}

export interface PrinterConnection {
  device: WebBluetoothDevice | null;
  server: WebBluetoothRemoteGATTServer | null;
  service: WebBluetoothRemoteGATTService | null;
  characteristic: WebBluetoothRemoteGATTCharacteristic | null;
  isConnected: boolean;
}

export interface TicketData {
  numeroRecibo?: string;
  cliente: {
    nombreCompleto: string;
    codigoCliente?: string;
    descripcionProducto?: string;
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
    montoMoratorio?: number; // Nuevo: Desglose de moratorio
    montoNeto?: number;     // Nuevo: Monto aplicado al saldo
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

export interface VentaTicketData {
  folio: string | number;
  fecha: string;
  cliente: {
    nombre: string;
    telefono?: string;
    direccion: string;
  };
  vendedor: {
    nombre: string;
  };
  tipoVenta: 'contado' | 'credito';
  articulos: Array<{
    concepto: string;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
  }>;
  total: number;
  enganche: number;
  saldoFinanciado: number;
  plazoSemanas?: number;
  montoCuota?: number;
  diaPago?: string;
  empresa?: {
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

  // 📱 Estado para soporte nativo Capacitor (Android / iOS)
  private isNativeDevice = false;
  private nativeDeviceId: string | null = null;
  private nativeDeviceName: string | null = null;
  private nativeServiceUuid: string | null = null;
  private nativeCharacteristicUuid: string | null = null;
  private nativeCanWriteWithoutResponse = false;
  private nativeConnected = false;
  private bleClientInstance: any = null;

  // 🔧 Storage keys para persistencia
  private readonly STORAGE_KEY_CONNECTED = 'bluetooth_printer_connected';
  private readonly STORAGE_KEY_DEVICE_NAME = 'bluetooth_printer_device_name';
  private readonly STORAGE_KEY_DEVICE_ID = 'bluetooth_printer_device_id';

  // 🆕 Variable para reconexión automática
  private lastConnectedDeviceId: string | null = null;

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

  private async getBleClient(): Promise<any> {
    if (this.bleClientInstance) return this.bleClientInstance;
    if (typeof window !== 'undefined' && Capacitor.isNativePlatform()) {
      try {
        const { BleClient } = await import('@capacitor-community/bluetooth-le');
        this.bleClientInstance = BleClient;
        return this.bleClientInstance;
      } catch (err) {
        console.error('Error importando @capacitor-community/bluetooth-le:', err);
        return null;
      }
    }
    return null;
  }

  async isBluetoothAvailable(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    // En app nativa (Android / iOS)
    if (Capacitor.isNativePlatform()) {
      try {
        const BleClient = await this.getBleClient();
        if (!BleClient) return false;
        await BleClient.initialize({ androidNeverForLocation: true });
        return true;
      } catch (e) {
        console.warn('Error verificando Bluetooth nativo:', e);
        return true;
      }
    }

    // En navegador Web (Web Bluetooth API)
    return 'bluetooth' in navigator && typeof (navigator.bluetooth as any)?.requestDevice === 'function';
  }

  // 🔍 Obtener lista de dispositivos emparejados en Android
  async getPairedDevices(): Promise<Array<{ id: string; name: string }>> {
    if (typeof window === 'undefined') return [];

    if (Capacitor.isNativePlatform()) {
      try {
        const BleClient = await this.getBleClient();
        if (!BleClient) return [];
        await BleClient.initialize({ androidNeverForLocation: true });
        const bonded = await BleClient.getBondedDevices();
        return (bonded || []).map((d: any) => ({
          id: d.deviceId,
          name: d.name || `Dispositivo (${d.deviceId.slice(-5)})`
        }));
      } catch (error) {
        console.warn('Error obteniendo dispositivos vinculados en Android:', error);
        return [];
      }
    }
    return [];
  }

  // 🔧 Guardar estado de conexión en localStorage
  private saveConnectionState(connected: boolean, deviceName?: string | null, deviceId?: string | null): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(this.STORAGE_KEY_CONNECTED, connected.toString());
      if (connected && deviceName) {
        localStorage.setItem(this.STORAGE_KEY_DEVICE_NAME, deviceName);
      }
      if (connected && deviceId) {
        localStorage.setItem(this.STORAGE_KEY_DEVICE_ID, deviceId);
        this.lastConnectedDeviceId = deviceId;
      }

      if (!connected) {
        localStorage.setItem(this.STORAGE_KEY_CONNECTED, 'false');
      }
    } catch (error) {
      console.error('Error guardando estado de conexión:', error);
    }
  }

  // 🔧 Cargar estado de conexión desde localStorage
  private loadConnectionState(): { wasConnected: boolean; deviceName: string | null; deviceId: string | null } {
    if (typeof window === 'undefined') {
      return { wasConnected: false, deviceName: null, deviceId: null };
    }

    try {
      const wasConnected = localStorage.getItem(this.STORAGE_KEY_CONNECTED) === 'true';
      const deviceName = localStorage.getItem(this.STORAGE_KEY_DEVICE_NAME);
      const deviceId = localStorage.getItem(this.STORAGE_KEY_DEVICE_ID);

      if (deviceId) {
        this.lastConnectedDeviceId = deviceId;
      }

      return { wasConnected, deviceName, deviceId };
    } catch (error) {
      console.error('Error cargando estado de conexión:', error);
      return { wasConnected: false, deviceName: null, deviceId: null };
    }
  }

  // 🔧 Verificar estado real de conexión GATT Web
  private checkRealConnectionStatus(): boolean {
    if (!this.connection.device || !this.connection.server) {
      return false;
    }
    return this.connection.server.connected === true;
  }

  async connectToPrinter(specificDeviceId?: string): Promise<boolean> {
    try {
      if (!await this.isBluetoothAvailable()) {
        throw new Error('Bluetooth no está disponible en este dispositivo o navegador');
      }

      // ==========================================
      // MODO NATIVO ANDROID / IOS (Capacitor BLE)
      // ==========================================
      if (Capacitor.isNativePlatform()) {
        const BleClient = await this.getBleClient();
        if (!BleClient) {
          throw new Error('Plugin Bluetooth LE nativo no disponible');
        }

        await BleClient.initialize({ androidNeverForLocation: true });

        try {
          const isEnabled = await BleClient.isEnabled();
          if (!isEnabled) {
            await BleClient.requestEnable();
          }
        } catch (e) {
          console.warn('No se pudo verificar o solicitar encendido de Bluetooth:', e);
        }

        let targetDeviceId: string = specificDeviceId || '';
        let targetDeviceName = '';

        if (!targetDeviceId) {
          await BleClient.setDisplayStrings({
            scanning: 'Buscando impresoras Bluetooth...',
            cancel: 'Cancelar',
            availableDevices: 'Impresoras y Dispositivos Encontrados',
            noDeviceFound: 'No se encontraron impresoras cerca'
          });

          // Abre el diálogo de selección nativo de Android
          const selected = await BleClient.requestDevice({
            optionalServices: KNOWN_PRINTER_SERVICES
          });

          if (!selected || !selected.deviceId) {
            throw new Error('No se seleccionó ninguna impresora');
          }

          targetDeviceId = selected.deviceId;
          targetDeviceName = selected.name || 'Impresora Bluetooth';
        }

        console.log(`🔌 Conectando nativamente a impresora: ${targetDeviceId}...`);
        await BleClient.connect(targetDeviceId, (disconnectedId: string) => {
          console.log('⚠️ Impresora desconectada nativamente:', disconnectedId);
          this.nativeConnected = false;
          this.saveConnectionState(false);
        });

        // Descubrir servicios y buscar canal de escritura ESC/POS
        await BleClient.discoverServices(targetDeviceId);
        const services = await BleClient.getServices(targetDeviceId);

        let foundServiceUuid: string | null = null;
        let foundCharUuid: string | null = null;
        let canWriteWithoutResp = false;

        // 1. Priorizar servicios de impresión térmica conocidos
        for (const service of services) {
          const isKnown = KNOWN_PRINTER_SERVICES.some(s => s.toLowerCase() === service.uuid.toLowerCase());
          if (isKnown) {
            for (const char of service.characteristics) {
              if (char.properties.write || char.properties.writeWithoutResponse) {
                foundServiceUuid = service.uuid;
                foundCharUuid = char.uuid;
                canWriteWithoutResp = !!char.properties.writeWithoutResponse;
                break;
              }
            }
          }
          if (foundCharUuid) break;
        }

        // 2. Si no coincide con UUIDs estándar, buscar en cualquier servicio con escritura disponible
        if (!foundCharUuid) {
          const ignoredServices = [
            '00001800-0000-1000-8000-00805f9b34fb', // Generic Access
            '00001801-0000-1000-8000-00805f9b34fb', // Generic Attribute
            '0000180a-0000-1000-8000-00805f9b34fb', // Device Info
            '0000180f-0000-1000-8000-00805f9b34fb', // Battery Service
          ];

          for (const service of services) {
            if (ignoredServices.some(s => s.toLowerCase() === service.uuid.toLowerCase())) continue;
            for (const char of service.characteristics) {
              if (char.properties.write || char.properties.writeWithoutResponse) {
                foundServiceUuid = service.uuid;
                foundCharUuid = char.uuid;
                canWriteWithoutResp = !!char.properties.writeWithoutResponse;
                break;
              }
            }
            if (foundCharUuid) break;
          }
        }

        if (!foundServiceUuid || !foundCharUuid) {
          await BleClient.disconnect(targetDeviceId);
          throw new Error('La impresora no cuenta con un canal de datos ESC/POS compatible');
        }

        this.isNativeDevice = true;
        this.nativeDeviceId = targetDeviceId;
        this.nativeDeviceName = targetDeviceName || this.nativeDeviceName || 'Impresora Bluetooth';
        this.nativeServiceUuid = foundServiceUuid;
        this.nativeCharacteristicUuid = foundCharUuid;
        this.nativeCanWriteWithoutResponse = canWriteWithoutResp;
        this.nativeConnected = true;

        this.saveConnectionState(true, this.nativeDeviceName, this.nativeDeviceId);
        console.log(`✅ Impresora conectada nativamente: ${this.nativeDeviceName}`);
        return true;
      }

      // ==========================================
      // MODO WEB BLUETOOTH API (Chrome / Edge / PWA)
      // ==========================================
      // Permitir cualquier dispositivo Bluetooth disponible
      this.connection.device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          ...KNOWN_PRINTER_SERVICES,
          'battery_service',
          'device_information'
        ]
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

      let activeService: WebBluetoothRemoteGATTService | null = null;
      let activeCharacteristic: WebBluetoothRemoteGATTCharacteristic | null = null;

      // Buscar entre los servicios conocidos
      for (const serviceUuid of KNOWN_PRINTER_SERVICES) {
        try {
          const s = await this.connection.server.getPrimaryService(serviceUuid);
          for (const charUuid of KNOWN_WRITE_CHARACTERISTICS) {
            try {
              const c = await s.getCharacteristic(charUuid);
              if (c) {
                activeService = s;
                activeCharacteristic = c;
                break;
              }
            } catch {}
          }
          if (!activeCharacteristic) {
            try {
              const c = await s.getCharacteristic(this.CHARACTERISTIC_UUID);
              if (c) {
                activeService = s;
                activeCharacteristic = c;
              }
            } catch {}
          }
          if (activeCharacteristic) break;
        } catch {}
      }

      if (!activeService || !activeCharacteristic) {
        throw new Error('No se encontró canal de datos ESC/POS compatible en la impresora');
      }

      this.connection.service = activeService;
      this.connection.characteristic = activeCharacteristic;
      this.connection.isConnected = true;
      this.isNativeDevice = false;

      this.saveConnectionState(true, this.connection.device.name, this.connection.device.id);

      // Listener para desconexión
      this.connection.device.addEventListener('gattserverdisconnected', () => {
        console.log('⚠️ Impresora desconectada (evento GATT Web)');
        this.connection.isConnected = false;
        this.saveConnectionState(false);
      });

      console.log('✅ Impresora conectada vía Web:', this.connection.device.name);
      return true;
    } catch (error) {
      console.error('❌ Error conectando a impresora:', error);
      this.connection.isConnected = false;
      this.nativeConnected = false;
      this.saveConnectionState(false);
      throw error;
    }
  }

  // 🆕 Reconectar a la última impresora guardada
  async reconnectToPrinter(): Promise<boolean> {
    try {
      // Modo Nativo
      if (Capacitor.isNativePlatform()) {
        const saved = this.loadConnectionState();
        if (saved.deviceId) {
          console.log('🔄 Intentando reconectar nativamente a:', saved.deviceName || saved.deviceId);
          return await this.connectToPrinter(saved.deviceId);
        }
        return await this.connectToPrinter();
      }

      // Modo Web: si ya hay un dispositivo en memoria desconectado
      if (this.connection.device && !this.connection.isConnected) {
        console.log('🔄 Intentando reconectar Web a:', this.connection.device.name);

        if (!this.connection.device.gatt) {
          throw new Error('GATT no disponible en el dispositivo');
        }

        this.connection.server = await this.connection.device.gatt.connect();

        if (!this.connection.server) {
          throw new Error('No se pudo reconectar al servidor GATT');
        }

        let activeService: WebBluetoothRemoteGATTService | null = null;
        let activeCharacteristic: WebBluetoothRemoteGATTCharacteristic | null = null;

        for (const serviceUuid of KNOWN_PRINTER_SERVICES) {
          try {
            const s = await this.connection.server.getPrimaryService(serviceUuid);
            for (const charUuid of KNOWN_WRITE_CHARACTERISTICS) {
              try {
                const c = await s.getCharacteristic(charUuid);
                if (c) {
                  activeService = s;
                  activeCharacteristic = c;
                  break;
                }
              } catch {}
            }
            if (activeCharacteristic) break;
          } catch {}
        }

        if (activeService && activeCharacteristic) {
          this.connection.service = activeService;
          this.connection.characteristic = activeCharacteristic;
          this.connection.isConnected = true;
          this.saveConnectionState(true, this.connection.device.name, this.connection.device.id);
          console.log('✅ Impresora reconectada Web:', this.connection.device.name);
          return true;
        }
      }

      return await this.connectToPrinter();
    } catch (error) {
      console.error('❌ Error reconectando a impresora:', error);
      this.connection.isConnected = false;
      this.nativeConnected = false;
      this.saveConnectionState(false);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      if (this.nativeDeviceId) {
        try {
          const BleClient = await this.getBleClient();
          if (BleClient) {
            await BleClient.disconnect(this.nativeDeviceId);
          }
        } catch (e) {
          console.warn('Error al desconectar nativo:', e);
        }
      }
      this.nativeConnected = false;
      this.nativeDeviceId = null;
      this.saveConnectionState(false);
      console.log('🔌 Impresora nativa desconectada manualmente');
      return;
    }

    if (this.connection.device && this.connection.isConnected) {
      this.connection.server?.disconnect();
      this.connection.isConnected = false;
      this.saveConnectionState(false);
      console.log('🔌 Impresora web desconectada manualmente');
    }
  }

  // 🔧 Verificar estado real de conexión
  isConnected(): boolean {
    if (typeof window !== 'undefined' && Capacitor.isNativePlatform()) {
      return this.nativeConnected;
    }

    if (!this.connection.isConnected) {
      return false;
    }

    const realStatus = this.checkRealConnectionStatus();
    if (realStatus !== this.connection.isConnected) {
      console.log('⚠️ Estado de conexión actualizado:', realStatus);
      this.connection.isConnected = realStatus;
      this.saveConnectionState(realStatus, realStatus ? this.connection.device?.name : undefined);
    }

    return this.connection.isConnected;
  }

  getConnectedDevice(): string | null {
    if (!this.isConnected()) {
      return null;
    }

    if (typeof window !== 'undefined' && Capacitor.isNativePlatform()) {
      return this.nativeDeviceName || 'Impresora Bluetooth';
    }

    return this.connection.device?.name || null;
  }

  // 🔧 Método para obtener información del estado guardado
  getStoredConnectionInfo(): { wasConnected: boolean; deviceName: string | null; deviceId: string | null } {
    return this.loadConnectionState();
  }

  // 🆕 Verificar si hay un dispositivo guardado para reconexión
  hasDeviceForReconnection(): boolean {
    return this.connection.device !== null || this.lastConnectedDeviceId !== null || this.nativeDeviceId !== null;
  }

  private async sendData(data: string): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('Impresora no conectada');
    }

    const encoder = new TextEncoder();
    const uint8Array = encoder.encode(data);

    // Modo Nativo Capacitor
    if (Capacitor.isNativePlatform()) {
      const BleClient = await this.getBleClient();
      if (!BleClient || !this.nativeDeviceId || !this.nativeServiceUuid || !this.nativeCharacteristicUuid) {
        throw new Error('Error en el canal de comunicación con la impresora nativa');
      }

      const chunkSize = 20;
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.slice(i, i + chunkSize);
        const dataView = new DataView(chunk.buffer, chunk.byteOffset, chunk.byteLength);

        if (this.nativeCanWriteWithoutResponse) {
          await BleClient.writeWithoutResponse(
            this.nativeDeviceId,
            this.nativeServiceUuid,
            this.nativeCharacteristicUuid,
            dataView
          );
        } else {
          await BleClient.write(
            this.nativeDeviceId,
            this.nativeServiceUuid,
            this.nativeCharacteristicUuid,
            dataView
          );
        }
        await new Promise(resolve => setTimeout(resolve, 15));
      }
      return;
    }

    // Modo Web Bluetooth
    if (!this.connection.characteristic) {
      throw new Error('Canal de impresión no disponible');
    }

    const chunkSize = 20;
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.slice(i, i + chunkSize);
      await this.connection.characteristic.writeValue(chunk);
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
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
    const safeText = text || '';
    if (safeText.length >= width) return safeText.substring(0, width);
    const padding = Math.floor((width - safeText.length) / 2);
    return ' '.repeat(padding) + safeText;
  }

  private rightAlignText(text: string, width: number = 32): string {
    const safeText = text || '';
    if (safeText.length >= width) return safeText.substring(0, width);
    return ' '.repeat(width - safeText.length) + safeText;
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
        const telStr = ticketData.empresa.telefono.toLowerCase().startsWith('tel')
          ? ticketData.empresa.telefono
          : 'Tel: ' + ticketData.empresa.telefono;
        ticket += telStr + this.LF;
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

      // Si hay moratorio, mostrar el desglose
      if (ticketData.pago.montoMoratorio && ticketData.pago.montoMoratorio > 0) {
        ticket += 'Moratorio:' + this.rightAlignText(this.formatCurrency(ticketData.pago.montoMoratorio)) + this.LF;
        const montoNeto = ticketData.pago.montoNeto || (ticketData.pago.monto - (ticketData.pago.montoMoratorio || 0));
        ticket += 'Aplicado Saldo:' + this.rightAlignText(this.formatCurrency(montoNeto)) + this.LF;
        ticket += '-----------' + this.LF;
      }

      ticket += 'Total Recibido:' + this.rightAlignText(this.formatCurrency(ticketData.pago.monto)) + this.LF;
      ticket += this.createDivider() + this.LF;
      ticket += this.COMMANDS.BOLD_ON;
      ticket += 'Saldo Actual:' + this.rightAlignText(this.formatCurrency(ticketData.saldos.nuevo)) + this.LF;
      ticket += this.COMMANDS.BOLD_OFF;

      // Estado del cliente
      if (ticketData.saldos.nuevo <= 0) {
        ticket += this.LF;
        ticket += this.COMMANDS.CENTER;
        ticket += this.COMMANDS.BOLD_ON;
        ticket += '*** CUENTA LIQUIDADA ***' + this.LF;
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
  async printCorte(corteData: {
    cobrador: string;
    fechaDesde: string;
    fechaHasta: string;
    totalGeneral: number;
    totalEfectivo: number;
    totalTransferencia: number;
    cantidadPagos: number;
    detalles?: {
      tipo: string;
      monto: number;
    }[];
  }): Promise<void> {
    if (!this.connection.isConnected) {
      throw new Error('Impresora no conectada');
    }

    try {
      let ticket = '';

      // Inicializar impresora
      ticket += this.COMMANDS.INIT;

      // Encabezado
      ticket += this.COMMANDS.CENTER;
      ticket += this.COMMANDS.BOLD_ON;
      ticket += 'MUEBLERIA LA ECONOMICA' + this.LF;
      ticket += 'CORTE DE CAJA' + this.LF;
      ticket += this.COMMANDS.BOLD_OFF;
      ticket += this.LF;

      ticket += this.COMMANDS.LEFT;
      ticket += 'Cobrador: ' + corteData.cobrador + this.LF;
      ticket += 'Desde: ' + this.formatDate(corteData.fechaDesde).split(' ')[0] + this.LF;
      ticket += 'Hasta: ' + this.formatDate(corteData.fechaHasta).split(' ')[0] + this.LF;
      ticket += 'Fecha Imp: ' + this.formatDate(new Date().toISOString()) + this.LF;
      ticket += this.createDivider() + this.LF;

      // Resumen de Totales
      ticket += this.COMMANDS.BOLD_ON;
      ticket += 'RESUMEN DE COBROS:' + this.LF;
      ticket += this.COMMANDS.BOLD_OFF;
      
      ticket += 'Cant. Pagos:' + this.rightAlignText(corteData.cantidadPagos.toString()) + this.LF;
      ticket += this.LF;

      ticket += 'EFECTIVO:' + this.rightAlignText(this.formatCurrency(corteData.totalEfectivo)) + this.LF;
      ticket += 'TRANSFERENCIA:' + this.rightAlignText(this.formatCurrency(corteData.totalTransferencia)) + this.LF;
      
      ticket += this.createDivider('-') + this.LF;
      ticket += this.COMMANDS.BOLD_ON;
      ticket += 'TOTAL GENERAL:' + this.rightAlignText(this.formatCurrency(corteData.totalGeneral)) + this.LF;
      ticket += this.COMMANDS.BOLD_OFF;
      
      ticket += this.createDivider('=') + this.LF;
      ticket += this.LF;

      // Mensaje final
      ticket += this.COMMANDS.CENTER;
      ticket += 'FIN DE REPORTE' + this.LF;
      
      // Alimentar papel y cortar
      ticket += this.COMMANDS.FEED;
      ticket += this.COMMANDS.CUT;

      // Enviar a imprimir
      await this.sendData(ticket);

      console.log('Reporte de corte impreso exitosamente');

    } catch (error) {
      console.error('Error imprimiendo corte:', error);
      throw error;
    }
  }

  async printVentaTicket(data: VentaTicketData): Promise<void> {
    if (!this.connection.isConnected) {
      throw new Error('Impresora no conectada');
    }

    try {
      let ticket = '';
      ticket += this.COMMANDS.INIT;

      // Encabezado
      ticket += this.COMMANDS.CENTER;
      ticket += this.COMMANDS.BOLD_ON;
      ticket += (data.empresa?.nombre || 'MUEBLERIA LA ECONOMICA').toUpperCase() + this.LF;
      ticket += this.COMMANDS.BOLD_OFF;

      if (data.empresa?.direccion) {
        ticket += data.empresa.direccion + this.LF;
      }
      if (data.empresa?.telefono) {
        ticket += 'Tel: ' + data.empresa.telefono + this.LF;
      }

      ticket += this.createDivider() + this.LF;
      ticket += this.COMMANDS.CENTER;
      ticket += this.COMMANDS.BOLD_ON;
      ticket += (data.tipoVenta === 'credito' ? 'NOTA DE VENTA A CREDITO' : 'NOTA DE VENTA DE CONTADO') + this.LF;
      ticket += 'FOLIO: #' + data.folio + this.LF;
      ticket += this.COMMANDS.BOLD_OFF;
      ticket += this.createDivider() + this.LF;

      ticket += this.COMMANDS.LEFT;
      ticket += 'Fecha: ' + this.formatDate(data.fecha) + this.LF;
      ticket += 'Asesor: ' + data.vendedor.nombre + this.LF;
      ticket += 'Cliente: ' + data.cliente.nombre + this.LF;
      if (data.cliente.telefono) ticket += 'Tel: ' + data.cliente.telefono + this.LF;
      if (data.cliente.direccion) ticket += 'Dir: ' + data.cliente.direccion + this.LF;
      ticket += this.createDivider() + this.LF;

      // Artículos
      ticket += this.COMMANDS.BOLD_ON;
      ticket += 'ARTICULOS:' + this.LF;
      ticket += this.COMMANDS.BOLD_OFF;
      data.articulos.forEach(art => {
        ticket += `${art.cantidad}x ${art.concepto}` + this.LF;
        ticket += this.rightAlignText(this.formatCurrency(art.subtotal)) + this.LF;
      });
      ticket += this.createDivider('-') + this.LF;

      // Totales
      ticket += this.COMMANDS.BOLD_ON;
      ticket += 'TOTAL:' + this.rightAlignText(this.formatCurrency(data.total)) + this.LF;
      if (data.tipoVenta === 'credito') {
        ticket += 'ENGANCHE:' + this.rightAlignText(this.formatCurrency(data.enganche)) + this.LF;
        ticket += 'SALDO A CREDITO:' + this.rightAlignText(this.formatCurrency(data.saldoFinanciado)) + this.LF;
        if (data.plazoSemanas && data.montoCuota) {
          ticket += `PLAZO: ${data.plazoSemanas} SEMANAS` + this.LF;
          ticket += `PAGO SEMANAL:` + this.rightAlignText(this.formatCurrency(data.montoCuota)) + this.LF;
        }
        if (data.diaPago) {
          ticket += 'DIA DE COBRO: ' + this.getDayName(data.diaPago) + this.LF;
        }
      }
      ticket += this.COMMANDS.BOLD_OFF;

      // Monto con letra formal en Pesos M.N. / MXN
      const saldoOtotal = data.tipoVenta === 'credito' && (data.saldoFinanciado || 0) > 0
        ? data.saldoFinanciado
        : data.total;
      const montoLetra = numeroALetras(saldoOtotal);

      ticket += this.createDivider('-') + this.LF;
      ticket += this.COMMANDS.BOLD_ON;
      ticket += 'CANTIDAD CON LETRA (PESOS M.N.):' + this.LF;
      ticket += this.COMMANDS.BOLD_OFF;
      ticket += `(${montoLetra})` + this.LF;

      if (data.tipoVenta === 'credito') {
        ticket += this.createDivider('-') + this.LF;
        ticket += this.COMMANDS.CENTER;
        ticket += this.COMMANDS.BOLD_ON;
        ticket += 'PAGARE MERCANTIL' + this.LF;
        ticket += this.COMMANDS.BOLD_OFF;
        ticket += this.COMMANDS.LEFT;
        ticket += `Debo(emos) y pagare(mos) incondicionalmente a la orden de MUEBLERIA LA ECONOMICA la cantidad de ${this.formatCurrency(saldoOtotal)} M.N. (${montoLetra}) en los plazos convenidos.` + this.LF;
      }

      ticket += this.createDivider('=') + this.LF;
      ticket += this.LF;
      ticket += this.COMMANDS.CENTER;
      ticket += 'FIRMA DE CONFORMIDAD' + this.LF;
      ticket += this.LF + this.LF;
      ticket += this.createDivider('_', 22) + this.LF;
      ticket += 'Gracias por su preferencia' + this.LF;

      ticket += this.COMMANDS.FEED;
      ticket += this.COMMANDS.CUT;

      await this.sendData(ticket);
      console.log('Ticket de venta impreso exitosamente');
    } catch (error) {
      console.error('Error imprimiendo ticket de venta:', error);
      throw error;
    }
  }
}

// Instancia singleton del servicio
export const bluetoothPrinter = new BluetoothPrinterService();
