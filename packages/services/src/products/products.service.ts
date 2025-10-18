// packages/services/src/products/products.service.ts
// Propósito: Servicio centralizado para gestión de productos

import type { DrizzleClient } from '../common/types';
import type { AuthService } from '../auth/auth.service';
import type { StorageService } from '../storage/storage.service';
import {
  NotFoundError,
  ValidationError,
  BusinessError,
} from '../common/errors';
import { eq, like, or, and, desc, asc, sql } from 'drizzle-orm';

/**
 * Interfaz para un producto
 */
export interface Product {
  id: number;
  name: string;
  description?: string | null;
  price: string;
  images?: string[] | null;
  stock: number;
  categoryId?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interfaz para producto con relaciones
 */
export interface ProductWithRelations extends Product {
  category?: {
    id: number;
    name: string;
    slug: string;
  } | null;
  reviews?: Array<{
    id: number;
    rating: number;
    comment?: string | null;
    userId: string;
    createdAt: Date;
  }>;
}

/**
 * Datos para crear un producto
 */
export interface CreateProductData {
  name: string;
  description?: string;
  price: string;
  stock?: number;
  categoryId?: number;
  images?: string[];
}

/**
 * Datos para actualizar un producto
 */
export interface UpdateProductData {
  name?: string;
  description?: string;
  price?: string;
  stock?: number;
  categoryId?: number;
  images?: string[];
}

/**
 * Filtros para búsqueda de productos
 */
export interface ProductFilters {
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  search?: string;
}

/**
 * Opciones de paginación
 */
export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'price' | 'createdAt' | 'stock';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Resultado paginado
 */
export interface PaginatedProducts {
  products: ProductWithRelations[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Servicio para gestionar productos
 */
export class ProductsService {
  constructor(
    private db: DrizzleClient,
    private auth: AuthService,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private productsTable: any,
    private storage?: StorageService
  ) {}

  /**
   * Crea un nuevo producto (solo admin)
   */
  async create(data: CreateProductData): Promise<Product> {
    await this.auth.requireAdmin();

    // Validar datos
    if (!data.name || data.name.trim().length < 3) {
      throw new ValidationError('El nombre debe tener al menos 3 caracteres');
    }

    const price = parseFloat(data.price);
    if (isNaN(price) || price <= 0) {
      throw new ValidationError('El precio debe ser mayor a 0');
    }

    if (data.stock !== undefined && data.stock < 0) {
      throw new ValidationError('El stock no puede ser negativo');
    }

    try {
      const [product] = await this.db
        .insert(this.productsTable)
        .values({
          name: data.name.trim(),
          description: data.description?.trim() || null,
          price: data.price,
          stock: data.stock ?? 0,
          categoryId: data.categoryId ?? null,
          images: data.images ?? null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return product as Product;
    } catch (error) {
      console.error('Error creating product:', error);
      throw new BusinessError('No se pudo crear el producto');
    }
  }

  /**
   * Actualiza un producto existente (solo admin)
   */
  async update(
    productId: number,
    data: UpdateProductData
  ): Promise<Product> {
    await this.auth.requireAdmin();

    // Verificar que el producto existe
    const existing = await this.getById(productId);
    if (!existing) {
      throw new NotFoundError('Producto', productId.toString());
    }

    // Validar datos si se proporcionan
    if (data.name !== undefined && data.name.trim().length < 3) {
      throw new ValidationError('El nombre debe tener al menos 3 caracteres');
    }

    if (data.price !== undefined) {
      const price = parseFloat(data.price);
      if (isNaN(price) || price <= 0) {
        throw new ValidationError('El precio debe ser mayor a 0');
      }
    }

    if (data.stock !== undefined && data.stock < 0) {
      throw new ValidationError('El stock no puede ser negativo');
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateData: any = {
        updatedAt: new Date(),
      };

      if (data.name !== undefined) updateData.name = data.name.trim();
      if (data.description !== undefined) updateData.description = data.description?.trim() || null;
      if (data.price !== undefined) updateData.price = data.price;
      if (data.stock !== undefined) updateData.stock = data.stock;
      if (data.categoryId !== undefined) updateData.categoryId = data.categoryId ?? null;
      if (data.images !== undefined) updateData.images = data.images;

      const [product] = await this.db
        .update(this.productsTable)
        .set(updateData)
        .where(eq(this.productsTable.id, productId))
        .returning();

      return product as Product;
    } catch (error) {
      console.error('Error updating product:', error);
      throw new BusinessError('No se pudo actualizar el producto');
    }
  }

  /**
   * Elimina un producto (solo admin)
   * Por ahora es hard delete, puede cambiarse a soft delete agregando un campo deletedAt
   */
  async delete(productId: number): Promise<void> {
    await this.auth.requireAdmin();

    // Verificar que existe
    const existing = await this.getById(productId);
    if (!existing) {
      throw new NotFoundError('Producto', productId.toString());
    }

    try {
      await this.db
        .delete(this.productsTable)
        .where(eq(this.productsTable.id, productId));
    } catch (error) {
      console.error('Error deleting product:', error);
      throw new BusinessError('No se pudo eliminar el producto');
    }
  }

  /**
   * Obtiene un producto por ID (público)
   */
  async getById(productId: number): Promise<ProductWithRelations | null> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const product = await (this.db as any).query.products.findFirst({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        where: (products: any, { eq }: any) => eq(products.id, productId),
        with: {
          category: true,
          reviews: {
            limit: 10,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            orderBy: (reviews: any, { desc }: any) => [desc(reviews.createdAt)],
          },
        },
      });

      return product as ProductWithRelations | null;
    } catch (error) {
      console.error('Error getting product by id:', error);
      return null;
    }
  }

  /**
   * Obtiene todos los productos con filtros y paginación (público)
   */
  async getAll(
    filters: ProductFilters = {},
    pagination: PaginationOptions = {}
  ): Promise<PaginatedProducts> {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 20;
    const sortBy = pagination.sortBy ?? 'createdAt';
    const sortOrder = pagination.sortOrder ?? 'desc';
    const offset = (page - 1) * limit;

    try {
      // Construir condiciones WHERE
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const conditions: any[] = [];

      if (filters.categoryId) {
        conditions.push(eq(this.productsTable.categoryId, filters.categoryId));
      }

      if (filters.inStock) {
        conditions.push(sql`${this.productsTable.stock} > 0`);
      }

      if (filters.minPrice !== undefined) {
        conditions.push(sql`CAST(${this.productsTable.price} AS DECIMAL) >= ${filters.minPrice}`);
      }

      if (filters.maxPrice !== undefined) {
        conditions.push(sql`CAST(${this.productsTable.price} AS DECIMAL) <= ${filters.maxPrice}`);
      }

      if (filters.search) {
        conditions.push(
          or(
            like(this.productsTable.name, `%${filters.search}%`),
            like(this.productsTable.description, `%${filters.search}%`)
          )
        );
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Determinar orden
      const orderByClause = sortOrder === 'asc' 
        ? asc(this.productsTable[sortBy])
        : desc(this.productsTable[sortBy]);

      // Obtener productos con query API
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const products = await (this.db as any).query.products.findMany({
        where: whereClause,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        orderBy: (_products: any) => orderByClause,
        limit,
        offset,
        with: {
          category: true,
        },
      });

      // Contar total
      const countResult = await this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(this.productsTable)
        .where(whereClause);

      const total = countResult[0]?.count ?? 0;
      const totalPages = Math.ceil(total / limit);

      return {
        products: products as ProductWithRelations[],
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      console.error('Error getting products:', error);
      return {
        products: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      };
    }
  }

  /**
   * Busca productos por texto (público)
   */
  async search(query: string, limit: number = 10): Promise<ProductWithRelations[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const products = await (this.db as any).query.products.findMany({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        where: (products: any, { or, like }: any) => 
          or(
            like(products.name, `%${query}%`),
            like(products.description, `%${query}%`)
          ),
        limit,
        with: {
          category: true,
        },
      });

      return products as ProductWithRelations[];
    } catch (error) {
      console.error('Error searching products:', error);
      return [];
    }
  }

  /**
   * Sube imágenes para un producto (solo admin)
   */
  async uploadImages(productId: number, files: File[]): Promise<string[]> {
    await this.auth.requireAdmin();

    if (!this.storage) {
      throw new BusinessError('StorageService no configurado');
    }

    if (!files || files.length === 0) {
      throw new ValidationError('No se proporcionaron archivos');
    }

    // Verificar que el producto existe
    const product = await this.getById(productId);
    if (!product) {
      throw new NotFoundError('Producto', productId.toString());
    }

    const imageUrls: string[] = [];

    try {
      for (const file of files) {
        const result = await this.storage.uploadProductImage(file, product.name);
        if (result.publicUrl) {
          imageUrls.push(result.publicUrl);
        }
      }

      // Actualizar producto con las nuevas URLs
      const currentImages = product.images ?? [];
      const updatedImages = [...currentImages, ...imageUrls];

      await this.update(productId, { images: updatedImages });

      return imageUrls;
    } catch (error) {
      console.error('Error uploading product images:', error);
      throw new BusinessError('No se pudieron subir las imágenes');
    }
  }

  /**
   * Actualiza el stock de un producto (admin)
   */
  async updateStock(productId: number, quantity: number): Promise<Product> {
    await this.auth.requireAdmin();

    if (quantity < 0) {
      throw new ValidationError('El stock no puede ser negativo');
    }

    return this.update(productId, { stock: quantity });
  }

  /**
   * Incrementa/decrementa el stock (útil para órdenes)
   */
  async adjustStock(productId: number, delta: number): Promise<Product> {
    const product = await this.getById(productId);
    
    if (!product) {
      throw new NotFoundError('Producto', productId.toString());
    }

    const newStock = product.stock + delta;
    
    if (newStock < 0) {
      throw new BusinessError('Stock insuficiente');
    }

    await this.auth.requireAdmin();
    
    return this.update(productId, { stock: newStock });
  }
}
