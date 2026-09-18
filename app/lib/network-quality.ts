'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from './api-config';
import { Capacitor } from '@capacitor/core';
import { Network } from '@capacitor/network';

export type NetworkStatusType = 'online' | 'unstable' | 'offline';

export interface NetworkQualityState {
  status: NetworkStatusType;
  isOnline: boolean;
  isStable: boolean;
  latencyMs: number | null;
  effectiveType?: string;
  lastChecked: number | null;
}

class NetworkQualityMonitor {
  private static instance: NetworkQualityMonitor;
  private listeners: Set<(state: NetworkQualityState) => void> = new Set();
  private currentState: NetworkQualityState = {
    status: typeof window !== 'undefined' && navigator.onLine ? 'online' : 'offline',
    isOnline: typeof window !== 'undefined' ? navigator.onLine : true,
    isStable: false,
    latencyMs: null,
    lastChecked: null
  };
  private checkInterval?: NodeJS.Timeout;
  private isChecking = false;

  private constructor() {
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  public static getInstance(): NetworkQualityMonitor {
    if (!NetworkQualityMonitor.instance) {
      NetworkQualityMonitor.instance = new NetworkQualityMonitor();
    }
    return NetworkQualityMonitor.instance;
  }

  private init() {
    // Listener nativo de Capacitor para Android APK
    if (Capacitor.isNativePlatform()) {
      try {
        Network.addListener('networkStatusChange', (status: any) => {
          if (status.connected) {
            this.checkQuality();
          } else {
            this.updateState({
              status: 'offline',
              isOnline: false,
              isStable: false,
              latencyMs: null,
              lastChecked: Date.now()
            });
          }
        });
      } catch (e) {
        console.warn('Error inicializando listener nativo de red:', e);
      }
    }

    window.addEventListener('online', () => {
      this.checkQuality();
    });

    window.addEventListener('offline', () => {
      this.updateState({
        status: 'offline',
        isOnline: false,
        isStable: false,
        latencyMs: null,
        lastChecked: Date.now()
      });
    });

    // Verificación inicial
    this.checkQuality();

    // Verificación periódica cada 30 segundos si está en primer plano
    this.checkInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        this.checkQuality();
      }
    }, 30000);

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.checkQuality();
      }
    });
  }

  public async checkQuality(): Promise<NetworkQualityState> {
    if (typeof window === 'undefined') return this.currentState;

    if (!navigator.onLine) {
      this.updateState({
        status: 'offline',
        isOnline: false,
        isStable: false,
        latencyMs: null,
        lastChecked: Date.now()
      });
      return this.currentState;
    }

    if (this.isChecking) return this.currentState;
    this.isChecking = true;

    const navConn = (navigator as any).connection;
    const effectiveType = navConn?.effectiveType;

    // Si la conexión reportada por el navegador es slow-2g o 2g, es inestable
    if (effectiveType === 'slow-2g' || effectiveType === '2g') {
      this.updateState({
        status: 'unstable',
        isOnline: true,
        isStable: false,
        latencyMs: 3000,
        effectiveType,
        lastChecked: Date.now()
      });
      this.isChecking = false;
      return this.currentState;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500); // 2.5s timeout estricto
    const startTime = performance.now();

    try {
      const response = await apiFetch(`/api/ping?_t=${Date.now()}`, {
        signal: controller.signal,
        cache: 'no-store'
      });

      clearTimeout(timeoutId);
      const latencyMs = Math.round(performance.now() - startTime);

      if (response.ok) {
        // Si la latencia es menor a 2000 ms, se considera conexión estable
        const isStable = latencyMs < 2000;
        this.updateState({
          status: isStable ? 'online' : 'unstable',
          isOnline: true,
          isStable,
          latencyMs,
          effectiveType,
          lastChecked: Date.now()
        });
      } else {
        this.updateState({
          status: 'unstable',
          isOnline: true,
          isStable: false,
          latencyMs,
          effectiveType,
          lastChecked: Date.now()
        });
      }
    } catch (error) {
      clearTimeout(timeoutId);
      // Aborted o Network error
      this.updateState({
        status: navigator.onLine ? 'unstable' : 'offline',
        isOnline: navigator.onLine,
        isStable: false,
        latencyMs: null,
        effectiveType,
        lastChecked: Date.now()
      });
    } finally {
      this.isChecking = false;
    }

    return this.currentState;
  }

  public getState(): NetworkQualityState {
    return this.currentState;
  }

  public subscribe(callback: (state: NetworkQualityState) => void): () => void {
    this.listeners.add(callback);
    callback(this.currentState);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private updateState(newState: NetworkQualityState) {
    this.currentState = newState;
    this.listeners.forEach(cb => cb(this.currentState));
  }
}

export const networkMonitor = NetworkQualityMonitor.getInstance();

export function useNetworkQuality(): NetworkQualityState {
  const [state, setState] = useState<NetworkQualityState>(networkMonitor.getState());

  useEffect(() => {
    return networkMonitor.subscribe(setState);
  }, []);

  return state;
}
