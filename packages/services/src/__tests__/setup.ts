// packages/services/src/__tests__/setup.ts
// Propósito: Setup global para tests - ejecutado antes de cada archivo de test

import { beforeAll, afterEach, afterAll, vi } from 'vitest';

// Setup antes de todos los tests
beforeAll(() => {
  // Configurar timezone para tests consistentes
  process.env.TZ = 'UTC';
});

// Cleanup después de cada test
afterEach(() => {
  // Limpiar todos los mocks
  vi.clearAllMocks();
  // Limpiar timers
  vi.clearAllTimers();
});

// Cleanup después de todos los tests
afterAll(() => {
  // Restaurar todos los mocks
  vi.restoreAllMocks();
});

// Mock de console para evitar logs en tests
global.console = {
  ...console,
  error: vi.fn(),
  warn: vi.fn(),
  log: vi.fn(),
};
