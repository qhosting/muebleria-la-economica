'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Store, Pencil } from 'lucide-react';
import { toast } from 'sonner';

interface EditarSucursalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  sucursal: any;
}

export function EditarSucursalModal({ isOpen, onClose, onSuccess, sucursal }: EditarSucursalModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    direccion: '',
    telefono: '',
    esBodega: false,
  });

  useEffect(() => {
    if (sucursal) {
      setFormData({
        nombre: sucursal.nombre || '',
        direccion: sucursal.direccion || '',
        telefono: sucursal.telefono || '',
        esBodega: !!sucursal.esBodega,
      });
    }
  }, [sucursal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nombre.trim()) {
      toast.error('El nombre de la sucursal es obligatorio');
      return;
    }

    if (!sucursal?.id) return;

    setLoading(true);

    try {
      const response = await fetch(`/api/inventario/sucursales/${sucursal.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          nombre: formData.nombre.trim().toUpperCase(),
          direccion: formData.direccion.trim(),
          telefono: formData.telefono.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || 'Sucursal actualizada exitosamente');
        onSuccess();
        onClose();
      } else {
        throw new Error(data.error || 'Error al actualizar sucursal');
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Error al actualizar sucursal');
    } finally {
      setLoading(false);
    }
  };

  if (!sucursal) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-gray-900">
            <Pencil className="h-4 w-4 text-blue-700" />
            Editar Datos de Sucursal / Bodega
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="edit-suc-nombre" className="text-xs font-semibold">Nombre de la Sucursal / Bodega *</Label>
            <Input
              id="edit-suc-nombre"
              placeholder="Ej: SUCURSAL CENTRO"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value.toUpperCase() })}
              disabled={loading}
              className="text-xs uppercase font-medium"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-suc-direccion" className="text-xs font-semibold">Dirección Completa</Label>
            <Input
              id="edit-suc-direccion"
              placeholder="Calle Principal #123, Col. Centro"
              value={formData.direccion}
              onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
              disabled={loading}
              className="text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-suc-telefono" className="text-xs font-semibold">Teléfono de Contacto</Label>
            <Input
              id="edit-suc-telefono"
              placeholder="427 273 2216"
              value={formData.telefono}
              onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
              disabled={loading}
              className="text-xs font-mono"
            />
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg bg-slate-50">
            <div className="space-y-0.5">
              <Label className="text-xs font-bold text-gray-900">¿Es Bodega de Almacenamiento?</Label>
              <p className="text-[11px] text-gray-500">
                Activa si es almacén central sin mostrador directo
              </p>
            </div>
            <Switch
              checked={formData.esBodega}
              onCheckedChange={(checked) => setFormData({ ...formData, esBodega: checked })}
              disabled={loading}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={loading}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading}
              className="bg-blue-700 hover:bg-blue-800 text-white text-xs gap-1.5"
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              Guardar Cambios
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
