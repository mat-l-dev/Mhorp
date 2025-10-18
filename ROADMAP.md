# 🚀 Roadmap de Mejoras Futuras - Mhorp

Este documento detalla las optimizaciones y nuevas funcionalidades planificadas para llevar Mhorp al siguiente nivel.

## 🎯 Estado de Implementación

✅ = Completado | 🚧 = En progreso | 📋 = Pendiente

**Última actualización:** Octubre 2025

---

## Tabla de Contenidos

1. [✅ Analytics y Métricas](#-analytics-y-métricas) ← **COMPLETADO**
2. [✅ Sistema de Notificaciones](#-sistema-de-notificaciones) ← **COMPLETADO** 
3. [✅ Social Features](#-social-features) ← **COMPLETADO**
4. [📋 Gamificación](#-gamificación)
5. [📋 Performance](#-performance)
6. [📋 Mobile App](#-mobile-app)
7. [📋 AI & Machine Learning](#-ai--machine-learning)

---

## ✅ ~~Analytics y Métricas~~ **[COMPLETADO]**

### ~~Dashboard de Analytics Avanzado~~

**Estado:** ✅ Implementado en commit `ad33e45`  
**Archivo:** `src/app/(admin)/admin/analytics/page.tsx`  
**Documentación:** Ver `NUEVAS_FEATURES.md`

~~**Prioridad:** Alta~~  
~~**Esfuerzo:** Medio (2-3 semanas)~~

#### Features

**Métricas de Engagement:**
- Tasa de conversión de wishlist → compra
- Productos más reseñados
- Productos con mejor calificación
- Cupones más utilizados
- Productos más agregados a wishlist

**Métricas de Ventas:**
- Revenue por categoría
- Productos más vendidos por mes
- Ticket promedio por orden
- Tasa de retención de clientes
- Customer Lifetime Value (CLV)

**Métricas de Usuarios:**
- Usuarios activos diarios (DAU)
- Usuarios activos mensuales (MAU)
- Tasa de registro → primera compra
- Tiempo promedio hasta primera compra

#### Implementación

```typescript
// src/app/(admin)/admin/analytics/page.tsx
export default async function AnalyticsPage() {
  const metrics = await getAnalytics();
  
  return (
    <div className="grid gap-6">
      {/* Revenue Chart */}
      <RevenueChart data={metrics.revenue} />
      
      {/* Top Products */}
      <TopProductsTable products={metrics.topProducts} />
      
      {/* Engagement Metrics */}
      <EngagementMetrics data={metrics.engagement} />
      
      {/* Conversion Funnels */}
      <ConversionFunnel data={metrics.funnel} />
    </div>
  );
}
```

**Librerías sugeridas:**
- `recharts` o `chart.js` - Para gráficos
- `@tremor/react` - Dashboard components
- `date-fns` - Manejo de fechas

#### SQL Queries necesarias

```sql
-- Tasa de conversión wishlist → compra
SELECT 
  COUNT(DISTINCT w.user_id) as wishlist_users,
  COUNT(DISTINCT o.user_id) as buying_users,
  (COUNT(DISTINCT o.user_id)::float / COUNT(DISTINCT w.user_id) * 100) as conversion_rate
FROM wishlist_items w
LEFT JOIN orders o ON w.user_id = o.user_id AND w.product_id IN (
  SELECT product_id FROM order_items WHERE order_id = o.id
);

-- Top productos por revenue
SELECT 
  p.name,
  SUM(oi.quantity * oi.price_at_purchase) as total_revenue,
  SUM(oi.quantity) as units_sold
FROM order_items oi
JOIN products p ON oi.product_id = p.id
JOIN orders o ON oi.order_id = o.id
WHERE o.status != 'cancelled'
GROUP BY p.id, p.name
ORDER BY total_revenue DESC
LIMIT 10;
```

---

## ✅ ~~Sistema de Notificaciones~~ **[COMPLETADO]**

### ~~Notificaciones Automatizadas~~

**Estado:** ✅ Implementado en commit `ad33e45`  
**Archivo:** `src/app/api/cron/price-drop/route.ts`  
**Cron Job:** Configurado en `vercel.json`  
**Documentación:** Ver `NUEVAS_FEATURES.md`

~~**Prioridad:** Alta~~  
~~**Esfuerzo:** Medio (2 semanas)~~

#### ✅ Features Implementadas

##### 1. ✅ ~~Notificación de Bajada de Precio~~
- ✅ Detecta cuando producto en wishlist baja de precio (≥5% o ≥$50)
- ✅ Email automático con template HTML responsive
- ✅ Cron job diario a las 9:00 AM
- ✅ Tabla `price_history` para tracking

```typescript
// src/jobs/price-drop-notifier.ts
export async function notifyPriceDrops() {
  // 1. Obtener productos con precio reducido
  const reducedPriceProducts = await getPriceReductions();
  
  // 2. Para cada producto, buscar usuarios con wishlist
  for (const product of reducedPriceProducts) {
    const interestedUsers = await getUsersWithProductInWishlist(product.id);
    
    // 3. Enviar email a cada usuario
    for (const user of interestedUsers) {
      await sendPriceDropEmail({
        to: user.email,
        productName: product.name,
        oldPrice: product.oldPrice,
        newPrice: product.currentPrice,
        discount: calculateDiscount(product.oldPrice, product.currentPrice),
      });
    }
  }
}
```

##### 2. Recordatorio de Carrito Abandonado
- Email después de 24h de carrito sin checkout
- Incluir cupón de incentivo opcional

##### 3. Recordatorio de Wishlist
- Email semanal con items en wishlist
- "No olvides estos productos que te gustaron"

##### 4. Recordatorio de Reseña Pendiente
- 7 días después de orden entregada
- "¿Qué te pareció [Producto]?"

#### Implementación con Cron Jobs

```typescript
// src/jobs/scheduled-notifications.ts
import { Resend } from 'resend';
import { db } from '@/lib/db';

// Ejecutar diariamente a las 9 AM
export async function dailyNotifications() {
  await notifyPriceDrops();
  await notifyAbandonedCarts();
  await notifyPendingReviews();
}

// Ejecutar semanalmente los lunes
export async function weeklyNotifications() {
  await notifyWishlistReminder();
  await notifyNewArrivals();
}
```

**Setup con Vercel Cron:**

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/daily",
      "schedule": "0 9 * * *"
    },
    {
      "path": "/api/cron/weekly",
      "schedule": "0 9 * * 1"
    }
  ]
}
```

---

## 🎮 Gamificación

### Programa de Puntos y Recompensas

**Prioridad:** Media  
**Esfuerzo:** Alto (3-4 semanas)

#### Features

##### Sistema de Puntos
```sql
CREATE TABLE user_points (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  points INTEGER NOT NULL DEFAULT 0,
  lifetime_points INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE point_transactions (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  points INTEGER NOT NULL,
  reason TEXT NOT NULL, -- 'purchase', 'review', 'referral', 'redeemed'
  reference_id TEXT, -- order_id, review_id, etc.
  created_at TIMESTAMP DEFAULT NOW()
);
```

##### Acciones que Otorgan Puntos
- Registrarse: **50 puntos**
- Primera compra: **100 puntos**
- Por cada S/ 10 gastados: **1 punto**
- Dejar reseña: **25 puntos**
- Referir amigo: **200 puntos** (c/u)
- Compartir producto: **10 puntos**

##### Niveles de Usuario
```typescript
enum UserTier {
  BRONZE = 'bronze',   // 0 - 999 puntos
  SILVER = 'silver',   // 1,000 - 4,999
  GOLD = 'gold',       // 5,000 - 9,999
  PLATINUM = 'platinum' // 10,000+
}

// Beneficios por nivel
const tierBenefits = {
  bronze: {
    discount: 0,
    freeShipping: false,
    earlyAccess: false,
  },
  silver: {
    discount: 5, // 5% en todas las compras
    freeShipping: true,
    earlyAccess: false,
  },
  gold: {
    discount: 10,
    freeShipping: true,
    earlyAccess: true,
  },
  platinum: {
    discount: 15,
    freeShipping: true,
    earlyAccess: true,
    exclusiveProducts: true,
  },
};
```

##### Canje de Puntos
- 100 puntos = S/ 1 de descuento
- Cupones exclusivos por puntos
- Productos exclusivos

#### UI Components

```typescript
// src/components/shared/UserPointsCard.tsx
export function UserPointsCard({ userId }: { userId: string }) {
  const { points, tier, nextTierPoints } = useUserPoints(userId);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Mis Puntos</CardTitle>
        <Badge variant={tier}>{tier.toUpperCase()}</Badge>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{points} pts</div>
        <Progress 
          value={(points / nextTierPoints) * 100} 
          className="mt-4"
        />
        <p className="text-sm text-muted-foreground mt-2">
          {nextTierPoints - points} puntos para {getNextTier(tier)}
        </p>
      </CardContent>
    </Card>
  );
}
```

---

## ✅ ~~Social Features~~ **[PARCIALMENTE COMPLETADO]**

### ~~Compartir y Comunidad~~

**Estado:** 🚧 Social Sharing implementado | 📋 Otros pendientes

#### ✅ Features Implementadas

##### ✅ ~~Compartir Productos en Redes Sociales~~
**Estado:** ✅ Completado  
Ver sección anterior ↑

#### 📋 Features Pendientes

##### 1. Wishlist Compartible
```typescript
// Generar link público de wishlist
export async function createShareableWishlist(userId: string) {
  const token = generateUniqueToken();
  
  await db.insert(sharedWishlists).values({
    userId,
    token,
    expiresAt: addDays(new Date(), 30),
    isPublic: true,
  });
  
  return `${BASE_URL}/wishlist/shared/${token}`;
}

// Página pública de wishlist
// src/app/wishlist/shared/[token]/page.tsx
export default async function SharedWishlistPage({ params }) {
  const wishlist = await getSharedWishlist(params.token);
  
  return (
    <div>
      <h1>{wishlist.user.name}'s Wishlist</h1>
      <ProductGrid products={wishlist.products} />
    </div>
  );
}
```

##### 2. ✅ ~~Reseñas Verificadas~~
**Estado:** ✅ Implementado  
**Archivos:** 
- `src/components/shared/ProductReviewsList.tsx`
- `migrations/006_add_reviews_is_verified.sql`

~~```sql
ALTER TABLE reviews ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;
```~~

✅ Badge implementado con CheckCircle icon verde

##### 3. ✅ ~~Compartir Productos en Redes Sociales~~
**Estado:** ✅ Implementado  
**Archivo:** `src/components/shared/ShareButtons.tsx`

✅ Plataformas soportadas:
- WhatsApp
- Facebook
- Twitter/X
- Copiar Link
- Web Share API (móviles)
            `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`
          );
        }}
      >
        <WhatsAppIcon />
      </Button>
      
      {/* Facebook */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => {
          window.open(
            `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
          );
        }}
      >
        <FacebookIcon />
      </Button>
      
      {/* Copy Link */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => {
          navigator.clipboard.writeText(shareUrl);
          toast.success('Link copiado');
        }}
      >
        <Link className="h-4 w-4" />
      </Button>
    </div>
  );
}
```

##### 4. Sistema de Referidos
```typescript
// Cada usuario tiene un código único
const referralCode = generateReferralCode(userId);

