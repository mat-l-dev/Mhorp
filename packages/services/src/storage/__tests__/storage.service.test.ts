// packages/services/src/storage/__tests__/storage.service.test.ts
// Propósito: Unit tests para StorageService

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StorageService } from '../storage.service';
import { createMockSupabase } from '../../__mocks__/supabase.mock';
import { ValidationError } from '../../common/errors';
import type { SupabaseClient } from '@supabase/supabase-js';

describe('StorageService', () => {
  let storageService: StorageService;
  let mockSupabase: SupabaseClient;

  beforeEach(() => {
    mockSupabase = createMockSupabase();
    storageService = new StorageService(mockSupabase);
  });

  describe('uploadPaymentProof', () => {
    it('should upload payment proof successfully', async () => {
      const mockFile = new File(['proof content'], 'proof.jpg', { type: 'image/jpeg' });

      const mockStorage = mockSupabase.storage.from('payment_proofs');
      vi.mocked(mockStorage.upload).mockResolvedValue({
        data: { path: 'proofs/proof-123.jpg' },
        error: null,
      } as never);

      vi.mocked(mockStorage.getPublicUrl).mockReturnValue({
        data: { publicUrl: 'https://example.com/proofs/proof-123.jpg' },
      } as never);

      const result = await storageService.uploadPaymentProof('user-123', 'order-123', mockFile);

      expect(result.path).toContain('order-123');
      expect(result.publicUrl).toBe('https://example.com/proofs/proof-123.jpg');
      expect(mockStorage.upload).toHaveBeenCalled();
    });

    it('should throw ValidationError for invalid file type', async () => {
      const mockFile = new File(['content'], 'file.txt', { type: 'text/plain' });

      await expect(
        storageService.uploadPaymentProof('user-123', 'order-123', mockFile)
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for file too large', async () => {
      // Create a mock file larger than 10MB
      const largeContent = new Array(11 * 1024 * 1024).fill('a').join('');
      const mockFile = new File([largeContent], 'large.jpg', { type: 'image/jpeg' });

      await expect(
        storageService.uploadPaymentProof('user-123', 'order-123', mockFile)
      ).rejects.toThrow(ValidationError);
      await expect(
        storageService.uploadPaymentProof('user-123', 'order-123', mockFile)
      ).rejects.toThrow('excede el tamaño máximo');
    });

    it('should handle upload errors', async () => {
      const mockFile = new File(['proof content'], 'proof.jpg', { type: 'image/jpeg' });

      const mockStorage = mockSupabase.storage.from('payment_proofs');
      vi.mocked(mockStorage.upload).mockResolvedValue({
        data: null,
        error: { message: 'Upload failed', name: 'StorageError' },
      } as never);

      await expect(
        storageService.uploadPaymentProof('user-123', 'order-123', mockFile)
      ).rejects.toThrow('Upload failed');
    });
  });

  describe('uploadProductImage', () => {
    it('should upload product image successfully', async () => {
      const mockFile = new File(['image content'], 'product.jpg', { type: 'image/jpeg' });

      const mockStorage = mockSupabase.storage.from('product_images');
      vi.mocked(mockStorage.upload).mockResolvedValue({
        data: { path: 'products/product-123.jpg' },
        error: null,
      } as never);

      vi.mocked(mockStorage.getPublicUrl).mockReturnValue({
        data: { publicUrl: 'https://example.com/products/product-123.jpg' },
      } as never);

      const result = await storageService.uploadProductImage(mockFile, 'product-slug-123');

      expect(result.path).toContain('products/');
      expect(result.publicUrl).toBe('https://example.com/products/product-123.jpg');
    });

    it('should throw ValidationError for non-image file', async () => {
      const mockFile = new File(['content'], 'file.pdf', { type: 'application/pdf' });

      await expect(storageService.uploadProductImage(mockFile, 'product-slug-123')).rejects.toThrow(
        ValidationError
      );
    });

    it('should throw ValidationError for file too large (5MB limit)', async () => {
      const largeContent = new Array(6 * 1024 * 1024).fill('a').join('');
      const mockFile = new File([largeContent], 'large.jpg', { type: 'image/jpeg' });

      await expect(storageService.uploadProductImage(mockFile, 'product-slug-123')).rejects.toThrow(
        ValidationError
      );
    });
  });

  describe('getSignedUrl', () => {
    it('should generate signed URL', async () => {
      const mockStorage = mockSupabase.storage.from('payment_proofs');
      vi.mocked(mockStorage.createSignedUrl).mockResolvedValue({
        data: { signedUrl: 'https://example.com/signed/proof-123.jpg' },
        error: null,
      } as never);

      const result = await storageService.getSignedUrl(
        'payment_proofs',
        'proofs/proof-123.jpg',
        3600
      );

      expect(result).toBe('https://example.com/signed/proof-123.jpg');
      expect(mockStorage.createSignedUrl).toHaveBeenCalledWith(
        'proofs/proof-123.jpg',
        3600
      );
    });

    it('should handle signed URL generation errors', async () => {
      const mockStorage = mockSupabase.storage.from('payment_proofs');
      vi.mocked(mockStorage.createSignedUrl).mockResolvedValue({
        data: null,
        error: { message: 'File not found', name: 'StorageError' },
      } as never);

      await expect(
        storageService.getSignedUrl('payment_proofs', 'proofs/missing.jpg')
      ).rejects.toThrow('File not found');
    });
  });

  describe('getPublicUrl', () => {
    it('should return public URL', () => {
      const mockStorage = mockSupabase.storage.from('product_images');
      vi.mocked(mockStorage.getPublicUrl).mockReturnValue({
        data: { publicUrl: 'https://example.com/products/product-123.jpg' },
      } as never);

      const result = storageService.getPublicUrl(
        'product_images',
        'products/product-123.jpg'
      );

      expect(result).toBe('https://example.com/products/product-123.jpg');
    });
  });

  describe('deleteFile', () => {
    it('should delete file successfully', async () => {
      const mockStorage = mockSupabase.storage.from('payment_proofs');
      vi.mocked(mockStorage.remove).mockResolvedValue({
        data: {},
        error: null,
      } as never);

      const result = await storageService.deleteFile(
        'payment_proofs',
        'proofs/proof-123.jpg'
      );

      expect(result).toBe(true);
      expect(mockStorage.remove).toHaveBeenCalledWith(['proofs/proof-123.jpg']);
    });

    it('should handle deletion errors', async () => {
      const mockStorage = mockSupabase.storage.from('payment_proofs');
      vi.mocked(mockStorage.remove).mockResolvedValue({
        data: null,
        error: { message: 'File not found', name: 'StorageError' },
      } as never);

      await expect(
        storageService.deleteFile('payment_proofs', 'proofs/missing.jpg')
      ).rejects.toThrow('File not found');
    });
  });

  describe('deleteFiles', () => {
    it('should delete multiple files successfully', async () => {
      const mockStorage = mockSupabase.storage.from('product_images');
      vi.mocked(mockStorage.remove).mockResolvedValue({
        data: {},
        error: null,
      } as never);

      const paths = ['products/img1.jpg', 'products/img2.jpg', 'products/img3.jpg'];
      const result = await storageService.deleteFiles('product_images', paths);

      expect(result).toBe(true);
      expect(mockStorage.remove).toHaveBeenCalledWith(paths);
    });

    it('should handle batch deletion errors', async () => {
      const mockStorage = mockSupabase.storage.from('product_images');
      vi.mocked(mockStorage.remove).mockResolvedValue({
        data: null,
        error: { message: 'Deletion failed', name: 'StorageError' },
      } as never);

      await expect(
        storageService.deleteFiles('product_images', ['products/img1.jpg'])
      ).rejects.toThrow('Deletion failed');
    });
  });

  describe('listFiles', () => {
    it('should list files in folder', async () => {
      const mockStorage = mockSupabase.storage.from('payment_proofs');
      const mockFiles = [
        { name: 'proof1.jpg', id: '1', updated_at: '2024-01-01', created_at: '2024-01-01', last_accessed_at: '2024-01-01', metadata: {} },
        { name: 'proof2.jpg', id: '2', updated_at: '2024-01-02', created_at: '2024-01-02', last_accessed_at: '2024-01-02', metadata: {} },
      ];

      vi.mocked(mockStorage.list).mockResolvedValue({
        data: mockFiles,
        error: null,
      } as never);

      const result = await storageService.listFiles('payment_proofs', 'order-123');

      expect(result).toEqual(mockFiles);
      expect(mockStorage.list).toHaveBeenCalledWith('order-123');
    });

    it('should handle list errors', async () => {
      const mockStorage = mockSupabase.storage.from('payment_proofs');
      vi.mocked(mockStorage.list).mockResolvedValue({
        data: null,
        error: { message: 'List failed', name: 'StorageError' },
      } as never);

      await expect(storageService.listFiles('payment_proofs', 'folder')).rejects.toThrow(
        'List failed'
      );
    });
  });

  describe('generateUniqueFileName', () => {
    it('should generate unique filename with prefix and extension', () => {
      const result = storageService.generateUniqueFileName('payment', 'jpg');

      expect(result).toMatch(/^payment-\d+-[a-z0-9]+\.jpg$/);
    });

    it('should generate unique filename without prefix', () => {
      const result = storageService.generateUniqueFileName('', 'png');

      expect(result).toMatch(/^\d+-[a-z0-9]+\.png$/);
    });

    it('should generate different names on subsequent calls', () => {
      const name1 = storageService.generateUniqueFileName('test', 'jpg');
      const name2 = storageService.generateUniqueFileName('test', 'jpg');

      expect(name1).not.toBe(name2);
    });
  });
});
