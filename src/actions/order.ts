// src/actions/order.ts
// Propósito: Server Actions para manejar los pedidos.
// REFACTORIZADO: Ahora usa OrdersService y StorageService (Service Layer Pattern)

'use server';

import { getOrdersService } from '@/lib/services';
import { type CartItem } from '@/lib/store/cart';
import { revalidatePath } from 'next/cache';
import { completeReferral } from './referral';
import { isAppError, type OrderStatus } from '@mhorp/services';

/**
 * Crea un nuevo pedido a partir del carrito actual
 */
export async function createOrder(items: CartItem[], totalAmount: number, shippingAddress: string) {
  try {
    const ordersService = await getOrdersService();

    // Transformar items del carrito al formato esperado por el servicio
    const orderItems = items.map((item) => ({
      productId: item.product.id,
      quantity: item.quantity,
      priceAtPurchase: item.product.price,
    }));

    // Usar el servicio para crear el pedido
    const newOrder = await ordersService.create({
      items: orderItems,
      total: totalAmount.toFixed(2),
      shippingAddress,
      shippingCity: 'Lima', // Por ahora valor por defecto
      shippingPhone: '999999999', // Por ahora valor por defecto
    });

    // Verificar si es la primera compra (para referidos)
    try {
      const isFirstPurchase = await ordersService.isFirstPurchase(newOrder.userId);
      
      if (isFirstPurchase) {
        // newOrder.id ya es number (tipo Order.id)
        await completeReferral(newOrder.userId, newOrder.id, totalAmount.toString());
        console.log('✅ Primera compra detectada - verificando referido');
      }
    } catch (referralError) {
      // No fallar la orden si hay error en referidos
      console.error('Error al procesar referido:', referralError);
    }

    return { success: true, orderId: newOrder.id };

  } catch (error) {
    console.error('Error al crear el pedido:', error);
    
    // Manejo de errores tipados
    if (isAppError(error)) {
      return { error: error.message };
    }
    
    return { error: 'No se pudo crear el pedido. Inténtalo de nuevo.' };
  }
}


/**
 * Sube el comprobante de pago de un pedido
 */
export async function uploadPaymentProof(orderId: string, file: File) {
  try {
    const ordersService = await getOrdersService();

    // Usar el servicio para subir el comprobante
    const result = await ordersService.uploadProof(orderId, file);

    return { 
      success: true,
      filePath: result.path,
      signedUrl: result.signedUrl,
    };
    
  } catch (error) {
    console.error('Error al subir comprobante:', error);
    
    if (isAppError(error)) {
      return { error: error.message };
    }
    
    return { error: 'Error al procesar el comprobante' };
  }
}

/**
 * Obtiene los pedidos del usuario actual
 */
export async function getUserOrders() {
  try {
    const ordersService = await getOrdersService();
    
    const userOrders = await ordersService.getByUser();
    
    return { orders: userOrders };
    
  } catch (error) {
    console.error('Error al obtener pedidos:', error);
    
    if (isAppError(error)) {
      return { error: error.message };
    }
    
    return { error: 'Error al obtener pedidos' };
  }
}

/**
 * Obtiene un pedido específico por su ID
 */
export async function getOrderById(orderId: string) {
  try {
    const ordersService = await getOrdersService();
    
    const order = await ordersService.getById(orderId);
    
    return { order };
    
  } catch (error) {
    console.error('Error al obtener pedido:', error);
    
    if (isAppError(error)) {
      return { error: error.message };
    }
    
    return { error: 'Error al obtener el pedido' };
  }
}

/**
 * Actualiza el estado de un pedido (solo admin)
 */
export async function updateOrderStatus(orderId: string, status: string) {
  try {
    const ordersService = await getOrdersService();
    
    // Validar que el status sea válido
    const validStatuses: OrderStatus[] = [
      'awaiting_payment',
      'payment_pending_verification',
      'payment_confirmed',
      'processing',
      'shipped',
      'delivered',
      'cancelled'
    ];
    
    if (!validStatuses.includes(status as OrderStatus)) {
      return { error: 'Estado inválido' };
    }
    
    await ordersService.updateStatus(orderId, status as OrderStatus);
    
    revalidatePath('/admin/orders');
    revalidatePath('/account/orders');
    
    return { success: true };
    
  } catch (error) {
    console.error('Error al actualizar estado:', error);
    
    if (isAppError(error)) {
      return { error: error.message };
    }
    
    return { error: 'Error al actualizar el estado del pedido' };
  }
}


/**
 * Sube un comprobante de pago para un pedido (usando FormData)
 */
export async function uploadProof(formData: FormData) {
  const orderId = formData.get('orderId') as string;
  const file = formData.get('file') as File;

  if (!orderId || !file) {
    return { error: 'Faltan datos para subir el comprobante.' };
  }

  try {
    const ordersService = await getOrdersService();
    
    const result = await ordersService.uploadProof(orderId, file);

    revalidatePath('/account/orders');
    
    return { 
      success: 'Comprobante subido con éxito.',
      filePath: result.path,
    };
    
  } catch (error) {
    console.error('Error al subir comprobante:', error);
    
    if (isAppError(error)) {
      return { error: error.message };
    }
    
    return { error: 'No se pudo registrar el comprobante.' };
  }
}

/**
 * Obtiene todos los pedidos pendientes de confirmación (solo admin)
 */
export async function getPendingOrders() {
  try {
    const ordersService = await getOrdersService();
    
    const pendingOrders = await ordersService.getPendingVerification();
    
    return { orders: pendingOrders };
    
  } catch (error) {
    console.error('Error al obtener pedidos pendientes:', error);
    
    if (isAppError(error)) {
      return { error: error.message };
    }
    
    return { error: 'Error al obtener pedidos' };
  }
}


/**
 * Aprueba un pedido y su comprobante de pago (solo admin)
 */
export async function approveOrder(orderId: number, proofId: number) {
  try {
    const ordersService = await getOrdersService();
    
    await ordersService.approvePayment(orderId.toString(), proofId);

    revalidatePath('/admin/orders');
    revalidatePath('/account/orders');
    
    return { success: 'Pedido aprobado exitosamente.' };
    
  } catch (error) {
    console.error('Error al aprobar pedido:', error);
    
    if (isAppError(error)) {
      return { error: error.message };
    }
    
    return { error: 'Error al aprobar el pedido' };
  }
}

/**
 * Rechaza un pedido y su comprobante de pago (solo admin)
 */
export async function rejectOrder(orderId: number, proofId: number, reason: string) {
  try {
    const ordersService = await getOrdersService();
    
    await ordersService.rejectPayment(orderId.toString(), proofId, reason);

    revalidatePath('/admin/orders');
    revalidatePath('/account/orders');
    
    return { success: 'Pedido rechazado. El cliente deberá subir un nuevo comprobante.' };
    
  } catch (error) {
    console.error('Error al rechazar pedido:', error);
    
    if (isAppError(error)) {
      return { error: error.message };
    }
    
    return { error: 'Error al rechazar el pedido' };
  }
}
