// src/actions/dashboard.ts
// Propósito: Server Actions para obtener métricas del dashboard de administrador
'use server';

import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { orders, users, products } from '@/lib/db/schema';
import { createClient } from '@/lib/supabase/server';
import { eq } from 'drizzle-orm';

/**
 * Verifica si el usuario actual es administrador
 */
async function isAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return false;

  // Verificar por email de entorno
  if (process.env.ADMIN_EMAIL && user.email === process.env.ADMIN_EMAIL) {
    return true;
  }

  // Verificar por rol en base de datos
  const dbUser = await db.query.users.findFirst({
    where: eq(users.id, user.id),
  });

  return dbUser?.role === 'admin';
}

/**
 * Obtiene las métricas principales del dashboard
 */
export async function getDashboardMetrics() {
  if (!(await isAdmin())) {
    return { error: 'No autorizado' };
  }

  try {
    // Total de ingresos (solo pedidos completados/procesando/enviados)
    const revenueResult = await db
      .select({
        amount: sql<string>`COALESCE(SUM(${orders.total}), '0')`,
      })
      .from(orders)
      .where(
        sql`${orders.status} IN ('processing', 'shipped', 'delivered')`
      );

    // Total de pedidos
    const ordersResult = await db
      .select({
        count: sql<number>`COUNT(*)::int`,
      })
      .from(orders);

    // Total de clientes (usuarios con rol customer)
    const customersResult = await db
      .select({
        count: sql<number>`COUNT(*)::int`,
      })
      .from(users)
      .where(sql`${users.role} = 'customer'`);

    // Total de productos
    const productsResult = await db
      .select({
        count: sql<number>`COUNT(*)::int`,
      })
      .from(products);

    // Pedidos pendientes de revisión
    const pendingOrdersResult = await db
      .select({
        count: sql<number>`COUNT(*)::int`,
      })
      .from(orders)
      .where(sql`${orders.status} = 'awaiting_confirmation'`);

    // Productos con stock bajo (menos de 5 unidades)
    const lowStockResult = await db
      .select({
        count: sql<number>`COUNT(*)::int`,
      })
      .from(products)
      .where(sql`${products.stock} < 5 AND ${products.stock} > 0`);

    return {
      totalRevenue: parseFloat(revenueResult[0]?.amount || '0'),
      totalOrders: ordersResult[0]?.count || 0,
      totalCustomers: customersResult[0]?.count || 0,
      totalProducts: productsResult[0]?.count || 0,
      pendingOrders: pendingOrdersResult[0]?.count || 0,
      lowStockProducts: lowStockResult[0]?.count || 0,
    };
  } catch (error) {
    console.error('Error al obtener métricas:', error);
    return { error: 'Error al obtener las métricas del dashboard' };
  }
}

/**
 * Obtiene los últimos pedidos para el dashboard
 */
export async function getRecentOrders(limit: number = 5) {
  if (!(await isAdmin())) {
    return { error: 'No autorizado' };
  }

  try {
    const recentOrders = await db.query.orders.findMany({
      orderBy: (orders, { desc }) => [desc(orders.createdAt)],
      limit,
      with: {
        user: {
          columns: {
            email: true,
            name: true,
          },
        },
      },
    });

    return { orders: recentOrders };
  } catch (error) {
    console.error('Error al obtener pedidos recientes:', error);
    return { error: 'Error al obtener pedidos recientes' };
  }
}
