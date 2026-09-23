'use client';

import { useState, useEffect, ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { usePlatform } from '@/hooks/usePlatform';
import { Home, Users, DollarSign, User, Wifi, WifiOff, Sun, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useNetworkQuality } from '@/lib/network-quality';
import { VersionCheckModal } from '@/components/mobile/version-check-modal';
import { syncService } from '@/lib/sync-service';

interface CobradorLayoutProps {
    children: ReactNode;
}

export function CobradorLayout({ children }: CobradorLayoutProps) {
    const { isNative } = usePlatform();
    const pathname = usePathname();
    const network = useNetworkQuality();
    const { data: session } = useSession();
    const [modoSol, setModoSol] = useState(false);

    const userId = (session?.user as any)?.id;
    const userRole = (session?.user as any)?.role;

    // Cargar y sincronizar preferencia de Modo Sol
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

    // Inicializar sincronizador global en todo el layout móvil
    useEffect(() => {
        if (userId && (userRole === 'cobrador' || userRole === 'admin')) {
            syncService.initAutoSync(userId);
        }
    }, [userId, userRole]);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
            <VersionCheckModal />

            {/* Header simplificado */}
            <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 shadow-md">
                <div className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                            <span className="font-bold text-white text-xs">L</span>
                        </div>
                        <h1 className="text-lg font-bold text-white tracking-tight">LaEconomica</h1>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Botón de Modo Sol (Alto Contraste para luz solar) */}
                        <button
                            onClick={toggleModoSol}
                            className={`p-1.5 rounded-lg border transition-all ${
                                modoSol 
                                ? 'bg-amber-100 text-amber-700 border-amber-300 shadow-sm' 
                                : 'bg-slate-800 text-amber-400 border-slate-700 hover:bg-slate-700'
                            }`}
                            title={modoSol ? "Modo Sol activado (Tocar para modo oscuro)" : "Activar Modo Sol (Alto contraste para luz solar)"}
                        >
                            <Sun className="w-4 h-4" />
                        </button>

                        {network.status === 'online' && (
                            <Badge className="h-6 px-2 text-[10px] uppercase gap-1 bg-emerald-950 text-emerald-400 border-emerald-800">
                                <Wifi className="w-3 h-3" />
                                Online {network.latencyMs ? `(${network.latencyMs}ms)` : ''}
                            </Badge>
                        )}
                        {network.status === 'unstable' && (
                            <Badge className="h-6 px-2 text-[10px] uppercase gap-1 bg-amber-950 text-amber-400 border-amber-800">
                                <Activity className="w-3 h-3 animate-pulse" />
                                Inestable {network.latencyMs ? `(${network.latencyMs}ms)` : ''}
                            </Badge>
                        )}
                        {network.status === 'offline' && (
                            <Badge variant="destructive" className="h-6 px-2 text-[10px] uppercase gap-1">
                                <WifiOff className="w-3 h-3" />
                                Offline
                            </Badge>
                        )}
                    </div>
                </div>
            </header>

            {/* Contenido con padding para el nav inferior */}
            <main className="flex-1 pb-20 overflow-y-auto">
                <div className="p-4">
                    {children}
                </div>
            </main>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 pb-safe">
                <div className="grid grid-cols-4 h-16">
                    <NavButton
                        href="/mobile/home"
                        icon={Home}
                        label="Inicio"
                        isActive={pathname === '/mobile/home'}
                    />
                    <NavButton
                        href="/mobile/clientes"
                        icon={Users}
                        label="Clientes"
                        isActive={pathname.includes('/mobile/clientes')}
                    />
                    <NavButton
                        href="/mobile/caja"
                        icon={DollarSign}
                        label="Caja"
                        isActive={pathname.includes('/mobile/caja')}
                    />
                    <NavButton
                        href="/mobile/perfil"
                        icon={User}
                        label="Perfil"
                        isActive={pathname.includes('/mobile/perfil')}
                    />
                </div>
            </nav>
        </div>
    );
}

interface NavButtonProps {
    href: string;
    icon: any;
    label: string;
    isActive: boolean;
}

function NavButton({ href, icon: Icon, label, isActive }: NavButtonProps) {
    return (
        <Link
            href={href}
            className={cn(
                "flex flex-col items-center justify-center gap-1 transition-colors relative",
                isActive ? "text-emerald-400" : "text-slate-500 hover:text-slate-300"
            )}
        >
            {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-emerald-500 rounded-b-full opacity-75" />
            )}
            <Icon className={cn("w-6 h-6", isActive && "fill-current opacity-20")} />
            <span className="text-[10px] font-medium">{label}</span>
        </Link>
    );
}
