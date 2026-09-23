'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Store, 
  Search, 
  ShoppingCart, 
  Calculator, 
  FileText, 
  CheckCircle, 
  Printer, 
  Share2, 
  MapPin, 
  Phone, 
  User, 
  Calendar, 
  DollarSign, 
  Plus, 
  Minus, 
  Trash2, 
  PenTool, 
  ShieldCheck, 
  Loader2, 
  RefreshCw,
  Clock,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';
import { CATALOGO_PRODUCTOS_INICIAL, CatalogoItem, calcularPlanCredito } from '@/lib/catalogo-kiosco';
import { SignaturePadModal } from '@/components/ventas/SignaturePadModal';
import { DigitalizadorModal } from '@/components/boveda/digitalizador-modal';
import { useBluetoothPrinter } from '@/hooks/use-bluetooth-printer';

interface ItemCarrito {
  producto: CatalogoItem;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export default function MobileKioscoPage() {
  const { data: session } = useSession();
  const { isConnected, printVentaTicket, connectToPrinter } = useBluetoothPrinter();

  // Pestaña activa
  const [tab, setTab] = useState<'catalogo' | 'pedido' | 'historial'>('catalogo');

  // Catálogo y Búsqueda
  const [productos, setProductos] = useState<CatalogoItem[]>(CATALOGO_PRODUCTOS_INICIAL);
  const [categoriaActiva, setCategoriaActiva] = useState<string>('Todos');
  const [busqueda, setBusqueda] = useState<string>('');
  const [loadingProductos, setLoadingProductos] = useState(false);

  // Carrito de compras móvil
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);

  // Configuración de Financiamiento / Venta
  const [tipoVenta, setTipoVenta] = useState<'credito' | 'contado'>('credito');
  const [enganche, setEnganche] = useState<number>(0);
  const [plazoSemanas, setPlazoSemanas] = useState<number>(26); // 26 semanas estándar
  const [diaCobro, setDiaCobro] = useState<string>('1'); // Lunes

  // Datos del Cliente
  const [nombreCliente, setNombreCliente] = useState('');
  const [telefonoCliente, setTelefonoCliente] = useState('');
  const [direccionCliente, setDireccionCliente] = useState('');
  const [gpsUbicacion, setGpsUbicacion] = useState<{ lat: number; lng: number } | null>(null);
  const [obteniendoGps, setObteniendoGps] = useState(false);
  const [firmaCliente, setFirmaCliente] = useState<string>('');

  // Modales
  const [showFirmaModal, setShowFirmaModal] = useState(false);
  const [showBovedaModal, setShowBovedaModal] = useState(false);
  const [bovedaData, setBovedaData] = useState<{ codigoCliente?: string; folio?: string; nombre?: string } | null>(null);

  // Venta completada (Éxito)
  const [ventaCompletada, setVentaCompletada] = useState<any | null>(null);
  const [guardandoVenta, setGuardandoVenta] = useState(false);

