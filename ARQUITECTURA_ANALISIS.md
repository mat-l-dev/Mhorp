# 🏗️ Análisis Arquitectónico de Mhorp - Basado en Mejores Prácticas de E-commerce

> **Fecha de análisis:** Octubre 18, 2025  
> **Stack actual:** Next.js 15, Supabase, Drizzle ORM, shadcn/ui, Tailwind CSS

---

## 📊 Resumen Ejecutivo

Este documento analiza la arquitectura actual de Mhorp contra las mejores prácticas identificadas en repositorios de referencia de clase mundial (HiyoRi-Ecommerce, next-prisma-tailwind-ecommerce, y otros 15+ proyectos), identifica brechas arquitectónicas y propone un plan de evolución estructurado.

### Estado Actual vs. Arquitecturas de Referencia

| Aspecto | Estado Actual | Mejor Práctica | Brecha |
|---------|--------------|----------------|--------|
| **Estructura de Proyecto** | Estándar App Router | Monorepo (apps + packages) | ⚠️ Media |
| **Capa de Abstracción de Datos** | Acceso directo a Supabase/Drizzle | Patrón Adaptador/Servicio | ❌ Alta |
| **Seguridad (RLS)** | Parcialmente implementada | RLS total + funciones DB | ⚠️ Media |
| **Gestión de Estado** | Zustand básico | Estado por dominio | ✅ Baja |
| **Manejo de Archivos** | Supabase Storage directo | Abstracción + RLS políticas | ⚠️ Media |
| **Testing** | Setup básico (Vitest) | Cobertura completa + E2E | ❌ Alta |
| **Documentación de Código** | Comentarios básicos | JSDoc + Arquitectura | ⚠️ Media |

---

## 🔍 Análisis Detallado por Capa

### 1. Estructura de Proyecto

#### **Estado Actual:**
```
mhorp/
├── src/
│   ├── actions/          # Server Actions (15 archivos)
│   ├── app/              # App Router
│   │   ├── (admin)/
│   │   ├── (auth)/
│   │   └── (store)/
│   ├── components/       # UI Components
│   ├── hooks/            # React hooks
│   └── lib/              # Utilidades
│       ├── db/
│       ├── store/
│       └── supabase/
```

#### **Arquitectura Recomendada (Monorepo Escalable):**
```
mhorp/
├── apps/
│   ├── storefront/       # Cliente (Next.js)
│   │   ├── app/
│   │   ├── components/
│   │   └── public/
│   └── admin/            # Admin Panel (Next.js separado)
│       ├── app/
│       └── components/
├── packages/
│   ├── database/         # Schema Drizzle compartido
│   ├── services/         # Lógica de negocio
│   │   ├── auth/
│   │   ├── orders/
│   │   ├── products/
│   │   └── payments/
│   ├── ui/               # Componentes compartidos
│   ├── config/           # Configuración compartida
│   └── types/            # TypeScript types
└── packages.json
```

**Ventajas del Monorepo:**
- Código compartido sin duplicación
- Despliegues independientes (storefront vs admin)
- Testing aislado
- Mejor escalabilidad para equipos

---

### 2. Capa de Abstracción de Datos (CRÍTICO)

#### **Problema Actual:**

Tu código actual accede directamente a `db` y `supabase` desde múltiples lugares:

```typescript
// ❌ ANTI-PATRÓN: Acceso directo disperso
// En src/actions/order.ts
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
const orders = await db.query.orders.findMany({ ... });

// En src/actions/referral.ts
const supabase = await createClient();
const stats = await db.query.referralStats.findFirst({ ... });

// En src/components/shared/Navbar.tsx
const supabase = await createClient();
const dbUser = await db.query.users.findFirst({ ... });
```

**Problemas:**
1. **Acoplamiento fuerte:** Cambiar de Supabase requeriría modificar 50+ archivos
2. **Difícil de testear:** No se puede mockear fácilmente
3. **Lógica duplicada:** Autenticación, permisos repetidos
4. **Sin capa de validación centralizada**

#### **Solución: Patrón Adaptador/Servicio**

Inspirado en `itswadesh/svelte-commerce` y `HiyoRi-Ecommerce`:

