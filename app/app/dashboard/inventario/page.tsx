
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';
import {
    Package,
    Search,
    MapPin,
    ArrowLeftRight,
    Plus,
    FileText,
    AlertTriangle,
    ShoppingBag,
    Store,
    Pencil,
    RotateCcw,
    ArrowRight,
    Clock,
    Loader2,
    Calendar,
    CheckCircle2,
    Filter,
    X,
    Trash2
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MovimientoModal } from '@/components/inventario/MovimientoModal';
import { NuevoProductoModal } from '@/components/inventario/NuevoProductoModal';
import { NuevaSucursalModal } from '@/components/inventario/NuevaSucursalModal';
import { EditarProductoModal } from '@/components/inventario/EditarProductoModal';
import { EditarSucursalModal } from '@/components/inventario/EditarSucursalModal';

export default function InventarioPage() {
    const { data: session } = useSession();
    const esAdmin = (session?.user as any)?.role === 'admin';
    const [productos, setProductos] = useState<any[]>([]);
    const [sucursales, setSucursales] = useState<any[]>([]);
    const [movimientos, setMovimientos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sucursalFiltro, setSucursalFiltro] = useState<string>('todas');
    const [categoriaFiltro, setCategoriaFiltro] = useState<string>('todas');
    const [estadoStockFiltro, setEstadoStockFiltro] = useState<string>('todos');
    const [movimientoBusqueda, setMovimientoBusqueda] = useState('');
    const [filtroTipoMov, setFiltroTipoMov] = useState('todos');
    const [filtroSucursalMov, setFiltroSucursalMov] = useState('todas');
    const [movimientoADeshacer, setMovimientoADeshacer] = useState<any | null>(null);
    const [deshaciendoMovimiento, setDeshaciendoMovimiento] = useState(false);
    const [limpiandoHistorico, setLimpiandoHistorico] = useState(false);
    const [isMovimientoOpen, setIsMovimientoOpen] = useState(false);
    const [isProductoOpen, setIsProductoOpen] = useState(false);
    const [isSucursalOpen, setIsSucursalOpen] = useState(false);
    const [isEditarOpen, setIsEditarOpen] = useState(false);
    const [productoAEditar, setProductoAEditar] = useState<any>(null);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [isEditarSucursalOpen, setIsEditarSucursalOpen] = useState(false);
    const [sucursalAEditar, setSucursalAEditar] = useState<any>(null);
    const [eliminandoProductoId, setEliminandoProductoId] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async (silent: boolean = false) => {
        try {
            if (!silent) setLoading(true);
            const ts = Date.now();
            const [resProductos, resSucursales, resMovimientos] = await Promise.all([
                fetch(`/api/inventario/productos?t=${ts}`, { cache: 'no-store' }),
                fetch(`/api/inventario/sucursales?t=${ts}`, { cache: 'no-store' }),
                fetch(`/api/inventario/movimientos?limit=100&t=${ts}`, { cache: 'no-store' })
            ]);

            if (resProductos.ok && resSucursales.ok) {
                const dataProductos = await resProductos.json();
                const dataSucursales = await resSucursales.json();
                setProductos(dataProductos.productos || []);
                setSucursales(dataSucursales || []);
            }

            if (resMovimientos && resMovimientos.ok) {
                const dataMovs = await resMovimientos.json();
                setMovimientos(Array.isArray(dataMovs) ? dataMovs : []);
            }
        } catch (error) {
            console.error('Error cargando inventario:', error);
            if (!silent) toast.error('Error al cargar datos de inventario');
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const handleEliminarProducto = async (prodOrId: any) => {
        const prod = typeof prodOrId === 'string' ? productos.find(p => p.id === prodOrId) : prodOrId;
        const id = typeof prodOrId === 'string' ? prodOrId : prodOrId?.id;
        if (!id) return;

        try {
            setEliminandoProductoId(id);
            // Optimistic update: removerlo de inmediato del estado en memoria
            setProductos(prev => prev.filter(p => p.id !== id));

            const res = await fetch(`/api/inventario/productos?id=${id}`, {
                method: 'DELETE'
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Error al eliminar producto');
            }

            toast.success(data.message || `Producto eliminado: ${prod?.nombre || ''}`);
            await fetchData(true);
        } catch (err: any) {
            console.error('Error al eliminar producto:', err);
            toast.error(err.message || 'No se pudo eliminar el producto');
            await fetchData(true);
        } finally {
            setEliminandoProductoId(null);
        }
    };

    const handleConfirmarDeshacer = async () => {
        if (!movimientoADeshacer) return;
        try {
            setDeshaciendoMovimiento(true);
            const res = await fetch(`/api/inventario/movimientos?id=${movimientoADeshacer.id}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Error al deshacer movimiento');
            }
            toast.success(data.message || 'Movimiento deshecho y stock restablecido exitosamente');
            setMovimientoADeshacer(null);
            await fetchData();
        } catch (error: any) {
            console.error('Error al deshacer movimiento:', error);
            toast.error(error.message || 'Error al deshacer el movimiento');
        } finally {
            setDeshaciendoMovimiento(false);
        }
    };

    const handleLimpiarTodoElHistorico = async () => {
        if (!window.confirm('¿Confirmas que deseas limpiar de la base de datos todo el registro histórico y traslados? Esta acción vaciará completamente el historial.')) {
            return;
        }

        try {
            setLimpiandoHistorico(true);
            const res = await fetch('/api/inventario/movimientos?limpiar=true', {
                method: 'DELETE'
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Error al limpiar histórico');
            }
            toast.success(data.message || 'Registro histórico y traslados eliminados exitosamente');
            await fetchData();
        } catch (error: any) {
            console.error('Error al limpiar histórico:', error);
            toast.error(error.message || 'Error al limpiar histórico');
        } finally {
            setLimpiandoHistorico(false);
        }
    };

    const listaCategorias = useMemo(() => {
        return Array.from(new Set(productos.map(p => p.categoria).filter(Boolean))).sort();
    }, [productos]);

    // Función de normalización de texto para búsquedas insensibles a mayúsculas y acentos
    const normalizar = (txt: string) => 
        (txt || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim();

    const filteredProductos = productos.filter(p => {
        // 1. Filtro por sucursal
        if (sucursalFiltro !== 'todas') {
            const nombreSucursalFiltro = sucursales.find(s => s.id === sucursalFiltro)?.nombre?.toUpperCase();
            const hasStock = p.stockPorSucursal?.some((s: any) => 
                (s.sucursalId === sucursalFiltro || (nombreSucursalFiltro && s.sucursalNombre?.toUpperCase() === nombreSucursalFiltro)) 
                && (s.cantidad > 0 || estadoStockFiltro === 'agotado')
            );
            if (!hasStock) return false;
        }

        // 2. Filtro por categoría
        if (categoriaFiltro !== 'todas' && p.categoria !== categoriaFiltro) {
            return false;
        }

        // 3. Filtro por estado de stock
        if (estadoStockFiltro === 'disponible' && (p.stockTotal <= 0)) return false;
        if (estadoStockFiltro === 'bajo' && (!p.stockBajo || p.stockTotal <= 0)) return false;
        if (estadoStockFiltro === 'agotado' && (p.stockTotal > 0)) return false;

        // 4. Búsqueda inteligente por palabras clave / tokens
        if (searchTerm.trim()) {
            const tokens = normalizar(searchTerm).split(/\s+/).filter(Boolean);
            const searchableText = normalizar(`${p.nombre || ''} ${p.codigo || ''} ${p.descripcion || ''} ${p.categoria || ''}`);
            const allTokensMatch = tokens.every(token => searchableText.includes(token));
            if (!allTokensMatch) return false;
        }

        return true;
    });

    const filteredMovimientos = movimientos.filter(m => {
        if (filtroTipoMov !== 'todos' && m.tipoMovimiento !== filtroTipoMov) return false;

        if (filtroSucursalMov !== 'todas') {
            const matchesOrigen = m.sucursalOrigenId === filtroSucursalMov;
            const matchesDestino = m.sucursalDestinoId === filtroSucursalMov;
            if (!matchesOrigen && !matchesDestino) return false;
        }

        if (movimientoBusqueda.trim()) {
            const term = movimientoBusqueda.toLowerCase();
            const prodNombre = m.producto?.nombre?.toLowerCase() || '';
            const prodCodigo = m.producto?.codigo?.toLowerCase() || '';
            const motivo = m.motivo?.toLowerCase() || '';
            const ref = m.referencia?.toLowerCase() || '';
            const sucO = m.sucursalOrigen?.nombre?.toLowerCase() || '';
            const sucD = m.sucursalDestino?.nombre?.toLowerCase() || '';

            return prodNombre.includes(term) || prodCodigo.includes(term) || motivo.includes(term) || ref.includes(term) || sucO.includes(term) || sucD.includes(term);
        }

        return true;
    });

    const StockBadge = ({ cantidad, minimo }: { cantidad: number, minimo: number }) => {
        if (cantidad <= 0) return <Badge variant="destructive">Agotado</Badge>;
        if (cantidad <= minimo) return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Bajo Stock</Badge>;
        return <Badge variant="default" className="bg-green-100 text-green-800">En Stock</Badge>;
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Gestión de Inventario</h1>
                        <p className="text-gray-600">Control de stock, productos y movimientos entre sucursales</p>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={() => setIsMovimientoOpen(true)} variant="outline" className="gap-2">
                            <ArrowLeftRight className="h-4 w-4" />
                            Movimiento
                        </Button>
                        <Button onClick={() => setIsProductoOpen(true)} className="gap-2">
                            <Plus className="h-4 w-4" />
                            Nuevo Producto
                        </Button>
                        <Button onClick={() => setIsSucursalOpen(true)} variant="secondary" className="gap-2">
                            <Store className="h-4 w-4" />
                            Nueva Sucursal
                        </Button>
                    </div>
                </div>

                {/* Resumen de Inventario */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500">Total Productos</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{productos.length}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500">Valor Inventario</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                {formatCurrency(productos.reduce((sum, p) => sum + (p.precioCompra * p.stockTotal), 0))}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500">Bajo Stock</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-yellow-600">
                                {productos.filter(p => p.stockBajo).length}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500">Sucursales</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">{sucursales.length}</div>
                        </CardContent>
                    </Card>
                </div>

                <Tabs defaultValue="productos" className="w-full">
                    <TabsList>
                        <TabsTrigger value="productos">Productos ({productos.length})</TabsTrigger>
                        <TabsTrigger value="movimientos" className="gap-1.5">
                            Historial Movimientos
                            {movimientos.length > 0 && (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-bold bg-blue-100 text-blue-800">
                                    {movimientos.length}
                                </Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="bodegas">Bodegas y Sucursales ({sucursales.length})</TabsTrigger>
                    </TabsList>

                    <TabsContent value="productos" className="mt-4">
                        <Card>
                            <CardHeader>
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                    <div>
                                        <CardTitle>Catálogo de Productos</CardTitle>
                                        <CardDescription>Inventario consolidado y por sucursal</CardDescription>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        {/* Filtro Sucursal */}
                                        <div className="flex items-center gap-1.5 text-xs text-gray-700 bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg shadow-2xs">
                                            <Store className="h-3.5 w-3.5 text-blue-700" />
                                            <span className="font-semibold text-slate-500">Almacén:</span>
                                            <select
                                                value={sucursalFiltro}
                                                onChange={(e) => setSucursalFiltro(e.target.value)}
                                                className="bg-transparent font-bold text-slate-900 border-none focus:outline-none text-xs cursor-pointer"
                                            >
                                                <option value="todas">Todos los almacenes</option>
                                                {sucursales.map(s => (
                                                    <option key={s.id} value={s.id}>{s.nombre} {s.esBodega ? '(Bodega)' : ''}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Filtro Categoría */}
                                        <div className="flex items-center gap-1.5 text-xs text-gray-700 bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg shadow-2xs">
                                            <Filter className="h-3.5 w-3.5 text-indigo-600" />
                                            <span className="font-semibold text-slate-500">Categoría:</span>
                                            <select
                                                value={categoriaFiltro}
                                                onChange={(e) => setCategoriaFiltro(e.target.value)}
                                                className="bg-transparent font-bold text-slate-900 border-none focus:outline-none text-xs cursor-pointer"
                                            >
                                                <option value="todas">Todas las categorías</option>
                                                {listaCategorias.map(cat => (
                                                    <option key={cat} value={cat}>{cat}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Filtro Estado de Existencias */}
                                        <div className="flex items-center gap-1.5 text-xs text-gray-700 bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg shadow-2xs">
                                            <span className="font-semibold text-slate-500">Stock:</span>
                                            <select
                                                value={estadoStockFiltro}
                                                onChange={(e) => setEstadoStockFiltro(e.target.value)}
                                                className="bg-transparent font-bold text-slate-900 border-none focus:outline-none text-xs cursor-pointer"
                                            >
                                                <option value="todos">Todos los estados</option>
                                                <option value="disponible">En Stock (&gt; 0)</option>
                                                <option value="bajo">Bajo Stock (Alerta)</option>
                                                <option value="agotado">Agotados (0)</option>
                                            </select>
                                        </div>

                                        {/* Búsqueda inteligente multicampo */}
                                        <div className="relative w-64">
                                            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                                            <Input
                                                placeholder="Buscar mesa, sala, estufa, código..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="pl-8 pr-7 h-8 text-xs bg-white"
                                            />
                                            {searchTerm && (
                                                <button
                                                    onClick={() => setSearchTerm('')}
                                                    className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                                                    title="Limpiar búsqueda"
                                                >
                                                    <X className="h-3.5 w-3.5" />
                                                </button>
                                            )}
                                        </div>

                                        {/* Badge de contador */}
                                        <Badge variant="secondary" className="text-xs font-semibold px-2 py-1 bg-slate-100 text-slate-700 border border-slate-200">
                                            {filteredProductos.length} / {productos.length}
                                        </Badge>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {loading ? (
                                    <div className="text-center py-8">Cargando inventario...</div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b bg-gray-50 text-left">
                                                    <th className="p-3 font-medium text-gray-600">Código</th>
                                                    <th className="p-3 font-medium text-gray-600">Producto</th>
                                                    <th className="p-3 font-medium text-gray-600">Categoría</th>
                                                    <th className="p-3 font-medium text-gray-600 min-w-[190px]">Precios & Planes (Enganche 40%)</th>
                                                    <th className="p-3 font-medium text-gray-600 text-center">Total Stock</th>
                                                    <th className="p-3 font-medium text-gray-600">Estado</th>
                                                    <th className="p-3 font-medium text-gray-600">Distribución</th>
                                                    <th className="p-3 font-medium text-gray-600 text-center">Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredProductos.map((producto) => (
                                                    <tr key={producto.id} className="border-b hover:bg-gray-50">
                                                        <td className="p-3 font-medium">{producto.codigo}</td>
                                                        <td className="p-3">
                                                            <div className="font-bold text-gray-900 uppercase">{producto.nombre}</div>
                                                            {producto.descripcion && (
                                                                <div className="text-xs text-gray-500 truncate max-w-[240px] uppercase font-medium">
                                                                    {producto.descripcion.toUpperCase()}
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="p-3 text-gray-600">{producto.categoria || '-'}</td>
                                                        <td className="p-3">
                                                            <div className="flex flex-col gap-0.5 text-xs bg-slate-50/70 p-2 rounded-lg border border-slate-200/80">
                                                                <div className="flex items-center justify-between gap-2">
                                                                    <span className="text-gray-500 font-medium">Contado:</span>
                                                                    <span className="font-bold text-blue-900">{formatCurrency(producto.precioContado || producto.precioCompra)}</span>
                                                                </div>
                                                                <div className="flex items-center justify-between gap-2">
                                                                    <span className="text-gray-500 font-medium">1 Mes:</span>
                                                                    <span className="font-semibold text-amber-900">
                                                                        {producto.precio1Mes > 0 ? formatCurrency(producto.precio1Mes) : 'N/D'}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center justify-between gap-2">
                                                                    <span className="text-gray-500 font-medium">4 Meses:</span>
                                                                    <span className="font-semibold text-purple-900">
                                                                        {producto.precio4Meses > 0 ? formatCurrency(producto.precio4Meses) : 'N/D'}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center justify-between gap-2">
                                                                    <span className="text-gray-500 font-medium">12 Meses:</span>
                                                                    {producto.precio12Meses && Number(producto.precio12Meses) > 0 ? (
                                                                        <span className="font-bold text-emerald-800">
                                                                            {formatCurrency(producto.precio12Meses)}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-gray-400 font-medium italic text-[11px]">
                                                                            No aplica
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {(() => {
                                                                    const tiene12M = producto.precio12Meses && Number(producto.precio12Meses) > 0;
                                                                    const tiene4M = producto.precio4Meses && Number(producto.precio4Meses) > 0;
                                                                    const tiene1M = producto.precio1Mes && Number(producto.precio1Mes) > 0;

                                                                    if (tiene12M) {
                                                                        return (
                                                                            <div className="text-[10px] text-amber-800 bg-amber-50/90 px-1.5 py-0.5 rounded font-semibold mt-1 border border-amber-200/60 leading-tight">
                                                                                Eng. 40%: {formatCurrency(Math.round(Number(producto.precio12Meses) * 0.40))} (12M)
                                                                                {tiene4M ? ` · ${formatCurrency(Math.round(Number(producto.precio4Meses) * 0.40))} (4M)` : ''}
                                                                                {tiene1M ? ` · ${formatCurrency(Math.round(Number(producto.precio1Mes) * 0.40))} (1M)` : ''}
                                                                            </div>
                                                                        );
                                                                    }
                                                                    if (tiene4M) {
                                                                        return (
                                                                            <div className="text-[10px] text-amber-800 bg-amber-50/90 px-1.5 py-0.5 rounded font-semibold mt-1 border border-amber-200/60 leading-tight">
                                                                                Eng. 40%: {formatCurrency(Math.round(Number(producto.precio4Meses) * 0.40))} (4M)
                                                                                {tiene1M ? ` · ${formatCurrency(Math.round(Number(producto.precio1Mes) * 0.40))} (1M)` : ''}
                                                                            </div>
                                                                        );
                                                                    }
                                                                    if (tiene1M) {
                                                                        return (
                                                                            <div className="text-[10px] text-amber-800 bg-amber-50/90 px-1.5 py-0.5 rounded font-semibold mt-1 border border-amber-200/60 leading-tight">
                                                                                Eng. 40%: {formatCurrency(Math.round(Number(producto.precio1Mes) * 0.40))} (1M)
                                                                            </div>
                                                                        );
                                                                    }
                                                                    return (
                                                                        <div className="text-[10px] text-slate-500 bg-slate-100/90 px-1.5 py-0.5 rounded font-medium mt-1 border border-slate-200/60 leading-tight text-center">
                                                                            Solo Contado (Sin crédito)
                                                                        </div>
                                                                    );
                                                                })()}
                                                            </div>
                                                        </td>
                                                        <td className="p-3 text-center font-bold text-lg">
                                                            {producto.stockTotal}
                                                        </td>
                                                        <td className="p-3">
                                                            <StockBadge cantidad={producto.stockTotal} minimo={producto.stockMinimo} />
                                                        </td>
                                                        <td className="p-3">
                                                            <div className="flex flex-wrap gap-1">
                                                                {producto.stockPorSucursal.map((s: any) => (
                                                                    s.cantidad > 0 && (
                                                                        <Badge key={s.sucursalId} variant="outline" className="text-xs">
                                                                            {s.sucursalNombre}: {s.cantidad}
                                                                        </Badge>
                                                                    )
                                                                ))}
                                                            </div>
                                                        </td>
                                                        <td className="p-3 text-center">
                                                            <div className="flex items-center justify-center gap-1.5">
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="h-8 gap-1.5 text-xs text-blue-700 hover:text-blue-900 border-blue-200 hover:bg-blue-50 font-semibold"
                                                                    onClick={() => {
                                                                        setProductoAEditar(producto);
                                                                        setIsEditarOpen(true);
                                                                    }}
                                                                    title="Modificar precio y detalles"
                                                                >
                                                                    <Pencil className="h-3.5 w-3.5 text-blue-600" />
                                                                    Editar
                                                                </Button>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="h-8 w-8 p-0 text-xs text-rose-600 hover:text-rose-800 border-rose-200 hover:bg-rose-50"
                                                                    onClick={() => {
                                                                        if (window.confirm(`¿Seguro que deseas eliminar "${producto.nombre}" (${producto.codigo}) del inventario?`)) {
                                                                            handleEliminarProducto(producto);
                                                                        }
                                                                    }}
                                                                    disabled={eliminandoProductoId === producto.id}
                                                                    title="Eliminar producto del inventario"
                                                                >
                                                                    {eliminandoProductoId === producto.id ? (
                                                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                                    ) : (
                                                                        <Trash2 className="h-3.5 w-3.5" />
                                                                    )}
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="movimientos" className="mt-4">
                        <Card className="border-slate-200 shadow-sm">
                            <CardHeader className="pb-3 border-b bg-slate-50/70">
                                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
                                    <div>
                                        <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                                            <ArrowLeftRight className="h-5 w-5 text-blue-700" />
                                            Registro de Movimientos y Traslados
                                        </CardTitle>
                                        <CardDescription>
                                            Auditoría de traslados entre sucursales solicitados desde Kiosco o almacén, con opción para deshacer y restablecer stock
                                        </CardDescription>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                                        {/* Filtro por tipo */}
                                        <div className="flex items-center gap-1.5 text-xs text-gray-700 bg-white border px-2.5 py-1 rounded-lg">
                                            <span className="font-semibold text-gray-500">Tipo:</span>
                                            <select
                                                value={filtroTipoMov}
                                                onChange={(e) => setFiltroTipoMov(e.target.value)}
                                                className="bg-transparent font-bold text-blue-900 border-none focus:outline-none text-xs cursor-pointer"
                                            >
                                                <option value="todos">Todos los tipos</option>
                                                <option value="traspaso">Traspasos (Kiosco/Almacén)</option>
                                                <option value="entrada">Entradas</option>
                                                <option value="salida">Salidas</option>
                                                <option value="venta">Ventas</option>
                                                <option value="ajuste">Ajustes</option>
                                            </select>
                                        </div>

                                        {/* Filtro por sucursal */}
                                        <div className="flex items-center gap-1.5 text-xs text-gray-700 bg-white border px-2.5 py-1 rounded-lg">
                                            <Store className="h-3.5 w-3.5 text-blue-700" />
                                            <span className="font-semibold text-gray-500">Sucursal:</span>
                                            <select
                                                value={filtroSucursalMov}
                                                onChange={(e) => setFiltroSucursalMov(e.target.value)}
                                                className="bg-transparent font-bold text-blue-900 border-none focus:outline-none text-xs cursor-pointer"
                                            >
                                                <option value="todas">Todas</option>
                                                {sucursales.map(s => (
                                                    <option key={s.id} value={s.id}>{s.nombre}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Buscador de movimientos */}
                                        <div className="relative flex-1 sm:w-56">
                                            <Search className="absolute left-2.5 top-2 h-4 w-4 text-gray-400" />
                                            <Input
                                                placeholder="Buscar producto, folio, motivo..."
                                                value={movimientoBusqueda}
                                                onChange={(e) => setMovimientoBusqueda(e.target.value)}
                                                className="pl-8 h-8 text-xs bg-white"
                                            />
                                        </div>

                                        {/* Botón para limpiar de la base de datos histórico y traslados */}
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleLimpiarTodoElHistorico}
                                            disabled={limpiandoHistorico || movimientos.length === 0}
                                            className="h-8 text-xs text-red-600 border-red-200 hover:bg-red-50 flex items-center gap-1.5"
                                            title="Limpiar de la base de datos todo el registro histórico y traslados"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                            {limpiandoHistorico ? 'Limpiando...' : 'Limpiar Histórico'}
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="p-0">
                                {loading ? (
                                    <div className="text-center py-12 text-gray-500 text-sm">Cargando movimientos...</div>
                                ) : filteredMovimientos.length === 0 ? (
                                    <div className="text-center py-12 px-4 text-gray-400 text-sm space-y-1">
                                        <ArrowLeftRight className="h-8 w-8 mx-auto opacity-40 mb-2" />
                                        <p className="font-semibold text-gray-600">No se encontraron movimientos registrados</p>
                                        <p className="text-xs text-gray-400">
                                            {movimientoBusqueda || filtroTipoMov !== 'todos' || filtroSucursalMov !== 'todas'
                                                ? 'Intenta cambiar los filtros de búsqueda.'
                                                : 'Los traspasos solicitados desde el Kiosco aparecerán aquí automáticamente.'}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-xs text-left">
                                            <thead className="bg-slate-100 text-gray-700 font-bold uppercase border-b">
                                                <tr>
                                                    <th className="py-2.5 px-3">Fecha y Hora</th>
                                                    <th className="py-2.5 px-3">Tipo</th>
                                                    <th className="py-2.5 px-3">Producto</th>
                                                    <th className="py-2.5 px-3 text-center">Cant.</th>
                                                    <th className="py-2.5 px-3">Ruta / Sucursales</th>
                                                    <th className="py-2.5 px-3">Motivo / Referencia</th>
                                                    <th className="py-2.5 px-3 text-center">Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {filteredMovimientos.map((mov) => {
                                                    const esKiosco = mov.referencia?.includes('TRAS-KIOSCO') || mov.motivo?.toLowerCase().includes('kiosco');
                                                    return (
                                                        <tr key={mov.id} className="hover:bg-slate-50/80 transition-colors">
                                                            <td className="py-2.5 px-3 whitespace-nowrap text-gray-600">
                                                                <div className="font-medium text-gray-900">
                                                                    {new Date(mov.createdAt).toLocaleDateString('es-MX', {
                                                                        day: '2-digit',
                                                                        month: 'short',
                                                                        year: 'numeric'
                                                                    })}
                                                                </div>
                                                                <div className="text-[10px] text-gray-400 flex items-center gap-1">
                                                                    <Clock className="h-3 w-3" />
                                                                    {new Date(mov.createdAt).toLocaleTimeString('es-MX', {
                                                                        hour: '2-digit',
                                                                        minute: '2-digit'
                                                                    })}
                                                                </div>
                                                            </td>
                                                            <td className="py-2.5 px-3 whitespace-nowrap">
                                                                {mov.tipoMovimiento === 'traspaso' && (
                                                                    <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border border-blue-300 font-bold gap-1 text-[10px]">
                                                                        <ArrowLeftRight className="h-3 w-3" />
                                                                        Traspaso
                                                                    </Badge>
                                                                )}
                                                                {mov.tipoMovimiento === 'entrada' && (
                                                                    <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300 font-bold gap-1 text-[10px]">
                                                                        <Plus className="h-3 w-3" />
                                                                        Entrada
                                                                    </Badge>
                                                                )}
                                                                {mov.tipoMovimiento === 'salida' && (
                                                                    <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-300 font-bold gap-1 text-[10px]">
                                                                        Salida
                                                                    </Badge>
                                                                )}
                                                                {mov.tipoMovimiento === 'venta' && (
                                                                    <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200 border border-purple-300 font-bold gap-1 text-[10px]">
                                                                        Venta
                                                                    </Badge>
                                                                )}
                                                                {mov.tipoMovimiento === 'ajuste' && (
                                                                    <Badge variant="outline" className="text-[10px]">
                                                                        Ajuste
                                                                    </Badge>
                                                                )}
                                                                {esKiosco && (
                                                                    <span className="block mt-0.5 text-[9px] font-bold text-amber-700">
                                                                        ⚡ Desde Kiosco
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="py-2.5 px-3">
                                                                <div className="font-mono text-blue-700 font-bold text-[11px]">
                                                                    {mov.producto?.codigo || '-'}
                                                                </div>
                                                                <div className="font-semibold text-gray-900 text-xs line-clamp-1">
                                                                    {mov.producto?.nombre || 'Producto sin nombre'}
                                                                </div>
                                                            </td>
                                                            <td className="py-2.5 px-3 text-center">
                                                                <span className="inline-block px-2 py-0.5 rounded-full font-black text-xs bg-slate-100 text-slate-800 border">
                                                                    {mov.cantidad} pza{mov.cantidad > 1 ? 's' : ''}
                                                                </span>
                                                            </td>
                                                            <td className="py-2.5 px-3 text-gray-700">
                                                                {mov.tipoMovimiento === 'traspaso' ? (
                                                                    <div className="flex items-center gap-1.5 font-medium">
                                                                        <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px] font-bold text-slate-800">
                                                                            {mov.sucursalOrigen?.nombre || 'Origen'}
                                                                        </span>
                                                                        <ArrowRight className="h-3 w-3 text-blue-600 shrink-0" />
                                                                        <span className="bg-blue-50 px-1.5 py-0.5 rounded text-[11px] font-bold text-blue-900 border border-blue-200">
                                                                            {mov.sucursalDestino?.nombre || 'Destino'}
                                                                        </span>
                                                                    </div>
                                                                ) : mov.tipoMovimiento === 'entrada' ? (
                                                                    <span className="font-medium text-emerald-800">
                                                                        Destino: <strong>{mov.sucursalDestino?.nombre || '-'}</strong>
                                                                    </span>
                                                                ) : (
                                                                    <span className="font-medium text-amber-900">
                                                                        Origen: <strong>{mov.sucursalOrigen?.nombre || '-'}</strong>
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="py-2.5 px-3 text-gray-500 max-w-xs">
                                                                <div className="line-clamp-1 text-gray-800 font-medium">
                                                                    {mov.motivo || 'Sin motivo registrado'}
                                                                </div>
                                                                {mov.referencia && (
                                                                    <div className="text-[10px] text-gray-400 font-mono">
                                                                        Ref: {mov.referencia}
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className="py-2.5 px-3 text-center">
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => setMovimientoADeshacer(mov)}
                                                                    className="h-7 px-2 text-[11px] font-bold text-rose-700 hover:text-white hover:bg-rose-600 border-rose-200 hover:border-rose-600 gap-1 transition-all"
                                                                    title="Deshacer este movimiento y restablecer el stock"
                                                                >
                                                                    <RotateCcw className="h-3 w-3" />
                                                                    Deshacer
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="bodegas">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {sucursales.map(sucursal => (
                                <Card key={sucursal.id} className="relative hover:shadow-md transition-shadow">
                                    <CardHeader className="pb-2">
                                        <div className="flex justify-between items-start gap-2">
                                            <div>
                                                <CardTitle className="text-lg font-bold text-gray-900">{sucursal.nombre}</CardTitle>
                                                <Badge variant={sucursal.esBodega ? "secondary" : "default"} className="mt-1">
                                                    {sucursal.esBodega ? "Bodega" : "Tienda"}
                                                </Badge>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => {
                                                    setSucursalAEditar(sucursal);
                                                    setIsEditarSucursalOpen(true);
                                                }}
                                                className="h-8 gap-1.5 text-xs text-blue-700 hover:text-blue-900 border-blue-200 hover:bg-blue-50 font-semibold"
                                                title="Editar datos de la sucursal"
                                            >
                                                <Pencil className="h-3.5 w-3.5 text-blue-600" />
                                                Editar
                                            </Button>
                                        </div>
                                        <CardDescription className="text-xs mt-1">
                                            {sucursal.direccion || 'Sin dirección registrada'}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-xs text-gray-600 flex items-center justify-between">
                                            <span><strong>Teléfono:</strong> {sucursal.telefono || 'N/A'}</span>
                                            {sucursal._count?.stocks !== undefined && (
                                                <Badge variant="outline" className="text-[10px]">
                                                    {sucursal._count.stocks} artículos en stock
                                                </Badge>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Modales */}
                <MovimientoModal
                    isOpen={isMovimientoOpen}
                    onClose={() => setIsMovimientoOpen(false)}
                    onSuccess={fetchData}
                    productos={productos}
                    sucursales={sucursales}
                />

                <NuevoProductoModal
                    isOpen={isProductoOpen}
                    onClose={() => setIsProductoOpen(false)}
                    onSuccess={async (nuevoProd) => {
                        if (nuevoProd && (nuevoProd.id || nuevoProd.codigo)) {
                            // Reflejar inmediatamente en la vista
                            setProductos(prev => {
                                const existe = prev.some(p => p.id === nuevoProd.id || p.codigo === nuevoProd.codigo);
                                if (existe) return prev.map(p => (p.id === nuevoProd.id || p.codigo === nuevoProd.codigo) ? { ...p, ...nuevoProd } : p);
                                return [nuevoProd, ...prev];
                            });
                        }
                        await fetchData(true);
                    }}
                    sucursales={sucursales}
                />

                <NuevaSucursalModal
                    isOpen={isSucursalOpen}
                    onClose={() => setIsSucursalOpen(false)}
                    onSuccess={() => fetchData(true)}
                />

                <EditarProductoModal
                    isOpen={isEditarOpen}
                    onClose={() => setIsEditarOpen(false)}
                    onSuccess={async (prodActualizado) => {
                        if (prodActualizado && prodActualizado.id) {
                            // Reflejar inmediatamente en la vista
                            setProductos(prev => prev.map(p => {
                                if (p.id === prodActualizado.id) {
                                    return { ...p, ...prodActualizado };
                                }
                                return p;
                            }));
                        }
                        await fetchData(true);
                    }}
                    onEliminar={handleEliminarProducto}
                    producto={productoAEditar}
                    sucursales={sucursales}
                />

                <EditarSucursalModal
                    isOpen={isEditarSucursalOpen}
                    onClose={() => setIsEditarSucursalOpen(false)}
                    onSuccess={fetchData}
                    sucursal={sucursalAEditar}
                />

                {/* Modal de confirmación para deshacer movimiento */}
                {movimientoADeshacer && (
                    <Dialog open={!!movimientoADeshacer} onOpenChange={(open) => !open && setMovimientoADeshacer(null)}>
                        <DialogContent className="max-w-md bg-white">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2 text-rose-700 font-bold text-base">
                                    <RotateCcw className="h-5 w-5" />
                                    ¿Deshacer este movimiento de inventario?
                                </DialogTitle>
                                <DialogDescription className="text-xs text-gray-500">
                                    Esta acción revertirá automáticamente los cambios de stock en las sucursales involucradas.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2.5 my-2">
                                <div className="flex justify-between items-center pb-2 border-b">
                                    <span className="text-gray-500">Tipo de movimiento:</span>
                                    <Badge variant="outline" className="uppercase font-bold text-xs">
                                        {movimientoADeshacer.tipoMovimiento}
                                    </Badge>
                                </div>

                                <div>
                                    <span className="text-gray-500">Producto:</span>
                                    <p className="font-bold text-gray-900 text-sm">
                                        {movimientoADeshacer.producto?.nombre} ({movimientoADeshacer.producto?.codigo})
                                    </p>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500">Cantidad afectada:</span>
                                    <span className="font-black text-sm text-gray-900">
                                        {movimientoADeshacer.cantidad} pieza(s)
                                    </span>
                                </div>

                                {movimientoADeshacer.tipoMovimiento === 'traspaso' && (
                                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-amber-900 space-y-1">
                                        <p className="font-bold flex items-center gap-1 text-[11px]">
                                            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                                            Efecto de la reversión:
                                        </p>
                                        <p className="text-[11px]">
                                            • Se restarán <strong>{movimientoADeshacer.cantidad} pieza(s)</strong> de <strong>{movimientoADeshacer.sucursalDestino?.nombre || 'Destino'}</strong>.
                                        </p>
                                        <p className="text-[11px]">
                                            • Se regresarán <strong>{movimientoADeshacer.cantidad} pieza(s)</strong> a <strong>{movimientoADeshacer.sucursalOrigen?.nombre || 'Origen'}</strong>.
                                        </p>
                                    </div>
                                )}
                            </div>

                            <DialogFooter className="gap-2 sm:gap-0">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setMovimientoADeshacer(null)}
                                    disabled={deshaciendoMovimiento}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={handleConfirmarDeshacer}
                                    disabled={deshaciendoMovimiento}
                                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold gap-1.5"
                                >
                                    {deshaciendoMovimiento ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <RotateCcw className="h-4 w-4" />
                                    )}
                                    {deshaciendoMovimiento ? 'Revirtiendo...' : 'Sí, Deshacer y Revertir Stock'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
            </div>
        </DashboardLayout>
    );
}
