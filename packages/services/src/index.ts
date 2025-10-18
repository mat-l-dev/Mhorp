// packages/services/src/index.ts
// Propósito: Punto de entrada del package de servicios

// Exportar servicios
export { AuthService } from './auth/auth.service';
export type { SignInCredentials, SignUpData } from './auth/auth.service';

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
  PaginationOptions,
  PaginatedResult,
  ExecutionContext,
} from './common/types';
