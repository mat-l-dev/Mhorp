// packages/services/src/cache/cache.service.ts
// Propósito: Servicio centralizado de caché con soporte para Redis y fallback en memoria

/**
 * Interfaz para el cliente de caché
 */
export interface CacheClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  delPattern(pattern: string): Promise<void>;
  flush(): Promise<void>;
}

/**
 * Opciones de configuración para el caché
 */
export interface CacheOptions {
  ttl?: number; // Time to live en segundos
  namespace?: string; // Prefijo para las keys
}

/**
 * Implementación en memoria (fallback cuando Redis no está disponible)
 */
class MemoryCacheClient implements CacheClient {
  private cache = new Map<string, { value: string; expires: number }>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Limpiar entries expiradas cada 60 segundos
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  async get(key: string): Promise<string | null> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Verificar si ha expirado
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  async set(key: string, value: string, ttlSeconds: number = 3600): Promise<void> {
    const expires = Date.now() + (ttlSeconds * 1000);
    this.cache.set(key, { value, expires });
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async delPattern(pattern: string): Promise<void> {
    // Convertir pattern de Redis a RegExp
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  async flush(): Promise<void> {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expires) {
        this.cache.delete(key);
      }
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.cache.clear();
  }
}

/**
 * Servicio de Caché
 * 
 * Responsabilidades:
 * - Almacenar/recuperar datos en caché
 * - Invalidación de caché por key o pattern
 * - Serialización/deserialización automática
 * - Manejo de TTL
 * - Namespace para evitar colisiones
 * 
 * Uso:
 * ```typescript
 * const cache = new CacheService(redisClient);
 * 
 * // Guardar
 * await cache.set('user:123', userData, { ttl: 300 });
 * 
 * // Recuperar
 * const user = await cache.get('user:123');
 * 
 * // Invalidar
 * await cache.invalidate('user:123');
 * await cache.invalidatePattern('user:*');
 * ```
 */
export class CacheService {
  private defaultTTL = 3600; // 1 hora por defecto
  private namespace = 'mhor:';

  constructor(private client: CacheClient) {}

  /**
   * Obtiene un valor del caché
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const fullKey = this.buildKey(key);
      const cached = await this.client.get(fullKey);

      if (!cached) {
        return null;
      }

      return JSON.parse(cached) as T;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Guarda un valor en el caché
   */
  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    try {
      const fullKey = this.buildKey(key);
      const ttl = options.ttl ?? this.defaultTTL;
      const serialized = JSON.stringify(value);

      await this.client.set(fullKey, serialized, ttl);
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
      // No lanzar error, simplemente logear
    }
  }

  /**
   * Obtiene un valor del caché o lo calcula y guarda
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    // Intentar obtener del caché
    const cached = await this.get<T>(key);
    
    if (cached !== null) {
      return cached;
    }

    // Si no está en caché, calcular
    const value = await factory();
    
    // Guardar en caché
    await this.set(key, value, options);
    
    return value;
  }

  /**
   * Invalida una key específica
   */
  async invalidate(key: string): Promise<void> {
    try {
      const fullKey = this.buildKey(key);
      await this.client.del(fullKey);
    } catch (error) {
      console.error(`Cache invalidate error for key ${key}:`, error);
    }
  }

  /**
   * Invalida múltiples keys por pattern
   * Ejemplo: invalidatePattern('products:*')
   */
  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const fullPattern = this.buildKey(pattern);
      await this.client.delPattern(fullPattern);
    } catch (error) {
      console.error(`Cache invalidate pattern error for ${pattern}:`, error);
    }
  }

  /**
   * Invalida múltiples keys
   */
  async invalidateMany(keys: string[]): Promise<void> {
    await Promise.all(keys.map(key => this.invalidate(key)));
  }

  /**
   * Limpia todo el caché
   */
  async flush(): Promise<void> {
    try {
      await this.client.flush();
    } catch (error) {
      console.error('Cache flush error:', error);
    }
  }

  /**
   * Construye la key completa con namespace
   */
  private buildKey(key: string): string {
    return `${this.namespace}${key}`;
  }

  /**
   * Configura el TTL por defecto
   */
  setDefaultTTL(seconds: number): void {
    this.defaultTTL = seconds;
  }

  /**
   * Configura el namespace
   */
  setNamespace(namespace: string): void {
    this.namespace = namespace.endsWith(':') ? namespace : `${namespace}:`;
  }
}

/**
 * Factory para crear instancia de CacheService
 */
export function createCacheService(client?: CacheClient): CacheService {
  const cacheClient = client ?? new MemoryCacheClient();
  return new CacheService(cacheClient);
}

/**
 * Exportar implementación en memoria para testing
 */
export { MemoryCacheClient };
