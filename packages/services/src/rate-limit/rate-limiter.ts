// packages/services/src/rate-limit/rate-limiter.ts
// Propósito: Rate limiter para proteger endpoints de abuso

/**
 * Configuración de rate limiting
 */
export interface RateLimitConfig {
  windowMs: number;      // Ventana de tiempo en ms
  max: number;           // Máximo de requests permitidos
  message?: string;      // Mensaje de error customizado
  skipSuccessfulRequests?: boolean;  // No contar requests exitosos
  skipFailedRequests?: boolean;      // No contar requests fallidos
}

/**
 * Información del rate limit
 */
export interface RateLimitInfo {
  limit: number;         // Límite máximo
  current: number;       // Requests actuales
  remaining: number;     // Requests restantes
  resetTime: Date;       // Cuándo se resetea el contador
}

/**
 * Storage para rate limiting
 */
export interface RateLimitStore {
  increment(key: string): Promise<{ count: number; resetTime: Date }>;
  decrement(key: string): Promise<void>;
  reset(key: string): Promise<void>;
  get(key: string): Promise<{ count: number; resetTime: Date } | null>;
}

/**
 * Store en memoria para rate limiting
 */
export class MemoryRateLimitStore implements RateLimitStore {
  private store = new Map<string, { count: number; resetTime: Date }>();
  private cleanupInterval: NodeJS.Timeout;

