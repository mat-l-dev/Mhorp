'use server';

import { db } from '@/lib/db';
import { orders, orderItems, products, reviews, wishlistItems, users, coupons } from '@/lib/db/schema';
import { sql, eq, desc, and, gte, count } from 'drizzle-orm';
import { getCached, analyticsCache } from '@/lib/cache';

/**
 * Obtiene métricas generales del negocio (con caché)
 */
export async function getAnalyticsMetrics() {
  return analyticsCache.metrics(async () => {
    return _getAnalyticsMetricsUncached();
  });
}

/**
 * Versión sin caché de getAnalyticsMetrics
 */
async function _getAnalyticsMetricsUncached() {
  try {
    // Total de ventas (excluyendo canceladas)
    const totalRevenueResult = await db
      .select({ 
        total: sql<number>`SUM(CAST(${orders.total} AS DECIMAL))` 
      })
      .from(orders)
      .where(sql`${orders.status} != 'cancelled'`);
    
    const totalRevenue = totalRevenueResult[0]?.total || 0;

    // Total de órdenes
    const totalOrdersResult = await db
      .select({ count: count() })
      .from(orders);
    
    const totalOrders = totalOrdersResult[0]?.count || 0;

    // Órdenes pendientes
    const pendingOrdersResult = await db
      .select({ count: count() })
      .from(orders)
      .where(eq(orders.status, 'pending'));
    
    const pendingOrders = pendingOrdersResult[0]?.count || 0;

    // Total de productos
    const totalProductsResult = await db
      .select({ count: count() })
      .from(products);
    
    const totalProducts = totalProductsResult[0]?.count || 0;

    // Total de usuarios
    const totalUsersResult = await db
      .select({ count: count() })
      .from(users);
    
    const totalUsers = totalUsersResult[0]?.count || 0;

    // Total de reseñas
    const totalReviewsResult = await db
      .select({ count: count() })
      .from(reviews);
    
    const totalReviews = totalReviewsResult[0]?.count || 0;

    // Promedio de calificación global
    const avgRatingResult = await db
      .select({ 
        avg: sql<number>`AVG(${reviews.rating})` 
      })
      .from(reviews);
    
    const avgRating = avgRatingResult[0]?.avg || 0;

    // Total de items en wishlist
    const totalWishlistResult = await db
      .select({ count: count() })
      .from(wishlistItems);
    
    const totalWishlistItems = totalWishlistResult[0]?.count || 0;

    // Cupones activos
    const activeCouponsResult = await db
      .select({ count: count() })
      .from(coupons)
      .where(eq(coupons.isActive, true));
    
    const activeCoupons = activeCouponsResult[0]?.count || 0;

    // Ticket promedio
    const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    return {
      totalRevenue: Number(totalRevenue),
      totalOrders,
      pendingOrders,
      totalProducts,
      totalUsers,
      totalReviews,
      avgRating: Math.round(Number(avgRating) * 10) / 10,
      totalWishlistItems,
      activeCoupons,
      avgTicket: Math.round(avgTicket * 100) / 100,
    };
  } catch (error) {
    console.error('Error al obtener métricas:', error);
    return {
      totalRevenue: 0,
      totalOrders: 0,
      pendingOrders: 0,
      totalProducts: 0,
      totalUsers: 0,
      totalReviews: 0,
      avgRating: 0,
      totalWishlistItems: 0,
      activeCoupons: 0,
      avgTicket: 0,
    };
  }
}

/**
 * Obtiene los productos más vendidos (con caché)
 */
export async function getTopSellingProducts(limit: number = 5) {
  return analyticsCache.topProducts('selling', async () => {
    return _getTopSellingProductsUncached(limit);
  });
}

/**
 * Versión sin caché de getTopSellingProducts
 */
async function _getTopSellingProductsUncached(limit: number = 5) {
  try {
    const topProducts = await db
      .select({
        productId: orderItems.productId,
        productName: products.name,
        totalSold: sql<number>`SUM(${orderItems.quantity})`,
        revenue: sql<number>`SUM(CAST(${orderItems.priceAtPurchase} AS DECIMAL) * ${orderItems.quantity})`,
      })
      .from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(sql`${orders.status} != 'cancelled'`)
      .groupBy(orderItems.productId, products.name)
      .orderBy(desc(sql`SUM(${orderItems.quantity})`))
      .limit(limit);

    return topProducts.map(p => ({
      id: p.productId,
      name: p.productName,
      totalSold: Number(p.totalSold),
      revenue: Number(p.revenue),
    }));
  } catch (error) {
    console.error('Error al obtener productos más vendidos:', error);
    return [];
  }
}

/**
 * Obtiene productos más agregados a wishlist (con caché)
 */
export async function getMostWishedProducts(limit: number = 5) {
  return analyticsCache.topProducts('wished', async () => {
    return _getMostWishedProductsUncached(limit);
  });
}

/**
 * Versión sin caché de getMostWishedProducts
 */