```typescript
// ✅ PATRÓN RECOMENDADO
// packages/services/src/orders/orders.service.ts
export class OrdersService {
  constructor(
    private db: DrizzleClient,
    private auth: AuthService
  ) {}

  async create(data: CreateOrderDTO): Promise<Order> {
    const user = await this.auth.getCurrentUser();
    if (!user) throw new UnauthorizedError();
    
    return this.db.transaction(async (tx) => {
      const order = await tx.insert(orders).values({
        userId: user.id,
        ...data
      }).returning();
      
      // Lógica de negocio centralizada
      await this.reserveStock(order.items);
      await this.createPaymentProof(order.id);
      
      return order[0];
    });
  }

  async getByUser(userId: string): Promise<Order[]> {
    return this.db.query.orders.findMany({
      where: eq(orders.userId, userId),
      with: { items: true, paymentProofs: true }
    });
  }
}

// apps/storefront/src/actions/order.ts
import { ordersService } from '@mhorp/services';

export async function createOrder(data: CreateOrderDTO) {
  'use server';
  try {
    const order = await ordersService.create(data);
    revalidatePath('/orders');
    return { success: true, order };
  } catch (error) {
    return { error: error.message };
  }
}
```

**Beneficios:**
- ✅ Lógica de negocio centralizada y reutilizable
- ✅ Fácil de testear (inyección de dependencias)
- ✅ Cambiar backend sin tocar UI
- ✅ Validación y transformación en un solo lugar

---

### 3. Seguridad: Row Level Security (RLS)

#### **Estado Actual:**

Tienes algunas políticas RLS básicas, pero no son exhaustivas.

#### **Mejora Recomendada: RLS Total**

Basado en `Razikus/supabase-nextjs-template`:

```sql
-- ============================================
-- POLÍTICAS RLS COMPLETAS
-- ============================================

-- 1. TABLA ORDERS
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

-- Admins actualizan cualquier orden
CREATE POLICY "admins_update_orders" ON orders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 2. TABLA PAYMENT_PROOFS
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

-- 3. SUPABASE STORAGE (payment-proofs-bucket)
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
```

**Acción:** Crear migración `010_complete_rls_policies.sql`

---

### 4. Gestión de Archivos: Abstracción y Seguridad

#### **Problema Actual:**

Lógica de carga de archivos está en Server Actions directamente:

```typescript
// ❌ Lógica acoplada en action
export async function uploadProof(formData: FormData) {
  const supabase = await createClient();
  const file = formData.get('file');
  const { error } = await supabase.storage
    .from('payment-proofs')
    .upload(`proofs/${userId}/${orderId}/${file.name}`, file);
}
```

#### **Solución: Servicio de Storage**

```typescript
// ✅ packages/services/src/storage/storage.service.ts
export class StorageService {
  constructor(private supabase: SupabaseClient) {}

  async uploadPaymentProof(
    userId: string,
    orderId: string,
    file: File
  ): Promise<{ path: string; url: string }> {
    // Validación
    this.validateFile(file, {
      maxSize: 5 * 1024 * 1024, // 5MB
      allowedTypes: ['image/jpeg', 'image/png', 'application/pdf']
    });

    // Path seguro (RLS lo protege)
    const path = `proofs/${userId}/${orderId}/${crypto.randomUUID()}-${file.name}`;

    const { error } = await this.supabase.storage
      .from('payment-proofs')
      .upload(path, file);

    if (error) throw new StorageError(error.message);

    // Generar URL firmada (expira en 1 hora)
    const { data } = await this.supabase.storage
      .from('payment-proofs')
      .createSignedUrl(path, 3600);

    return { path, url: data.signedUrl };
  }

  async getSignedUrl(path: string, expiresIn = 3600): Promise<string> {
    const { data } = await this.supabase.storage
      .from('payment-proofs')
      .createSignedUrl(path, expiresIn);
    
    return data.signedUrl;
  }
}
```

---

### 5. Testing: Cobertura Completa

#### **Estado Actual:**

