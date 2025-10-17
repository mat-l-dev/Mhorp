// src/actions/order.ts
// Propósito: Server Actions para manejar los pedidos.
// Incluye crear pedidos, subir comprobantes de pago y actualizar estados.

'use server';

import { db } from '@/lib/db';
import { orders, orderItems, paymentProofs } from '@/lib/db/schema';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from './auth';
import { type CartItem } from '@/lib/store/cart';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

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
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Usuario no autenticado.' };
  }

  const userOrders = await db.query.orders.findMany({
    where: eq(orders.userId, user.id),
    orderBy: (orders, { desc }) => [desc(orders.createdAt)],
    with: {
      items: { with: { product: true } },
      paymentProofs: true,
    },
  });

  return { orders: userOrders };
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

/**
 * Sube un comprobante de pago para un pedido
 */
export async function uploadProof(formData: FormData) {
  const orderId = formData.get('orderId') as string;
  const file = formData.get('file') as File;

  if (!orderId || !file) {
    return { error: 'Faltan datos para subir el comprobante.' };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Usuario no autenticado.' };
  }

  // Lógica de seguridad: verificar que el pedido pertenece al usuario
  const order = await db.query.orders.findFirst({ 
    where: and(eq(orders.id, parseInt(orderId)), eq(orders.userId, user.id)) 
  });
  
  if (!order) {
    return { error: 'Pedido no encontrado o no autorizado.' };
  }

  // Subir archivo a Supabase Storage
  const fileExt = file.name.split('.').pop();
  const fileName = `${user.id}-${orderId}-${Date.now()}.${fileExt}`;
  const filePath = `proofs/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('payment_proofs') // Asegúrate de crear este bucket en Supabase!
    .upload(filePath, file);

  if (uploadError) {
    console.error('Error de Supabase Storage:', uploadError);
    return { error: 'No se pudo subir el archivo.' };
  }

  // Actualizar la base de datos
  try {
    await db.transaction(async (tx) => {
      await tx.insert(paymentProofs).values({
        orderId: parseInt(orderId),
        userId: user.id,
        filePath: filePath,
      });

      await tx.update(orders)
        .set({ status: 'awaiting_confirmation' })
        .where(eq(orders.id, parseInt(orderId)));
    });

    revalidatePath('/account/orders');
    return { success: 'Comprobante subido con éxito.' };

  } catch (dbError) {
    console.error('Error de base de datos:', dbError);
    return { error: 'No se pudo registrar el comprobante.' };
  }
}

