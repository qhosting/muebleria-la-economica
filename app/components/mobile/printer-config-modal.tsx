
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Bluetooth, 
  BluetoothConnected,
  BluetoothSearching,
  Printer,
  TestTube2,
  Settings,
  AlertTriangle,
  CheckCircle,
  X,
  Laptop
} from 'lucide-react';
import { useBluetoothPrinter } from '@/hooks/use-bluetooth-printer';
import { imprimirTicketTermicoUSB } from '@/lib/ticket-usb-printer';
import { TicketData } from '@/lib/bluetooth-printer';
import { toast } from 'sonner';

interface PrinterConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PrinterConfigModal({ isOpen, onClose }: PrinterConfigModalProps) {
  const {
    isConnected,
    isConnecting,
    connectedDevice,
    isBluetoothAvailable,
    wasConnectedBefore,
    previousDeviceName,
    canReconnect,
    connectToPrinter,
    reconnectToPrinter,
    disconnectFromPrinter,
    printTestPage
  } = useBluetoothPrinter();

  const [isTesting, setIsTesting] = useState(false);
  const [isTestingUSB, setIsTestingUSB] = useState(false);
  const [tipoImpresora, setTipoImpresora] = useState<'usb' | 'bluetooth'>('usb');
  const [anchoPapel, setAnchoPapel] = useState<'80mm' | '58mm'>('80mm');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTipo = localStorage.getItem('ticket_tipo_impresora');
      const savedAncho = localStorage.getItem('ticket_ancho_papel');
      if (savedTipo === 'usb' || savedTipo === 'bluetooth') {
        setTipoImpresora(savedTipo);
      } else if (isConnected) {
        setTipoImpresora('bluetooth');
      } else {
        setTipoImpresora('usb');
      }

