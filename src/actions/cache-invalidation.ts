'use server';

import { invalidateCacheByTag, invalidateCache } from '@/lib/cache';

/**
 * Hooks para invalidar caché cuando los datos cambian
 * Llamar estas funciones después de crear/actualizar/eliminar datos
 */

/**
 * Invalida caché de analytics cuando se crea/actualiza una orden
 */
export async function invalidateAnalyticsCache() {
  await invalidateCacheByTag('analytics');
}

/**
 * Invalida caché de productos cuando se crea/actualiza un producto
 */
export async function invalidateProductCache(productId?: number) {
  if (productId) {
    await invalidateCache(`product:${productId}`);
  }
  await invalidateCacheByTag('products');
  // Los productos afectan analytics también
  await invalidateCacheByTag('analytics');
}

/**
 * Invalida caché cuando se crea una reseña
 */
export async function invalidateReviewCache(productId: number) {
  await invalidateCache(`product:${productId}:reviews`);
  await invalidateCache(`product:${productId}:rating`);
  await invalidateCacheByTag('analytics');
}

/**
 * Invalida caché cuando se agrega/quita de wishlist
 */
export async function invalidateWishlistCache(userId: string) {
  await invalidateCache(`wishlist:${userId}`);
  await invalidateCacheByTag('analytics');
}

/**
 * Invalida caché cuando se crea/usa un cupón
 */
export async function invalidateCouponCache() {
  await invalidateCacheByTag('coupons');
  await invalidateCacheByTag('analytics');
}
