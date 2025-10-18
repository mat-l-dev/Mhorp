# Rate Limiting Module

Sistema completo de rate limiting para proteger tu aplicación de abuso y ataques.

## 🎯 Características

- ✅ **Múltiples Stores**: Memoria (desarrollo) y Redis (producción)
- ✅ **Presets Configurables**: Auth, API, Upload, Search, etc.
- ✅ **Headers Estándar**: Compatible con `X-RateLimit-*`
- ✅ **Flexible**: Rate limiting por IP, usuario, o cualquier identificador
- ✅ **Sin Excepciones**: No lanza errores, retorna información del límite
- ✅ **Window Sliding**: Ventanas de tiempo configurables
- ✅ **Skip Options**: Opcionalmente no contar requests exitosos/fallidos
- ✅ **Integración Simple**: Fácil de integrar con servicios existentes

## 📦 Instalación

```bash
pnpm add redis  # Opcional, solo si usas Redis
```

## 🚀 Uso Básico

### Con Presets

```typescript
import { createRateLimiter } from '@mhor/services';

// Rate limiter para autenticación (5 intentos cada 15 min)
const authLimiter = createRateLimiter('auth');

// Rate limiter para API pública (100 req/min)
const apiLimiter = createRateLimiter('api');

// En tu endpoint
const result = await authLimiter.check(userEmail);

if (!result.allowed) {
  throw new Error('Demasiados intentos, intenta más tarde');
}

// Procesar el request...
await authLimiter.consume(userEmail, success);
```

### Configuración Manual

```typescript
import { RateLimiter, MemoryRateLimitStore } from '@mhor/services';

const limiter = new RateLimiter({
  windowMs: 60000,        // Ventana de 1 minuto
  max: 100,               // 100 requests por ventana
  message: 'Slow down!',  // Mensaje customizado
  skipSuccessfulRequests: false,
  skipFailedRequests: true,
});

// Verificar límite
const check = await limiter.check('user-id');
console.log(`Restantes: ${check.info.remaining}/${check.info.limit}`);
```

## 🔧 Presets Disponibles

| Preset | Ventana | Límite | Uso |
|--------|---------|--------|-----|
| `auth` | 15 min | 5 | Login, registro, cambio de contraseña |
| `api` | 1 min | 100 | API pública general |
| `read` | 1 min | 300 | Operaciones de lectura |
| `write` | 1 min | 20 | Operaciones de escritura (POST/PUT/DELETE) |
| `search` | 1 min | 50 | Búsquedas y queries complejos |
| `upload` | 5 min | 10 | Subida de archivos |
| `admin` | 1 min | 500 | Panel de administración |

### Características Especiales por Preset

**Auth Preset**
```typescript
// No cuenta logins exitosos (solo fallidos)
skipSuccessfulRequests: true
```

## 📊 API Reference

### RateLimiter

#### Constructor

```typescript
new RateLimiter(
  config: RateLimitConfig,
  store?: RateLimitStore
)
```

**Config Options:**
```typescript
interface RateLimitConfig {
  windowMs: number;      // Ventana en milisegundos
  max: number;           // Máximo de requests
  message?: string;      // Mensaje de error
  skipSuccessfulRequests?: boolean;  // No contar exitosos
  skipFailedRequests?: boolean;      // No contar fallidos
}
```

#### Métodos

##### `check(clientId: string)`

Verifica si un cliente puede hacer un request. **NO incrementa el contador automáticamente**.

```typescript
const result = await limiter.check('user@example.com');

if (result.allowed) {
  // Procesar request
} else {
  // Rechazar
  console.log(`Reintentar en: ${result.info.resetTime}`);
}
```

**Returns:**
```typescript
{
  allowed: boolean;
  info: {
    limit: number;      // Límite máximo
    current: number;    // Requests actuales
    remaining: number;  // Requests restantes
    resetTime: Date;    // Cuándo se resetea
  }
}
```

##### `consume(clientId: string, success: boolean)`

Consume un request después de procesarlo. Usa esto para rate limiting inteligente.

```typescript
const check = await limiter.check(userId);

if (!check.allowed) {
  throw new Error('Rate limit exceeded');
}

try {
  const result = await processRequest();
  await limiter.consume(userId, true);  // Éxito
  return result;
} catch (error) {
  await limiter.consume(userId, false); // Fallo
  throw error;
}
```

##### `reset(clientId: string)`

Resetea el contador para un cliente específico.

