
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, 
  Shield, 
  Building2, 
  Smartphone, 
  Printer, 
  Database,
  Save,
  RotateCcw
} from 'lucide-react';
import { toast } from 'sonner';

interface ConfiguracionSistema {
  empresa: {
    nombre: string;
    direccion: string;
    telefono: string;
    email: string;
  };
  cobranza: {
    diasGracia: number;
    cargoMoratorio: number;
    requiereTicket: boolean;
    permitirPagoParcial: boolean;
  };
  notificaciones: {
    whatsappEnabled: boolean;
    emailEnabled: boolean;
    smsEnabled: boolean;
    recordatoriosDias: number;
  };
  sincronizacion: {
    intervaloMinutos: number;
    sincronizacionAutomatica: boolean;
    backupAutomatico: boolean;
  };
  impresion: {
    nombreImpresora: string;
    anchoPapel: number;
    cortarPapel: boolean;
  };
}

export default function ConfiguracionPage() {
  const { data: session } = useSession();
  const [config, setConfig] = useState<ConfiguracionSistema>({
    empresa: {
      nombre: 'Mueblería La Económica',
      direccion: 'Av. Principal 123, Col. Centro',
      telefono: '555-1234',
      email: 'contacto@muebleria.com'
    },
    cobranza: {
      diasGracia: 3,
      cargoMoratorio: 50,
      requiereTicket: true,
      permitirPagoParcial: true
    },
    notificaciones: {
      whatsappEnabled: false,
      emailEnabled: true,
      smsEnabled: false,
      recordatoriosDias: 2
    },
    sincronizacion: {
      intervaloMinutos: 15,
      sincronizacionAutomatica: true,
      backupAutomatico: true
    },
    impresion: {
      nombreImpresora: 'Impresora Bluetooth',
      anchoPapel: 80,
      cortarPapel: true
    }
  });
  
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/configuracion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        setSaved(true);
        toast.success('Configuración guardada exitosamente');
        setTimeout(() => setSaved(false), 2000);
      } else {
        throw new Error('Error al guardar');
      }
    } catch (error) {
      toast.error('Error al guardar la configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (confirm('¿Está seguro de restablecer la configuración a valores por defecto?')) {
      // Reset a valores por defecto
      toast.success('Configuración restablecida');
    }
  };

  const testPrinter = async () => {
    try {
      const response = await fetch('/api/test-printer', {
        method: 'POST',
      });
      
      if (response.ok) {
        toast.success('Impresora conectada correctamente');
      } else {
        toast.error('No se pudo conectar con la impresora');
      }
    } catch (error) {
      toast.error('Error al probar la impresora');
    }
  };

  if (!session || (session.user as any)?.role !== 'admin') {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Acceso Denegado</h2>
          <p className="text-gray-600">No tiene permisos para acceder a esta página.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
            <p className="text-gray-600">Configuración general del sistema</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Restablecer
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Guardando...' : saved ? 'Guardado' : 'Guardar'}
            </Button>
          </div>
        </div>

        {/* Información de la empresa */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Información de la Empresa
            </CardTitle>
            <CardDescription>
              Datos básicos de la empresa que aparecerán en tickets y reportes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nombreEmpresa">Nombre de la empresa</Label>
                <Input
                  id="nombreEmpresa"
                  value={config.empresa.nombre}
                  onChange={(e) => setConfig({
                    ...config,
                    empresa: { ...config.empresa, nombre: e.target.value }
                  })}
                />
              </div>
              <div>
                <Label htmlFor="telefonoEmpresa">Teléfono</Label>
                <Input
                  id="telefonoEmpresa"
                  value={config.empresa.telefono}
                  onChange={(e) => setConfig({
                    ...config,
                    empresa: { ...config.empresa, telefono: e.target.value }
                  })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="direccionEmpresa">Dirección</Label>
              <Input
                id="direccionEmpresa"
                value={config.empresa.direccion}
                onChange={(e) => setConfig({
                  ...config,
                  empresa: { ...config.empresa, direccion: e.target.value }
                })}
              />
            </div>
            <div>
              <Label htmlFor="emailEmpresa">Email</Label>
              <Input
                id="emailEmpresa"
                type="email"
                value={config.empresa.email}
                onChange={(e) => setConfig({
                  ...config,
                  empresa: { ...config.empresa, email: e.target.value }
                })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Configuración de cobranza */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuración de Cobranza
            </CardTitle>
            <CardDescription>
              Parámetros para el proceso de cobranza
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="diasGracia">Días de gracia</Label>
                <Input
                  id="diasGracia"
                  type="number"
                  min="0"
                  value={config.cobranza.diasGracia}
                  onChange={(e) => setConfig({
                    ...config,
                    cobranza: { ...config.cobranza, diasGracia: parseInt(e.target.value) || 0 }
                  })}
                />
                <p className="text-sm text-gray-500 mt-1">Días después del vencimiento antes de aplicar mora</p>
              </div>
              <div>
                <Label htmlFor="cargoMoratorio">Cargo moratorio ($)</Label>
                <Input
                  id="cargoMoratorio"
                  type="number"
                  min="0"
                  step="0.01"
                  value={config.cobranza.cargoMoratorio}
                  onChange={(e) => setConfig({
                    ...config,
                    cobranza: { ...config.cobranza, cargoMoratorio: parseFloat(e.target.value) || 0 }
                  })}
                />
              </div>
            </div>
            <Separator />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="requiereTicket">Requerir impresión de ticket</Label>
                  <p className="text-sm text-gray-500">Obligar la impresión de ticket en cada cobro</p>
                </div>
                <Switch
                  id="requiereTicket"
                  checked={config.cobranza.requiereTicket}
                  onCheckedChange={(checked) => setConfig({
                    ...config,
                    cobranza: { ...config.cobranza, requiereTicket: checked }
                  })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="permitirPagoParcial">Permitir pagos parciales</Label>
                  <p className="text-sm text-gray-500">Aceptar pagos menores al monto de la cuota</p>
                </div>
                <Switch
                  id="permitirPagoParcial"
                  checked={config.cobranza.permitirPagoParcial}
                  onCheckedChange={(checked) => setConfig({
                    ...config,
                    cobranza: { ...config.cobranza, permitirPagoParcial: checked }
                  })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configuración de impresión */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Printer className="h-5 w-5" />
              Configuración de Impresión
            </CardTitle>
            <CardDescription>
              Configuración para impresoras térmicas Bluetooth
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nombreImpresora">Nombre de la impresora</Label>
                <Input
                  id="nombreImpresora"
                  value={config.impresion.nombreImpresora}
                  onChange={(e) => setConfig({
                    ...config,
                    impresion: { ...config.impresion, nombreImpresora: e.target.value }
                  })}
                />
              </div>
              <div>
                <Label htmlFor="anchoPapel">Ancho del papel (mm)</Label>
                <Select
                  value={config.impresion.anchoPapel.toString()}
                  onValueChange={(value) => setConfig({
                    ...config,
                    impresion: { ...config.impresion, anchoPapel: parseInt(value) }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="58">58mm</SelectItem>
                    <SelectItem value="80">80mm</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="cortarPapel">Cortar papel automáticamente</Label>
                <p className="text-sm text-gray-500">Enviar comando de corte después de imprimir</p>
              </div>
              <Switch
                id="cortarPapel"
                checked={config.impresion.cortarPapel}
                onCheckedChange={(checked) => setConfig({
                  ...config,
                  impresion: { ...config.impresion, cortarPapel: checked }
                })}
              />
            </div>
            <Button variant="outline" onClick={testPrinter} className="w-full sm:w-auto">
              <Printer className="h-4 w-4 mr-2" />
              Probar Impresora
            </Button>
          </CardContent>
        </Card>

        {/* Sincronización */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Sincronización y Backup
            </CardTitle>
            <CardDescription>
              Configuración de sincronización entre dispositivos móviles y servidor
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="intervaloMinutos">Intervalo de sincronización (minutos)</Label>
              <Select
                value={config.sincronizacion.intervaloMinutos.toString()}
                onValueChange={(value) => setConfig({
                  ...config,
                  sincronizacion: { ...config.sincronizacion, intervaloMinutos: parseInt(value) }
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 minutos</SelectItem>
                  <SelectItem value="15">15 minutos</SelectItem>
                  <SelectItem value="30">30 minutos</SelectItem>
                  <SelectItem value="60">1 hora</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="sincronizacionAutomatica">Sincronización automática</Label>
                  <p className="text-sm text-gray-500">Sincronizar datos automáticamente en segundo plano</p>
                </div>
                <Switch
                  id="sincronizacionAutomatica"
                  checked={config.sincronizacion.sincronizacionAutomatica}
                  onCheckedChange={(checked) => setConfig({
                    ...config,
                    sincronizacion: { ...config.sincronizacion, sincronizacionAutomatica: checked }
                  })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="backupAutomatico">Backup automático</Label>
                  <p className="text-sm text-gray-500">Realizar respaldo diario de la base de datos</p>
                </div>
                <Switch
                  id="backupAutomatico"
                  checked={config.sincronizacion.backupAutomatico}
                  onCheckedChange={(checked) => setConfig({
                    ...config,
                    sincronizacion: { ...config.sincronizacion, backupAutomatico: checked }
                  })}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
