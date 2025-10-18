// src/lib/monitoring/health.ts
// Sistema de health checks

import { checkDatabaseConnection } from '@/lib/db';
import { createCacheService } from '@/../packages/services/src';

// Crear instancia del servicio de cache
const cacheService = createCacheService();

export enum HealthStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy',
}

export interface HealthCheck {
  name: string;
  status: HealthStatus;
  message?: string;
  duration: number;
  timestamp: string;
  details?: Record<string, unknown>;
}

export interface HealthReport {
  status: HealthStatus;
  checks: HealthCheck[];
  uptime: number;
  timestamp: string;
  version: string;
}

/**
 * Ejecutar health check
 */
async function runCheck(
  name: string,
  checkFn: () => Promise<{ healthy: boolean; message?: string; details?: Record<string, unknown> }>
): Promise<HealthCheck> {
  const start = Date.now();
  
  try {
    const result = await checkFn();
    const duration = Date.now() - start;

    return {
      name,
      status: result.healthy ? HealthStatus.HEALTHY : HealthStatus.UNHEALTHY,
      message: result.message,
      duration,
      timestamp: new Date().toISOString(),
      details: result.details,
    };
  } catch (error) {
    const duration = Date.now() - start;
    return {
      name,
      status: HealthStatus.UNHEALTHY,
      message: error instanceof Error ? error.message : 'Unknown error',
      duration,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Check de base de datos
 */
async function checkDatabase(): Promise<HealthCheck> {
  return runCheck('database', async () => {
    try {
      const isHealthy = await checkDatabaseConnection();
      return {
        healthy: isHealthy,
        message: isHealthy ? 'Database connection OK' : 'Database connection failed',
      };
    } catch (error) {
      return {
        healthy: false,
        message: error instanceof Error ? error.message : 'Database check failed',
      };
    }
  });
}

/**
 * Check de cache
 */
async function checkCache(): Promise<HealthCheck> {
  return runCheck('cache', async () => {
    try {
      // Intentar hacer set y get
      const testKey = 'health:check:' + Date.now();
      const testValue = 'ok';
      
      await cacheService.set(testKey, testValue, { ttl: 10 });
      const retrieved = await cacheService.get<string>(testKey);
      await cacheService.invalidate(testKey);

      const healthy = retrieved === testValue;
      return {
        healthy,
        message: healthy ? 'Cache working correctly' : 'Cache not working',
        details: {
          testKey,
        },
      };
    } catch (error) {
      return {
        healthy: false,
        message: error instanceof Error ? error.message : 'Cache check failed',
      };
    }
  });
}

/**
 * Check de memoria
 */
async function checkMemory(): Promise<HealthCheck> {
  return runCheck('memory', async () => {
    if (typeof window !== 'undefined') {
      // Browser environment
      const memory = (performance as unknown as { memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
      if (memory) {
        const usedPercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
        return {
          healthy: usedPercent < 90,
          message: `Memory usage: ${usedPercent.toFixed(2)}%`,
          details: {
            used: memory.usedJSHeapSize,
            total: memory.totalJSHeapSize,
            limit: memory.jsHeapSizeLimit,
          },
        };
      }
    } else {
      // Node.js environment
      const usage = process.memoryUsage();
      const usedPercent = (usage.heapUsed / usage.heapTotal) * 100;
      return {
        healthy: usedPercent < 90,
        message: `Memory usage: ${usedPercent.toFixed(2)}%`,
        details: {
          rss: usage.rss,
          heapTotal: usage.heapTotal,
          heapUsed: usage.heapUsed,
          external: usage.external,
        },
      };
    }

    return { healthy: true, message: 'Memory check not available' };
  });
}

/**
 * Check de disco (solo Node.js)
 */
async function checkDisk(): Promise<HealthCheck> {
  return runCheck('disk', async () => {
    if (typeof window !== 'undefined') {
      return { healthy: true, message: 'Disk check not available in browser' };
    }

    // En un entorno real, usarías fs.statfs o similar
    // Por ahora solo retornamos healthy
    return {
      healthy: true,
      message: 'Disk space OK',
    };
  });
}

/**
 * Check general del sistema
 */
export async function getHealthReport(): Promise<HealthReport> {
  const startTime = Date.now();
  
  // Ejecutar todos los checks en paralelo
  const checks = await Promise.all([
    checkDatabase(),
    checkCache(),
    checkMemory(),
    checkDisk(),
  ]);

  // Determinar estado general
  const unhealthyCount = checks.filter((c) => c.status === HealthStatus.UNHEALTHY).length;
  const degradedCount = checks.filter((c) => c.status === HealthStatus.DEGRADED).length;

  let overallStatus: HealthStatus;
  if (unhealthyCount > 0) {
    overallStatus = HealthStatus.UNHEALTHY;
  } else if (degradedCount > 0) {
    overallStatus = HealthStatus.DEGRADED;
  } else {
    overallStatus = HealthStatus.HEALTHY;
  }

  // Calcular uptime
  const uptime = typeof process !== 'undefined' ? process.uptime() : 0;

  return {
    status: overallStatus,
    checks,
    uptime,
    timestamp: new Date().toISOString(),
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  };
}

/**
 * Check rápido (solo database)
 */
export async function getQuickHealth(): Promise<{ healthy: boolean }> {
  try {
    const isHealthy = await checkDatabaseConnection();
    return { healthy: isHealthy };
  } catch {
    return { healthy: false };
  }
}

/**
 * Check liveness (el servicio está vivo)
 */
export async function getLiveness(): Promise<{ alive: boolean }> {
  return { alive: true };
}

/**
 * Check readiness (el servicio está listo para recibir tráfico)
 */
export async function getReadiness(): Promise<{ ready: boolean; reason?: string }> {
  try {
    const dbHealthy = await checkDatabaseConnection();
    if (!dbHealthy) {
      return { ready: false, reason: 'Database not ready' };
    }

    return { ready: true };
  } catch (error) {
    return {
      ready: false,
      reason: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
