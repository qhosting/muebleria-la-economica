export const DEFAULT_PERMISSIONS: Record<string, string[]> = {
  admin: ['clientes', 'cobranza', 'inventario', 'reportes', 'tesoreria', 'configuracion', 'ventas', 'boveda'],
  gestor_cobranza: ['clientes', 'cobranza', 'inventario', 'reportes', 'tesoreria', 'configuracion', 'ventas', 'boveda'],
  reporte_cobranza: ['cobranza', 'reportes'],
  cobrador: ['clientes', 'cobranza', 'ventas', 'boveda'],
  vendedor: ['clientes', 'cobranza', 'ventas', 'boveda'],
};

export async function checkPermission(userRole: string, modulo: string): Promise<boolean> {
  if (!userRole) return false;
  // admin siempre tiene acceso a todo
  if (userRole.toLowerCase() === 'admin') return true;

  const allowedModules = DEFAULT_PERMISSIONS[userRole.toLowerCase()] || [];
  return allowedModules.includes(modulo.toLowerCase());
}
