// src/lib/utils.test.ts
// Tests unitarios para funciones utility
import { describe, it, expect } from 'vitest';
import { formatPrice, cn } from './utils';

describe('formatPrice', () => {
  it('should format a number into a Peruvian Soles string', () => {
    expect(formatPrice(599.99)).toBe('S/ 599.99');
  });

  it('should handle zero correctly', () => {
    expect(formatPrice(0)).toBe('S/ 0.00');
  });

  it('should round to 2 decimal places', () => {
    expect(formatPrice(10.999)).toBe('S/ 11.00');
  });

  it('should handle large numbers', () => {
    expect(formatPrice(123456.78)).toBe('S/ 123456.78');
  });
});

describe('cn', () => {
  it('should merge class names correctly', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('should handle conditional classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
  });

  it('should merge tailwind classes correctly', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
  });
});
