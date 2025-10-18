// packages/services/src/common/batch-operations.ts
// Propósito: Utilidades para operaciones en lote optimizadas

import type { DrizzleClient } from './types';

/**
 * Batch loader para evitar N+1 queries
 * 
 * Ejemplo de problema N+1:
 * ```typescript
 * for (const order of orders) {
 *   // Esto hace 1 query por order (N queries)
 *   const items = await getOrderItems(order.id);
 * }
 * ```
 * 
 * Con BatchLoader:
 * ```typescript
 * const loader = new BatchLoader(async (orderIds) => {
 *   // Esto hace 1 query para todos los orders
 *   return await getOrderItemsByIds(orderIds);
 * });
 * 
 * const results = await Promise.all(
 *   orders.map(order => loader.load(order.id))
 * );
 * ```
 */
export class BatchLoader<K, V> {
  private queue: Map<K, Array<(value: V | null) => void>> = new Map();
  private cache: Map<K, V | null> = new Map();
  private batchScheduled = false;

  constructor(
    private batchFn: (keys: K[]) => Promise<Map<K, V>>,
    private batchDelayMs = 10
  ) {}

  /**
   * Carga un valor por su key
   * Automáticamente agrupa requests en batches
   */
  async load(key: K): Promise<V | null> {
    // Check cache first
    if (this.cache.has(key)) {
      return this.cache.get(key) || null;
    }

    // Add to queue
    return new Promise<V | null>((resolve) => {
      if (!this.queue.has(key)) {
        this.queue.set(key, []);
      }
      this.queue.get(key)!.push(resolve);

      // Schedule batch if not already scheduled
      if (!this.batchScheduled) {
        this.batchScheduled = true;
        setTimeout(() => this.executeBatch(), this.batchDelayMs);
      }
    });
  }

  /**
   * Carga múltiples valores
   */
  async loadMany(keys: K[]): Promise<Array<V | null>> {
    return Promise.all(keys.map(key => this.load(key)));
  }

  /**
   * Limpia el caché
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Limpia un key específico del caché
   */
  clearKey(key: K): void {
    this.cache.delete(key);
  }

  private async executeBatch(): Promise<void> {
    this.batchScheduled = false;
    
    const currentQueue = new Map(this.queue);
    this.queue.clear();

    if (currentQueue.size === 0) return;

    const keys = Array.from(currentQueue.keys());
    
    try {
      // Execute batch function
      const results = await this.batchFn(keys);

      // Resolve all promises
      for (const [key, callbacks] of currentQueue.entries()) {
        const value = results.get(key) || null;
        this.cache.set(key, value);
        callbacks.forEach(callback => callback(value));
      }
    } catch (error) {
      console.error('Batch execution error:', error);
      // Resolve all promises with null on error
      for (const callbacks of currentQueue.values()) {
        callbacks.forEach(callback => callback(null));
      }
    }
  }
}

/**
 * Divide un array en chunks para procesamiento por lotes
 */
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Ejecuta operaciones en lote con límite de concurrencia
 * 
 * Ejemplo:
 * ```typescript
 * await batchExecute(
 *   productIds,
 *   async (ids) => await updateProducts(ids),
 *   { batchSize: 100, concurrency: 5 }
 * );
 * ```
 */
export async function batchExecute<T, R>(
  items: T[],
  fn: (batch: T[]) => Promise<R>,
  options: {
    batchSize?: number;
    concurrency?: number;
    onBatchComplete?: (result: R, batchIndex: number) => void;
  } = {}
): Promise<R[]> {
  const {
    batchSize = 100,
    concurrency = 5,
    onBatchComplete,
  } = options;

  const batches = chunk(items, batchSize);
  const results: R[] = [];

  // Process batches with limited concurrency
  for (let i = 0; i < batches.length; i += concurrency) {
    const batchPromises = batches
      .slice(i, i + concurrency)
      .map((batch, index) => 
        fn(batch).then(result => {
          if (onBatchComplete) {
            onBatchComplete(result, i + index);
          }
          return result;
        })
      );

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }

  return results;
}

/**
 * Helper para crear batch loaders comunes
 * 
 * Nota: Estos son ejemplos genéricos. En producción, implementa
 * loaders específicos con tipos correctos para tu schema.
 */
export function createBatchLoader<K, V>(
  fetchFn: (keys: K[]) => Promise<Map<K, V>>,
  options: { delayMs?: number } = {}
): BatchLoader<K, V> {
  return new BatchLoader(fetchFn, options.delayMs);
}

/**
 * Optimiza múltiples queries en una sola transacción
 * 
 * Ejemplo:
 * ```typescript
 * await withTransaction(db, async (tx) => {
 *   await tx.insert(products).values(newProduct);
 *   await tx.update(categories).set({ productCount: count + 1 });
 *   return result;
 * });
 * ```
 */
export async function withTransaction<T>(
  db: DrizzleClient,
  fn: (tx: DrizzleClient) => Promise<T>
): Promise<T> {
  return await db.transaction(fn);
}

/**
 * Agrupa queries relacionados para ejecutar en paralelo
 * 
 * Ejemplo:
 * ```typescript
 * const [products, categories, reviews] = await parallelQueries([
 *   () => getProducts(),
 *   () => getCategories(),
 *   () => getReviews(),
 * ]);
 * ```
 */
export async function parallelQueries<T extends unknown[]>(
  queries: Array<() => Promise<T[number]>>
): Promise<T> {
  return Promise.all(queries.map(q => q())) as Promise<T>;
}

/**
 * Cache de queries con expiración automática
 */
export class QueryCache<K extends string, V> {
  private cache = new Map<K, { value: V; expiry: number }>();
  private cleanupInterval: NodeJS.Timeout;

  constructor(private defaultTTL: number = 60000) {
    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  get(key: K): V | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  set(key: K, value: V, ttl?: number): void {
    const expiry = Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, { value, expiry });
  }

  delete(key: K): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.cache.delete(key);
      }
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.clear();
  }
}
