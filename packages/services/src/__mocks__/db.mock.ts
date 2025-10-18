// packages/services/src/__mocks__/db.mock.ts
// Propósito: Mock factory para Drizzle database client

import { vi } from 'vitest';
import type { DrizzleClient } from '../common/types';

/**
 * Crea un mock completo del cliente Drizzle
 */
export function createMockDb(): DrizzleClient {
  return {
    // Query API (para findFirst, findMany con relaciones)
    query: {
      users: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      products: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      categories: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      orders: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      orderItems: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      paymentProofs: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      reviews: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
    },
    // Core API (para insert, update, delete)
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    // Chainable methods
    values: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([]),
    execute: vi.fn().mockResolvedValue([]),
  } as unknown as DrizzleClient;
}

/**
 * Helper para mockear resultado de query.findFirst
 */
export function mockFindFirst<T>(db: DrizzleClient, table: string, result: T | null) {
  const queryTable = (db.query as any)[table];
  if (queryTable && queryTable.findFirst) {
    vi.mocked(queryTable.findFirst).mockResolvedValue(result);
  }
}

/**
 * Helper para mockear resultado de query.findMany
 */
export function mockFindMany<T>(db: DrizzleClient, table: string, results: T[]) {
  const queryTable = (db.query as any)[table];
  if (queryTable && queryTable.findMany) {
    vi.mocked(queryTable.findMany).mockResolvedValue(results);
  }
}

/**
 * Helper para mockear insert
 */
export function mockInsert<T>(db: DrizzleClient, result: T) {
  vi.mocked(db.insert).mockReturnValue({
    values: vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue([result]),
    }),
  } as any);
}

/**
 * Helper para mockear update
 */
export function mockUpdate<T>(db: DrizzleClient, result: T) {
  vi.mocked(db.update).mockReturnValue({
    set: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([result]),
      }),
    }),
  } as any);
}

/**
 * Helper para mockear delete
 */
export function mockDelete(db: DrizzleClient) {
  vi.mocked(db.delete).mockReturnValue({
    where: vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue([{ id: 1 }]),
    }),
  } as any);
}
