// src/actions/wishlist.ts
// Propósito: Server Actions para gestión de lista de deseos
'use server';

import { db } from '@/lib/db';
import { wishlistItems, products } from '@/lib/db/schema';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { eq, and } from 'drizzle-orm';

/**
 * Agrega un producto a la lista de deseos
 */
export async function addToWishlist(productId: number) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Debes iniciar sesión para agregar a tu lista de deseos' };
    }

    // Verificar si el producto ya está en la wishlist
    const existing = await db
      .select()
      .from(wishlistItems)
      .where(
        and(
          eq(wishlistItems.userId, user.id),
          eq(wishlistItems.productId, productId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return { error: 'Este producto ya está en tu lista de deseos' };
    }

    // Agregar a wishlist
    await db.insert(wishlistItems).values({
      userId: user.id,
      productId,
    });

    revalidatePath('/account/wishlist');
    revalidatePath(`/product/${productId}`);
    
    return { success: 'Producto agregado a tu lista de deseos' };

  } catch (error) {
    console.error('Error al agregar a wishlist:', error);
    return { error: 'Error al agregar a la lista de deseos' };
  }
}

/**
 * Elimina un producto de la lista de deseos
 */
export async function removeFromWishlist(productId: number) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Debes iniciar sesión' };
    }

    await db
      .delete(wishlistItems)
      .where(
        and(
          eq(wishlistItems.userId, user.id),
          eq(wishlistItems.productId, productId)
        )
      );

    revalidatePath('/account/wishlist');
    revalidatePath(`/product/${productId}`);
    
    return { success: 'Producto eliminado de tu lista de deseos' };

  } catch (error) {
    console.error('Error al eliminar de wishlist:', error);
    return { error: 'Error al eliminar de la lista de deseos' };
  }
}

/**
 * Obtiene todos los productos de la wishlist del usuario
 */
export async function getUserWishlist() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return [];
    }

    const items = await db.query.wishlistItems.findMany({
      where: eq(wishlistItems.userId, user.id),
      with: {
        product: {
          with: {
            category: true,
          },
        },
      },
      orderBy: (wishlistItems, { desc }) => [desc(wishlistItems.createdAt)],
    });

    return items;

  } catch (error) {
    console.error('Error al obtener wishlist:', error);
    return [];
  }
}

/**
 * Verifica si un producto está en la wishlist del usuario
 */
export async function isInWishlist(productId: number): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return false;
    }

    const item = await db
      .select()
      .from(wishlistItems)
      .where(
        and(
          eq(wishlistItems.userId, user.id),
          eq(wishlistItems.productId, productId)
        )
      )
      .limit(1);

    return item.length > 0;

  } catch (error) {
    console.error('Error al verificar wishlist:', error);
    return false;
  }
}