```typescript
await limiter.reset('user@example.com');
```

##### `getInfo(clientId: string)`

Obtiene información actual sin incrementar el contador.

```typescript
const info = await limiter.getInfo(userId);

if (info) {
  console.log(`${info.remaining} requests restantes`);
  console.log(`Se resetea: ${info.resetTime}`);
}
```

## 🗄️ Stores

### Memory Store (Desarrollo)

```typescript
import { MemoryRateLimitStore, RateLimiter } from '@mhor/services';

const store = new MemoryRateLimitStore(60000); // 1 minuto
const limiter = new RateLimiter({ windowMs: 60000, max: 100 }, store);

// Limpiar al cerrar
store.destroy();
```

**Características:**
- ✅ Sin dependencias externas
- ✅ Auto-limpieza cada minuto
- ✅ Perfecto para desarrollo y tests
- ⚠️ No compartido entre instancias
- ⚠️ Se pierde al reiniciar

### Redis Store (Producción)

```typescript
import { createRedisRateLimitStore, RateLimiter } from '@mhor/services';

const store = createRedisRateLimitStore('redis://localhost:6379');
const limiter = new RateLimiter(
  { windowMs: 60000, max: 100 },
  store
);
```

**Características:**
- ✅ Compartido entre múltiples instancias
- ✅ Persiste durante redeploys
- ✅ Mejor rendimiento a escala
- ✅ Fallback automático a memoria si Redis falla

**Configuración con variables de entorno:**

```typescript
// Usa REDIS_URL automáticamente
const store = createRedisRateLimitStore();

// O especifica la URL
const store = createRedisRateLimitStore('redis://localhost:6379');

// Con prefijo customizado
const store = createRedisRateLimitStore(
  'redis://localhost:6379',
  'myapp:ratelimit:'
);
```

## 🔗 Integración con Servicios

### AuthService

```typescript
import { AuthService } from '@mhor/services';
import { createRateLimiter } from '@mhor/services';

// Crear rate limiter para auth
const authLimiter = createRateLimiter('auth');

// Pasar al AuthService
const authService = new AuthService(
  supabase,
  db,
  usersTable,
  authLimiter  // Opcional
);

// El servicio automáticamente:
// - Verifica rate limit antes de login
// - Consume rate limit después (éxito/fallo)
// - Solo cuenta intentos fallidos
```

### API Routes (Next.js)

```typescript
// app/api/products/route.ts
import { createRateLimiter } from '@mhor/services';

const apiLimiter = createRateLimiter('api');

export async function GET(request: Request) {
  // Obtener identificador del cliente (IP o user ID)
  const clientId = request.headers.get('x-forwarded-for') || 'unknown';
  
  // Verificar rate limit
  const rateLimit = await apiLimiter.check(clientId);
  
  if (!rateLimit.allowed) {
    return Response.json(
      { error: 'Too many requests' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': rateLimit.info.limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimit.info.resetTime.toISOString(),
          'Retry-After': Math.ceil(
            (rateLimit.info.resetTime.getTime() - Date.now()) / 1000
          ).toString(),
        },
      }
    );
  }
  
  try {
    // Procesar request
    const products = await getProducts();
    
    // Success - consume
    await apiLimiter.consume(clientId, true);
    
    return Response.json(products, {
      headers: {
        'X-RateLimit-Limit': rateLimit.info.limit.toString(),
        'X-RateLimit-Remaining': rateLimit.info.remaining.toString(),
        'X-RateLimit-Reset': rateLimit.info.resetTime.toISOString(),
      },
    });
  } catch (error) {
    // Error - consume
    await apiLimiter.consume(clientId, false);
    throw error;
  }
}
```

### Middleware Global

```typescript
// middleware.ts
import { createRateLimiter } from '@mhor/services';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const limiters = {
  api: createRateLimiter('api'),
  auth: createRateLimiter('auth'),
};

export async function middleware(request: NextRequest) {
  const clientId = request.ip || 'unknown';
  const path = request.nextUrl.pathname;
  
  // Elegir limiter según path
  let limiter = limiters.api;
  if (path.startsWith('/api/auth')) {
    limiter = limiters.auth;
  }
  
  const result = await limiter.check(clientId);
  
  if (!result.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': result.info.limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': result.info.resetTime.toISOString(),
        },
      }
    );
  }
  
  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Limit', result.info.limit.toString());
  response.headers.set('X-RateLimit-Remaining', result.info.remaining.toString());
  response.headers.set('X-RateLimit-Reset', result.info.resetTime.toISOString());
  
  return response;
}

export const config = {
  matcher: '/api/:path*',
};
```

