
// Hook para manejar la impresora Bluetooth
'use client';

import { useState, useEffect } from 'react';
import { bluetoothPrinter, TicketData } from '@/lib/bluetooth-printer';
import { toast } from 'sonner';

export function useBluetoothPrinter() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState<string | null>(null);
  const [isBluetoothAvailable, setIsBluetoothAvailable] = useState(false);
  const [wasConnectedBefore, setWasConnectedBefore] = useState(false);
  const [previousDeviceName, setPreviousDeviceName] = useState<string | null>(null);

  useEffect(() => {
    checkBluetoothAvailability();
    loadPreviousConnectionState();
    updateConnectionStatus();
    
    // 🔧 NUEVO: Verificar estado cada 5 segundos
    const intervalId = setInterval(() => {
      updateConnectionStatus();
    }, 5000);
    
    return () => clearInterval(intervalId);
  }, []);

  const checkBluetoothAvailability = async () => {
    const available = await bluetoothPrinter.isBluetoothAvailable();
    setIsBluetoothAvailable(available);
  };

  // 🔧 NUEVO: Cargar estado previo de conexión
  const loadPreviousConnectionState = () => {
    const stored = bluetoothPrinter.getStoredConnectionInfo();
    setWasConnectedBefore(stored.wasConnected);
    setPreviousDeviceName(stored.deviceName);
    
    if (stored.wasConnected && stored.deviceName) {
      console.log(`ℹ️ Impresora estaba conectada: ${stored.deviceName}`);
      console.log('💡 Presiona "Conectar Impresora" para reconectar');
    }
  };

  const updateConnectionStatus = () => {
    const connected = bluetoothPrinter.isConnected();
    const device = bluetoothPrinter.getConnectedDevice();
    
    setIsConnected(connected);
    setConnectedDevice(device);
  };

  const connectToPrinter = async (): Promise<boolean> => {
    if (!isBluetoothAvailable) {
      toast.error('Bluetooth no está disponible');
      return false;
    }

    setIsConnecting(true);

    try {
      const success = await bluetoothPrinter.connectToPrinter();
      
      if (success) {
        updateConnectionStatus();
        toast.success('Impresora conectada exitosamente');
        return true;
      }
      
      return false;
    } catch (error: any) {
      const message = error.message || 'Error conectando a la impresora';
      toast.error(message);
      return false;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectFromPrinter = async () => {
    try {
      await bluetoothPrinter.disconnect();
      updateConnectionStatus();
      toast.success('Impresora desconectada');
    } catch (error: any) {
      toast.error('Error desconectando impresora');
    }
  };

  const printTicket = async (ticketData: TicketData): Promise<boolean> => {
    if (!isConnected) {
      toast.error('Impresora no conectada');
      return false;
    }

    try {
      await bluetoothPrinter.printTicket(ticketData);
      toast.success('Ticket impreso exitosamente');
      return true;
    } catch (error: any) {
      const message = error.message || 'Error imprimiendo ticket';
      toast.error(message);
      return false;
    }
  };

  const printTestPage = async (): Promise<boolean> => {
    if (!isConnected) {
      toast.error('Impresora no conectada');
      return false;
    }

    try {
      await bluetoothPrinter.printTestPage();
      toast.success('Página de prueba impresa');
      return true;
    } catch (error: any) {
      toast.error('Error en prueba de impresión');
      return false;
    }
  };

  return {
    isConnected,
    isConnecting,
    connectedDevice,
    isBluetoothAvailable,
    wasConnectedBefore,
    previousDeviceName,
    connectToPrinter,
    disconnectFromPrinter,
    printTicket,
    printTestPage,
    updateConnectionStatus
  };
}