// Link de referido
const referralLink = `${BASE_URL}?ref=${referralCode}`;

// Cuando alguien se registra con el link
export async function handleReferralSignup(refCode: string, newUserId: string) {
  const referrer = await getUserByReferralCode(refCode);
  
  if (referrer) {
    // Dar puntos al que refirió
    await addPoints(referrer.id, 200, 'referral', newUserId);
    
    // Dar cupón al nuevo usuario
    await createCouponForUser(newUserId, {
      code: `BIENVENIDA${newUserId.slice(0, 6)}`,
      discountType: 'percentage',
      discountValue: 10,
      expiresAt: addDays(new Date(), 30),
    });
  }
}
```

---

## ⚡ Performance

### Optimizaciones de Rendimiento

**Prioridad:** Alta  
**Esfuerzo:** Bajo-Medio (1-2 semanas)

#### 1. Image Optimization

```typescript
// Usar Next.js Image con placeholder blur
import Image from 'next/image';

<Image
  src={product.image}
  alt={product.name}
  width={400}
  height={400}
  placeholder="blur"
  blurDataURL={product.blurDataURL}
  loading="lazy"
/>
```

Generar blur data URLs:
```bash
pnpm add plaiceholder
```

```typescript
import { getPlaiceholder } from 'plaiceholder';

