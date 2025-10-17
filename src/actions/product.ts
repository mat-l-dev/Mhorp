// src/actions/product.ts
// Propósito: Server Actions para CRUD de productos (solo admin)
'use server';

import { db } from '@/lib/db';
import { products, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

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
 * Esquema de validación para productos
 */
const productSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  description: z.string().optional(),
  price: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: 'El precio debe ser mayor a 0',
  }),
  stock: z.coerce.number().int().nonnegative('El stock no puede ser negativo'),
  images: z.array(z.string()).optional(),
});

/**
 * Crea o actualiza un producto (upsert)
 */
export async function upsertProduct(prevState: any, formData: FormData) {
  if (!(await isAdmin())) {
    return { error: 'No autorizado' };
  }

  const data = Object.fromEntries(formData.entries());
  const validated = productSchema.safeParse(data);

  if (!validated.success) {
    return { 
      error: validated.error.issues[0]?.message || 'Datos inválidos' 
    };
  }

  const productId = formData.get('id') as string | null;

  try {
    if (productId) {
      // Actualizar producto existente
      await db
        .update(products)
        .set({
          ...validated.data,
          updatedAt: new Date(),
        })
        .where(eq(products.id, parseInt(productId)));
    } else {
      // Crear nuevo producto
      await db.insert(products).values(validated.data);
    }

    revalidatePath('/admin/products');
    return { success: 'Producto guardado exitosamente' };
  } catch (error) {
    console.error('Error al guardar producto:', error);
    return { error: 'No se pudo guardar el producto' };
  }
}

/**
 * Elimina un producto por su ID
 */
export async function deleteProduct(productId: number) {
  if (!(await isAdmin())) {
    return { error: 'No autorizado' };
  }

  try {
    await db.delete(products).where(eq(products.id, productId));
    revalidatePath('/admin/products');
    return { success: 'Producto eliminado exitosamente' };
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    return { error: 'No se pudo eliminar el producto' };
  }
}

/**
 * Obtiene un producto por su ID
 */
export async function getProductById(productId: string) {
  if (!(await isAdmin())) {
    return { error: 'No autorizado' };
  }

  try {
    const product = await db.query.products.findFirst({
      where: eq(products.id, parseInt(productId)),
    });

    if (!product) {
      return { error: 'Producto no encontrado' };
    }

    return { product };
  } catch (error) {
    console.error('Error al obtener producto:', error);
    return { error: 'No se pudo obtener el producto' };
  }
}
