// packages/services/src/cache/index.ts
// Propósito: Exportaciones del módulo de caché

export {
  CacheService,
  createCacheService,
  MemoryCacheClient,
  type CacheClient,
  type CacheOptions,
} from './cache.service';

export { RedisCacheClient, createRedisClient } from './redis-client';

// Re-exportar para conveniencia
export type { CacheClient as ICacheClient } from './cache.service';
