// packages/services/src/__mocks__/services.mock.ts
// Propósito: Mock factories para servicios

import { vi } from 'vitest';

/**
 * Crea un mock básico de AuthService
 */
export function createMockAuthService() {
  return {
    getCurrentUser: vi.fn(),
    getCurrentUserOrNull: vi.fn(),
    getDatabaseUser: vi.fn(),
    requireAdmin: vi.fn(),
    isAdmin: vi.fn(),
    isAuthenticated: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
    signUp: vi.fn(),
    deleteAccount: vi.fn(),
    resetPassword: vi.fn(),
    verifyEmail: vi.fn(),
    refreshSession: vi.fn(),
  };
}

/**
 * Crea un mock básico de StorageService
 */
export function createMockStorageService() {
  return {
    uploadPaymentProof: vi.fn().mockResolvedValue({
      path: 'proofs/test-proof.jpg',
      publicUrl: 'https://example.com/proofs/test-proof.jpg',
    }),
    uploadProductImage: vi.fn().mockResolvedValue({
      path: 'products/test-image.jpg',
      publicUrl: 'https://example.com/products/test-image.jpg',
    }),
    getSignedUrl: vi.fn().mockResolvedValue('https://example.com/signed/test.jpg'),
    getPublicUrl: vi.fn().mockReturnValue('https://example.com/test.jpg'),
    deleteFile: vi.fn().mockResolvedValue(true),
    deleteFiles: vi.fn().mockResolvedValue(true),
    listFiles: vi.fn().mockResolvedValue([]),
    getFileExtension: vi.fn().mockReturnValue('jpg'),
    generateUniqueFileName: vi.fn().mockReturnValue('unique-file-name.jpg'),
  };
}

/**
 * Crea un mock básico de OrdersService
 */
export function createMockOrdersService() {
  return {
    create: vi.fn(),
    getById: vi.fn(),
    getByUser: vi.fn(),
    updateStatus: vi.fn(),
    uploadProof: vi.fn(),
    getPendingVerification: vi.fn(),
    approvePayment: vi.fn(),
    rejectPayment: vi.fn(),
  };
}

/**
 * Crea un mock básico de ProductsService
 */
export function createMockProductsService() {
  return {
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getById: vi.fn(),
    getAll: vi.fn(),
    search: vi.fn(),
    uploadImages: vi.fn(),
    updateStock: vi.fn(),
    adjustStock: vi.fn(),
  };
}

/**
 * Helper para mockear usuario admin
 */
export function mockAdminUser(authService: ReturnType<typeof createMockAuthService>) {
  authService.isAdmin.mockResolvedValue(true);
  authService.requireAdmin.mockResolvedValue({
    id: 'admin-user-id',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'admin',
    createdAt: new Date(),
  });
}

/**
 * Helper para mockear usuario regular
 */
export function mockRegularUser(authService: ReturnType<typeof createMockAuthService>) {
  authService.isAdmin.mockResolvedValue(false);
  authService.getDatabaseUser.mockResolvedValue({
    id: 'user-id',
    email: 'user@example.com',
    name: 'Regular User',
    role: 'user',
    createdAt: new Date(),
  });
}

/**
 * Helper para mockear usuario no autenticado
 */
export function mockUnauthenticatedUser(authService: ReturnType<typeof createMockAuthService>) {
  authService.isAdmin.mockResolvedValue(false);
  authService.isAuthenticated.mockResolvedValue(false);
  authService.getCurrentUserOrNull.mockResolvedValue(null);
}

