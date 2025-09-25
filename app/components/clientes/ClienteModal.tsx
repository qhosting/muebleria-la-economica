
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Cliente, User } from '@/lib/types';
import { Loader2, Save, X } from 'lucide-react';

interface ClienteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cliente?: Cliente | null;
  cobradores: User[];
  onSuccess: () => void;
}

export function ClienteModal({ 
  open, 
  onOpenChange, 
  cliente, 
  cobradores, 
  onSuccess 
}: ClienteModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombreCompleto: '',
    telefono: '',
    vendedor: '',
    cobradorAsignadoId: 'sin-asignar',
    direccionCompleta: '',
    descripcionProducto: '',
    diaPago: '1',
    montoPago: '',
    periodicidad: 'semanal',
    saldoActual: '',
    importe1: '',
    importe2: '',
    importe3: '',
    importe4: '',
    fechaVenta: new Date().toISOString().split('T')[0],
    statusCuenta: 'activo'
  });

  const isEditMode = !!cliente;

  useEffect(() => {
    if (cliente) {
      setFormData({
        nombreCompleto: cliente.nombreCompleto || '',
        telefono: cliente.telefono || '',
        vendedor: cliente.vendedor || '',
        cobradorAsignadoId: cliente.cobradorAsignadoId || 'sin-asignar',
        direccionCompleta: cliente.direccionCompleta || '',
        descripcionProducto: cliente.descripcionProducto || '',
        diaPago: cliente.diaPago.toString() || '1',
        montoPago: cliente.montoPago.toString() || '',
        periodicidad: cliente.periodicidad || 'semanal',
        saldoActual: cliente.saldoActual.toString() || '',
        importe1: cliente.importe1?.toString() || '',
        importe2: cliente.importe2?.toString() || '',
        importe3: cliente.importe3?.toString() || '',
        importe4: cliente.importe4?.toString() || '',
        fechaVenta: cliente.fechaVenta ? new Date(cliente.fechaVenta).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        statusCuenta: cliente.statusCuenta || 'activo'
      });
    } else {
      setFormData({
        nombreCompleto: '',
        telefono: '',
        vendedor: '',
        cobradorAsignadoId: 'sin-asignar',
        direccionCompleta: '',
        descripcionProducto: '',
        diaPago: '1',
        montoPago: '',
        periodicidad: 'semanal',
        saldoActual: '',
        importe1: '',
        importe2: '',
        importe3: '',
        importe4: '',
        fechaVenta: new Date().toISOString().split('T')[0],
        statusCuenta: 'activo'
      });
    }
  }, [cliente, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = isEditMode ? `/api/clientes/${cliente.id}` : '/api/clientes';
      const method = isEditMode ? 'PUT' : 'POST';

      // Prepare data with proper null handling for cobrador assignment
      const submitData = {
        ...formData,
        cobradorAsignadoId: formData.cobradorAsignadoId === 'sin-asignar' ? null : formData.cobradorAsignadoId
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        toast.success(
          isEditMode ? 'Cliente actualizado exitosamente' : 'Cliente creado exitosamente'
        );
        onSuccess();
        onOpenChange(false);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al procesar la solicitud');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : 'Error al procesar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  const periodicidadOptions = [
    { value: 'diario', label: 'Diario' },
    { value: 'semanal', label: 'Semanal' },
    { value: 'quincenal', label: 'Quincenal' },
    { value: 'mensual', label: 'Mensual' },
  ];

  const diasSemana = [
    { value: '1', label: 'Lunes' },
    { value: '2', label: 'Martes' },
    { value: '3', label: 'Miércoles' },
    { value: '4', label: 'Jueves' },
    { value: '5', label: 'Viernes' },
    { value: '6', label: 'Sábado' },
    { value: '7', label: 'Domingo' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Editar Cliente' : 'Nuevo Cliente'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nombreCompleto">Nombre Completo *</Label>
              <Input
                id="nombreCompleto"
                value={formData.nombreCompleto}
                onChange={(e) => setFormData({ ...formData, nombreCompleto: e.target.value })}
                required
                placeholder="Nombre completo del cliente"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                placeholder="Número de teléfono"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="vendedor">Vendedor</Label>
              <Input
                id="vendedor"
                value={formData.vendedor}
                onChange={(e) => setFormData({ ...formData, vendedor: e.target.value })}
                placeholder="Nombre del vendedor"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cobradorAsignadoId">Cobrador Asignado</Label>
              <Select 
                value={formData.cobradorAsignadoId} 
                onValueChange={(value) => setFormData({ ...formData, cobradorAsignadoId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cobrador" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sin-asignar">Sin asignar</SelectItem>
                  {cobradores.map((cobrador) => (
                    <SelectItem key={cobrador.id} value={cobrador.id}>
                      {cobrador.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="direccionCompleta">Dirección Completa *</Label>
            <Textarea
              id="direccionCompleta"
              value={formData.direccionCompleta}
              onChange={(e) => setFormData({ ...formData, direccionCompleta: e.target.value })}
              required
              placeholder="Dirección completa del cliente"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcionProducto">Descripción del Producto *</Label>
            <Textarea
              id="descripcionProducto"
              value={formData.descripcionProducto}
              onChange={(e) => setFormData({ ...formData, descripcionProducto: e.target.value })}
              required
              placeholder="Descripción del producto vendido"
              rows={2}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="diaPago">Día de Pago *</Label>
              <Select 
                value={formData.diaPago} 
                onValueChange={(value) => setFormData({ ...formData, diaPago: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar día" />
                </SelectTrigger>
                <SelectContent>
                  {diasSemana.map((dia) => (
                    <SelectItem key={dia.value} value={dia.value}>
                      {dia.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="periodicidad">Periodicidad *</Label>
              <Select 
                value={formData.periodicidad} 
                onValueChange={(value) => setFormData({ ...formData, periodicidad: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {periodicidadOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="montoPago">Monto de Pago *</Label>
              <Input
                id="montoPago"
                type="number"
                step="0.01"
                min="0"
                value={formData.montoPago}
                onChange={(e) => setFormData({ ...formData, montoPago: e.target.value })}
                required
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="saldoActual">Saldo Actual</Label>
              <Input
                id="saldoActual"
                type="number"
                step="0.01"
                value={formData.saldoActual}
                onChange={(e) => setFormData({ ...formData, saldoActual: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fechaVenta">Fecha de Venta</Label>
              <Input
                id="fechaVenta"
                type="date"
                value={formData.fechaVenta}
                onChange={(e) => setFormData({ ...formData, fechaVenta: e.target.value })}
              />
            </div>
          </div>

          {isEditMode && (
            <div className="space-y-2">
              <Label htmlFor="statusCuenta">Estado de Cuenta</Label>
              <Select 
                value={formData.statusCuenta} 
                onValueChange={(value) => setFormData({ ...formData, statusCuenta: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="inactivo">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="importe1">Importe 1</Label>
              <Input
                id="importe1"
                type="number"
                step="0.01"
                value={formData.importe1}
                onChange={(e) => setFormData({ ...formData, importe1: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="importe2">Importe 2</Label>
              <Input
                id="importe2"
                type="number"
                step="0.01"
                value={formData.importe2}
                onChange={(e) => setFormData({ ...formData, importe2: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="importe3">Importe 3</Label>
              <Input
                id="importe3"
                type="number"
                step="0.01"
                value={formData.importe3}
                onChange={(e) => setFormData({ ...formData, importe3: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="importe4">Importe 4</Label>
              <Input
                id="importe4"
                type="number"
                step="0.01"
                value={formData.importe4}
                onChange={(e) => setFormData({ ...formData, importe4: e.target.value })}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isEditMode ? 'Actualizar' : 'Crear'} Cliente
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