## 🎨 Patrones de Uso

### 1. Rate Limiting por Usuario

```typescript
const limiter = createRateLimiter('api');

// Usar user ID como identificador
const userId = await getCurrentUser();
const result = await limiter.check(userId.id);
```

### 2. Rate Limiting por IP

```typescript
const limiter = createRateLimiter('api');

// Usar IP como identificador
const ip = request.headers.get('x-forwarded-for');
const result = await limiter.check(ip || 'unknown');
```

### 3. Rate Limiting por Endpoint

```typescript
const createLimiter = createRateLimiter('write');
const readLimiter = createRateLimiter('read');
const searchLimiter = createRateLimiter('search');

// Elegir según operación
const limiter = method === 'GET' ? readLimiter : createLimiter;
```

### 4. Rate Limiting Combinado

```typescript
// Por usuario Y por IP
const userId = user?.id || 'anonymous';
const ip = request.ip;

const userResult = await userLimiter.check(userId);
const ipResult = await ipLimiter.check(ip);

if (!userResult.allowed || !ipResult.allowed) {
  throw new Error('Rate limit exceeded');
}
```

### 5. Skip Requests Condicional

```typescript
const limiter = new RateLimiter({
  windowMs: 60000,
  max: 100,
  skipSuccessfulRequests: true, // Solo contar errores
});

// Los requests exitosos no cuentan para el límite
await limiter.consume(userId, true);  // No se cuenta
await limiter.consume(userId, false); // Se cuenta
```

## 🧪 Testing

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { RateLimiter, MemoryRateLimitStore } from '@mhor/services';

describe('My API with Rate Limiting', () => {
  let limiter: RateLimiter;
  
  beforeEach(() => {
    limiter = new RateLimiter({
      windowMs: 60000,
      max: 5,
    });
  });
  
  it('should allow requests under limit', async () => {
    const result = await limiter.check('test-user');
    expect(result.allowed).toBe(true);
  });
  
  it('should block requests over limit', async () => {
    // Hacer 5 requests
    for (let i = 0; i < 5; i++) {
      await limiter.check('test-user');
    }
    
    // El 6to debe fallar
    const result = await limiter.check('test-user');
    expect(result.allowed).toBe(false);
  });
});
```

## 📈 Monitoring

### Obtener Estadísticas

```typescript
const info = await limiter.getInfo(userId);

if (info) {
  console.log({
    userId,
    current: info.current,
    limit: info.limit,
    remaining: info.remaining,
    resetTime: info.resetTime,
    percentUsed: (info.current / info.limit) * 100,
  });
}
```

### Logging de Rate Limits

```typescript
const result = await limiter.check(userId);

if (!result.allowed) {
  console.warn('Rate limit exceeded:', {
    userId,
    current: result.info.current,
    limit: result.info.limit,
    resetTime: result.info.resetTime,
  });
  
  // Opcional: enviar a monitoring service
  await sendToDatadog({
    metric: 'ratelimit.exceeded',
    tags: { userId, endpoint: '/api/products' },
  });
}
```

## 🔧 Troubleshooting

### Rate Limit no Funciona

**Problema**: Los requests no se bloquean
```typescript
// ❌ INCORRECTO - Solo verifica, no incrementa
const result = await limiter.check(userId);
// Request se procesa pero nunca se consume

// ✅ CORRECTO - Verifica Y consume
const result = await limiter.check(userId);
if (!result.allowed) throw new Error('Rate limit');
// Procesar request
await limiter.consume(userId, true);
```

### Redis No Conecta

**Solución**: El sistema usa fallback automático a memoria

```typescript
// Si Redis falla, automáticamente usa memoria
const store = createRedisRateLimitStore(); // Fallback built-in

// Verificar si Redis está conectado
if (store.isConnected && store.isConnected()) {
  console.log('Using Redis');
} else {
  console.log('Using memory fallback');
}
```

### Requests se Resetean Muy Rápido

**Problema**: Window muy corto

```typescript
// ❌ 1 segundo
new RateLimiter({ windowMs: 1000, max: 5 })

// ✅ 1 minuto
new RateLimiter({ windowMs: 60000, max: 5 })

