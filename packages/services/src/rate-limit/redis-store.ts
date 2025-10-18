// packages/services/src/rate-limit/redis-store.ts
// Propósito: Redis storage para rate limiting con fallback a memoria

import type { RateLimitStore } from './rate-limiter';

/**
 * Redis-backed rate limit store
 * 
 * Ventajas sobre memoria:
 * - Compartido entre múltiples instancias
 * - Persiste durante redeploys
 * - Mejor para aplicaciones escaladas horizontalmente
 * 
 * Uso:
 * ```typescript
 * const store = createRedisRateLimitStore('redis://localhost:6379');
 * const limiter = new RateLimiter(config, store);
 * ```
 */
export class RedisRateLimitStore implements RateLimitStore {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private client: any;
  private connected: boolean = false;

  constructor(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    redisClient: any,
    private prefix: string = 'ratelimit:'
  ) {
    this.client = redisClient;
    this.connected = true;
  }

  async increment(key: string): Promise<{ count: number; resetTime: Date }> {
    const fullKey = this.prefix + key;
    
    try {
      // Usar Redis MULTI para operación atómica
      const multi = this.client.multi();
      
      // Incrementar contador
      multi.incr(fullKey);
      
      // Obtener TTL
      multi.ttl(fullKey);
      
      const results = await multi.exec();
      const count = results[0];
      const ttl = results[1];

      // Si es el primer request, establecer TTL
      if (count === 1 || ttl === -1) {
        await this.client.expire(fullKey, 60); // 60 segundos por defecto
      }

      const resetTime = new Date(Date.now() + (ttl > 0 ? ttl * 1000 : 60000));

      return { count, resetTime };
    } catch (error) {
      console.error('Redis rate limit increment error:', error);
      // Fallback: retornar valores que permitan el request
      return { count: 1, resetTime: new Date(Date.now() + 60000) };
    }
  }

  async decrement(key: string): Promise<void> {
    const fullKey = this.prefix + key;
    
    try {
      const current = await this.client.get(fullKey);
      if (current && parseInt(current) > 0) {
        await this.client.decr(fullKey);
      }
    } catch (error) {
      console.error('Redis rate limit decrement error:', error);
    }
  }

  async reset(key: string): Promise<void> {
    const fullKey = this.prefix + key;
    
    try {
      await this.client.del(fullKey);
    } catch (error) {
      console.error('Redis rate limit reset error:', error);
    }
  }

  async get(key: string): Promise<{ count: number; resetTime: Date } | null> {
    const fullKey = this.prefix + key;
    
    try {
      const multi = this.client.multi();
      multi.get(fullKey);
      multi.ttl(fullKey);
      
      const results = await multi.exec();
      const count = results[0];
      const ttl = results[1];

      if (!count || count === null) {
        return null;
      }

      const resetTime = new Date(Date.now() + (ttl > 0 ? ttl * 1000 : 60000));

      return {
        count: parseInt(count),
        resetTime,
      };
    } catch (error) {
      console.error('Redis rate limit get error:', error);
      return null;
    }
  }

  isConnected(): boolean {
    return this.connected;
  }
}

/**
 * Factory para crear Redis store con fallback automático
 */
export function createRedisRateLimitStore(
  redisUrl?: string,
  prefix?: string
): RateLimitStore {
  try {
    // Intentar cargar Redis (opcional)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const redis = require('redis');
    
    const client = redis.createClient({
      url: redisUrl || process.env.REDIS_URL,
    });

    client.on('error', (err: Error) => {
      console.warn('Redis rate limit connection error:', err.message);
    });

    client.connect().catch((err: Error) => {
      console.warn('Failed to connect to Redis for rate limiting:', err.message);
    });

    return new RedisRateLimitStore(client, prefix);
  } catch {
    // Si Redis no está disponible, usar memoria
    console.warn('Redis not available for rate limiting, using memory store');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { MemoryRateLimitStore } = require('./rate-limiter');
    return new MemoryRateLimitStore();
  }
}
