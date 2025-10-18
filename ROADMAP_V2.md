# 🚀 Roadmap Maestro Definitivo de Mhorp

> **De MVP a Plataforma E-commerce de Clase Enterprise**  
> **Última actualización:** Octubre 18, 2025  
> **Versión:** 2.0 (Arquitectónicamente Mejorado)

---

## 🎯 Filosofía

Este roadmap integra:
1. **Features de negocio** (reseñas, cupones, referidos, etc.)
2. **Excelencia arquitectónica** (servicios, RLS, testing, DDD)
3. **Mejores prácticas** de repos de clase mundial (HiyoRi, next-prisma, etc.)

Cada fase construye sobre la anterior. No saltaremos de implementar features sin la arquitectura correcta.

---

## 📊 Estado Global de Implementación

| Fase | Descripción | Completado | Estado |
|------|-------------|------------|--------|
| **Fase 1** | Fundación Sólida (MVP) | 100% | ✅ COMPLETADO |
| **Fase 2** | Engagement & Features | 100% | ✅ COMPLETADO |
| **Fase 3** | CI/CD & Producción | 100% | ✅ COMPLETADO |
| **Fase 4** | Refactoring Arquitectónico | 0% | 🔥 **PRIORITARIO** |
| **Fase 5** | Features Avanzadas | 0% | 📋 Pendiente |
| **Fase 6** | Escalabilidad Enterprise | 0% | 📋 Futuro |

---

## ✅ FASE 1: FUNDACIÓN SÓLIDA (100% COMPLETADA)

**Objetivo:** MVP funcional de producción

### Hitos Alcanzados:
- ✅ Autenticación (Supabase Auth)
- ✅ CRUD Productos/Categorías
- ✅ Carrito Persistente (Zustand)
- ✅ Flujo de Compra
- ✅ Panel Admin
- ✅ UI Pulida (shadcn/ui + Tailwind)

**Último commit:** `ed55af6`

---

## ✅ FASE 2: CRECIMIENTO Y FIDELIZACIÓN (100% COMPLETADA)

**Objetivo:** Aumentar interacción, confianza y lealtad del cliente

### ✅ Misión 2.1: Sistema de Reseñas y Calificaciones **[COMPLETADO]**

**Archivos implementados:**
```
✅ src/lib/db/schema.ts (tabla reviews)
✅ src/actions/review.ts (submitReview, getProductReviews, canUserReview)
✅ src/components/shared/StarRating.tsx
✅ src/components/shared/ReviewForm.tsx
✅ src/components/shared/ProductReviewsList.tsx
✅ migrations/008_add_performance_indexes.sql (índices de reviews)
```

**Features:**
- ✅ Solo compradores verificados pueden reseñar
- ✅ Calificación con estrellas (1-5)
- ✅ Promedio visible en productos
- ✅ Optimizado con índices PostgreSQL

**Documentación:** `ENGAGEMENT.md` (líneas 22-200)

---

### ✅ Misión 2.2: Lista de Deseos (Wishlist) **[COMPLETADO]**

**Archivos implementados:**
```
✅ src/lib/db/schema.ts (tabla wishlist_items)
✅ src/actions/wishlist.ts (addToWishlist, removeFromWishlist, getUserWishlist)
✅ src/components/shared/WishlistButton.tsx
✅ src/app/(store)/account/wishlist/page.tsx
✅ BONUS: Wishlists Compartibles (shared-wishlist.ts, migrations/007)
```

**Features:**
- ✅ Agregar/quitar con un clic
- ✅ Corazón visual (lleno/vacío)
- ✅ Página dedicada `/account/wishlist`
- ✅ **EXTRA:** Links compartibles públicos

**Documentación:** `ENGAGEMENT.md` (líneas 202-360)

---

### ✅ Misión 2.3: Sistema de Cupones **[COMPLETADO]**

**Archivos implementados:**
```
✅ src/lib/db/schema.ts (tabla coupons)
✅ src/actions/coupon.ts (applyCoupon, CRUD admin)
✅ src/app/(admin)/admin/coupons/* (CRUD completo)
✅ src/components/admin/coupons/CouponForm.tsx
✅ Integración en carrito (/cart/page.tsx)
```

**Features:**
- ✅ Descuento porcentual y fijo
- ✅ Validación de expiración
- ✅ Panel admin completo
- ✅ Aplicación en checkout

