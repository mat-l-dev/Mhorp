// src/actions/order.ts
// Propósito: Server Actions para manejar los pedidos.
// Incluye crear pedidos, subir comprobantes de pago y actualizar estados.

'use server';

import { db } from '@/lib/db';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from './auth';
import { clearCart } from './cart';

/**
 * Crea un nuevo pedido a partir del carrito actual
 */
export async function createOrder(shippingData: {
  address: string;
  city: string;
  postalCode: string;
  phone: string;
}) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return { error: 'Debes iniciar sesión para crear un pedido' };
    }

    // TODO: Implementar lógica de crear pedido
    // 1. Obtener items del carrito
    // 2. Calcular total
    // 3. Crear registro de orden en la BD
    // 4. Crear registros de order_items
    // 5. Vaciar carrito
    // 6. Enviar email de confirmación (opcional)

    await clearCart();

    return { 
      success: true,
      orderId: 'ORDER_ID_PLACEHOLDER' 
    };
  } catch (error) {
    return { error: 'Error al crear el pedido' };
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
