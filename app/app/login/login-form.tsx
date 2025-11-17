
'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Building2, LogIn, Loader2, Download } from 'lucide-react';
import { VersionInfo } from '@/components/version-info';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    // Cargar credenciales recordadas si existen
    const savedEmail = localStorage.getItem('remembered_email');
    const savedPassword = localStorage.getItem('remembered_password');
    const rememberMeStatus = localStorage.getItem('remember_me') === 'true';
    
    if (savedEmail && savedPassword && rememberMeStatus) {
      setEmail(savedEmail);
      setPassword(savedPassword);
      setRememberMe(true);
    }

    // Detectar si la PWA puede instalarse
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Detectar si es Android y no está instalada la PWA
    const isAndroid = /Android/i.test(navigator.userAgent);
    const isMobile = /Mobile|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         (window.navigator as any).standalone === true;
    
    // Mostrar el botón siempre en dispositivos móviles que no tengan la PWA instalada
    if ((isAndroid || isMobile) && !isStandalone) {
      setShowInstallButton(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      // Mostrar el prompt de instalación
      deferredPrompt.prompt();
      
      // Esperar a que el usuario responda
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('Usuario aceptó instalar la PWA');
      } else {
        console.log('Usuario rechazó instalar la PWA');
      }
      
      // Limpiar el prompt
      setDeferredPrompt(null);
      setShowInstallButton(false);
    } else {
      // Para navegadores que no soportan beforeinstallprompt
      // Mostrar instrucciones manuales
      alert(
        'Para instalar la aplicación:\n\n' +
        '1. Toca el menú del navegador (⋮)\n' +
        '2. Selecciona "Agregar a pantalla de inicio"\n' +
        '3. Confirma la instalación'
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      alert('Por favor complete todos los campos');
      return;
    }

    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        alert('Credenciales incorrectas');
        setIsLoading(false);
        return;
      }

      if (result?.ok) {
        // Manejar recordar credenciales
        if (rememberMe) {
          localStorage.setItem('remembered_email', email);
          localStorage.setItem('remembered_password', password);
          localStorage.setItem('remember_me', 'true');
        } else {
          localStorage.removeItem('remembered_email');
          localStorage.removeItem('remembered_password');
          localStorage.removeItem('remember_me');
        }

        // Esperar un poco para que la sesión se establezca
        await new Promise(resolve => setTimeout(resolve, 500));

        // Obtener información del usuario para redireccionar según rol
        try {
          const sessionResponse = await fetch('/api/auth/session');
          const sessionData = await sessionResponse.json();
          
          if (sessionData && sessionData.user) {
            const userRole = sessionData.user.role;
            
            // Redireccionar según el rol del usuario
            let redirectUrl = '/dashboard';
            
            switch (userRole) {
              case 'admin':
                redirectUrl = '/dashboard';
                break;
              case 'gestor_cobranza':
                redirectUrl = '/dashboard/clientes';
                break;
              case 'reporte_cobranza':
                redirectUrl = '/dashboard/reportes';
                break;
              case 'cobrador':
                redirectUrl = '/dashboard/cobranza-mobile';
                break;
            }
            
            // Usar window.location.href para forzar navegación completa
            window.location.href = redirectUrl;
          } else {
            throw new Error('No se pudo obtener la sesión');
          }
        } catch (error) {
          console.error('Error al obtener sesión:', error);
          // Fallback: ir al dashboard general
          window.location.href = '/dashboard';
        }
      }
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      alert('Error al iniciar sesión');
      setIsLoading(false);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center p-4">
        <div className="text-white">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <Building2 className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Mueblería La Económica
          </h1>
          <p className="text-blue-200">
            Sistema de Gestión y Cobranza
          </p>
        </div>

        <Card className="shadow-2xl border-0">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Iniciar Sesión</CardTitle>
            <CardDescription className="text-center">
              Ingrese sus credenciales para acceder al sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Correo Electrónico</label>
                <Input
                  type="email"
                  placeholder="usuario@muebleria.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Contraseña</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="h-11"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember-me"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  disabled={isLoading}
                />
                <label
                  htmlFor="remember-me"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Recordar inicio de sesión
                </label>
              </div>
              <Button 
                type="submit" 
                className="w-full h-11"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Iniciar Sesión
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {showInstallButton && (
          <Button 
            type="button"
            variant="default"
            className="w-full h-11 mt-4 bg-green-600 hover:bg-green-700 text-white shadow-lg"
            onClick={handleInstallPWA}
            disabled={isLoading}
          >
            <Download className="mr-2 h-4 w-4" />
            Instalar Aplicación
          </Button>
        )}

        <div className="text-center mt-6 space-y-2">
          <div className="text-blue-200 text-sm">
            Sistema desarrollado para control de cobranza
          </div>
          <div className="flex justify-center">
            <VersionInfo showButton={false} />
          </div>
        </div>
      </div>
    </div>
  );
}
