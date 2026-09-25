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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
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
  FileText,
  UserCheck,
  ShieldCheck,
  Lock,
  Boxes,
  Truck,
  ArrowRightLeft,
  Building2,
  AlertTriangle,
  MessageCircle,
  CheckCircle,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { formatCurrency, getDayName, cn } from '@/lib/utils';
import { toast } from 'sonner';
import { CATALOGO_PRODUCTOS_INICIAL, CatalogoItem, SUCURSALES_SISTEMA, SUCURSAL_SAN_LUCAS, calcularPlanCredito } from '@/lib/catalogo-kiosco';
import { RemisionPagarePrint } from '@/components/ventas/RemisionPagarePrint';
import { SignaturePadModal } from '@/components/ventas/SignaturePadModal';
import { DigitalizadorModal } from '@/components/boveda/digitalizador-modal';
import { CartItem, Cliente, User as UserType } from '@/lib/types';

export default function KioscoVentasPage() {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role;
  const userSucursalId = (session?.user as any)?.sucursalId || (session?.user as any)?.sucursal?.id;
  const userSucursalNombre = (session?.user as any)?.sucursal?.nombre;
  const esAdmin = userRole === 'admin';

  // Estados de catálogo y productos
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>('Todos');
  const [busqueda, setBusqueda] = useState<string>('');
  const [productosDB, setProductosDB] = useState<any[]>([]);
  const [cobradores, setCobradores] = useState<UserType[]>([]);
  const [sucursales, setSucursales] = useState<any[]>([]);
  const [sucursalSeleccionada, setSucursalSeleccionada] = useState<string>('');
  const [vendedores, setVendedores] = useState<any[]>([]);
  const [vendedorSeleccionadoId, setVendedorSeleccionadoId] = useState<string>('tienda');
  const [vendedorNombre, setVendedorNombre] = useState<string>('VENTA MOSTRADOR');
  const [vendedorManual, setVendedorManual] = useState<string>('');
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
  const [bovedaModalOpen, setBovedaModalOpen] = useState(false);
  const [bovedaCliente, setBovedaCliente] = useState<{
    codigoCliente?: string;
    folioContrato?: string;
    nombreCliente?: string;
    telefono?: string;
    direccion?: string;
  } | null>(null);

  // Pestañas Principales (Catálogo, Remisión/Pedido, Historial)
  const [tabPrincipal, setTabPrincipal] = useState<'catalogo' | 'pedido' | 'historial'>('catalogo');
  const [historialVentas, setHistorialVentas] = useState<any[]>([]);

  // Modal de Existencias y Traslado
  const [modalExistenciasOpen, setModalExistenciasOpen] = useState(false);
  const [productoSeleccionadoExistencias, setProductoSeleccionadoExistencias] = useState<CatalogoItem | null>(null);
  const [origenTraspasoSeleccionado, setOrigenTraspasoSeleccionado] = useState<any | null>(null);
  const [cantidadTraspaso, setCantidadTraspaso] = useState<number>(1);
  const [procesandoTraspaso, setProcesandoTraspaso] = useState(false);

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  // Si la sesión de usuario carga después de las sucursales, auto-asumir la sucursal del usuario
  useEffect(() => {
    if (sucursales.length > 0 && (userSucursalId || userSucursalNombre)) {
      const userSuc = sucursales.find((s: any) => 
        (userSucursalId && s.id === userSucursalId) ||
        (userSucursalNombre && s.nombre?.toUpperCase().trim() === userSucursalNombre?.toUpperCase().trim())
      );
      if (userSuc && sucursalSeleccionada !== userSuc.id) {
        setSucursalSeleccionada(userSuc.id);
      }
    }
  }, [userSucursalId, userSucursalNombre, sucursales]);

  // Si el usuario logueado es vendedor o usuario de sucursal, auto-asignarlo como vendedor
  useEffect(() => {
    if (session?.user) {
      const currentUserId = (session.user as any)?.id;
      const currentUserName = session.user.name;
      if (currentUserId && currentUserName) {
        setVendedorSeleccionadoId(currentUserId);
        setVendedorNombre(currentUserName);
      }
    }
  }, [session]);

  const cargarDatosIniciales = async () => {
    try {
      setLoading(true);
      const [resCobradores, resSucursales, resProductos, resVendedores] = await Promise.all([
        fetch('/api/users/cobradores'),
        fetch('/api/inventario/sucursales'),
        fetch('/api/inventario/productos'),
        fetch('/api/users/vendedores')
      ]);

      if (resCobradores.ok) {
        const data = await resCobradores.json();
        setCobradores(data || []);
      }

      if (resVendedores.ok) {
        const data = await resVendedores.json();
        setVendedores(data || []);
      }

      if (resSucursales.ok) {
        const data = await resSucursales.json();
        setSucursales(data || []);

        // Si el usuario tiene una sucursal asignada en su perfil/sesión, asume esa sucursal
        const userSuc = data?.find((s: any) => 
          (userSucursalId && s.id === userSucursalId) ||
          (userSucursalNombre && s.nombre?.toUpperCase().trim() === userSucursalNombre?.toUpperCase().trim())
        );

        if (userSuc) {
          setSucursalSeleccionada(userSuc.id);
        } else {
          // Si no tiene sucursal asignada (ej. admin general), priorizar San Lucas o la primera
          const sanLucas = data?.find((s: any) => 
            s.nombre?.toUpperCase().includes('SAN LUCAS')
          );
          const inicialId = sanLucas ? sanLucas.id : (data.length > 0 ? data[0].id : '');
          setSucursalSeleccionada(inicialId);
        }
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

  const sucursalActual = sucursales.find(s => s.id === sucursalSeleccionada) ||
    SUCURSALES_SISTEMA.find(s => s.id === sucursalSeleccionada) ||
    SUCURSAL_SAN_LUCAS;

  const handleCambiarSucursal = (id: string) => {
    setSucursalSeleccionada(id);
    const suc = sucursales.find(s => s.id === id);
    if (suc) {
      toast.info(`Sucursal seleccionada: ${suc.nombre}`);
      const vendSuc = vendedores.find(v => v.sucursalId === id);
      if (vendSuc) {
        setVendedorSeleccionadoId(vendSuc.id);
        setVendedorNombre(vendSuc.name);
      } else {
        setVendedorSeleccionadoId('tienda');
        setVendedorNombre('VENTA MOSTRADOR');
      }
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
    const valorMayus = query.toUpperCase();
    setNombreCliente(valorMayus);
    if (valorMayus.length > 2) {
      try {
        const res = await fetch(`/api/clientes?search=${encodeURIComponent(valorMayus)}&limit=5`);
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
    setNombreCliente((c.nombreCompleto || '').toUpperCase());
    setTelefonoCliente((c.telefono || '').toUpperCase());
    setDireccionCliente((c.direccionCompleta || '').toUpperCase());
    if (c.cobradorAsignadoId) setCobradorAsignadoId(c.cobradorAsignadoId);
    if (c.diaPago) setDiaPago(c.diaPago.toString());
    setClientesExistentes([]);
    toast.success(`Cliente seleccionado: ${c.nombreCompleto} (${c.codigoCliente})`);
  };

  // Función para obtener la existencia real de un producto en la sucursal activa o especificada
  const obtenerStockSucursal = (item: any, targetSucursalId?: string, targetSucursalNombre?: string): number => {
    if (!item) return 0;
    const sucId = targetSucursalId || sucursalSeleccionada || sucursalActual?.id;
    const sucNom = targetSucursalNombre || sucursalActual?.nombre || '';

    // 1. Revisar stock por sucursal si viene de la base de datos
    if (item.stockPorSucursal && Array.isArray(item.stockPorSucursal) && item.stockPorSucursal.length > 0) {
      const reg = item.stockPorSucursal.find((s: any) => 
        (s.sucursalId && sucId && s.sucursalId === sucId) ||
        (s.sucursalNombre && sucNom && 
         s.sucursalNombre.toUpperCase().trim() === sucNom.toUpperCase().trim())
      );
      if (reg !== undefined) {
        return Number(reg.cantidad) || 0;
      }
    }

    // 2. Si no hay registro explícito en BD para esta sucursal:
    const esSanLucas = sucNom.toUpperCase().includes('SAN LUCAS');
    if (esSanLucas) {
      return item.stockSugerido || item.stockTotal || 5;
    }

    return item.stockSugerido ? Math.min(3, item.stockSugerido) : 2;
  };

  // Agregar producto del catálogo al carrito
  const agregarAlCarrito = (item: CatalogoItem) => {
    const stockDisp = obtenerStockSucursal(item);
    const existenteIndex = carrito.findIndex(c => c.concepto === item.nombre);
    const cantActual = existenteIndex >= 0 ? carrito[existenteIndex].cantidad : 0;

    if (cantActual >= stockDisp) {
      toast.error(`Existencia insuficiente: Solo hay ${stockDisp} unidad(es) de "${item.nombre}" en ${sucursalActual?.nombre || 'esta sucursal'}`);
      return;
    }

    const precio = tipoVenta === 'contado' ? item.precioContado : item.precioVenta;

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
    const precio = Math.round(parseFloat(customProduct.precio));
    if (!customProduct.concepto || isNaN(precio) || precio <= 0) {
      toast.error('Ingrese un concepto válido y un precio mayor a 0');
      return;
    }

    setCarrito([
      ...carrito,
      {
        concepto: customProduct.concepto.trim().toUpperCase(),
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

  const abrirModalExistencias = (prod: CatalogoItem) => {
    setProductoSeleccionadoExistencias(prod);
    setOrigenTraspasoSeleccionado(null);
    setCantidadTraspaso(1);
    setModalExistenciasOpen(true);
  };

  const handleRegistrarTraspaso = async (origen: any, cantidad: number) => {
    if (!productoSeleccionadoExistencias || !sucursalActual) return;
    try {
      setProcesandoTraspaso(true);
      const res = await fetch('/api/inventario/movimientos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productoId: productoSeleccionadoExistencias.id,
          codigo: productoSeleccionadoExistencias.codigo,
          tipoMovimiento: 'traspaso',
          cantidad,
          sucursalOrigenId: origen.id,
          sucursalDestinoId: sucursalActual.id,
          motivo: `Solicitud de traslado desde Kiosco por ${vendedorNombre || session?.user?.name || 'Vendedor'}`,
          referencia: `TRAS-KIOSCO-${Date.now().toString().slice(-6)}`
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al procesar el traslado');
      }

      toast.success(`¡Traslado de ${cantidad} pza(s) registrado con éxito desde ${origen.nombre} hacia ${sucursalActual.nombre}!`);
      // Recargar catálogo de inventario
      const prodRes = await fetch('/api/inventario/productos');
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setProductosDB(prodData);
      }
      setOrigenTraspasoSeleccionado(null);
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'No se pudo completar el traslado');
    } finally {
      setProcesandoTraspaso(false);
    }
  };

  const handleCompartirTraspasoWhatsApp = (origen: any, cantidad: number) => {
    if (!productoSeleccionadoExistencias || !sucursalActual) return;

    let mensaje = `📦 *SOLICITUD DE TRASLADO DE PRODUCTO*\n`;
    mensaje += `*Mueblería La Económica*\n\n`;
    mensaje += `*Producto:* ${productoSeleccionadoExistencias.nombre}\n`;
    mensaje += `*Código:* ${productoSeleccionadoExistencias.codigo}\n`;
    mensaje += `*Cantidad Solicitada:* ${cantidad} unidad(es)\n\n`;
    mensaje += `📍 *Origen:* ${origen.nombre}\n`;
    mensaje += `🎯 *Destino:* ${sucursalActual.nombre}\n`;
    mensaje += `👤 *Solicitado por:* ${vendedorNombre || session?.user?.name || 'Asesor Kiosco'}\n`;
    mensaje += `📅 *Fecha:* ${new Date().toLocaleDateString('es-MX')} ${new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}\n\n`;
    mensaje += `_Por favor autorizar y preparar el movimiento para entrega al cliente._`;

    const telLimpio = origen.telefono?.replace(/\D/g, '') || '';
    const url = telLimpio.length >= 10
      ? `https://wa.me/52${telLimpio.slice(-10)}?text=${encodeURIComponent(mensaje)}`
      : `https://wa.me/?text=${encodeURIComponent(mensaje)}`;

    window.open(url, '_blank');
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

  // Combinar catálogo inicial con productos registrados / actualizados en BD
  const catalogoCombinado = React.useMemo(() => {
    if (productosDB && productosDB.length > 0) {
      const mapaDB = new Map(productosDB.map((p: any) => [p.codigo?.toUpperCase(), p]));
      
      const catalogoActualizado = CATALOGO_PRODUCTOS_INICIAL.map(item => {
        const prodDB = mapaDB.get(item.codigo?.toUpperCase());
        if (prodDB) {
          mapaDB.delete(item.codigo?.toUpperCase());
          return {
            ...item,
            id: prodDB.id || item.id,
            nombre: prodDB.nombre || item.nombre,
            precioVenta: prodDB.precioVenta || item.precioVenta,
            precioContado: prodDB.precioCompra || item.precioContado,
            categoria: (prodDB.categoria || item.categoria) as any,
            descripcion: prodDB.descripcion || item.descripcion,
            stockTotal: prodDB.stockTotal,
            stockPorSucursal: prodDB.stockPorSucursal || []
          };
        }
        return {
          ...item,
          stockTotal: item.stockSugerido || 5,
          stockPorSucursal: SUCURSALES_SISTEMA.map(s => ({
            sucursalId: s.id,
            sucursalNombre: s.nombre,
            cantidad: s.nombre.includes('SAN LUCAS') ? (item.stockSugerido || 5) : 3
          }))
        };
      });

      // Agregar cualquier producto nuevo creado en BD que no esté en el catálogo inicial
      const nuevosDeBD: CatalogoItem[] = Array.from(mapaDB.values()).map((p: any) => ({
        id: p.id,
        codigo: p.codigo,
        nombre: p.nombre,
        categoria: (p.categoria || 'Cocinas y Muebles') as any,
        marca: 'General',
        precioContado: p.precioCompra || p.precioVenta,
        precioVenta: p.precioVenta,
        descripcion: p.descripcion || '',
        stockTotal: p.stockTotal || 0,
        stockPorSucursal: p.stockPorSucursal || []
      }));

      return [...catalogoActualizado, ...nuevosDeBD];
    }
    
    // Si aún no carga productosDB, asumir catálogo inicial con existencia en todas las sucursales
    return CATALOGO_PRODUCTOS_INICIAL.map(item => ({
      ...item,
      stockTotal: item.stockSugerido || 5,
      stockPorSucursal: SUCURSALES_SISTEMA.map(s => ({
        sucursalId: s.id,
        sucursalNombre: s.nombre,
        cantidad: s.nombre.includes('SAN LUCAS') ? (item.stockSugerido || 5) : 3
      }))
    }));
  }, [productosDB]);

  // Filtrado de catálogo: SOLO mostrar productos con existencia disponible en la sucursal activa
  const catalogoFiltrado = catalogoCombinado.filter(item => {
    // 1. Filtrar estrictamente por existencia en la sucursal seleccionada
    const stockDisponible = obtenerStockSucursal(item);
    if (stockDisponible <= 0) {
      return false; // NO MOSTRAR si no hay existencia en esta sucursal
    }

    // 2. Filtro por categoría
    const matchCat = categoriaSeleccionada === 'Todos' || item.categoria === categoriaSeleccionada;
    if (!matchCat) return false;

    // 3. Filtro por búsqueda
    const matchSearch =
      item.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      item.marca.toLowerCase().includes(busqueda.toLowerCase()) ||
      (item.modelo && item.modelo.toLowerCase().includes(busqueda.toLowerCase())) ||
      (item.codigo && item.codigo.toLowerCase().includes(busqueda.toLowerCase())) ||
      (item.descripcion && item.descripcion.toLowerCase().includes(busqueda.toLowerCase()));
    return matchSearch;
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
      const nombreVendedorFinal = vendedorSeleccionadoId === 'otro'
        ? (vendedorManual.trim().toUpperCase() || 'MOSTRADOR')
        : (vendedorNombre || vendedores.find(v => v.id === vendedorSeleccionadoId)?.name || session?.user?.name || 'MOSTRADOR');

      const payload = {
        tipoVenta,
        nombreCliente: nombreCliente.trim().toUpperCase(),
        direccionCliente: direccionCliente.trim().toUpperCase(),
        ciudadCliente: ciudadCliente.trim().toUpperCase(),
        telefonoCliente: telefonoCliente.trim().toUpperCase(),
        clienteIdExistente: clienteIdExistente || undefined,
        sucursalId: sucursalSeleccionada || undefined,
        sucursalNombre: sucursalActual?.nombre || 'SAN LUCAS 3ER CUARTEL',
        vendedor: nombreVendedorFinal,
        vendedorId: vendedorSeleccionadoId && !['tienda', 'otro'].includes(vendedorSeleccionadoId) ? vendedorSeleccionadoId : undefined,
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
        nombreCliente: nombreCliente.trim().toUpperCase(),
        direccionCliente: direccionCliente.trim().toUpperCase(),
        ciudadCliente: ciudadCliente.trim().toUpperCase(),
        telefonoCliente: telefonoCliente.trim().toUpperCase(),
        codigoCliente: data.codigoCliente || 'CL-NUEVO',
        sucursalId: sucursalSeleccionada,
        sucursalNombre: sucursalActual?.nombre || 'SAN LUCAS 3ER CUARTEL',
        vendedor: nombreVendedorFinal,
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
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-gradient-to-r from-blue-900 to-indigo-900 p-6 rounded-2xl text-white shadow-lg">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <Store className="h-8 w-8 text-blue-300 shrink-0" />
              <div>
                <h1 className="text-2xl md:text-3xl font-black tracking-tight">
                  Kiosco de Ventas y Crédito
                </h1>
                <p className="text-blue-200 text-xs mt-0.5">
                  Mueblería La Económica • Levantamiento de crédito, contado y contrato
                </p>
              </div>
            </div>

            {/* Selector de Sucursal Activa */}
            {(!esAdmin && (userSucursalId || userSucursalNombre)) ? (
              <div className="flex items-center gap-2 bg-emerald-500/20 backdrop-blur px-3.5 py-1.5 rounded-xl border border-emerald-400/40 text-white shadow-sm">
                <MapPin className="h-4 w-4 text-emerald-300 shrink-0" />
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-blue-200 font-semibold">Sucursal:</span>
                  <span className="text-xs font-black text-white uppercase tracking-wider">
                    {sucursalActual?.nombre || userSucursalNombre}
                  </span>
                </div>
                <Badge variant="outline" className="text-[10px] bg-emerald-950/60 text-emerald-200 border-emerald-400/30 font-bold px-1.5 py-0 flex items-center gap-1 ml-1">
                  <Lock className="h-2.5 w-2.5" />
                  Asignada
                </Badge>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-3 py-1.5 rounded-xl border border-white/20">
                <MapPin className="h-4 w-4 text-emerald-300 shrink-0" />
                <span className="text-xs text-blue-100 font-semibold">Sucursal:</span>
                <Select value={sucursalSeleccionada} onValueChange={handleCambiarSucursal}>
                  <SelectTrigger className="h-7 text-xs bg-white text-blue-950 font-black border-none min-w-[200px] shadow">
                    <SelectValue placeholder="Seleccione sucursal..." />
                  </SelectTrigger>
                  <SelectContent>
                    {sucursales.map(s => (
                      <SelectItem key={s.id} value={s.id} className="text-xs font-bold">
                        {s.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {esAdmin && (
                  <span className="text-[10px] text-blue-200 font-bold hidden sm:inline bg-blue-950/50 px-2 py-0.5 rounded">
                    Admin
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Botón rápido si hay artículos en la remisión */}
          {carrito.length > 0 && (
            <Button
              onClick={() => setTabPrincipal('pedido')}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-10 px-4 gap-2 shadow-md border border-emerald-400/40"
            >
              <ShoppingCart className="h-4 w-4" />
              <span>{formatCurrency(totalBruto)}</span>
              <span className="w-5 h-5 rounded-full bg-white text-emerald-800 text-[11px] font-black flex items-center justify-center ml-1">
                {carrito.reduce((s, i) => s + i.cantidad, 0)}
              </span>
            </Button>
          )}
        </div>

        {/* PESTAÑAS PRINCIPALES DEL KIOSCO (Igual que en Kiosco en campo) */}
        <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-100 border border-slate-200 rounded-2xl text-xs sm:text-sm font-bold shadow-inner">
          <button
            type="button"
            onClick={() => setTabPrincipal('catalogo')}
            className={cn(
              "py-2.5 px-3 sm:px-4 rounded-xl transition-all flex items-center justify-center gap-1.5 sm:gap-2",
              tabPrincipal === 'catalogo'
                ? "bg-blue-800 text-white shadow-md font-extrabold"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            )}
          >
            <Package className="h-4 w-4 shrink-0" />
            <span>Catálogo</span>
            <span className={cn(
              "text-[11px] px-1.5 py-0.5 rounded-full font-bold",
              tabPrincipal === 'catalogo' ? "bg-blue-900 text-blue-200" : "bg-slate-200 text-slate-700"
            )}>
              {catalogoFiltrado.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setTabPrincipal('pedido')}
            className={cn(
              "py-2.5 px-3 sm:px-4 rounded-xl transition-all relative flex items-center justify-center gap-1.5 sm:gap-2",
              tabPrincipal === 'pedido'
                ? "bg-blue-800 text-white shadow-md font-extrabold"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            )}
          >
            <ShoppingCart className="h-4 w-4 shrink-0" />
            <span>Cotizar / Remisión</span>
            {carrito.length > 0 && (
              <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white font-black text-[11px] px-2 py-0.5 shadow-sm ml-1">
                {carrito.reduce((s, i) => s + i.cantidad, 0)} arts • {formatCurrency(totalBruto)}
              </Badge>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setTabPrincipal('historial');
              cargarHistorial();
            }}
            className={cn(
              "py-2.5 px-3 sm:px-4 rounded-xl transition-all flex items-center justify-center gap-1.5 sm:gap-2",
              tabPrincipal === 'historial'
                ? "bg-blue-800 text-white shadow-md font-extrabold"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            )}
          >
            <History className="h-4 w-4 shrink-0" />
            <span>Historial</span>
            {historialVentas.length > 0 && (
              <span className={cn(
                "text-[11px] px-1.5 py-0.5 rounded-full font-bold",
                tabPrincipal === 'historial' ? "bg-blue-900 text-blue-200" : "bg-slate-200 text-slate-700"
              )}>
                {historialVentas.length}
              </span>
            )}
          </button>
        </div>

        {/* ========================================================================= */}
        {/* PESTAÑA 1: CATÁLOGO DE PRODUCTOS (VISTA AMPLIA Y CÓMODA) */}
        {/* ========================================================================= */}
        {tabPrincipal === 'catalogo' && (
          <div className="space-y-4">
            {/* Banner flotante si hay artículos en la remisión */}
            {carrito.length > 0 && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950 shadow-sm gap-2">
                <div className="flex items-center gap-2.5">
                  <ShoppingCart className="h-5 w-5 text-emerald-700 shrink-0" />
                  <div>
                    <p className="font-bold text-sm">
                      Tienes {carrito.reduce((s, i) => s + i.cantidad, 0)} artículo(s) en la remisión ({formatCurrency(totalBruto)})
                    </p>
                    <p className="text-xs text-emerald-700">
                      Continúa agregando productos o pasa al cierre de venta cuando estés listo.
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => setTabPrincipal('pedido')}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold gap-1.5 text-xs shadow shrink-0"
                >
                  Ir a Cotizar / Cerrar Venta
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}

            <Card className="shadow-md border-slate-200">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <Package className="h-5 w-5 text-blue-700" />
                      Catálogo de Productos
                    </CardTitle>
                    <CardDescription>
                      Seleccione artículos para agregarlos a la remisión o consulte existencias en sucursales
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
                      onChange={e => setBusqueda(e.target.value.toUpperCase())}
                      className="pl-9 h-10 bg-slate-50 border-slate-200 focus:bg-white text-sm uppercase placeholder:normal-case"
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

                  {/* Grid de Productos - Diseño Amplio y Cómodo */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 max-h-[640px] overflow-y-auto pr-1 pb-4">
                    {catalogoFiltrado.length === 0 ? (
                      <div className="col-span-full text-center py-16 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-gray-500 text-sm space-y-2">
                        <Package className="h-10 w-10 mx-auto text-gray-400" />
                        <p className="font-semibold text-gray-700 text-base">
                          No hay productos con existencia disponible en {sucursalActual?.nombre || 'esta sucursal'}.
                        </p>
                        <p className="text-xs text-gray-400">
                          {busqueda
                            ? `Sin coincidencias para "${busqueda}".`
                            : 'Esta sucursal aún no cuenta con stock cargado o traspasado.'}
                        </p>
                      </div>
                    ) : (
                      catalogoFiltrado.map(prod => {
                        const stockDisp = obtenerStockSucursal(prod);
                        const totalStockOtras = sucursales
                          .filter(s => s.id !== (sucursalActual?.id || sucursalSeleccionada))
                          .reduce((acc, s) => acc + obtenerStockSucursal(prod, s.id, s.nombre), 0);
                        const cantEnCarrito = carrito.find(c => c.productoId === prod.id || c.concepto === prod.nombre)?.cantidad || 0;

                        return (
                          <div
                            key={prod.id}
                            className="group border border-slate-200 hover:border-blue-400 rounded-xl p-3.5 bg-white shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex justify-between items-start gap-1 mb-1.5 flex-wrap">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <Badge variant="outline" className="text-[10px] font-bold text-blue-800 bg-blue-50 border-blue-200">
                                    {prod.categoria}
                                  </Badge>
                                  <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/80">
                                    {sucursalActual?.nombre || 'SAN LUCAS'}
                                  </span>
                                  <span className="text-[10px] font-extrabold text-blue-800 bg-blue-100/70 px-1.5 py-0.5 rounded border border-blue-200">
                                    📦 {stockDisp} disp.
                                  </span>
                                  {totalStockOtras > 0 && (
                                    <span className="text-[9px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200" title={`Hay ${totalStockOtras} piezas en otras sucursales`}>
                                      🌐 {totalStockOtras} en red
                                    </span>
                                  )}
                                </div>
                                {prod.tamano && (
                                  <span className="text-[10px] text-gray-500 font-medium">
                                    {prod.tamano}
                                  </span>
                                )}
                              </div>

                              <h3 className="font-bold text-gray-900 text-sm line-clamp-2 group-hover:text-blue-700 transition-colors">
                                {prod.nombre}
                              </h3>

                              <p className="text-[11px] text-gray-500 line-clamp-2 mt-1">
                                {prod.descripcion || `Marca ${prod.marca} ${prod.modelo || ''}`}
                              </p>
                            </div>

                            <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-2.5">
                              <div className="flex items-baseline justify-between">
                                <div>
                                  <div className="text-[10px] text-gray-400 font-medium">
                                    {tipoVenta === 'credito' ? 'Precio Crédito' : 'Precio Contado'}
                                  </div>
                                  <div className="text-base font-black text-gray-950">
                                    {formatCurrency(tipoVenta === 'credito' ? prod.precioVenta : prod.precioContado)}
                                  </div>
                                </div>
                                {tipoVenta === 'credito' && (
                                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                                    {formatCurrency(Math.ceil((prod.precioVenta - (prod.precioVenta * 0.1)) / 16))}/sem
                                  </span>
                                )}
                              </div>

                              {/* Botones de acción solicitados */}
                              <div className="space-y-1.5 pt-0.5">
                                <Button
                                  size="sm"
                                  onClick={() => agregarAlCarrito(prod)}
                                  className="w-full bg-blue-800 hover:bg-blue-900 text-white font-bold h-9 text-xs transition-colors gap-1.5 shadow-sm"
                                >
                                  <Plus className="h-4 w-4" />
                                  {cantEnCarrito > 0 ? `Agregar más (${cantEnCarrito} en remisión)` : 'Agregar a la Remisión'}
                                </Button>

                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => abrirModalExistencias(prod)}
                                  className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-950 font-semibold h-8 text-xs transition-colors gap-1.5 border border-slate-300"
                                >
                                  <Boxes className="h-3.5 w-3.5 text-blue-600" />
                                  Existencias y Traslado
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ========================================================================= */}
          {/* PESTAÑA 2: COTIZAR / REMISIÓN Y CIERRE DE VENTA */}
          {/* ========================================================================= */}
          {tabPrincipal === 'pedido' && (
            <div className="space-y-4">
              {carrito.length === 0 ? (
                <Card className="shadow-md border-slate-200">
                  <CardContent className="py-16 text-center space-y-3">
                    <ShoppingCart className="h-12 w-12 mx-auto text-slate-300" />
                    <h3 className="text-base font-bold text-gray-800">No hay artículos en la remisión</h3>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto">
                      Selecciona productos desde el catálogo para agregarlos a esta remisión de venta o cotización.
                    </p>
                    <Button
                      onClick={() => setTabPrincipal('catalogo')}
                      className="bg-blue-800 hover:bg-blue-900 text-white font-bold gap-1.5 text-xs shadow mt-2"
                    >
                      <Package className="h-4 w-4" />
                      Ir al Catálogo de Productos
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                  {/* PANEL IZQUIERDO: DETALLE DE ARTÍCULOS EN REMISIÓN (7 columnas) */}
                  <div className="lg:col-span-7 space-y-4">
                    <Card className="shadow-md border-slate-200">
                      <CardHeader className="pb-3 border-b bg-slate-50/70">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                            <ShoppingCart className="h-4 w-4 text-blue-700" />
                            Artículos en la Remisión ({carrito.reduce((s, i) => s + i.cantidad, 0)})
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setTabPrincipal('catalogo')}
                              className="text-xs text-blue-700 border-blue-200 hover:bg-blue-50 h-7 font-semibold"
                            >
                              + Agregar más
                            </Button>
                            <button
                              onClick={() => setCarrito([])}
                              className="text-xs text-rose-600 hover:underline font-semibold"
                            >
                              Vaciar
                            </button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 space-y-3">
                        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                          {carrito.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs gap-3"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-gray-900 text-sm truncate">
                                  {item.concepto}
                                </p>
                                <div className="flex items-center gap-2 text-gray-500 mt-1">
                                  <span>Precio Unitario:</span>
                                  <input
                                    type="number"
                                    value={item.precioUnitario}
                                    onChange={e => modificarPrecio(idx, parseFloat(e.target.value))}
                                    className="w-24 px-2 py-0.5 border rounded text-right font-bold text-gray-900 bg-white"
                                  />
                                </div>
                              </div>

                              {/* Control de cantidad */}
                              <div className="flex items-center gap-1.5 bg-white border rounded-lg p-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => modificarCantidad(idx, -1)}
                                  className="h-6 w-6 p-0 rounded hover:bg-slate-100"
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="font-black w-7 text-center text-sm">
                                  {item.cantidad}
                                </span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => modificarCantidad(idx, 1)}
                                  className="h-6 w-6 p-0 rounded hover:bg-slate-100"
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>

                              <div className="text-right min-w-[80px]">
                                <div className="font-black text-gray-950 text-sm">
                                  {formatCurrency(item.importe)}
                                </div>
                                <button
                                  onClick={() => eliminarDelCarrito(idx)}
                                  className="text-rose-500 hover:text-rose-700 text-[11px] font-semibold mt-0.5"
                                >
                                  Eliminar
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Banner de Total */}
                        <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl flex justify-between items-center mt-2">
                          <span className="font-bold text-blue-950 text-sm">Total de la Remisión:</span>
                          <span className="font-black text-2xl text-blue-900">
                            {formatCurrency(totalBruto)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* PANEL DERECHO: VENDEDOR, CLIENTE Y CIERRE (5 columnas) */}
                  <div className="lg:col-span-5 space-y-4">
                    <Card className="shadow-lg border-blue-100 bg-white">
                      <CardHeader className="pb-3 border-b bg-slate-50/70 rounded-t-xl">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                            <Store className="h-4 w-4 text-blue-700" />
                            Emisión y Condiciones
                          </CardTitle>
                          <Badge variant="secondary" className="font-bold text-xs">
                            Total: {formatCurrency(totalBruto)}
                          </Badge>
                        </div>

                        {/* Sucursal Activa */}
                        <div className="flex items-center justify-between mt-2 px-2.5 py-1.5 bg-blue-50 border border-blue-200/80 rounded-lg text-xs">
                          <div className="flex items-center gap-1.5 text-blue-950 font-bold">
                            <Store className="h-3.5 w-3.5 text-blue-700" />
                            <span>Sucursal:</span>
                          </div>
                          <Select value={sucursalSeleccionada} onValueChange={handleCambiarSucursal}>
                            <SelectTrigger className="h-6 text-xs bg-white border-blue-300 w-48 font-semibold px-2 py-0">
                              <SelectValue placeholder="Seleccionar" />
                            </SelectTrigger>
                            <SelectContent>
                              {sucursales.map(s => (
                                <SelectItem key={s.id} value={s.id} className="text-xs font-medium">
                                  {s.nombre}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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

                  {/* SELECCIÓN DE VENDEDOR DE MOSTRADOR */}
                  <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg space-y-1.5">
                    <div className="flex justify-between items-center">
                      <Label className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                        <UserCheck className="h-3.5 w-3.5 text-blue-700" />
                        Vendedor de Mostrador
                      </Label>
                      <span className="text-[10px] font-bold text-blue-800 bg-blue-100/70 px-2 py-0.5 rounded uppercase">
                        {sucursalActual?.nombre || 'SUCURSAL'}
                      </span>
                    </div>

                    <Select
                      value={vendedorSeleccionadoId}
                      onValueChange={(val) => {
                        setVendedorSeleccionadoId(val);
                        if (val !== 'otro' && val !== 'tienda') {
                          const v = vendedores.find(x => x.id === val);
                          setVendedorNombre(v?.name || val);
                        } else if (val === 'tienda') {
                          setVendedorNombre('VENTA MOSTRADOR');
                        }
                      }}
                    >
                      <SelectTrigger className="h-8 text-xs bg-white font-medium">
                        <SelectValue placeholder="Seleccione vendedor..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tienda">Venta Directa de Mostrador</SelectItem>
                        {vendedores.map(v => (
                          <SelectItem key={v.id} value={v.id}>
                            {v.name} {v.sucursal?.nombre ? `(${v.sucursal.nombre})` : ''}
                          </SelectItem>
                        ))}
                        <SelectItem value="otro">Captura manual / Otro vendedor...</SelectItem>
                      </SelectContent>
                    </Select>

                    {vendedorSeleccionadoId === 'otro' && (
                      <Input
                        placeholder="Nombre completo del vendedor *"
                        value={vendedorManual}
                        onChange={e => setVendedorManual(e.target.value.toUpperCase())}
                        className="h-8 text-xs bg-white uppercase mt-1"
                      />
                    )}
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
                        onChange={e => handleBuscarCliente(e.target.value.toUpperCase())}
                        className="h-9 text-xs uppercase placeholder:normal-case"
                      />
                      {clientesExistentes.length > 0 && (
                        <div className="absolute top-10 left-0 right-0 z-30 bg-white border rounded-lg shadow-xl max-h-40 overflow-y-auto divide-y">
                          {clientesExistentes.map(c => (
                            <div
                              key={c.id}
                              onClick={() => seleccionarCliente(c)}
                              className="p-2 text-xs hover:bg-blue-50 cursor-pointer flex justify-between items-center"
                            >
                              <span className="font-bold">{c.nombreCompleto.toUpperCase()}</span>
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
                        onChange={e => setTelefonoCliente(e.target.value.toUpperCase())}
                        className="h-9 text-xs uppercase placeholder:normal-case"
                      />
                      <Input
                        placeholder="Ciudad / Municipio"
                        value={ciudadCliente}
                        onChange={e => setCiudadCliente(e.target.value.toUpperCase())}
                        className="h-9 text-xs uppercase placeholder:normal-case"
                      />
                    </div>

                    <Input
                      placeholder="Dirección Completa (Calle, Número, Colonia)"
                      value={direccionCliente}
                      onChange={e => setDireccionCliente(e.target.value.toUpperCase())}
                      className="h-9 text-xs uppercase placeholder:normal-case"
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
                            step="1"
                            value={enganche || ''}
                            placeholder="$0"
                            onChange={e => setEnganche(Math.round(parseFloat(e.target.value) || 0))}
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
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* PESTAÑA 3: HISTORIAL DE VENTAS Y REIMPRESIONES */}
          {/* ========================================================================= */}
          {tabPrincipal === 'historial' && (
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
                            <div className="flex items-center justify-center gap-1.5">
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
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setBovedaCliente({
                                    codigoCliente: v.codigoCliente,
                                    folioContrato: v.folio,
                                    nombreCliente: v.nombreCliente,
                                    telefono: v.telefonoCliente,
                                    direccion: v.direccionCliente,
                                  });
                                  setBovedaModalOpen(true);
                                }}
                                className="gap-1 text-xs h-7 text-blue-600 hover:bg-blue-50 border-blue-200"
                                title="Digitalizar documentos y GPS en Bóveda"
                              >
                                <ShieldCheck className="h-3 w-3" />
                                Bóveda
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
                  onChange={e => setCustomProduct({ ...customProduct, concepto: e.target.value.toUpperCase() })}
                  className="h-9 text-xs mt-1 uppercase placeholder:normal-case"
                />
              </div>
              <div>
                <Label className="text-xs">Precio Unitario ($) *</Label>
                <Input
                  type="number"
                  step="1"
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

        {/* MODAL DE BÓVEDA DIGITAL */}
        {bovedaModalOpen && bovedaCliente && (
          <DigitalizadorModal
            open={bovedaModalOpen}
            onOpenChange={setBovedaModalOpen}
            cliente={{
              nombreCompleto: bovedaCliente.nombreCliente || '',
              codigoCliente: bovedaCliente.codigoCliente,
              numContrato: bovedaCliente.folioContrato,
              telefono: bovedaCliente.telefono,
              direccion: bovedaCliente.direccion,
            }}
            isAdmin={['admin', 'gestor_cobranza'].includes((session?.user as any)?.role?.toLowerCase())}
            userRole={(session?.user as any)?.role}
          />
        )}

        {/* MODAL DE EXISTENCIAS Y TRASLADO ENTRE SUCURSALES */}
        {productoSeleccionadoExistencias && (
          <Dialog open={modalExistenciasOpen} onOpenChange={setModalExistenciasOpen}>
            <DialogContent className="max-w-lg w-[95vw] bg-white text-slate-900 p-5 rounded-2xl max-h-[90vh] overflow-y-auto shadow-2xl border-slate-200">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-lg font-bold text-gray-900">
                  <Boxes className="w-5 h-5 text-blue-700" />
                  Existencias y Traslado entre Sucursales
                </DialogTitle>
                <DialogDescription className="text-xs text-gray-500">
                  Consulta el inventario disponible en toda la red y solicita traslado inmediato a tu sucursal.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 my-2">
                {/* Resumen del Producto */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {productoSeleccionadoExistencias.codigo}
                    </span>
                    <Badge variant="outline" className="text-xs font-semibold">
                      {productoSeleccionadoExistencias.categoria}
                    </Badge>
                  </div>
                  <h4 className="font-bold text-gray-900 text-base leading-snug">
                    {productoSeleccionadoExistencias.nombre}
                  </h4>
                  <p className="text-xs text-gray-500">
                    {productoSeleccionadoExistencias.descripcion || `Marca ${productoSeleccionadoExistencias.marca}`}
                  </p>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 text-xs">
                    <span className="text-gray-600">
                      Precio Contado: <strong className="text-gray-900 text-sm">{formatCurrency(productoSeleccionadoExistencias.precioContado)}</strong>
                    </span>
                    <span className="text-gray-600">
                      Precio Crédito: <strong className="text-emerald-700 text-sm">{formatCurrency(productoSeleccionadoExistencias.precioVenta)}</strong>
                    </span>
                  </div>
                </div>

                {/* Tu Sucursal Actual */}
                <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-blue-900 font-bold flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-blue-700" /> Tu Sucursal Actual
                    </span>
                    <span className="font-extrabold text-blue-950 text-xs bg-blue-100/80 px-2 py-0.5 rounded">
                      {sucursalActual?.nombre || 'SAN LUCAS'}
                    </span>
                  </div>
                  {(() => {
                    const stockLocal = obtenerStockSucursal(productoSeleccionadoExistencias);
                    return stockLocal > 0 ? (
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-blue-200/80">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                          <CheckCircle className="w-4 h-4" /> {stockLocal} pieza(s) disponible(s) en piso
                        </span>
                        <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded">
                          Entrega Inmediata
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-blue-200/80">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600">
                          <AlertTriangle className="w-4 h-4" /> Sin existencias en esta tienda
                        </span>
                        <span className="text-[11px] font-semibold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded">
                          Solicita traslado abajo
                        </span>
                      </div>
                    );
                  })()}
                </div>

                {/* Disponibilidad en Otras Sucursales */}
                <div className="space-y-2.5">
                  <h5 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-blue-700" /> Disponibilidad en Otras Sucursales
                  </h5>

                  {sucursales
                    .filter(s => s.id !== (sucursalActual?.id || sucursalSeleccionada))
                    .map(suc => {
                      const stockSuc = obtenerStockSucursal(productoSeleccionadoExistencias, suc.id, suc.nombre);
                      const isSelected = origenTraspasoSeleccionado?.id === suc.id;

                      return (
                        <div
                          key={suc.id || suc.nombre}
                          className={`p-3.5 rounded-xl border transition-all ${
                            isSelected
                              ? 'bg-blue-50/50 border-blue-500 shadow-sm'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <p className="font-bold text-xs text-gray-900 flex items-center gap-1.5">
                                {suc.nombre}
                                {suc.esBodega && (
                                  <span className="text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded border border-purple-200 font-bold">
                                    BODEGA
                                  </span>
                                )}
                              </p>
                              {suc.direccion && (
                                <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">{suc.direccion}</p>
                              )}
                            </div>

                            <div className="text-right flex-shrink-0">
                              {stockSuc > 0 ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  {stockSuc} disp.
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                                  Agotado
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Botón de acción para solicitar traslado */}
                          {stockSuc > 0 && (
                            <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                              <span className="text-xs text-gray-500">
                                {isSelected ? 'Configura la cantidad:' : '¿Requieres este producto aquí?'}
                              </span>
                              <Button
                                size="sm"
                                variant={isSelected ? 'default' : 'outline'}
                                onClick={() => {
                                  if (isSelected) {
                                    setOrigenTraspasoSeleccionado(null);
                                  } else {
                                    setOrigenTraspasoSeleccionado(suc);
                                    setCantidadTraspaso(1);
                                  }
                                }}
                                className={`h-8 text-xs font-bold gap-1.5 px-3 ${
                                  isSelected
                                    ? 'bg-blue-700 hover:bg-blue-800 text-white'
                                    : 'border-blue-200 text-blue-700 hover:bg-blue-50'
                                }`}
                              >
                                <ArrowRightLeft className="w-3.5 h-3.5" />
                                {isSelected ? 'Cerrar Solicitud' : 'Solicitar Traslado'}
                              </Button>
                            </div>
                          )}

                          {/* Formulario desplegado si la sucursal está seleccionada */}
                          {isSelected && stockSuc > 0 && (
                            <div className="mt-3 p-3.5 rounded-xl bg-slate-50 border border-blue-200 space-y-3">
                              <div className="flex items-center justify-between">
                                <label className="text-xs font-semibold text-gray-700">
                                  Cantidad a trasladar (máx {stockSuc}):
                                </label>
                                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setCantidadTraspaso(Math.max(1, cantidadTraspaso - 1))}
                                    disabled={cantidadTraspaso <= 1}
                                    className="w-7 h-7 p-0"
                                  >
                                    <Minus className="w-3.5 h-3.5" />
                                  </Button>
                                  <span className="font-black text-gray-900 text-sm w-7 text-center">
                                    {cantidadTraspaso}
                                  </span>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setCantidadTraspaso(Math.min(stockSuc, cantidadTraspaso + 1))}
                                    disabled={cantidadTraspaso >= stockSuc}
                                    className="w-7 h-7 p-0"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              </div>

                              <div className="space-y-2 pt-1">
                                <Button
                                  size="sm"
                                  onClick={() => handleRegistrarTraspaso(suc, cantidadTraspaso)}
                                  disabled={procesandoTraspaso}
                                  className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold h-9 text-xs gap-1.5 shadow"
                                >
                                  {procesandoTraspaso ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Truck className="w-4 h-4" />
                                  )}
                                  {procesandoTraspaso ? 'Registrando Traslado...' : `Registrar Traslado en Sistema (${cantidadTraspaso} pza)`}
                                </Button>

                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleCompartirTraspasoWhatsApp(suc, cantidadTraspaso)}
                                  className="w-full bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-800 font-semibold h-8 text-xs gap-1.5"
                                >
                                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                                  Enviar Solicitud por WhatsApp
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </DashboardLayout>
  );
}