**Documentación:** `ENGAGEMENT.md` (líneas 362-670)

---

### ✅ Features Extras Implementadas (No estaban en roadmap)

1. **Sistema de Referidos** (779c288)
   - Código único por usuario
   - Recompensas automáticas (200 puntos + cupón 10%)
   - Dashboard de métricas
   - Detección de primera compra

2. **Notificaciones de Precio**
   - Emails automáticos cuando baja precio
   - Cron job diario
   - Template HTML responsive

3. **Dashboard de Analytics** (ad33e45)
   - Métricas de ventas
   - Productos más vendidos
   - Cupones más usados
   - Conversión wishlist → compra

4. **PWA Completa** (88408ba)
   - Service Worker
   - Offline support
   - Installable app

---

## ✅ FASE 3: PROFESIONALIZACIÓN Y PRODUCCIÓN (100% COMPLETADA)

**Objetivo:** Fortalecer calidad, seguridad y mantenibilidad

### ✅ Misión 3.1: Pipeline CI y Testing **[COMPLETADO]**

**Archivos implementados:**
```
✅ .github/workflows/ci.yml (GitHub Actions)
✅ vitest.config.ts
✅ src/test/setup.ts
✅ src/lib/utils.test.ts (test ejemplo)
```

**Pipeline ejecuta:**
- ✅ `pnpm lint`
- ✅ `pnpm typecheck`
- ✅ `pnpm build`

**Estado:** CI/CD activo (último push: fa80622)

---

### ✅ Misión 3.2: Contenerización con Docker **[COMPLETADO]**

**Archivos implementados:**
```
✅ Dockerfile (multi-stage: deps → builder → runner)
✅ docker-compose.yml
✅ .dockerignore
✅ README.md (sección Docker)
```

**Comandos:**
```bash
docker build -t mhorp .
docker-compose up
```

---

## 🔥 FASE 4: REFACTORING ARQUITECTÓNICO (0% - **PRIORITARIO**)

> **Inspirado en:** HiyoRi-Ecommerce, next-prisma-tailwind, svelte-commerce

**Objetivo:** Evolucionar de MVP a arquitectura enterprise-grade

**Análisis completo:** Ver `ARQUITECTURA_ANALISIS.md`

---

### 🚨 Misión 4.1: Implementar Capa de Servicios **[CRÍTICO]**

**Problema actual:**
```typescript
// ❌ Acceso directo disperso en 50+ archivos
const supabase = await createClient();
const user = await supabase.auth.getUser();
const orders = await db.query.orders.findMany({ ... });
```

**Solución: Patrón Adaptador**

**Estructura propuesta:**
```
packages/services/src/
├── auth/
│   ├── auth.service.ts
│   ├── auth.types.ts
│   └── __tests__/
├── orders/
│   ├── orders.service.ts
│   ├── orders.repository.ts
│   ├── dto/
│   │   ├── create-order.dto.ts
│   │   └── update-order.dto.ts
│   └── __tests__/
├── products/
│   ├── products.service.ts
│   └── __tests__/
├── payments/
│   ├── payments.service.ts
│   ├── manual-payment.handler.ts
│   └── __tests__/
└── common/
    ├── errors.ts
    └── types.ts
```

**Ejemplo de implementación:**

```typescript
// ✅ packages/services/src/orders/orders.service.ts
export class OrdersService {
  constructor(
    private db: DrizzleClient,
    private auth: AuthService,
    private storage: StorageService
  ) {}

  async create(data: CreateOrderDTO): Promise<Order> {
    const user = await this.auth.getCurrentUser();
    if (!user) throw new UnauthorizedError();
    
    return this.db.transaction(async (tx) => {
      const order = await tx.insert(orders).values({
        userId: user.id,
        ...data
      }).returning();
      
      await this.reserveStock(tx, order.items);
      await this.notifyAdmin(order.id);
      
      return order[0];
    });
  }

  async uploadProof(orderId: string, file: File): Promise<void> {
    const user = await this.auth.getCurrentUser();
    const order = await this.getById(orderId);
    
    if (order.userId !== user.id) {
      throw new ForbiddenError('No es tu orden');
    }

    const { path } = await this.storage.uploadPaymentProof(
      user.id,
      orderId,
      file
    );

    await this.db.insert(paymentProofs).values({
      orderId,
      userId: user.id,
      filePath: path
    });
  }
}

// ✅ apps/storefront/src/actions/order.ts (refactorizado)
import { ordersService } from '@mhorp/services';

export async function createOrder(data: CreateOrderDTO) {
  'use server';
  try {
    const order = await ordersService.create(data);
    revalidatePath('/orders');
    return { success: true, order };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { error: 'No autorizado' };
    }
    return { error: 'Error al crear orden' };
  }
}
```

