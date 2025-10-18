// packages/validation/src/schemas/order.schema.ts
// Propósito: Esquemas de validación Zod para órdenes

import { z } from 'zod';

/**
 * Schema para crear una orden
 */
export const createOrderSchema = z.object({
  items: z.array(z.object({
    productId: z.number().int().positive('ID de producto inválido'),
    quantity: z.number().int().min(1, 'Cantidad debe ser al menos 1').max(100, 'Cantidad máxima: 100'),
    priceAtPurchase: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Precio inválido'),
  })).min(1, 'Debe haber al menos un producto'),
  
  total: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Total inválido'),
  shippingAddress: z.string().min(10, 'Dirección muy corta').max(200, 'Dirección muy larga'),
  shippingCity: z.string().min(2, 'Ciudad inválida').max(100, 'Ciudad muy larga'),
  shippingPhone: z.string().regex(/^\d{9}$/, 'Teléfono debe tener 9 dígitos'),
  couponCode: z.string().optional(),
});

export type CreateOrderDTO = z.infer<typeof createOrderSchema>;

/**
 * Schema para actualizar estado de orden (admin)
 */
export const updateOrderStatusSchema = z.object({
  orderId: z.string().uuid('ID de orden inválido'),
  status: z.enum([
    'awaiting_payment',
    'payment_pending_verification',
    'payment_confirmed',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
  ]),
  adminNotes: z.string().max(500).optional(),
});

export type UpdateOrderStatusDTO = z.infer<typeof updateOrderStatusSchema>;

/**
 * Schema para subir comprobante de pago
 */
export const uploadProofSchema = z.object({
  orderId: z.string().uuid('ID de orden inválido'),
  file: z.instanceof(File, { message: 'Debe proporcionar un archivo' }),
});

export type UploadProofDTO = z.infer<typeof uploadProofSchema>;

/**
 * Schema para aprobar/rechazar pago (admin)
 */
export const reviewPaymentSchema = z.object({
  orderId: z.string().uuid('ID de orden inválido'),
  action: z.enum(['approve', 'reject']),
  reason: z.string().max(500).optional(), // Requerido si es reject
});

export type ReviewPaymentDTO = z.infer<typeof reviewPaymentSchema>;
