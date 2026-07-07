'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { signOut, useSession } from 'next-auth/react';
import { Settings, Printer, LogOut, RefreshCw, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { PrinterConfigModal } from '@/components/mobile/printer-config-modal';
import { syncService } from '@/lib/sync-service';
import { toast } from 'sonner';

export default function MobilePerfilPage() {
    const { data: session } = useSession();
    const [showPrinterModal, setShowPrinterModal] = useState(false);
    const [syncing, setSyncing] = useState(false);

    const userId = (session?.user as any)?.id;

    const handleSync = async () => {
        if (!userId || syncing) return;

        if (typeof window !== 'undefined' && !navigator.onLine) {
            toast.error('Sin conexión', {
                description: 'Debes estar conectado a internet para sincronizar datos'
            });
            return;
        }

        setSyncing(true);
        try {
            const success = await syncService.syncAll(userId, true);
            if (success) {
                toast.success('Sincronización completada con éxito');
            } else {
                toast.error('Advertencia', {
                    description: 'Algunos datos no pudieron ser sincronizados'
                });
            }
        } catch (error) {
            console.error('Error al sincronizar:', error);
            toast.error('Error al sincronizar', {
                description: 'Ocurrió un error inesperado al intentar sincronizar'
            });
        } finally {
            setSyncing(false);
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

            <div className="space-y-3">
                <div className="text-xs text-slate-500 uppercase font-bold ml-1">Configuración</div>

                <Button
                    onClick={() => setShowPrinterModal(true)}
                    className="w-full bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white justify-start h-12"
                    variant="outline"
                >
                    <Printer className="w-5 h-5 mr-3 text-slate-400" />
                    Configurar Impresora
                </Button>

                <Button
                    onClick={handleSync}
                    disabled={syncing}
                    className="w-full bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white justify-start h-12"
                    variant="outline"
                >
                    {syncing ? (
                        <Loader2 className="w-5 h-5 mr-3 text-slate-400 animate-spin" />
                    ) : (
                        <RefreshCw className="w-5 h-5 mr-3 text-slate-400" />
                    )}
                    {syncing ? 'Sincronizando...' : 'Sincronizar Datos'}
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

                <div className="text-center text-xs text-slate-600 pt-4">
                    Version 1.0.0 (Build 100)
                </div>
            </div>

            <PrinterConfigModal
                isOpen={showPrinterModal}
                onClose={() => setShowPrinterModal(false)}
            />
        </div>
    );
}
