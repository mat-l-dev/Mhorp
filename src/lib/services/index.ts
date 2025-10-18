// src/lib/services/index.ts
// Propósito: Instancias singleton de servicios para usar en Server Actions

import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { users, orders, orderItems, paymentProofs } from '@/lib/db/schema';
import { AuthService, OrdersService, StorageService } from '@mhorp/services';

/**
 * Obtiene una instancia del AuthService
 * IMPORTANTE: Debe ser llamado dentro de Server Actions o Server Components
 */
export async function getAuthService() {
  const supabase = await createClient();
  return new AuthService(supabase, db, users);
}

/**
 * Obtiene una instancia del StorageService
 * IMPORTANTE: Debe ser llamado dentro de Server Actions o Server Components
 */
export async function getStorageService() {
  const supabase = await createClient();
  return new StorageService(supabase);
}

/**
 * Obtiene una instancia del OrdersService
 * IMPORTANTE: Debe ser llamado dentro de Server Actions o Server Components
 */
export async function getOrdersService() {
  const supabase = await createClient();
  const authService = new AuthService(supabase, db, users);
  const storageService = new StorageService(supabase);
  return new OrdersService(
    db,
    authService,
    orders,
    orderItems,
    paymentProofs,
    storageService
  );
}

/**
 * Helper para obtener el usuario actual
 * Uso común en Server Actions
 */
export async function getCurrentUser() {
  const authService = await getAuthService();
  return authService.getCurrentUser();
}

/**
 * Helper para obtener el usuario de la DB
 * Uso común en Server Actions
 */
export async function getDatabaseUser() {
  const authService = await getAuthService();
  return authService.getDatabaseUser();
}

/**
 * Helper para verificar si es admin
 * Uso común en Server Actions de admin
 */
export async function requireAdmin() {
  const authService = await getAuthService();
  return authService.requireAdmin();
}

/**
 * Helper para verificar si es admin (sin throw)
 */
export async function isAdmin() {
  const authService = await getAuthService();
  return authService.isAdmin();
}