**Beneficios:**
- ✅ Lógica de negocio centralizada
- ✅ Fácil de testear (mocks)
- ✅ Cambiar backend sin tocar UI
- ✅ Reutilizable en admin y storefront

**Pasos de implementación:**

1. **Crear estructura de packages**
   ```bash
   mkdir -p packages/services/src/{auth,orders,products,payments,common}
   ```

2. **Implementar AuthService** (base para todo)
   ```typescript
   // packages/services/src/auth/auth.service.ts
   export class AuthService {
     async getCurrentUser(): Promise<User | null> { ... }
     async isAdmin(): Promise<boolean> { ... }
     async signIn(email: string, password: string): Promise<Session> { ... }
   }
   ```

3. **Migrar OrdersService** (más complejo)
   - Extraer lógica de `src/actions/order.ts`
   - Crear DTOs con Zod
   - Escribir tests unitarios

4. **Migrar ProductsService**
5. **Migrar PaymentsService**

**Estimación:** 2 semanas (40 horas)

---

### 🔒 Misión 4.2: Implementar RLS Completo **[SEGURIDAD CRÍTICA]**

**Problema actual:**
- ✅ Algunas políticas RLS básicas
- ❌ No todas las tablas protegidas
- ❌ Supabase Storage sin políticas

**Solución: RLS Total**

**Migración propuesta:**

```sql
-- migrations/010_complete_rls_policies.sql

-- ============================================
-- 1. TABLA ORDERS
-- ============================================
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Usuarios ven solo sus órdenes
CREATE POLICY "users_read_own_orders" ON orders
  FOR SELECT USING (auth.uid() = user_id);

-- Usuarios crean solo sus órdenes
CREATE POLICY "users_create_own_orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins ven todas las órdenes
CREATE POLICY "admins_read_all_orders" ON orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins actualizan estados
CREATE POLICY "admins_update_orders" ON orders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- 2. TABLA PAYMENT_PROOFS
-- ============================================
ALTER TABLE payment_proofs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_manage_own_proofs" ON payment_proofs
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "admins_view_all_proofs" ON payment_proofs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- 3. TABLA REVIEWS
-- ============================================
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Todos leen reviews
CREATE POLICY "anyone_read_reviews" ON reviews
  FOR SELECT USING (true);

-- Solo dueño edita/borra
CREATE POLICY "users_manage_own_reviews" ON reviews
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- 4. TABLA WISHLIST_ITEMS
-- ============================================
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_manage_own_wishlist" ON wishlist_items
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- 5. TABLA COUPONS (solo admin)
-- ============================================
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- Todos pueden leer cupones activos (para validar)
CREATE POLICY "anyone_read_active_coupons" ON coupons
  FOR SELECT USING (is_active = true);

-- Solo admin CRUD
CREATE POLICY "admins_manage_coupons" ON coupons
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- 6. SUPABASE STORAGE (payment-proofs bucket)
-- ============================================

-- Política: Solo el dueño puede subir
CREATE POLICY "users_upload_own_proofs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'payment-proofs' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Política: Usuario ve sus archivos, admin ve todos
CREATE POLICY "users_view_own_proofs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'payment-proofs' AND (
    auth.uid()::text = (storage.foldername(name))[1] OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  )
);

-- Política: Solo dueño borra
CREATE POLICY "users_delete_own_proofs"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'payment-proofs' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

**Testing de RLS:**

```sql
-- Verificar políticas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Test como usuario normal
SET ROLE authenticated;
SET request.jwt.claims.sub = 'user-uuid-123';

-- Debería funcionar
SELECT * FROM orders WHERE user_id = 'user-uuid-123';

