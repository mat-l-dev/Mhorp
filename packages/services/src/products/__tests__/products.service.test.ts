// packages/services/src/products/__tests__/products.service.test.ts
// Propósito: Unit tests para ProductsService

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProductsService } from '../products.service';
import { createMockDb, mockFindFirst, mockFindMany, mockInsert, mockUpdate, mockDelete } from '../../__mocks__/db.mock';
import { createMockAuthService, mockAdminUser, mockRegularUser } from '../../__mocks__/services.mock';
import { createMockStorageService } from '../../__mocks__/services.mock';
import { NotFoundError, ValidationError, ForbiddenError } from '../../common/errors';
import type { DrizzleClient } from '../../common/types';

describe('ProductsService', () => {
  let productsService: ProductsService;
  let mockDb: DrizzleClient;
  let mockAuth: ReturnType<typeof createMockAuthService>;
  let mockStorage: ReturnType<typeof createMockStorageService>;
  let mockProductsTable: unknown;

  beforeEach(() => {
    mockDb = createMockDb();
    mockAuth = createMockAuthService();
    mockStorage = createMockStorageService();
    mockProductsTable = {};
    productsService = new ProductsService(mockDb, mockAuth as never, mockProductsTable, mockStorage as never);
  });

  describe('create', () => {
    it('should create product when user is admin', async () => {
      mockAdminUser(mockAuth);

      const productData = {
        name: 'Test Product',
        description: 'Test description',
        price: '99.99',
        stock: 10,
        categoryId: 1,
      };

      const mockProduct = {
        id: 1,
        ...productData,
        images: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockInsert(mockDb, mockProduct);

      const result = await productsService.create(productData);

      expect(result).toEqual(mockProduct);
      expect(mockAuth.requireAdmin).toHaveBeenCalled();
    });

    it('should throw ValidationError for invalid name', async () => {
      mockAdminUser(mockAuth);

      await expect(
        productsService.create({
          name: 'ab', // Too short
          price: '10',
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid price', async () => {
      mockAdminUser(mockAuth);

      await expect(
        productsService.create({
          name: 'Valid Name',
          price: '0', // Price must be > 0
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for negative stock', async () => {
      mockAdminUser(mockAuth);

      await expect(
        productsService.create({
          name: 'Valid Name',
          price: '10',
          stock: -5,
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ForbiddenError when user is not admin', async () => {
      mockRegularUser(mockAuth);
      vi.mocked(mockAuth.requireAdmin).mockRejectedValue(
        new ForbiddenError('Se requieren permisos de administrador')
      );

      await expect(
        productsService.create({
          name: 'Test Product',
          price: '10',
        })
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('update', () => {
    it('should update product when user is admin', async () => {
      mockAdminUser(mockAuth);

      const mockProduct = {
        id: 1,
        name: 'Updated Product',
        description: 'Updated description',
        price: '149.99',
        stock: 20,
        categoryId: 1,
        images: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockFindFirst(mockDb, 'products', { id: 1, name: 'Old Product' });
      mockUpdate(mockDb, mockProduct);

      const result = await productsService.update(1, {
        name: 'Updated Product',
        price: '149.99',
      });

      expect(result).toEqual(mockProduct);
      expect(mockAuth.requireAdmin).toHaveBeenCalled();
    });

    it('should throw NotFoundError when product does not exist', async () => {
      mockAdminUser(mockAuth);
      mockFindFirst(mockDb, 'products', null);

      await expect(
        productsService.update(999, { name: 'Updated' })
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError for invalid update data', async () => {
      mockAdminUser(mockAuth);
      mockFindFirst(mockDb, 'products', { id: 1 });

      await expect(
        productsService.update(1, { name: 'ab' }) // Too short
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('delete', () => {
    it('should delete product when user is admin', async () => {
      mockAdminUser(mockAuth);
      mockFindFirst(mockDb, 'products', { id: 1, name: 'Test Product' });
      mockDelete(mockDb);

      await expect(productsService.delete(1)).resolves.not.toThrow();
      expect(mockAuth.requireAdmin).toHaveBeenCalled();
    });

    it('should throw NotFoundError when product does not exist', async () => {
      mockAdminUser(mockAuth);
      mockFindFirst(mockDb, 'products', null);

      await expect(productsService.delete(999)).rejects.toThrow(NotFoundError);
    });
  });

  describe('getById', () => {
    it('should return product with relations', async () => {
      const mockProduct = {
        id: 1,
        name: 'Test Product',
        description: 'Test description',
        price: '99.99',
        stock: 10,
        categoryId: 1,
        images: ['img1.jpg', 'img2.jpg'],
        createdAt: new Date(),
        updatedAt: new Date(),
        category: {
          id: 1,
          name: 'Category 1',
          slug: 'category-1',
        },
        reviews: [],
      };

      mockFindFirst(mockDb, 'products', mockProduct);

      const result = await productsService.getById(1);

      expect(result).toEqual(mockProduct);
    });

    it('should throw NotFoundError when product not found', async () => {
      mockFindFirst(mockDb, 'products', null);

      await expect(productsService.getById(999)).rejects.toThrow(NotFoundError);
    });
  });

  describe('getAll', () => {
    it('should return paginated products', async () => {
      const mockProducts = [
        { id: 1, name: 'Product 1', price: '10', stock: 5 },
        { id: 2, name: 'Product 2', price: '20', stock: 10 },
      ];

      mockFindMany(mockDb, 'products', mockProducts);

      const result = await productsService.getAll({}, { page: 1, limit: 10 });

      expect(result.products).toEqual(mockProducts);
      expect(result.page).toBe(1);
      expect(result.total).toBe(2);
    });

    it('should filter by category', async () => {
      const mockProducts = [
        { id: 1, name: 'Product 1', categoryId: 1 },
      ];

      mockFindMany(mockDb, 'products', mockProducts);

      const result = await productsService.getAll(
        { categoryId: 1 },
        { page: 1, limit: 10 }
      );

      expect(result.products).toHaveLength(1);
    });

    it('should filter by stock availability', async () => {
      const mockProducts = [
        { id: 1, name: 'Product 1', stock: 5 },
        { id: 2, name: 'Product 2', stock: 10 },
      ];

      mockFindMany(mockDb, 'products', mockProducts);

      const result = await productsService.getAll(
        { inStock: true },
        { page: 1, limit: 10 }
      );

      expect(result.products).toEqual(mockProducts);
    });

    it('should sort by price ascending', async () => {
      const mockProducts = [
        { id: 1, name: 'Product 1', price: '10' },
        { id: 2, name: 'Product 2', price: '20' },
      ];

      mockFindMany(mockDb, 'products', mockProducts);

      const result = await productsService.getAll(
        {},
        { page: 1, limit: 10, sortBy: 'price', sortOrder: 'asc' }
      );

      expect(result.products).toEqual(mockProducts);
    });
  });

  describe('search', () => {
    it('should search products by text', async () => {
      const mockProducts = [
        { id: 1, name: 'Gaming Mouse', description: 'RGB gaming mouse' },
        { id: 2, name: 'Gaming Keyboard', description: 'Mechanical keyboard' },
      ];

      mockFindMany(mockDb, 'products', mockProducts);

      const result = await productsService.search('gaming', 10);

      expect(result).toEqual(mockProducts);
    });

    it('should limit search results', async () => {
      const mockProducts = [
        { id: 1, name: 'Product 1' },
        { id: 2, name: 'Product 2' },
        { id: 3, name: 'Product 3' },
      ];

      mockFindMany(mockDb, 'products', mockProducts.slice(0, 5));

      const result = await productsService.search('product', 5);

      expect(result.length).toBeLessThanOrEqual(5);
    });
  });

  describe('uploadImages', () => {
    it('should upload multiple images when user is admin', async () => {
      mockAdminUser(mockAuth);

      const mockProduct = {
        id: 1,
        name: 'Test Product',
        images: [],
      };

      mockFindFirst(mockDb, 'products', mockProduct);

      const mockFiles = [
        new File(['img1'], 'img1.jpg', { type: 'image/jpeg' }),
        new File(['img2'], 'img2.jpg', { type: 'image/jpeg' }),
      ];

      vi.mocked(mockStorage.uploadProductImage).mockResolvedValue({
        path: 'products/img.jpg',
        publicUrl: 'https://example.com/products/img.jpg',
      });

      mockUpdate(mockDb, { ...mockProduct, images: ['url1', 'url2'] });

      const result = await productsService.uploadImages(1, mockFiles);

      expect(result).toHaveLength(2);
      expect(mockStorage.uploadProductImage).toHaveBeenCalledTimes(2);
    });

    it('should throw NotFoundError when product does not exist', async () => {
      mockAdminUser(mockAuth);
      mockFindFirst(mockDb, 'products', null);

      const mockFiles = [new File(['img'], 'img.jpg', { type: 'image/jpeg' })];

      await expect(productsService.uploadImages(999, mockFiles)).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe('updateStock', () => {
    it('should update product stock when user is admin', async () => {
      mockAdminUser(mockAuth);

      const mockProduct = {
        id: 1,
        name: 'Test Product',
        stock: 10,
      };

      mockFindFirst(mockDb, 'products', mockProduct);
      mockUpdate(mockDb, { ...mockProduct, stock: 20 });

      const result = await productsService.updateStock(1, 20);

      expect(result.stock).toBe(20);
    });

    it('should throw ValidationError for negative stock', async () => {
      mockAdminUser(mockAuth);
      mockFindFirst(mockDb, 'products', { id: 1, stock: 10 });

      await expect(productsService.updateStock(1, -5)).rejects.toThrow(
        ValidationError
      );
    });
  });

  describe('adjustStock', () => {
    it('should increase stock', async () => {
      const mockProduct = {
        id: 1,
        name: 'Test Product',
        stock: 10,
      };

      mockFindFirst(mockDb, 'products', mockProduct);
      mockUpdate(mockDb, { ...mockProduct, stock: 15 });

      const result = await productsService.adjustStock(1, 5);

      expect(result.stock).toBe(15);
    });

    it('should decrease stock', async () => {
      const mockProduct = {
        id: 1,
        name: 'Test Product',
        stock: 10,
      };

      mockFindFirst(mockDb, 'products', mockProduct);
      mockUpdate(mockDb, { ...mockProduct, stock: 7 });

      const result = await productsService.adjustStock(1, -3);

      expect(result.stock).toBe(7);
    });

    it('should throw ValidationError when stock would go negative', async () => {
      const mockProduct = {
        id: 1,
        name: 'Test Product',
        stock: 5,
      };

      mockFindFirst(mockDb, 'products', mockProduct);

      await expect(productsService.adjustStock(1, -10)).rejects.toThrow(
        ValidationError
      );
      await expect(productsService.adjustStock(1, -10)).rejects.toThrow(
        'Stock insuficiente'
      );
    });
  });
});
