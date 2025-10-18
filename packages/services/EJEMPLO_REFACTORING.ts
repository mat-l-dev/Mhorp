// EJEMPLO: Cómo refactorizar actions/order.ts usando los servicios
// Este archivo muestra el ANTES y DESPUÉS

// ============================================
// ❌ ANTES (Acoplado)
// ============================================

/*
'use server';

import { db } from '@/lib/db';
import { orders, orderItems } from '@/lib/db/schema';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from './auth';
import { type CartItem } from '@/lib/store/cart';

export async function createOrder(items: CartItem[], totalAmount: number, shippingAddress: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Debes iniciar sesión para crear un pedido.' };
  }

  try {
    const newOrder = await db.transaction(async (tx) => {
      const [order] = await tx
        .insert(orders)
        .values({
          userId: user.id,
          total: totalAmount.toString(),
          shippingAddress,
          status: 'awaiting_payment',
        })
        .returning();

      const itemsToInsert = items.map((item) => ({
        orderId: order.id,
        productId: item.product.id,
        quantity: item.quantity,
        priceAtPurchase: item.product.price,
      }));

      await tx.insert(orderItems).values(itemsToInsert);

      return order;
    });

    return { success: true, orderId: newOrder.id };
  } catch (error) {
    console.error('Error al crear el pedido:', error);
    return { error: 'No se pudo crear el pedido.' };
  }
}
*/

// ============================================
// ✅ DESPUÉS (Desacoplado con Servicios)
// ============================================

'use server';

import { getOrdersService } from '@/lib/services';
import { type CartItem } from '@/lib/store/cart';
import { isAppError } from '@mhorp/services';
import { revalidatePath } from 'next/cache';

/**
 * Crea un nuevo pedido
 */
export async function createOrder(
  items: CartItem[],
  totalAmount: number,
  shippingAddress: string,
  shippingCity: string,
  shippingPhone: string
) {
  try {
    const ordersService = await getOrdersService();

    // Transformar CartItem[] a CreateOrderData
    const orderData = {
      items: items.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        priceAtPurchase: item.product.price,
      })),
      total: totalAmount.toString(),
      shippingAddress,
      shippingCity,
      shippingPhone,
    };

    const order = await ordersService.create(orderData);

    // Verificar si es primera compra (para referidos)
    const isFirstPurchase = await ordersService.isFirstPurchase(order.userId);
    if (isFirstPurchase) {
      console.log('✅ Primera compra detectada');
      // TODO: Llamar a completeReferral si existe
    }

    revalidatePath('/orders');
    return { success: true, orderId: order.id };

  } catch (error) {
    // Manejo de errores tipados
    if (isAppError(error)) {
      return { error: error.message, code: error.code };
    }
    console.error('Error al crear pedido:', error);
    return { error: 'No se pudo crear el pedido' };
  }
}

/**
 * Sube comprobante de pago
 */
export async function uploadPaymentProof(orderId: string, file: File) {
  try {
    const ordersService = await getOrdersService();

    const result = await ordersService.uploadProof(orderId, file);

    revalidatePath(`/orders/${orderId}`);
    return { 
      success: true, 
      filePath: result.path,
      signedUrl: result.signedUrl 
    };

  } catch (error) {
    if (isAppError(error)) {
      return { error: error.message, code: error.code };
    }
    return { error: 'Error al subir comprobante' };
  }
}

/**
 * Obtiene órdenes del usuario
 */
export async function getUserOrders() {
  try {
    const ordersService = await getOrdersService();
    const orders = await ordersService.getByUser();

    return { orders };

  } catch (error) {
    if (isAppError(error)) {
      return { error: error.message };
    }
    return { error: 'Error al obtener órdenes' };
  }
}

/**
 * Obtiene una orden específica
 */
export async function getOrderById(orderId: string) {
  try {
    const ordersService = await getOrdersService();
    const order = await ordersService.getById(orderId);

    return { order };

  } catch (error) {
    if (isAppError(error)) {
      return { error: error.message };
    }
    return { error: 'Error al obtener orden' };
  }
}

/**
 * Aprueba un pago (admin)
 */
export async function approvePayment(orderId: string) {
  try {
    const ordersService = await getOrdersService();
    await ordersService.approvePayment(orderId);

    revalidatePath('/admin/orders');
    revalidatePath(`/orders/${orderId}`);
    return { success: true };

  } catch (error) {
    if (isAppError(error)) {
      return { error: error.message };
    }
    return { error: 'Error al aprobar pago' };
  }
}

/**
 * Rechaza un pago (admin)
 */
export async function rejectPayment(orderId: string, reason?: string) {
  try {
    const ordersService = await getOrdersService();
    await ordersService.rejectPayment(orderId, reason);

    revalidatePath('/admin/orders');
    revalidatePath(`/orders/${orderId}`);
    return { success: true };

  } catch (error) {
    if (isAppError(error)) {
      return { error: error.message };
    }
    return { error: 'Error al rechazar pago' };
  }
}

/**
 * Obtiene órdenes pendientes de verificación (admin)
 */
export async function getPendingOrders() {
  try {
    const ordersService = await getOrdersService();
    const orders = await ordersService.getPendingVerification();

    return { orders };

  } catch (error) {
    if (isAppError(error)) {
      return { error: error.message };
    }
    return { error: 'Error al obtener órdenes pendientes' };
  }
}

// ============================================
// BENEFICIOS de esta refactorización:
// ============================================

// 1. ✅ TESTEABLE: Puedes mockear getOrdersService() fácilmente
// 2. ✅ TYPE-SAFE: Errores tipados (UnauthorizedError, ForbiddenError, etc.)
// 3. ✅ DESACOPLADO: No depende de implementación de Supabase/Drizzle
// 4. ✅ REUTILIZABLE: Misma lógica en web, mobile, admin, etc.
// 5. ✅ MANTENIBLE: Cambios en lógica solo afectan al servicio
// 6. ✅ DOCUMENTADO: JSDoc en servicios + tipos explícitos