export async function generateBlurDataURL(imageUrl: string) {
  const { base64 } = await getPlaiceholder(imageUrl);
  return base64;
}
```

#### 2. Caching Strategy

```typescript
// Server Actions con revalidación inteligente
export async function getProducts() {
  return unstable_cache(
    async () => {
      return await db.select().from(products);
    },
    ['products'],
    {
      revalidate: 3600, // 1 hora
      tags: ['products'],
    }
  )();
}

// Revalidar al actualizar
export async function updateProduct(id: number, data: ProductUpdate) {
  await db.update(products).set(data).where(eq(products.id, id));
  revalidateTag('products');
}
```

#### 3. Lazy Loading de Componentes

```typescript
// Cargar reviews solo cuando se necesitan
const ReviewsList = dynamic(() => import('@/components/shared/ProductReviewsList'), {
  loading: () => <ReviewsSkeleton />,
  ssr: false, // No cargar en server
});
```

#### 4. Database Indexes

```sql
-- Indexes críticos para performance
CREATE INDEX idx_products_category_stock ON products(category_id, stock);
CREATE INDEX idx_orders_user_status ON orders(user_id, status);
CREATE INDEX idx_order_items_product ON order_items(product_id);
CREATE INDEX idx_reviews_product_rating ON reviews(product_id, rating);
CREATE INDEX idx_wishlist_user ON wishlist_items(user_id);
CREATE INDEX idx_cart_items_cart_product ON cart_items(cart_id, product_id);
```

#### 5. Bundle Size Optimization

```bash
# Analizar bundle
pnpm add @next/bundle-analyzer

