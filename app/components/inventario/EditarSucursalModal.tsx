'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Loader2, Store, Pencil, Phone, MapPin, Shield } from 'lucide-react';
import { toast } from 'sonner';

interface EditarSucursalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  sucursal: any;
}

export function EditarSucursalModal({ isOpen, onClose, onSuccess, sucursal }: EditarSucursalModalProps) {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role?.toLowerCase();
  const esAdmin = userRole === 'admin';

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
          telefono: formData.telefono.trim(),
          direccion: formData.direccion.trim(),
          ...(esAdmin ? {
            nombre: formData.nombre.trim().toUpperCase(),
            esBodega: formData.esBodega
          } : {
            nombre: sucursal.nombre
          })
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || 'Información de la sucursal actualizada exitosamente');
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
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-gray-900">
            <Pencil className="h-4 w-4 text-blue-700" />
            Editar Información de Sucursal / Contacto
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Teléfono de Contacto - Editable por cualquier vendedor */}
          <div className="space-y-1.5 p-3 rounded-xl border-2 border-emerald-500/40 bg-emerald-50/60 dark:bg-emerald-950/20">
            <div className="flex items-center justify-between">
              <Label htmlFor="edit-suc-telefono" className="text-xs font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                <Phone className="h-4 w-4 text-emerald-600" />
                Número de Contacto de Sucursal *
              </Label>
              <Badge variant="outline" className="text-[10px] bg-emerald-100 text-emerald-800 border-emerald-300 font-bold px-1.5 py-0">
                Editable por Vendedor
              </Badge>
            </div>
            <p className="text-[11px] text-emerald-800/80 leading-tight">
              Cualquier vendedor puede actualizar este número para que aparezca en notas de venta, contratos y cotizaciones.
            </p>
            <Input
              id="edit-suc-telefono"
              placeholder="Ej: 427 273 2216"
              value={formData.telefono}
              onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
              disabled={loading}
              className="text-sm font-mono font-bold bg-white text-gray-900 border-emerald-300 focus-visible:ring-emerald-500"
              required
            />
          </div>

          {/* Nombre de Sucursal */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="edit-suc-nombre" className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                <Store className="h-3.5 w-3.5 text-blue-700" />
                Nombre de la Sucursal / Bodega *
              </Label>
              {!esAdmin && (
                <span className="text-[10px] text-gray-400 font-medium">
                  (Nombre fijo • Solo administrador)
                </span>
              )}
            </div>
            <Input
              id="edit-suc-nombre"
              placeholder="Ej: SAN LUCAS 3ER CUARTEL"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value.toUpperCase() })}
              disabled={!esAdmin || loading}
              className={`text-xs uppercase font-medium ${!esAdmin ? 'bg-slate-100 text-gray-500 cursor-not-allowed' : ''}`}
              required
            />
          </div>

          {/* Dirección */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-suc-direccion" className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-indigo-600" />
              Dirección de la Sucursal
            </Label>
            <Input
              id="edit-suc-direccion"
              placeholder="Domicilio Conocido, Aculco, Edo. de México"
              value={formData.direccion}
              onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
              disabled={loading}
              className="text-xs"
            />
          </div>

          {/* Tipo de Almacén (Bodega o Tienda) - Solo Admin */}
          {esAdmin && (
            <div className="flex items-center justify-between p-3 border rounded-lg bg-slate-50">
              <div className="space-y-0.5">
                <Label className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-purple-600" />
                  ¿Es Bodega de Almacenamiento?
                </Label>
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
          )}

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
              className="bg-blue-700 hover:bg-blue-800 text-white text-xs gap-1.5 font-bold shadow-sm"
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              Guardar Número de Contacto
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
