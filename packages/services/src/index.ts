// packages/services/src/index.ts
// Propósito: Punto de entrada del package de servicios

// Exportar servicios
export { AuthService } from './auth/auth.service';
export type { SignInCredentials, SignUpData } from './auth/auth.service';

export { OrdersService } from './orders/orders.service';
export type {
  OrderStatus,
  CreateOrderData,
  Order,
  OrderWithDetails,
} from './orders/orders.service';

export { StorageService } from './storage/storage.service';
export type {
  FileValidationOptions,
  UploadResult,
} from './storage/storage.service';

export { ProductsService } from './products/products.service';
export type {
  Product,
  ProductWithRelations,
  CreateProductData,
  UpdateProductData,
  ProductFilters,
  PaginationOptions,
  PaginatedProducts,
} from './products/products.service';

// Exportar Cache
export {
  CacheService,
  createCacheService,
  MemoryCacheClient,
  RedisCacheClient,
  createRedisClient,
} from './cache';
export type { CacheClient, CacheOptions } from './cache';

// Exportar Rate Limiting
export {
  RateLimiter,
  MemoryRateLimitStore,
  RateLimitPresets,
  createRateLimiter,
  RedisRateLimitStore,
  createRedisRateLimitStore,
} from './rate-limit';
export type {
  RateLimitConfig,
  RateLimitInfo,
  RateLimitStore,
} from './rate-limit';

// Exportar errores
export {
  AppError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
  ConflictError,
  BusinessError,
  StorageError,
  DatabaseError,
  isAppError,
  normalizeError,
} from './common/errors';

// Exportar tipos
export type {
  DrizzleClient,
  TypedSupabaseClient,
  AuthUser,
  AuthSession,
  DatabaseUser,
  SuccessResult,
  ErrorResult,
  Result,
  PaginationOptions as CommonPaginationOptions,
  PaginatedResult,
  ExecutionContext,
} from './common/types';
