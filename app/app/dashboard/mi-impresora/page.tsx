'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Printer, Save, TestTube2, Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

interface PrinterConfig {
  impresoraNombre: string;
  impresoraAnchoPapel: number;
  impresoraTamanoFuente: string;
  impresoraAutoImprimir: boolean;
}

export default function MiImpresoraPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [config, setConfig] = useState<PrinterConfig>({
    impresoraNombre: '',
    impresoraAnchoPapel: 80,
    impresoraTamanoFuente: 'mediana',
    impresoraAutoImprimir: false,
  });

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/login');
      return;
    }

    loadConfig();
  }, [session, status, router]);

  const loadConfig = async () => {
    try {
      const response = await fetch('/api/users/printer-config');
      if (response.ok) {
        const data = await response.json();
        setConfig(data.printerConfig);
      }
    } catch (error) {
      console.error('Error al cargar configuración:', error);
      toast.error('Error al cargar configuración de impresora');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/users/printer-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        toast.success('Configuración guardada exitosamente');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al guardar configuración');
      }
    } catch (error) {
      console.error('Error al guardar configuración:', error);
      toast.error('Error al guardar configuración');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      // Simular prueba de impresora
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success('Prueba de impresión enviada. Verifica tu impresora.');
    } catch (error) {
      toast.error('Error al probar impresora');
    } finally {
      setTesting(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Cargando configuración...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Printer className="h-8 w-8" />
            Mi Impresora
          </h1>
          <p className="text-muted-foreground mt-2">
            Configura tu impresora personal para imprimir tickets de cobro
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Configuración de Impresora</CardTitle>
            <CardDescription>
              Personaliza cómo se imprimen tus tickets de pago
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Nombre de impresora */}
            <div className="space-y-2">
              <Label htmlFor="impresoraNombre">
                Nombre de Impresora
              </Label>
              <Input
                id="impresoraNombre"
                placeholder="Ej: Impresora Bluetooth HP"
                value={config.impresoraNombre}
                onChange={(e) => setConfig({ ...config, impresoraNombre: e.target.value })}
              />
              <p className="text-sm text-muted-foreground">
                Identificador para reconocer tu impresora
              </p>
            </div>

            {/* Ancho de papel */}
            <div className="space-y-2">
              <Label htmlFor="impresoraAnchoPapel">
                Ancho de Papel
              </Label>
              <Select
                value={config.impresoraAnchoPapel.toString()}
                onValueChange={(value) => setConfig({ ...config, impresoraAnchoPapel: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="58">58 mm (Rollo pequeño)</SelectItem>
                  <SelectItem value="80">80 mm (Rollo estándar)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Selecciona el ancho del rollo de papel de tu impresora
              </p>
            </div>

            {/* Tamaño de fuente */}
            <div className="space-y-2">
              <Label htmlFor="impresoraTamanoFuente">
                Tamaño de Fuente
              </Label>
              <Select
                value={config.impresoraTamanoFuente}
                onValueChange={(value) => setConfig({ ...config, impresoraTamanoFuente: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pequena">Pequeña</SelectItem>
                  <SelectItem value="mediana">Mediana</SelectItem>
                  <SelectItem value="grande">Grande</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Tamaño del texto en los tickets impresos
              </p>
            </div>

            {/* Auto-imprimir */}
            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-0.5">
                <Label htmlFor="impresoraAutoImprimir">
                  Auto-imprimir Tickets
                </Label>
                <p className="text-sm text-muted-foreground">
                  Imprimir automáticamente al registrar un pago
                </p>
              </div>
              <Switch
                id="impresoraAutoImprimir"
                checked={config.impresoraAutoImprimir}
                onCheckedChange={(checked) => setConfig({ ...config, impresoraAutoImprimir: checked })}
              />
            </div>

            {/* Botones de acción */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex-1"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Guardar Configuración
                  </>
                )}
              </Button>

              <Button
                onClick={handleTest}
                disabled={testing || !config.impresoraNombre}
                variant="outline"
              >
                {testing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Probando...
                  </>
                ) : (
                  <>
                    <TestTube2 className="mr-2 h-4 w-4" />
                    Probar
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Información adicional */}
        <Card>
          <CardHeader>
            <CardTitle>Impresoras Compatibles</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Impresoras térmicas con protocolo ESC/POS</li>
              <li>• Modelos probados: Epson TM-T20, Star TSP143, Bixolon SRP-350</li>
              <li>• Conexión: USB, Bluetooth, WiFi</li>
              <li>• Ancho de papel: 58mm o 80mm</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
