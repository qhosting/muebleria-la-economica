
'use client';

import React, { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { VersionInfo } from '@/components/version-info';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Building2,
  CreditCard,
  Route,
  Receipt,
  AlertTriangle,
  Printer,
  Package,
  Store,
  ShieldCheck,
} from 'lucide-react';

interface SidebarProps {
  className?: string;
  session?: any;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: any;
  roles: string[];
  section: string;
}

const navigation: NavigationItem[] = [
  // ==========================================
  // OPERACIÓN PRINCIPAL
  // ==========================================
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['admin', 'gestor_cobranza', 'reporte_cobranza', 'cobrador', 'vendedor'],
    section: 'Principal',
  },
  {
    name: 'Kiosco de Ventas',
    href: '/dashboard/kiosco',
    icon: Store,
    roles: ['admin', 'gestor_cobranza', 'reporte_cobranza', 'vendedor', 'cobrador'],
    section: 'Principal',
  },
  {
    name: 'Bóveda Digital',
    href: '/dashboard/boveda',
    icon: ShieldCheck,
    roles: ['admin', 'gestor_cobranza', 'vendedor', 'cobrador'],
    section: 'Principal',
  },

  // ==========================================
  // CARTERA Y COBRANZA
  // ==========================================
  {
    name: 'Clientes',
    href: '/dashboard/clientes',
    icon: Users,
    roles: ['admin', 'gestor_cobranza', 'vendedor', 'cobrador'],
    section: 'Crédito y Cartera',
  },
  {
    name: 'Pagos y Recibos',
    href: '/dashboard/pagos',
    icon: Receipt,
    roles: ['admin', 'gestor_cobranza', 'reporte_cobranza'],
    section: 'Crédito y Cartera',
  },
  {
    name: 'Cobranza Móvil',
    href: '/dashboard/cobranza',
    icon: CreditCard,
    roles: ['cobrador', 'vendedor'],
    section: 'Crédito y Cartera',
  },
  {
    name: 'Rutas de Cobranza',
    href: '/dashboard/rutas',
    icon: Route,
    roles: ['admin', 'gestor_cobranza', 'cobrador'],
    section: 'Crédito y Cartera',
  },
  {
    name: 'Morosidad',
    href: '/dashboard/morosidad',
    icon: AlertTriangle,
    roles: ['admin', 'gestor_cobranza', 'reporte_cobranza'],
    section: 'Crédito y Cartera',
  },

  // ==========================================
  // INVENTARIO Y FINANZAS
  // ==========================================
  {
    name: 'Inventario',
    href: '/dashboard/inventario',
    icon: Package,
    roles: ['admin', 'gestor_cobranza'],
    section: 'Inventario y Finanzas',
  },
  {
    name: 'Reportes',
    href: '/dashboard/reportes',
    icon: BarChart3,
    roles: ['admin', 'gestor_cobranza', 'reporte_cobranza'],
    section: 'Inventario y Finanzas',
  },

  // ==========================================
  // HERRAMIENTAS Y ADMINISTRACIÓN
  // ==========================================
  {
    name: 'Mi Impresora',
    href: '/dashboard/mi-impresora',
    icon: Printer,
    roles: ['admin', 'cobrador', 'vendedor'],
    section: 'Sistema y Ajustes',
  },
  {
    name: 'Plantillas',
    href: '/dashboard/plantillas',
    icon: FileText,
    roles: ['admin', 'gestor_cobranza'],
    section: 'Sistema y Ajustes',
  },
  {
    name: 'Usuarios',
    href: '/dashboard/usuarios',
    icon: UserCheck,
    roles: ['admin'],
    section: 'Sistema y Ajustes',
  },
  {
    name: 'Configuración',
    href: '/dashboard/configuracion',
    icon: Settings,
    roles: ['admin'],
    section: 'Sistema y Ajustes',
  },
];

