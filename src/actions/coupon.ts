// src/actions/coupon.ts
// Propósito: Server Actions para sistema de cupones de descuento
'use server';

import { db } from '@/lib/db';
import { coupons } from '@/lib/db/schema';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { eq, and, sql } from 'drizzle-orm';

/**
 * Verifica si el usuario actual es administrador
 */
async function isAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return false;

  const dbUser = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.id, user.id),
  });

  return dbUser?.role === 'admin';
}

/**
 * Schema de validación para cupones
 */
const couponSchema = z.object({
  code: z.string().min(3).max(50).toUpperCase().regex(/^[A-Z0-9_-]+$/, 'Solo letras mayúsculas, números, guiones y guiones bajos'),
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, 'El valor debe ser mayor a 0'),
  expiresAt: z.string().optional(),
  isActive: z.boolean().default(true),
});

/**
 * Aplica un cupón de descuento
 */
export async function applyCoupon(code: string): Promise<{
  success?: boolean;
  coupon?: typeof coupons.$inferSelect;
  discount?: number;
  error?: string;
}> {
  try {
    if (!code || code.trim().length === 0) {
      return { error: 'Ingresa un código de cupón' };
    }

    // Buscar el cupón
    const coupon = await db.query.coupons.findFirst({
      where: and(
        eq(coupons.code, code.toUpperCase().trim()),
        eq(coupons.isActive, true)
      ),
    });

    if (!coupon) {
      return { error: 'Cupón inválido o no encontrado' };
    }

    // Verificar si ha expirado
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return { error: 'Este cupón ha expirado' };
    }

    return {
      success: true,
      coupon,
    };

  } catch (error) {
    console.error('Error al aplicar cupón:', error);
    return { error: 'Error al procesar el cupón' };
  }
}

/**
 * Calcula el descuento basado en el cupón y el total del carrito
 * (Helper function - no exportada como Server Action)
 */
function calculateDiscount(
  total: number,
  coupon: typeof coupons.$inferSelect
): number {
  if (coupon.discountType === 'percentage') {
    const percentage = parseFloat(coupon.discountValue);
    return (total * percentage) / 100;
  } else {
    // fixed
    const fixedAmount = parseFloat(coupon.discountValue);
    // No permitir que el descuento sea mayor al total
    return Math.min(fixedAmount, total);
  }
}

/**
 * Crea o actualiza un cupón (admin only)
 */
export async function upsertCoupon(prevState: unknown, formData: FormData) {
  if (!(await isAdmin())) {
    return { error: 'No autorizado' };
  }

  try {
    const data = {
      code: formData.get('code')?.toString(),
      discountType: formData.get('discountType')?.toString(),
      discountValue: formData.get('discountValue')?.toString(),
      expiresAt: formData.get('expiresAt')?.toString(),
      isActive: formData.get('isActive') === 'true',
    };

    const validated = couponSchema.safeParse(data);

    if (!validated.success) {
      return { error: validated.error.issues[0].message };
    }

    const id = formData.get('id');

    if (id) {
      // Actualizar cupón existente
      await db
        .update(coupons)
        .set({
          code: validated.data.code,
          discountType: validated.data.discountType,
          discountValue: validated.data.discountValue,
          expiresAt: validated.data.expiresAt ? new Date(validated.data.expiresAt) : null,
          isActive: validated.data.isActive,
        })
        .where(eq(coupons.id, Number(id)));
    } else {
      // Crear nuevo cupón
      await db.insert(coupons).values({
        code: validated.data.code,
        discountType: validated.data.discountType,
        discountValue: validated.data.discountValue,
        expiresAt: validated.data.expiresAt ? new Date(validated.data.expiresAt) : null,
        isActive: validated.data.isActive,
      });
    }

    revalidatePath('/admin/coupons');
    return { success: 'Cupón guardado exitosamente' };

  } catch (error: unknown) {
    console.error('Error al guardar cupón:', error);

    if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
      return { error: 'Ya existe un cupón con ese código' };
    }

    return { error: 'Error al guardar el cupón' };
  }
}

/**
 * Desactiva un cupón (admin only)
 */
export async function deactivateCoupon(couponId: number) {
  if (!(await isAdmin())) {
    return { error: 'No autorizado' };
  }

  try {
    await db
      .update(coupons)
      .set({ isActive: false })
      .where(eq(coupons.id, couponId));

    revalidatePath('/admin/coupons');
    return { success: 'Cupón desactivado exitosamente' };

  } catch (error) {
    console.error('Error al desactivar cupón:', error);
    return { error: 'Error al desactivar el cupón' };
  }
}

/**
 * Obtiene todos los cupones (admin only)
 */
export async function getAllCoupons() {
  if (!(await isAdmin())) {
    return [];
  }

  try {
    const allCoupons = await db.query.coupons.findMany({
      orderBy: (coupons, { desc }) => [desc(coupons.createdAt)],
    });

    return allCoupons;

  } catch (error) {
    console.error('Error al obtener cupones:', error);
    return [];
  }
}

/**
 * Obtiene un cupón por ID (admin only)
 */
export async function getCouponById(id: number) {
  if (!(await isAdmin())) {
    return null;
  }

  try {
    return await db.query.coupons.findFirst({
      where: eq(coupons.id, id),
    });
  } catch (error) {
    console.error('Error al obtener cupón:', error);
    return null;
  }
}