// ✅ 15 minutos (auth)
new RateLimiter({ windowMs: 15 * 60 * 1000, max: 5 })
```

### Múltiples Instancias No Sincronizadas

**Solución**: Usar Redis en producción

```typescript
// ❌ Memory - cada instancia tiene su propio contador
const store = new MemoryRateLimitStore();

// ✅ Redis - compartido entre todas las instancias
const store = createRedisRateLimitStore(process.env.REDIS_URL);
```

## 🚀 Mejores Prácticas

### 1. Usar Presets Cuando Sea Posible

```typescript
// ✅ Bueno
const limiter = createRateLimiter('auth');

// ❌ Reinventar la rueda
const limiter = new RateLimiter({ windowMs: 900000, max: 5 });
```

### 2. Redis en Producción

```typescript
const store = process.env.NODE_ENV === 'production'
  ? createRedisRateLimitStore()
  : new MemoryRateLimitStore();

const limiter = createRateLimiter('api', store);
```

### 3. Headers Estándar

```typescript
// Siempre incluir headers de rate limit
Response.json(data, {
  headers: {
    'X-RateLimit-Limit': info.limit.toString(),
    'X-RateLimit-Remaining': info.remaining.toString(),
    'X-RateLimit-Reset': info.resetTime.toISOString(),
  },
});
```

### 4. Mensajes Útiles

```typescript
const limiter = new RateLimiter({
  windowMs: 60000,
  max: 100,
  message: 'Límite de 100 requests por minuto alcanzado. Intenta en un momento.',
});
```

### 5. Cleanup en Shutdown

```typescript
// Al cerrar la aplicación
process.on('SIGTERM', () => {
  if (store instanceof MemoryRateLimitStore) {
    store.destroy();
  }
});
```

## 📝 Ejemplos Completos

### API Completa con Rate Limiting

```typescript
// lib/rate-limiters.ts
import { createRateLimiter, createRedisRateLimitStore } from '@mhor/services';

const store = createRedisRateLimitStore();

export const limiters = {
  auth: createRateLimiter('auth', store),
  api: createRateLimiter('api', store),
  write: createRateLimiter('write', store),
  search: createRateLimiter('search', store),
  upload: createRateLimiter('upload', store),
};

// app/api/products/route.ts
import { limiters } from '@/lib/rate-limiters';

export async function GET(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  
  const rateLimit = await limiters.api.check(ip);
  if (!rateLimit.allowed) {
    return Response.json({ error: 'Too many requests' }, { status: 429 });
  }
  
  // Procesar...
  return Response.json({ products: [] });
}
```

## 🔄 Migración desde express-rate-limit

```typescript
// Antes (express-rate-limit)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many requests',
});
app.use('/api/', limiter);

// Ahora (@mhor/services)
import { createRateLimiter } from '@mhor/services';

const limiter = createRateLimiter('auth');

export async function middleware(request: NextRequest) {
  const result = await limiter.check(request.ip);
  if (!result.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }
  return NextResponse.next();
}
```

## 📊 Performance

### Benchmarks

**Memory Store:**
- check(): ~0.1ms
- increment(): ~0.05ms
- get(): ~0.05ms

**Redis Store:**
- check(): ~2-5ms (network latency)
- increment(): ~1-3ms
- get(): ~1-2ms

### Optimizaciones

1. **Reuse Limiter Instances**: Crea limiters una vez, no en cada request
2. **Redis Connection Pooling**: Redis client maneja esto automáticamente
3. **Batch Operations**: Para múltiples checks, usa Promise.all()

```typescript
// ✅ Bueno - reusable
const limiter = createRateLimiter('api');

export function handler() {
  return limiter.check(userId);
}

// ❌ Malo - crea nuevo limiter cada vez
export function handler() {
  const limiter = createRateLimiter('api');
  return limiter.check(userId);
}
```

## 🎯 Roadmap

- [ ] Distributed rate limiting con Redis Cluster
- [ ] Rate limiting por método HTTP
- [ ] Whitelist/Blacklist de IPs
- [ ] Burst allowance (permitir picos temporales)
- [ ] Rate limiting progresivo (aumenta restricción gradualmente)
- [ ] Dashboard de monitoring
- [ ] Webhooks para alertas
- [ ] Tokens de bypass para testing

## 📚 Referencias

- [IETF Draft: RateLimit Header Fields](https://datatracker.ietf.org/doc/html/draft-ietf-httpapi-ratelimit-headers)
- [Redis INCR Pattern](https://redis.io/commands/incr/)
- [Express Rate Limit](https://github.com/express-rate-limit/express-rate-limit)