-- Debería dar 0 resultados
SELECT * FROM orders WHERE user_id = 'otro-user';
```

**Estimación:** 1 semana (20 horas)

---

### 🧪 Misión 4.3: Testing Exhaustivo **[CALIDAD]**

**Estado actual:**
```
✅ Vitest configurado
⚠️ Solo 1 test (utils.test.ts)
❌ 0% cobertura real
❌ Sin E2E
```

**Objetivo:** 80%+ cobertura

**Plan de implementación:**

#### 1. Unit Tests (Servicios)

```typescript
// packages/services/src/orders/__tests__/orders.service.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OrdersService } from '../orders.service';
import { mockDb, mockAuth, mockStorage } from '@mhorp/test-utils';

describe('OrdersService', () => {
  let ordersService: OrdersService;

  beforeEach(() => {
    ordersService = new OrdersService(mockDb, mockAuth, mockStorage);
  });

  describe('create', () => {
    it('debería crear orden con items correctos', async () => {
      mockAuth.getCurrentUser.mockResolvedValue({
        id: 'user-123',
        email: 'test@test.com'
      });

      const result = await ordersService.create({
        items: [{ productId: 1, quantity: 2, price: '100.00' }],
        shippingAddress: '123 Main St',
        shippingCity: 'Lima',
        shippingPhone: '999999999'
      });

      expect(result).toBeDefined();
      expect(result.status).toBe('awaiting_payment');
      expect(mockDb.insert).toHaveBeenCalledWith(orders);
    });

    it('debería lanzar UnauthorizedError si no hay usuario', async () => {
      mockAuth.getCurrentUser.mockResolvedValue(null);

      await expect(
        ordersService.create({ items: [], shippingAddress: '' })
      ).rejects.toThrow(UnauthorizedError);
    });

    it('debería llamar reserveStock para cada item', async () => {
      mockAuth.getCurrentUser.mockResolvedValue({ id: 'user-123' });
      
      const spy = vi.spyOn(ordersService, 'reserveStock');

      await ordersService.create({
        items: [
          { productId: 1, quantity: 2 },
          { productId: 2, quantity: 1 }
        ]
      });

      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  describe('uploadProof', () => {
    it('debería subir archivo y crear registro', async () => {
      const file = new File(['test'], 'proof.pdf', { type: 'application/pdf' });
      
      mockAuth.getCurrentUser.mockResolvedValue({ id: 'user-123' });
      mockStorage.uploadPaymentProof.mockResolvedValue({
        path: 'proofs/user-123/order-456/proof.pdf',
        url: 'https://...'
      });

      await ordersService.uploadProof('order-456', file);

      expect(mockStorage.uploadPaymentProof).toHaveBeenCalled();
      expect(mockDb.insert).toHaveBeenCalledWith(paymentProofs);
    });

    it('debería lanzar ForbiddenError si orden no pertenece al usuario', async () => {
      mockAuth.getCurrentUser.mockResolvedValue({ id: 'user-123' });
      mockDb.query.orders.findFirst.mockResolvedValue({
        id: 'order-456',
        userId: 'otro-user' // ❌ Otro usuario
      });

      await expect(
        ordersService.uploadProof('order-456', new File([], 'test'))
      ).rejects.toThrow(ForbiddenError);
    });
  });
});
```

#### 2. Integration Tests (API)

```typescript
// apps/storefront/__tests__/integration/orders.test.ts
import { describe, it, expect } from 'vitest';
import { POST } from '@/app/api/orders/route';

describe('POST /api/orders', () => {
  it('debería crear orden y retornar 201', async () => {
    const request = new Request('http://localhost:3000/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{ productId: 1, quantity: 2 }],
        shippingAddress: '123 Main St'
      })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toHaveProperty('orderId');
  });

  it('debería retornar 401 si no autenticado', async () => {
    // Mockear getUser() para retornar null
    const response = await POST(new Request('...', { ... }));
    expect(response.status).toBe(401);
  });
});
```

#### 3. E2E Tests (Playwright)

```typescript
// apps/storefront/__tests__/e2e/checkout-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Flujo completo de compra', () => {
  test('usuario puede comprar producto y subir comprobante', async ({ page }) => {
    // 1. Login
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@test.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // 2. Agregar producto
    await page.goto('/');
    await page.click('text=Ver producto').first();
    await page.click('text=Agregar al carrito');
    await expect(page.locator('text=Producto agregado')).toBeVisible();

    // 3. Ir al carrito
    await page.click('[href="/cart"]');
    await expect(page).toHaveURL('/cart');

    // 4. Proceder al checkout
    await page.click('text=Proceder al pago');
    await expect(page).toHaveURL('/checkout');

    // 5. Llenar datos de envío
    await page.fill('[name="shippingAddress"]', 'Av. Principal 123');
    await page.fill('[name="shippingCity"]', 'Lima');
    await page.fill('[name="shippingPhone"]', '987654321');
    await page.click('text=Confirmar orden');

    // 6. Verificar orden creada
    await expect(page).toHaveURL(/\/orders\/[a-z0-9-]+/);
    await expect(page.locator('text=Orden creada exitosamente')).toBeVisible();

    // 7. Subir comprobante
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/fixtures/comprobante.pdf');
    await page.click('text=Subir comprobante');
    
    await expect(page.locator('text=Comprobante subido')).toBeVisible();
    await expect(page.locator('text=Estado: Pendiente de confirmación')).toBeVisible();
  });

  test('admin puede aprobar comprobante', async ({ page }) => {
    // Login como admin
    await page.goto('/login');
    await page.fill('[name="email"]', 'admin@mhorp.com');
    await page.fill('[name="password"]', 'admin123');
    await page.click('button[type="submit"]');

    // Ir a panel admin
    await page.goto('/admin/orders');
    await expect(page.locator('text=Órdenes pendientes')).toBeVisible();

    // Revisar comprobante
    await page.click('text=Ver comprobante').first();
    await expect(page.locator('img, embed, iframe')).toBeVisible(); // Comprobante visible

    // Aprobar
    await page.click('text=Aprobar pago');
    await expect(page.locator('text=Pago aprobado')).toBeVisible();
  });
});
```

#### 4. Crear Test Utils

```typescript
// packages/test-utils/src/mocks/db.mock.ts
export const mockDb = {
  query: {
    orders: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    products: {
      findMany: vi.fn(),
    }
  },
  insert: vi.fn().mockReturnValue({
    values: vi.fn().mockReturnValue({
      returning: vi.fn()
    })
  }),
  update: vi.fn().mockReturnValue({
    set: vi.fn().mockReturnValue({
      where: vi.fn()
    })
  }),
  transaction: vi.fn((callback) => callback(mockDb))
};

// packages/test-utils/src/mocks/auth.mock.ts
export const mockAuth = {
  getCurrentUser: vi.fn(),
  isAdmin: vi.fn(),
  signIn: vi.fn(),
};

// packages/test-utils/src/mocks/storage.mock.ts
export const mockStorage = {
  uploadPaymentProof: vi.fn(),
  getSignedUrl: vi.fn(),
};
```

**Scripts en package.json:**

```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest run src/**/*.test.ts",
    "test:integration": "vitest run __tests__/integration",
    "test:e2e": "playwright test",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest watch"
  }
}
```

**Estimación:** 2 semanas (40 horas)

---

### 📦 Misión 4.4: Validación Centralizada

**Problema:** Schemas Zod duplicados

**Solución:**

```typescript
// packages/validation/src/schemas/order.schema.ts
import { z } from 'zod';

