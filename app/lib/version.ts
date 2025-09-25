
export interface AppVersion {
  version: string;
  buildDate: string;
  buildNumber: string;
  environment: string;
  features: string[];
  lastUpdate: string;
}

export const APP_VERSION: AppVersion = {
  version: "1.3.0",
  buildDate: new Date().toISOString(),
  buildNumber: "202509250002",
  environment: process.env.NODE_ENV || "development",
  features: [
    "Sistema de control de versiones completo",
    "Banner de actualizaciones automático",
    "Changelog integrado en el sistema", 
    "Dashboard corregido y funcional",
    "Menú lateral con roles",
    "200 clientes de prueba"
  ],
  lastUpdate: "25 Sep 2025 - Control de versiones implementado"
};

export function getVersionInfo(): AppVersion {
  return {
    ...APP_VERSION,
    buildDate: new Date().toISOString()
  };
}

export function getVersionString(): string {
  return `v${APP_VERSION.version} (Build ${APP_VERSION.buildNumber})`;
}
