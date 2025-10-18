// packages/services/src/cache/__tests__/cache.service.test.ts
// Propósito: Unit tests para CacheService

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { CacheService, MemoryCacheClient } from '../cache.service';

describe('CacheService', () => {
  let cacheService: CacheService;
  let cacheClient: MemoryCacheClient;

  beforeEach(() => {
    cacheClient = new MemoryCacheClient();
    cacheService = new CacheService(cacheClient);
  });

  afterEach(() => {
    cacheClient.destroy();
  });

  describe('get/set', () => {
    it('should store and retrieve a value', async () => {
      const testData = { id: 1, name: 'Test Product', price: '10.00' };

      await cacheService.set('product:1', testData);
      const result = await cacheService.get<typeof testData>('product:1');

      expect(result).toEqual(testData);
    });

    it('should return null for non-existent key', async () => {
      const result = await cacheService.get('non-existent');
      expect(result).toBeNull();
    });

    it('should respect TTL', async () => {
      await cacheService.set('short-lived', { data: 'test' }, { ttl: 1 });

      // Debe existir inmediatamente
      let result = await cacheService.get('short-lived');
      expect(result).toEqual({ data: 'test' });

      // Esperar 1.5 segundos
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Debe haber expirado
      result = await cacheService.get('short-lived');
      expect(result).toBeNull();
    });

    it('should handle complex objects', async () => {
      const complexData = {
        product: { id: 1, name: 'Product' },
        reviews: [
          { id: 1, rating: 5, comment: 'Great!' },
          { id: 2, rating: 4, comment: 'Good' },
        ],
        metadata: { updated: new Date().toISOString() },
      };

      await cacheService.set('complex:1', complexData);
      const result = await cacheService.get('complex:1');

      expect(result).toEqual(complexData);
    });
  });

  describe('getOrSet', () => {
    it('should return cached value if exists', async () => {
      const factory = vi.fn().mockResolvedValue({ data: 'from-db' });

      // Primera llamada - debería llamar al factory
      const result1 = await cacheService.getOrSet('key:1', factory);
      expect(result1).toEqual({ data: 'from-db' });
      expect(factory).toHaveBeenCalledTimes(1);

      // Segunda llamada - debería usar caché
      const result2 = await cacheService.getOrSet('key:1', factory);
      expect(result2).toEqual({ data: 'from-db' });
      expect(factory).toHaveBeenCalledTimes(1); // No se llama de nuevo
    });

    it('should call factory if not cached', async () => {
      const factory = vi.fn().mockResolvedValue({ data: 'computed' });

      const result = await cacheService.getOrSet('new-key', factory);

      expect(result).toEqual({ data: 'computed' });
      expect(factory).toHaveBeenCalledTimes(1);
    });
  });

  describe('invalidate', () => {
    it('should invalidate a single key', async () => {
      await cacheService.set('key:1', { data: 'test1' });
      await cacheService.set('key:2', { data: 'test2' });

      let result1 = await cacheService.get('key:1');
      let result2 = await cacheService.get('key:2');
      expect(result1).toEqual({ data: 'test1' });
      expect(result2).toEqual({ data: 'test2' });

      // Invalidar solo key:1
      await cacheService.invalidate('key:1');

      result1 = await cacheService.get('key:1');
      result2 = await cacheService.get('key:2');
      expect(result1).toBeNull();
      expect(result2).toEqual({ data: 'test2' });
    });

    it('should invalidate multiple keys', async () => {
      await cacheService.set('key:1', { data: 'test1' });
      await cacheService.set('key:2', { data: 'test2' });
      await cacheService.set('key:3', { data: 'test3' });

      await cacheService.invalidateMany(['key:1', 'key:3']);

      const result1 = await cacheService.get('key:1');
      const result2 = await cacheService.get('key:2');
      const result3 = await cacheService.get('key:3');

      expect(result1).toBeNull();
      expect(result2).toEqual({ data: 'test2' });
      expect(result3).toBeNull();
    });
  });

  describe('invalidatePattern', () => {
    it('should invalidate keys matching pattern', async () => {
      await cacheService.set('product:1', { id: 1 });
      await cacheService.set('product:2', { id: 2 });
      await cacheService.set('product:3', { id: 3 });
      await cacheService.set('user:1', { id: 1 });

      // Invalidar todos los productos
      await cacheService.invalidatePattern('product:*');

      const product1 = await cacheService.get('product:1');
      const product2 = await cacheService.get('product:2');
      const product3 = await cacheService.get('product:3');
      const user1 = await cacheService.get('user:1');

      expect(product1).toBeNull();
      expect(product2).toBeNull();
      expect(product3).toBeNull();
      expect(user1).toEqual({ id: 1 }); // No debe ser afectado
    });

    it('should handle complex patterns', async () => {
      await cacheService.set('products:list:page:1', { data: [] });
      await cacheService.set('products:list:page:2', { data: [] });
      await cacheService.set('products:detail:1', { data: {} });
      await cacheService.set('orders:list:page:1', { data: [] });

      await cacheService.invalidatePattern('products:list:*');

      const listPage1 = await cacheService.get('products:list:page:1');
      const listPage2 = await cacheService.get('products:list:page:2');
      const detail = await cacheService.get('products:detail:1');
      const orders = await cacheService.get('orders:list:page:1');

      expect(listPage1).toBeNull();
      expect(listPage2).toBeNull();
      expect(detail).not.toBeNull();
      expect(orders).not.toBeNull();
    });
  });

  describe('flush', () => {
    it('should clear all cache', async () => {
      await cacheService.set('key:1', { data: 'test1' });
      await cacheService.set('key:2', { data: 'test2' });
      await cacheService.set('key:3', { data: 'test3' });

      await cacheService.flush();

      const result1 = await cacheService.get('key:1');
      const result2 = await cacheService.get('key:2');
      const result3 = await cacheService.get('key:3');

      expect(result1).toBeNull();
      expect(result2).toBeNull();
      expect(result3).toBeNull();
    });
  });

  describe('namespace', () => {
    it('should use default namespace', async () => {
      await cacheService.set('test', { data: 'value' });

      // Verificar que la key tiene el namespace
      const rawValue = await cacheClient.get('mhor:test');
      expect(rawValue).not.toBeNull();
    });

    it('should allow custom namespace', () => {
      cacheService.setNamespace('custom');
      expect(cacheService['namespace']).toBe('custom:');
    });

    it('should auto-add colon to namespace', () => {
      cacheService.setNamespace('custom');
      expect(cacheService['namespace']).toBe('custom:');
    });
  });

  describe('TTL configuration', () => {
    it('should use default TTL when not specified', async () => {
      await cacheService.set('test', { data: 'value' });
      // El TTL por defecto es 3600 segundos, difícil de verificar en test
      // pero podemos verificar que se guardó
      const result = await cacheService.get('test');
      expect(result).toEqual({ data: 'value' });
    });

    it('should allow changing default TTL', () => {
      cacheService.setDefaultTTL(600);
      expect(cacheService['defaultTTL']).toBe(600);
    });
  });

  describe('error handling', () => {
    it('should not throw on cache get error', async () => {
      vi.spyOn(cacheClient, 'get').mockRejectedValue(new Error('Cache error'));

      const result = await cacheService.get('test');
      expect(result).toBeNull();
    });

    it('should not throw on cache set error', async () => {
      vi.spyOn(cacheClient, 'set').mockRejectedValue(new Error('Cache error'));

      await expect(
        cacheService.set('test', { data: 'value' })
      ).resolves.not.toThrow();
    });

    it('should not throw on invalidate error', async () => {
      vi.spyOn(cacheClient, 'del').mockRejectedValue(new Error('Cache error'));

      await expect(
        cacheService.invalidate('test')
      ).resolves.not.toThrow();
    });
  });
});

describe('MemoryCacheClient', () => {
  let client: MemoryCacheClient;

  beforeEach(() => {
    client = new MemoryCacheClient();
  });

  afterEach(() => {
    client.destroy();
  });

  it('should expire entries automatically', async () => {
    await client.set('test', 'value', 1);

    let result = await client.get('test');
    expect(result).toBe('value');

    await new Promise(resolve => setTimeout(resolve, 1500));

    result = await client.get('test');
    expect(result).toBeNull();
  });

  it('should cleanup expired entries periodically', async () => {
    // Agregar múltiples entries con TTL corto
    await client.set('key1', 'value1', 1);
    await client.set('key2', 'value2', 1);
    await client.set('key3', 'value3', 1);

    // Verificar que existen
    expect(await client.get('key1')).toBe('value1');
    expect(await client.get('key2')).toBe('value2');
    expect(await client.get('key3')).toBe('value3');

    // Esperar a que expiren
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Forzar cleanup (normalmente se hace cada 60s)
    client['cleanup']();

    // Verificar que se limpiaron
    expect(client['cache'].size).toBe(0);
  });
});
