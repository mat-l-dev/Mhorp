// src/actions/product.ts
// Propósito: Server Actions para CRUD de productos (solo admin)
'use server';

import { db } from '@/lib/db';
import { products, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

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
  categoryId: z.coerce.number().nullable().optional(),
  images: z.string().optional().transform((str) => {
    if (!str) return null;
    try {
      return JSON.parse(str);
    } catch {
      return null;
    }
  }),
});

/**
 * Crea o actualiza un producto (upsert)
 */
export async function upsertProduct(prevState: unknown, formData: FormData) {
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

/**
 * Sube múltiples imágenes de productos a Supabase Storage
 * Retorna las URLs públicas de las imágenes subidas
 */
export async function uploadProductImages(formData: FormData) {
  if (!(await isAdmin())) {
    return { error: 'No autorizado' };
  }

  const files = formData.getAll('files') as File[];
  
  if (!files || files.length === 0) {
    return { error: 'No se proporcionaron archivos' };
  }

  const supabase = await createClient();
  const imageUrls: string[] = [];

  try {
    for (const file of files) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        return { error: `El archivo ${file.name} no es una imagen válida` };
      }

      // Validar tamaño (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        return { error: `El archivo ${file.name} excede el tamaño máximo de 5MB` };
      }

      // Generar nombre único para el archivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `products/${fileName}`;

      // Subir archivo a Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('product_images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Error al subir imagen:', uploadError);
        return { error: `No se pudo subir el archivo: ${file.name}` };
      }

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('product_images')
        .getPublicUrl(filePath);

      imageUrls.push(publicUrl);
    }

    return { success: true, urls: imageUrls };
  } catch (error) {
    console.error('Error en uploadProductImages:', error);
    return { error: 'Error al procesar las imágenes' };
  }
}
