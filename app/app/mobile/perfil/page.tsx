'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { signOut, useSession } from 'next-auth/react';
import { Printer, LogOut, Sun } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { PrinterConfigModal } from '@/components/mobile/printer-config-modal';
import { VERSION_INFO } from '@/lib/version';
import { SyncStatus } from '@/components/mobile/sync-status';
import { PWAInstallButton } from '@/components/pwa/pwa-install-button';
import { APKDownloadButton } from '@/components/pwa/apk-download-button';

export default function MobilePerfilPage() {
    const { data: session } = useSession();
    const [showPrinterModal, setShowPrinterModal] = useState(false);
    const [modoSol, setModoSol] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const active = localStorage.getItem('modo_sol') === 'true';
            setModoSol(active);
            if (active) {
                document.body.classList.add('modo-sol');
            } else {
                document.body.classList.remove('modo-sol');
            }
        }
    }, []);

    const toggleModoSol = () => {
        const next = !modoSol;
        setModoSol(next);
        if (typeof window !== 'undefined') {
            if (next) {
                document.body.classList.add('modo-sol');
                localStorage.setItem('modo_sol', 'true');
            } else {
                document.body.classList.remove('modo-sol');
                localStorage.setItem('modo_sol', 'false');
            }
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">Mi Perfil</h2>

            <Card className="bg-slate-900 border-slate-800">
                <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center text-2xl font-bold text-white uppercase shadow-lg shadow-emerald-900/40">
                        {session?.user?.name?.[0] || 'U'}
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-white">{session?.user?.name || 'Usuario'}</h3>
                        <p className="text-sm text-slate-400">{session?.user?.email}</p>
                        <div className="text-[10px] text-emerald-400 mt-1 uppercase font-bold tracking-wider bg-emerald-950/50 px-2 py-0.5 rounded inline-block border border-emerald-900">
                            {(session?.user as any)?.role || 'Usuario'}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Opciones de instalación y descarga de la app */}
            <div className="space-y-2">
                <div className="text-xs text-slate-500 uppercase font-bold ml-1">Aplicación Móvil</div>
                <div className="space-y-2">
                    <PWAInstallButton />
                    <APKDownloadButton />
                </div>
            </div>

            {/* Pantalla y Visibilidad (Modo Sol) */}
            <div className="space-y-3">
                <div className="text-xs text-slate-500 uppercase font-bold ml-1">Pantalla y Visibilidad</div>

                <Button
                    onClick={toggleModoSol}
                    className={`w-full bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white justify-between h-14 ${
                        modoSol ? 'border-amber-400/40 shadow-[0_0_15px_rgba(245,158,11,0.1)]' : ''
                    }`}
                    variant="outline"
                >
                    <div className="flex items-center">
                        <Sun className={`w-5 h-5 mr-3 ${modoSol ? 'text-amber-500' : 'text-slate-400'}`} />
                        <div className="text-left">
                            <p className="text-sm font-semibold">Modo Sol (Alto Contraste)</p>
                            <p className="text-[10px] text-slate-400">
                                {modoSol ? 'Activo: Optimizado para luz solar en la calle' : 'Inactivo: Tema oscuro estándar'}
                            </p>
                        </div>
                    </div>
                    <div className={`w-10 h-5 rounded-full relative transition-colors ${modoSol ? 'bg-amber-500' : 'bg-slate-700'}`}>
                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${modoSol ? 'right-1' : 'left-1'}`}></div>
                    </div>
                </Button>
            </div>

            {/* Estado de sincronización y base de datos local */}
            <div className="space-y-2">
                <div className="text-xs text-slate-500 uppercase font-bold ml-1">Sincronización y Datos</div>
                <SyncStatus />
            </div>

            {/* Configuración de Hardware */}
            <div className="space-y-3">
                <div className="text-xs text-slate-500 uppercase font-bold ml-1">Dispositivos</div>

                <Button
                    onClick={() => setShowPrinterModal(true)}
                    className="w-full bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white justify-start h-12"
                    variant="outline"
                >
                    <Printer className="w-5 h-5 mr-3 text-slate-400" />
                    Configurar Impresora Bluetooth
                </Button>
            </div>

            <div className="space-y-3 pt-4">
                <Button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    variant="destructive"
                    className="w-full h-12 font-semibold"
                >
                    <LogOut className="w-5 h-5 mr-2" />
                    Cerrar Sesión
                </Button>

                <div className="text-center text-xs text-slate-500 pt-4 font-mono">
                    {VERSION_INFO.displayName}
                </div>
            </div>

            <PrinterConfigModal
                isOpen={showPrinterModal}
                onClose={() => setShowPrinterModal(false)}
            />
        </div>
    );
}
