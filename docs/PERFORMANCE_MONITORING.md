# Performance Monitoring - Guía Completa

## 📋 Índice

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Sistema de Métricas](#sistema-de-métricas)
3. [Logging Estructurado](#logging-estructurado)
4. [Health Checks](#health-checks)
5. [Error Tracking](#error-tracking)
6. [Endpoints de API](#endpoints-de-api)
7. [Integración](#integración)
8. [Mejores Prácticas](#mejores-prácticas)

---

## 📊 Resumen Ejecutivo

### ¿Por qué monitoring?

El monitoring permite:

- **Detectar problemas antes** que los usuarios los reporten
- **Medir rendimiento real** en producción
- **Debug en producción** con logs estructurados
- **Alertas proactivas** para errores críticos
- **Insights de negocio** (órdenes, revenue, etc.)

### Componentes implementados

✅ **Sistema de Métricas** - Counters, gauges, histograms  
✅ **Logging Estructurado** - Logs con contexto rico  
✅ **Health Checks** - Liveness, readiness, health completo  
✅ **Error Tracking** - Captura y agregación de errores  
✅ **API Endpoints** - `/api/health`, `/api/metrics`  
✅ **Error Boundary** - Captura errores de React

---

## 📈 Sistema de Métricas

### Tipos de métricas

#### 1. **Counters** - Valores que solo incrementan

```typescript
import { metrics, MetricNames } from '@/lib/monitoring/metrics';

// Incrementar contador
metrics.increment(MetricNames.ORDERS_CREATED_TOTAL);
metrics.increment(MetricNames.HTTP_REQUESTS_TOTAL, 1, {
  method: 'POST',
  path: '/api/orders',
});

// Obtener valor
const total = metrics.getCounter(MetricNames.ORDERS_CREATED_TOTAL);
```

#### 2. **Gauges** - Valores que suben y bajan

```typescript
// Establecer valor absoluto
metrics.gauge(MetricNames.DB_CONNECTIONS_ACTIVE, 15);
metrics.gauge(MetricNames.CACHE_HIT_RATE, 0.85, { cache: 'redis' });

// Obtener valor
const connections = metrics.getGauge(MetricNames.DB_CONNECTIONS_ACTIVE);
```

#### 3. **Histograms** - Distribución de valores

```typescript
// Registrar valor
metrics.histogram(MetricNames.HTTP_REQUEST_DURATION, 150, {
  method: 'GET',
  path: '/api/products',
});

// Obtener estadísticas
const stats = metrics.getStats(MetricNames.HTTP_REQUEST_DURATION);
console.log(stats);
// {
//   count: 1000,
//   sum: 125000,
//   min: 10,
//   max: 5000,
//   avg: 125,
//   p50: 100,  // Mediana
//   p95: 500,  // 95% de requests < 500ms
//   p99: 1000, // 99% de requests < 1000ms
// }
```

#### 4. **Timers** - Medir duración de operaciones

```typescript
// Opción 1: Timer manual
const timer = metrics.timer(MetricNames.DB_QUERY_DURATION, {
  query: 'SELECT',
  table: 'products',
});

// ... hacer operación ...

timer(); // Registra duración

// Opción 2: Helper measureTime
import { measureTime } from '@/lib/monitoring/metrics';

const result = await measureTime(
  MetricNames.DB_QUERY_DURATION,
  async () => {
    return await db.query.products.findMany();
  },
  { query: 'findMany' }
);

// Opción 3: Decorator
import { Measure } from '@/lib/monitoring/metrics';

class ProductsService {
  @Measure(MetricNames.DB_QUERY_DURATION, { service: 'products' })
  async getProduct(id: string) {
    return await db.query.products.findFirst({ where: { id } });
  }
}
```

### Métricas predefinidas

```typescript
export const MetricNames = {
  // HTTP
  HTTP_REQUESTS_TOTAL: 'http.requests.total',
  HTTP_REQUEST_DURATION: 'http.request.duration',
  HTTP_ERRORS_TOTAL: 'http.errors.total',

  // Database
  DB_QUERIES_TOTAL: 'db.queries.total',
  DB_QUERY_DURATION: 'db.query.duration',
  DB_ERRORS_TOTAL: 'db.errors.total',
  DB_CONNECTIONS_ACTIVE: 'db.connections.active',

  // Cache
  CACHE_HITS_TOTAL: 'cache.hits.total',
  CACHE_MISSES_TOTAL: 'cache.misses.total',
  CACHE_HIT_RATE: 'cache.hit.rate',

  // Business
  ORDERS_CREATED_TOTAL: 'orders.created.total',
  ORDERS_COMPLETED_TOTAL: 'orders.completed.total',
  REVENUE_TOTAL: 'revenue.total',
  CART_ITEMS_ADDED: 'cart.items.added',
  PRODUCTS_VIEWED: 'products.viewed',
  
  // Errors
  ERRORS_TOTAL: 'errors.total',
  VALIDATION_ERRORS: 'errors.validation',
  AUTH_ERRORS: 'errors.auth',
};
```

### Exportar métricas

#### Formato Prometheus

```typescript
import { exportPrometheusMetrics } from '@/lib/monitoring/metrics';

const metrics = exportPrometheusMetrics();
console.log(metrics);
```

Output:
```
# TYPE http.requests.total counter
http.requests.total{method="GET",path="/api/products"} 1500
http.requests.total{method="POST",path="/api/orders"} 250

# TYPE http.request.duration histogram
http.request.duration_count 1750
http.request.duration_sum 218750
http.request.duration_min 10
http.request.duration_max 5000
http.request.duration_avg 125
http.request.duration{quantile="0.5"} 100
http.request.duration{quantile="0.95"} 500
http.request.duration{quantile="0.99"} 1000
```

#### Formato JSON

```typescript
const allMetrics = metrics.getAllMetrics();
console.log(JSON.stringify(allMetrics, null, 2));
```

---

## 📝 Logging Estructurado

### Niveles de log

```typescript
import { logger } from '@/lib/monitoring/logger';

// DEBUG - Información de debugging
logger.debug('User session started', { userId: '123', sessionId: 'abc' });

// INFO - Información general
logger.info('Order created successfully', { orderId: '456', total: 99.99 });

// WARN - Advertencias
logger.warn('Cache miss for key', { key: 'product:123' });

// ERROR - Errores
logger.error('Failed to process payment', error, { orderId: '789' });

// FATAL - Errores críticos
logger.fatal('Database connection lost', error);
```

### Logging con contexto

```typescript
// Agregar contexto de request
const requestLogger = logger.withRequest('request-id-123', 'user-id-456');

requestLogger.info('Processing order');
requestLogger.error('Payment failed', error);

// Log: [INFO] 2024-01-15 10:30:00 - Processing order
//      Context: { requestId: 'request-id-123', userId: 'user-id-456' }
```

### Medir tiempo de operación

```typescript
const timer = logger.withTimer('Processing order');

// ... hacer operación ...

timer.done({ orderId: '123', items: 5 });

// Log: [INFO] 2024-01-15 10:30:00 - Processing order
//      Context: { orderId: '123', items: 5, duration: 1500 }
```

### Configuración

```env
# .env.local
LOG_LEVEL=info           # debug, info, warn, error, fatal
NODE_ENV=development     # development = pretty print, production = JSON
```

### Formato de logs

**Desarrollo (pretty print):**
```
🐛 [DEBUG] 10:30:00 - User session started
  Context: { userId: '123', sessionId: 'abc' }

ℹ️ [INFO] 10:30:05 - Order created successfully
  Context: { orderId: '456', total: 99.99 }

⚠️ [WARN] 10:30:10 - Cache miss for key
  Context: { key: 'product:123' }

❌ [ERROR] 10:30:15 - Failed to process payment
  Context: {
    orderId: '789',
    error: {
      name: 'PaymentError',
      message: 'Insufficient funds',
      stack: '...'
    }
  }
```

**Producción (JSON):**
```json
{
  "level": "info",
  "message": "Order created successfully",
  "timestamp": "2024-01-15T10:30:05.123Z",
  "orderId": "456",
  "total": 99.99
}
```

### Helpers especializados

```typescript
import {
  logHttpError,
  logDbError,
  logPerformance,
} from '@/lib/monitoring/logger';

// Log de error HTTP
logHttpError(error, {
  method: 'POST',
  url: '/api/orders',
  headers: { 'content-type': 'application/json' },
});

// Log de error de DB
logDbError(error, 'SELECT * FROM products WHERE id = ?', ['123']);

// Log de performance (warn si > 1s)
logPerformance('Database query', 1500, { query: 'SELECT', table: 'orders' });
```

---

## 🏥 Health Checks

### Tipos de health checks

#### 1. **Health completo** - Todos los componentes

```typescript
import { getHealthReport } from '@/lib/monitoring/health';

const health = await getHealthReport();
console.log(health);
```

Output:
```json
{
  "status": "healthy",
  "checks": [
    {
      "name": "database",
      "status": "healthy",
      "message": "Database connection OK",
      "duration": 15,
      "timestamp": "2024-01-15T10:30:00Z"
    },
    {
      "name": "cache",
      "status": "healthy",
      "message": "Cache working correctly",
      "duration": 5,
      "timestamp": "2024-01-15T10:30:00Z",
      "details": { "type": "redis" }
    },
    {
      "name": "memory",
      "status": "healthy",
      "message": "Memory usage: 45.23%",
      "duration": 1,
      "timestamp": "2024-01-15T10:30:00Z",
      "details": {
        "heapUsed": 123456789,
        "heapTotal": 273456789
      }
    }
  ],
  "uptime": 86400,
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0"
}
```

#### 2. **Liveness** - El servicio está vivo

```typescript
import { getLiveness } from '@/lib/monitoring/health';

const liveness = await getLiveness();
console.log(liveness); // { alive: true }
```

Uso: Kubernetes/Docker para saber si reiniciar el contenedor

#### 3. **Readiness** - El servicio está listo

```typescript
import { getReadiness } from '@/lib/monitoring/health';

const readiness = await getReadiness();
console.log(readiness);
// { ready: true } o { ready: false, reason: 'Database not ready' }
```

Uso: Kubernetes/Docker para saber si enviar tráfico

### Componentes monitoreados

- ✅ **Database** - Conexión a PostgreSQL
- ✅ **Cache** - Redis/Memory cache
- ✅ **Memory** - Uso de memoria (heap)
- ✅ **Disk** - Espacio en disco (Node.js)

### Estados de health

- `healthy` - Todo funcionando correctamente
- `degraded` - Algunos problemas pero funcional
- `unhealthy` - Problemas críticos

---

## 🚨 Error Tracking

### Capturar errores

```typescript
import { errorTracker } from '@/lib/monitoring/error-tracker';

try {
  await processOrder(orderId);
} catch (error) {
  if (error instanceof Error) {
    errorTracker.captureError(error, {
      orderId,
      userId,
    }, 'high'); // severity: low, medium, high, critical
  }
}
```

### Errores específicos

```typescript
// Error de validación
errorTracker.captureValidationError('email', 'Invalid email format', {
  email: 'invalid@',
  userId: '123',
});

// Error de autenticación
errorTracker.captureAuthError('login', 'Invalid credentials', {
  email: 'user@example.com',
  ip: '192.168.1.1',
});
```

### Helper para async/await

```typescript
import { withErrorTracking } from '@/lib/monitoring/error-tracker';

const result = await withErrorTracking(
  async () => {
    return await riskyOperation();
  },
  { operation: 'processPayment', orderId: '123' }
);
```

### Decorator para métodos

```typescript
import { TrackErrors } from '@/lib/monitoring/error-tracker';

class OrdersService {
  @TrackErrors('critical')
  async processPayment(orderId: string) {
    // Si falla, se captura automáticamente como error crítico
    return await processPayment(orderId);
  }
}
```

### Reporte de errores

```typescript
const errorReport = errorTracker.getErrorReport();

console.log(errorReport);
// [
//   {
//     id: 'error-uuid',
//     message: 'Database connection failed',
//     stack: '...',
//     context: { ... },
//     timestamp: '2024-01-15T10:30:00Z',
//     severity: 'critical',
//     fingerprint: 'abc123',
//     count: 15  // Número de veces que ocurrió
//   }
// ]
```

### Alertas para errores críticos

Los errores con severity `critical` automáticamente:

- ✅ Se logean con nivel FATAL
- ✅ Se envían a sistema de alerting (Slack, email, etc.)
- ✅ Se agregan al reporte de errores

---

## 🌐 Endpoints de API

### GET /api/health

Health check completo del sistema.

**Response 200 (healthy):**
```json
{
  "status": "healthy",
  "checks": [...],
  "uptime": 86400,
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0"
}
```

**Response 503 (unhealthy):**
```json
{
  "status": "unhealthy",
  "checks": [...],
  "uptime": 86400,
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0"
}
```

### GET /api/health/liveness

Liveness probe para Kubernetes.

**Response 200:**
```json
{
  "alive": true
}
```

### GET /api/health/readiness

Readiness probe para Kubernetes.

**Response 200:**
```json
{
  "ready": true
}
```

**Response 503:**
```json
{
  "ready": false,
  "reason": "Database not ready"
}
```

### GET /api/metrics

Exportar métricas.

**Formato Prometheus (default):**
```
GET /api/metrics?format=prometheus

Content-Type: text/plain; version=0.0.4

# TYPE http.requests.total counter
http.requests.total{method="GET",path="/api/products"} 1500
...
```

**Formato JSON:**
```
GET /api/metrics?format=json

{
  "counters": {
    "http.requests.total{method=GET,path=/api/products}": 1500
  },
  "gauges": {
    "db.connections.active": 15
  },
  "histograms": {
    "http.request.duration": {
      "count": 1000,
      "avg": 125,
      "p95": 500
    }
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## 🔌 Integración

### 1. En Server Actions

```typescript
// src/actions/orders.ts
import { metrics, MetricNames } from '@/lib/monitoring/metrics';
import { logger } from '@/lib/monitoring/logger';
import { errorTracker } from '@/lib/monitoring/error-tracker';

export async function createOrder(data: OrderInput) {
  const timer = metrics.timer(MetricNames.DB_QUERY_DURATION, {
    operation: 'createOrder',
  });

  logger.info('Creating order', { userId: data.userId, items: data.items.length });

  try {
    const order = await db.insert(orders).values(data);

    // Incrementar métricas de negocio
    metrics.increment(MetricNames.ORDERS_CREATED_TOTAL);
    metrics.increment(MetricNames.REVENUE_TOTAL, data.total);

    timer();
    logger.info('Order created successfully', { orderId: order.id });

    return order;
  } catch (error) {
    timer();
    
    if (error instanceof Error) {
      errorTracker.captureError(error, {
        userId: data.userId,
        items: data.items.length,
      }, 'high');
    }

    throw error;
  }
}
```

### 2. En API Routes

```typescript
// src/app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { metrics, MetricNames } from '@/lib/monitoring/metrics';
import { logger } from '@/lib/monitoring/logger';

export async function GET(request: NextRequest) {
  const start = Date.now();
  const requestId = crypto.randomUUID();

  logger.withRequest(requestId).info('GET /api/products');

  try {
    const products = await db.query.products.findMany();

    const duration = Date.now() - start;
    metrics.histogram(MetricNames.API_RESPONSE_TIME, duration, {
      endpoint: '/api/products',
      method: 'GET',
    });

    metrics.increment(MetricNames.HTTP_REQUESTS_TOTAL, 1, {
      endpoint: '/api/products',
      status: '200',
    });

    return NextResponse.json(products);
  } catch (error) {
    metrics.increment(MetricNames.HTTP_ERRORS_TOTAL, 1, {
      endpoint: '/api/products',
    });

    if (error instanceof Error) {
      logger.withRequest(requestId).error('Failed to fetch products', error);
    }

    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
```

### 3. En React Components

```tsx
// src/app/layout.tsx
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
```

### 4. En Middleware

```typescript
// middleware.ts
import { metricsMiddleware } from '@/middleware/metrics';

export function middleware(request: NextRequest) {
  return metricsMiddleware(request);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

---

## 📚 Mejores Prácticas

### 1. Naming de métricas

```typescript
// ✅ BUENO - Descriptivo y consistente
'http.requests.total'
'db.query.duration'
'cache.hit.rate'

// ❌ MALO - Vago o inconsistente
'requests'
'queryTime'
'cacheHits'
```

### 2. Tags útiles

```typescript
// ✅ BUENO - Tags que permiten filtrar y agrupar
metrics.increment('http.requests.total', 1, {
  method: 'POST',
  path: '/api/orders',
  status: '201',
});

// ❌ MALO - Sin tags, difícil de analizar
metrics.increment('http.requests.total', 1);
```

### 3. Logging con contexto

```typescript
// ✅ BUENO - Contexto rico
logger.error('Order processing failed', error, {
  orderId: '123',
  userId: '456',
  items: 5,
  total: 99.99,
  paymentMethod: 'credit_card',
});

// ❌ MALO - Sin contexto
logger.error('Error');
```

### 4. Severity apropiada

```typescript
// ✅ BUENO - Severity según impacto
errorTracker.captureError(error, context, 'critical'); // Pérdida de datos
errorTracker.captureError(error, context, 'high');     // Funcionalidad rota
errorTracker.captureError(error, context, 'medium');   // Error recuperable
errorTracker.captureError(error, context, 'low');      // Advertencia

// ❌ MALO - Todo como critical
errorTracker.captureError(validationError, context, 'critical');
```

### 5. Medir lo importante

```typescript
// ✅ BUENO - Métricas de negocio
metrics.increment('orders.created.total');
metrics.increment('revenue.total', order.total);
metrics.histogram('checkout.duration', checkoutTime);

// ✅ BUENO - Métricas técnicas
metrics.histogram('db.query.duration', queryTime);
metrics.gauge('db.connections.active', activeConnections);
metrics.increment('cache.hits.total');

// ⚠️ CUIDADO - Demasiado granular
metrics.histogram('button.click.duration'); // Probablemente innecesario
```

---

## 🎯 Próximos Pasos

### Integraciones recomendadas:

1. **Sentry** - Error tracking en producción
   ```bash
   pnpm add @sentry/nextjs
   ```

2. **Datadog** - Métricas y logs centralizados
   ```bash
   pnpm add dd-trace
   ```

3. **Prometheus + Grafana** - Visualización de métricas
   - Scrape `/api/metrics`
   - Crear dashboards en Grafana

4. **Vercel Analytics** - Analytics de Next.js
   ```tsx
   import { Analytics } from '@vercel/analytics/react';
   ```

5. **Slack/Email** - Alertas para errores críticos
   - Webhook en `errorTracker.sendAlert()`

---

**¡Monitoring completado!** 🎉

Con esta implementación tienes:
- ✅ Visibilidad completa del sistema
- ✅ Debugging facilitado
- ✅ Alertas proactivas
- ✅ Métricas de negocio y técnicas
- ✅ Health checks para orchestration
- ✅ Error tracking y agregación
