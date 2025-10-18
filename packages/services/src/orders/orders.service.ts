// packages/services/src/orders/orders.service.ts
// Propósito: Servicio centralizado para gestión de órdenes

import type { DrizzleClient } from '../common/types';
import type { AuthService } from '../auth/auth.service';
import type { StorageService } from '../storage/storage.service';
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
  id: number;
  userId: string;
  total: string;
  shippingAddress: string;
  shippingCity: string;
  shippingPostalCode?: string | null;
  shippingPhone: string;
  status: OrderStatus;
  paymentProofUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interfaz para orden con items completos
 */
export interface OrderWithDetails extends Order {
  items: Array<{
    id: number;
    orderId: number;
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
    orderId: number;
    userId: string;
    filePath: string;
    status: 'pending_review' | 'approved' | 'rejected';
    adminNotes?: string | null;
    uploadedAt: Date;
  }>;
  user?: {
    id: string;
    email: string;
    name?: string | null;
  };
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
    private orderItemsTable: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private paymentProofsTable: any,
    private storage?: StorageService // Opcional para no romper código existente
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
  /**
   * Obtiene una orden por ID con todos sus detalles
   */
  async getById(orderId: number | string): Promise<OrderWithDetails> {
    const user = await this.auth.getCurrentUser();

    if (!user) {
      throw new UnauthorizedError();
    }

    // Convertir a number si viene como string
    const orderIdNum = typeof orderId === 'string' ? parseInt(orderId, 10) : orderId;

    // Usar db.query para obtener orden con relaciones
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const order = await (this.db as any).query.orders.findFirst({
      where: (orders: any, { eq }: any) => eq(orders.id, orderIdNum),
      with: {
        items: {
          with: {
            product: true,
          },
        },
        paymentProofs: true,
        user: true,
      },
    });

    if (!order) {
      throw new NotFoundError('Orden', orderId.toString());
    }

    // Verificar permisos: solo el dueño o admin pueden ver la orden
    const isAdmin = await this.auth.isAdmin();
    if (order.userId !== user.id && !isAdmin) {
      throw new ForbiddenError('No tienes permiso para ver esta orden');
    }

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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orders = await (this.db as any).query.orders.findMany({
      where: (orders: any, { eq }: any) => eq(orders.userId, targetUserId),
      orderBy: (orders: any, { desc }: any) => [desc(orders.createdAt)],
      with: {
        items: {
          with: {
            product: true,
          },
        },
        paymentProofs: true,
      },
    });

    return orders as OrderWithDetails[];
  }

  /**
   * Actualiza el estado de una orden (solo admin)
   */
  async updateStatus(
    orderId: string | number,
    status: OrderStatus,
    _adminNotes?: string // Prefix con _ para indicar que está intencionalmente sin usar
  ): Promise<void> {
    // Verificar que sea admin
    await this.auth.requireAdmin();

    // Convertir a number si viene como string
    const orderIdNum = typeof orderId === 'string' ? parseInt(orderId, 10) : orderId;

    // Verificar que la orden existe
    const orderResult = await this.db
      .select()
      .from(this.ordersTable)
      .where(eq(this.ordersTable.id, orderIdNum))
      .limit(1);

    if (!orderResult[0]) {
      throw new NotFoundError('Orden', orderId.toString());
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
      .where(eq(this.ordersTable.id, orderIdNum));
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
   * Aprueba el pago de una orden y su comprobante (admin)
   */
  async approvePayment(orderId: string | number, proofId?: number): Promise<void> {
    await this.auth.requireAdmin();

    // Si se proporciona proofId, actualizar el estado del comprobante
    if (proofId) {
      await this.db
        .update(this.paymentProofsTable)
        .set({ status: 'approved' })
        .where(eq(this.paymentProofsTable.id, proofId));
    }

    // Actualizar el estado de la orden a confirmado
    await this.updateStatus(orderId, 'payment_confirmed');

    // TODO: Enviar email de confirmación al cliente
  }

  /**
   * Rechaza el pago de una orden y su comprobante (admin)
   */
  async rejectPayment(orderId: string | number, proofId?: number, reason?: string): Promise<void> {
    await this.auth.requireAdmin();

    // Si se proporciona proofId, actualizar el estado del comprobante
    if (proofId) {
      await this.db
        .update(this.paymentProofsTable)
        .set({ 
          status: 'rejected',
          adminNotes: reason,
        })
        .where(eq(this.paymentProofsTable.id, proofId));
    }

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
   * Sube un comprobante de pago para una orden
   */
  async uploadProof(orderId: string | number, file: File): Promise<{ path: string; signedUrl?: string }> {
    const user = await this.auth.getCurrentUser();

    if (!user) {
      throw new UnauthorizedError();
    }

    if (!this.storage) {
      throw new BusinessError('StorageService no configurado');
    }

    // Convertir a number si viene como string
    const orderIdNum = typeof orderId === 'string' ? parseInt(orderId, 10) : orderId;

    // Verificar que la orden existe y pertenece al usuario
    const orderResult = await this.db
      .select()
      .from(this.ordersTable)
      .where(eq(this.ordersTable.id, orderIdNum))
      .limit(1);

    const order = orderResult[0];

    if (!order) {
      throw new NotFoundError('Orden', orderId.toString());
    }

    // Verificar permisos
    const isAdmin = await this.auth.isAdmin();
    if (order.userId !== user.id && !isAdmin) {
      throw new ForbiddenError('No puedes subir comprobantes para esta orden');
    }

    // Subir archivo usando StorageService
    const uploadResult = await this.storage.uploadPaymentProof(
      user.id,
      orderIdNum.toString(),
      file
    );

    // Crear registro en payment_proofs
    await this.db.insert(this.paymentProofsTable).values({
      orderId: orderIdNum,
      userId: user.id,
      filePath: uploadResult.path,
    });

    // Actualizar estado de la orden a "payment_pending_verification"
    await this.db
      .update(this.ordersTable)
      .set({
        status: 'payment_pending_verification',
        updatedAt: new Date(),
      })
      .where(eq(this.ordersTable.id, orderIdNum));

    return {
      path: uploadResult.path,
      signedUrl: uploadResult.signedUrl,
    };
  }

  /**
   * Obtiene todas las órdenes pendientes de verificación (admin)
   */
  /**
   * Obtiene órdenes pendientes de verificación de pago (admin)
   */
  async getPendingVerification(): Promise<OrderWithDetails[]> {
    await this.auth.requireAdmin();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orders = await (this.db as any).query.orders.findMany({
      where: (orders: any, { eq }: any) => eq(orders.status, 'payment_pending_verification'),
      orderBy: (orders: any, { desc }: any) => [desc(orders.createdAt)],
      with: {
        items: {
          with: {
            product: true,
          },
        },
        paymentProofs: true,
        user: true,
      },
    });

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
