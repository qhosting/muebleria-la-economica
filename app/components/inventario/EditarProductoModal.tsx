'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { DollarSign, Package, Tag, Layers, CheckCircle2 } from 'lucide-react';

interface EditarProductoModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    producto: any;
    sucursales: any[];
}

export function EditarProductoModal({
    isOpen,
    onClose,
    onSuccess,
    producto,
    sucursales = []
}: EditarProductoModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        id: '',
        codigo: '',
        nombre: '',
        descripcion: '',
        categoria: '',
        precioCompra: '',
        precioVenta: '',
        stockMinimo: '2',
        stockTotal: '0',
        sucursalId: 'todas'
    });

    useEffect(() => {
        if (producto) {
            setFormData({
                id: producto.id || '',
                codigo: producto.codigo || '',
                nombre: producto.nombre || '',
                descripcion: producto.descripcion || '',
                categoria: producto.categoria || 'Muebles',
                precioCompra: producto.precioCompra?.toString() || '0',
                precioVenta: producto.precioVenta?.toString() || '0',
                stockMinimo: (producto.stockMinimo || 2).toString(),
                stockTotal: (producto.stockTotal || 0).toString(),
                sucursalId: 'todas'
            });
        }
    }, [producto]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.id) {
            toast.error('No se identificó el producto a editar');
            return;
        }

        const pVenta = parseFloat(formData.precioVenta);
        if (isNaN(pVenta) || pVenta < 0) {
            toast.error('Ingrese un precio de venta válido');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('/api/inventario/productos', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Error al actualizar producto');
            }

            toast.success(`Precios y datos actualizados para: ${formData.nombre}`);
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[620px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold text-gray-900">
                        <Tag className="h-5 w-5 text-blue-700" />
                        Editar Producto y Precios
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                    {/* Código y Categoría */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="grid gap-1.5">
                            <Label htmlFor="edit-codigo" className="text-xs font-semibold text-gray-700">Código SKU</Label>
                            <Input
                                id="edit-codigo"
                                name="codigo"
                                required
                                value={formData.codigo}
                                onChange={handleChange}
                                className="font-mono text-sm uppercase"
                            />
                        </div>

                        <div className="grid gap-1.5">
                            <Label htmlFor="edit-categoria" className="text-xs font-semibold text-gray-700">Categoría</Label>
                            <Select
                                value={formData.categoria}
                                onValueChange={(v) => handleSelectChange('categoria', v)}
                            >
                                <SelectTrigger id="edit-categoria">
                                    <SelectValue placeholder="Seleccionar..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Estufas">Estufas</SelectItem>
                                    <SelectItem value="Lavadoras">Lavadoras</SelectItem>
                                    <SelectItem value="Electrodomésticos">Electrodomésticos</SelectItem>
                                    <SelectItem value="Audio y TV">Audio y TV</SelectItem>
                                    <SelectItem value="Salas">Salas</SelectItem>
                                    <SelectItem value="Colchones">Colchones</SelectItem>
                                    <SelectItem value="Bases">Bases</SelectItem>
                                    <SelectItem value="Roperos">Roperos</SelectItem>
                                    <SelectItem value="Cocinas y Muebles">Cocinas y Muebles</SelectItem>
                                    <SelectItem value="Muebles">Muebles Generales</SelectItem>
                                    <SelectItem value="Hogar">Hogar</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Nombre del Producto */}
                    <div className="grid gap-1.5">
                        <Label htmlFor="edit-nombre" className="text-xs font-semibold text-gray-700">Nombre del Producto</Label>
                        <Input
                            id="edit-nombre"
                            name="nombre"
                            required
                            value={formData.nombre}
                            onChange={handleChange}
                            className="font-medium uppercase"
                        />
                    </div>

                    {/* SECCIÓN DESTACADA: PRECIOS */}
                    <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl space-y-3">
                        <div className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                            <DollarSign className="h-4 w-4 text-blue-700" />
                            MODIFICACIÓN DE PRECIOS
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="grid gap-1.5 bg-white p-3 rounded-lg border border-blue-100 shadow-sm">
                                <Label htmlFor="edit-precioCompra" className="text-xs font-bold text-gray-700">
                                    Precio Compra / Contado ($)
                                </Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-gray-400 font-bold">$</span>
                                    <Input
                                        id="edit-precioCompra"
                                        name="precioCompra"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        required
                                        value={formData.precioCompra}
                                        onChange={handleChange}
                                        className="pl-7 text-base font-bold text-gray-900"
                                    />
                                </div>
                                <span className="text-[11px] text-gray-500">Costo o precio base de contado</span>
                            </div>

                            <div className="grid gap-1.5 bg-white p-3 rounded-lg border border-emerald-200 shadow-sm">
                                <Label htmlFor="edit-precioVenta" className="text-xs font-bold text-emerald-800">
                                    Precio Venta / Crédito ($)
                                </Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-emerald-600 font-bold">$</span>
                                    <Input
                                        id="edit-precioVenta"
                                        name="precioVenta"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        required
                                        value={formData.precioVenta}
                                        onChange={handleChange}
                                        className="pl-7 text-base font-black text-emerald-700"
                                    />
                                </div>
                                <span className="text-[11px] text-emerald-600 font-medium">Precio de lista para el cliente</span>
                            </div>
                        </div>
                    </div>

                    {/* Stock y Almacén */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="grid gap-1.5">
                            <Label htmlFor="edit-stockTotal" className="text-xs font-semibold text-gray-700">
                                Stock Unidades
                            </Label>
                            <Input
                                id="edit-stockTotal"
                                name="stockTotal"
                                type="number"
                                min="0"
                                value={formData.stockTotal}
                                onChange={handleChange}
                                className="font-bold text-center"
                            />
                        </div>

                        <div className="grid gap-1.5">
                            <Label htmlFor="edit-stockMinimo" className="text-xs font-semibold text-gray-700">
                                Stock Mínimo
                            </Label>
                            <Input
                                id="edit-stockMinimo"
                                name="stockMinimo"
                                type="number"
                                min="0"
                                value={formData.stockMinimo}
                                onChange={handleChange}
                                className="text-center"
                            />
                        </div>

                        <div className="grid gap-1.5">
                            <Label htmlFor="edit-sucursalId" className="text-xs font-semibold text-gray-700">
                                Asignar a Sucursal
                            </Label>
                            <Select
                                value={formData.sucursalId}
                                onValueChange={(v) => handleSelectChange('sucursalId', v)}
                            >
                                <SelectTrigger id="edit-sucursalId">
                                    <SelectValue placeholder="Sucursal..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="todas">SAN LUCAS (Matriz)</SelectItem>
                                    {sucursales.map(s => (
                                        <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Descripción */}
                    <div className="grid gap-1.5">
                        <Label htmlFor="edit-descripcion" className="text-xs font-semibold text-gray-700">Descripción / Detalles</Label>
                        <Textarea
                            id="edit-descripcion"
                            name="descripcion"
                            rows={2}
                            value={formData.descripcion}
                            onChange={handleChange}
                            placeholder="Marca, modelo, características..."
                            className="text-xs"
                        />
                    </div>

                    <DialogFooter className="gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading} className="bg-blue-700 hover:bg-blue-800 text-white font-bold gap-2">
                            {loading ? 'Guardando...' : (
                                <>
                                    <CheckCircle2 className="h-4 w-4" />
                                    Guardar Cambios
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
