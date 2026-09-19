
// Servicio de sincronización para PWA de cobranza móvil
import { db, OfflineCliente, OfflinePago, OfflineMotarorio, SyncQueue, generateLocalId, clearPreviousGestorData } from './offline-db';
import { toast } from 'sonner';
import { apiFetch } from './api-config';

import { networkMonitor } from './network-quality';

export class SyncService {
  private static instance: SyncService;
  private syncInProgress = false;
  private autoSyncInterval?: NodeJS.Timeout;
  private currentCobradorId?: string;
  private networkSubscribed = false;
  private lastAutoSyncAttempt = 0;

  private constructor() { }

  public static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  public getCurrentCobradorId(): string | undefined {
    return this.currentCobradorId;
  }

  public setCurrentCobradorId(id: string) {
    this.currentCobradorId = id;
  }

  // Desbloquear cualquier pago o motarario que haya quedado en 'syncing' por crash o recarga previa
  public async resetStuckSyncing() {
    try {
      await db.pagos.where('syncStatus').equals('syncing').modify({ syncStatus: 'pending' });
      await db.motararios.where('syncStatus').equals('syncing').modify({ syncStatus: 'pending' });
    } catch (err) {
      console.warn('Error reseteando registros colgados en syncing:', err);
    }
  }

  // Inicializar sincronización automática
  public async initAutoSync(cobradorId: string) {
    if (!cobradorId) return;
    this.currentCobradorId = cobradorId;

    // 🧹 Limpieza automática de clientes pertenecientes a otros gestores
    await clearPreviousGestorData(cobradorId);

    // Asegurar que exista configuración local con el cobradorId para reconexiones automáticas
    try {
      let existing = await db.settings.get(cobradorId);
      if (!existing) {
        existing = {
          cobradorId,
          syncEnabled: true,
          autoSync: true,
          preferOffline: true, // 🚀 MODO OFFLINE PREFERIDO POR DEFECTO PARA FLUIDEZ EN CAMPO
          printFormat: 'thermal',
          offlineMode: false,
          lastFullSync: Date.now()
        };
        await db.settings.put(existing);
      }
    } catch (e) {
      console.warn('Error inicializando settings en IndexedDB:', e);
    }

    // Limpiar posibles elementos congelados
    await this.resetStuckSyncing();

    // Suscribir auto-sync al monitor de red para sincronizar apenas detecte conexión ESTABLE
    this.setupNetworkMonitorSync(cobradorId);

    const settings = await db.settings.get(cobradorId);
    if (settings?.autoSync !== false) {
      this.startAutoSync(cobradorId);
    }
  }

  private setupNetworkMonitorSync(cobradorId: string) {
    if (this.networkSubscribed) return;
    this.networkSubscribed = true;

    networkMonitor.subscribe(async (netState) => {
      // Sincronizar automáticamente sólo cuando la conexión es 'online' Y realmente estable (ping < 2000ms)
      if (netState.status === 'online' && netState.isStable && !this.syncInProgress) {
        const now = Date.now();
        // Control de frecuencia para evitar múltiples ráfagas seguidas
        if (now - this.lastAutoSyncAttempt < 15000) return;
        this.lastAutoSyncAttempt = now;

        try {
          const activeCobradorId = cobradorId || this.currentCobradorId;
          if (!activeCobradorId) return;

          const pendingPagos = await db.pagos.where('syncStatus').equals('pending').count();
          const pendingMotararios = await db.motararios.where('syncStatus').equals('pending').count();

          if (pendingPagos > 0 || pendingMotararios > 0) {
            console.log(`[Auto-Sync Red Estable] Conexión estable confirmada (${netState.latencyMs}ms). Sincronizando ${pendingPagos} pagos y ${pendingMotararios} motararios...`);
            await this.syncAll(activeCobradorId, false);
          }
        } catch (err) {
          console.warn('Error en auto-sync disparado por red estable:', err);
        }
      }
    });
  }

