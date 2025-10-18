'use server';

import { db } from '@/lib/db';
import { sharedWishlists, wishlistItems, products, users } from '@/lib/db/schema';
import { createClient } from '@/lib/supabase/server';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';

/**
 * Genera un token único para la wishlist compartida
 */
function generateShareToken(): string {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Crea un link compartible de la wishlist del usuario
 */
export async function createShareableWishlist(formData: FormData) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Debes iniciar sesión para compartir tu wishlist' };
    }

    const name = formData.get('name')?.toString() || 'Mi Lista de Deseos';
    const description = formData.get('description')?.toString() || null;
    const expiresInDays = parseInt(formData.get('expiresInDays')?.toString() || '30');

    // Verificar que el usuario tenga items en su wishlist
    const wishlistCount = await db
      .select()
      .from(wishlistItems)
      .where(eq(wishlistItems.userId, user.id));

    if (wishlistCount.length === 0) {
      return { error: 'Tu wishlist está vacía. Agrega productos antes de compartirla.' };
    }

    // Generar token único
    const token = generateShareToken();

    // Calcular fecha de expiración
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    // Crear wishlist compartida
    const [sharedWishlist] = await db
      .insert(sharedWishlists)
      .values({
        userId: user.id,
        token,
        name,
        description,
        isPublic: true,
        expiresAt,
      })
      .returning();

    const shareUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/wishlist/shared/${token}`;

    revalidatePath('/account/wishlist');

    return {
      success: true,
      shareUrl,
      token,
      expiresAt: expiresAt.toISOString(),
    };
  } catch (error) {
    console.error('Error al crear wishlist compartida:', error);
    return { error: 'Error al crear el link compartible. Intenta de nuevo.' };
  }
}

/**
 * Obtiene una wishlist compartida por su token
 */
export async function getSharedWishlist(token: string) {
  try {
    // Buscar wishlist compartida
    const sharedWishlist = await db.query.sharedWishlists.findFirst({
      where: eq(sharedWishlists.token, token),
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!sharedWishlist) {
      return { error: 'Wishlist no encontrada' };
    }

    // Verificar si expiró
    if (sharedWishlist.expiresAt && new Date(sharedWishlist.expiresAt) < new Date()) {
      return { error: 'Este link ha expirado' };
    }

    // Verificar si es pública
    if (!sharedWishlist.isPublic) {
      return { error: 'Esta wishlist es privada' };
    }

    // Incrementar contador de vistas
    await db
      .update(sharedWishlists)
      .set({ viewCount: sharedWishlist.viewCount + 1 })
      .where(eq(sharedWishlists.id, sharedWishlist.id));

    // Obtener productos de la wishlist
    const wishlistProducts = await db
      .select({
        product: products,
        addedAt: wishlistItems.createdAt,
      })
      .from(wishlistItems)
      .innerJoin(products, eq(wishlistItems.productId, products.id))
      .where(eq(wishlistItems.userId, sharedWishlist.userId))
      .orderBy(wishlistItems.createdAt);

    return {
      success: true,
      wishlist: {
        id: sharedWishlist.id,
        name: sharedWishlist.name,
        description: sharedWishlist.description,
        ownerName: sharedWishlist.user.name || 'Usuario',
        viewCount: sharedWishlist.viewCount + 1,
        createdAt: sharedWishlist.createdAt,
        expiresAt: sharedWishlist.expiresAt,
      },
      products: wishlistProducts.map(wp => ({
        ...wp.product,
        addedAt: wp.addedAt,
      })),
    };
  } catch (error) {
    console.error('Error al obtener wishlist compartida:', error);
    return { error: 'Error al cargar la wishlist' };
  }
}

/**
 * Obtiene todas las wishlists compartidas del usuario actual
 */
export async function getUserSharedWishlists() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return [];
    }

    const userSharedWishlists = await db
      .select()
      .from(sharedWishlists)
      .where(eq(sharedWishlists.userId, user.id))
      .orderBy(sharedWishlists.createdAt);

    return userSharedWishlists.map(sw => ({
      id: sw.id,
      name: sw.name,
      token: sw.token,
      viewCount: sw.viewCount,
      isPublic: sw.isPublic,
      expiresAt: sw.expiresAt,
      createdAt: sw.createdAt,
      shareUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/wishlist/shared/${sw.token}`,
    }));
  } catch (error) {
    console.error('Error al obtener wishlists compartidas:', error);
    return [];
  }
}

/**
 * Elimina una wishlist compartida
 */
export async function deleteSharedWishlist(token: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'No autorizado' };
    }

    // Verificar que la wishlist pertenezca al usuario
    const sharedWishlist = await db.query.sharedWishlists.findFirst({
      where: and(
        eq(sharedWishlists.token, token),
        eq(sharedWishlists.userId, user.id)
      ),
    });

    if (!sharedWishlist) {
      return { error: 'Wishlist no encontrada o no autorizada' };
    }

    // Eliminar
    await db
      .delete(sharedWishlists)
      .where(eq(sharedWishlists.id, sharedWishlist.id));

    revalidatePath('/account/wishlist');

    return { success: '¡Link eliminado exitosamente!' };
  } catch (error) {
    console.error('Error al eliminar wishlist compartida:', error);
    return { error: 'Error al eliminar el link' };
  }
}

/**
 * Actualiza la visibilidad de una wishlist compartida
 */
export async function toggleSharedWishlistVisibility(token: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'No autorizado' };
    }

    // Verificar que la wishlist pertenezca al usuario
    const sharedWishlist = await db.query.sharedWishlists.findFirst({
      where: and(
        eq(sharedWishlists.token, token),
        eq(sharedWishlists.userId, user.id)
      ),
    });

    if (!sharedWishlist) {
      return { error: 'Wishlist no encontrada' };
    }

    // Cambiar visibilidad
    await db
      .update(sharedWishlists)
      .set({ isPublic: !sharedWishlist.isPublic })
      .where(eq(sharedWishlists.id, sharedWishlist.id));

    revalidatePath('/account/wishlist');

    return { success: sharedWishlist.isPublic ? 'Wishlist ahora es privada' : 'Wishlist ahora es pública' };
  } catch (error) {
    console.error('Error al cambiar visibilidad:', error);
    return { error: 'Error al actualizar visibilidad' };
  }
}
