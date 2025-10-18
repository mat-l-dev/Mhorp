// src/actions/review.ts
// Propósito: Server Actions para sistema de reseñas y calificaciones
'use server';

import { db } from '@/lib/db';
import { reviews, orderItems, orders } from '@/lib/db/schema';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { eq, and, sql } from 'drizzle-orm';

/**
 * Schema de validación para reseñas
 */
const reviewSchema = z.object({
  productId: z.number().int().positive(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(10, 'El comentario debe tener al menos 10 caracteres').max(500, 'El comentario no puede exceder 500 caracteres').optional(),
});

/**
 * Verifica si un usuario ha comprado un producto
 */
async function hasUserPurchasedProduct(userId: string, productId: number): Promise<boolean> {
  try {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(orderItems)
      .innerJoin(orders, eq(orders.id, orderItems.orderId))
      .where(
        and(
          eq(orders.userId, userId),
          eq(orderItems.productId, productId),
          sql`${orders.status} IN ('processing', 'shipped', 'delivered')`
        )
      );

    return Number(result[0]?.count) > 0;
  } catch (error) {
    console.error('Error al verificar compra:', error);
    return false;
  }
}

/**
 * Envía una reseña de producto
 */
export async function submitReview(prevState: unknown, formData: FormData) {
  try {
    // Verificar autenticación
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Debes iniciar sesión para dejar una reseña' };
    }

    // Extraer y validar datos
    const data = {
      productId: Number(formData.get('productId')),
      rating: Number(formData.get('rating')),
      comment: formData.get('comment')?.toString() || undefined,
    };

    const validated = reviewSchema.safeParse(data);

    if (!validated.success) {
      return { error: validated.error.issues[0].message };
    }

    // Verificar que el usuario haya comprado el producto
    const hasPurchased = await hasUserPurchasedProduct(user.id, validated.data.productId);

    if (!hasPurchased) {
      return { 
        error: 'Solo puedes dejar reseñas de productos que hayas comprado' 
      };
    }

    // Verificar si ya dejó una reseña
    const existingReview = await db
      .select()
      .from(reviews)
      .where(
        and(
          eq(reviews.userId, user.id),
          eq(reviews.productId, validated.data.productId)
        )
      )
      .limit(1);

    if (existingReview.length > 0) {
      return { error: 'Ya has dejado una reseña para este producto' };
    }

    // Crear la reseña
    await db.insert(reviews).values({
      userId: user.id,
      productId: validated.data.productId,
      rating: validated.data.rating,
      comment: validated.data.comment,
    });

    revalidatePath(`/product/${validated.data.productId}`);
    return { success: '¡Gracias por tu reseña!' };

  } catch (error) {
    console.error('Error al enviar reseña:', error);
    return { error: 'Error al procesar tu reseña. Intenta de nuevo.' };
  }
}

/**
 * Obtiene todas las reseñas de un producto
 */
export async function getProductReviews(productId: number) {
  try {
    const productReviews = await db.query.reviews.findMany({
      where: eq(reviews.productId, productId),
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: (reviews, { desc }) => [desc(reviews.createdAt)],
    });

    return productReviews;
  } catch (error) {
    console.error('Error al obtener reseñas:', error);
    return [];
  }
}

/**
 * Obtiene el promedio de calificación de un producto
 */
export async function getProductRating(productId: number): Promise<{ average: number; count: number }> {
  try {
    const result = await db
      .select({
        average: sql<number>`COALESCE(ROUND(AVG(${reviews.rating})::numeric, 1), 0)`,
        count: sql<number>`COUNT(*)`,
      })
      .from(reviews)
      .where(eq(reviews.productId, productId));

    return {
      average: Number(result[0]?.average) || 0,
      count: Number(result[0]?.count) || 0,
    };
  } catch (error) {
    console.error('Error al calcular rating:', error);
    return { average: 0, count: 0 };
  }
}

/**
 * Verifica si el usuario actual puede dejar una reseña para un producto
 */
export async function canUserReview(productId: number): Promise<{ canReview: boolean; reason?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { canReview: false, reason: 'Debes iniciar sesión' };
    }

    // Verificar si ya dejó una reseña
    const existingReview = await db
      .select()
      .from(reviews)
      .where(
        and(
          eq(reviews.userId, user.id),
          eq(reviews.productId, productId)
        )
      )
      .limit(1);

    if (existingReview.length > 0) {
      return { canReview: false, reason: 'Ya dejaste una reseña' };
    }

    // Verificar si ha comprado el producto
    const hasPurchased = await hasUserPurchasedProduct(user.id, productId);

    if (!hasPurchased) {
      return { canReview: false, reason: 'Debes comprar el producto primero' };
    }

    return { canReview: true };

  } catch (error) {
    console.error('Error al verificar permisos de reseña:', error);
    return { canReview: false, reason: 'Error al verificar permisos' };
  }
}
