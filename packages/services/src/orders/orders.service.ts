// packages/services/src/orders/orders.service.ts
// Propósito: Servicio centralizado para gestión de órdenes

import type { DrizzleClient } from '../common/types';
import type { AuthService } from '../auth/auth.service';
import {
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
  BusinessError,
  DatabaseError,
} from '../common/errors';
import { eq, desc } from 'drizzle-orm';

/**
 * Estados posibles de una orden
 */
export type OrderStatus =
  | 'awaiting_payment'
  | 'payment_pending_verification'
  | 'payment_confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

/**
 * Interfaz para crear una orden
 */
export interface CreateOrderData {
  items: Array<{
    productId: number;
    quantity: number;
    priceAtPurchase: string;
  }>;
  total: string;
  shippingAddress: string;
  shippingCity: string;
  shippingPhone: string;
  couponCode?: string;
}

/**
 * Interfaz para el resultado de una orden
 */
export interface Order {
  id: string;
  userId: string;
  total: string;
  shippingAddress: string;
  shippingCity: string;
  shippingPhone: string;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interfaz para orden con items completos
 */
export interface OrderWithDetails extends Order {
  items: Array<{
    id: number;
    orderId: string;
    productId: number;
    quantity: number;
    priceAtPurchase: string;
    product?: {
      id: number;
      name: string;
      slug: string;
      price: string;
      images: string[];
    };
  }>;
  paymentProofs?: Array<{
    id: number;
    orderId: string;
    filePath: string;
    uploadedAt: Date;
  }>;
}

/**
 * Servicio de Órdenes
 * 
 * Responsabilidades:
 * - Crear órdenes con validación
 * - Gestionar estado de órdenes
 * - Vincular comprobantes de pago
 * - Lógica de primera compra (referidos)
 */
export class OrdersService {
  constructor(
    private db: DrizzleClient,
    private auth: AuthService,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private ordersTable: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private orderItemsTable: any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
    // private paymentProofsTable: any // TODO: Usar cuando implementemos upload de proofs
  ) {}

  /**
   * Crea una nueva orden
   */
  async create(data: CreateOrderData): Promise<Order> {
    const user = await this.auth.getCurrentUser();

    if (!user) {
      throw new UnauthorizedError();
    }

    // Validar que haya items
    if (!data.items || data.items.length === 0) {
      throw new ValidationError('Debe haber al menos un producto');
    }

    // Validar total
    const totalAmount = parseFloat(data.total);
    if (isNaN(totalAmount) || totalAmount <= 0) {
      throw new ValidationError('Total inválido');
    }

    try {
      // Usar transacción para garantizar atomicidad
      const newOrder = await this.db.transaction(async (tx) => {
        // 1. Crear orden
        const [order] = await tx
          .insert(this.ordersTable)
          .values({
            userId: user.id,
            total: data.total,
            shippingAddress: data.shippingAddress,
            shippingCity: data.shippingCity,
            shippingPhone: data.shippingPhone,
            status: 'awaiting_payment',
          })
          .returning();

        // 2. Crear items de la orden
        const itemsToInsert = data.items.map((item) => ({
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          priceAtPurchase: item.priceAtPurchase,
        }));

        await tx.insert(this.orderItemsTable).values(itemsToInsert);

        return order as Order;
      });

      return newOrder;
    } catch (error) {
      console.error('Error creating order:', error);
      throw new DatabaseError('No se pudo crear la orden');
    }
  }

  /**
   * Obtiene una orden por ID
   */
  async getById(orderId: string): Promise<OrderWithDetails> {
    const user = await this.auth.getCurrentUser();

    if (!user) {
      throw new UnauthorizedError();
    }

    const result = await this.db
      .select()
      .from(this.ordersTable)
      .where(eq(this.ordersTable.id, orderId))
      .limit(1);

    const order = result[0];

    if (!order) {
      throw new NotFoundError('Orden', orderId);
    }

    // Verificar permisos: solo el dueño o admin pueden ver la orden
    const isAdmin = await this.auth.isAdmin();
    if (order.userId !== user.id && !isAdmin) {
      throw new ForbiddenError('No tienes permiso para ver esta orden');
    }

    // TODO: Cargar items y payment proofs con joins
    // Por ahora retornamos la orden básica
    return order as OrderWithDetails;
  }