```
✅ Vitest configurado
⚠️ Solo 1 test de ejemplo (utils.test.ts)
❌ No hay tests de integración
❌ No hay tests E2E
```

#### **Plan de Testing Recomendado:**

```typescript
// ✅ packages/services/src/orders/__tests__/orders.service.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OrdersService } from '../orders.service';
import { mockDb, mockAuth } from '@mhorp/test-utils';

describe('OrdersService', () => {
  let ordersService: OrdersService;

  beforeEach(() => {
    ordersService = new OrdersService(mockDb, mockAuth);
  });

  describe('create', () => {
    it('debería crear una orden con items', async () => {
      const orderData = {
        items: [{ productId: 1, quantity: 2 }],
        shippingAddress: '123 Main St'
      };

      const order = await ordersService.create(orderData);

      expect(order).toBeDefined();
      expect(order.status).toBe('awaiting_payment');
      expect(mockDb.insert).toHaveBeenCalled();
    });

    it('debería lanzar error si usuario no autenticado', async () => {
      mockAuth.getCurrentUser.mockResolvedValue(null);

      await expect(ordersService.create({}))
        .rejects.toThrow('Unauthorized');
    });
  });
});

// ✅ apps/storefront/__tests__/e2e/checkout.spec.ts (Playwright)
import { test, expect } from '@playwright/test';

test.describe('Flujo de Checkout', () => {
  test('usuario puede completar una compra', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Agregar al carrito');
    await page.click('text=Ver carrito');
    await page.click('text=Proceder al pago');
    
    await page.fill('[name="shippingAddress"]', '123 Main St');
    await page.click('text=Confirmar orden');
    
    await expect(page).toHaveURL(/\/orders\/[a-z0-9-]+/);
    await expect(page.locator('text=Orden creada')).toBeVisible();
  });
});
```

**Acción:** Crear `packages/test-utils` con mocks y helpers

---

### 6. Arquitectura de Features: Domain-Driven Design

#### **Patrón Actual:**

```
src/actions/      # Todas las acciones mezcladas
src/components/   # Todos los componentes mezclados
```

#### **Patrón Recomendado (Organización por Dominio):**

```
packages/services/src/
├── orders/
│   ├── orders.service.ts
│   ├── orders.repository.ts
│   ├── orders.types.ts
│   ├── dto/
│   │   ├── create-order.dto.ts
│   │   └── update-order.dto.ts
│   └── __tests__/
├── products/
│   ├── products.service.ts
│   ├── products.repository.ts
│   └── __tests__/
├── payments/
│   ├── payments.service.ts
│   ├── manual-payment.handler.ts
│   └── __tests__/
└── referrals/
    ├── referrals.service.ts
    └── __tests__/
```

**Cada dominio encapsula:**
- Service (lógica de negocio)
- Repository (acceso a datos)
- DTOs (validación)
- Types (TypeScript)
- Tests

---

## 🚨 Problemas Críticos Identificados

### 1. **Acoplamiento Alto con Infraestructura**

**Problema:** Server Actions llaman directamente a `db` y `supabase`

**Impacto:** 
- Difícil migrar a otro backend
- Imposible testear unitariamente
- Lógica de negocio dispersa

**Solución:** Capa de servicios abstracta (Sección 2)

### 2. **Falta de Validación Centralizada**

**Problema:** Validación Zod duplicada en múltiples archivos

```typescript
// ❌ Duplicado en review.ts, order.ts, etc.
const schema = z.object({
  productId: z.number().int().positive(),
  rating: z.number().int().min(1).max(5)
});
```

**Solución:**

```typescript
// ✅ packages/validation/src/schemas/review.schema.ts
export const createReviewSchema = z.object({
  productId: z.number().int().positive(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(10).max(500).optional()
});

export type CreateReviewDTO = z.infer<typeof createReviewSchema>;
```

### 3. **Sin Manejo Centralizado de Errores**

**Problema:** Cada action maneja errores de forma diferente

**Solución:**

```typescript
// ✅ packages/services/src/common/errors.ts
export class AppError extends Error {
  constructor(
    public message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'No autorizado') {
    super(message, 'UNAUTHORIZED', 401);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400);
  }
}

// Uso
throw new UnauthorizedError();
throw new ValidationError('Email inválido');
```

