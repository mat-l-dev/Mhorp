// packages/services/src/cache/redis-client.ts
// Propósito: Cliente de Redis para caché en producción

import type { CacheClient } from './cache.service';

/**
 * Cliente de Redis
 * Requiere redis package: pnpm add redis
 * 
 * Este es un wrapper que implementa CacheClient
 * usando la librería redis de Node.js
 */
export class RedisCacheClient implements CacheClient {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private client: any;
  private connected = false;

  constructor(redisUrl?: string) {
    // Lazy loading de redis para evitar errores si no está instalado
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const redis = require('redis');
      
      this.client = redis.createClient({
        url: redisUrl || process.env.REDIS_URL || 'redis://localhost:6379',
      });

      this.client.on('error', (err: Error) => {
        console.error('Redis Client Error:', err);
        this.connected = false;
      });

      this.client.on('connect', () => {
        console.log('Redis Client Connected');
        this.connected = true;
      });

      this.client.connect();
    } catch (error) {
      console.warn('Redis not available, falling back to memory cache');
      throw error;
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.connected) return null;
    
    try {
      return await this.client.get(key);
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!this.connected) return;

    try {
      if (ttlSeconds) {
        await this.client.setEx(key, ttlSeconds, value);
      } else {
        await this.client.set(key, value);
      }
    } catch (error) {
      console.error('Redis set error:', error);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.connected) return;

    try {
      await this.client.del(key);
    } catch (error) {
      console.error('Redis del error:', error);
    }
  }

  async delPattern(pattern: string): Promise<void> {
    if (!this.connected) return;

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
    } catch (error) {
      console.error('Redis delPattern error:', error);
    }
  }

  async flush(): Promise<void> {
    if (!this.connected) return;

    try {
      await this.client.flushAll();
    } catch (error) {
      console.error('Redis flush error:', error);
    }
  }

  async disconnect(): Promise<void> {
    if (this.connected) {
      await this.client.quit();
      this.connected = false;
    }
  }
}

/**
 * Factory para crear cliente Redis con fallback a memoria
 */
export function createRedisClient(redisUrl?: string): CacheClient {
  try {
    return new RedisCacheClient(redisUrl);
  } catch (error) {
    console.warn('Failed to create Redis client, using memory cache');
    // Importar MemoryCacheClient dinámicamente para evitar dependencias circulares
    const { MemoryCacheClient } = require('./cache.service');
    return new MemoryCacheClient();
  }
}
