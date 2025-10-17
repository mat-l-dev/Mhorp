// src/actions/order.ts
// Propósito: Server Actions para manejar los pedidos.
// Incluye crear pedidos, subir comprobantes de pago y actualizar estados.

'use server';

import { db } from '@/lib/db';
import { orders, orderItems } from '@/lib/db/schema';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from './auth';
import { type CartItem } from '@/lib/store/cart';

/**
 * Crea un nuevo pedido a partir del carrito actual
 */
export async function createOrder(items: CartItem[], totalAmount: number, shippingAddress: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Debes iniciar sesión para crear un pedido.' };
  }

  try {
    // Usamos una transacción para asegurar que todas las operaciones se completen o ninguna lo haga.
    const newOrder = await db.transaction(async (tx) => {
      // 1. Crear el registro principal del pedido
      const [order] = await tx
        .insert(orders)
        .values({
          userId: user.id,
          total: totalAmount.toString(),
          shippingAddress,
          shippingCity: 'Lima', // Por ahora usamos un valor por defecto
          shippingPhone: '999999999', // Por ahora usamos un valor por defecto
          status: 'awaiting_payment', // Estado inicial según nuestra máquina de estados
        })
        .returning();

      // 2. Crear los registros para cada item del pedido
      const itemsToInsert = items.map((item) => ({
        orderId: order.id,
        productId: item.product.id,
        quantity: item.quantity,
        priceAtPurchase: item.product.price, // Guardamos el precio al momento de la compra
      }));

      await tx.insert(orderItems).values(itemsToInsert);

      return order;
    });

    // Si la transacción fue exitosa, redirigimos a la página de confirmación
    // Esta redirección se captura en el cliente para limpiar el carrito.
    return { success: true, orderId: newOrder.id };

  } catch (error) {
    console.error('Error al crear el pedido:', error);
    return { error: 'No se pudo crear el pedido. Inténtalo de nuevo.' };
  }
}

/**
 * Sube el comprobante de pago de un pedido a Supabase Storage
 */
export async function uploadPaymentProof(orderId: string, file: File) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return { error: 'Debes iniciar sesión' };
    }

    const supabase = await createClient();

    // Generar nombre único para el archivo
    const fileName = `${orderId}_${Date.now()}_${file.name}`;
    const filePath = `payment-proofs/${user.id}/${fileName}`;

    // Subir archivo a Supabase Storage
    const { data, error } = await supabase.storage
      .from('orders')
      .upload(filePath, file);

    if (error) {
      return { error: 'Error al subir el comprobante' };
    }

    // TODO: Actualizar registro del pedido con la URL del comprobante
    // TODO: Actualizar estado del pedido a "payment_pending_verification"

    return { 
      success: true,
      filePath: data.path 
    };
  } catch (error) {
    return { error: 'Error al procesar el comprobante' };
  }
}

/**
 * Obtiene los pedidos del usuario actual
 */
export async function getUserOrders() {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return { orders: [] };
    }

    // TODO: Implementar lógica de obtener pedidos usando Drizzle
    // Incluir información de los items del pedido

    return { orders: [] };
  } catch (error) {
    return { error: 'Error al obtener pedidos' };
  }
}

/**
 * Obtiene un pedido específico por su ID
 */
export async function getOrderById(orderId: string) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return { error: 'Debes iniciar sesión' };
    }

    // TODO: Implementar lógica de obtener pedido usando Drizzle
    // Verificar que el pedido pertenezca al usuario
    // Incluir información completa de items y estado

    return { order: null };
  } catch (error) {
    return { error: 'Error al obtener el pedido' };
  }
}

/**
 * Actualiza el estado de un pedido (solo admin)
 */
export async function updateOrderStatus(orderId: string, status: string) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return { error: 'Debes iniciar sesión' };
    }

    // TODO: Verificar que el usuario sea admin
    // TODO: Implementar lógica de actualizar estado usando Drizzle
    // TODO: Enviar notificación al cliente (opcional)

    return { success: true };
  } catch (error) {
    return { error: 'Error al actualizar el estado del pedido' };
  }
}