export const createOrderSchema = z.object({
  items: z.array(z.object({
    productId: z.number().int().positive(),
    quantity: z.number().int().min(1).max(100),
    price: z.string().regex(/^\d+\.\d{2}$/)
  })).min(1, 'Debe haber al menos un item'),
  
  shippingAddress: z.string().min(10, 'Dirección muy corta').max(200),
  shippingCity: z.string().min(2).max(50),
  shippingPhone: z.string().regex(/^\d{9}$/, 'Debe ser 9 dígitos'),
  
  couponCode: z.string().optional(),
});

export type CreateOrderDTO = z.infer<typeof createOrderSchema>;

// packages/validation/src/schemas/review.schema.ts
export const createReviewSchema = z.object({
  productId: z.number().int().positive(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(10).max(500).optional()
});

export type CreateReviewDTO = z.infer<typeof createReviewSchema>;
```

**Uso:**

```typescript
// En servicio
import { createOrderSchema } from '@mhorp/validation';

async create(data: unknown): Promise<Order> {
  const validated = createOrderSchema.parse(data); // Lanza ZodError si falla
  // ... continuar con validated (type-safe)
}

// En Server Action
export async function createOrder(formData: FormData) {
  const result = createOrderSchema.safeParse({
    items: JSON.parse(formData.get('items')),
    shippingAddress: formData.get('shippingAddress'),
    // ...
  });

  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  return ordersService.create(result.data);
}
```

**Estimación:** 3 días (24 horas)

---

### 🎯 Resumen Fase 4

| Misión | Prioridad | Estimación | Impacto |
|--------|-----------|------------|---------|
| 4.1 Capa de Servicios | 🔥 Crítica | 2 semanas | ⭐⭐⭐⭐⭐ |
| 4.2 RLS Completo | 🔥 Crítica | 1 semana | ⭐⭐⭐⭐⭐ |
| 4.3 Testing Exhaustivo | ⚠️ Alta | 2 semanas | ⭐⭐⭐⭐ |
| 4.4 Validación Centralizada | ⚠️ Alta | 3 días | ⭐⭐⭐ |

**Total Fase 4:** 5-6 semanas

---

## 📋 FASE 5: FEATURES AVANZADAS (Pendiente)

> Estas features se implementarán **DESPUÉS** de completar Fase 4

### Misión 5.1: Stripe Integration

**Objetivo:** Ofrecer pago con tarjeta como alternativa al pago manual

**Estructura propuesta:**

```typescript
// packages/services/src/payments/payments.service.ts
export class PaymentsService {
  constructor(
    private stripe: Stripe,
    private manual: ManualPaymentHandler
  ) {}

  async processPayment(
    orderId: string,
    method: 'stripe' | 'manual'
  ): Promise<PaymentResult> {
    if (method === 'stripe') {
      return this.stripe.createCheckoutSession(orderId);
    } else {
      return this.manual.generateInstructions(orderId);
    }
  }
}
```

**Archivos a crear:**
```
✅ packages/services/src/payments/stripe.handler.ts
✅ packages/services/src/payments/manual.handler.ts
✅ apps/storefront/src/app/api/webhooks/stripe/route.ts
✅ apps/storefront/src/components/checkout/PaymentMethodSelector.tsx
```

**Features:**
- [ ] Crear sesión de Stripe Checkout
- [ ] Webhook para confirmar pagos
- [ ] UI para seleccionar método (Stripe vs Manual)
- [ ] Actualizar estado de orden automáticamente

**Estimación:** 1 semana

---

### Misión 5.2: Blog/CMS

**Objetivo:** Marketing de contenidos y SEO

**Estructura propuesta:**

```typescript
// packages/services/src/content/content.service.ts
export class ContentService {
  async createPost(data: CreatePostDTO): Promise<Post> { ... }
  async getPublishedPosts(): Promise<Post[]> { ... }
  async getPostBySlug(slug: string): Promise<Post | null> { ... }
}
```

**Schema:**
```sql
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  excerpt TEXT,
  author_id TEXT REFERENCES users(id),
  category_id INTEGER REFERENCES post_categories(id),
  featured_image TEXT,
  is_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE post_categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT
);
```

**Archivos a crear:**
```
✅ migrations/011_add_blog_tables.sql
✅ packages/services/src/content/content.service.ts
✅ apps/admin/src/app/blog/* (CRUD)
✅ apps/storefront/src/app/blog/page.tsx
✅ apps/storefront/src/app/blog/[slug]/page.tsx
```

**Features:**
- [ ] CRUD de posts (admin)
- [ ] Categorías de posts
- [ ] Editor rich text (Tiptap o similar)
- [ ] SEO metadata por post
- [ ] Vista pública de blog

**Estimación:** 2 semanas

---

### Misión 5.3: Gamificación

**Objetivo:** Sistema de puntos, niveles y badges

(Ver ROADMAP anterior para detalles)

**Estimación:** 3-4 semanas

---

### Misión 5.4: AI & Machine Learning

**Objetivo:** Recomendaciones personalizadas

(Ver ROADMAP anterior para detalles)

**Estimación:** 4-6 semanas

---

## 🏢 FASE 6: ESCALABILIDAD ENTERPRISE (Futuro)

### Misión 6.1: Migrar a Monorepo

**Objetivo:** Separar apps y compartir código eficientemente

**Estructura final:**
```
mhorp/
├── apps/
│   ├── storefront/     # Cliente (Next.js)
│   ├── admin/          # Admin (Next.js)
│   └── api/            # API personalizada (opcional - FastAPI/Go)
├── packages/
│   ├── database/       # Drizzle schema
│   ├── services/       # Lógica de negocio
│   ├── ui/             # shadcn/ui compartido
│   ├── validation/     # Zod schemas
│   ├── types/          # TypeScript types
│   └── test-utils/     # Mocks y helpers
└── tools/
    └── scripts/        # Scripts de deploy, migrations, etc.
```

**Herramientas:**
- Turborepo o pnpm workspaces
- Configuración compartida (ESLint, TypeScript, Tailwind)

**Estimación:** 1 semana

---

### Misión 6.2: API Personalizada (Opcional)

**Objetivo:** Mayor control sobre lógica compleja

**Cuándo considerar:**
- Lógica de negocio muy compleja que excede Edge Functions
- Necesidad de integraciones con sistemas legacy
- Performance crítico en operaciones específicas

**Opciones:**
1. **FastAPI** (Python) - Buena DX, typing, async
2. **Go** - Performance extremo
3. **Rust** - Maximum performance + safety

**Arquitectura híbrida:**
```
Cliente → Next.js (UI + Server Actions simples)
        ↓
Supabase (Auth + DB + Storage)
        ↓
API Personalizada (Lógica compleja)
```

**Estimación:** 3-4 semanas

---

## 📊 Roadmap Visual

```
[COMPLETADO] ══════════════════════════════════════════════ 60%

Fase 1: Fundación          ████████████ 100% ✅
Fase 2: Engagement         ████████████ 100% ✅
Fase 3: Producción         ████████████ 100% ✅
Fase 4: Refactoring        ░░░░░░░░░░░░   0% 🔥 PRIORITARIO
Fase 5: Features Avanzadas ░░░░░░░░░░░░   0% 📋
Fase 6: Enterprise         ░░░░░░░░░░░░   0% 📋

[PRÓXIMOS 3 MESES] ════════════════════════════════════════

Mes 1: Fase 4 (Arquitectura)
  - Semana 1-2: Capa de servicios
  - Semana 3: RLS completo
  - Semana 4: Testing setup

Mes 2: Fase 4 (Continuación) + Fase 5
  - Semana 1-2: Testing exhaustivo
  - Semana 3: Stripe integration
  - Semana 4: Inicio Blog/CMS

Mes 3: Fase 5 (Features)
  - Semana 1-2: Blog/CMS completo
  - Semana 3-4: Gamificación (opcional)
```

---

## 🎯 Métricas de Éxito por Fase

### Fase 4 (Arquitectura):
- ✅ 80%+ cobertura de tests
- ✅ 100% tablas con RLS
- ✅ 0 accesos directos a `db`/`supabase` en componentes
- ✅ Tiempo de build < 8s
- ✅ Lighthouse score 95+

### Fase 5 (Features):
- ✅ Stripe funcionando en producción
- ✅ 20+ posts de blog publicados
- ✅ Tasa de adopción de gamificación > 30%

### Fase 6 (Enterprise):
- ✅ Monorepo con 3+ apps
- ✅ CI/CD < 5min
- ✅ Despliegues independientes

---

## 📚 Referencias

1. **HiyoRi-Ecommerce** - Stack moderno, GraphQL, CMS
2. **next-prisma-tailwind** - Monorepo, admin panel
3. **supabase-nextjs-template** - RLS exhaustivo, security-first
4. **svelte-commerce** - Patrón adaptador desacoplado
5. **saleor** - DDD, arquitectura enterprise

---

## ✅ Próximos Pasos Inmediatos

1. **Leer:** `ARQUITECTURA_ANALISIS.md` (análisis completo)
2. **Decidir:** ¿Empezar Fase 4 o implementar Stripe/Blog primero?
3. **Planificar:** Sprint de 2 semanas para Misión 4.1

**Recomendación:** Hacer Fase 4 primero. Una base sólida hace las features futuras más rápidas de implementar.

---

**Autor:** GitHub Copilot  
**Última actualización:** Octubre 18, 2025  
**Versión:** 2.0 - Arquitectónicamente Mejorado