  private startAutoSync(cobradorId: string) {
    if (this.autoSyncInterval) {
      clearInterval(this.autoSyncInterval);
    }

    // 🚀 OPTIMIZACIÓN MÓVIL: Verificar cada 1 minuto
    this.autoSyncInterval = setInterval(async () => {
      const activeCobradorId = cobradorId || this.currentCobradorId;
      if (!activeCobradorId || this.syncInProgress) return;

      const netState = networkMonitor.getState();
      if (!netState.isOnline) return;

      try {
        const pendingPagos = await db.pagos.where('syncStatus').equals('pending').count();
        const pendingMotararios = await db.motararios.where('syncStatus').equals('pending').count();

        if (pendingPagos > 0 || pendingMotararios > 0) {
          console.log(`[Auto-Sync Intervalo] Datos pendientes (${pendingPagos} pagos, ${pendingMotararios} motararios). Sincronizando...`);
          await this.syncAll(activeCobradorId, false); // silent sync
        }
      } catch (error) {
        console.error('Error en auto-sync periódico:', error);
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

    const targetCobradorId = cobradorId || this.currentCobradorId;
    if (!targetCobradorId) {
      if (showToast) toast.error('No se especificó cobrador');
      return false;
    }

    // Validar estado de red con networkMonitor
    const netState = networkMonitor.getState();
    if (!netState.isOnline) {
      if (showToast) toast.error('Sin conexión a internet');
      return false;
    }

    this.syncInProgress = true;

    try {
      // Liberar registros previamente colgados antes de sincronizar
      await this.resetStuckSyncing();

      if (showToast) toast.info('Sincronizando datos...');

      // 1. PRIMERO: Descargar clientes asignados del servidor
      const clientesOk = await this.downloadClientes(targetCobradorId);

      // 2. SEGUNDO: Subir pagos pendientes al servidor
      const pagosOk = await this.uploadPagos(targetCobradorId);

      // 3. TERCERO: Subir motararios pendientes
      const motarariosOk = await this.uploadMotararios(targetCobradorId);

      // 4. CUARTO: Si se procesaron pagos nuevos, refrescar clientes para reflejar saldos confirmados del servidor
      if (pagosOk) {
        await this.downloadClientes(targetCobradorId);
      }

      // 5. Actualizar timestamp de sincronización
      await this.updateLastSync(targetCobradorId);

      if (showToast) {
        if (clientesOk && pagosOk && motarariosOk) {
          toast.success('Sincronización completada con éxito');
        } else if (!clientesOk) {
          toast.warning('Sincronización parcial: error descargando clientes');
        } else {
          toast.warning('Sincronización parcial: algunos registros no se pudieron subir');
        }
      }
      return clientesOk && pagosOk && motarariosOk;

    } catch (error) {
      console.error('Error en sincronización:', error);
      if (showToast) toast.error('Error en sincronización');
      return false;
    } finally {
      this.syncInProgress = false;
    }
  }

  // Descargar clientes asignados al cobrador
  public async downloadClientes(cobradorId: string): Promise<boolean> {
    try {
      const response = await apiFetch(`/api/sync/clientes/${cobradorId}?full=true`);
      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`No se pudieron descargar clientes para cobrador ${cobradorId} (${response.status}):`, errorText);
        return false;
      }

      const clientesServidor = await response.json();
      if (!Array.isArray(clientesServidor)) return false;

      // Consultar si existen cobros pendientes de subir para no sobreescribir su saldo provisional
      const pagosPendientes = await db.pagos.where('syncStatus').equals('pending').toArray();
      const pendientesPorCliente = new Map<string, number>();
      for (const p of pagosPendientes) {
        const monto = Number(p.monto) || 0;
        if (['regular', 'abono', 'liquidacion'].includes(p.tipoPago)) {
          pendientesPorCliente.set(p.clienteId, (pendientesPorCliente.get(p.clienteId) || 0) + monto);
        } else if (p.tipoPago === 'cobro_mora') {
          pendientesPorCliente.set(p.clienteId, (pendientesPorCliente.get(p.clienteId) || 0) - monto);
        }
      }

      // Limpiar clientes de otros gestores y actualizar los locales usando put
      await clearPreviousGestorData(cobradorId);

      await db.transaction('rw', db.clientes, async () => {
        // Eliminar clientes que no pertenezcan al cobrador
        await db.clientes.filter(c => !c.cobradorAsignadoId || c.cobradorAsignadoId !== cobradorId).delete();

        for (const cliente of clientesServidor) {
          const saldoServidor = Number(cliente.saldoPendiente) || 0;
          const pendiente = pendientesPorCliente.get(cliente.id) || 0;
          const saldoFinal = Math.max(0, Math.round((saldoServidor - pendiente + Number.EPSILON) * 100) / 100);

          await db.clientes.put({
            ...cliente,
            cobradorAsignadoId: cliente.cobradorAsignadoId || cobradorId,
            saldoPendiente: saldoFinal,
            montoAcordado: Number(cliente.montoAcordado) || 0,
            lastSync: Date.now(),
            syncStatus: pendiente > 0 ? 'pending' : 'synced'
          });
        }
      });

      console.log(`${clientesServidor.length} clientes sincronizados`);
      return true;
    } catch (error) {
      console.error('Error descargando clientes:', error);
      return false;
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
    const existing = await db.settings.get(cobradorId);
    await db.settings.put({
      ...existing,
      cobradorId,
      lastFullSync: Date.now(),
      syncEnabled: true,
      autoSync: true,
      printFormat: 'thermal',
      offlineMode: false,
      preferOffline: existing?.preferOffline !== undefined ? existing.preferOffline : true
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
      syncInProgress: this.syncInProgress,
      preferOffline: settings?.preferOffline || false
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
    console.log('Conexión restaurada - verificando calidad para sincronizar');
    toast.success('Conexión restaurada', {
      description: 'Verificando estabilidad de red...'
    });
    try {
      // Probar calidad real de conexión (ping al servidor)
      const netState = await networkMonitor.checkQuality();

      let cobradorId = syncService.getCurrentCobradorId();
      if (!cobradorId) {
        const setting = await db.settings.toCollection().first();
        cobradorId = setting?.cobradorId;
      }

      if (cobradorId && netState.isOnline) {
        console.log(`[Online Event] Disparando sincronización para cobrador ${cobradorId}`);
        await syncService.syncAll(cobradorId, false);
      }
    } catch (e) {
      console.warn('Error auto-sincronizando al volver online:', e);
    }
  });

  window.addEventListener('offline', () => {
    console.log('Conexión perdida - modo offline');
    toast.info('Sin conexión - trabajando offline', {
      description: 'Los cobros y notas se guardan de forma segura en tu dispositivo'
    });
  });
}
