'use server';

// src/actions/referral.ts
// Propósito: Server actions para el sistema de referidos

import { db } from '@/lib/db';
import { userReferrals, referralStats, users, coupons } from '@/lib/db/schema';
import { eq, and, sql, desc } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// ============================================
// TIPOS
// ============================================

export type ReferralStatus = 'pending' | 'completed' | 'rewarded';

export interface UserReferralStats {
  referralCode: string;
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  totalPointsEarned: number;
  totalRevenueGenerated: string;
  conversionRate: number;
  referralLink: string;
}

export interface ReferralDetails {
  id: number;
  referredUserId: string;
  referredUserEmail: string | null;
  status: ReferralStatus;
  createdAt: Date;
  completedAt: Date | null;
  firstOrderAmount: string | null;
}

// ============================================
// CONFIGURACIÓN DE RECOMPENSAS
// ============================================

const REFERRAL_REWARDS = {
  // Puntos que gana el que refiere cuando el nuevo usuario hace su primera compra
  REFERRER_POINTS: 200,
  
  // Descuento que recibe el nuevo usuario al registrarse con código
  NEW_USER_DISCOUNT_PERCENTAGE: 10,
  NEW_USER_COUPON_DAYS: 30, // días de validez del cupón
  
  // Mínimo de compra para que se considere completado el referido
  MINIMUM_ORDER_AMOUNT: 0, // S/ 0 = cualquier compra cuenta
};

// ============================================
// OBTENER ESTADÍSTICAS DE REFERIDOS
// ============================================

export async function getUserReferralStats(): Promise<UserReferralStats | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    // Obtener o crear stats
    let stats = await db.query.referralStats.findFirst({
      where: eq(referralStats.userId, user.id),
    });

    // Si no existe, crear stats para este usuario
    if (!stats) {
      const code = await generateReferralCode(user.id);
      const [newStats] = await db.insert(referralStats).values({
        userId: user.id,
        referralCode: code,
      }).returning();
      stats = newStats;
    }

    // Calcular tasa de conversión
    const conversionRate = stats.totalReferrals > 0
      ? Math.round((stats.completedReferrals / stats.totalReferrals) * 100)
      : 0;

    // Generar link de referido
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const referralLink = `${baseUrl}?ref=${stats.referralCode}`;

    return {
      referralCode: stats.referralCode,
      totalReferrals: stats.totalReferrals,
      completedReferrals: stats.completedReferrals,
      pendingReferrals: stats.pendingReferrals,
      totalPointsEarned: stats.totalPointsEarned,
      totalRevenueGenerated: stats.totalRevenueGenerated,
      conversionRate,
      referralLink,
    };
  } catch (error) {
    console.error('Error al obtener stats de referidos:', error);
    return null;
  }
}

// ============================================
// OBTENER LISTA DE REFERIDOS
// ============================================

export async function getUserReferrals(): Promise<ReferralDetails[]> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    const referrals = await db.query.userReferrals.findMany({
      where: eq(userReferrals.referrerUserId, user.id),
      orderBy: [desc(userReferrals.createdAt)],
      with: {
        referred: true,
      },
    });

    return referrals.map(ref => ({
      id: ref.id,
      referredUserId: ref.referredUserId,
      referredUserEmail: ref.referred.email || null,
      status: ref.status as ReferralStatus,
      createdAt: ref.createdAt,
      completedAt: ref.completedAt,
      firstOrderAmount: ref.firstOrderAmount,
    }));
  } catch (error) {
    console.error('Error al obtener lista de referidos:', error);
    return [];
  }
}

// ============================================
// PROCESAR NUEVO REGISTRO CON CÓDIGO DE REFERIDO
// ============================================

