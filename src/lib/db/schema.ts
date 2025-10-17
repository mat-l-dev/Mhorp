// src/lib/db/schema.ts
// Propósito: Definir todos los esquemas de la base de datos usando Drizzle ORM.

import { pgTable, text, serial, timestamp, integer, decimal, json, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Tabla de productos
export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  images: json('images').$type<string[]>(),
  stock: integer('stock').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Tabla de usuarios (complementaria a Supabase Auth)
export const users = pgTable('users', {
  id: text('id').primaryKey(), // Coincide con el ID de Supabase Auth
  email: text('email').notNull().unique(),
  name: text('name'),
  role: text('role').default('customer').notNull(), // 'customer' | 'admin'
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

// Relaciones
export const productsRelations = relations(products, ({ many }) => ({
  cartItems: many(cartItems),
  orderItems: many(orderItems),
}));

export const usersRelations = relations(users, ({ many }) => ({
  carts: many(carts),
  orders: many(orders),
  paymentProofs: many(paymentProofs),
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
