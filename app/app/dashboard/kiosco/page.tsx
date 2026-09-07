'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Store,
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Trash2,
  Printer,
  CreditCard,
  DollarSign,
  User,
  MapPin,
  Calendar,
  PenTool,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Package,
  History,
  FileText
} from 'lucide-react';
import { formatCurrency, getDayName, cn } from '@/lib/utils';
import { toast } from 'sonner';
import { CATALOGO_PRODUCTOS_INICIAL, CatalogoItem, calcularPlanCredito } from '@/lib/catalogo-kiosco';
import { RemisionPagarePrint } from '@/components/ventas/RemisionPagarePrint';
import { SignaturePadModal } from '@/components/ventas/SignaturePadModal';
import { CartItem, Cliente, User as UserType } from '@/lib/types';

export default function KioscoVentasPage() {
  const { data: session } = useSession();

  // Estados de catálogo y productos
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>('Todos');
  const [busqueda, setBusqueda] = useState<string>('');
  const [productosDB, setProductosDB] = useState<any[]>([]);
  const [cobradores, setCobradores] = useState<UserType[]>([]);
  const [sucursales, setSucursales] = useState<any[]>([]);
  const [sucursalSeleccionada, setSucursalSeleccionada] = useState<string>('');
  const [clientesExistentes, setClientesExistentes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);

  // Carrito de compra
  const [carrito, setCarrito] = useState<CartItem[]>([]);

  // Configuración de la Venta / Crédito
  const [tipoVenta, setTipoVenta] = useState<'contado' | 'credito'>('credito');
  const [nombreCliente, setNombreCliente] = useState('');
  const [telefonoCliente, setTelefonoCliente] = useState('');
  const [direccionCliente, setDireccionCliente] = useState('');
  const [ciudadCliente, setCiudadCliente] = useState('Aculco, Edo. de Méx.');
  const [clienteIdExistente, setClienteIdExistente] = useState<string>('');

  // Parámetros de Financiamiento
  const [enganche, setEnganche] = useState<number>(0);
  const [periodicidad, setPeriodicidad] = useState<'semanal' | 'quincenal' | 'mensual'>('semanal');
  const [plazoSemanas, setPlazoSemanas] = useState<number>(26); // 6 meses estándar
  const [diaPago, setDiaPago] = useState<string>('1'); // Lunes
  const [cobradorAsignadoId, setCobradorAsignadoId] = useState<string>('sin-asignar');
  const [firmaCliente, setFirmaCliente] = useState<string>('');

  // Modales
  const [isSignatureOpen, setIsSignatureOpen] = useState(false);
  const [isCustomProductOpen, setIsCustomProductOpen] = useState(false);
  const [customProduct, setCustomProduct] = useState({ concepto: '', precio: '' });
  const [ventaParaImprimir, setVentaParaImprimir] = useState<any>(null);

  // Historial de ventas recientes
  const [historialVentas, setHistorialVentas] = useState<any[]>([]);
  const [tabPrincipal, setTabPrincipal] = useState<'kiosco' | 'historial'>('kiosco');

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  const cargarDatosIniciales = async () => {
    try {
      setLoading(true);
      const [resCobradores, resSucursales, resProductos] = await Promise.all([
        fetch('/api/users/cobradores'),
        fetch('/api/inventario/sucursales'),
        fetch('/api/inventario/productos')
      ]);

      if (resCobradores.ok) {
        const data = await resCobradores.json();
        setCobradores(data || []);
      }

      if (resSucursales.ok) {
        const data = await resSucursales.json();
        setSucursales(data || []);
        if (data.length > 0) setSucursalSeleccionada(data[0].id);
      }

      if (resProductos.ok) {
        const data = await resProductos.json();
        setProductosDB(data.productos || []);
      }
    } catch (e) {
      console.error('Error al cargar datos:', e);
    } finally {
      setLoading(false);
    }
  };

  const cargarHistorial = async () => {
    try {
      const res = await fetch('/api/ventas?limit=15');
      if (res.ok) {
        const data = await res.json();
        setHistorialVentas(data.ventas || []);
      }
    } catch (e) {
      console.error('Error cargando historial de ventas:', e);
    }
  };

  // Búsqueda de clientes existentes
  const handleBuscarCliente = async (query: string) => {
    setNombreCliente(query);
    if (query.length > 2) {
      try {
        const res = await fetch(`/api/clientes?search=${encodeURIComponent(query)}&limit=5`);
        if (res.ok) {
          const data = await res.json();
          setClientesExistentes(data.clientes || []);
        }
      } catch (e) {
        console.error('Error al buscar clientes:', e);
      }
    } else {
      setClientesExistentes([]);
    }
  };

  const seleccionarCliente = (c: Cliente) => {
    setClienteIdExistente(c.id);
    setNombreCliente(c.nombreCompleto);
    setTelefonoCliente(c.telefono || '');
    setDireccionCliente(c.direccionCompleta || '');
    if (c.cobradorAsignadoId) setCobradorAsignadoId(c.cobradorAsignadoId);
    if (c.diaPago) setDiaPago(c.diaPago.toString());
    setClientesExistentes([]);
    toast.success(`Cliente seleccionado: ${c.nombreCompleto} (${c.codigoCliente})`);
  };

  // Agregar producto del catálogo al carrito
  const agregarAlCarrito = (item: CatalogoItem) => {
    const precio = tipoVenta === 'contado' ? item.precioContado : item.precioVenta;
    const existenteIndex = carrito.findIndex(c => c.concepto === item.nombre);

    if (existenteIndex >= 0) {
      const nuevoCarrito = [...carrito];
      nuevoCarrito[existenteIndex].cantidad += 1;
      nuevoCarrito[existenteIndex].importe = nuevoCarrito[existenteIndex].cantidad * nuevoCarrito[existenteIndex].precioUnitario;
      setCarrito(nuevoCarrito);
    } else {
      setCarrito([
        ...carrito,
        {
          productoId: item.id,
          codigo: item.codigo,
          concepto: item.nombre,
          categoria: item.categoria,
          precioUnitario: precio,
          cantidad: 1,
          importe: precio
        }
      ]);
    }
    toast.success(`Agregado: ${item.nombre}`);
  };

  // Agregar artículo personalizado
  const handleAgregarPersonalizado = () => {
    const precio = parseFloat(customProduct.precio);
    if (!customProduct.concepto || isNaN(precio) || precio <= 0) {
      toast.error('Ingrese un concepto válido y un precio mayor a 0');
      return;
    }

    setCarrito([
      ...carrito,
      {
        concepto: customProduct.concepto.trim(),
        categoria: 'Personalizado',
        precioUnitario: precio,
        cantidad: 1,
        importe: precio
      }
    ]);
    setCustomProduct({ concepto: '', precio: '' });
    setIsCustomProductOpen(false);
    toast.success('Artículo personalizado agregado al carrito');
  };

  const modificarCantidad = (index: number, delta: number) => {
    const nuevo = [...carrito];
    const item = nuevo[index];
    const nuevaCant = item.cantidad + delta;

    if (nuevaCant <= 0) {
      nuevo.splice(index, 1);
    } else {
      item.cantidad = nuevaCant;
      item.importe = item.cantidad * item.precioUnitario;
    }
    setCarrito(nuevo);
  };

  const modificarPrecio = (index: number, nuevoPrecio: number) => {
    if (isNaN(nuevoPrecio) || nuevoPrecio < 0) return;
    const nuevo = [...carrito];
    nuevo[index].precioUnitario = nuevoPrecio;
    nuevo[index].importe = nuevo[index].cantidad * nuevoPrecio;
    setCarrito(nuevo);
  };

  const eliminarDelCarrito = (index: number) => {
    const nuevo = [...carrito];
    nuevo.splice(index, 1);
    setCarrito(nuevo);
  };

  // Cálculos del Carrito y Financiamiento
  const totalBruto = carrito.reduce((sum, item) => sum + item.importe, 0);
  const planCredito = calcularPlanCredito(totalBruto, enganche, periodicidad, plazoSemanas);

  // Categorías disponibles
  const categorias = [
    'Todos',
    'Estufas',
    'Lavadoras',
    'Electrodomésticos',
    'Audio y TV',
    'Salas',
    'Colchones',
    'Bases',
    'Roperos',
    'Cocinas y Muebles'
  ];

  // Filtrado de catálogo
  const catalogoFiltrado = CATALOGO_PRODUCTOS_INICIAL.filter(item => {
    const matchCat = categoriaSeleccionada === 'Todos' || item.categoria === categoriaSeleccionada;
    const matchSearch =
      item.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      item.marca.toLowerCase().includes(busqueda.toLowerCase()) ||
      (item.modelo && item.modelo.toLowerCase().includes(busqueda.toLowerCase())) ||
      (item.descripcion && item.descripcion.toLowerCase().includes(busqueda.toLowerCase()));
    return matchCat && matchSearch;
  });

  // Procesar Venta / Levantamiento de Crédito
  const handleProcesarVenta = async () => {
    if (carrito.length === 0) {
      toast.error('El carrito de compras está vacío');
      return;
    }

    if (!nombreCliente.trim()) {
      toast.error('Debe ingresar el nombre del cliente');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        tipoVenta,
        nombreCliente: nombreCliente.trim(),
        direccionCliente: direccionCliente.trim(),
        ciudadCliente: ciudadCliente.trim(),
        telefonoCliente: telefonoCliente.trim(),
        clienteIdExistente: clienteIdExistente || undefined,
        sucursalId: sucursalSeleccionada || undefined,
        subtotal: totalBruto,
        descuento: 0,
        total: totalBruto,
        enganche: tipoVenta === 'credito' ? planCredito.enganche : 0,
        saldoFinanciado: tipoVenta === 'credito' ? planCredito.saldoFinanciado : 0,
        periodicidad: tipoVenta === 'credito' ? periodicidad : undefined,
        plazoSemanas: tipoVenta === 'credito' ? plazoSemanas : undefined,
        montoCuota: tipoVenta === 'credito' ? planCredito.montoCuota : undefined,
        diaPago: tipoVenta === 'credito' ? diaPago : undefined,
        interesMoratorioMensual: 10,
        firmaCliente: firmaCliente || undefined,
        cobradorAsignadoId: cobradorAsignadoId !== 'sin-asignar' ? cobradorAsignadoId : undefined,
        articulos: carrito
      };

      const res = await fetch('/api/ventas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al registrar la venta');
      }

      toast.success(`¡Venta y Remisión Nº ${data.folioFormateado} registrada exitosamente!`);

      // Preparar objeto para imprimir la remisión y pagaré
      setVentaParaImprimir({
        folio: data.folioFormateado,
        fecha: new Date(),
        tipoVenta,
        nombreCliente: nombreCliente.trim(),
        direccionCliente: direccionCliente.trim(),
        ciudadCliente: ciudadCliente.trim(),
        telefonoCliente: telefonoCliente.trim(),
        codigoCliente: data.codigoCliente || 'CL-NUEVO',
        total: totalBruto,
        enganche: tipoVenta === 'credito' ? planCredito.enganche : 0,
        saldoFinanciado: tipoVenta === 'credito' ? planCredito.saldoFinanciado : 0,
        periodicidad,
        montoCuota: planCredito.montoCuota,
        plazoSemanas,
        diaPago,
        interesMoratorioMensual: 10,
        firmaCliente,
        detalles: carrito
      });

      // Limpiar formulario
      setCarrito([]);
      setNombreCliente('');
      setTelefonoCliente('');
      setDireccionCliente('');
      setClienteIdExistente('');
      setFirmaCliente('');
      setEnganche(0);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Error al procesar la venta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* ENCABEZADO DEL KIOSCO */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-blue-900 to-indigo-900 p-6 rounded-2xl text-white shadow-lg">
          <div>
            <div className="flex items-center gap-3">
              <Store className="h-8 w-8 text-blue-300" />
              <h1 className="text-2xl md:text-3xl font-black tracking-tight">
                Kiosco de Ventas y Crédito
              </h1>
            </div>
            <p className="text-blue-200 text-sm mt-1">
              Mueblería La Económica • Levantamiento de crédito, contado y emisión de contrato oficial
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              className={cn(
                "gap-2 font-bold transition-all border",
                tabPrincipal === 'kiosco'
                  ? "bg-white text-blue-950 border-white hover:bg-blue-50 shadow-sm"
                  : "bg-white/15 text-white border-white/40 hover:bg-white/25 hover:text-white"
              )}
              onClick={() => setTabPrincipal('kiosco')}
            >
              <ShoppingCart className="h-4 w-4" />
              Mostrador
            </Button>
            <Button
              className={cn(
                "gap-2 font-bold transition-all border",
                tabPrincipal === 'historial'
                  ? "bg-white text-blue-950 border-white hover:bg-blue-50 shadow-sm"
                  : "bg-white/15 text-white border-white/40 hover:bg-white/25 hover:text-white"
              )}
              onClick={() => {
                setTabPrincipal('historial');
                cargarHistorial();
              }}
            >
              <History className="h-4 w-4" />
              Historial de Remisiones
            </Button>
          </div>
        </div>

        {tabPrincipal === 'kiosco' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* PANEL IZQUIERDO: CATÁLOGO TÁCTIL (7 columnas) */}
            <div className="lg:col-span-7 space-y-4">
              <Card className="shadow-md border-slate-200">
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Package className="h-5 w-5 text-blue-700" />
                        Catálogo de Productos
                      </CardTitle>
                      <CardDescription>
                        Seleccione artículos para agregarlos a la remisión
                      </CardDescription>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsCustomProductOpen(true)}
                      className="text-blue-700 border-blue-200 hover:bg-blue-50 gap-1.5 font-semibold"
                    >
                      <Plus className="h-4 w-4" />
                      Artículo Libre
                    </Button>
                  </div>

                  {/* Barra de Búsqueda */}
                  <div className="relative mt-2">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar por nombre, marca (Whirlpool, Mabe, Oster...), modelo..."
                      value={busqueda}
                      onChange={e => setBusqueda(e.target.value)}
                      className="pl-9 h-10 bg-slate-50 border-slate-200 focus:bg-white text-sm"
                    />
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 pt-0">
                  {/* Pills de Categorías con scroll horizontal */}
                  <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none">
                    {categorias.map(cat => (
                      <Button
                        key={cat}
                        size="sm"
                        variant={categoriaSeleccionada === cat ? 'default' : 'outline'}
                        className={`rounded-full px-3 py-1 text-xs whitespace-nowrap font-semibold transition-all ${
                          categoriaSeleccionada === cat
                            ? 'bg-blue-800 text-white shadow-sm'
                            : 'bg-white hover:bg-slate-100 text-gray-700'
                        }`}
                        onClick={() => setCategoriaSeleccionada(cat)}
                      >
                        {cat}
                      </Button>
                    ))}
                  </div>

                  {/* Grid de Productos */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[560px] overflow-y-auto pr-1">
                    {catalogoFiltrado.length === 0 ? (
                      <div className="col-span-2 text-center py-10 text-gray-400 text-sm">
                        No se encontraron productos coincidentes con "{busqueda}"
                      </div>
                    ) : (
                      catalogoFiltrado.map(prod => (
                        <div
                          key={prod.id}
                          onClick={() => agregarAlCarrito(prod)}
                          className="group border border-slate-200 rounded-xl p-3.5 bg-white hover:border-blue-500 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex justify-between items-start gap-1 mb-1">
                              <Badge variant="outline" className="text-[10px] font-bold text-blue-800 bg-blue-50 border-blue-200">
                                {prod.categoria}
                              </Badge>
                              {prod.tamano && (
                                <span className="text-[10px] text-gray-500 font-medium">
                                  {prod.tamano}
                                </span>
                              )}
                            </div>

                            <h3 className="font-bold text-gray-900 text-sm line-clamp-1 group-hover:text-blue-700 transition-colors">
                              {prod.nombre}
                            </h3>

                            <p className="text-[11px] text-gray-500 line-clamp-2 mt-0.5">
                              {prod.descripcion || `Marca ${prod.marca} ${prod.modelo || ''}`}
                            </p>
                          </div>

                          <div className="flex justify-between items-end mt-3 pt-2 border-t border-slate-100">
                            <div>
                              <div className="text-xs text-gray-400 font-medium">
                                {tipoVenta === 'credito' ? 'Precio Crédito' : 'Precio Contado'}
                              </div>
                              <div className="text-base font-black text-gray-950">
                                {formatCurrency(tipoVenta === 'credito' ? prod.precioVenta : prod.precioContado)}
                              </div>
                            </div>

                            <Button
                              size="sm"
                              className="h-8 w-8 p-0 rounded-full bg-blue-50 text-blue-700 group-hover:bg-blue-700 group-hover:text-white transition-colors"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* PANEL DERECHO: CARRITO Y CONFIGURACIÓN DE CRÉDITO (5 columnas) */}
            <div className="lg:col-span-5 space-y-4">
              <Card className="shadow-lg border-blue-100 bg-white">
                <CardHeader className="pb-3 border-b bg-slate-50/70 rounded-t-xl">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5 text-blue-700" />
                      Remisión de Venta
                    </CardTitle>
                    <Badge variant="secondary" className="font-bold">
                      {carrito.reduce((s, i) => s + i.cantidad, 0)} artículos
                    </Badge>
                  </div>

                  {/* Selector Contado vs Crédito */}
                  <div className="grid grid-cols-2 gap-2 mt-2 bg-slate-200/70 p-1 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setTipoVenta('credito')}
                      className={`py-1.5 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1.5 ${
                        tipoVenta === 'credito'
                          ? 'bg-blue-800 text-white shadow'
                          : 'text-gray-700 hover:text-gray-950'
                      }`}
                    >
                      <CreditCard className="h-3.5 w-3.5" />
                      Levantamiento Crédito
                    </button>
                    <button
                      type="button"
                      onClick={() => setTipoVenta('contado')}
                      className={`py-1.5 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1.5 ${
                        tipoVenta === 'contado'
                          ? 'bg-emerald-700 text-white shadow'
                          : 'text-gray-700 hover:text-gray-950'
                      }`}
                    >
                      <DollarSign className="h-3.5 w-3.5" />
                      Venta de Contado
                    </button>
                  </div>
                </CardHeader>

                <CardContent className="p-4 space-y-4">
                  {/* LISTA DE ARTÍCULOS EN EL CARRITO */}
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {carrito.length === 0 ? (
                      <div className="text-center py-6 text-gray-400 text-xs font-medium border border-dashed rounded-lg">
                        Seleccione productos del catálogo para agregarlos aquí
                      </div>
                    ) : (
                      carrito.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs gap-2"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-900 truncate">
                              {item.concepto}
                            </p>
                            <div className="flex items-center gap-1.5 text-gray-500 mt-0.5">
                              <span>Precio:</span>
                              <input
                                type="number"
                                value={item.precioUnitario}
                                onChange={e => modificarPrecio(idx, parseFloat(e.target.value))}
                                className="w-20 px-1 py-0.5 border rounded text-right font-medium text-gray-900"
                              />
                            </div>
                          </div>

                          {/* Control de cantidad */}
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => modificarCantidad(idx, -1)}
                              className="h-6 w-6 p-0 rounded"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="font-bold w-6 text-center text-sm">
                              {item.cantidad}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => modificarCantidad(idx, 1)}
                              className="h-6 w-6 p-0 rounded"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>

                          <div className="text-right min-w-[65px]">
                            <div className="font-black text-gray-950 text-xs">
                              {formatCurrency(item.importe)}
                            </div>
                            <button
                              onClick={() => eliminarDelCarrito(idx)}
                              className="text-red-500 hover:text-red-700 text-[10px] mt-0.5"
                            >
                              Quitar
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* TOTAL */}
                  <div className="bg-slate-100 p-3 rounded-lg flex justify-between items-center">
                    <span className="font-bold text-gray-700 text-sm">Total de la Venta:</span>
                    <span className="font-black text-xl text-blue-900">
                      {formatCurrency(totalBruto)}
                    </span>
                  </div>

                  {/* DATOS DEL CLIENTE */}
                  <div className="border-t pt-3 space-y-2.5">
                    <div className="flex justify-between items-center">
                      <Label className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-blue-700" />
                        Datos del Cliente / Deudor
                      </Label>
                      {clienteIdExistente && (
                        <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-200">
                          Cliente Registrado
                        </Badge>
                      )}
                    </div>

                    <div className="relative">
                      <Input
                        placeholder="Nombre Completo del Cliente *"
                        value={nombreCliente}
                        onChange={e => handleBuscarCliente(e.target.value)}
                        className="h-9 text-xs"
                      />
                      {clientesExistentes.length > 0 && (
                        <div className="absolute top-10 left-0 right-0 z-30 bg-white border rounded-lg shadow-xl max-h-40 overflow-y-auto divide-y">
                          {clientesExistentes.map(c => (
                            <div
                              key={c.id}
                              onClick={() => seleccionarCliente(c)}
                              className="p-2 text-xs hover:bg-blue-50 cursor-pointer flex justify-between items-center"
                            >
                              <span className="font-bold">{c.nombreCompleto}</span>
                              <span className="text-[10px] text-gray-500">{c.codigoCliente}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Teléfono (ej. 427 123 4567)"
                        value={telefonoCliente}
                        onChange={e => setTelefonoCliente(e.target.value)}
                        className="h-9 text-xs"
                      />
                      <Input
                        placeholder="Ciudad / Municipio"
                        value={ciudadCliente}
                        onChange={e => setCiudadCliente(e.target.value)}
                        className="h-9 text-xs"
                      />
                    </div>

                    <Input
                      placeholder="Dirección Completa (Calle, Número, Colonia)"
                      value={direccionCliente}
                      onChange={e => setDireccionCliente(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>

                  {/* PARÁMETROS DE CRÉDITO Y PAGARÉ */}
                  {tipoVenta === 'credito' && (
                    <div className="border-t pt-3 space-y-3 bg-blue-50/40 p-3 rounded-xl border border-blue-100">
                      <div className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-blue-700" />
                        Condiciones de Crédito y Cobranza
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-[11px] text-gray-600 font-semibold">Enganche Inicial ($)</Label>
                          <Input
                            type="number"
                            min="0"
                            value={enganche || ''}
                            placeholder="$0"
                            onChange={e => setEnganche(parseFloat(e.target.value) || 0)}
                            className="h-8 text-xs font-bold text-green-700"
                          />
                        </div>

                        <div>
                          <Label className="text-[11px] text-gray-600 font-semibold">Periodicidad</Label>
                          <Select
                            value={periodicidad}
                            onValueChange={(val: any) => setPeriodicidad(val)}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="semanal">Semanal</SelectItem>
                              <SelectItem value="quincenal">Quincenal</SelectItem>
                              <SelectItem value="mensual">Mensual</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-[11px] text-gray-600 font-semibold">Plazo (Semanas)</Label>
                          <Select
                            value={plazoSemanas.toString()}
                            onValueChange={val => setPlazoSemanas(parseInt(val))}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="13">13 semanas (3 meses)</SelectItem>
                              <SelectItem value="26">26 semanas (6 meses)</SelectItem>
                              <SelectItem value="39">39 semanas (9 meses)</SelectItem>
                              <SelectItem value="52">52 semanas (1 año)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-[11px] text-gray-600 font-semibold">Día de Cobro</Label>
                          <Select
                            value={diaPago}
                            onValueChange={setDiaPago}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">Lunes</SelectItem>
                              <SelectItem value="2">Martes</SelectItem>
                              <SelectItem value="3">Miércoles</SelectItem>
                              <SelectItem value="4">Jueves</SelectItem>
                              <SelectItem value="5">Viernes</SelectItem>
                              <SelectItem value="6">Sábado</SelectItem>
                              <SelectItem value="7">Domingo</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Cobrador Asignado */}
                      <div>
                        <Label className="text-[11px] text-gray-600 font-semibold">Cobrador / Gestor Asignado</Label>
                        <Select
                          value={cobradorAsignadoId}
                          onValueChange={setCobradorAsignadoId}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Seleccione un cobrador" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sin-asignar">Sin asignar por el momento</SelectItem>
                            {cobradores.map(cob => (
                              <SelectItem key={cob.id} value={cob.id}>
                                {cob.name} {cob.codigoGestor ? `(${cob.codigoGestor})` : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Resumen del cálculo del crédito */}
                      <div className="bg-white p-2.5 rounded-lg border border-blue-200 text-xs space-y-1">
                        <div className="flex justify-between text-gray-600">
                          <span>Saldo a Financiar:</span>
                          <span className="font-bold text-gray-900">{formatCurrency(planCredito.saldoFinanciado)}</span>
                        </div>
                        <div className="flex justify-between text-blue-900 font-bold">
                          <span>Abono {periodicidad}:</span>
                          <span className="text-base font-black text-blue-900">{formatCurrency(planCredito.montoCuota)}</span>
                        </div>
                      </div>

                      {/* Botón de Firma Digital */}
                      <div className="pt-1">
                        {firmaCliente ? (
                          <div className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded-lg text-xs text-green-800">
                            <span className="flex items-center gap-1 font-bold">
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                              Firma digital capturada
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setIsSignatureOpen(true)}
                              className="h-7 text-xs text-green-900 hover:bg-green-100"
                            >
                              Cambiar
                            </Button>
                          </div>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsSignatureOpen(true)}
                            className="w-full h-8 text-xs border-blue-300 text-blue-800 hover:bg-blue-100/50 gap-1.5"
                          >
                            <PenTool className="h-3.5 w-3.5" />
                            Capturar Firma del Cliente en Pantalla
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* BOTÓN FINAL DE VENTA E IMPRESIÓN */}
                  <Button
                    onClick={handleProcesarVenta}
                    disabled={loading || carrito.length === 0}
                    className="w-full h-12 text-base font-black bg-blue-800 hover:bg-blue-900 text-white shadow-lg rounded-xl gap-2 mt-2"
                  >
                    <Printer className="h-5 w-5" />
                    {tipoVenta === 'credito'
                      ? 'Completar Crédito e Imprimir Contrato'
                      : 'Completar Venta e Imprimir Remisión'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          /* TAB DE HISTORIAL DE VENTAS Y REIMPRESIONES */
          <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold text-gray-900">
                  Historial de Remisiones y Pagarés Emitidos
                </CardTitle>
                <CardDescription>
                  Consulte y reimprima cualquier contrato generado en el sistema
                </CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={cargarHistorial} className="gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" />
                Actualizar
              </Button>
            </CardHeader>

            <CardContent>
              {historialVentas.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm">
                  No hay ventas registradas recientemente
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-gray-700 font-bold uppercase">
                      <tr>
                        <th className="py-2.5 px-3">Remisión</th>
                        <th className="py-2.5 px-3">Fecha</th>
                        <th className="py-2.5 px-3">Cliente</th>
                        <th className="py-2.5 px-3">Tipo</th>
                        <th className="py-2.5 px-3">Total</th>
                        <th className="py-2.5 px-3">Saldo Financiado</th>
                        <th className="py-2.5 px-3 text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {historialVentas.map(v => (
                        <tr key={v.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-black text-blue-900">
                            Nº {v.folio.toString().padStart(4, '0')}
                          </td>
                          <td className="py-2.5 px-3 text-gray-600">
                            {new Date(v.fecha).toLocaleDateString('es-MX')}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-gray-900">
                            {v.nombreCliente}
                          </td>
                          <td className="py-2.5 px-3">
                            <Badge variant={v.tipoVenta === 'credito' ? 'default' : 'secondary'} className="capitalize text-[10px]">
                              {v.tipoVenta}
                            </Badge>
                          </td>
                          <td className="py-2.5 px-3 font-bold">
                            {formatCurrency(Number(v.total))}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-gray-700">
                            {formatCurrency(Number(v.saldoFinanciado || 0))}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setVentaParaImprimir({
                                  ...v,
                                  detalles: v.detalles || []
                                });
                              }}
                              className="gap-1 text-xs h-7 text-blue-700 hover:bg-blue-50"
                            >
                              <Printer className="h-3 w-3" />
                              Reimprimir
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
        )}

        {/* MODAL DE FIRMA DIGITAL TÁCTIL */}
        <SignaturePadModal
          open={isSignatureOpen}
          onOpenChange={setIsSignatureOpen}
          onSave={firma => {
            setFirmaCliente(firma);
            toast.success('Firma capturada correctamente');
          }}
        />

        {/* MODAL PARA AGREGAR ARTÍCULO PERSONALIZADO */}
        <Dialog open={isCustomProductOpen} onOpenChange={setIsCustomProductOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">
                Agregar Artículo Personalizado
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div>
                <Label className="text-xs">Concepto / Descripción del Artículo *</Label>
                <Input
                  placeholder="ej. Ropero Caoba con luna especial"
                  value={customProduct.concepto}
                  onChange={e => setCustomProduct({ ...customProduct, concepto: e.target.value })}
                  className="h-9 text-xs mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Precio Unitario ($) *</Label>
                <Input
                  type="number"
                  placeholder="ej. 4500"
                  value={customProduct.precio}
                  onChange={e => setCustomProduct({ ...customProduct, precio: e.target.value })}
                  className="h-9 text-xs mt-1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setIsCustomProductOpen(false)}>
                Cancelar
              </Button>
              <Button size="sm" onClick={handleAgregarPersonalizado} className="bg-blue-800 text-white">
                Agregar al Carrito
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* COMPONENTE DE IMPRESIÓN Y CONTRATO OFICIAL */}
        {ventaParaImprimir && (
          <RemisionPagarePrint
            venta={ventaParaImprimir}
            onClose={() => setVentaParaImprimir(null)}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
