// src/lib/db/schema.ts
// Propósito: Definir todos los esquemas de la base de datos usando Drizzle ORM.

import { pgTable, text, serial, timestamp, integer, decimal, json, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role', ['customer', 'admin']);
export const couponTypeEnum = pgEnum('coupon_type', ['percentage', 'fixed']);

// Tabla de categorías
export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Tabla de productos
export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  images: json('images').$type<string[]>(),
  stock: integer('stock').default(0),
  categoryId: integer('category_id').references(() => categories.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Tabla de usuarios (complementaria a Supabase Auth)
export const users = pgTable('users', {
  id: text('id').primaryKey(), // Coincide con el ID de Supabase Auth
  email: text('email').notNull().unique(),
  name: text('name'),
  role: userRoleEnum('role').default('customer').notNull(), // 'customer' | 'admin'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Tabla de carritos
export const carts = pgTable('carts', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Tabla de items del carrito
export const cartItems = pgTable('cart_items', {
  id: serial('id').primaryKey(),
  cartId: integer('cart_id').notNull().references(() => carts.id, { onDelete: 'cascade' }),
  productId: integer('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  quantity: integer('quantity').notNull().default(1),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Tabla de pedidos
export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  total: decimal('total', { precision: 10, scale: 2 }).notNull(),
  status: text('status').notNull().default('pending'), // 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  shippingAddress: text('shipping_address').notNull(),
  shippingCity: text('shipping_city').notNull(),
  shippingPostalCode: text('shipping_postal_code'),
  shippingPhone: text('shipping_phone').notNull(),
  paymentProofUrl: text('payment_proof_url'),
  couponId: integer('coupon_id').references(() => coupons.id),
  discountAmount: decimal('discount_amount', { precision: 10, scale: 2 }).default('0').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Tabla de items del pedido
export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  productId: integer('product_id').notNull().references(() => products.id),
  quantity: integer('quantity').notNull(),
  priceAtPurchase: decimal('price_at_purchase', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Enum para estados de comprobantes de pago
export const proofStatusEnum = pgEnum('proof_status', [
  'pending_review',
  'approved',
  'rejected',
]);

// Tabla de comprobantes de pago
export const paymentProofs = pgTable('payment_proofs', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  filePath: text('file_path').notNull(), // Ruta al archivo en Supabase Storage
  status: proofStatusEnum('status').default('pending_review').notNull(),
  adminNotes: text('admin_notes'), // Feedback del admin en caso de rechazo
  uploadedAt: timestamp('uploaded_at').defaultNow().notNull(),
});

// Tabla de reseñas de productos
export const reviews = pgTable('reviews', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  productId: integer('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
  rating: integer('rating').notNull(), // Calificación de 1 a 5
  comment: text('comment'),
  isVerified: boolean('is_verified').default(false).notNull(), // Compra verificada
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Tabla de lista de deseos (wishlist)
export const wishlistItems = pgTable('wishlist_items', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  productId: integer('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Tabla de cupones de descuento
export const coupons = pgTable('coupons', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),
  discountType: couponTypeEnum('discount_type').notNull(),
  discountValue: decimal('discount_value', { precision: 10, scale: 2 }).notNull(),
  expiresAt: timestamp('expires_at'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relaciones
export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  cartItems: many(cartItems),
  orderItems: many(orderItems),
  reviews: many(reviews),
}));

export const usersRelations = relations(users, ({ many }) => ({
  carts: many(carts),
  orders: many(orders),
  paymentProofs: many(paymentProofs),
  reviews: many(reviews),
  wishlistItems: many(wishlistItems),
}));

export const cartsRelations = relations(carts, ({ one, many }) => ({
  user: one(users, {
    fields: [carts.userId],
    references: [users.id],
  }),
  items: many(cartItems),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  cart: one(carts, {
    fields: [cartItems.cartId],
    references: [carts.id],
  }),
  product: one(products, {
    fields: [cartItems.productId],
    references: [products.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  coupon: one(coupons, {
    fields: [orders.couponId],
    references: [coupons.id],
  }),
  items: many(orderItems),
  paymentProofs: many(paymentProofs),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const paymentProofsRelations = relations(paymentProofs, ({ one }) => ({
  order: one(orders, {
    fields: [paymentProofs.orderId],
    references: [orders.id],
  }),
  user: one(users, {
    fields: [paymentProofs.userId],
    references: [users.id],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [reviews.productId],
    references: [products.id],
  }),
}));

export const wishlistItemsRelations = relations(wishlistItems, ({ one }) => ({
  user: one(users, {
    fields: [wishlistItems.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [wishlistItems.productId],
    references: [products.id],
  }),
}));

export const couponsRelations = relations(coupons, ({ many }) => ({
  orders: many(orders),
}));

// Tabla de historial de precios
export const priceHistory = pgTable('price_history', {
  id: serial('id').primaryKey(),
  productId: integer('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const priceHistoryRelations = relations(priceHistory, ({ one }) => ({
  product: one(products, {
    fields: [priceHistory.productId],
    references: [products.id],
  }),
}));

// Tabla de wishlists compartibles
export const sharedWishlists = pgTable('shared_wishlists', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(), // Token único para el link compartible
  name: text('name'), // Nombre opcional de la wishlist (ej: "Cumpleaños de Juan")
  description: text('description'), // Descripción opcional
  isPublic: boolean('is_public').default(true).notNull(), // Si es visible públicamente
  viewCount: integer('view_count').default(0).notNull(), // Contador de vistas
  expiresAt: timestamp('expires_at'), // Fecha de expiración opcional
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const sharedWishlistsRelations = relations(sharedWishlists, ({ one }) => ({
  user: one(users, {
    fields: [sharedWishlists.userId],
    references: [users.id],
  }),
}));

// ============================================
// SISTEMA DE REFERIDOS
// ============================================

// Enum para el estado de los referidos
export const referralStatusEnum = pgEnum('referral_status', ['pending', 'completed', 'rewarded']);

// Tabla de referidos
export const userReferrals = pgTable('user_referrals', {
  id: serial('id').primaryKey(),
  
  // Usuario que refiere (el que invita)
  referrerUserId: text('referrer_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  // Usuario referido (el nuevo que se registra)
  referredUserId: text('referred_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  
  // Código de referido usado
  referralCode: text('referral_code').notNull(),
  
  // Estado del referido
  status: text('status').notNull().default('pending'), // 'pending' | 'completed' | 'rewarded'
  
  // Orden de la primera compra (cuando se completa)
  firstOrderId: integer('first_order_id').references(() => orders.id, { onDelete: 'set null' }),
  
  // Valor de la primera compra
  firstOrderAmount: decimal('first_order_amount', { precision: 10, scale: 2 }),
  
  // Recompensas entregadas
  referrerRewardPoints: integer('referrer_reward_points').default(0),
  referredRewardCoupon: text('referred_reward_coupon'), // código del cupón dado al nuevo usuario
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'), // cuando hizo la primera compra
  rewardedAt: timestamp('rewarded_at'), // cuando se dieron las recompensas
});

// Tabla de estadísticas de referidos por usuario
export const referralStats = pgTable('referral_stats', {
  userId: text('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  
  // Código único de referido del usuario
  referralCode: text('referral_code').notNull().unique(),
  
  // Contadores
  totalReferrals: integer('total_referrals').default(0).notNull(), // Total de personas que se registraron
  completedReferrals: integer('completed_referrals').default(0).notNull(), // Cuántos hicieron su primera compra
  pendingReferrals: integer('pending_referrals').default(0).notNull(), // Cuántos están pendientes de comprar
  
  // Recompensas ganadas
  totalPointsEarned: integer('total_points_earned').default(0).notNull(), // Puntos ganados por referidos
  totalRevenueGenerated: decimal('total_revenue_generated', { precision: 10, scale: 2 }).default('0').notNull(), // Revenue generado por referidos
  
  // Mejor streak
  bestMonthReferrals: integer('best_month_referrals').default(0),
  bestMonthDate: timestamp('best_month_date'),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relaciones de referidos
export const userReferralsRelations = relations(userReferrals, ({ one }) => ({
  referrer: one(users, {
    fields: [userReferrals.referrerUserId],
    references: [users.id],
  }),
  referred: one(users, {
    fields: [userReferrals.referredUserId],
    references: [users.id],
  }),
  firstOrder: one(orders, {
    fields: [userReferrals.firstOrderId],
    references: [orders.id],
  }),
}));

export const referralStatsRelations = relations(referralStats, ({ one }) => ({
  user: one(users, {
    fields: [referralStats.userId],
    references: [users.id],
  }),
}));
