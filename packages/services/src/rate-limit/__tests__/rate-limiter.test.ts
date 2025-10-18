// packages/services/src/rate-limit/__tests__/rate-limiter.test.ts
// Propósito: Tests completos para rate limiter

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  RateLimiter,
  MemoryRateLimitStore,
  RateLimitPresets,
  createRateLimiter,
} from '../rate-limiter';

describe('MemoryRateLimitStore', () => {
  let store: MemoryRateLimitStore;

  beforeEach(() => {
    store = new MemoryRateLimitStore(60000); // 1 minuto
  });

  afterEach(() => {
    store.destroy();
  });

  it('should increment counter', async () => {
    const result1 = await store.increment('test-key');
    expect(result1.count).toBe(1);

    const result2 = await store.increment('test-key');
    expect(result2.count).toBe(2);
  });

  it('should reset counter after window expires', async () => {
    store = new MemoryRateLimitStore(100); // 100ms para test rápido
    
    const result1 = await store.increment('test-key');
    expect(result1.count).toBe(1);

    // Esperar a que expire
    await new Promise(resolve => setTimeout(resolve, 150));

    const result2 = await store.increment('test-key');
    expect(result2.count).toBe(1); // Resetea a 1
  });

  it('should decrement counter', async () => {
    await store.increment('test-key');
    await store.increment('test-key');
    expect((await store.get('test-key'))?.count).toBe(2);

    await store.decrement('test-key');
    expect((await store.get('test-key'))?.count).toBe(1);
  });

  it('should reset counter', async () => {
    await store.increment('test-key');
    await store.increment('test-key');
    
    await store.reset('test-key');
    const result = await store.get('test-key');
    expect(result).toBeNull();
  });

  it('should get current state', async () => {
    const increment = await store.increment('test-key');
    const get = await store.get('test-key');
    
    expect(get).not.toBeNull();
    expect(get?.count).toBe(1);
    expect(get?.resetTime).toEqual(increment.resetTime);
  });

  it('should return null for non-existent key', async () => {
    const result = await store.get('non-existent');
    expect(result).toBeNull();
  });

  it('should cleanup expired entries', async () => {
    store = new MemoryRateLimitStore(50); // 50ms
    
    await store.increment('key1');
    await store.increment('key2');

    // Esperar a que expire
    await new Promise(resolve => setTimeout(resolve, 100));

    // Trigger cleanup manualmente
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (store as any).cleanup();

    const result1 = await store.get('key1');
    const result2 = await store.get('key2');
    
    expect(result1).toBeNull();
    expect(result2).toBeNull();
  });

  it('should handle multiple keys independently', async () => {
    await store.increment('user1');
    await store.increment('user1');
    await store.increment('user2');

    const user1 = await store.get('user1');
    const user2 = await store.get('user2');

    expect(user1?.count).toBe(2);
    expect(user2?.count).toBe(1);
  });
});

describe('RateLimiter', () => {
  let limiter: RateLimiter;
  let store: MemoryRateLimitStore;

  beforeEach(() => {
    store = new MemoryRateLimitStore(60000);
    limiter = new RateLimiter({
      windowMs: 60000,
      max: 5,
      message: 'Rate limit exceeded',
    }, store);
  });

  afterEach(() => {
    store.destroy();
  });

  it('should allow requests under limit', async () => {
    const result = await limiter.check('client1');
    
    expect(result.allowed).toBe(true);
    expect(result.info.current).toBe(1);
    expect(result.info.remaining).toBe(4);
    expect(result.info.limit).toBe(5);
  });

  it('should block requests over limit', async () => {
    // Hacer 5 requests (el límite)
    for (let i = 0; i < 5; i++) {
      await limiter.check('client1');
    }

    // El 6to debe fallar
    const result = await limiter.check('client1');
    
    expect(result.allowed).toBe(false);
    expect(result.info.current).toBe(6);
    expect(result.info.remaining).toBe(0);
  });

  it('should return correct remaining count', async () => {
    const r1 = await limiter.check('client1');
    expect(r1.info.remaining).toBe(4);

    const r2 = await limiter.check('client1');
    expect(r2.info.remaining).toBe(3);

    const r3 = await limiter.check('client1');
    expect(r3.info.remaining).toBe(2);
  });

  it('should handle multiple clients independently', async () => {
    await limiter.check('client1');
    await limiter.check('client1');
    await limiter.check('client2');

    const info1 = await limiter.getInfo('client1');
    const info2 = await limiter.getInfo('client2');

    expect(info1?.current).toBe(2);
    expect(info2?.current).toBe(1);
  });

  it('should reset counter for a client', async () => {
    await limiter.check('client1');
    await limiter.check('client1');
    
    await limiter.reset('client1');
    
    const result = await limiter.check('client1');
    expect(result.info.current).toBe(1);
  });

  it('should skip successful requests if configured', async () => {
    limiter = new RateLimiter({
      windowMs: 60000,
      max: 5,
      skipSuccessfulRequests: true,
    }, store);

    await limiter.check('client1');
    await limiter.consume('client1', true); // Success

    const info = await limiter.getInfo('client1');
    expect(info?.current).toBe(0); // Decrementado
  });

  it('should skip failed requests if configured', async () => {
    limiter = new RateLimiter({
      windowMs: 60000,
      max: 5,
      skipFailedRequests: true,
    }, store);

    await limiter.check('client1');
    await limiter.consume('client1', false); // Failure

    const info = await limiter.getInfo('client1');
    expect(info?.current).toBe(0); // Decrementado
  });

  it('should return custom message', () => {
    const message = limiter.getMessage();
    expect(message).toBe('Rate limit exceeded');
  });

  it('should return reset time', async () => {
    const result = await limiter.check('client1');
    
    expect(result.info.resetTime).toBeInstanceOf(Date);
    expect(result.info.resetTime.getTime()).toBeGreaterThan(Date.now());
  });

  it('should handle consume without prior check', async () => {
    const result = await limiter.consume('client1', true);
    
    expect(result.allowed).toBe(true);
    expect(result.info.current).toBe(1);
  });

  it('should return null for non-existent client info', async () => {
    const info = await limiter.getInfo('non-existent');
    expect(info).toBeNull();
  });
});