  /**
   * Obtiene todas las órdenes de un usuario
   */
  async getByUser(userId?: string): Promise<OrderWithDetails[]> {
    const user = await this.auth.getCurrentUser();

    if (!user) {
      throw new UnauthorizedError();
    }

    // Si no se especifica userId, usar el del usuario actual
    const targetUserId = userId || user.id;

    // Solo admin puede ver órdenes de otros usuarios
    if (targetUserId !== user.id) {
      await this.auth.requireAdmin();
    }

    const orders = await this.db
      .select()
      .from(this.ordersTable)
      .where(eq(this.ordersTable.userId, targetUserId))
      .orderBy(desc(this.ordersTable.createdAt));

    // TODO: Cargar items y payment proofs
    return orders as OrderWithDetails[];
  }

  /**
   * Actualiza el estado de una orden (solo admin)
   */
  async updateStatus(
    orderId: string,
    status: OrderStatus,
    _adminNotes?: string // Prefix con _ para indicar que está intencionalmente sin usar
  ): Promise<void> {
    // Verificar que sea admin
    await this.auth.requireAdmin();

    // Verificar que la orden existe
    const orderResult = await this.db
      .select()
      .from(this.ordersTable)
      .where(eq(this.ordersTable.id, orderId))
      .limit(1);

    if (!orderResult[0]) {
      throw new NotFoundError('Orden', orderId);
    }

    // Validar transiciones de estado
    const currentStatus = orderResult[0].status as OrderStatus;
    if (!this.isValidStatusTransition(currentStatus, status)) {
      throw new BusinessError(
        `No se puede cambiar de "${currentStatus}" a "${status}"`
      );
    }

    // Actualizar estado
    await this.db
      .update(this.ordersTable)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(this.ordersTable.id, orderId));
  }

  /**
   * Verifica si es la primera compra del usuario
   */
  async isFirstPurchase(userId: string): Promise<boolean> {
    const orders = await this.db
      .select()
      .from(this.ordersTable)
      .where(eq(this.ordersTable.userId, userId));

    return orders.length === 1; // Solo existe la orden actual
  }

  /**
   * Aprueba el pago de una orden (admin)
   */
  async approvePayment(orderId: string): Promise<void> {
    await this.auth.requireAdmin();

    await this.updateStatus(orderId, 'payment_confirmed');
  }

  /**
   * Rechaza el pago de una orden (admin)
   */
  async rejectPayment(orderId: string, reason?: string): Promise<void> {
    await this.auth.requireAdmin();

    // Volver a estado de espera de pago
    await this.updateStatus(orderId, 'awaiting_payment');

    // TODO: Enviar notificación al usuario con el motivo del rechazo
    console.log(`Payment rejected for order ${orderId}. Reason: ${reason}`);
  }

  /**
   * Valida si una transición de estado es válida
   * Implementa una máquina de estados para las órdenes
   */
  private isValidStatusTransition(
    from: OrderStatus,
    to: OrderStatus
  ): boolean {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      awaiting_payment: ['payment_pending_verification', 'cancelled'],
      payment_pending_verification: ['payment_confirmed', 'awaiting_payment', 'cancelled'],
      payment_confirmed: ['processing', 'cancelled'],
      processing: ['shipped', 'cancelled'],
      shipped: ['delivered'],
      delivered: [], // Estado final
      cancelled: [], // Estado final
    };

    return validTransitions[from]?.includes(to) || false;
  }

  /**
   * Obtiene todas las órdenes pendientes de verificación (admin)
   */
  async getPendingVerification(): Promise<OrderWithDetails[]> {
    await this.auth.requireAdmin();

    const orders = await this.db
      .select()
      .from(this.ordersTable)
      .where(eq(this.ordersTable.status, 'payment_pending_verification'))
      .orderBy(desc(this.ordersTable.createdAt));

    return orders as OrderWithDetails[];
  }

  /**
   * Obtiene estadísticas de órdenes (admin)
   */
  async getStats() {
    await this.auth.requireAdmin();

    // TODO: Implementar queries agregadas para estadísticas
    // - Total de órdenes por estado
    // - Ingresos totales
    // - Órdenes del día/semana/mes
    // - Promedio de orden

    return {
      total: 0,
      pending: 0,
      confirmed: 0,
      shipped: 0,
      delivered: 0,
    };
  }
}
