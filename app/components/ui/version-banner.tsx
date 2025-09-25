
'use client';

import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Sparkles, Clock, CheckCircle } from 'lucide-react';
import { APP_VERSION } from '@/lib/version';

export function VersionBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [isNewVersion, setIsNewVersion] = useState(false);

  useEffect(() => {
    // Verificar si es una nueva versión
    const lastSeenVersion = localStorage.getItem('lastSeenVersion');
    const currentVersion = APP_VERSION.version;
    
    if (lastSeenVersion !== currentVersion) {
      setIsNewVersion(true);
      setShowBanner(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('lastSeenVersion', APP_VERSION.version);
    setShowBanner(false);
    setIsNewVersion(false);
  };

  if (!showBanner || !isNewVersion) {
    return null;
  }

  return (
    <Alert className="border-blue-200 bg-blue-50 mb-6">
      <Sparkles className="h-4 w-4 text-blue-600" />
      <AlertDescription className="flex items-center justify-between w-full">
        <div className="flex items-center space-x-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-medium text-blue-900">
                ¡Sistema actualizado!
              </span>
              <Badge variant="outline" className="text-blue-700 border-blue-300">
                v{APP_VERSION.version}
              </Badge>
            </div>
            <div className="text-sm text-blue-700 mt-1 flex items-center space-x-4">
              <span className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>{APP_VERSION.lastUpdate}</span>
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="hidden sm:flex flex-wrap gap-1 mr-4">
            {APP_VERSION.features.slice(0, 3).map((feature, index) => (
              <div key={index} className="flex items-center space-x-1 text-xs text-blue-600">
                <CheckCircle className="h-3 w-3" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleDismiss}
            className="text-blue-600 hover:text-blue-800 hover:bg-blue-100 h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