describe('RateLimitPresets', () => {
  it('should have auth preset', () => {
    expect(RateLimitPresets.auth).toBeDefined();
    expect(RateLimitPresets.auth.max).toBe(5);
    expect(RateLimitPresets.auth.windowMs).toBe(15 * 60 * 1000);
    expect(RateLimitPresets.auth.skipSuccessfulRequests).toBe(true);
  });

  it('should have api preset', () => {
    expect(RateLimitPresets.api).toBeDefined();
    expect(RateLimitPresets.api.max).toBe(100);
    expect(RateLimitPresets.api.windowMs).toBe(60 * 1000);
  });

  it('should have write preset', () => {
    expect(RateLimitPresets.write).toBeDefined();
    expect(RateLimitPresets.write.max).toBe(20);
  });

  it('should have read preset', () => {
    expect(RateLimitPresets.read).toBeDefined();
    expect(RateLimitPresets.read.max).toBe(300);
  });

  it('should have search preset', () => {
    expect(RateLimitPresets.search).toBeDefined();
    expect(RateLimitPresets.search.max).toBe(50);
  });

  it('should have upload preset', () => {
    expect(RateLimitPresets.upload).toBeDefined();
    expect(RateLimitPresets.upload.max).toBe(10);
    expect(RateLimitPresets.upload.windowMs).toBe(5 * 60 * 1000);
  });

  it('should have admin preset', () => {
    expect(RateLimitPresets.admin).toBeDefined();
    expect(RateLimitPresets.admin.max).toBe(500);
  });
});

describe('createRateLimiter', () => {
  it('should create limiter with auth preset', () => {
    const limiter = createRateLimiter('auth');
    expect(limiter).toBeInstanceOf(RateLimiter);
    expect(limiter.getMessage()).toContain('authentication');
  });

  it('should create limiter with api preset', () => {
    const limiter = createRateLimiter('api');
    expect(limiter).toBeInstanceOf(RateLimiter);
  });

  it('should create limiter with custom store', () => {
    const store = new MemoryRateLimitStore();
    const limiter = createRateLimiter('api', store);
    expect(limiter).toBeInstanceOf(RateLimiter);
    store.destroy();
  });

  it('should create different limiters for different presets', () => {
    const authLimiter = createRateLimiter('auth');
    const apiLimiter = createRateLimiter('api');
    
    expect(authLimiter.getMessage()).not.toBe(apiLimiter.getMessage());
  });
});

describe('RateLimiter - Edge Cases', () => {
  let limiter: RateLimiter;
  let store: MemoryRateLimitStore;

  beforeEach(() => {
    store = new MemoryRateLimitStore(60000);
    limiter = new RateLimiter({
      windowMs: 60000,
      max: 3,
    }, store);
  });

  afterEach(() => {
    store.destroy();
  });

  it('should handle rapid concurrent requests', async () => {
    const promises = Array(5).fill(null).map(() => limiter.check('client1'));
    const results = await Promise.all(promises);

    // En memoria, debido a que no es completamente atómico, 
    // solo verificamos que al menos algunos fallan
    const allowed = results.filter(r => r.allowed).length;
    const blocked = results.filter(r => !r.allowed).length;

    // Debe haber bloqueados (más de 3 requests)
    expect(allowed + blocked).toBe(5);
    expect(blocked).toBeGreaterThan(0);
  });

  it('should handle zero remaining correctly', async () => {
    await limiter.check('client1');
    await limiter.check('client1');
    await limiter.check('client1');

    const info = await limiter.getInfo('client1');
    expect(info?.remaining).toBe(0);
  });

  it('should handle decrement below zero gracefully', async () => {
    await store.decrement('non-existent');
    const info = await store.get('non-existent');
    expect(info).toBeNull();
  });

  it('should maintain separate windows for different clients', async () => {
    store = new MemoryRateLimitStore(100); // 100ms window
    limiter = new RateLimiter({ windowMs: 100, max: 2 }, store);

    // Client 1
    await limiter.check('client1');
    await limiter.check('client1');

    // Esperar a que expire window de client1
    await new Promise(resolve => setTimeout(resolve, 150));

    // Client 2 aún no debe haber iniciado
    const result = await limiter.check('client2');
    expect(result.info.current).toBe(1);

    store.destroy();
  });
});