  // Historial de ventas del usuario
  const [misVentas, setMisVentas] = useState<any[]>([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);

  const categorias = [
    'Todos',
    'Estufas',
    'Lavadoras',
    'Salas',
    'Colchones',
    'Bases',
    'Roperos',
    'Electrodomésticos',
    'Audio y TV'
  ];

  // Cargar productos de la base de datos (con fallback local)
  useEffect(() => {
    cargarProductos();
    cargarMisVentas();
  }, []);

  const cargarProductos = async () => {
    try {
      setLoadingProductos(true);
      const res = await fetch('/api/inventario/productos');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setProductos(data);
        }
      }
    } catch (e) {
      console.warn('Usando catálogo base de productos offline:', e);
    } finally {
      setLoadingProductos(false);
    }
  };

  const cargarMisVentas = async () => {
    try {
      setLoadingHistorial(true);
      const res = await fetch('/api/ventas?limit=15');
      if (res.ok) {
        const data = await res.json();
        setMisVentas(data.ventas || []);
      }
    } catch (e) {
      console.error('Error cargando historial de ventas:', e);
    } finally {
      setLoadingHistorial(false);
    }
  };

  // Filtrado de productos
  const productosFiltrados = productos.filter(p => {
    const coincideCat = categoriaActiva === 'Todos' || p.categoria === categoriaActiva;
    const query = busqueda.toLowerCase().trim();
    const coincideQuery = !query || 
      p.nombre.toLowerCase().includes(query) || 
      p.codigo.toLowerCase().includes(query) || 
      p.marca?.toLowerCase().includes(query);
    return coincideCat && coincideQuery;
  });

  // Cálculos de Totales y Crédito
  const totalArticulos = carrito.reduce((sum, item) => sum + item.subtotal, 0);
  const planCredito = calcularPlanCredito(totalArticulos, enganche, 'semanal', plazoSemanas);

  // Manejo de Carrito
  const agregarAlCarrito = (prod: CatalogoItem) => {
    setCarrito(prev => {
      const idx = prev.findIndex(item => item.producto.id === prod.id || item.producto.codigo === prod.codigo);
      if (idx >= 0) {
        const clon = [...prev];
        clon[idx].cantidad += 1;
        clon[idx].subtotal = clon[idx].cantidad * clon[idx].precioUnitario;
        return clon;
      } else {
        const precioUnitario = tipoVenta === 'contado' ? (prod.precioContado || prod.precioVenta) : prod.precioVenta;
        return [...prev, {
          producto: prod,
          cantidad: 1,
          precioUnitario,
          subtotal: precioUnitario
        }];
      }
    });
    toast.success(`Agregado: ${prod.nombre}`);
  };

  const modificarCantidad = (codigo: string, delta: number) => {
    setCarrito(prev => {
      return prev.map(item => {
        if (item.producto.codigo === codigo) {
          const nuevaCant = item.cantidad + delta;
          if (nuevaCant <= 0) return null;
          return {
            ...item,
            cantidad: nuevaCant,
            subtotal: nuevaCant * item.precioUnitario
          };
        }
        return item;
      }).filter(Boolean) as ItemCarrito[];
    });
  };

  // Captura GPS en el domicilio del cliente
  const capturarUbicacionGps = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocalización no soportada en este dispositivo');
      return;
    }
    setObteniendoGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsUbicacion({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });
        setObteniendoGps(false);
        toast.success('Ubicación GPS capturada con éxito');
      },
      (err) => {
        setObteniendoGps(false);
        console.warn('Error GPS:', err);
        toast.error('No se pudo obtener la ubicación GPS');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Registro de la venta
  const registrarVentaEnCampo = async () => {
    if (!nombreCliente.trim()) {
      toast.error('Ingresa el nombre del cliente');
      return;
    }
    if (carrito.length === 0) {
      toast.error('El pedido debe tener al menos un producto');
      return;
    }

    setGuardandoVenta(true);
    try {
      const payload = {
        tipoVenta,
        nombreCliente: nombreCliente.trim(),
        telefonoCliente: telefonoCliente.trim(),
        direccionCliente: direccionCliente.trim(),
        ciudadCliente: 'Aculco, Edo. de Méx.',
        vendedor: session?.user?.name || 'VENTA EN CAMPO',
        vendedorId: (session?.user as any)?.id || null,
        subtotal: totalArticulos,
        descuento: 0,
        total: totalArticulos,
        enganche: tipoVenta === 'credito' ? planCredito.enganche : totalArticulos,
        saldoFinanciado: tipoVenta === 'credito' ? planCredito.saldoFinanciado : 0,
        periodicidad: 'semanal',
        plazoSemanas: tipoVenta === 'credito' ? plazoSemanas : 1,
        montoCuota: tipoVenta === 'credito' ? planCredito.montoCuota : totalArticulos,
        diaPago: diaCobro,
        firmaCliente: firmaCliente || undefined,
        observaciones: `Venta registrada desde Kiosco Móvil en Campo.${gpsUbicacion ? ` GPS: ${gpsUbicacion.lat}, ${gpsUbicacion.lng}` : ''}`,
        articulos: carrito.map(item => ({
          concepto: item.producto.nombre,
          cantidad: item.cantidad,
          precioUnitario: item.precioUnitario,
          subtotal: item.subtotal,
          productoId: item.producto.id
        }))
      };

      const res = await fetch('/api/ventas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al guardar la venta');
      }

      const resultado = await res.json();
      setVentaCompletada({
        folio: resultado.folio,
        cliente: {
          nombre: nombreCliente,
          telefono: telefonoCliente,
          direccion: direccionCliente,
          codigoCliente: resultado.nuevoCodigoCliente
        },
        tipoVenta,
        total: totalArticulos,
        enganche: planCredito.enganche,
        saldoFinanciado: planCredito.saldoFinanciado,
        plazoSemanas,
        montoCuota: planCredito.montoCuota,
        diaPago: diaCobro,
        articulos: carrito.map(item => ({
          concepto: item.producto.nombre,
          cantidad: item.cantidad,
          precioUnitario: item.precioUnitario,
          subtotal: item.subtotal
        }))
      });

      // Limpiar formulario y carrito
      setCarrito([]);
      setNombreCliente('');
      setTelefonoCliente('');
      setDireccionCliente('');
      setFirmaCliente('');
      setEnganche(0);
      setGpsUbicacion(null);

      toast.success('¡Venta registrada exitosamente!');
      cargarMisVentas();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Error al procesar la venta');
    } finally {
      setGuardandoVenta(false);
    }
  };

  // Impresión Bluetooth del Ticket
  const imprimirTicketVenta = async (venta: any) => {
    if (!isConnected) {
      toast.info('Conectando impresora Bluetooth...');
      const ok = await connectToPrinter();
      if (!ok) return;
    }

    try {
      await printVentaTicket({
        folio: venta.folio,
        fecha: new Date().toISOString(),
        cliente: {
          nombre: venta.cliente.nombre,
          telefono: venta.cliente.telefono,
          direccion: venta.cliente.direccion
        },
        vendedor: {
          nombre: session?.user?.name || 'ASESOR EN CAMPO'
        },
        tipoVenta: venta.tipoVenta,
        articulos: venta.articulos,
        total: venta.total,
        enganche: venta.enganche,
        saldoFinanciado: venta.saldoFinanciado,
        plazoSemanas: venta.plazoSemanas,
        montoCuota: venta.montoCuota,
        diaPago: venta.diaPago
      });
    } catch (e) {
      console.error('Error al imprimir:', e);
    }
  };

  // Compartir por WhatsApp
  const compartirWhatsApp = (venta: any) => {
    const articulosTxt = venta.articulos.map((a: any) => `• ${a.cantidad}x ${a.concepto} ($${a.subtotal})`).join('\n');
    let mensaje = `*MUEBLERÍA LA ECONÓMICA* 🏠✨\n`;
    mensaje += `*Comprobante de Venta #${venta.folio}*\n\n`;
    mensaje += `Estimado(a) *${venta.cliente.nombre}*,\n`;
    mensaje += `Confirmamos su compra:\n\n${articulosTxt}\n\n`;
    mensaje += `*Total:* $${venta.total.toLocaleString('es-MX')}\n`;

    if (venta.tipoVenta === 'credito') {
      mensaje += `*Enganche pagado:* $${venta.enganche.toLocaleString('es-MX')}\n`;
      mensaje += `*Saldo a crédito:* $${venta.saldoFinanciado.toLocaleString('es-MX')}\n`;
      mensaje += `*Plan de pagos:* ${venta.plazoSemanas} semanas\n`;
      mensaje += `*Pago semanal:* $${venta.montoCuota.toLocaleString('es-MX')}\n`;
      mensaje += `*Día de cobro:* Día ${venta.diaPago}\n`;
    } else {
      mensaje += `*Modalidad:* Contado (Liquidado)\n`;
    }

    mensaje += `\nAsesor: ${session?.user?.name || 'Mueblería La Económica'}\n`;
    mensaje += `¡Gracias por su confianza!`;

    const telLimpio = venta.cliente.telefono?.replace(/\D/g, '') || '';
    const url = telLimpio.length >= 10 
      ? `https://wa.me/52${telLimpio.slice(-10)}?text=${encodeURIComponent(mensaje)}`
      : `https://wa.me/?text=${encodeURIComponent(mensaje)}`;

    window.open(url, '_blank');
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Título y Navegación de Pestañas Móviles */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Store className="w-5 h-5 text-amber-400" />
            Kiosco en Campo
          </h2>
          <p className="text-xs text-slate-400">Cotizador y ventas para asesores en ruta</p>
        </div>

        {carrito.length > 0 && (
          <Button
            size="sm"
            onClick={() => setTab('pedido')}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-9 px-3 gap-1.5 shadow-lg shadow-emerald-950"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>${totalArticulos}</span>
            <span className="w-5 h-5 rounded-full bg-white text-emerald-800 text-[11px] font-black flex items-center justify-center ml-1">
              {carrito.reduce((s, i) => s + i.cantidad, 0)}
            </span>
          </Button>
        )}
      </div>

      {/* Tabs Píldora */}
      <div className="grid grid-cols-3 gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold">
        <button
          onClick={() => setTab('catalogo')}
          className={`py-2 rounded-lg transition-all ${
            tab === 'catalogo' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          Catálogo ({productosFiltrados.length})
        </button>
        <button
          onClick={() => setTab('pedido')}
          className={`py-2 rounded-lg transition-all relative ${
            tab === 'pedido' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          Cotizar / Pedido
          {carrito.length > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-400"></span>
          )}
        </button>
        <button
          onClick={() => setTab('historial')}
          className={`py-2 rounded-lg transition-all ${
            tab === 'historial' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          Mis Ventas
        </button>
      </div>

      {/* ========================================================================= */}
      {/* PESTAÑA 1: CATÁLOGO Y COTIZADOR RÁPIDO */}
      {/* ========================================================================= */}
      {tab === 'catalogo' && (
        <div className="space-y-3">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar estufa, sala, lavadora..."
              className="pl-9 h-11 bg-slate-900 border-slate-800 text-white placeholder:text-slate-500"
            />
            {busqueda && (
              <button 
                onClick={() => setBusqueda('')} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                Limpiar
              </button>
            )}
          </div>

          {/* Categorías deslizables */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            {categorias.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoriaActiva(cat)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full font-bold transition-all border ${
                  categoriaActiva === cat
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Lista de productos */}
          {loadingProductos ? (
            <div className="py-12 text-center text-slate-400">
              <Loader2 className="w-7 h-7 animate-spin mx-auto mb-2 text-amber-500" />
              <p className="text-xs">Cargando catálogo...</p>
            </div>
          ) : productosFiltrados.length === 0 ? (
            <div className="py-12 text-center text-slate-400 bg-slate-900/40 rounded-xl border border-slate-800">
              <Store className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              <p className="text-sm font-semibold">No se encontraron productos</p>
              <p className="text-xs text-slate-500 mt-1">Prueba con otra palabra o categoría</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {productosFiltrados.map((prod) => {
                // Cálculo rápido a 26 semanas sin enganche
                const cuotaEstimada = Math.ceil(prod.precioVenta / 26);

                return (
                  <Card key={prod.id || prod.codigo} className="bg-slate-900 border-slate-800 overflow-hidden shadow-sm">
                    <CardContent className="p-3.5 flex flex-col justify-between h-full gap-3">
                      <div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1">
                          <span className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-400 font-bold">{prod.categoria}</span>
                          <span>{prod.codigo}</span>
                        </div>
                        <h3 className="font-bold text-white text-sm line-clamp-2 leading-tight">
                          {prod.nombre}
                        </h3>
                        {prod.marca && (
                          <p className="text-xs text-slate-400 mt-0.5">Marca: {prod.marca}</p>
                        )}
                      </div>

                      {/* Precios y Cuota en letras grandes */}
                      <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                        <div>
                          <div className="text-[10px] text-slate-400 uppercase font-bold">Desde</div>
                          <div className="text-lg font-black text-emerald-400">
                            ${cuotaEstimada} <span className="text-[11px] font-normal text-slate-400">/sem</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-[10px] text-slate-400">Total Crédito</div>
                          <div className="text-sm font-bold text-white font-mono">
                            ${prod.precioVenta.toLocaleString()}
                          </div>
                          {prod.precioContado && prod.precioContado < prod.precioVenta && (
                            <div className="text-[10px] text-slate-400">
                              Contado: ${prod.precioContado.toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Botón de acción */}
                      <Button
                        size="sm"
                        onClick={() => agregarAlCarrito(prod)}
                        className="w-full bg-slate-800 hover:bg-emerald-600 text-white font-bold h-9 text-xs transition-colors gap-1.5 border border-slate-700"
                      >
                        <Plus className="w-4 h-4" />
                        Agregar al Pedido
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* PESTAÑA 2: SIMULADOR, PEDIDO Y CIERRE DE VENTA */}
      {/* ========================================================================= */}
      {tab === 'pedido' && (
        <div className="space-y-4">
          {/* Modal / Alerta de venta completada si existe */}
          {ventaCompletada && (
            <Card className="bg-emerald-950/40 border-emerald-600 text-white shadow-xl">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <CheckCircle className="w-6 h-6 flex-shrink-0" />
                  <div>
                    <h3 className="text-base">¡Venta Registrada Exitosamente!</h3>
                    <p className="text-xs text-slate-300">Folio: #{ventaCompletada.folio} • Cliente: {ventaCompletada.cliente.nombre}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Button
                    size="sm"
                    onClick={() => imprimirTicketVenta(ventaCompletada)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold gap-1 text-xs h-10"
                  >
                    <Printer className="w-4 h-4" />
                    Imprimir Ticket
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => compartirWhatsApp(ventaCompletada)}
                    className="bg-slate-900 border-emerald-500/50 hover:bg-slate-800 text-emerald-400 font-bold gap-1 text-xs h-10"
                  >
                    <Share2 className="w-4 h-4" />
                    Enviar WhatsApp
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setBovedaData({
                        codigoCliente: ventaCompletada.cliente.codigoCliente,
                        folio: ventaCompletada.folio.toString(),
                        nombre: ventaCompletada.cliente.nombre
                      });
                      setShowBovedaModal(true);
                    }}
                    className="flex-1 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-950/40 h-8"
                  >
                    <ShieldCheck className="w-4 h-4 mr-1" />
                    Fotografiar INE / Docs (Bóveda)
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setVentaCompletada(null)}
                    className="text-xs text-slate-400 hover:text-white h-8"
                  >
                    Cerrar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Lista de Artículos en el Carrito */}
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
                  <ShoppingCart className="w-4 h-4 text-amber-400" />
                  Artículos del Pedido ({carrito.length})
                </h3>
                {carrito.length > 0 && (
                  <button
                    onClick={() => setCarrito([])}
                    className="text-[11px] text-rose-400 hover:underline"
                  >
                    Vaciar
                  </button>
                )}
              </div>

              {carrito.length === 0 ? (
                <div className="py-8 text-center text-slate-500">
                  <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-xs">No hay artículos en el pedido</p>
                  <Button
                    size="sm"
                    variant="link"
                    onClick={() => setTab('catalogo')}
                    className="text-amber-400 text-xs mt-1"
                  >
                    Explorar catálogo
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {carrito.map((item) => (
                    <div
                      key={item.producto.codigo}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800"
                    >
                      <div className="max-w-[55%]">
                        <p className="font-bold text-white text-xs truncate">{item.producto.nombre}</p>
                        <p className="text-[10px] text-slate-400 font-mono">${item.precioUnitario} c/u</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center border border-slate-700 rounded-lg bg-slate-900">
                          <button
                            onClick={() => modificarCantidad(item.producto.codigo, -1)}
                            className="p-1 hover:text-rose-400 text-slate-400"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-2 text-xs font-bold text-white">{item.cantidad}</span>
                          <button
                            onClick={() => modificarCantidad(item.producto.codigo, 1)}
                            className="p-1 hover:text-emerald-400 text-slate-400"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <span className="text-xs font-bold text-white font-mono w-16 text-right">
                          ${item.subtotal}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Simulador Financiero Rápido */}
          {carrito.length > 0 && (
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
                    <Calculator className="w-4 h-4 text-emerald-400" />
                    Simulador de Crédito en Campo
                  </h3>
                  
                  {/* Selector Contado / Crédito */}
                  <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs font-bold">
                    <button
                      onClick={() => setTipoVenta('credito')}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        tipoVenta === 'credito' ? 'bg-emerald-600 text-white' : 'text-slate-400'
                      }`}
                    >
                      Crédito
                    </button>
                    <button
                      onClick={() => setTipoVenta('contado')}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        tipoVenta === 'contado' ? 'bg-blue-600 text-white' : 'text-slate-400'
                      }`}
                    >
                      Contado
                    </button>
                  </div>
                </div>

                {tipoVenta === 'credito' && (
                  <div className="space-y-3">
                    {/* Enganche */}
                    <div>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-slate-400 font-semibold">Enganche Inicial:</span>
                        <span className="font-bold text-white font-mono">${enganche}</span>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5">
                        {[0, 200, 500, 1000].map(monto => (
                          <button
                            key={monto}
                            onClick={() => setEnganche(monto)}
                            className={`py-1.5 rounded-lg text-xs font-bold border transition-all ${
                              enganche === monto
                                ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500'
                                : 'bg-slate-950 text-slate-400 border-slate-800'
                            }`}
                          >
                            ${monto}
                          </button>
                        ))}
                      </div>
                      <div className="mt-1.5">
                        <Input
                          type="number"
                          placeholder="Otro enganche..."
                          value={enganche === 0 ? '' : enganche}
                          onChange={(e) => setEnganche(Math.max(0, parseFloat(e.target.value) || 0))}
                          className="h-8 text-xs bg-slate-950 border-slate-800 text-white"
                        />
                      </div>
                    </div>

                    {/* Plazo en Semanas */}
                    <div>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-slate-400 font-semibold">Plazo del Crédito:</span>
                        <span className="font-bold text-amber-400">{plazoSemanas} Semanas ({Math.round(plazoSemanas / 4.3)} meses)</span>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5 text-xs font-bold">
                        {[
                          { sem: 13, label: '3 Meses' },
                          { sem: 26, label: '6 Meses' },
                          { sem: 39, label: '9 Meses' },
                          { sem: 52, label: '12 Meses' }
                        ].map(p => (
                          <button
                            key={p.sem}
                            onClick={() => setPlazoSemanas(p.sem)}
                            className={`py-2 rounded-lg border text-center transition-all ${
                              plazoSemanas === p.sem
                                ? 'bg-amber-500/20 text-amber-400 border-amber-500'
                                : 'bg-slate-950 text-slate-400 border-slate-800'
                            }`}
                          >
                            <div>{p.sem} sem</div>
                            <div className="text-[9px] font-normal opacity-75">{p.label}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Día de cobro semanal */}
                    <div>
                      <span className="text-slate-400 text-xs font-semibold block mb-1.5">Día de Cobro en Ruta:</span>
                      <div className="grid grid-cols-7 gap-1 text-[11px] font-bold">
                        {[
                          { id: '1', label: 'Lun' },
                          { id: '2', label: 'Mar' },
                          { id: '3', label: 'Mié' },
                          { id: '4', label: 'Jue' },
                          { id: '5', label: 'Vie' },
                          { id: '6', label: 'Sáb' },
                          { id: '7', label: 'Dom' }
                        ].map(dia => (
                          <button
                            key={dia.id}
                            onClick={() => setDiaCobro(dia.id)}
                            className={`py-1.5 rounded-lg border text-center transition-all ${
                              diaCobro === dia.id
                                ? 'bg-blue-600 text-white border-blue-500'
                                : 'bg-slate-950 text-slate-400 border-slate-800'
                            }`}
                          >
                            {dia.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Resumen del cálculo para decirle al cliente */}
                    <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-center space-y-1">
                      <div className="text-xs text-emerald-400 font-bold uppercase tracking-wider">
                        Pago Semanal a Cobrar
                      </div>
                      <div className="text-3xl font-black text-white">
                        ${planCredito.montoCuota}
                        <span className="text-sm font-normal text-slate-300"> / semana</span>
                      </div>
                      <div className="text-[11px] text-slate-400 flex justify-center gap-3 pt-1 border-t border-emerald-900/40">
                        <span>Total: <strong>${planCredito.subtotal}</strong></span>
                        <span>Saldo: <strong>${planCredito.saldoFinanciado}</strong></span>
                        <span>Plazo: <strong>{planCredito.numeroPagos} pagos</strong></span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Datos del Cliente y Cierre */}
          {carrito.length > 0 && (
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-4 space-y-3">
                <h3 className="font-bold text-white text-sm flex items-center gap-1.5 border-b border-slate-800 pb-2">
                  <User className="w-4 h-4 text-blue-400" />
                  Datos del Cliente en Campo
                </h3>

                <div className="space-y-2.5">
                  <div>
                    <label className="text-xs text-slate-400 font-semibold block mb-1">Nombre Completo *</label>
                    <Input
                      value={nombreCliente}
                      onChange={(e) => setNombreCliente(e.target.value)}
                      placeholder="Ej. Juan Pérez García"
                      className="bg-slate-950 border-slate-800 text-white h-10"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-slate-400 font-semibold block mb-1">Teléfono Móvil</label>
                      <Input
                        value={telefonoCliente}
                        onChange={(e) => setTelefonoCliente(e.target.value)}
                        placeholder="10 dígitos"
                        type="tel"
                        className="bg-slate-950 border-slate-800 text-white h-10"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 font-semibold block mb-1">Ubicación GPS</label>
                      <Button
                        type="button"
                        onClick={capturarUbicacionGps}
                        disabled={obteniendoGps}
                        variant="outline"
                        className={`w-full h-10 text-xs font-bold border-slate-800 ${
                          gpsUbicacion ? 'bg-emerald-950/60 text-emerald-400 border-emerald-700' : 'bg-slate-950 text-slate-300'
                        }`}
                      >
                        <MapPin className="w-3.5 h-3.5 mr-1" />
                        {obteniendoGps ? 'Obteniendo...' : gpsUbicacion ? 'GPS Capturado' : 'Obtener GPS'}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 font-semibold block mb-1">Dirección / Referencia</label>
                    <Input
                      value={direccionCliente}
                      onChange={(e) => setDireccionCliente(e.target.value)}
                      placeholder="Calle, Número, Comunidad o Referencia..."
                      className="bg-slate-950 border-slate-800 text-white h-10"
                    />
                  </div>

                  {/* Firma del cliente con el dedo */}
                  <div>
                    <label className="text-xs text-slate-400 font-semibold block mb-1">Firma Digital del Cliente</label>
                    <Button
                      type="button"
                      onClick={() => setShowFirmaModal(true)}
                      variant="outline"
                      className={`w-full h-11 text-xs font-bold border-slate-800 justify-start ${
                        firmaCliente ? 'bg-emerald-950/40 text-emerald-400 border-emerald-600' : 'bg-slate-950 text-slate-300'
                      }`}
                    >
                      <PenTool className="w-4 h-4 mr-2 text-amber-400" />
                      {firmaCliente ? '✓ Firma Capturada en Pantalla' : 'Tocar para Firmar con el Dedo'}
                    </Button>
                  </div>
                </div>

                {/* Botón de Cierre de Venta */}
                <div className="pt-2">
                  <Button
                    onClick={registrarVentaEnCampo}
                    disabled={guardandoVenta || !nombreCliente.trim()}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black h-12 text-sm shadow-lg shadow-emerald-950 gap-2"
                  >
                    {guardandoVenta ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <CheckCircle className="w-5 h-5" />
                    )}
                    {guardandoVenta ? 'Registrando Pedido...' : `Confirmar Venta (${formatCurrency(totalArticulos)})`}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* PESTAÑA 3: HISTORIAL DE MIS VENTAS EN CAMPO */}
      {/* ========================================================================= */}
      {tab === 'historial' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-400" />
              Mis Ventas Levantadas
            </h3>
            <Button
              size="sm"
              variant="ghost"
              onClick={cargarMisVentas}
              className="text-xs text-slate-400 hover:text-white h-8 gap-1"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingHistorial ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>

          {loadingHistorial ? (
            <div className="py-12 text-center text-slate-400">
              <Loader2 className="w-7 h-7 animate-spin mx-auto mb-2 text-amber-500" />
              <p className="text-xs">Cargando ventas...</p>
            </div>
          ) : misVentas.length === 0 ? (
            <div className="py-12 text-center text-slate-500 bg-slate-900/40 rounded-xl border border-slate-800">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-semibold text-slate-300">Aún no hay ventas registradas</p>
              <p className="text-xs text-slate-500 mt-1">Usa la pestaña Catálogo para cotizar y registrar tu primera venta</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {misVentas.map((v) => (
                <Card key={v.id || v.folio} className="bg-slate-900 border-slate-800 shadow-sm">
                  <CardContent className="p-3.5 space-y-2.5">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-amber-400 text-xs">#{v.folio}</span>
                          <Badge variant="outline" className={`text-[10px] uppercase font-bold py-0 ${
                            v.tipoVenta === 'credito' ? 'border-emerald-600 text-emerald-400' : 'border-blue-600 text-blue-400'
                          }`}>
                            {v.tipoVenta}
                          </Badge>
                        </div>
                        <h4 className="font-bold text-white text-sm mt-0.5">{v.nombreCliente}</h4>
                        {v.telefonoCliente && (
                          <p className="text-xs text-slate-400">{v.telefonoCliente}</p>
                        )}
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-black text-white font-mono">
                          ${v.total?.toLocaleString()}
                        </div>
                        {v.tipoVenta === 'credito' && v.montoCuota && (
                          <div className="text-[11px] text-emerald-400 font-bold">
                            ${v.montoCuota}/sem
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Acciones de impresión y WhatsApp */}
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => imprimirTicketVenta({
                          folio: v.folio,
                          cliente: { nombre: v.nombreCliente, telefono: v.telefonoCliente, direccion: v.direccionCliente || '' },
                          tipoVenta: v.tipoVenta,
                          total: v.total,
                          enganche: v.enganche || 0,
                          saldoFinanciado: v.saldoFinanciado || 0,
                          plazoSemanas: v.plazoSemanas || 26,
                          montoCuota: v.montoCuota || 0,
                          diaPago: v.diaPago || '1',
                          articulos: v.detalles?.map((d: any) => ({
                            concepto: d.concepto,
                            cantidad: d.cantidad,
                            precioUnitario: d.precioUnitario,
                            subtotal: d.subtotal
                          })) || [{ concepto: 'Artículos varios', cantidad: 1, precioUnitario: v.total, subtotal: v.total }]
                        })}
                        className="flex-1 bg-slate-950 border-slate-800 hover:bg-slate-800 text-white font-semibold text-xs h-8 gap-1"
                      >
                        <Printer className="w-3.5 h-3.5 text-slate-400" />
                        Imprimir Ticket
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => compartirWhatsApp({
                          folio: v.folio,
                          cliente: { nombre: v.nombreCliente, telefono: v.telefonoCliente, direccion: v.direccionCliente || '' },
                          tipoVenta: v.tipoVenta,
                          total: v.total,
                          enganche: v.enganche || 0,
                          saldoFinanciado: v.saldoFinanciado || 0,
                          plazoSemanas: v.plazoSemanas || 26,
                          montoCuota: v.montoCuota || 0,
                          diaPago: v.diaPago || '1',
                          articulos: v.detalles?.map((d: any) => ({
                            concepto: d.concepto,
                            cantidad: d.cantidad,
                            subtotal: d.subtotal
                          })) || [{ concepto: 'Venta de catálogo', cantidad: 1, subtotal: v.total }]
                        })}
                        className="bg-slate-950 border-slate-800 hover:bg-slate-800 text-emerald-400 font-semibold text-xs h-8 px-2.5"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal de Firma con el Dedo */}
      <SignaturePadModal
        open={showFirmaModal}
        onOpenChange={setShowFirmaModal}
        onSave={(firma) => {
          setFirmaCliente(firma);
          setShowFirmaModal(false);
          toast.success('Firma guardada correctamente');
        }}
        titulo="Firma del Cliente en Campo"
      />

      {/* Modal de Bóveda Digital (Fotografiar Documentos) */}
      <DigitalizadorModal
        open={showBovedaModal}
        onOpenChange={setShowBovedaModal}
        cliente={{
          id: bovedaData?.codigoCliente,
          nombreCompleto: bovedaData?.nombre || 'Cliente Venta',
          codigoCliente: bovedaData?.codigoCliente,
          numContrato: bovedaData?.folio
        }}
        userRole="cobrador"
      />
    </div>
  );
}
