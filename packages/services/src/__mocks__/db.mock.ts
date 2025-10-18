// packages/services/src/__mocks__/db.mock.ts
// Propósito: Mock factory para Drizzle database client

import { vi } from 'vitest';
import type { DrizzleClient } from '../common/types';

/**
 * Crea un mock completo del cliente Drizzle
 */
export function createMockDb(): DrizzleClient {
  // Mock de la cadena de query para select
  const queryChain = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
    offset: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
  };

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
    select: vi.fn(() => queryChain),
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
 * También configura el chain de select().from().where().limit() para soportar ambos estilos
 */
export function mockFindFirst<T>(db: DrizzleClient, table: string, result: T | null) {
  // Mock para query API (db.query.table.findFirst)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const queryTable = (db.query as any)[table];
  if (queryTable && queryTable.findFirst) {
    vi.mocked(queryTable.findFirst).mockResolvedValue(result);
  }

  // Mock para select API (db.select().from().where().limit())
  // Crear una cadena que devuelva el resultado en limit()
  const selectChain = {
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue(result ? [result] : []),
      }),
    }),
  };
  
  vi.mocked(db.select).mockReturnValue(selectChain as never);
}

/**
 * Helper para mockear resultado de query.findMany
 * También configura el chain de select().from().where() para soportar ambos estilos
 */
export function mockFindMany<T>(db: DrizzleClient, table: string, results: T[]) {
  // Mock para query API (db.query.table.findMany)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const queryTable = (db.query as any)[table];
  if (queryTable && queryTable.findMany) {
    vi.mocked(queryTable.findMany).mockResolvedValue(results);
  }

  // Mock para select API (db.select().from().where())
  const selectChain = {
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(results),
      limit: vi.fn().mockReturnValue({
        offset: vi.fn().mockResolvedValue(results),
      }),
      orderBy: vi.fn().mockReturnValue({
        limit: vi.fn().mockReturnValue({
          offset: vi.fn().mockResolvedValue(results),
        }),
      }),
    }),
  };
  
  vi.mocked(db.select).mockReturnValue(selectChain as never);
}

/**
 * Helper para mockear insert
 */
export function mockInsert<T>(db: DrizzleClient, result: T) {
  vi.mocked(db.insert).mockReturnValue({
    values: vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue([result]),
    }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);
}