  constructor(private windowMs: number = 60000) {
    // Limpiar entries expiradas cada minuto
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  async increment(key: string): Promise<{ count: number; resetTime: Date }> {
    const now = new Date();
    const entry = this.store.get(key);

    if (!entry || entry.resetTime < now) {
      // Crear nueva entrada o resetear si expiró
      const resetTime = new Date(now.getTime() + this.windowMs);
      const newEntry = { count: 1, resetTime };
      this.store.set(key, newEntry);
      return newEntry;
    }

    // Incrementar contador existente
    entry.count++;
    this.store.set(key, entry);
    return entry;
  }

  async decrement(key: string): Promise<void> {
    const entry = this.store.get(key);
    if (entry && entry.count > 0) {
      entry.count--;
      this.store.set(key, entry);
    }
  }

  async reset(key: string): Promise<void> {
    this.store.delete(key);
  }

  async get(key: string): Promise<{ count: number; resetTime: Date } | null> {
    const entry = this.store.get(key);
    if (!entry) return null;

    const now = new Date();
    if (entry.resetTime < now) {
      this.store.delete(key);
      return null;
    }

    return entry;
  }

  private cleanup(): void {
    const now = new Date();
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetTime < now) {
        this.store.delete(key);
      }
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

/**
 * Rate Limiter Service
 * 
 * Responsabilidades:
 * - Limitar requests por IP/usuario
 * - Diferentes límites por endpoint
 * - Almacenamiento flexible (memoria/Redis)
 * - Headers de rate limit estándar
 * 
 * Uso:
 * ```typescript
 * const limiter = new RateLimiter({
 *   windowMs: 60000,  // 1 minuto
 *   max: 100          // 100 requests por minuto
 * });
 * 
 * // En un endpoint
 * const result = await limiter.check(clientId);
 * if (!result.allowed) {
 *   throw new Error('Rate limit exceeded');
 * }
 * ```
 */
export class RateLimiter {
  private config: Required<RateLimitConfig>;

  constructor(
    config: RateLimitConfig,
    private store: RateLimitStore = new MemoryRateLimitStore(config.windowMs)
  ) {
    this.config = {
      windowMs: config.windowMs,
      max: config.max,
      message: config.message || 'Too many requests, please try again later',
      skipSuccessfulRequests: config.skipSuccessfulRequests ?? false,
      skipFailedRequests: config.skipFailedRequests ?? false,
    };
  }

  /**
   * Verifica si un cliente puede hacer un request
   */
  async check(clientId: string): Promise<{
    allowed: boolean;
    info: RateLimitInfo;
  }> {
    const result = await this.store.increment(clientId);
    const allowed = result.count <= this.config.max;

    return {
      allowed,
      info: {
        limit: this.config.max,
        current: result.count,
        remaining: Math.max(0, this.config.max - result.count),
        resetTime: result.resetTime,
      },
    };
  }

  /**
   * Consume un request (usa este método después de procesar el request)
   */
  async consume(clientId: string, success: boolean = true): Promise<{
    allowed: boolean;
    info: RateLimitInfo;
  }> {
    // Si está configurado para no contar ciertos requests, decrementar
    const shouldNotCount = 
      (success && this.config.skipSuccessfulRequests) ||
      (!success && this.config.skipFailedRequests);

    if (shouldNotCount) {
      await this.store.decrement(clientId);
    }

    const current = await this.store.get(clientId);
    if (!current) {
      // Si no existe, crear uno nuevo
      return await this.check(clientId);
    }

    const allowed = current.count <= this.config.max;

    return {
      allowed,
      info: {
        limit: this.config.max,
        current: current.count,
        remaining: Math.max(0, this.config.max - current.count),
        resetTime: current.resetTime,
      },
    };
  }

  /**
   * Resetea el contador para un cliente
   */
  async reset(clientId: string): Promise<void> {
    await this.store.reset(clientId);
  }

  /**
   * Obtiene información actual del rate limit sin incrementar
   */
  async getInfo(clientId: string): Promise<RateLimitInfo | null> {
    const current = await this.store.get(clientId);
    if (!current) return null;

    return {
      limit: this.config.max,
      current: current.count,
      remaining: Math.max(0, this.config.max - current.count),
      resetTime: current.resetTime,
    };
  }

  /**
   * Obtiene el mensaje de error configurado
   */
  getMessage(): string {
    return this.config.message;
  }
}

/**
 * Rate limiters predefinidos para diferentes casos de uso
 */
export const RateLimitPresets = {
  /**
   * Para endpoints de autenticación (más restrictivo)
   * 5 intentos cada 15 minutos
   */
  auth: {
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Too many authentication attempts, please try again later',
    skipSuccessfulRequests: true,
  } as RateLimitConfig,

  /**
   * Para API pública general
   * 100 requests por minuto
   */
  api: {
    windowMs: 60 * 1000,
    max: 100,
    message: 'Too many requests, please slow down',
  } as RateLimitConfig,

  /**
   * Para operaciones de escritura (más restrictivo)
   * 20 requests por minuto
   */
  write: {
    windowMs: 60 * 1000,
    max: 20,
    message: 'Too many write operations, please try again later',
  } as RateLimitConfig,

  /**
   * Para operaciones de lectura
   * 300 requests por minuto
   */
  read: {
    windowMs: 60 * 1000,
    max: 300,
  } as RateLimitConfig,

  /**
   * Para búsquedas (moderado)
   * 50 requests por minuto
   */
  search: {
    windowMs: 60 * 1000,
    max: 50,
    message: 'Too many search requests, please slow down',
  } as RateLimitConfig,

  /**
   * Para uploads de archivos (muy restrictivo)
   * 10 uploads cada 5 minutos
   */
  upload: {
    windowMs: 5 * 60 * 1000,
    max: 10,
    message: 'Too many upload attempts, please wait before uploading more files',
  } as RateLimitConfig,

  /**
   * Para admin (menos restrictivo)
   * 500 requests por minuto
   */
  admin: {
    windowMs: 60 * 1000,
    max: 500,
  } as RateLimitConfig,
};

/**
 * Factory para crear rate limiters con presets
 */
export function createRateLimiter(
  preset: keyof typeof RateLimitPresets,
  store?: RateLimitStore
): RateLimiter {
  const config = RateLimitPresets[preset];
  return new RateLimiter(config, store);
}
