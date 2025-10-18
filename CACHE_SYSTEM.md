# 🚀 Sistema de Caché con Vercel KV (Redis)

Este documento explica cómo funciona el sistema de caché implementado para mejorar la performance de la aplicación.

## 📊 ¿Qué es Vercel KV?

Vercel KV es un servicio de Redis serverless que permite cachear datos de forma distribuida y con baja latencia. Es perfecto para:
- Cachear queries pesadas de base de datos
- Reducir tiempo de carga del Analytics Dashboard
- Mejorar experiencia del usuario
- Reducir costos de base de datos

## 🎯 Datos Cacheados

### Analytics Dashboard
- **Métricas generales** (TTL: 5 minutos)
  - Ingresos totales
  - Total de órdenes
  - Ticket promedio
  - Usuarios registrados
  
- **Productos Top** (TTL: 10 minutos)
  - Más vendidos
  - Mejor calificados
  - Más en wishlist
  
- **Ventas recientes** (TTL: 5 minutos)
  - Últimos 30/60/90 días

### Otros Datos (Futuro)
- Productos individuales
- Reviews de productos
- Wishlists de usuarios
- Listado de cupones activos

## 🛠️ Uso del Sistema de Caché

### 1. Cachear Datos

```typescript
import { getCached } from '@/lib/cache';

// Ejemplo básico
const data = await getCached(
  'mi-clave-unica',
  async () => {
    // Función que obtiene los datos si no están en caché
    return await database.query(...);
  },
  {
    ttl: 300, // 5 minutos
    tags: ['mi-tag'], // Para invalidación grupal
  }
);
```

### 2. Usar Helpers de Analytics

```typescript
import { analyticsCache } from '@/lib/cache';

// Métricas generales
const metrics = await analyticsCache.metrics(async () => {
  return await getMetricsFromDB();
});

// Productos top
const topProducts = await analyticsCache.topProducts('selling', async () => {
  return await getTopSellingFromDB();
});

// Ventas recientes
const sales = await analyticsCache.recentSales(30, async () => {
  return await getSalesFromDB(30);
});
```

### 3. Invalidar Caché

```typescript
import { 
  invalidateCache, 
  invalidateCacheByTag,
  invalidateMultiple 
} from '@/lib/cache';

// Invalidar una clave específica
await invalidateCache('analytics:metrics');

// Invalidar por tag (todas las claves con ese tag)
await invalidateCacheByTag('analytics');

// Invalidar múltiples claves
await invalidateMultiple(['key1', 'key2', 'key3']);
```

### 4. Hooks de Invalidación

```typescript
import {
  invalidateAnalyticsCache,
  invalidateProductCache,
  invalidateReviewCache,
} from '@/actions/cache-invalidation';

// Después de crear una orden
await createOrder(data);
await invalidateAnalyticsCache();

// Después de actualizar un producto
await updateProduct(id, data);
await invalidateProductCache(id);

// Después de crear una reseña
await createReview(data);
await invalidateReviewCache(productId);
```

## 🔧 Configuración

### Variables de Entorno

Para usar Vercel KV necesitas estas variables:

```env
# Vercel KV (Redis)
KV_URL=redis://...
KV_REST_API_URL=https://...
KV_REST_API_TOKEN=...
KV_REST_API_READ_ONLY_TOKEN=...
```

### Obtener las Variables

