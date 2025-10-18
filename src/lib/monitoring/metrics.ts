// src/lib/monitoring/metrics.ts
// Sistema de métricas de rendimiento

/**
 * Tipos de métricas
 */
export enum MetricType {
  COUNTER = 'counter',
  GAUGE = 'gauge',
  HISTOGRAM = 'histogram',
  TIMER = 'timer',
}

/**
 * Métrica base
 */
export interface Metric {
  name: string;
  type: MetricType;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
}

/**
 * Estadísticas de rendimiento
 */
export interface PerformanceStats {
  count: number;
  sum: number;
  min: number;
  max: number;
  avg: number;
  p50: number;
  p95: number;
  p99: number;
}

/**
 * Clase para almacenar y calcular métricas
 */
class MetricsCollector {
  private metrics: Map<string, number[]> = new Map();
  private counters: Map<string, number> = new Map();
  private gauges: Map<string, number> = new Map();

  /**
   * Incrementar contador
   */
  increment(name: string, value: number = 1, tags?: Record<string, string>): void {
    const key = this.getKey(name, tags);
    const current = this.counters.get(key) || 0;
    this.counters.set(key, current + value);
  }

  /**
   * Decrementar contador
   */
  decrement(name: string, value: number = 1, tags?: Record<string, string>): void {
    this.increment(name, -value, tags);
  }

  /**
   * Establecer gauge (valor absoluto)
   */
  gauge(name: string, value: number, tags?: Record<string, string>): void {
    const key = this.getKey(name, tags);
    this.gauges.set(key, value);
  }

  /**
   * Registrar valor en histograma
   */
  histogram(name: string, value: number, tags?: Record<string, string>): void {
    const key = this.getKey(name, tags);
    const values = this.metrics.get(key) || [];
    values.push(value);
    this.metrics.set(key, values);

    // Mantener solo últimos 1000 valores
    if (values.length > 1000) {
      values.shift();
    }
  }

  /**
   * Medir tiempo de ejecución
   */
  timer(name: string, tags?: Record<string, string>): () => void {
    const start = Date.now();
    return () => {
      const duration = Date.now() - start;
      this.histogram(name, duration, tags);
    };
  }

  /**
   * Obtener estadísticas de un histograma
   */
  getStats(name: string, tags?: Record<string, string>): PerformanceStats | null {
    const key = this.getKey(name, tags);
    const values = this.metrics.get(key);

    if (!values || values.length === 0) {
      return null;
    }

    const sorted = [...values].sort((a, b) => a - b);
    const count = sorted.length;
    const sum = sorted.reduce((a, b) => a + b, 0);

    return {
      count,
      sum,
      min: sorted[0],
      max: sorted[count - 1],
      avg: sum / count,
      p50: this.percentile(sorted, 0.5),
      p95: this.percentile(sorted, 0.95),
      p99: this.percentile(sorted, 0.99),
    };
  }

  /**
   * Obtener valor de contador
   */
  getCounter(name: string, tags?: Record<string, string>): number {
    const key = this.getKey(name, tags);
    return this.counters.get(key) || 0;
  }

  /**
   * Obtener valor de gauge
   */
  getGauge(name: string, tags?: Record<string, string>): number | undefined {
    const key = this.getKey(name, tags);
    return this.gauges.get(key);
  }

  /**
   * Obtener todas las métricas
   */
  getAllMetrics(): {
    counters: Map<string, number>;
    gauges: Map<string, number>;
    histograms: Map<string, PerformanceStats | null>;
  } {
    const histograms = new Map<string, PerformanceStats | null>();
    
    for (const [key] of this.metrics) {
      const stats = this.getStats(key);
      histograms.set(key, stats);
    }

    return {
      counters: new Map(this.counters),
      gauges: new Map(this.gauges),
      histograms,
    };
  }

  /**
   * Resetear métricas
   */
  reset(): void {
    this.metrics.clear();
    this.counters.clear();
    this.gauges.clear();
  }

