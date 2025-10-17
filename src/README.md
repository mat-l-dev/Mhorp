# Arquitectura del Proyecto Mhorp

Esta documentación describe la estructura de carpetas y archivos del proyecto e-commerce Mhorp.

## 📁 Estructura Principal

```
src/
├── actions/          # Server Actions (lógica de backend)
├── app/             # Rutas de Next.js App Router
├── components/      # Componentes de React
└── lib/             # Librerías y utilidades centrales
```

## 🔧 Carpeta `lib/` - Librería Central

### `lib/db/`
Gestión de la base de datos con Drizzle ORM.

- **`index.ts`**: Punto único de acceso al cliente de la base de datos
- **`schema.ts`**: Definición de todas las tablas y relaciones

**Uso:**
```typescript
import { db } from '@/lib/db';
```

### `lib/supabase/`
Clientes de Supabase para autenticación y storage.

- **`client.ts`**: Cliente para componentes del navegador (Client Components)
- **`server.ts`**: Cliente para servidor (Server Components, Route Handlers, Server Actions)

**Uso:**
```typescript
// En Client Component
import { createClient } from '@/lib/supabase/client';

// En Server Component
import { createClient } from '@/lib/supabase/server';
```

## 🎨 Carpeta `components/` - Componentes de UI

### `components/shared/`
Componentes complejos reutilizables en múltiples páginas.

- **`Navbar.tsx`**: Barra de navegación principal
- **`Footer.tsx`**: Pie de página

### `components/icons/`
Componentes de íconos SVG personalizados.

## 🌐 Carpeta `app/` - Rutas de la Aplicación

Utilizamos **Route Groups** de Next.js para organizar lógicamente las rutas sin afectar las URLs.

### `app/(store)/` - Tienda Pública
Grupo de rutas para la experiencia de compra del cliente.

- **`page.tsx`**: Página de inicio / Catálogo principal
- **`product/[slug]/page.tsx`**: Página de detalle de producto
- **`cart/page.tsx`**: Carrito de compras
- **`checkout/page.tsx`**: Proceso de checkout/pago

**URLs generadas:**
- `/` → Inicio
- `/product/nombre-producto` → Detalle de producto
- `/cart` → Carrito
- `/checkout` → Checkout

### `app/(auth)/` - Autenticación
Grupo de rutas para login y registro.

- **`login/page.tsx`**: Inicio de sesión
- **`signup/page.tsx`**: Registro de nuevos usuarios

**URLs generadas:**
- `/login` → Iniciar sesión
- `/signup` → Crear cuenta

### `app/(admin)/` - Panel de Administración
Grupo de rutas para gestión administrativa.

- **`dashboard/page.tsx`**: Panel principal con métricas
- **`products/page.tsx`**: Gestión de productos (CRUD)
- **`orders/page.tsx`**: Gestión de pedidos y estados

**URLs generadas:**
- `/dashboard` → Panel principal
- `/products` → Gestión de productos
- `/orders` → Gestión de pedidos

## ⚡ Carpeta `actions/` - Server Actions

Lógica de backend ejecutada de forma segura en el servidor.

### `actions/auth.ts`
Autenticación y gestión de usuarios.

**Funciones disponibles:**
- `login()` - Iniciar sesión
- `signup()` - Registrar nuevo usuario
- `logout()` - Cerrar sesión
- `getCurrentUser()` - Obtener usuario actual

### `actions/cart.ts`
Gestión del carrito de compras.

**Funciones disponibles:**
- `addToCart()` - Agregar producto al carrito
- `removeFromCart()` - Eliminar producto del carrito
- `updateCartItemQuantity()` - Actualizar cantidad
- `getCart()` - Obtener carrito actual
- `clearCart()` - Vaciar carrito

### `actions/order.ts`
Gestión de pedidos y comprobantes de pago.

**Funciones disponibles:**
- `createOrder()` - Crear nuevo pedido
- `uploadPaymentProof()` - Subir comprobante de pago a Supabase
- `getUserOrders()` - Obtener pedidos del usuario
- `getOrderById()` - Obtener pedido específico
- `updateOrderStatus()` - Actualizar estado del pedido (admin)

## 🎯 Patrones y Mejores Prácticas

### 1. Separación de Responsabilidades
- **`lib/`**: Lógica de negocio y utilidades
- **`components/`**: UI y presentación
- **`actions/`**: Lógica de servidor
- **`app/`**: Rutas y páginas

### 2. Route Groups
Los paréntesis en los nombres de carpeta `(store)`, `(auth)`, `(admin)` permiten:
- Organizar rutas lógicamente
- No afectan la URL final
- Facilitan layouts específicos por grupo

### 3. Server Actions
Todo en la carpeta `actions/` usa la directiva `'use server'` para:
- Ejecutar código de forma segura en el servidor
- Evitar exponer lógica sensible al cliente
- Simplificar las llamadas desde componentes

### 4. Cliente Único de Base de Datos
El patrón "Single Instance" en `lib/db/index.ts` garantiza:
- Una única conexión a la base de datos
- Mejor rendimiento
- Evitar problemas de conexión

## 🚀 Próximos Pasos

1. **Definir Schema de Base de Datos**: Completar `lib/db/schema.ts`
2. **Instalar Dependencias**: `@supabase/ssr`, `drizzle-orm`, `postgres`
3. **Configurar Variables de Entorno**: `.env.local`
4. **Implementar TODOs**: Revisar comentarios `// TODO:` en cada archivo
5. **Crear Componentes UI**: Agregar formularios, cards, etc.
6. **Configurar Middleware**: Para protección de rutas

## 📚 Referencias

- [Next.js 14 App Router](https://nextjs.org/docs/app)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)

---

**Última actualización**: Octubre 2025
