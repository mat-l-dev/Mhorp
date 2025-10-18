import { kv } from '@vercel/kv';

/**
 * Utilidad de caché con Vercel KV (Redis)
 * Usado para cachear queries pesadas y mejorar performance
 */

export interface CacheOptions {
  ttl?: number; // Time to live en segundos (default: 5 minutos)
  tags?: string[]; // Tags para invalidación grupal
}

/**
 * Obtiene un valor del caché o lo genera si no existe
 * @param key - Clave única del caché
 * @param fetcher - Función que obtiene los datos si no están en caché
 * @param options - Opciones de caché (TTL, tags)
 */
export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const { ttl = 300, tags = [] } = options; // Default: 5 minutos

  try {
    // Intentar obtener del caché
    const cached = await kv.get<T>(key);

    if (cached !== null) {
      console.log(`[CACHE HIT] ${key}`);
      return cached;
    }

    console.log(`[CACHE MISS] ${key}`);

    // No está en caché, obtener datos frescos
    const data = await fetcher();

    // Guardar en caché con TTL
    await kv.set(key, data, { ex: ttl });

    // Si hay tags, guardarlos para invalidación grupal
    if (tags.length > 0) {
      for (const tag of tags) {
        await kv.sadd(`tag:${tag}`, key);
      }
    }

    return data;
  } catch (error) {
    console.error('[CACHE ERROR]', error);
    // Si falla el caché, retornar datos frescos
    return fetcher();
  }
}

/**
 * Invalida una clave específica del caché
 */
export async function invalidateCache(key: string): Promise<void> {
  try {
    await kv.del(key);
    console.log(`[CACHE INVALIDATED] ${key}`);
  } catch (error) {
    console.error('[CACHE INVALIDATION ERROR]', error);
  }
}

/**
 * Invalida todas las claves con un tag específico
 */
export async function invalidateCacheByTag(tag: string): Promise<void> {
  try {
    const keys = await kv.smembers(`tag:${tag}`);
    
    if (keys && Array.isArray(keys) && keys.length > 0) {
      await Promise.all([
        ...keys.map((key: string) => kv.del(key)),
        kv.del(`tag:${tag}`),
      ]);
      console.log(`[CACHE INVALIDATED BY TAG] ${tag} (${keys.length} keys)`);
    }
  } catch (error) {
    console.error('[CACHE TAG INVALIDATION ERROR]', error);
  }
}

/**
 * Invalida múltiples claves en batch
 */
export async function invalidateMultiple(keys: string[]): Promise<void> {
  try {
    if (keys.length > 0) {
      await kv.del(...keys);
      console.log(`[CACHE INVALIDATED] ${keys.length} keys`);
    }
  } catch (error) {
    console.error('[CACHE BATCH INVALIDATION ERROR]', error);
  }
}

/**
 * Limpia todo el caché (usar con precaución)
 */
export async function clearAllCache(): Promise<void> {
  try {
    await kv.flushdb();
    console.log('[CACHE] All cache cleared');
  } catch (error) {
    console.error('[CACHE CLEAR ERROR]', error);
  }
}

/**
 * Obtiene estadísticas del caché
 */
export async function getCacheStats(): Promise<{
  keys: number;
  memory: string;
}> {
  try {
    const keys = await kv.dbsize();
    // Note: Vercel KV no expone info de memoria directamente
    return {
      keys,
      memory: 'N/A (Managed by Vercel)',
    };
  } catch (error) {
    console.error('[CACHE STATS ERROR]', error);
    return { keys: 0, memory: 'Error' };
  }
}

/**
 * Wrapper de caché específico para analytics
 */
export const analyticsCache = {
  /**
   * Cachea métricas generales del dashboard
   */
  metrics: async <T,>(fetcher: () => Promise<T>) =>
    getCached('analytics:metrics', fetcher, {
      ttl: 300, // 5 minutos
      tags: ['analytics', 'metrics'],
    }),

  /**
   * Cachea productos top
   */
  topProducts: async <T,>(type: string, fetcher: () => Promise<T>) =>
    getCached(`analytics:top-products:${type}`, fetcher, {
      ttl: 600, // 10 minutos
      tags: ['analytics', 'products'],
    }),

  /**
   * Cachea ventas recientes
   */
  recentSales: async <T,>(days: number, fetcher: () => Promise<T>) =>
    getCached(`analytics:sales:${days}days`, fetcher, {
      ttl: 300, // 5 minutos
      tags: ['analytics', 'sales'],
    }),

  /**
   * Invalida todo el caché de analytics
   */
  invalidateAll: async () => {
    await invalidateCacheByTag('analytics');
  },
};

/**
 * Helper para generar claves de caché consistentes
 */
export function cacheKey(...parts: (string | number)[]): string {
  return parts.join(':');
}