export function Sidebar({
  className,
  session,
  isCollapsed: controlledIsCollapsed,
  onToggleCollapse,
}: SidebarProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const isCollapsed = controlledIsCollapsed !== undefined ? controlledIsCollapsed : internalCollapsed;
  const toggleCollapsed = onToggleCollapse || (() => setInternalCollapsed(!internalCollapsed));

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();

  const userRole = (session?.user as any)?.role;

  const filteredNavigation = navigation.filter(item =>
    item.roles.includes(userRole)
  );

  const handleSignOut = () => {
    // Solo limpiar credenciales si el usuario no eligió recordarlas
    const rememberMe = localStorage.getItem('remember_me') === 'true';
    if (!rememberMe) {
      localStorage.removeItem('remembered_email');
      localStorage.removeItem('remembered_password');
      localStorage.removeItem('remember_me');
    }

    signOut({ callbackUrl: '/login' });
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="bg-white shadow-md"
        >
          {isMobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40 print:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col bg-white border-r border-gray-200 shadow-sm transition-all duration-300 print:hidden",
        isCollapsed ? "w-16" : "w-64",
        "lg:translate-x-0",
        isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        className
      )}>
        {/* Header */}
        <div className={cn(
          "flex h-16 items-center border-b border-gray-200 transition-all",
          isCollapsed ? "justify-center px-2" : "justify-between px-4"
        )}>
          {!isCollapsed ? (
            <>
              <div className="flex items-center space-x-3 overflow-hidden">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <div className="truncate">
                  <h1 className="font-semibold text-gray-900 text-sm truncate">
                    Mueblería La Económica
                  </h1>
                  <p className="text-xs text-gray-500 truncate">Sistema de Cobranza</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleCollapsed}
                className="hidden lg:flex h-8 w-8 flex-shrink-0 text-gray-500 hover:text-gray-900"
                title="Contraer menú"
              >
                <Menu className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleCollapsed}
              className="hidden lg:flex h-9 w-9 text-blue-600 hover:bg-blue-50 rounded-lg"
              title="Expandir menú"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
          {filteredNavigation.map((item, index) => {
            const isActive = pathname === item.href;
            const prevItem = filteredNavigation[index - 1];
            const isNewSection = !prevItem || prevItem.section !== item.section;

            return (
              <React.Fragment key={item.name}>
                {!isCollapsed && isNewSection && (
                  <div className={cn(
                    "px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 select-none",
                    index > 0 ? "pt-3.5" : "pt-1"
                  )}>
                    {item.section}
                  </div>
                )}
                {isCollapsed && isNewSection && index > 0 && (
                  <div className="my-1.5 border-t border-slate-100" />
                )}
                <Link
                  href={item.href}
                  title={isCollapsed ? `${item.section}: ${item.name}` : undefined}
                  onClick={() => setIsMobileOpen(false)}
                  className={cn(
                    "flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all group",
                    isActive
                      ? "bg-blue-600 text-white font-semibold shadow-sm"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100",
                    isCollapsed && "justify-center px-0 py-2.5"
                  )}
                >
                  <item.icon className={cn(
                    "h-5 w-5 flex-shrink-0 transition-colors",
                    !isCollapsed && "mr-3",
                    isActive ? "text-white" : "text-slate-400 group-hover:text-slate-600"
                  )} />
                  {!isCollapsed && (
                    <span className="truncate">{item.name}</span>
                  )}
                </Link>
              </React.Fragment>
            );
          })}
        </nav>

        {/* User info and logout */}
        <div className={cn("border-t border-gray-200 transition-all", isCollapsed ? "p-2" : "p-4")}>
          {!isCollapsed && (
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-900 truncate">
                {session?.user?.name}
              </p>
              <p className="text-xs text-gray-500 mb-1 truncate">
                {userRole === 'admin' && 'Administrador'}
                {userRole === 'gestor_cobranza' && 'Gestor de Cobranza'}
                {userRole === 'reporte_cobranza' && 'Reportes'}
                {userRole === 'cobrador' && 'Cobrador'}
                {userRole === 'vendedor' && 'Vendedor de Sucursal'}
              </p>
              {(session?.user as any)?.sucursal?.nombre && (
                <p className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 mb-2 truncate text-center">
                  📍 {(session?.user as any).sucursal.nombre}
                </p>
              )}
              {/* Version Info */}
              <div className="flex justify-center">
                <VersionInfo showButton={true} />
              </div>
            </div>
          )}
          <Button
            variant="outline"
            size={isCollapsed ? "icon" : "sm"}
            onClick={handleSignOut}
            className={cn(
              isCollapsed
                ? "h-10 w-10 mx-auto flex items-center justify-center p-0 rounded-lg text-gray-600 hover:text-red-600 hover:border-red-200"
                : "w-full"
            )}
            title={isCollapsed ? "Cerrar Sesión" : undefined}
          >
            <LogOut className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
            {!isCollapsed && "Cerrar Sesión"}
          </Button>
        </div>
      </div>
    </>
  );
}