1. Ve a tu proyecto en [Vercel Dashboard](https://vercel.com/dashboard)
2. Click en **Storage** > **Create Database**
3. Selecciona **KV (Redis)**
4. Dale un nombre (ej: "mhor-cache")
5. Click en **Create**
6. Ve a **.env.local** tab
7. Copia todas las variables `KV_*`

### Configuración Local

```bash
# .env.local
KV_URL=redis://localhost:6379  # Para desarrollo local con Redis
# O usa las variables de Vercel KV

# Admin Secret (para API de caché)
ADMIN_SECRET=tu_secreto_super_seguro_aqui
```

### Redis Local (Opcional)

Si quieres probar localmente sin Vercel KV:

```bash
# Con Docker
docker run -d -p 6379:6379 redis:alpine

# Con Homebrew (Mac)
brew install redis
redis-server

# Con WSL (Windows)
sudo apt-get install redis-server
redis-server
```

## 📡 API de Gestión de Caché

### Endpoint: `/api/cache`

#### Limpiar Todo el Caché
```bash
curl -X POST http://localhost:3000/api/cache \
  -H "Authorization: Bearer $ADMIN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"action": "clear-all"}'
```

#### Limpiar por Tag
```bash
curl -X POST http://localhost:3000/api/cache \
  -H "Authorization: Bearer $ADMIN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"action": "clear-tag", "tag": "analytics"}'
```

#### Obtener Estadísticas
```bash
curl -X GET http://localhost:3000/api/cache \
  -H "Authorization: Bearer $ADMIN_SECRET"

# Respuesta:
{
  "success": true,
  "stats": {
    "keys": 42,
    "memory": "N/A (Managed by Vercel)"
  },
  "tags": ["analytics", "products", "metrics", "sales"]
}
```

## ⚡ Estrategias de TTL

### TTL Cortos (1-5 minutos)
- Datos que cambian frecuentemente
- Métricas en tiempo real
- Contadores de vistas

### TTL Medios (10-30 minutos)
- Productos top
- Estadísticas agregadas
- Listados de productos

### TTL Largos (1-24 horas)
- Configuraciones globales
- Contenido estático
- Traducciones

## 🎯 Mejores Prácticas

### 1. Usa Tags para Organización
```typescript
// Agrupa claves relacionadas con tags
await getCached('product:123', fetcher, {
  tags: ['products', 'product:123'],
});
```

### 2. Invalida Después de Mutations
```typescript
// Siempre invalida después de cambios
await updateProduct(id, data);
await invalidateProductCache(id);
```

### 3. Maneja Errores Gracefully
```typescript
// El sistema retorna datos frescos si el caché falla
try {
  return await getCached(key, fetcher);
} catch (error) {
  // Se ejecuta fetcher automáticamente
  console.error('Cache error', error);
}
```

### 4. No Cachees Datos Sensibles
```typescript
// ❌ NO cachees
- Información de tarjetas de crédito
- Passwords o tokens
- Datos personales sensibles

// ✅ SÍ cachea
- Productos públicos
- Estadísticas agregadas
- Listados de categorías
```

## 📈 Monitoreo

### Logs de Caché

Todos los hits/misses se loggean en consola:

```
[CACHE HIT] analytics:metrics
[CACHE MISS] analytics:top-products:selling
[CACHE INVALIDATED] analytics:metrics
[CACHE INVALIDATED BY TAG] analytics (12 keys)
```

### Métricas en Vercel

Ve a Vercel Dashboard > Storage > Tu KV Database para ver:
- Requests por segundo
- Hit rate
- Latencia
- Uso de memoria

## 🧪 Testing

### Test Manual

```typescript
// 1. Primera carga (MISS)
console.time('First load');
await getAnalyticsMetrics();
console.timeEnd('First load');
// First load: 450ms

// 2. Segunda carga (HIT)
console.time('Cached load');
await getAnalyticsMetrics();
console.timeEnd('Cached load');
// Cached load: 12ms  ⚡ ~37x más rápido!
```

### Verificar Caché Funciona

```bash
# 1. Llama al endpoint
curl http://localhost:3000/admin/analytics

# 2. Revisa logs - debe mostrar CACHE MISS

# 3. Llama de nuevo
curl http://localhost:3000/admin/analytics

# 4. Revisa logs - debe mostrar CACHE HIT
```

## 🚨 Troubleshooting

### "Cannot connect to Redis"
**Solución:** Verifica que las variables `KV_*` estén configuradas correctamente.

### "Cache always misses"
**Solución:** 
1. Verifica que Redis esté corriendo
2. Revisa que el TTL no sea 0
3. Comprueba que la key sea la misma en get y set

### "Memory full"
**Solución:** 
1. Vercel KV escala automáticamente
2. Reduce TTLs si es necesario
3. Limpia caché viejo con `/api/cache`

### "Cache not invalidating"
**Solución:**
1. Verifica que llames a `invalidateCache()` después de mutations
2. Usa tags para invalidar grupos
3. Revisa los logs de invalidación

## 📊 Resultados Esperados

### Sin Caché
- Analytics Dashboard: ~800ms - 1.5s
- Top Products: ~300ms - 600ms
- Recent Sales: ~200ms - 400ms

### Con Caché
- Analytics Dashboard: ~10ms - 50ms ⚡
- Top Products: ~5ms - 20ms ⚡
- Recent Sales: ~5ms - 15ms ⚡

**Mejora promedio: 20-50x más rápido** 🚀

## 🎉 Beneficios

1. **Performance**: Respuestas instantáneas para datos cacheados
2. **Escalabilidad**: Menos carga en la base de datos
3. **Costos**: Reducción de queries costosas
4. **UX**: Mejor experiencia de usuario
5. **Confiabilidad**: Fallback automático si el caché falla

---

**Última actualización:** Octubre 2025  
**Versión:** 1.0.0
