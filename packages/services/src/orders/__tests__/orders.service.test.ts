// packages/services/src/orders/__tests__/orders.service.test.ts
// Propósito: Unit tests para OrdersService

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OrdersService } from '../orders.service';
import { createMockDb, mockFindFirst, mockFindMany, mockInsert, mockUpdate } from '../../__mocks__/db.mock';
import { createMockAuthService, mockAdminUser, mockRegularUser } from '../../__mocks__/services.mock';
import { createMockStorageService } from '../../__mocks__/services.mock';
import { NotFoundError, ValidationError, BusinessError, ForbiddenError } from '../../common/errors';
import type { DrizzleClient } from '../../common/types';

describe('OrdersService', () => {
  let ordersService: OrdersService;
  let mockDb: DrizzleClient;
  let mockAuth: ReturnType<typeof createMockAuthService>;
  let mockStorage: ReturnType<typeof createMockStorageService>;
  let mockOrdersTable: unknown;
  let mockOrderItemsTable: unknown;
  let mockPaymentProofsTable: unknown;

  beforeEach(() => {
    mockDb = createMockDb();
    mockAuth = createMockAuthService();
    mockStorage = createMockStorageService();
    mockOrdersTable = {};
    mockOrderItemsTable = {};
    mockPaymentProofsTable = {};
    ordersService = new OrdersService(
      mockDb,
      mockAuth as never,
      mockOrdersTable,
      mockOrderItemsTable,
      mockPaymentProofsTable,
      mockStorage as never
    );
  });

  describe('create', () => {
    it('should create order with items', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
        aud: 'authenticated',
        app_metadata: {},
        user_metadata: {},
        created_at: new Date().toISOString(),
      };

      vi.mocked(mockAuth.getCurrentUser).mockResolvedValue(mockUser);

      const orderData = {
        items: [
          { productId: 1, quantity: 2, priceAtPurchase: '10.00' },
          { productId: 2, quantity: 1, priceAtPurchase: '20.00' },
        ],
        total: '40.00',
        shippingAddress: '123 Test St',
        shippingCity: 'Test City',
        shippingPhone: '555-1234',
      };

      const mockOrder = {
        id: 1,
        userId: 'user-123',
        status: 'awaiting_payment',
        ...orderData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockInsert(mockDb, mockOrder);

      const result = await ordersService.create(orderData);

      expect(result.userId).toBe('user-123');
      expect(result.status).toBe('awaiting_payment');
    });

    it('should throw ValidationError for empty items', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
        aud: 'authenticated',
        app_metadata: {},
        user_metadata: {},
        created_at: new Date().toISOString(),
      };

      vi.mocked(mockAuth.getCurrentUser).mockResolvedValue(mockUser);

      await expect(
        ordersService.create({
          items: [],
          total: '0.00',
          shippingAddress: '123 Test St',
          shippingCity: 'Test City',
          shippingPhone: '555-1234',
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid quantity', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
        aud: 'authenticated',
        app_metadata: {},
        user_metadata: {},
        created_at: new Date().toISOString(),
      };

      vi.mocked(mockAuth.getCurrentUser).mockResolvedValue(mockUser);

      await expect(
        ordersService.create({
          items: [{ productId: 1, quantity: 0, priceAtPurchase: '10' }],
          total: '0.00',
          shippingAddress: '123 Test St',
          shippingCity: 'Test City',
          shippingPhone: '555-1234',
        })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('getById', () => {
    it('should return order by id', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
        aud: 'authenticated',
        app_metadata: {},
        user_metadata: {},
        created_at: new Date().toISOString(),
      };

      vi.mocked(mockAuth.getCurrentUser).mockResolvedValue(mockUser);

      const mockOrder = {
        id: 1,
        userId: 'user-123',
        status: 'awaiting_payment',
        total: '40.00',
        shippingAddress: '123 Test St',
        shippingCity: 'Test City',
        shippingPhone: '555-1234',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockFindFirst(mockDb, 'orders', mockOrder);

      const result = await ordersService.getById(1);

      expect(result).toEqual(mockOrder);
    });

    it('should throw NotFoundError when order not found', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
        aud: 'authenticated',
        app_metadata: {},
        user_metadata: {},
        created_at: new Date().toISOString(),
      };

      vi.mocked(mockAuth.getCurrentUser).mockResolvedValue(mockUser);
      mockFindFirst(mockDb, 'orders', null);

      await expect(ordersService.getById(999)).rejects.toThrow(NotFoundError);
    });
  });

  describe('getByUser', () => {
    it('should return all user orders', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
        aud: 'authenticated',
        app_metadata: {},
        user_metadata: {},
        created_at: new Date().toISOString(),
      };

      vi.mocked(mockAuth.getCurrentUser).mockResolvedValue(mockUser);

      const mockOrders = [
        { id: 1, userId: 'user-123', status: 'awaiting_payment' },
        { id: 2, userId: 'user-123', status: 'payment_confirmed' },
      ];

      mockFindMany(mockDb, 'orders', mockOrders);

      const result = await ordersService.getByUser('user-123');

      expect(result).toHaveLength(2);
    });
  });

  describe('updateStatus', () => {
    it('should update order status', async () => {
      const mockOrder = {
        id: 1,
        userId: 'user-123',
        status: 'awaiting_payment',
      };

      mockFindFirst(mockDb, 'orders', mockOrder);
      mockUpdate(mockDb, { ...mockOrder, status: 'payment_pending_verification' });

      await ordersService.updateStatus(1, 'payment_pending_verification');

      expect(mockDb.update).toHaveBeenCalled();
    });

    it('should throw BusinessError for invalid transition', async () => {
      const mockOrder = {
        id: 1,
        userId: 'user-123',
        status: 'delivered',
      };

      mockFindFirst(mockDb, 'orders', mockOrder);

      await expect(
        ordersService.updateStatus(1, 'awaiting_payment')
      ).rejects.toThrow(BusinessError);
    });
  });

  describe('uploadProof', () => {
    it('should upload payment proof successfully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
        aud: 'authenticated',
        app_metadata: {},
        user_metadata: {},
        created_at: new Date().toISOString(),
      };

      vi.mocked(mockAuth.getCurrentUser).mockResolvedValue(mockUser);

      const mockOrder = {
        id: 1,
        userId: 'user-123',
        status: 'awaiting_payment',
      };

      mockFindFirst(mockDb, 'orders', mockOrder);

      const mockFile = new File(['proof'], 'proof.jpg', { type: 'image/jpeg' });

      vi.mocked(mockStorage.uploadPaymentProof).mockResolvedValue({
        path: 'proofs/proof-123.jpg',
        publicUrl: 'https://example.com/proofs/proof-123.jpg',
      });

      const result = await ordersService.uploadProof(1, mockFile);

      expect(result.path).toBe('proofs/proof-123.jpg');
      expect(mockStorage.uploadPaymentProof).toHaveBeenCalledWith('user-123', '1', mockFile);
    });

    it('should throw NotFoundError when order not found', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
        aud: 'authenticated',
        app_metadata: {},
        user_metadata: {},
        created_at: new Date().toISOString(),
      };

      vi.mocked(mockAuth.getCurrentUser).mockResolvedValue(mockUser);
      mockFindFirst(mockDb, 'orders', null);

      const mockFile = new File(['proof'], 'proof.jpg', { type: 'image/jpeg' });

      await expect(ordersService.uploadProof(999, mockFile)).rejects.toThrow(
        NotFoundError
      );
    });

    it('should upload proof even when order status is delivered', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
        aud: 'authenticated',
        app_metadata: {},
        user_metadata: {},
        created_at: new Date().toISOString(),
      };

      vi.mocked(mockAuth.getCurrentUser).mockResolvedValue(mockUser);

      const mockOrder = {
        id: 1,
        userId: 'user-123',
        status: 'delivered',
      };

      mockFindFirst(mockDb, 'orders', mockOrder);

      const mockFile = new File(['proof'], 'proof.jpg', { type: 'image/jpeg' });

      vi.mocked(mockStorage.uploadPaymentProof).mockResolvedValue({
        path: 'proofs/proof-456.jpg',
        signedUrl: 'https://example.com/proofs/proof-456.jpg',
      });

      const result = await ordersService.uploadProof(1, mockFile);

      expect(result.path).toBe('proofs/proof-456.jpg');
    });
  });

  describe('getPendingVerification', () => {
    it('should return orders pending verification', async () => {
      mockAdminUser(mockAuth);

      const mockOrders = [
        {
          id: 1,
          userId: 'user-1',
          status: 'payment_pending_verification',
        },
        {
          id: 2,
          userId: 'user-2',
          status: 'payment_pending_verification',
        },
      ];

      mockFindMany(mockDb, 'orders', mockOrders);

      const result = await ordersService.getPendingVerification();

      expect(result).toHaveLength(2);
      expect(mockAuth.requireAdmin).toHaveBeenCalled();
    });
  });

  describe('approvePayment', () => {
    it('should approve payment and update status', async () => {
      mockAdminUser(mockAuth);

      const mockOrder = {
        id: 1,
        userId: 'user-123',
        status: 'payment_pending_verification',
      };

      mockFindFirst(mockDb, 'orders', mockOrder);
      mockUpdate(mockDb, { ...mockOrder, status: 'payment_confirmed' });

      await ordersService.approvePayment(1);

      expect(mockAuth.requireAdmin).toHaveBeenCalled();
      expect(mockDb.update).toHaveBeenCalled();
    });

    it('should throw ForbiddenError when not admin', async () => {
      mockRegularUser(mockAuth);

      const mockOrder = {
        id: 1,
        userId: 'user-123',
        status: 'payment_pending_verification',
      };

      mockFindFirst(mockDb, 'orders', mockOrder);

      await expect(ordersService.approvePayment(1)).rejects.toThrow(ForbiddenError);
    });
  });

  describe('rejectPayment', () => {
    it('should reject payment and update status', async () => {
      mockAdminUser(mockAuth);

      const mockOrder = {
        id: 1,
        userId: 'user-123',
        status: 'payment_pending_verification',
      };

      mockFindFirst(mockDb, 'orders', mockOrder);
      mockUpdate(mockDb, { ...mockOrder, status: 'awaiting_payment' });

      await ordersService.rejectPayment(1);

      expect(mockAuth.requireAdmin).toHaveBeenCalled();
      expect(mockDb.update).toHaveBeenCalled();
    });
  });
});