  /**
   * Calcular percentil
   */
  private percentile(sorted: number[], p: number): number {
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Generar clave con tags
   */
  private getKey(name: string, tags?: Record<string, string>): string {
    if (!tags || Object.keys(tags).length === 0) {
      return name;
    }

    const tagString = Object.entries(tags)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}`)
      .join(',');

    return `${name}{${tagString}}`;
  }
}

/**
 * Instancia global de métricas
 */
export const metrics = new MetricsCollector();

/**
 * Métricas predefinidas para el e-commerce
 */
export const MetricNames = {
  // HTTP
  HTTP_REQUESTS_TOTAL: 'http.requests.total',
  HTTP_REQUEST_DURATION: 'http.request.duration',
  HTTP_ERRORS_TOTAL: 'http.errors.total',

  // Database
  DB_QUERIES_TOTAL: 'db.queries.total',
  DB_QUERY_DURATION: 'db.query.duration',
  DB_ERRORS_TOTAL: 'db.errors.total',
  DB_CONNECTIONS_ACTIVE: 'db.connections.active',
  DB_CONNECTIONS_IDLE: 'db.connections.idle',

  // Cache
  CACHE_HITS_TOTAL: 'cache.hits.total',
  CACHE_MISSES_TOTAL: 'cache.misses.total',
  CACHE_HIT_RATE: 'cache.hit.rate',
  CACHE_OPERATION_DURATION: 'cache.operation.duration',

  // Business
  ORDERS_CREATED_TOTAL: 'orders.created.total',
  ORDERS_COMPLETED_TOTAL: 'orders.completed.total',
  REVENUE_TOTAL: 'revenue.total',
  CART_ITEMS_ADDED: 'cart.items.added',
  PRODUCTS_VIEWED: 'products.viewed',
  
  // Errors
  ERRORS_TOTAL: 'errors.total',
  VALIDATION_ERRORS: 'errors.validation',
  AUTH_ERRORS: 'errors.auth',
  
  // Performance
  PAGE_LOAD_TIME: 'page.load.time',
  API_RESPONSE_TIME: 'api.response.time',
  IMAGE_LOAD_TIME: 'image.load.time',
} as const;

/**
 * Helper para medir tiempo de función
 */
export function measureTime<T>(
  metricName: string,
  fn: () => T | Promise<T>,
  tags?: Record<string, string>
): Promise<T> {
  const timer = metrics.timer(metricName, tags);
  const result = fn();

  if (result instanceof Promise) {
    return result.finally(() => timer());
  }

  timer();
  return Promise.resolve(result);
}

/**
 * Decorator para medir tiempo de métodos
 */
export function Measure(metricName: string, tags?: Record<string, string>) {
  return function (
    target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      const timer = metrics.timer(metricName, {
        ...tags,
        method: propertyKey,
      });

      try {
        const result = await originalMethod.apply(this, args);
        timer();
        return result;
      } catch (error) {
        timer();
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Exportar métricas en formato Prometheus
 */
export function exportPrometheusMetrics(): string {
  const allMetrics = metrics.getAllMetrics();
  const lines: string[] = [];

  // Counters
  for (const [key, value] of allMetrics.counters) {
    lines.push(`# TYPE ${key} counter`);
    lines.push(`${key} ${value}`);
  }

  // Gauges
  for (const [key, value] of allMetrics.gauges) {
    lines.push(`# TYPE ${key} gauge`);
    lines.push(`${key} ${value}`);
  }

  // Histograms
  for (const [key, stats] of allMetrics.histograms) {
    if (!stats) continue;

    lines.push(`# TYPE ${key} histogram`);
    lines.push(`${key}_count ${stats.count}`);
    lines.push(`${key}_sum ${stats.sum}`);
    lines.push(`${key}_min ${stats.min}`);
    lines.push(`${key}_max ${stats.max}`);
    lines.push(`${key}_avg ${stats.avg}`);
    lines.push(`${key}{quantile="0.5"} ${stats.p50}`);
    lines.push(`${key}{quantile="0.95"} ${stats.p95}`);
    lines.push(`${key}{quantile="0.99"} ${stats.p99}`);
  }

  return lines.join('\n');
}
