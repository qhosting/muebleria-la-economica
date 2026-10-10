'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { DollarSign, Tag, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

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
        precioContado: '',
        precio4Meses: '',
        precio12Meses: '',
        precioVenta: '',
        stockMinimo: '2',
        stockTotal: '0',
        sucursalId: 'todas'
    });

    useEffect(() => {
        if (producto) {
            const parseEntero = (val: any, def: string = '0') => {
                if (val == null || val === '') return def;
                const n = Math.round(parseFloat(val.toString()));
                return isNaN(n) ? def : n.toString();
            };

            const pCompra = parseEntero(producto.precioCompra, '0');
            const pContado = parseEntero(producto.precioContado, pCompra);
            const p12M = parseEntero(producto.precio12Meses, parseEntero(producto.precioVenta, '0'));
            const p4M = producto.precio4Meses != null && producto.precio4Meses !== '' && producto.precio4Meses !== 0
                ? parseEntero(producto.precio4Meses, '')
                : '';

            setFormData({
                id: producto.id || '',
                codigo: (producto.codigo || '').toUpperCase(),
                nombre: (producto.nombre || '').toUpperCase(),
                descripcion: (producto.descripcion || '').toUpperCase(),
                categoria: producto.categoria || 'Muebles',
                precioCompra: pCompra,
                precioContado: pContado,
                precio4Meses: p4M,
                precio12Meses: p12M,
                precioVenta: p12M || pContado,
                stockMinimo: (producto.stockMinimo || 2).toString(),
                stockTotal: (producto.stockTotal || 0).toString(),
                sucursalId: 'todas'
            });
        }
    }, [producto]);

    // Cálculos de enganche fijo al 40% según precio (sin decimales)
    const numPrecio4M = Math.round(parseFloat(formData.precio4Meses) || 0);
    const enganche4M = Math.round(numPrecio4M * 0.40);
    const saldo4M = Math.max(0, numPrecio4M - enganche4M);

    const numPrecio12M = Math.round(parseFloat(formData.precio12Meses) || parseFloat(formData.precioVenta) || 0);
    const enganche12M = Math.round(numPrecio12M * 0.40);
    const saldo12M = Math.max(0, numPrecio12M - enganche12M);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.id) {
            toast.error('No se identificó el producto a editar');
            return;
        }

        const pContado = Math.round(parseFloat(formData.precioContado) || parseFloat(formData.precioCompra) || 0);
        const p12M = Math.round(parseFloat(formData.precio12Meses) || parseFloat(formData.precioVenta) || 0);

        if (pContado < 0 || p12M < 0) {
            toast.error('Los precios no pueden ser negativos');
            return;
        }

        setLoading(true);

        const payload = {
            ...formData,
            codigo: formData.codigo.trim().toUpperCase(),
            nombre: formData.nombre.trim().toUpperCase(),
            descripcion: formData.descripcion ? formData.descripcion.trim().toUpperCase() : '',
            precioCompra: Math.round(parseFloat(formData.precioCompra) || 0),
            precioContado: pContado,
            precio4Meses: Math.round(parseFloat(formData.precio4Meses) || 0),
            precio12Meses: p12M,
            precioVenta: p12M || pContado
        };

        try {
            const res = await fetch('/api/inventario/productos', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
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
        if (name === 'nombre' || name === 'descripcion' || name === 'codigo') {
            setFormData(prev => ({ ...prev, [name]: value.toUpperCase() }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[680px] max-h-[92vh] overflow-y-auto">
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

                    {/* SECCIÓN DESTACADA: ESQUEMA DE PRECIOS CON ENGANCHE 40% FIJO */}
                    <div className="p-4 bg-gradient-to-br from-blue-50/90 to-indigo-50/70 border border-blue-200 rounded-xl space-y-3 shadow-xs">
                        <div className="flex items-center justify-between border-b border-blue-200/80 pb-2">
                            <div className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                                <DollarSign className="h-4 w-4 text-blue-700" />
                                TABLA DE PRECIOS Y PLANES (ENGANCHE 40% FIJO)
                            </div>
                            <span className="text-[11px] font-semibold text-blue-800 bg-blue-100/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <ShieldCheck className="h-3 w-3 text-blue-700" />
                                Enganche 40% Fijo
                            </span>
                        </div>

                        {/* Fila 1: Costo y Contado */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* Precio Compra / Costo */}
                            <div className="grid gap-1 bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
                                <Label htmlFor="edit-precioCompra" className="text-xs font-bold text-gray-700">
                                    Precio Compra / Costo ($)
                                </Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-gray-400 font-bold">$</span>
                                    <Input
                                        id="edit-precioCompra"
                                        name="precioCompra"
                                        type="number"
                                        step="1"
                                        min="0"
                                        placeholder="0"
                                        value={formData.precioCompra}
                                        onChange={handleChange}
                                        className="pl-7 text-base font-bold text-gray-800"
                                    />
                                </div>
                                <span className="text-[10px] text-gray-500">Costo de adquisición base</span>
                            </div>

                            {/* Precio Contado */}
                            <div className="grid gap-1 bg-white p-3 rounded-lg border border-blue-200 shadow-xs">
                                <Label htmlFor="edit-precioContado" className="text-xs font-bold text-blue-900">
                                    Precio Contado ($)
                                </Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-blue-500 font-bold">$</span>
                                    <Input
                                        id="edit-precioContado"
                                        name="precioContado"
                                        type="number"
                                        step="1"
                                        min="0"
                                        required
                                        placeholder="0"
                                        value={formData.precioContado}
                                        onChange={handleChange}
                                        className="pl-7 text-base font-black text-blue-900"
                                    />
                                </div>
                                <span className="text-[10px] text-blue-700 font-medium">Pago en 1 sola exhibición</span>
                            </div>
                        </div>

                        {/* Fila 2: 4 Meses y 12 Meses (con Enganche 40% calculado) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* Precio 4 Meses */}
                            <div className="grid gap-1 bg-white p-3 rounded-lg border border-purple-200 shadow-xs">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="edit-precio4Meses" className="text-xs font-bold text-purple-900">
                                        Precio 4 Meses ($)
                                    </Label>
                                    <span className="text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded font-semibold">
                                        Crédito Corto
                                    </span>
                                </div>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-purple-600 font-bold">$</span>
                                    <Input
                                        id="edit-precio4Meses"
                                        name="precio4Meses"
                                        type="number"
                                        step="1"
                                        min="0"
                                        value={formData.precio4Meses}
                                        onChange={handleChange}
                                        placeholder="0"
                                        className="pl-7 text-base font-bold text-purple-900"
                                    />
                                </div>
                                <div className="mt-1 bg-purple-50/80 border border-purple-100 rounded-md p-1.5 text-[11px] space-y-0.5">
                                    <div className="flex justify-between items-center text-purple-950 font-bold">
                                        <span>Enganche (40% fijo):</span>
                                        <span>{formatCurrency(enganche4M)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-gray-500 text-[10px]">
                                        <span>Saldo a 4 meses:</span>
                                        <span>{formatCurrency(saldo4M)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Precio 12 Meses */}
                            <div className="grid gap-1 bg-white p-3 rounded-lg border border-emerald-300 shadow-xs">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="edit-precio12Meses" className="text-xs font-bold text-emerald-900">
                                        Precio 12 Meses ($)
                                    </Label>
                                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-semibold">
                                        Precio Lista Crédito
                                    </span>
                                </div>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-emerald-600 font-bold">$</span>
                                    <Input
                                        id="edit-precio12Meses"
                                        name="precio12Meses"
                                        type="number"
                                        step="1"
                                        min="0"
                                        required
                                        placeholder="0"
                                        value={formData.precio12Meses}
                                        onChange={handleChange}
                                        className="pl-7 text-base font-black text-emerald-800"
                                    />
                                </div>
                                <div className="mt-1 bg-emerald-50/80 border border-emerald-100 rounded-md p-1.5 text-[11px] space-y-0.5">
                                    <div className="flex justify-between items-center text-emerald-950 font-bold">
                                        <span>Enganche (40% fijo):</span>
                                        <span>{formatCurrency(enganche12M)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-gray-500 text-[10px]">
                                        <span>Saldo a 12 meses:</span>
                                        <span>{formatCurrency(saldo12M)}</span>
                                    </div>
                                </div>
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

                    {/* Descripción en MAYÚSCULAS */}
                    <div className="grid gap-1.5">
                        <div className="flex justify-between items-center">
                            <Label htmlFor="edit-descripcion" className="text-xs font-semibold text-gray-700">
                                Descripción / Detalles (MAYÚSCULAS)
                            </Label>
                            <span className="text-[10px] text-gray-400 uppercase font-semibold">Solo Mayúsculas</span>
                        </div>
                        <Textarea
                            id="edit-descripcion"
                            name="descripcion"
                            rows={2}
                            value={formData.descripcion}
                            onChange={handleChange}
                            placeholder="MARCA, MODELO, CARACTERÍSTICAS..."
                            className="text-xs uppercase font-medium tracking-wide"
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