async function _getMostWishedProductsUncached(limit: number = 5) {
  try {
    const mostWished = await db
      .select({
        productId: wishlistItems.productId,
        productName: products.name,
        wishlistCount: count(),
      })
      .from(wishlistItems)
      .innerJoin(products, eq(wishlistItems.productId, products.id))
      .groupBy(wishlistItems.productId, products.name)
      .orderBy(desc(count()))
      .limit(limit);

    return mostWished.map(p => ({
      id: p.productId,
      name: p.productName,
      count: p.wishlistCount,
    }));
  } catch (error) {
    console.error('Error al obtener productos más deseados:', error);
    return [];
  }
}

/**
 * Obtiene productos mejor calificados (con caché)
 */
export async function getTopRatedProducts(limit: number = 5) {
  return analyticsCache.topProducts('rated', async () => {
    return _getTopRatedProductsUncached(limit);
  });
}

/**
 * Versión sin caché de getTopRatedProducts
 */
async function _getTopRatedProductsUncached(limit: number = 5) {
  try {
    const topRated = await db
      .select({
        productId: reviews.productId,
        productName: products.name,
        avgRating: sql<number>`AVG(${reviews.rating})`,
        reviewCount: count(),
      })
      .from(reviews)
      .innerJoin(products, eq(reviews.productId, products.id))
      .groupBy(reviews.productId, products.name)
      .having(sql`COUNT(*) >= 3`) // Al menos 3 reseñas
      .orderBy(desc(sql`AVG(${reviews.rating})`))
      .limit(limit);

    return topRated.map(p => ({
      id: p.productId,
      name: p.productName,
      avgRating: Math.round(Number(p.avgRating) * 10) / 10,
      reviewCount: p.reviewCount,
    }));
  } catch (error) {
    console.error('Error al obtener productos mejor calificados:', error);
    return [];
  }
}

/**
 * Obtiene ventas de los últimos 30 días (con caché)
 */
export async function getRecentSales(days: number = 30) {
  return analyticsCache.recentSales(days, async () => {
    return _getRecentSalesUncached(days);
  });
}

/**
 * Versión sin caché de getRecentSales
 */
async function _getRecentSalesUncached(days: number = 30) {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - days);

    const recentSales = await db
      .select({
        date: sql<string>`DATE(${orders.createdAt})`,
        revenue: sql<number>`SUM(CAST(${orders.total} AS DECIMAL))`,
        orderCount: count(),
      })
      .from(orders)
      .where(
        and(
          gte(orders.createdAt, thirtyDaysAgo),
          sql`${orders.status} != 'cancelled'`
        )
      )
      .groupBy(sql`DATE(${orders.createdAt})`)
      .orderBy(sql`DATE(${orders.createdAt})`);

    return recentSales.map(s => ({
      date: s.date,
      revenue: Number(s.revenue),
      orders: s.orderCount,
    }));
  } catch (error) {
    console.error('Error al obtener ventas recientes:', error);
    return [];
  }
}

/**
 * Obtiene tasa de conversión de wishlist a compra
 */
export async function getWishlistConversionRate() {
  try {
    // Usuarios con items en wishlist
    const usersWithWishlistResult = await db
      .select({ count: sql<number>`COUNT(DISTINCT ${wishlistItems.userId})` })
      .from(wishlistItems);
    
    const usersWithWishlist = Number(usersWithWishlistResult[0]?.count || 0);

    if (usersWithWishlist === 0) {
      return { rate: 0, usersWithWishlist: 0, usersPurchased: 0 };
    }

    // Usuarios que compraron productos que tenían en wishlist
    const usersPurchasedResult = await db
      .select({ 
        count: sql<number>`COUNT(DISTINCT ${orders.userId})` 
      })
      .from(orders)
      .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
      .innerJoin(
        wishlistItems, 
        and(
          eq(wishlistItems.userId, orders.userId),
          eq(wishlistItems.productId, orderItems.productId)
        )
      )
      .where(sql`${orders.status} != 'cancelled'`);
    
    const usersPurchased = Number(usersPurchasedResult[0]?.count || 0);

    const rate = (usersPurchased / usersWithWishlist) * 100;

    return {
      rate: Math.round(rate * 100) / 100,
      usersWithWishlist,
      usersPurchased,
    };
  } catch (error) {
    console.error('Error al calcular conversión de wishlist:', error);
    return { rate: 0, usersWithWishlist: 0, usersPurchased: 0 };
  }
}

/**
 * Obtiene cupones más utilizados
 */
export async function getMostUsedCoupons(limit: number = 5) {
  try {
    const mostUsed = await db
      .select({
        couponId: orders.couponId,
        couponCode: coupons.code,
        usageCount: count(),
        totalDiscount: sql<number>`SUM(CAST(${orders.discountAmount} AS DECIMAL))`,
      })
      .from(orders)
      .innerJoin(coupons, eq(orders.couponId, coupons.id))
      .where(sql`${orders.couponId} IS NOT NULL`)
      .groupBy(orders.couponId, coupons.code)
      .orderBy(desc(count()))
      .limit(limit);

    return mostUsed.map(c => ({
      id: c.couponId!,
      code: c.couponCode,
      uses: c.usageCount,
      totalDiscount: Number(c.totalDiscount),
    }));
  } catch (error) {
    console.error('Error al obtener cupones más usados:', error);
    return [];
  }
}
