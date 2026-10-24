
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export function MovimientoModal({ isOpen, onClose, onSuccess, productos, sucursales }: any) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        tipoMovimiento: '',
        productoId: '',
        cantidad: '',
        sucursalOrigenId: '',
        sucursalDestinoId: '',
        motivo: '',
        referencia: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/inventario/movimientos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Error al registrar movimiento');
            }

            toast.success('Movimiento registrado exitosamente');
            onSuccess();
            onClose();
            setFormData({
                tipoMovimiento: '',
                productoId: '',
                cantidad: '',
                sucursalOrigenId: '',
                sucursalDestinoId: '',
                motivo: '',
                referencia: ''
            });
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Registrar Movimiento de Inventario</DialogTitle>
                    <DialogDescription>
                        Entradas, salidas o traspasos entre sucursales.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="tipo">Tipo de Movimiento</Label>
                        <Select onValueChange={(v) => handleChange('tipoMovimiento', v)} required>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar tipo..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="entrada">Entrada (Compra/Ajuste)</SelectItem>
                                <SelectItem value="salida">Salida (Venta/Baja)</SelectItem>
                                <SelectItem value="traspaso">Traspaso entre Sucursales</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="producto">Producto</Label>
                        <Select onValueChange={(v) => handleChange('productoId', v)} required>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar producto..." />
                            </SelectTrigger>
                            <SelectContent>
                                {productos.map((p: any) => (
                                    <SelectItem key={p.id} value={p.id}>
                                        {p.codigo} - {p.nombre}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="cantidad">Cantidad</Label>
                            <Input
                                id="cantidad"
                                type="number"
                                min="1"
                                required
                                value={formData.cantidad}
                                onChange={(e) => handleChange('cantidad', e.target.value)}
                            />
                        </div>

                        {(formData.tipoMovimiento === 'salida' || formData.tipoMovimiento === 'traspaso') && (
                            <div className="grid gap-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="origen">Origen</Label>
                                    {formData.productoId && formData.sucursalOrigenId && (
                                        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                                            Disp: {(() => {
                                                const p = productos.find((item: any) => item.id === formData.productoId);
                                                const s = p?.stockPorSucursal?.find((suc: any) => suc.sucursalId === formData.sucursalOrigenId);
                                                return s ? `${s.cantidad} pzas` : '0 pzas';
                                            })()}
                                        </span>
                                    )}
                                </div>
                                <Select onValueChange={(v) => handleChange('sucursalOrigenId', v)} required>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Bodega/Tienda" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {sucursales.map((s: any) => (
                                            <SelectItem key={s.id} value={s.id}>{s.nombre} {s.esBodega ? '(Bodega)' : ''}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {(formData.tipoMovimiento === 'entrada' || formData.tipoMovimiento === 'traspaso') && (
                            <div className="grid gap-2">
                                <Label htmlFor="destino">Destino (Dar de alta o sumar)</Label>
                                <Select onValueChange={(v) => handleChange('sucursalDestinoId', v)} required>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Bodega/Tienda" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {sucursales.map((s: any) => (
                                            <SelectItem key={s.id} value={s.id}>{s.nombre} {s.esBodega ? '(Bodega)' : ''}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="motivo">Motivo / Referencia</Label>
                        <Input
                            id="motivo"
                            placeholder="Ej. Factura F-123, Ajuste anual..."
                            value={formData.motivo}
                            onChange={(e) => handleChange('motivo', e.target.value)}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Registrando...' : 'Confirmar Movimiento'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
