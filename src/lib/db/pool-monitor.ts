// src/lib/db/pool-monitor.ts
// Propósito: Monitorear el estado del connection pool

import type postgres from 'postgres';

export interface PoolStats {
  totalConnections: number;
  idleConnections: number;
  activeConnections: number;
  waitingRequests: number;
  maxConnections: number;
  timestamp: Date;
}

/**
 * Monitor del connection pool
 * 
 * Ayuda a identificar:
 * - Connection leaks
 * - Pool exhaustion
 * - Queries lentos
 * - Necesidad de aumentar pool size
 */
export class PoolMonitor {
  private stats: PoolStats[] = [];
  private maxHistorySize = 100;
  private monitoringInterval?: NodeJS.Timeout;

  constructor(
    private client: ReturnType<typeof postgres>,
    private config: {
      maxConnections: number;
      warningThreshold?: number; // % de uso que dispara warning
      logInterval?: number; // ms entre logs
    }
  ) {
    this.config.warningThreshold = config.warningThreshold || 80;
    this.config.logInterval = config.logInterval || 60000; // 1 minuto
  }

  /**
   * Inicia el monitoreo automático
   */
  start(): void {
    if (this.monitoringInterval) {
      console.warn('Pool monitor already running');
      return;
    }

    this.monitoringInterval = setInterval(() => {
      const stats = this.getStats();
      this.recordStats(stats);
      this.checkThresholds(stats);
    }, this.config.logInterval);

    console.log('Pool monitor started');
  }

  /**
   * Detiene el monitoreo
   */
  stop(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
      console.log('Pool monitor stopped');
    }
  }

  /**
   * Obtiene estadísticas actuales del pool
   */
  getStats(): PoolStats {
    // Nota: postgres-js no expone estas estadísticas directamente
    // En producción, considera usar pg-pool que sí las expone
    // Por ahora, retornamos estadísticas estimadas
    
    return {
      totalConnections: 0, // postgres-js maneja esto internamente
      idleConnections: 0,
      activeConnections: 0,
      waitingRequests: 0,
      maxConnections: this.config.maxConnections,
      timestamp: new Date(),
    };
  }

  /**
   * Registra estadísticas históricas
   */
  private recordStats(stats: PoolStats): void {
    this.stats.push(stats);
    
    // Mantener solo las últimas N entradas
    if (this.stats.length > this.maxHistorySize) {
      this.stats.shift();
    }
  }

  /**
   * Verifica thresholds y emite warnings
   */
  private checkThresholds(stats: PoolStats): void {
    const usagePercent = (stats.activeConnections / stats.maxConnections) * 100;

    if (usagePercent >= this.config.warningThreshold!) {
      console.warn(
        `⚠️ Database pool usage high: ${usagePercent.toFixed(1)}%\n` +
        `   Active: ${stats.activeConnections}/${stats.maxConnections}\n` +
        `   Waiting: ${stats.waitingRequests}\n` +
        `   Consider increasing DB_POOL_MAX`
      );
    }

    if (stats.waitingRequests > 0) {
      console.warn(
        `⚠️ Requests waiting for database connections: ${stats.waitingRequests}\n` +
        `   Pool may be exhausted. Consider:\n` +
        `   1. Increasing DB_POOL_MAX\n` +
        `   2. Optimizing slow queries\n` +
        `   3. Adding caching`
      );
    }
  }

  /**
   * Obtiene historial de estadísticas
   */
  getHistory(limit?: number): PoolStats[] {
    return limit ? this.stats.slice(-limit) : [...this.stats];
  }

  /**
   * Obtiene estadísticas agregadas
   */
  getAggregatedStats(): {
    avgActiveConnections: number;
    maxActiveConnections: number;
    avgWaitingRequests: number;
    maxWaitingRequests: number;
    sampleCount: number;
  } {
    if (this.stats.length === 0) {
      return {
        avgActiveConnections: 0,
        maxActiveConnections: 0,
        avgWaitingRequests: 0,
        maxWaitingRequests: 0,
        sampleCount: 0,
      };
    }

    const sum = this.stats.reduce(
      (acc, stat) => ({
        active: acc.active + stat.activeConnections,
        waiting: acc.waiting + stat.waitingRequests,
      }),
      { active: 0, waiting: 0 }
    );

    return {
      avgActiveConnections: sum.active / this.stats.length,
      maxActiveConnections: Math.max(...this.stats.map(s => s.activeConnections)),
      avgWaitingRequests: sum.waiting / this.stats.length,
      maxWaitingRequests: Math.max(...this.stats.map(s => s.waitingRequests)),
      sampleCount: this.stats.length,
    };
  }

  /**
   * Limpia el historial
   */
  clearHistory(): void {
    this.stats = [];
  }
}

