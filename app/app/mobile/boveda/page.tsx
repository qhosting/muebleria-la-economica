"use client";

import { useState, useEffect } from 'react';
import { 
    Search, 
    FileText, 
    User, 
    ShieldCheck, 
    AlertCircle,
    Loader2,
    Fingerprint, 
    UserPlus,
    ChevronLeft,
    Clock,
    Phone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle,
    DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { DigitalizadorModal } from '@/components/boveda/digitalizador-modal';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function MobileBovedaPage() {
    const { data: session } = useSession();
    const isAdmin = ['admin', 'gestor_cobranza'].includes((session?.user as any)?.role);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<any[]>([]);
    const [recentResults, setRecentResults] = useState<any[]>([]);
    const [loadingRecent, setLoadingRecent] = useState(false);
    
    // Estados para el modal del digitalizador
    const [showDigitalizador, setShowDigitalizador] = useState(false);
    const [selectedCliente, setSelectedCliente] = useState<any>(null);

    const [isCreating, setIsCreating] = useState(false);
    const [newClient, setNewClient] = useState({
        nombre: '',
        curp: '',
        codigo: '',
        contrato: '',
        telefono: ''
    });

    useEffect(() => {
        fetchRecent();
    }, []);

    const fetchRecent = async () => {
        setLoadingRecent(true);
        try {
            const res = await fetch('/api/boveda/list?mine=true');
            if (res.ok) {
                const data = await res.json();
                setRecentResults(data);
            }
        } catch (error) {
            console.error('Error al cargar recientes:', error);
        } finally {
            setLoadingRecent(false);
        }
    };

    const handleCreateExpediente = () => {
        if (!newClient.nombre) {
            toast.error("El nombre es obligatorio");
            return;
        }
        setSelectedCliente({
            nombreCompleto: newClient.nombre.toUpperCase(),
            curp: newClient.curp.toUpperCase(),
            codigoCliente: newClient.codigo.toUpperCase(),
            numContrato: newClient.contrato.toUpperCase(),
            telefono: newClient.telefono
        });
        setIsCreating(false);
        setShowDigitalizador(true);
    };

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!searchTerm || searchTerm.length < 3) {
            toast.error('Ingresa al menos 3 caracteres');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`/api/boveda/list?search=${encodeURIComponent(searchTerm)}`);
            if (res.ok) {
                const data = await res.json();
                setResults(data);
                if (data.length === 0) toast.info("No se encontraron expedientes");
            }
        } catch (error) {
            console.error('Error al buscar en la bóveda:', error);
            toast.error('Error al buscar');
        } finally {
            setLoading(false);
        }
    };

    const openVaultForCliente = (cliente: any) => {
        setSelectedCliente({
            nombreCompleto: cliente.nombreCompleto || 'Cliente Sin Nombre',
            curp: cliente.curp,
            codigoCliente: cliente.codigoCliente,
            numContrato: cliente.folioContrato,
            telefono: cliente.telefono
        });
        setShowDigitalizador(true);
    };

    return (
        <div className="min-h-screen min-h-[100dvh] bg-slate-950 text-slate-200 pb-20">
            {/* Header Móvil */}
            <div className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 p-4 sticky top-0 z-10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/mobile/home" className="p-2 hover:bg-slate-800 rounded-full transition-colors">
                            <ChevronLeft className="w-6 h-6 text-slate-400" />
                        </Link>
                        <div className="flex items-center gap-2">
                            <div className="bg-blue-500/20 p-2 rounded-lg">
                                <ShieldCheck className="w-5 h-5 text-blue-400" />
                            </div>
                            <h1 className="font-bold text-lg text-white">Bóveda Digital</h1>
                        </div>
                    </div>
                    <Button 
                        size="sm" 
                        onClick={() => setIsCreating(true)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-full px-4 h-9 font-bold text-xs gap-1.5 shadow-lg shadow-emerald-900/30"
                    >
                        <UserPlus className="w-4 h-4" />
                        NUEVO
                    </Button>
                </div>
            </div>

            <div className="p-4 space-y-5">
                {/* Buscador */}
                <form onSubmit={handleSearch} className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                    <Input 
                        placeholder="Nombre, código o teléfono..." 
                        className="pl-12 h-14 bg-slate-900 border-slate-800 rounded-2xl text-base text-white placeholder:text-slate-500 focus:ring-blue-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </form>

                {/* Lista de Resultados */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="py-20 text-center">
                            <Loader2 className="h-10 w-10 animate-spin text-blue-500 mx-auto mb-4" />
                            <p className="text-slate-400 font-medium text-sm">Buscando expedientes...</p>
                        </div>
                    ) : (searchTerm ? results : recentResults).length > 0 ? (
                        <>
                            {!searchTerm && (
                                <div className="flex items-center gap-2 px-1 mb-1">
                                    <Clock className="w-4 h-4 text-emerald-500" />
                                    <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Expedientes Recientes</h2>
                                </div>
                            )}
                            {(searchTerm ? results : recentResults).map((res: any, idx: number) => (
                                <div 
                                    key={idx} 
                                    className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3 shadow-lg active:scale-[0.98] transition-transform cursor-pointer"
                                    onClick={() => openVaultForCliente(res)}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                                            <Fingerprint className="h-6 w-6" />
                                        </div>
                                        <Badge className={`${res.recent ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'} border-transparent text-[10px]`}>
                                            {res.recent ? 'EXPEDIENTE' : 'CLIENTE'}
                                        </Badge>
                                    </div>
                                    
                                    <div>
                                        <h3 className="font-bold text-slate-100 text-lg uppercase leading-tight">
                                            {res.nombreCompleto || 'N/A'}
                                        </h3>
                                        <div className="space-y-1 mt-2">
                                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                                <ShieldCheck className="h-3.5 w-3.5 text-slate-500" />
                                                <span className="font-mono">{res.curp || 'SIN CURP'}</span>
                                            </div>
                                            {res.codigoCliente && (
                                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                                    <Fingerprint className="h-3.5 w-3.5 text-slate-500" />
                                                    <span>Código: {res.codigoCliente}</span>
                                                </div>
                                            )}
                                            {res.telefono && (
                                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                                    <Phone className="h-3.5 w-3.5 text-slate-500" />
                                                    <span>{res.telefono}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <Button 
                                        className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-3 text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-blue-900/30"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            openVaultForCliente(res);
                                        }}
                                    >
                                        <FileText className="h-4 w-4" />
                                        ABRIR BÓVEDA DIGITAL
                                    </Button>
                                </div>
                            ))}
                        </>
                    ) : (
                        <div className="py-16 text-center bg-slate-900/40 rounded-3xl border border-dashed border-slate-800 p-6 space-y-3">
                            <AlertCircle className="w-10 h-10 text-slate-600 mx-auto" />
                            <p className="text-slate-300 font-bold text-sm">
                                {searchTerm ? "No se encontraron expedientes" : "No hay expedientes recientes"}
                            </p>
                            <p className="text-slate-500 text-xs max-w-xs mx-auto">
                                {searchTerm ? "Prueba con otro término o crea un nuevo expediente." : "Inicia buscando un cliente o registrando un nuevo expediente."}
                            </p>
                            <Button 
                                variant="outline"
                                onClick={() => setIsCreating(true)}
                                className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs"
                            >
                                Crear Nuevo Expediente
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Crear Expediente */}
            <Dialog open={isCreating} onOpenChange={setIsCreating}>
                <DialogContent className="max-w-[92vw] rounded-2xl bg-slate-900 border-slate-800 text-white">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-white">
                            <UserPlus className="w-5 h-5 text-emerald-400" />
                            Nuevo Expediente Digital
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 py-3">
                        <div className="space-y-1">
                            <Label className="text-slate-400 text-xs">Nombre Completo *</Label>
                            <Input 
                                className="bg-slate-950 border-slate-800 text-white uppercase text-sm"
                                placeholder="EJ. JUAN PÉREZ"
                                value={newClient.nombre}
                                onChange={(e) => setNewClient({...newClient, nombre: e.target.value.toUpperCase()})}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-slate-400 text-xs">CURP (Opcional)</Label>
                            <Input 
                                className="bg-slate-950 border-slate-800 text-white uppercase font-mono text-sm"
                                placeholder="18 Caracteres"
                                maxLength={18}
                                value={newClient.curp}
                                onChange={(e) => setNewClient({...newClient, curp: e.target.value.toUpperCase()})}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <Label className="text-slate-400 text-xs">Código Cliente</Label>
                                <Input 
                                    className="bg-slate-950 border-slate-800 text-white uppercase text-sm"
                                    placeholder="CLI-001"
                                    value={newClient.codigo}
                                    onChange={(e) => setNewClient({...newClient, codigo: e.target.value.toUpperCase()})}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-slate-400 text-xs">Teléfono</Label>
                                <Input 
                                    className="bg-slate-950 border-slate-800 text-white text-sm"
                                    placeholder="10 dígitos"
                                    value={newClient.telefono}
                                    onChange={(e) => setNewClient({...newClient, telefono: e.target.value})}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="flex gap-2">
                        <Button variant="outline" className="border-slate-700 text-slate-300" onClick={() => setIsCreating(false)}>Cancelar</Button>
                        <Button className="bg-emerald-600 hover:bg-emerald-500 font-bold" onClick={handleCreateExpediente}>Iniciar Bóveda</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal Digitalizador */}
            {selectedCliente && (
                <DigitalizadorModal 
                    open={showDigitalizador} 
                    onOpenChange={setShowDigitalizador} 
                    cliente={selectedCliente} 
                    isAdmin={isAdmin}
                    userRole={(session?.user as any)?.role}
                />
            )}
        </div>
    );
}
