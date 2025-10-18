// packages/services/src/common/types.ts
// Propósito: Tipos compartidos entre servicios

import type { SupabaseClient, User, Session } from '@supabase/supabase-js';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

/**
 * Cliente de Drizzle (tipo genérico)
 */
export type DrizzleClient = NodePgDatabase<any>;

/**
 * Cliente de Supabase tipado
 */
export type TypedSupabaseClient = SupabaseClient;

/**
 * Usuario de Supabase
 */
export type AuthUser = User;

/**
 * Sesión de Supabase
 */
export type AuthSession = Session;

/**
 * Usuario de la base de datos (tabla users)
 */
export interface DatabaseUser {
  id: string;
  email: string;
  name: string | null;
  role: 'customer' | 'admin';
  createdAt: Date;
}

/**
 * Resultado de operación exitosa
 */
export interface SuccessResult<T> {
  success: true;
  data: T;
}

/**
 * Resultado de operación fallida
 */
export interface ErrorResult {
  success: false;
  error: string;
  code?: string;
  details?: unknown;
}

/**
 * Resultado de operación (success o error)
 */
export type Result<T> = SuccessResult<T> | ErrorResult;

/**
 * Opciones de paginación
 */
export interface PaginationOptions {
  page?: number;
  limit?: number;
}

/**
 * Resultado paginado
 */
export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Contexto de ejecución (usuario actual, permisos, etc.)
 */
export interface ExecutionContext {
  user: AuthUser | null;
  dbUser: DatabaseUser | null;
  isAdmin: boolean;
}