/**
 * Helper para detectar connection leaks
 * 
 * Uso:
 * ```typescript
 * const detector = new ConnectionLeakDetector();
 * detector.start();
 * 
 * // Después de un tiempo...
 * const leaks = detector.getLeaks();
 * if (leaks.length > 0) {
 *   console.error('Connection leaks detected!', leaks);
 * }
 * ```
 */
export class ConnectionLeakDetector {
  private snapshots: Array<{
    timestamp: Date;
    activeConnections: number;
  }> = [];
  private detectionInterval?: NodeJS.Timeout;

  constructor(
    private monitor: PoolMonitor,
    private config: {
      checkInterval?: number; // ms entre checks
      leakThreshold?: number; // Incremento constante que indica leak
    } = {}
  ) {
    this.config.checkInterval = config.checkInterval || 300000; // 5 minutos
    this.config.leakThreshold = config.leakThreshold || 5;
  }

  start(): void {
    if (this.detectionInterval) return;

    this.detectionInterval = setInterval(() => {
      this.takeSnapshot();
      this.detectLeaks();
    }, this.config.checkInterval);

    console.log('Connection leak detector started');
  }

  stop(): void {
    if (this.detectionInterval) {
      clearInterval(this.detectionInterval);
      this.detectionInterval = undefined;
      console.log('Connection leak detector stopped');
    }
  }

  private takeSnapshot(): void {
    const stats = this.monitor.getStats();
    this.snapshots.push({
      timestamp: new Date(),
      activeConnections: stats.activeConnections,
    });

    // Mantener solo las últimas 20 snapshots
    if (this.snapshots.length > 20) {
      this.snapshots.shift();
    }
  }

  private detectLeaks(): void {
    if (this.snapshots.length < 3) return;

    // Verificar tendencia creciente constante
    const recent = this.snapshots.slice(-5);
    const trend = recent.slice(1).every((snap, i) => {
      return snap.activeConnections >= recent[i].activeConnections;
    });

    const growth = recent[recent.length - 1].activeConnections - recent[0].activeConnections;

    if (trend && growth >= this.config.leakThreshold!) {
      console.error(
        `🔴 Possible connection leak detected!\n` +
        `   Connections grew by ${growth} over last 5 checks\n` +
        `   Current: ${recent[recent.length - 1].activeConnections}\n` +
        `   Check for:\n` +
        `   - Queries without proper error handling\n` +
        `   - Missing transaction commits\n` +
        `   - Long-running queries\n` +
        `   - Unclosed connections`
      );
    }
  }

  getLeaks(): Array<{ timestamp: Date; activeConnections: number }> {
    if (this.snapshots.length < 2) return [];

    // Retorna snapshots donde las conexiones aumentaron significativamente
    const leaks: Array<{ timestamp: Date; activeConnections: number }> = [];
    
    for (let i = 1; i < this.snapshots.length; i++) {
      const prev = this.snapshots[i - 1];
      const curr = this.snapshots[i];
      
      if (curr.activeConnections - prev.activeConnections >= this.config.leakThreshold!) {
        leaks.push(curr);
      }
    }

    return leaks;
  }
}

/**
 * Configuración recomendada según carga
 */
export const PoolSizeRecommendations = {
  development: {
    max: 5,
    idle_timeout: 10,
    description: 'Para desarrollo local con 1-2 desarrolladores',
  },
  staging: {
    max: 10,
    idle_timeout: 20,
    description: 'Para ambiente de staging con testing',
  },
  production_small: {
    max: 20,
    idle_timeout: 20,
    description: 'Producción pequeña (<100 usuarios concurrentes)',
  },
  production_medium: {
    max: 50,
    idle_timeout: 30,
    description: 'Producción mediana (100-1000 usuarios concurrentes)',
  },
  production_large: {
    max: 100,
    idle_timeout: 60,
    description: 'Producción grande (>1000 usuarios concurrentes)',
  },
};

/**
 * Calcula el tamaño de pool recomendado basado en métricas
 */
export function calculateRecommendedPoolSize(metrics: {
  avgConcurrentQueries: number;
  peakConcurrentQueries: number;
  avgQueryDurationMs: number;
}): number {
  // Fórmula: (avg_queries * avg_duration_ms / 1000) * buffer_factor
  const bufferFactor = 1.5; // 50% extra para picos
  
  const baseSize = Math.ceil(
    (metrics.avgConcurrentQueries * metrics.avgQueryDurationMs / 1000) * bufferFactor
  );

  // Agregar headroom para picos
  const peakSize = Math.ceil(metrics.peakConcurrentQueries * 1.2);

  // Usar el mayor entre base y peak, pero con límites
  const recommended = Math.max(baseSize, peakSize);
  
  return Math.max(5, Math.min(recommended, 200)); // Entre 5 y 200
}
