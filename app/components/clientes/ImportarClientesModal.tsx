
'use client';

import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Upload, Download, FileText, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';

interface ImportarClientesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface ImportResult {
  success: number;
  created: number;
  updated: number;
  errors: { row: number; error: string }[];
  total: number;
}

export function ImportarClientesModal({ 
  open, 
  onOpenChange, 
  onSuccess 
}: ImportarClientesModalProps) {
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const downloadTemplate = () => {
    setLoading(true);
    
    // Crear CSV template
    const headers = [
      'codigoCliente',
      'nombreCompleto',
      'telefono',
      'vendedor',
      'codigoGestor',
      'direccionCompleta',
      'descripcionProducto',
      'diaPago',
      'montoPago',
      'periodicidad',
      'saldoActual',
      'fechaVenta',
      'importe1',
      'importe2',
      'importe3',
      'importe4'
    ];

    const sampleData = [
      'CLI25090949',
      'Juan Pérez García',
      '555-0123',
      'Carlos López',
      'G001',
      'Calle Principal #123, Col. Centro',
      'Sala 3 piezas color café',
      '1',
      '250.00',
      'semanal',
      '2500.00',
      '2024-01-15',
      '500.00',
      '750.00',
      '1000.00',
      '250.00'
    ];

    const instructions = [
      '# INSTRUCCIONES PARA IMPORTAR CLIENTES',
      '# 1. Llene los datos en las filas siguientes',
      '# 2. codigoCliente: Opcional. Si se deja vacío, se generará automáticamente. Ejemplo: CLI25090949',
      '# 3. codigoGestor: Opcional. Código del gestor/cobrador asignado. Si existe un cobrador con este código, se asignará automáticamente',
      '# 4. diaPago: 1=Lunes, 2=Martes, 3=Miércoles, 4=Jueves, 5=Viernes, 6=Sábado, 7=Domingo',
      '# 5. periodicidad: diario, semanal, quincenal, mensual',
      '# 6. fechaVenta: formato YYYY-MM-DD',
      '# 7. Los campos nombreCompleto, direccionCompleta, descripcionProducto, diaPago, montoPago y periodicidad son obligatorios',
      '# 8. PARA CREAR NUEVOS CLIENTES: Deje codigoCliente vacío o use uno nuevo',
      '# 9. PARA ACTUALIZAR CLIENTES EXISTENTES: Use el mismo codigoCliente del cliente que desea actualizar',
      '# 10. El sistema detecta automáticamente si debe crear o actualizar según el codigoCliente',
      '# 11. Elimine estas líneas de instrucciones antes de importar',
      ''
    ];

    const csvContent = [
      ...instructions,
      headers.join(','),
      sampleData.join(',')
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'plantilla_clientes.csv');
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setLoading(false);
    toast.success('Plantilla descargada exitosamente');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        setSelectedFile(file);
        setResult(null);
      } else {
        toast.error('Por favor seleccione un archivo CSV válido');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
  };

  const parseCSV = (text: string): any[] => {
    const lines = text.split('\n').filter(line => 
      line.trim() && !line.trim().startsWith('#')
    );
    
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim());
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length === headers.length) {
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index];
        });
        data.push(row);
      }
    }
    
    return data;
  };

  const validateRow = (row: any, index: number): string | null => {
    if (!row.nombreCompleto) return `Fila ${index + 2}: nombreCompleto es requerido`;
    if (!row.direccionCompleta) return `Fila ${index + 2}: direccionCompleta es requerido`;
    if (!row.descripcionProducto) return `Fila ${index + 2}: descripcionProducto es requerido`;
    if (!row.diaPago) return `Fila ${index + 2}: diaPago es requerido`;
    if (!row.montoPago) return `Fila ${index + 2}: montoPago es requerido`;
    if (!row.periodicidad) return `Fila ${index + 2}: periodicidad es requerido`;
    
    const diaPago = parseInt(row.diaPago);
    if (isNaN(diaPago) || diaPago < 1 || diaPago > 7) {
      return `Fila ${index + 2}: diaPago debe ser un número entre 1 y 7`;
    }
    
    const montoPago = parseFloat(row.montoPago);
    if (isNaN(montoPago) || montoPago <= 0) {
      return `Fila ${index + 2}: montoPago debe ser un número mayor a 0`;
    }
    
    const periodicidadValida = ['diario', 'semanal', 'quincenal', 'mensual'];
    if (!periodicidadValida.includes(row.periodicidad)) {
      return `Fila ${index + 2}: periodicidad debe ser: ${periodicidadValida.join(', ')}`;
    }
    
    return null;
  };

  const importClientes = async () => {
    if (!selectedFile) return;
    
    setImporting(true);
    setProgress(0);
    
    try {
      const text = await selectedFile.text();
      const data = parseCSV(text);
      
      if (data.length === 0) {
        throw new Error('No se encontraron datos válidos en el archivo');
      }
      
      const result: ImportResult = {
        success: 0,
        created: 0,
        updated: 0,
        errors: [],
        total: data.length
      };
      
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        setProgress((i / data.length) * 100);
        
        const validationError = validateRow(row, i);
        if (validationError) {
          result.errors.push({ row: i + 2, error: validationError });
          continue;
        }
        
        try {
          const clienteData = {
            codigoCliente: row.codigoCliente?.trim() || null,
            nombreCompleto: row.nombreCompleto,
            telefono: row.telefono || null,
            vendedor: row.vendedor || null,
            codigoGestor: row.codigoGestor?.trim() || null,
            direccionCompleta: row.direccionCompleta,
            descripcionProducto: row.descripcionProducto,
            diaPago: row.diaPago,
            montoPago: parseFloat(row.montoPago),
            periodicidad: row.periodicidad,
            saldoActual: row.saldoActual ? parseFloat(row.saldoActual) : parseFloat(row.montoPago),
            fechaVenta: row.fechaVenta || new Date().toISOString().split('T')[0],
            importe1: row.importe1 ? parseFloat(row.importe1) : null,
            importe2: row.importe2 ? parseFloat(row.importe2) : null,
            importe3: row.importe3 ? parseFloat(row.importe3) : null,
            importe4: row.importe4 ? parseFloat(row.importe4) : null,
          };
          
          // Si tiene codigoCliente, verificar si existe para decidir crear o actualizar
          let shouldUpdate = false;
          if (clienteData.codigoCliente) {
            // Verificar si el cliente existe
            const checkResponse = await fetch(`/api/clientes?search=${clienteData.codigoCliente}&limit=1`);
            if (checkResponse.ok) {
              const checkData = await checkResponse.json();
              const existingClient = checkData.clientes?.find(
                (c: any) => c.codigoCliente === clienteData.codigoCliente
              );
              shouldUpdate = !!existingClient;
            }
          }
          
          let response;
          if (shouldUpdate && clienteData.codigoCliente) {
            // Actualizar cliente existente
            response = await fetch('/api/clientes/bulk-update', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                codigoCliente: clienteData.codigoCliente,
                updateData: clienteData,
              }),
            });
            
            if (response.ok) {
              result.success++;
              result.updated++;
            } else {
              const errorData = await response.json();
              result.errors.push({ 
                row: i + 2, 
                error: `Error al actualizar: ${errorData.error || 'Error desconocido'}` 
              });
            }
          } else {
            // Crear nuevo cliente
            response = await fetch('/api/clientes', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(clienteData),
            });
            
            if (response.ok) {
              result.success++;
              result.created++;
            } else {
              const errorData = await response.json();
              result.errors.push({ 
                row: i + 2, 
                error: `Error al crear: ${errorData.error || 'Error desconocido'}` 
              });
            }
          }
        } catch (error) {
          result.errors.push({ 
            row: i + 2, 
            error: error instanceof Error ? error.message : 'Error desconocido' 
          });
        }
      }
      
      setProgress(100);
      setResult(result);
      
      if (result.success > 0) {
        toast.success(`${result.success} clientes importados exitosamente`);
        onSuccess();
      }
      
      if (result.errors.length > 0) {
        toast.warning(`${result.errors.length} registros con errores`);
      }
      
    } catch (error) {
      console.error('Error importing:', error);
      toast.error(error instanceof Error ? error.message : 'Error al importar archivo');
    } finally {
      setImporting(false);
    }
  };

  const resetModal = () => {
    setSelectedFile(null);
    setResult(null);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    if (!importing) {
      resetModal();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5" />
            <span>Importar Clientes</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Download Template Section */}
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-2 flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <span>1. Descargar Plantilla</span>
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Descarga la plantilla CSV con el formato correcto para importar/actualizar clientes. 
              <span className="block mt-1 font-medium">
                💡 El sistema detecta automáticamente si debe crear o actualizar según el código de cliente.
              </span>
            </p>
            <Button
              onClick={downloadTemplate}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileText className="h-4 w-4 mr-2" />
              )}
              Descargar Plantilla
            </Button>
          </div>

          {/* File Upload Section */}
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-2 flex items-center space-x-2">
              <Upload className="h-4 w-4" />
              <span>2. Seleccionar Archivo</span>
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Selecciona el archivo CSV con los datos de clientes a importar.
            </p>
            <div className="space-y-2">
              <Label htmlFor="file-upload">Archivo CSV</Label>
              <Input
                id="file-upload"
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                disabled={importing}
              />
              {selectedFile && (
                <p className="text-sm text-green-600 flex items-center space-x-1">
                  <CheckCircle className="h-4 w-4" />
                  <span>Archivo seleccionado: {selectedFile.name}</span>
                </p>
              )}
            </div>
          </div>

          {/* Import Progress */}
          {importing && (
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-2">Importando Clientes...</h3>
              <Progress value={progress} className="mb-2" />
              <p className="text-sm text-gray-600">
                {progress.toFixed(0)}% completado
              </p>
            </div>
          )}

          {/* Import Results */}
          {result && (
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-2">Resultados de la Importación</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>{result.success} clientes procesados exitosamente</span>
                </div>
                
                {result.created > 0 && (
                  <div className="flex items-center space-x-2 text-blue-600 text-sm">
                    <span className="ml-6">→ {result.created} clientes creados</span>
                  </div>
                )}
                
                {result.updated > 0 && (
                  <div className="flex items-center space-x-2 text-purple-600 text-sm">
                    <span className="ml-6">→ {result.updated} clientes actualizados</span>
                  </div>
                )}
                
                {result.errors.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-orange-600">
                      <AlertTriangle className="h-4 w-4" />
                      <span>{result.errors.length} registros con errores:</span>
                    </div>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {result.errors.map((error, index) => (
                        <Alert key={index} variant="destructive">
                          <AlertDescription className="text-xs">
                            {error.error}
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              variant="outline" 
              onClick={handleClose}
              disabled={importing}
            >
              {result ? 'Cerrar' : 'Cancelar'}
            </Button>
            
            {selectedFile && !result && (
              <Button
                onClick={importClientes}
                disabled={importing}
              >
                {importing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Importar Clientes
              </Button>
            )}
            
            {result && (
              <Button onClick={resetModal} variant="outline">
                Nueva Importación
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
