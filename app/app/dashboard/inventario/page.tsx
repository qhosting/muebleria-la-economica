
'use client';

import { useState, useEffect } from 'react';
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
    CheckCircle2
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MovimientoModal } from '@/components/inventario/MovimientoModal';
import { NuevoProductoModal } from '@/components/inventario/NuevoProductoModal';
import { NuevaSucursalModal } from '@/components/inventario/NuevaSucursalModal';
import { EditarProductoModal } from '@/components/inventario/EditarProductoModal';

export default function InventarioPage() {
    const { data: session } = useSession();
    const [productos, setProductos] = useState<any[]>([]);
    const [sucursales, setSucursales] = useState<any[]>([]);
    const [movimientos, setMovimientos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sucursalFiltro, setSucursalFiltro] = useState<string>('todas');
    const [movimientoBusqueda, setMovimientoBusqueda] = useState('');
    const [filtroTipoMov, setFiltroTipoMov] = useState('todos');
    const [filtroSucursalMov, setFiltroSucursalMov] = useState('todas');
    const [movimientoADeshacer, setMovimientoADeshacer] = useState<any | null>(null);
    const [deshaciendoMovimiento, setDeshaciendoMovimiento] = useState(false);
    const [isMovimientoOpen, setIsMovimientoOpen] = useState(false);
    const [isProductoOpen, setIsProductoOpen] = useState(false);
    const [isSucursalOpen, setIsSucursalOpen] = useState(false);
    const [isEditarOpen, setIsEditarOpen] = useState(false);
    const [productoAEditar, setProductoAEditar] = useState<any>(null);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [resProductos, resSucursales, resMovimientos] = await Promise.all([
                fetch('/api/inventario/productos'),
                fetch('/api/inventario/sucursales'),
                fetch('/api/inventario/movimientos?limit=100')
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
            toast.error('Error al cargar datos de inventario');
        } finally {
            setLoading(false);
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

    const filteredProductos = productos.filter(p => {
        const matchSearch = p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            p.codigo.toLowerCase().includes(searchTerm.toLowerCase());
        if (!matchSearch) return false;
        if (sucursalFiltro === 'todas') return true;
        return p.stockPorSucursal?.some((s: any) => s.sucursalId === sucursalFiltro && s.cantidad > 0);
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
                                    <div className="flex flex-wrap items-center gap-2.5">
                                        <div className="flex items-center gap-1.5 text-xs text-gray-600 bg-slate-50 border px-2.5 py-1 rounded-lg">
                                            <Store className="h-3.5 w-3.5 text-blue-700" />
                                            <span className="font-semibold">Sucursal:</span>
                                            <select
                                                value={sucursalFiltro}
                                                onChange={(e) => setSucursalFiltro(e.target.value)}
                                                className="bg-transparent font-bold text-blue-900 border-none focus:outline-none text-xs cursor-pointer"
                                            >
                                                <option value="todas">Todas las sucursales</option>
                                                {sucursales.map(s => (
                                                    <option key={s.id} value={s.id}>{s.nombre}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="relative w-56">
                                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                                            <Input
                                                placeholder="Buscar por código, nombre..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="pl-8 h-8 text-xs"
                                            />
                                        </div>
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
                                                    <th className="p-3 font-medium text-gray-600 text-right">Precio Venta</th>
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
                                                            <div className="font-medium text-gray-900">{producto.nombre}</div>
                                                            {producto.descripcion && (
                                                                <div className="text-xs text-gray-500 truncate max-w-[200px]">
                                                                    {producto.descripcion}
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="p-3 text-gray-600">{producto.categoria || '-'}</td>
                                                        <td className="p-3 text-right font-medium">
                                                            {formatCurrency(producto.precioVenta)}
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
                                <Card key={sucursal.id}>
                                    <CardHeader className="pb-2">
                                        <div className="flex justify-between items-center">
                                            <CardTitle className="text-lg">{sucursal.nombre}</CardTitle>
                                            <Badge variant={sucursal.esBodega ? "secondary" : "default"}>
                                                {sucursal.esBodega ? "Bodega" : "Tienda"}
                                            </Badge>
                                        </div>
                                        <CardDescription>{sucursal.direccion || 'Sin dirección registrada'}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-sm text-gray-600">
                                            Teléfono: {sucursal.telefono || 'N/A'}
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
                    onSuccess={fetchData}
                />

                <NuevaSucursalModal
                    isOpen={isSucursalOpen}
                    onClose={() => setIsSucursalOpen(false)}
                    onSuccess={fetchData}
                />

                <EditarProductoModal
                    isOpen={isEditarOpen}
                    onClose={() => setIsEditarOpen(false)}
                    onSuccess={fetchData}
                    producto={productoAEditar}
                    sucursales={sucursales}
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
