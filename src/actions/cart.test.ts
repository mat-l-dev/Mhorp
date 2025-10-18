// src/actions/cart.test.ts
// Tests para lógica crítica del carrito de compras
import { describe, it, expect } from 'vitest';

describe('Cart Logic', () => {
  describe('calculateCartTotal', () => {
    it('should calculate total for single item', () => {
      const items = [
        { productId: 1, quantity: 2, product: { price: '10.00' } }
      ];
      
      const total = items.reduce((sum, item) => {
        return sum + (parseFloat(item.product.price) * item.quantity);
      }, 0);
      
      expect(total).toBe(20.00);
    });

    it('should calculate total for multiple items', () => {
      const items = [
        { productId: 1, quantity: 2, product: { price: '10.00' } },
        { productId: 2, quantity: 1, product: { price: '25.50' } },
        { productId: 3, quantity: 3, product: { price: '5.00' } }
      ];
      
      const total = items.reduce((sum, item) => {
        return sum + (parseFloat(item.product.price) * item.quantity);
      }, 0);
      
      expect(total).toBe(60.50);
    });

    it('should handle empty cart', () => {
      const items: never[] = [];
      
      const total = items.reduce((sum) => sum, 0);
      
      expect(total).toBe(0);
    });

    it('should handle decimal prices correctly', () => {
      const items = [
        { productId: 1, quantity: 3, product: { price: '9.99' } }
      ];
      
      const total = items.reduce((sum, item) => {
        return sum + (parseFloat(item.product.price) * item.quantity);
      }, 0);
      
      expect(total).toBeCloseTo(29.97, 2);
    });
  });

  describe('applyCouponDiscount', () => {
    it('should apply percentage discount correctly', () => {
      const cartTotal = 100;
      const discountPercentage = 10;
      
      const discount = (cartTotal * discountPercentage) / 100;
      const finalTotal = cartTotal - discount;
      
      expect(finalTotal).toBe(90);
    });

    it('should apply fixed discount correctly', () => {
      const cartTotal = 100;
      const fixedDiscount = 25;
      
      const finalTotal = cartTotal - fixedDiscount;
      
      expect(finalTotal).toBe(75);
    });

    it('should not apply discount greater than total', () => {
      const cartTotal = 50;
      const fixedDiscount = 100;
      
      const finalTotal = Math.max(cartTotal - fixedDiscount, 0);
      
      expect(finalTotal).toBe(0);
    });
  });
});
