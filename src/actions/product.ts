// src/actions/product.ts
// Propósito: Server Actions para CRUD de productos usando ProductsService
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getProductsService } from '@/lib/services';
import { isAppError } from '@mhorp/services';
import type { CreateProductData, UpdateProductData, ProductFilters } from '@mhorp/services';

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
  const data = Object.fromEntries(formData.entries());
  const validated = productSchema.safeParse(data);

  if (!validated.success) {
    return { 
      error: validated.error.issues[0]?.message || 'Datos inválidos' 
    };
  }

  const productId = formData.get('id') as string | null;

  try {
    const productsService = await getProductsService();

    if (productId) {
      // Actualizar producto existente
      const updateData: UpdateProductData = {
        name: validated.data.name,
        description: validated.data.description,
        price: validated.data.price,
        stock: validated.data.stock,
        categoryId: validated.data.categoryId ?? undefined,
        images: validated.data.images ?? undefined,
      };
      
      await productsService.update(parseInt(productId), updateData);
    } else {
      // Crear nuevo producto
      const createData: CreateProductData = {
        name: validated.data.name,
        price: validated.data.price,
        description: validated.data.description,
        stock: validated.data.stock,
        categoryId: validated.data.categoryId ?? undefined,
        images: validated.data.images ?? undefined,
      };
      
      await productsService.create(createData);
    }

    revalidatePath('/admin/products');
    return { success: 'Producto guardado exitosamente' };
  } catch (error) {
    if (isAppError(error)) {
      return { error: error.message };
    }
    console.error('Error al guardar producto:', error);
    return { error: 'No se pudo guardar el producto' };
  }
}

/**
 * Elimina un producto por su ID
 */
export async function deleteProduct(productId: number) {
  try {
    const productsService = await getProductsService();
    await productsService.delete(productId);
    
    revalidatePath('/admin/products');
    return { success: 'Producto eliminado exitosamente' };
  } catch (error) {
    if (isAppError(error)) {
      return { error: error.message };
    }
    console.error('Error al eliminar producto:', error);
    return { error: 'No se pudo eliminar el producto' };
  }
}

/**
 * Obtiene un producto por su ID
 */
export async function getProductById(productId: string) {
  try {
    const productsService = await getProductsService();
    const product = await productsService.getById(parseInt(productId));
    
    return { product };
  } catch (error) {
    if (isAppError(error)) {
      return { error: error.message };
    }
    console.error('Error al obtener producto:', error);
    return { error: 'No se pudo obtener el producto' };
  }
}

/**
 * Sube múltiples imágenes de productos usando ProductsService
 * Retorna las URLs públicas de las imágenes subidas
 */
export async function uploadProductImages(formData: FormData) {
  const productId = formData.get('productId') as string;
  const files = formData.getAll('files') as File[];
  
  if (!productId) {
    return { error: 'ID de producto requerido' };
  }

  if (!files || files.length === 0) {
    return { error: 'No se proporcionaron archivos' };
  }

  try {
    const productsService = await getProductsService();
    const imageUrls = await productsService.uploadImages(parseInt(productId), files);
    
    revalidatePath('/admin/products');
    return { success: true, urls: imageUrls };
  } catch (error) {
    if (isAppError(error)) {
      return { error: error.message };
    }
    console.error('Error al subir imágenes:', error);
    return { error: 'Error al procesar las imágenes' };
  }
}

/**
 * Obtiene todos los productos con filtros y paginación
 */
export async function getProducts(
  filters: ProductFilters = {}, 
  page: number = 1, 
  limit: number = 20
) {
  try {
    const productsService = await getProductsService();
    const result = await productsService.getAll(filters, { page, limit });
    
    return { 
      products: result.products, 
      total: result.total,
      page: result.page,
      totalPages: result.totalPages
    };
  } catch (error) {
    if (isAppError(error)) {
      return { error: error.message };
    }
    console.error('Error al obtener productos:', error);
    return { error: 'No se pudieron obtener los productos' };
  }
}

/**
 * Busca productos por texto
 */
export async function searchProducts(query: string, limit: number = 10) {
  try {
    const productsService = await getProductsService();
    const products = await productsService.search(query, limit);
    
    return { products };
  } catch (error) {
    if (isAppError(error)) {
      return { error: error.message };
    }
    console.error('Error al buscar productos:', error);
    return { error: 'Error al buscar productos' };
  }
}

/**
 * Actualiza el stock de un producto
 */
export async function updateProductStock(productId: number, quantity: number) {
  try {
    const productsService = await getProductsService();
    const product = await productsService.updateStock(productId, quantity);
    
    revalidatePath('/admin/products');
    return { success: true, product };
  } catch (error) {
    if (isAppError(error)) {
      return { error: error.message };
    }
    console.error('Error al actualizar stock:', error);
    return { error: 'Error al actualizar el stock' };
  }
}
