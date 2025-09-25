
'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { 
  Info, 
  Calendar, 
  Hash, 
  Server, 
  CheckCircle,
  Clock
} from 'lucide-react';
import { APP_VERSION, getVersionString } from '@/lib/version';
import { CHANGELOG, getChangelogForVersion } from '@/lib/changelog';

interface VersionInfoProps {
  showFullInfo?: boolean;
  variant?: 'badge' | 'text' | 'dialog';
}

export function VersionInfo({ showFullInfo = false, variant = 'badge' }: VersionInfoProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  if (variant === 'text') {
    return (
      <div className="text-xs text-gray-500">
        {getVersionString()}
      </div>
    );
  }

  if (variant === 'badge') {
    return (
      <Badge 
        variant="secondary" 
        className="text-xs cursor-pointer hover:bg-gray-200"
        onClick={() => setIsDialogOpen(true)}
      >
        {getVersionString()}
      </Badge>
    );
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-xs text-gray-500 hover:text-gray-700 h-6 px-2"
        >
          <Info className="h-3 w-3 mr-1" />
          {getVersionString()}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Info className="h-5 w-5 text-blue-600" />
            <span>Información de Versión</span>
          </DialogTitle>
          <DialogDescription>
            Detalles de la versión actual del sistema
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Versión Principal */}
          <div className="flex items-center justify-between">
            <span className="font-medium">Versión:</span>
            <Badge variant="outline" className="font-mono">
              v{APP_VERSION.version}
            </Badge>
          </div>

          {/* Build Number */}
          <div className="flex items-center justify-between">
            <span className="font-medium flex items-center space-x-1">
              <Hash className="h-4 w-4" />
              <span>Build:</span>
            </span>
            <span className="font-mono text-sm text-gray-600">
              {APP_VERSION.buildNumber}
            </span>
          </div>

          {/* Environment */}
          <div className="flex items-center justify-between">
            <span className="font-medium flex items-center space-x-1">
              <Server className="h-4 w-4" />
              <span>Entorno:</span>
            </span>
            <Badge 
              variant={APP_VERSION.environment === 'production' ? 'default' : 'secondary'}
            >
              {APP_VERSION.environment}
            </Badge>
          </div>

          {/* Última Actualización */}
          <div className="flex items-center justify-between">
            <span className="font-medium flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>Última actualización:</span>
            </span>
            <span className="text-sm text-gray-600">
              {APP_VERSION.lastUpdate}
            </span>
          </div>

          <Separator />

          {/* Características Actuales */}
          <div>
            <h4 className="font-medium mb-2 flex items-center space-x-1">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Características Incluidas:</span>
            </h4>
            <div className="space-y-1">
              {APP_VERSION.features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-2 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Changelog */}
          <Separator />
          <div>
            <h4 className="font-medium mb-3 text-gray-900">Últimas Actualizaciones</h4>
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {CHANGELOG.slice(0, 2).map((entry, index) => (
                <div key={entry.version} className="border border-gray-100 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant={index === 0 ? "default" : "secondary"}>
                      v{entry.version}
                    </Badge>
                    <span className="text-xs text-gray-500">{entry.date}</span>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    {entry.changes.added && (
                      <div>
                        <span className="font-medium text-green-700">Agregado:</span>
                        <ul className="list-disc list-inside ml-2 text-gray-600 text-xs space-y-1">
                          {entry.changes.added.slice(0, 2).map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {entry.changes.fixed && (
                      <div>
                        <span className="font-medium text-blue-700">Corregido:</span>
                        <ul className="list-disc list-inside ml-2 text-gray-600 text-xs space-y-1">
                          {entry.changes.fixed.slice(0, 2).map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {entry.changes.improved && (
                      <div>
                        <span className="font-medium text-purple-700">Mejorado:</span>
                        <ul className="list-disc list-inside ml-2 text-gray-600 text-xs space-y-1">
                          {entry.changes.improved.slice(0, 2).map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Información Técnica */}
          <Separator />
          <div className="text-xs text-gray-500 space-y-1">
            <div>Sistema: Mueblería La Económica</div>
            <div>Framework: Next.js 14</div>
            <div>Base de datos: PostgreSQL</div>
            <div>Última compilación: {new Date().toLocaleString('es-ES')}</div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