export async function processReferralSignup(referralCode: string, newUserId: string) {
  try {
    // Buscar el usuario que tiene este código
    const referrerStats = await db.query.referralStats.findFirst({
      where: eq(referralStats.referralCode, referralCode.toUpperCase()),
    });

    if (!referrerStats) {
      console.warn(`Código de referido no encontrado: ${referralCode}`);
      return { success: false, error: 'Código de referido inválido' };
    }

    // No permitir que alguien se refiera a sí mismo
    if (referrerStats.userId === newUserId) {
      console.warn('Usuario intentó usar su propio código de referido');
      return { success: false, error: 'No puedes usar tu propio código de referido' };
    }

    // Verificar que el nuevo usuario no haya sido referido antes
    const existingReferral = await db.query.userReferrals.findFirst({
      where: eq(userReferrals.referredUserId, newUserId),
    });

    if (existingReferral) {
      console.warn('Usuario ya fue referido anteriormente');
      return { success: false, error: 'Este usuario ya fue referido' };
    }

    // Crear el registro de referido
    await db.insert(userReferrals).values({
      referrerUserId: referrerStats.userId,
      referredUserId: newUserId,
      referralCode: referralCode.toUpperCase(),
      status: 'pending',
    });

    // Crear cupón de bienvenida para el nuevo usuario
    const couponCode = `BIENVENIDA${newUserId.slice(0, 6).toUpperCase()}`;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFERRAL_REWARDS.NEW_USER_COUPON_DAYS);

    await db.insert(coupons).values({
      code: couponCode,
      discountType: 'percentage',
      discountValue: REFERRAL_REWARDS.NEW_USER_DISCOUNT_PERCENTAGE.toString(),
      expiresAt,
      isActive: true,
    });

    console.log(`✅ Referido procesado: ${newUserId} referido por ${referrerStats.userId}`);
    console.log(`✅ Cupón creado: ${couponCode} (${REFERRAL_REWARDS.NEW_USER_DISCOUNT_PERCENTAGE}% descuento)`);

    revalidatePath('/account/referrals');

    return {
      success: true,
      couponCode,
      discount: REFERRAL_REWARDS.NEW_USER_DISCOUNT_PERCENTAGE,
    };
  } catch (error) {
    console.error('Error al procesar referido:', error);
    return { success: false, error: 'Error al procesar el código de referido' };
  }
}

// ============================================
// COMPLETAR REFERIDO (cuando hace primera compra)
// ============================================

export async function completeReferral(newUserId: string, orderId: number, orderAmount: string) {
  try {
    // Buscar el referido
    const referral = await db.query.userReferrals.findFirst({
      where: and(
        eq(userReferrals.referredUserId, newUserId),
        eq(userReferrals.status, 'pending')
      ),
    });

    if (!referral) {
      // No es un referido o ya fue completado
      return { success: false, error: 'Referido no encontrado o ya completado' };
    }

    // Verificar mínimo de compra
    const amount = parseFloat(orderAmount);
    if (amount < REFERRAL_REWARDS.MINIMUM_ORDER_AMOUNT) {
      console.log(`Compra menor al mínimo requerido: S/ ${amount}`);
      return { success: false, error: 'Monto de compra insuficiente' };
    }

    // Actualizar a 'completed'
    await db.update(userReferrals)
      .set({
        status: 'completed',
        firstOrderId: orderId,
        firstOrderAmount: orderAmount,
        completedAt: new Date(),
      })
      .where(eq(userReferrals.id, referral.id));

    console.log(`✅ Referido completado: ${newUserId} hizo su primera compra (S/ ${orderAmount})`);

    // Dar recompensas
    await giveReferralRewards(referral.id);

    revalidatePath('/account/referrals');

    return { success: true };
  } catch (error) {
    console.error('Error al completar referido:', error);
    return { success: false, error: 'Error al completar el referido' };
  }
}

// ============================================
// DAR RECOMPENSAS (puntos al que refirió)
// ============================================

