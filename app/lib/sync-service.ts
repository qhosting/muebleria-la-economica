
// Servicio de sincronización para PWA de cobranza móvil
import { db, OfflineCliente, OfflinePago, OfflineMotarorio, SyncQueue, generateLocalId } from './offline-db';
import { toast } from 'sonner';
import { apiFetch } from './api-config';

import { networkMonitor } from './network-quality';

export class SyncService {
  private static instance: SyncService;
  private syncInProgress = false;
  private autoSyncInterval?: NodeJS.Timeout;

  private constructor() { }

  public static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  // Inicializar sincronización automática
  public async initAutoSync(cobradorId: string) {
    const settings = await db.settings.get(cobradorId);
    if (settings?.autoSync !== false) {
      this.startAutoSync(cobradorId);
    }
  }

  private startAutoSync(cobradorId: string) {
    if (this.autoSyncInterval) {
      clearInterval(this.autoSyncInterval);
    }

    // 🚀 OPTIMIZACIÓN MÓVIL: Verificar cada 1 minuto si hay conexión
    this.autoSyncInterval = setInterval(async () => {
      if (!this.syncInProgress && typeof window !== 'undefined' && navigator.onLine) {
        try {
          const pendingPagos = await db.pagos.where('syncStatus').equals('pending').count();
          const pendingMotararios = await db.motararios.where('syncStatus').equals('pending').count();

          if (pendingPagos > 0 || pendingMotararios > 0) {
            console.log(`[Auto-Sync] Datos pendientes (${pendingPagos} pagos, ${pendingMotararios} motararios). Sincronizando...`);
            await this.syncAll(cobradorId, false); // silent sync
          }
        } catch (error) {
          console.error('Error en auto-sync:', error);
        }
      }
    }, 60 * 1000);
  }

  public stopAutoSync() {
    if (this.autoSyncInterval) {
      clearInterval(this.autoSyncInterval);
      this.autoSyncInterval = undefined;
    }
  }

  // Sincronización completa
  public async syncAll(cobradorId: string, showToast = true): Promise<boolean> {
    if (this.syncInProgress) {
      if (showToast) toast.info('Sincronización ya en progreso...');
      return false;
    }

    // Validar si el navegador reporta estar offline
    if (typeof window !== 'undefined' && !navigator.onLine) {
      if (showToast) toast.error('Sin conexión a internet');
      return false;
    }

    this.syncInProgress = true;

    try {
      if (showToast) toast.info('Sincronizando datos...');

      // 1. PRIMERO: Subir pagos pendientes (prioridad para resguardar cobros en el servidor)
      const pagosOk = await this.uploadPagos(cobradorId);

      // 2. SEGUNDO: Subir motararios pendientes
      const motarariosOk = await this.uploadMotararios(cobradorId);

      // 3. TERCERO: Descargar clientes actualizados del servidor (traerá saldos recién actualizados)
      await this.downloadClientes(cobradorId);

      // 4. Actualizar timestamp de sincronización
      await this.updateLastSync(cobradorId);

      if (showToast) {
        if (pagosOk && motarariosOk) {
          toast.success('Sincronización completada con éxito');
        } else {
          toast.warning('Sincronización parcial: algunos registros no se pudieron subir');
        }
      }
      return pagosOk && motarariosOk;

    } catch (error) {
      console.error('Error en sincronización:', error);
      if (showToast) toast.error('Error en sincronización');
      return false;
    } finally {
      this.syncInProgress = false;
    }
  }

  // Descargar clientes asignados al cobrador
  private async downloadClientes(cobradorId: string) {
    try {
      const response = await apiFetch(`/api/sync/clientes/${cobradorId}?full=true`);
      if (!response.ok) {
        console.warn(`No se pudieron descargar clientes para cobrador ${cobradorId}: ${response.status}`);
        return;
      }

      const clientesServidor = await response.json();
      if (!Array.isArray(clientesServidor)) return;

      // Actualizar clientes locales usando put (upsert seguro sin errores de clave)
      await db.transaction('rw', db.clientes, async () => {
        for (const cliente of clientesServidor) {
          await db.clientes.put({
            ...cliente,
            lastSync: Date.now(),
            syncStatus: 'synced' as const
          });
        }
      });

      console.log(`${clientesServidor.length} clientes sincronizados`);
    } catch (error) {
      console.error('Error descargando clientes:', error);
    }
  }

