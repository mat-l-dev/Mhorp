// packages/services/src/rate-limit/index.ts
// Propósito: Exportar rate limiting API

export {
  RateLimiter,
  MemoryRateLimitStore,
  RateLimitPresets,
  createRateLimiter,
} from './rate-limiter';

export {
  RedisRateLimitStore,
  createRedisRateLimitStore,
} from './redis-store';

export type {
  RateLimitConfig,
  RateLimitInfo,
  RateLimitStore,
} from './rate-limiter';
