
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { DollarSign, ShieldCheck, PlusCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export function NuevoProductoModal({ isOpen, onClose, onSuccess }: any) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        codigo: '',
        nombre: '',
        descripcion: '',
        categoria: '',
        unidadMedida: 'pieza',
        precioCompra: '',
        precioContado: '',
        precio4Meses: '',
        precio12Meses: '',
        precioVenta: '',
        stockMinimo: '5',
        stockInicial: '1',
        sucursalId: 'todas'
    });

    // Cálculos de enganche fijo al 40% según precio (sin decimales)
    const numPrecio4M = Math.round(parseFloat(formData.precio4Meses) || 0);
    const enganche4M = Math.round(numPrecio4M * 0.40);
    const saldo4M = Math.max(0, numPrecio4M - enganche4M);

    const numPrecio12M = Math.round(parseFloat(formData.precio12Meses) || parseFloat(formData.precioVenta) || 0);
    const enganche12M = Math.round(numPrecio12M * 0.40);
    const saldo12M = Math.max(0, numPrecio12M - enganche12M);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const pCompra = Math.round(parseFloat(formData.precioCompra) || 0);
        const pContado = Math.round(parseFloat(formData.precioContado) || pCompra);
        const p4M = Math.round(parseFloat(formData.precio4Meses) || 0);
        const p12M = Math.round(parseFloat(formData.precio12Meses) || parseFloat(formData.precioVenta) || 0);

        const payload = {
            ...formData,
            codigo: formData.codigo.trim().toUpperCase(),
            nombre: formData.nombre.trim().toUpperCase(),
            descripcion: formData.descripcion ? formData.descripcion.trim().toUpperCase() : '',
            precioCompra: pCompra,
            precioContado: pContado,
            precio4Meses: p4M,
            precio12Meses: p12M,
            precioVenta: p12M || pContado
        };

        try {
            const res = await fetch('/api/inventario/productos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Error al crear producto');
            }

            toast.success('Producto creado exitosamente');
            onSuccess();
            onClose();
            setFormData({
                codigo: '',
                nombre: '',
                descripcion: '',
                categoria: '',
                unidadMedida: 'pieza',
                precioCompra: '',
                precioContado: '',
                precio4Meses: '',
                precio12Meses: '',
                precioVenta: '',
                stockMinimo: '5',
                stockInicial: '1',
                sucursalId: 'todas'
            });
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
            <DialogContent className="sm:max-w-[650px] max-h-[92vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold text-gray-900">
                        <PlusCircle className="h-5 w-5 text-blue-700" />
                        Registrar Nuevo Producto
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-1">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-1.5">
                            <Label htmlFor="codigo" className="text-xs font-semibold text-gray-700">Código SKU</Label>
                            <Input
                                id="codigo"
                                name="codigo"
                                placeholder="SKU-123"
                                required
                                value={formData.codigo}
                                onChange={handleChange}
                                className="font-mono text-sm uppercase"
                            />
                        </div>
                        <div className="grid gap-1.5">
                            <Label htmlFor="categoria" className="text-xs font-semibold text-gray-700">Categoría</Label>
                            <Select onValueChange={(v) => handleSelectChange('categoria', v)}>
                                <SelectTrigger>
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

                    <div className="grid gap-1.5">
                        <Label htmlFor="nombre" className="text-xs font-semibold text-gray-700">Nombre del Producto</Label>
                        <Input
                            id="nombre"
                            name="nombre"
                            placeholder="EJ. SALA ESQUINERA CHOCOLATE"
                            required
                            value={formData.nombre}
                            onChange={handleChange}
                            className="font-medium uppercase"
                        />
                    </div>

                    {/* SECCIÓN PRECIOS Y PLANES (ENGANCHE 40% FIJO) */}
                    <div className="p-4 bg-gradient-to-br from-blue-50/90 to-indigo-50/70 border border-blue-200 rounded-xl space-y-3">
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
                            <div className="grid gap-1 bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
                                <Label htmlFor="precioCompra" className="text-xs font-bold text-gray-700">Costo ($)</Label>
                                <Input
                                    id="precioCompra"
                                    name="precioCompra"
                                    type="number"
                                    min="0"
                                    step="1"
                                    placeholder="0"
                                    value={formData.precioCompra}
                                    onChange={handleChange}
                                    className="font-bold text-gray-800"
                                />
                                <span className="text-[10px] text-gray-500">Costo de compra</span>
                            </div>

                            <div className="grid gap-1 bg-white p-3 rounded-lg border border-blue-200 shadow-xs">
                                <Label htmlFor="precioContado" className="text-xs font-bold text-blue-900">Precio Contado ($)</Label>
                                <Input
                                    id="precioContado"
                                    name="precioContado"
                                    type="number"
                                    min="0"
                                    step="1"
                                    required
                                    placeholder="0"
                                    value={formData.precioContado}
                                    onChange={handleChange}
                                    className="font-black text-blue-900"
                                />
                                <span className="text-[10px] text-blue-700 font-medium">Pago en una sola exhibición</span>
                            </div>
                        </div>

                        {/* Fila 2: 4 Meses y 12 Meses */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="grid gap-1 bg-white p-3 rounded-lg border border-purple-200 shadow-xs">
                                <Label htmlFor="precio4Meses" className="text-xs font-bold text-purple-900">Precio 4 Meses ($)</Label>
                                <Input
                                    id="precio4Meses"
                                    name="precio4Meses"
                                    type="number"
                                    min="0"
                                    step="1"
                                    placeholder="0"
                                    value={formData.precio4Meses}
                                    onChange={handleChange}
                                    className="font-bold text-purple-900"
                                />
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

                            <div className="grid gap-1 bg-white p-3 rounded-lg border border-emerald-300 shadow-xs">
                                <Label htmlFor="precio12Meses" className="text-xs font-bold text-emerald-900">Precio 12 Meses ($)</Label>
                                <Input
                                    id="precio12Meses"
                                    name="precio12Meses"
                                    type="number"
                                    min="0"
                                    step="1"
                                    required
                                    placeholder="0"
                                    value={formData.precio12Meses}
                                    onChange={handleChange}
                                    className="font-black text-emerald-800"
                                />
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

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-1.5">
                            <Label htmlFor="unidadMedida" className="text-xs font-semibold text-gray-700">Unidad</Label>
                            <Select defaultValue="pieza" onValueChange={(v) => handleSelectChange('unidadMedida', v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Unidad" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pieza">Pieza</SelectItem>
                                    <SelectItem value="juego">Juego</SelectItem>
                                    <SelectItem value="caja">Caja</SelectItem>
                                    <SelectItem value="metro">Metro</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-1.5">
                            <Label htmlFor="stockMinimo" className="text-xs font-semibold text-gray-700">Stock Mínimo Alerta</Label>
                            <Input
                                id="stockMinimo"
                                name="stockMinimo"
                                type="number"
                                min="0"
                                value={formData.stockMinimo}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {/* Descripción en MAYÚSCULAS */}
                    <div className="grid gap-1.5">
                        <div className="flex justify-between items-center">
                            <Label htmlFor="descripcion" className="text-xs font-semibold text-gray-700">
                                Descripción / Detalles (MAYÚSCULAS)
                            </Label>
                            <span className="text-[10px] text-gray-400 uppercase font-semibold">Solo Mayúsculas</span>
                        </div>
                        <Textarea
                            id="descripcion"
                            name="descripcion"
                            placeholder="DETALLES, CARACTERÍSTICAS, COLOR, MEDIDAS..."
                            value={formData.descripcion}
                            onChange={handleChange}
                            className="text-xs uppercase font-medium tracking-wide"
                            rows={2}
                        />
                    </div>

                    <DialogFooter className="gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                        <Button type="submit" disabled={loading} className="bg-blue-700 hover:bg-blue-800 text-white font-bold">
                            {loading ? 'Guardando...' : 'Crear Producto'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