  // Subir pagos pendientes al servidor
  public async uploadPagos(cobradorId: string, specificLocalIds?: string[]): Promise<boolean> {
    try {
      let query = db.pagos.where('syncStatus').equals('pending');
      let pagosPendientes = await query.toArray();

      if (specificLocalIds && specificLocalIds.length > 0) {
        pagosPendientes = pagosPendientes.filter(p => specificLocalIds.includes(p.localId));
      } else if (cobradorId) {
        pagosPendientes = pagosPendientes.filter(p => p.cobradorId === cobradorId || !p.cobradorId);
      }

      if (pagosPendientes.length === 0) return true;

      console.log(`Pagos pendientes para sincronizar: ${pagosPendientes.length}`);
      let allOk = true;

      for (const pago of pagosPendientes) {
        try {
          console.log(`Sincronizando pago ${pago.localId} (${pago.tipoPago})`);

          await db.pagos.where('localId').equals(pago.localId).modify({ syncStatus: 'syncing' });

          const payloadPago = {
            clienteId: pago.clienteId,
            cobradorId: pago.cobradorId || cobradorId,
            monto: pago.monto,
            tipoPago: pago.tipoPago,
            concepto: pago.concepto,
            fechaPago: pago.fechaPago,
            metodoPago: pago.metodoPago,
            numeroRecibo: pago.numeroRecibo,
            localId: pago.localId
          };

          const response = await apiFetch('/api/pagos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payloadPago)
          });

          if (response.ok) {
            const pagoServidor = await response.json();
            console.log(`Pago ${pago.localId} sincronizado exitosamente con ID: ${pagoServidor.id}`);

            await db.pagos.where('localId').equals(pago.localId).modify({
              id: pagoServidor.id,
              syncStatus: 'synced',
              lastSync: Date.now()
            });

            // Actualizar cola de sincronización
            await db.syncQueue.where('localId').equals(pago.localId).modify({ status: 'completed' });
          } else {
            allOk = false;
            const errorText = await response.text();
            console.error(`Error en respuesta del servidor para pago ${pago.localId}:`, response.status, errorText);

            // Revertir a pending para reintento posterior
            await db.pagos.where('localId').equals(pago.localId).modify({ syncStatus: 'pending' });
            await db.syncQueue.where('localId').equals(pago.localId).modify({ status: 'failed', error: errorText });
          }

        } catch (error) {
          allOk = false;
          console.error(`Error subiendo pago ${pago.localId}:`, error);
          await db.pagos.where('localId').equals(pago.localId).modify({ syncStatus: 'pending' });
          await db.syncQueue.where('localId').equals(pago.localId).modify({ status: 'failed' });
        }
      }

      return allOk;
    } catch (err) {
      console.error('Error general en uploadPagos:', err);
      return false;
    }
  }

  // Subir motararios pendientes al servidor
  public async uploadMotararios(cobradorId: string): Promise<boolean> {
    try {
      const motarariosPendientes = await db.motararios
        .where('syncStatus').equals('pending')
        .and(motarario => !cobradorId || motarario.cobradorId === cobradorId || !motarario.cobradorId)
        .toArray();

      if (motarariosPendientes.length === 0) return true;
      console.log(`Motararios pendientes para sincronizar: ${motarariosPendientes.length}`);
      let allOk = true;

      for (const motarario of motarariosPendientes) {
        try {
          await db.motararios.where('localId').equals(motarario.localId).modify({ syncStatus: 'syncing' });

          const response = await apiFetch('/api/motararios', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              clienteId: motarario.clienteId,
              cobradorId: motarario.cobradorId || cobradorId,
              motivo: motarario.motivo,
              descripcion: motarario.descripcion,
              fecha: motarario.fecha,
              proximaVisita: motarario.proximaVisita,
              localId: motarario.localId
            })
          });

          if (response.ok) {
            const motararioServidor = await response.json();
            await db.motararios.where('localId').equals(motarario.localId).modify({
              id: motararioServidor.id,
              syncStatus: 'synced',
              lastSync: Date.now()
            });
            await db.syncQueue.where('localId').equals(motarario.localId).modify({ status: 'completed' });
          } else {
            allOk = false;
            await db.motararios.where('localId').equals(motarario.localId).modify({ syncStatus: 'pending' });
          }

        } catch (error) {
          allOk = false;
          console.error('Error subiendo motarario:', error);
          await db.motararios.where('localId').equals(motarario.localId).modify({ syncStatus: 'pending' });
        }
      }

      return allOk;
    } catch (err) {
      console.error('Error general en uploadMotararios:', err);
      return false;
    }
  }

  // Actualizar timestamp de última sincronización
  private async updateLastSync(cobradorId: string) {
    await db.settings.put({
      cobradorId,
      lastFullSync: Date.now(),
      syncEnabled: true,
      autoSync: true,
      printFormat: 'thermal',
      offlineMode: false
    });
  }

  // Agregar pago offline
  public async addPagoOffline(pagoData: Omit<OfflinePago, 'localId' | 'syncStatus' | 'createdOffline' | 'printStatus'>) {
    const localId = generateLocalId();

    const pago: OfflinePago = {
      ...pagoData,
      localId,
      syncStatus: 'pending',
      createdOffline: true,
      printStatus: 'pending'
    };

    if (!pago.id) {
      delete pago.id;
    }

    console.log('Agregando pago offline:', pago);
    await db.pagos.put(pago);

    // Actualizar cliente localmente
    const cliente = await db.clientes.get(pago.clienteId);
    if (cliente) {
      await db.clientes.update(pago.clienteId, {
        saldoPendiente: pago.saldoNuevo,
        fechaUltimoPago: pago.fechaPago,
        syncStatus: 'pending'
      });
      console.log(`Cliente local actualizado. Nuevo saldo: ${pago.saldoNuevo}`);
    }

    // Agregar a cola de sincronización
    await db.syncQueue.add({
      type: 'pago',
      data: pago,
      localId,
      attempts: 0,
      status: 'pending'
    });

    console.log(`Pago offline agregado con localId: ${localId}, tipo: ${pago.tipoPago}`);
    return localId;
  }

  // Agregar motarario offline
  public async addMotararioOffline(motararioData: Omit<OfflineMotarorio, 'localId' | 'syncStatus' | 'createdOffline'>) {
    const localId = generateLocalId();

    const motarario: OfflineMotarorio = {
      ...motararioData,
      localId,
      syncStatus: 'pending',
      createdOffline: true
    };

    if (!motarario.id) {
      delete motarario.id;
    }

    await db.motararios.put(motarario);

    // Agregar a cola de sincronización
    await db.syncQueue.add({
      type: 'motarorio',
      data: motarario,
      localId,
      attempts: 0,
      status: 'pending'
    });

    return localId;
  }

  // Obtener estado de sincronización
  public async getSyncStatus(cobradorId: string) {
    const [settings, pendingPagos, pendingMotararios, failedItems] = await Promise.all([
      db.settings.get(cobradorId),
      db.pagos.where('syncStatus').equals('pending').and(p => p.cobradorId === cobradorId).count(),
      db.motararios.where('syncStatus').equals('pending').and(m => m.cobradorId === cobradorId).count(),
      db.syncQueue.where('status').equals('failed').count()
    ]);

    return {
      lastSync: settings?.lastFullSync,
      pendingPagos,
      pendingMotararios,
      failedItems,
      isOnline: navigator.onLine,
      syncInProgress: this.syncInProgress
    };
  }

  // Función para debuggear pagos offline
  public async getPagosOffline(cobradorId: string) {
    const pagosOffline = await db.pagos
      .where('cobradorId').equals(cobradorId)
      .toArray();

    console.log(`Pagos offline encontrados: ${pagosOffline.length}`);
    pagosOffline.forEach(pago => {
      console.log(`${pago.localId}: ${pago.tipoPago} - ${pago.monto} - Status: ${pago.syncStatus}`);
    });

    return pagosOffline;
  }
}

// Instancia singleton
export const syncService = SyncService.getInstance();

// Event listeners para manejo de conectividad (solo en el cliente)
if (typeof window !== 'undefined') {
  window.addEventListener('online', async () => {
    console.log('Conexión restaurada - intentando sincronizar');
    toast.success('Conexión restaurada');
    try {
      const setting = await db.settings.toCollection().first();
      if (setting?.cobradorId) {
        await syncService.syncAll(setting.cobradorId, false);
      }
    } catch (e) {
      console.warn('Error auto-sincronizando al volver online:', e);
    }
  });

  window.addEventListener('offline', () => {
    console.log('Conexión perdida - modo offline');
    toast.info('Sin conexión - trabajando offline');
  });
}
