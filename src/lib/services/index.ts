// src/lib/services/index.ts
// Propósito: Instancias singleton de servicios para usar en Server Actions

import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { users, orders, orderItems } from '@/lib/db/schema';
import { AuthService, OrdersService } from '@mhorp/services';

/**
 * Obtiene una instancia del AuthService
 * IMPORTANTE: Debe ser llamado dentro de Server Actions o Server Components
 */
export async function getAuthService() {
  const supabase = await createClient();
  return new AuthService(supabase, db, users);
}

/**
 * Obtiene una instancia del OrdersService
 * IMPORTANTE: Debe ser llamado dentro de Server Actions o Server Components
 */
export async function getOrdersService() {
  const supabase = await createClient();
  const authService = new AuthService(supabase, db, users);
  return new OrdersService(db, authService, orders, orderItems);
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
