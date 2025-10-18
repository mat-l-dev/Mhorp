// src/lib/monitoring/error-tracker.ts
// Sistema de tracking y reporting de errores

import { logger } from './logger';
import { metrics, MetricNames } from './metrics';

export interface ErrorReport {
  id: string;
  message: string;
  stack?: string;
  context?: Record<string, unknown>;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  fingerprint: string;
  count: number;
}

class ErrorTracker {
  private errors: Map<string, ErrorReport> = new Map();
  private maxErrors = 1000;

  /**
   * Capturar y trackear error
   */
  captureError(
    error: Error,
    context?: Record<string, unknown>,
    severity: ErrorReport['severity'] = 'medium'
  ): string {
    const fingerprint = this.generateFingerprint(error);
    const id = crypto.randomUUID();

    // Incrementar métrica de errores
    metrics.increment(MetricNames.ERRORS_TOTAL, 1, {
      type: error.name,
      severity,
    });

    // Buscar si ya existe este error
    const existing = this.errors.get(fingerprint);
    
    if (existing) {
      // Actualizar contador
      existing.count++;
      existing.timestamp = new Date().toISOString();
      existing.context = { ...existing.context, ...context };
      
      // Log solo si es crítico o cada 10 ocurrencias
      if (severity === 'critical' || existing.count % 10 === 0) {
        logger.error(`Recurring error (${existing.count}x): ${error.message}`, error, {
          ...context,
          fingerprint,
          count: existing.count,
        });
      }
      
      return existing.id;
    }

    // Nuevo error
    const report: ErrorReport = {
      id,
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      severity,
      fingerprint,
      count: 1,
    };

    this.errors.set(fingerprint, report);

    // Limpiar errores antiguos si hay demasiados
    if (this.errors.size > this.maxErrors) {
      const oldestKey = this.errors.keys().next().value;
      if (oldestKey) {
        this.errors.delete(oldestKey);
      }
    }

    // Log del error
    logger.error(error.message, error, {
      ...context,
      fingerprint,
      severity,
    });

    // Si es crítico, enviar alerta
    if (severity === 'critical') {
      this.sendAlert(report);
    }

    return id;
  }

  /**
   * Capturar error de validación
   */
  captureValidationError(
    field: string,
    message: string,
    context?: Record<string, unknown>
  ): void {
    metrics.increment(MetricNames.VALIDATION_ERRORS, 1, { field });
    
    logger.warn(`Validation error: ${field} - ${message}`, {
      ...context,
      field,
    });
  }

  /**
   * Capturar error de autenticación
   */
  captureAuthError(
    type: 'login' | 'register' | 'token' | 'permission',
    message: string,
    context?: Record<string, unknown>
  ): void {
    metrics.increment(MetricNames.AUTH_ERRORS, 1, { type });
    
    logger.warn(`Auth error [${type}]: ${message}`, {
      ...context,
      type,
    });
  }

  /**
   * Obtener reporte de errores
   */
  getErrorReport(): ErrorReport[] {
    return Array.from(this.errors.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 100); // Top 100 errores
  }

  /**
   * Obtener error por fingerprint
   */
  getError(fingerprint: string): ErrorReport | undefined {
    return this.errors.get(fingerprint);
  }

  /**
   * Limpiar errores antiguos
   */
  cleanup(olderThan: number = 24 * 60 * 60 * 1000): void {
    const now = Date.now();
    
    for (const [fingerprint, error] of this.errors) {
      const errorTime = new Date(error.timestamp).getTime();
      if (now - errorTime > olderThan) {
        this.errors.delete(fingerprint);
      }
    }
  }

  /**
   * Generar fingerprint único para el error
   */
  private generateFingerprint(error: Error): string {
    // Usar nombre + primera línea del stack como fingerprint
    const stackLine = error.stack?.split('\n')[1]?.trim() || '';
    const fingerprint = `${error.name}:${error.message}:${stackLine}`;
    
    // Hash simple
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return Math.abs(hash).toString(36);
  }

  /**
   * Enviar alerta para error crítico
   */
  private sendAlert(error: ErrorReport): void {
    // TODO: Integrar con servicio de alertas (email, Slack, PagerDuty, etc.)
    logger.fatal(`CRITICAL ERROR: ${error.message}`, undefined, {
      errorId: error.id,
      fingerprint: error.fingerprint,
      context: error.context,
    });

    // En producción, aquí se enviaría a:
    // - Sentry
    // - Datadog
    // - New Relic
    // - Email/Slack para on-call
  }
}

/**
 * Instancia global del error tracker
 */
export const errorTracker = new ErrorTracker();

/**
 * Error boundary helper para React
 */
export function captureReactError(
  error: Error,
  errorInfo: { componentStack: string }
): void {
  errorTracker.captureError(error, {
    componentStack: errorInfo.componentStack,
    type: 'react',
  }, 'high');
}

/**
 * Helper para async/await error handling
 */
export async function withErrorTracking<T>(
  fn: () => Promise<T>,
  context?: Record<string, unknown>
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof Error) {
      errorTracker.captureError(error, context);
    }
    throw error;
  }
}

/**
 * Decorator para métodos
 */
export function TrackErrors(severity: ErrorReport['severity'] = 'medium') {
  return function (
    target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      try {
        return await originalMethod.apply(this, args);
      } catch (error) {
        if (error instanceof Error) {
          errorTracker.captureError(error, {
            method: propertyKey,
            args,
          }, severity);
        }
        throw error;
      }
    };

    return descriptor;
  };
}
