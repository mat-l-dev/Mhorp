// src/actions/category.ts
// Propósito: Server Actions para CRUD de categorías (solo admin)
'use server';

import { db } from '@/lib/db';
import { categories, users } from '@/lib/db/schema';
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
 * Esquema de validación para categorías
 */
const categorySchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  description: z.string().optional(),
});

/**
 * Crea o actualiza una categoría (upsert)
 */
export async function upsertCategory(prevState: any, formData: FormData) {
  if (!(await isAdmin())) {
    return { error: 'No autorizado' };
  }

  const data = Object.fromEntries(formData.entries());
  const validated = categorySchema.safeParse(data);

  if (!validated.success) {
    return { 
      error: validated.error.issues[0]?.message || 'Datos inválidos' 
    };
  }

  const categoryId = formData.get('id') as string | null;

  try {
    if (categoryId) {
      // Actualizar categoría existente
      await db
        .update(categories)
        .set({
          ...validated.data,
          updatedAt: new Date(),
        })
        .where(eq(categories.id, parseInt(categoryId)));
    } else {
      // Crear nueva categoría
      await db.insert(categories).values(validated.data);
    }

    revalidatePath('/admin/categories');
    return { success: 'Categoría guardada exitosamente' };
  } catch (error: any) {
    console.error('Error al guardar categoría:', error);
    
    // Manejar error de duplicado
    if (error?.code === '23505') {
      return { error: 'Ya existe una categoría con ese nombre' };
    }
    
    return { error: 'No se pudo guardar la categoría' };
  }
}

/**
 * Elimina una categoría por su ID
 */
export async function deleteCategory(categoryId: number) {
  if (!(await isAdmin())) {
    return { error: 'No autorizado' };
  }

  try {
    await db.delete(categories).where(eq(categories.id, categoryId));
    revalidatePath('/admin/categories');
    return { success: 'Categoría eliminada exitosamente' };
  } catch (error: any) {
    console.error('Error al eliminar categoría:', error);
    
    // Manejar error de clave foránea
    if (error?.code === '23503') {
      return { error: 'No se puede eliminar: hay productos asociados a esta categoría' };
    }
    
    return { error: 'No se pudo eliminar la categoría' };
  }
}

/**
 * Obtiene una categoría por su ID
 */
export async function getCategoryById(categoryId: string) {
  if (!(await isAdmin())) {
    return null;
  }

  try {
    const category = await db.query.categories.findFirst({
      where: eq(categories.id, parseInt(categoryId)),
    });

    return category;
  } catch (error) {
    console.error('Error al obtener categoría:', error);
    return null;
  }
}
