// src/actions/cart.ts
// Propósito: Server Actions para manejar el carrito de compras.
// Incluye agregar, eliminar, actualizar cantidades y obtener el carrito.

'use server';

import { db } from '@/lib/db';
import { carts, cartItems } from '@/lib/db/schema';
import { getCurrentUser } from './auth';
import { createClient } from '@/lib/supabase/server';
import { eq, and } from 'drizzle-orm';

/**
 * Agrega un producto al carrito del usuario
 */
export async function addToCart(productId: number, quantity: number = 1) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return { error: 'Debes iniciar sesión para agregar productos al carrito' };
    }

    // Buscar o crear el carrito del usuario
    let userCart = await db.query.carts.findFirst({
      where: eq(carts.userId, user.id),
    });

    if (!userCart) {
      const [newCart] = await db.insert(carts).values({
        userId: user.id,
      }).returning();
      userCart = newCart;
    }

    // Verificar si el producto ya existe en el carrito
    const existingItem = await db.query.cartItems.findFirst({
      where: and(
        eq(cartItems.cartId, userCart.id),
        eq(cartItems.productId, productId)
      ),
    });

    if (existingItem) {
      // Actualizar cantidad
      await db
        .update(cartItems)
        .set({ quantity: existingItem.quantity + quantity })
        .where(eq(cartItems.id, existingItem.id));
    } else {
      // Crear nuevo item
      await db.insert(cartItems).values({
        cartId: userCart.id,
        productId,
        quantity,
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error al agregar al carrito:', error);
    return { error: 'Error al agregar producto al carrito' };
  }
}

/**
 * Obtiene el carrito del usuario actual
 */
export async function getCart() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const userCart = await db.query.carts.findFirst({
      where: eq(carts.userId, user.id),
      with: {
        items: { 
          with: { 
            product: true 
          } 
        },
      },
    });

    if (!userCart) return [];

    // Formatear los datos para que coincidan con el tipo CartItem de Zustand
    return userCart.items.map(item => ({
      product: item.product,
      quantity: item.quantity,
    }));
  } catch (error) {
    console.error('Error al obtener carrito:', error);
    return null;
  }
}

/**
 * Elimina un producto del carrito
 */
export async function removeFromCart(cartItemId: string) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return { error: 'Debes iniciar sesión' };
    }

    // TODO: Implementar lógica de eliminar del carrito usando Drizzle

    return { success: true };
  } catch (error) {
    return { error: 'Error al eliminar producto del carrito' };
  }
}

/**
 * Actualiza la cantidad de un producto en el carrito
 */
export async function updateCartItemQuantity(cartItemId: string, quantity: number) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return { error: 'Debes iniciar sesión' };
    }

    if (quantity < 1) {
      return { error: 'La cantidad debe ser mayor a 0' };
    }

    // TODO: Implementar lógica de actualizar cantidad usando Drizzle

    return { success: true };
  } catch (error) {
    return { error: 'Error al actualizar cantidad' };
  }
}

/**
 * Vacía completamente el carrito del usuario
 */
export async function clearCart() {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return { error: 'Debes iniciar sesión' };
    }

    // TODO: Implementar lógica de vaciar carrito usando Drizzle

    return { success: true };
  } catch (error) {
    return { error: 'Error al vaciar carrito' };
  }
}