# next.config.ts
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer(nextConfig);

# Ejecutar
ANALYZE=true pnpm build
```

---

## 📱 Mobile App

### Progressive Web App (PWA)

**Prioridad:** Media  
**Esfuerzo:** Bajo (1 semana)

#### Setup

```bash
pnpm add next-pwa
```

```typescript
// next.config.ts
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
});

module.exports = withPWA(nextConfig);
```

#### Manifest

```json
// public/manifest.json
{
  "name": "Mhorp - E-commerce Platform",
  "short_name": "Mhorp",
  "description": "Plataforma de e-commerce moderna",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#000000",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

#### Features PWA
- ✅ Instalable en home screen
- ✅ Funciona offline (caché básico)
- ✅ Push notifications
- ✅ Splash screen
- ✅ App-like experience

---

## 🤖 AI & Machine Learning

### Recomendaciones Inteligentes

**Prioridad:** Baja  
**Esfuerzo:** Alto (4-6 semanas)

#### 1. Productos Relacionados con IA

```typescript
// Usar OpenAI embeddings
import OpenAI from 'openai';

export async function getAIRecommendations(productId: number) {
  const product = await getProductById(productId);
  
  // Generar embedding del producto
  const embedding = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: `${product.name} ${product.description}`,
  });
  
  // Buscar productos similares por embedding
  const similar = await db.execute(sql`
    SELECT *, 
      1 - (embedding <=> ${embedding.data[0].embedding}) as similarity
    FROM products
    WHERE id != ${productId}
    ORDER BY similarity DESC
    LIMIT 5
  `);
  
  return similar;
}
```

#### 2. Búsqueda Semántica

```typescript
// Búsqueda por significado, no solo keywords
export async function semanticSearch(query: string) {
  const embedding = await generateEmbedding(query);
  
  return await db.execute(sql`
    SELECT *
    FROM products
    ORDER BY embedding <=> ${embedding}
    LIMIT 20
  `);
}
```

#### 3. Predicción de Demanda

```typescript
// Predecir qué productos se venderán más
export async function predictDemand() {
  // Analizar histórico de ventas
  const historicalData = await getSalesHistory();
  
  // Usar modelo ML para predecir
  // (TensorFlow.js o API externa)
  const predictions = await mlModel.predict(historicalData);
  
  return predictions;
}
```

---

## 🎯 Priorización Sugerida

### Q1 2026 (Enero - Marzo)
- ✅ Analytics Dashboard
- ✅ Sistema de Notificaciones
- ✅ Performance Optimizations

### Q2 2026 (Abril - Junio)
- ✅ Gamificación (Puntos y Niveles)
- ✅ PWA Implementation
- ✅ Social Sharing Features

### Q3 2026 (Julio - Septiembre)
- ✅ Reseñas Verificadas
- ✅ Wishlist Compartible
- ✅ Sistema de Referidos

### Q4 2026 (Octubre - Diciembre)
- ✅ AI Recommendations (si budget lo permite)
- ✅ Mobile App Nativa (React Native)
- ✅ Internacionalización

---

## 🤝 Contribuciones

¿Quieres ayudar a implementar alguna de estas features?

1. Elige una feature del roadmap
2. Crea un issue en GitHub
3. Abre un PR con tu implementación
4. ¡Celebramos juntos! 🎉

---

**Última actualización:** Octubre 2025  
**Versión del Roadmap:** 1.0
