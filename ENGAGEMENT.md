# 🎯 Sistema de Engagement - Documentación Técnica

Esta documentación detalla las tres funcionalidades avanzadas de engagement implementadas en Mhorp: **Reseñas**, **Lista de Deseos** y **Cupones de Descuento**.

## Tabla de Contenidos

1. [Sistema de Reseñas](#-sistema-de-reseñas)
2. [Lista de Deseos (Wishlist)](#-lista-de-deseos-wishlist)
3. [Sistema de Cupones](#-sistema-de-cupones)
4. [Integración y Flujos](#-integración-y-flujos)
5. [Consideraciones de Seguridad](#-consideraciones-de-seguridad)

---

## ⭐ Sistema de Reseñas

### Objetivo de Negocio
Generar **prueba social** y **confianza** en los productos mediante calificaciones y comentarios de usuarios verificados que han realizado compras.

### Arquitectura

#### Base de Datos

**Tabla: `reviews`**
```sql
CREATE TABLE reviews (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reviews_product ON reviews(product_id);
CREATE INDEX idx_reviews_user ON reviews(user_id);
CREATE UNIQUE INDEX idx_reviews_user_product ON reviews(user_id, product_id);
```

**Relaciones:**
- Un usuario puede tener muchas reseñas (one-to-many)
- Un producto puede tener muchas reseñas (one-to-many)
- Un usuario solo puede tener UNA reseña por producto (unique constraint)

#### Server Actions

**Archivo:** `src/actions/review.ts`

##### 1. `submitReview(productId, rating, comment)`
Permite a un usuario crear o actualizar una reseña.

**Flujo:**
1. Verificar autenticación (Supabase Auth)
2. Validar rating (1-5)
3. **Verificar compra previa** del producto
   - Query a `orders` JOIN `order_items`
   - Filtrar por `userId` y `productId`
   - Excluir órdenes canceladas
4. Verificar si ya existe reseña
5. Si existe: UPDATE
6. Si no existe: INSERT
7. Revalidar cache de la página del producto

**Código clave:**
```typescript
async function hasUserPurchasedProduct(userId: string, productId: number) {
  const userOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, userId))
    .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
    .where(eq(orderItems.productId, productId));
  
  return userOrders.length > 0;
}
```

##### 2. `getProductReviews(productId)`
Obtiene todas las reseñas de un producto con información del usuario.

**Retorna:**
```typescript
{
  id: number;
  rating: number;
  comment: string | null;
  createdAt: Date;
  userName: string;
}[]
```

##### 3. `getProductAverageRating(productId)`
Calcula el promedio de calificaciones.

**Retorna:**
```typescript
{
  average: number; // Redondeado a 1 decimal
  count: number;   // Total de reseñas
}
```

#### Componentes UI

##### StarRating.tsx
Componente reutilizable para mostrar y seleccionar calificaciones.

**Props:**
```typescript
interface StarRatingProps {
  rating: number;           // Valor actual (0-5)
  onRatingChange?: (rating: number) => void; // Callback al cambiar
  readonly?: boolean;       // Solo lectura (default: false)
  size?: 'sm' | 'md' | 'lg'; // Tamaño de estrellas
}
```

**Características:**
- Estrellas llenas, medias y vacías
- Interactivo con hover effect
- Accesible con teclado
- Responsive

##### ReviewForm.tsx
Formulario para enviar reseñas.

**Props:**
```typescript
interface ReviewFormProps {
  productId: number;
  existingReview?: {
    rating: number;
    comment: string;
  };
}
```

**Features:**
- Validación en tiempo real
- Loading states
- Feedback visual con toast notifications
- Maneja tanto creación como actualización

##### ProductReviewsList.tsx
Lista todas las reseñas de un producto.

**Props:**
```typescript
interface ProductReviewsListProps {
  productId: number;
}
```

**Features:**
- Paginación (10 por página)
- Ordenamiento por fecha (más recientes primero)
- Avatar del usuario
- Tiempo relativo (hace 2 días, hace 1 mes)
- Empty state cuando no hay reseñas

#### Integración en Páginas

**Página de Producto (`/product/[slug]`):**
```tsx
export default async function ProductPage({ params }) {
  const product = await getProductBySlug(params.slug);
  const reviews = await getProductReviews(product.id);
  const { average, count } = await getProductAverageRating(product.id);
  
  return (
    <>
      <ProductDetails product={product} averageRating={average} />
      <StarRating rating={average} readonly />
      <span>({count} reseñas)</span>
      
      {/* Solo usuarios que compraron pueden reseñar */}
      <ReviewForm productId={product.id} />
      
      <ProductReviewsList reviews={reviews} />
    </>
  );
}
```

#### Validaciones de Seguridad

✅ **Autenticación obligatoria:** Solo usuarios autenticados
✅ **Verificación de compra:** Query a base de datos
✅ **Sanitización de entrada:** Zod schemas
✅ **Rate limiting:** Un usuario = una reseña por producto
✅ **XSS Protection:** React automático + sanitización de HTML

---

## 💝 Lista de Deseos (Wishlist)

### Objetivo de Negocio
Capturar **intención de compra futura** y aumentar **retención de usuarios** permitiendo guardar productos favoritos.

### Arquitectura

#### Base de Datos

**Tabla: `wishlist_items`**
```sql
CREATE TABLE wishlist_items (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_wishlist_user ON wishlist_items(user_id);
CREATE INDEX idx_wishlist_product ON wishlist_items(product_id);
CREATE UNIQUE INDEX idx_wishlist_user_product ON wishlist_items(user_id, product_id);
```

**Características:**
- Constraint único: un usuario no puede agregar el mismo producto dos veces
- Cascade delete: si se elimina un producto o usuario, se limpian sus items

#### Server Actions

**Archivo:** `src/actions/wishlist.ts`

##### 1. `addToWishlist(productId)`
Agrega un producto a la wishlist del usuario autenticado.

**Flujo:**
1. Verificar autenticación
2. Validar que el producto exista
3. Verificar que no esté ya en wishlist (UNIQUE constraint)
4. INSERT en `wishlist_items`
5. Revalidar páginas relevantes

**Respuesta:**
```typescript
{
  success: boolean;
  message: string;
}
```

##### 2. `removeFromWishlist(productId)`
Remueve un producto de la wishlist.

**Flujo:**
1. Verificar autenticación
2. DELETE WHERE user_id = X AND product_id = Y
3. Revalidar páginas

##### 3. `getWishlist()`
Obtiene todos los productos en la wishlist del usuario con información completa.

**Retorna:**
```typescript
{
  id: number;
  product: {
    id: number;
    name: string;
    price: number;
    images: string[];
    stock: number;
  };
  createdAt: Date;
}[]
```

##### 4. `isInWishlist(productId)`
Verifica si un producto específico está en la wishlist.

**Uso:** Para mostrar el estado correcto del botón de corazón.

#### Componentes UI

##### WishlistButton.tsx
Botón interactivo con ícono de corazón.

**Props:**
```typescript
interface WishlistButtonProps {
  productId: number;
  initialIsInWishlist?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'ghost' | 'outline';
}
```

**Features:**
- **Optimistic UI:** Cambia instantáneamente antes de la respuesta del servidor
- **Loading state:** Muestra spinner durante la acción
- **Error handling:** Revierte en caso de error
- **Animación:** Transition suave entre estados
- **Accesibilidad:** ARIA labels descriptivos

**Estados:**
```tsx
// No está en wishlist
<Heart className="w-5 h-5" /> // Outline

// Está en wishlist
<Heart className="w-5 h-5 fill-red-500 text-red-500" /> // Lleno
```

**Integración:**
```tsx
// En ProductCard
<WishlistButton 
  productId={product.id} 
  initialIsInWishlist={false}
  size="sm"
  variant="ghost"
/>

// En página de producto
<WishlistButton 
  productId={product.id}
  initialIsInWishlist={isInWishlist}
  size="lg"
/>
```

#### Página de Wishlist

**Ruta:** `/account/wishlist`
**Archivo:** `src/app/(store)/account/wishlist/page.tsx`

**Features:**
- Grid responsive de productos (2-4 columnas según viewport)
- Botón de remover en cada card
- Empty state con CTA a explorar productos
- Loading skeletons
- Redirección si no está autenticado

**Layout:**
```
┌─────────────────────────────────────────┐
│  Mi Lista de Deseos (12 productos)     │
├─────────────────────────────────────────┤
│  ┌───────┐  ┌───────┐  ┌───────┐       │
│  │ Prod1 │  │ Prod2 │  │ Prod3 │       │
│  │ ❤️     │  │ ❤️     │  │ ❤️     │       │
│  └───────┘  └───────┘  └───────┘       │
│  ┌───────┐  ┌───────┐  ┌───────┐       │
│  │ Prod4 │  │ Prod5 │  │ Prod6 │       │
│  └───────┘  └───────┘  └───────┘       │
└─────────────────────────────────────────┘
```

---

## 🎟️ Sistema de Cupones

### Objetivo de Negocio
Herramienta de **marketing flexible** para impulsar ventas, fidelizar clientes y ejecutar promociones estratégicas.

### Arquitectura

#### Base de Datos

**Tabla: `coupons`**
```sql
CREATE TABLE coupons (
  id SERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount_type coupon_type NOT NULL, -- ENUM: 'percentage' | 'fixed'
  discount_value DECIMAL(10,2) NOT NULL,
  expires_at TIMESTAMP,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupons_active ON coupons(is_active);
```

**Campos en tabla `orders`:**
```sql
ALTER TABLE orders ADD COLUMN coupon_id INTEGER REFERENCES coupons(id);
ALTER TABLE orders ADD COLUMN discount_amount DECIMAL(10,2) DEFAULT 0 NOT NULL;
```

**Enum:**
```typescript
export enum CouponType {
  PERCENTAGE = 'percentage', // Ej: 20% descuento
  FIXED = 'fixed'           // Ej: S/ 50 descuento
}
```

#### Server Actions

**Archivo:** `src/actions/coupon.ts`

##### Admin Actions

###### 1. `getCoupons()`
Lista todos los cupones (solo admin).

**Retorna:** Array de cupones con todos los campos.

###### 2. `getCouponById(id)`
Obtiene un cupón específico para editar.

###### 3. `createCoupon(data)`
Crea un nuevo cupón.

**Validaciones:**
- Código único
- Valor > 0
- Si es porcentaje: valor <= 100
- Fecha de expiración > fecha actual (si se proporciona)

**Input:**
```typescript
{
  code: string;           // Ej: "VERANO2024"
  discountType: 'percentage' | 'fixed';
  discountValue: number;  // Ej: 20 o 50.00
  expiresAt?: Date;
  isActive: boolean;
}
```

###### 4. `updateCoupon(id, data)`
Actualiza un cupón existente.

###### 5. `deleteCoupon(id)`
Elimina un cupón (soft delete recomendado).

##### Customer Actions

###### 6. `applyCoupon(code, cartTotal)`
Valida y aplica un cupón en el carrito.

**Flujo de Validación:**
1. ✅ Verificar que el código existe
2. ✅ Verificar que esté activo (`isActive = true`)
3. ✅ Verificar que no haya expirado (`expiresAt > NOW()` o `null`)
4. ✅ Calcular descuento según tipo
5. ✅ Retornar información del descuento

**Lógica de Cálculo:**
```typescript
if (coupon.discountType === 'percentage') {
  const percentage = parseFloat(coupon.discountValue);
  discount = (cartTotal * percentage) / 100;
} else {
  // fixed
  const fixedAmount = parseFloat(coupon.discountValue);
  // No permitir que el descuento sea mayor al total
  discount = Math.min(fixedAmount, cartTotal);
}
```

**Respuesta:**
```typescript
{
  success: boolean;
  message: string;
  coupon?: {
    id: number;
    code: string;
    discountType: 'percentage' | 'fixed';
    discountAmount: number; // Monto calculado
  };
}
```

#### Panel de Administración

**Rutas:**
- `/admin/coupons` - Lista
- `/admin/coupons/new` - Crear
- `/admin/coupons/[id]` - Editar

##### Lista de Cupones (`/admin/coupons`)

**Features:**
- Data Table con TanStack Table
- Columnas: Código, Tipo, Valor, Expira, Estado, Acciones
- Sorting por cualquier columna
- Filtro de búsqueda
- Paginación
- Acciones rápidas: Editar, Activar/Desactivar, Eliminar

**Columnas:**
```
┌──────────────┬──────────┬─────────┬──────────┬────────┬──────────┐
│ Código       │ Tipo     │ Valor   │ Expira   │ Estado │ Acciones │
├──────────────┼──────────┼─────────┼──────────┼────────┼──────────┤
│ VERANO2024   │ %        │ 20%     │ 31/03/24 │ Activo │ [✏️][🗑️] │
│ BIENVENIDA   │ Fijo     │ S/ 50   │ -        │ Activo │ [✏️][🗑️] │
│ BLACK2023    │ %        │ 50%     │ 01/12/23 │ Expiró │ [✏️][🗑️] │
└──────────────┴──────────┴─────────┴──────────┴────────┴──────────┘
```

##### Formulario de Cupón

**Archivo:** `src/components/admin/coupons/CouponForm.tsx`

**Campos:**
1. **Código del Cupón** (text input)
   - Requerido
   - Uppercase automático
   - Solo alfanuméricos
   - Único

2. **Tipo de Descuento** (select)
   - Porcentaje
   - Monto Fijo

3. **Valor del Descuento** (number input)
   - Requerido
   - Min: 0.01
   - Max: 100 (si porcentaje)
   - Símbolo según tipo (% o S/)

4. **Fecha de Expiración** (date picker)
   - Opcional
   - Min: fecha actual
   - Formato: DD/MM/YYYY

5. **Estado** (switch)
   - Activo / Inactivo
   - Default: Activo

**Validación con Zod:**
```typescript
const couponSchema = z.object({
  code: z.string()
    .min(3, 'Mínimo 3 caracteres')
    .max(20, 'Máximo 20 caracteres')
    .regex(/^[A-Z0-9]+$/, 'Solo mayúsculas y números'),
  
  discountType: z.enum(['percentage', 'fixed']),
  
  discountValue: z.number()
    .positive('Debe ser mayor a 0')
    .refine((val) => {
      if (discountType === 'percentage') {
        return val <= 100;
      }
      return true;
    }, 'El porcentaje no puede ser mayor a 100'),
  
  expiresAt: z.date().optional(),
  isActive: z.boolean()
});
```

#### Integración en Carrito

**Página:** `/cart`

**Sección de Cupón:**
```tsx
<div className="space-y-2">
  <Label>¿Tienes un cupón?</Label>
  <div className="flex gap-2">
    <Input
      placeholder="Ingresa tu código"
      value={couponCode}
      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
    />
    <Button
      onClick={handleApplyCoupon}
      disabled={!couponCode || isApplying}
    >
      Aplicar
    </Button>
  </div>
  
  {appliedCoupon && (
    <Alert variant="success">
      <CheckCircle className="h-4 w-4" />
      <AlertDescription>
        Cupón "{appliedCoupon.code}" aplicado - 
        {appliedCoupon.discountType === 'percentage' 
          ? `${appliedCoupon.discountValue}% descuento`
          : `S/ ${appliedCoupon.discountValue} descuento`}
      </AlertDescription>
      <Button variant="ghost" size="sm" onClick={handleRemoveCoupon}>
        Remover
      </Button>
    </Alert>
  )}
</div>
```

**Desglose de Totales:**
```tsx
<div className="space-y-2">
  <div className="flex justify-between">
    <span>Subtotal:</span>
    <span>S/ {subtotal.toFixed(2)}</span>
  </div>
  
  {appliedCoupon && (
    <div className="flex justify-between text-green-600">
      <span>Descuento ({appliedCoupon.code}):</span>
      <span>- S/ {discountAmount.toFixed(2)}</span>
    </div>
  )}
  
  <Separator />
  
  <div className="flex justify-between text-lg font-bold">
    <span>Total:</span>
    <span>S/ {(subtotal - discountAmount).toFixed(2)}</span>
  </div>
</div>
```

#### Estado Global (Zustand)

**Store:** `cartStore.ts`

```typescript
interface CartStore {
  // ... otros campos
  appliedCoupon: AppliedCoupon | null;
  setAppliedCoupon: (coupon: AppliedCoupon | null) => void;
  removeCoupon: () => void;
}

interface AppliedCoupon {
  id: number;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountAmount: number;
}
```

#### Flujo Completo de Uso

```
1. Usuario agrega productos al carrito
   └─> Subtotal: S/ 500

2. Usuario va a /cart

3. Ingresa código "VERANO2024" en input

4. Hace clic en "Aplicar"
   └─> Llama a applyCoupon("VERANO2024", 500)

5. Server valida:
   ✅ Existe
   ✅ Activo
   ✅ No expirado
   ✅ Calcula: 20% de S/ 500 = S/ 100

6. Retorna { success: true, coupon: {...}, discountAmount: 100 }

7. Frontend actualiza:
   - Muestra alert de éxito
   - Actualiza desglose de totales
   - Guarda en Zustand store

8. Usuario va a checkout
   └─> El cupón se mantiene en el store

9. Al confirmar orden:
   - Se guarda couponId en orders
   - Se guarda discountAmount = 100
   - Se aplica el descuento al total

10. Admin puede ver en el dashboard qué cupones se están usando
```

---

## 🔄 Integración y Flujos

### Flujo de Compra Completo con Engagement

```
1. Usuario explora productos
   └─> Ve calificación promedio en cada ProductCard
   
2. Usuario entra a detalle de producto
   ├─> Ve reseñas de otros compradores
   ├─> Agrega a wishlist si no está listo para comprar
   └─> O agrega al carrito
   
3. Usuario va al carrito
   ├─> Aplica cupón de descuento
   └─> Procede al checkout
   
4. Usuario completa la orden
   
5. Después de recibir el producto
   └─> Puede dejar una reseña (validado)
```

### Sincronización de Estado

#### Server State (Base de Datos)
- Fuente de verdad
- Validaciones críticas
- Persistencia

#### Client State (Zustand)
- Cache temporal
- Optimistic updates
- UX instantánea

#### Revalidation Strategy
```typescript
// Después de mutaciones importantes
revalidatePath('/product/[slug]');
revalidatePath('/account/wishlist');
revalidatePath('/cart');
```

---

## 🔒 Consideraciones de Seguridad

### Autenticación y Autorización

#### Reseñas
- ✅ Solo usuarios autenticados
- ✅ Validación de compra previa (query a DB)
- ✅ Un usuario = una reseña por producto
- ✅ No permitir modificar reseñas de otros

#### Wishlist
- ✅ Solo usuarios autenticados
- ✅ Solo pueden ver/modificar su propia wishlist
- ✅ Validación de user_id en server

#### Cupones
- ✅ CRUD solo para admins (rol validation)
- ✅ Aplicación de cupones para todos
- ✅ Validación exhaustiva en servidor
- ✅ No confiar en cliente para cálculos

### Prevención de Ataques

#### SQL Injection
✅ **Mitigado:** Drizzle ORM con prepared statements

#### XSS (Cross-Site Scripting)
✅ **Mitigado:** React escapa automáticamente
✅ Sanitización de inputs con Zod
✅ Content Security Policy headers

#### CSRF (Cross-Site Request Forgery)
✅ **Mitigado:** Server Actions con tokens automáticos

#### Rate Limiting
⚠️ **Recomendado:** Implementar rate limiting en endpoints críticos
```typescript
// Ejemplo con upstash/ratelimit
const limiter = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "1 m"),
});

const { success } = await limiter.limit(userId);
if (!success) {
  throw new Error('Too many requests');
}
```

#### Input Validation
✅ **Implementado:** Zod schemas en todos los formularios
```typescript
const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});
```

### Logging y Monitoring

```typescript
// En cada Server Action crítica
try {
  // ... lógica
} catch (error) {
  console.error('Error en submitReview:', {
    userId,
    productId,
    error: error.message,
    timestamp: new Date().toISOString(),
  });
  
  // Opcional: Enviar a servicio de monitoring (Sentry, etc.)
  throw error;
}
```

---

## 📊 Métricas y KPIs

### Reseñas
- **Tasa de Reseñas:** (Total reseñas / Total órdenes) * 100
- **Rating Promedio:** Indicador de satisfacción
- **Productos sin Reseñas:** Oportunidad de mejora

### Wishlist
- **Tasa de Conversión:** (Compras desde wishlist / Total items en wishlist) * 100
- **Tiempo en Wishlist:** Días promedio antes de compra
- **Productos Populares:** Más agregados a wishlist

### Cupones
- **Tasa de Uso:** (Órdenes con cupón / Total órdenes) * 100
- **Revenue con Descuento:** Total vendido con cupones
- **Cupones Populares:** Más utilizados
- **ROI de Promociones:** (Revenue - Descuentos) / Costo marketing

---

## 🚀 Optimizaciones Futuras

### Reseñas
- [ ] Imágenes en reseñas
- [ ] Votos útiles/no útiles
- [ ] Respuestas del vendedor
- [ ] Filtro por rating
- [ ] Verificación de compra badge

### Wishlist
- [ ] Notificaciones de bajadas de precio
- [ ] Wishlist compartible (URL pública)
- [ ] Sugerencias basadas en wishlist
- [ ] Recordatorios por email

### Cupones
- [ ] Cupones de un solo uso
- [ ] Límite de uso por usuario
- [ ] Cupones por categoría/producto específico
- [ ] Generación automática de códigos únicos
- [ ] Cupones personalizados por usuario
- [ ] A/B testing de cupones

---

## 📞 Soporte

Para preguntas sobre estas funcionalidades:
- Revisa el código en `src/actions/`, `src/components/`
- Consulta los tests en `src/test/`
- Abre un issue en GitHub

**Última actualización:** Octubre 2025
**Versión:** 1.0.0