async function giveReferralRewards(referralId: number) {
  try {
    // Obtener el referido
    const referral = await db.query.userReferrals.findFirst({
      where: eq(userReferrals.id, referralId),
    });

    if (!referral || referral.status !== 'completed') {
      return { success: false };
    }

    // Actualizar el referido a 'rewarded'
    await db.update(userReferrals)
      .set({
        status: 'rewarded',
        referrerRewardPoints: REFERRAL_REWARDS.REFERRER_POINTS,
        rewardedAt: new Date(),
      })
      .where(eq(userReferrals.id, referralId));

    // TODO: Si implementas sistema de puntos, agregar los puntos aquí
    // await addPointsToUser(referral.referrerUserId, REFERRAL_REWARDS.REFERRER_POINTS, 'referral', referralId);

    console.log(`✅ Recompensas dadas: ${REFERRAL_REWARDS.REFERRER_POINTS} puntos al usuario ${referral.referrerUserId}`);

    revalidatePath('/account/referrals');

    return { success: true };
  } catch (error) {
    console.error('Error al dar recompensas:', error);
    return { success: false };
  }
}

// ============================================
// GENERAR CÓDIGO ÚNICO DE REFERIDO
// ============================================

async function generateReferralCode(userId: string): Promise<string> {
  let code: string;
  let exists = true;
  let attempts = 0;
  const maxAttempts = 10;

  while (exists && attempts < maxAttempts) {
    // Generar código: primeras 4 del userId + 4 random
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    const userPart = userId.substring(0, 4).toUpperCase();
    code = `${userPart}${randomPart}`;

    // Verificar que no existe
    const existing = await db.query.referralStats.findFirst({
      where: eq(referralStats.referralCode, code),
    });

    exists = !!existing;
    attempts++;
  }

  if (exists) {
    // Fallback: usar timestamp
    code = `REF${Date.now().toString(36).toUpperCase()}`;
  }

  return code!;
}

// ============================================
// VALIDAR CÓDIGO DE REFERIDO
// ============================================

export async function validateReferralCode(code: string): Promise<{ valid: boolean; message?: string }> {
  try {
    if (!code || code.length < 6) {
      return { valid: false, message: 'Código inválido' };
    }

    const stats = await db.query.referralStats.findFirst({
      where: eq(referralStats.referralCode, code.toUpperCase()),
      with: {
        user: true,
      },
    });

    if (!stats) {
      return { valid: false, message: 'Código no encontrado' };
    }

    return {
      valid: true,
      message: `Código válido! Recibirás un ${REFERRAL_REWARDS.NEW_USER_DISCOUNT_PERCENTAGE}% de descuento en tu primera compra`,
    };
  } catch (error) {
    console.error('Error al validar código:', error);
    return { valid: false, message: 'Error al validar el código' };
  }
}

// ============================================
// OBTENER STATS GLOBALES (ADMIN)
// ============================================

export async function getGlobalReferralStats() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error('No autenticado');

    // Verificar que es admin
    const userRecord = await db.query.users.findFirst({
      where: eq(users.id, user.id),
    });

    if (userRecord?.role !== 'admin') {
      throw new Error('No autorizado');
    }

    // Stats globales
    const [stats] = await db.select({
      totalReferrals: sql<number>`COUNT(*)::int`,
      completedReferrals: sql<number>`COUNT(*) FILTER (WHERE status = 'completed')::int`,
      rewardedReferrals: sql<number>`COUNT(*) FILTER (WHERE status = 'rewarded')::int`,
      totalRevenue: sql<string>`COALESCE(SUM(first_order_amount), 0)::text`,
    }).from(userReferrals);

    // Top referrers
    const topReferrers = await db.select({
      userId: referralStats.userId,
      referralCode: referralStats.referralCode,
      totalReferrals: referralStats.totalReferrals,
      completedReferrals: referralStats.completedReferrals,
      totalRevenueGenerated: referralStats.totalRevenueGenerated,
    })
      .from(referralStats)
      .orderBy(desc(referralStats.totalReferrals))
      .limit(10);

    return {
      ...stats,
      topReferrers,
    };
  } catch (error) {
    console.error('Error al obtener stats globales:', error);
    return null;
  }
}