      if (savedAncho === '58mm' || savedAncho === '80mm') {
        setAnchoPapel(savedAncho);
      }
    }
  }, [isConnected]);

  const handleCambiarTipo = (tipo: 'usb' | 'bluetooth') => {
    setTipoImpresora(tipo);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ticket_tipo_impresora', tipo);
    }
    toast.success(`Modo de impresión cambiado a ${tipo === 'usb' ? 'USB / PC' : 'Bluetooth'}`);
  };

  const handleCambiarAncho = (ancho: '80mm' | '58mm') => {
    setAnchoPapel(ancho);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ticket_ancho_papel', ancho);
    }
  };

  const handleConnect = async () => {
    await connectToPrinter();
  };

  const handleReconnect = async () => {
    await reconnectToPrinter();
  };

  const handleDisconnect = async () => {
    await disconnectFromPrinter();
  };

  const handleTestPrint = async () => {
    setIsTesting(true);
    try {
      await printTestPage();
    } finally {
      setIsTesting(false);
    }
  };

  const handleTestPrintUSB = async () => {
    setIsTestingUSB(true);
    try {
      const ticketPrueba: TicketData = {
        numeroRecibo: 'PRUEBA-USB',
        cliente: {
          nombreCompleto: 'CLIENTE DE PRUEBA',
          codigoCliente: 'CLI-001',
          telefono: '448-000-0000',
          direccion: 'Av. Principal #123, Centro',
          diaPago: 'Lunes'
        },
        cobrador: {
          nombre: 'Vendedor / Cobrador',
          id: 'TEST-01'
        },
        pago: {
          monto: 500,
          tipoPago: 'regular',
          metodoPago: 'Efectivo',
          concepto: 'Prueba de Impresión USB POS',
          fechaPago: new Date().toISOString()
        },
        saldos: {
          anterior: 2500,
          nuevo: 2000
        },
        empresa: {
          nombre: 'MUEBLERIA LA ECONOMICA',
          direccion: 'San Lucas 3er Cuartel',
          telefono: 'Tel: (448) 123-4567'
        }
      };

      await imprimirTicketTermicoUSB(ticketPrueba, anchoPapel);
      toast.success('Ticket de prueba enviado a impresora USB/PC');
    } catch (err) {
      console.error('Error al imprimir prueba USB:', err);
      toast.error('Error al enviar impresión de prueba USB');
    } finally {
      setIsTestingUSB(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Printer className="w-5 h-5" />
              Configurar Impresión de Comprobantes
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Selector de Modo Predeterminado */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Tipo de Impresora Predeterminada
            </label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={tipoImpresora === 'usb' ? 'default' : 'outline'}
                className="flex items-center justify-center gap-2 h-12"
                onClick={() => handleCambiarTipo('usb')}
              >
                <Laptop className="w-4 h-4" />
                <div className="text-left">
                  <div className="text-xs font-bold leading-none">Impresora USB / PC</div>
                  <div className="text-[10px] opacity-80 mt-0.5">Kiosco & Computadora</div>
                </div>
              </Button>

              <Button
                type="button"
                variant={tipoImpresora === 'bluetooth' ? 'default' : 'outline'}
                className="flex items-center justify-center gap-2 h-12"
                onClick={() => handleCambiarTipo('bluetooth')}
              >
                <Bluetooth className="w-4 h-4" />
                <div className="text-left">
                  <div className="text-xs font-bold leading-none">Bluetooth ESC/POS</div>
                  <div className="text-[10px] opacity-80 mt-0.5">Móvil & Inalámbrica</div>
                </div>
              </Button>
            </div>
          </div>

          {/* Opciones según tipo seleccionado */}
          {tipoImpresora === 'usb' ? (
            <div className="space-y-3">
              <Card className="border-blue-200 bg-blue-50/40 dark:bg-blue-950/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Laptop className="w-4 h-4 text-blue-600" />
                      Impresora de Computadora (USB)
                    </span>
                    <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300 text-xs">
                      Activa
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Ideal para terminales de venta en sucursal y modo Kiosco. Imprime directamente a cualquier impresora térmica de rollo conectada por cable USB (Epson, Xprinter, POS-58, POS-80) o impresora predeterminada del sistema.
                  </p>

                  <Separator />

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium">Ancho del Papel Térmico</label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={anchoPapel === '80mm' ? 'default' : 'outline'}
                        className="text-xs h-8"
                        onClick={() => handleCambiarAncho('80mm')}
                      >
                        80 mm (Estándar POS)
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={anchoPapel === '58mm' ? 'default' : 'outline'}
                        className="text-xs h-8"
                        onClick={() => handleCambiarAncho('58mm')}
                      >
                        58 mm (Compacta)
                      </Button>
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={handleTestPrintUSB}
                    disabled={isTestingUSB}
                    variant="outline"
                    className="w-full text-xs h-9 bg-white dark:bg-slate-900 border-dashed"
                  >
                    <TestTube2 className="w-3.5 h-3.5 mr-2 text-blue-600" />
                    {isTestingUSB ? 'Generando ticket de prueba...' : `Imprimir Prueba USB (${anchoPapel})`}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                    ¿Cómo funciona la impresión USB?
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-[11px] text-muted-foreground space-y-1">
                  <div>• Conecta tu impresora térmica a la computadora por puerto USB.</div>
                  <div>• Al confirmar un cobro o reimprimir un ticket, se abre el cuadro de impresión limpio con corte automático a {anchoPapel}.</div>
                  <div>• Selecciona tu impresora en Windows/Mac y haz clic en Imprimir.</div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Estado de Bluetooth */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Bluetooth className="w-4 h-4" />
                    Estado de Bluetooth
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Disponibilidad
                    </span>
                    <Badge variant={isBluetoothAvailable ? 'default' : 'destructive'}>
                      {isBluetoothAvailable ? 'Disponible' : 'No Disponible'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

          {!isBluetoothAvailable && (
            <div className="flex items-start gap-2 p-3 bg-orange-50 rounded-lg border-l-2 border-orange-400">
              <AlertTriangle className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-orange-800">
                <div className="font-medium">Bluetooth no disponible</div>
                <div className="text-xs mt-1">
                  Asegúrate de que tu dispositivo tenga Bluetooth y que el navegador lo soporte.
                </div>
              </div>
            </div>
          )}

          {/* 🔧 NUEVO: Mensaje de conexión previa */}
          {!isConnected && wasConnectedBefore && previousDeviceName && (
            <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border-l-2 border-blue-400">
              <AlertTriangle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <div className="font-medium">Impresora desconectada</div>
                <div className="text-xs mt-1">
                  Última conexión: <strong>{previousDeviceName}</strong>. Presiona "Conectar Impresora" para reconectar.
                </div>
              </div>
            </div>
          )}

          {/* Estado de Conexión */}
          {isBluetoothAvailable && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  {isConnected ? (
                    <BluetoothConnected className="w-4 h-4" />
                  ) : (
                    <BluetoothSearching className="w-4 h-4" />
                  )}
                  Estado de Impresora
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Conexión
                  </span>
                  <Badge variant={isConnected ? 'default' : 'secondary'}>
                    {isConnected ? 'Conectada' : 'Desconectada'}
                  </Badge>
                </div>

                {connectedDevice && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Dispositivo
                    </span>
                    <span className="text-sm font-medium">
                      {connectedDevice}
                    </span>
                  </div>
                )}

                <Separator />

                {/* Botones de conexión */}
                <div className="space-y-2">
                  {!isConnected ? (
                    <>
                      {canReconnect && (
                        <Button
                          onClick={handleReconnect}
                          disabled={isConnecting}
                          className="w-full"
                          variant="default"
                        >
                          {isConnecting ? (
                            <>
                              <BluetoothSearching className="w-4 h-4 mr-2 animate-pulse" />
                              Reconectando...
                            </>
                          ) : (
                            <>
                              <BluetoothConnected className="w-4 h-4 mr-2" />
                              Reconectar {previousDeviceName || 'Impresora'}
                            </>
                          )}
                        </Button>
                      )}
                      <Button
                        onClick={handleConnect}
                        disabled={isConnecting}
                        className="w-full"
                        variant={canReconnect ? "outline" : "default"}
                      >
                        {isConnecting ? (
                          <>
                            <BluetoothSearching className="w-4 h-4 mr-2 animate-pulse" />
                            Conectando...
                          </>
                        ) : (
                          <>
                            <Bluetooth className="w-4 h-4 mr-2" />
                            {canReconnect ? 'Conectar Otra Impresora' : 'Conectar Impresora'}
                          </>
                        )}
                      </Button>
                    </>
                  ) : (
                    <div className="space-y-2">
                      <Button
                        onClick={handleTestPrint}
                        disabled={isTesting}
                        variant="outline"
                        className="w-full"
                      >
                        {isTesting ? (
                          <>
                            <TestTube2 className="w-4 h-4 mr-2 animate-pulse" />
                            Imprimiendo...
                          </>
                        ) : (
                          <>
                            <TestTube2 className="w-4 h-4 mr-2" />
                            Imprimir Prueba
                          </>
                        )}
                      </Button>

                      <Button
                        onClick={handleDisconnect}
                        variant="destructive"
                        className="w-full"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Desconectar
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Instrucciones */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Instrucciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-start gap-2">
                  <div className="w-4 h-4 flex items-center justify-center bg-primary/10 rounded-full text-primary text-[10px] font-bold flex-shrink-0">
                    1
                  </div>
                  <span>Enciende tu impresora Bluetooth y asegúrate de que esté en modo de emparejamiento</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-4 h-4 flex items-center justify-center bg-primary/10 rounded-full text-primary text-[10px] font-bold flex-shrink-0">
                    2
                  </div>
                  <span>Presiona "Conectar Impresora" y selecciona tu dispositivo de la lista</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-4 h-4 flex items-center justify-center bg-primary/10 rounded-full text-primary text-[10px] font-bold flex-shrink-0">
                    3
                  </div>
                  <span>Prueba la impresión antes de registrar pagos</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {isConnected && (
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border-l-2 border-green-400">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
              <div className="text-sm text-green-800">
                <div className="font-medium">Impresora lista</div>
                <div className="text-xs mt-1">
                  Ahora puedes imprimir tickets de pago automáticamente.
                </div>
              </div>
            </div>
          )}
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
