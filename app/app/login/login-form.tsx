
'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Building2, LogIn, Loader2, Download, Settings } from 'lucide-react';
import { VersionInfo } from '@/components/version-info';
import { toast } from 'sonner';
import { guardarDatoCobrador } from '@/lib/native/storage';
import { Capacitor } from '@capacitor/core';
import { getFullPath } from '@/lib/api-config';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [installMethod, setInstallMethod] = useState<'native' | 'manual'>('native');
  const [serverUrl, setServerUrl] = useState('');
  const [showServerConfig, setShowServerConfig] = useState(false);
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

    const savedServer = localStorage.getItem('custom_server_url');
    if (savedServer) {
      setServerUrl(savedServer);
    }

    setShowInstallButton(false);
  }, []);

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
          // Guardar sesión manualmente si es nativo para asegurar persistencia
          const isNative = Capacitor.isNativePlatform();

          const sessionResponse = await fetch(getFullPath('/api/auth/session'));
          const sessionData = await sessionResponse.json();

          if (sessionData && sessionData.user) {
            const userRole = sessionData.user.role;

            // Si es nativo, guardamos el perfil del usuario para acceso offline/rápido
            if (isNative) {
              await guardarDatoCobrador('user_profile', {
                ...sessionData.user,
                lastLogin: new Date().toISOString()
              });
              console.log('✅ Sesión guardada en almacenamiento nativo');
            }

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
                redirectUrl = '/mobile/home';
                break;
            }

            console.log(`🚀 Redirigiendo a ${redirectUrl} para rol ${userRole}`);

            console.log(`🚀 Redirigiendo a ${redirectUrl} para rol ${userRole}`);

            // En nativo siempre usar el router de Next.js para mantener el contexto de la app
            // window.location.href causaría que se abra el navegador del sistema si la URL se interpreta como externa
            if (isNative || userRole === 'cobrador') {
              router.replace(redirectUrl);
            } else {
              // En web admin, permitimos refresh completo para asegurar estado limpio
              window.location.href = redirectUrl;
            }
          } else {
            throw new Error('No se pudo obtener la sesión activa');
          }
        } catch (error) {
          console.error('Error al obtener sesión:', error);

          const isNative = Capacitor.isNativePlatform();

          if (isNative) {
            alert('No se pudo establecer la sesión con el servidor [' + error + ']. Verifique su conexión o credenciales.');
            setIsLoading(false);
          } else {
            // Fallback a ruta por defecto en web
            window.location.href = '/dashboard';
          }
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
      {/* Botón de Configuración (Solo Nativo) */}
      {Capacitor.isNativePlatform() && (
        <button
          onClick={() => setShowServerConfig(!showServerConfig)}
          className="absolute top-4 right-4 p-2 text-blue-200 hover:text-white bg-slate-800/50 rounded-full transition-colors"
          title="Configurar Servidor"
        >
          <Settings className="w-6 h-6" />
        </button>
      )}

      <div className="w-full max-w-md animate-fade-in relative">
        {/* Modal de Configuración de Servidor */}
        {(showServerConfig || (!serverUrl && Capacitor.isNativePlatform())) && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/95 rounded-xl border border-blue-500/30 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="w-full space-y-4">
              <div className="text-center">
                <Settings className="w-12 h-12 text-blue-400 mx-auto mb-2" />
                <h2 className="text-xl font-bold text-white">Configurar Servidor</h2>
                <p className="text-sm text-blue-200">Ingresa la URL del servidor central</p>
              </div>

              <div className="space-y-2">
                <Input
                  placeholder="https://tu-servidor.com"
                  value={serverUrl}
                  onChange={(e) => setServerUrl(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white"
                />
                <p className="text-[10px] text-slate-400">
                  Ej: http://192.168.1.50:3000 o https://sistema.com
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 bg-transparent text-white border-slate-700"
                  onClick={() => setShowServerConfig(false)}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1 bg-blue-600 hover:bg-blue-500"
                  onClick={() => {
                    if (serverUrl) {
                      localStorage.setItem('custom_server_url', serverUrl);
                      toast.success('Servidor configurado');
                      setShowServerConfig(false);
                      // Recargar para aplicar cambios de basePath
                      window.location.reload();
                    }
                  }}
                >
                  Guardar
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <Building2 className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            VertexERP Muebles
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