---

## 📋 Plan de Migración Priorizado

### Fase 1: Fundamentos (Semana 1-2) - **CRÍTICO**

1. **Crear capa de servicios**
   - [ ] Crear `packages/services`
   - [ ] `AuthService` (centralizar getUser, isAdmin)
   - [ ] `OrdersService` (migrar lógica de actions/order.ts)
   - [ ] `ProductsService`

2. **Implementar RLS completo**
   - [ ] Migración `010_complete_rls_policies.sql`
   - [ ] Políticas para todas las tablas
   - [ ] Políticas para Supabase Storage

3. **Testing Infrastructure**
   - [ ] Crear `packages/test-utils`
   - [ ] Configurar Playwright para E2E
   - [ ] Tests unitarios para servicios

### Fase 2: Refactoring (Semana 3-4)

4. **Migrar Server Actions a servicios**
   - [ ] Refactorizar `actions/order.ts`
   - [ ] Refactorizar `actions/product.ts`
   - [ ] Refactorizar `actions/review.ts`

5. **Abstraer acceso a Storage**
   - [ ] Crear `StorageService`
   - [ ] Migrar upload de payment proofs

6. **Validación centralizada**
   - [ ] Crear `packages/validation`
   - [ ] Schemas Zod por dominio

### Fase 3: Features Nuevas (Semana 5-6)

7. **Stripe Integration** (de Roadmap original)
   - [ ] `PaymentsService` con múltiples providers
   - [ ] Webhook handler
   - [ ] UI de checkout

8. **Blog/CMS** (de Roadmap original)
   - [ ] `ContentService`
   - [ ] Admin CMS
   - [ ] Rutas públicas

### Fase 4: Monorepo (Opcional - Semana 7-8)

9. **Migrar a monorepo**
   - [ ] Separar apps (storefront + admin)
   - [ ] Mover código compartido a packages

---

## 🎯 Métricas de Éxito

| Métrica | Actual | Objetivo | Método |
|---------|--------|----------|--------|
| **Cobertura de Tests** | ~5% | 80%+ | Vitest + Playwright |
| **Tablas con RLS** | 40% | 100% | Auditoría SQL |
| **Tiempo de Build** | ~9s | <8s | pnpm build |
| **Lighthouse Score** | ~85 | 95+ | lighthouse CI |
| **Bundle Size (Storefront)** | ? | <250KB | next/bundle-analyzer |

---

## 📚 Referencias de Arquitectura

### Repositorios Analizados:

1. **HiyoRi-Ecommerce** ⭐⭐⭐⭐⭐
   - Stack: Next.js 14, Supabase, Drizzle, shadcn/ui
   - Fortalezas: GraphQL search, CMS, guest/user cart sync
   - Aplicable: Patrón de webhook, estructura modular

2. **next-prisma-tailwind-ecommerce** ⭐⭐⭐⭐
   - Stack: Next.js 14, Prisma, Monorepo
   - Fortalezas: Monorepo architecture, admin panel
   - Aplicable: Estructura de apps separadas

3. **supabase-nextjs-template** ⭐⭐⭐⭐⭐
   - Stack: Next.js, Supabase, RLS focus
   - Fortalezas: Seguridad RLS exhaustiva
   - Aplicable: Políticas RLS, file upload demo

4. **svelte-commerce** ⭐⭐⭐⭐
   - Stack: SvelteKit, Backend adapters
   - Fortalezas: Patrón adaptador desacoplado
   - Aplicable: Capa de abstracción de servicios

---

## ✅ Conclusión

Tu proyecto **Mhorp** tiene fundamentos sólidos, pero puede evolucionar a una arquitectura de **clase enterprise** adoptando:

1. **Capa de servicios** (desacoplamiento)
2. **RLS completo** (seguridad)
3. **Testing exhaustivo** (confiabilidad)
4. **Validación centralizada** (consistencia)

**Siguiente paso:** Implementar Fase 1 del plan de migración.

---

**Autor:** GitHub Copilot  
**Fecha:** Octubre 18, 2025  
**Versión:** 1.0
