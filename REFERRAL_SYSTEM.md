# 🤝 Sistema de Referidos - Documentación Completa

## 📋 Índice

1. [Descripción General](#descripción-general)
2. [Arquitectura](#arquitectura)
3. [Base de Datos](#base-de-datos)
4. [Flujo del Sistema](#flujo-del-sistema)
5. [API Reference](#api-reference)
6. [Componentes UI](#componentes-ui)
7. [Configuración de Recompensas](#configuración-de-recompensas)
8. [Testing](#testing)
9. [Deployment](#deployment)

---

## 📖 Descripción General

El **Sistema de Referidos** permite a los usuarios invitar amigos y familiares a la plataforma, obteniendo recompensas cuando los nuevos usuarios completan su primera compra.

### Características Principales

✅ **Código único** por usuario (8 caracteres: 4 del userID + 4 random)  
✅ **Link compartible** con tracking automático via URL params (`?ref=CODE`)  
✅ **Recompensas duales:**
- Nuevo usuario: **10% de descuento** en su primera compra (cupón válido 30 días)
- Usuario que refiere: **200 puntos** cuando el nuevo usuario compra

✅ **Dashboard completo** con métricas y lista de referidos  
✅ **Compartir** en WhatsApp, Facebook, Twitter  
✅ **Auto-detección** de códigos en URL y localStorage (válido 30 días)  
✅ **Stats en tiempo real** con tasa de conversión  
✅ **Triggers automáticos** en PostgreSQL para mantener stats actualizadas

---

## 🏗️ Arquitectura

### Stack Tecnológico

- **Next.js 15** - App Router + Server Actions
- **PostgreSQL** - Base de datos con triggers automáticos
- **Drizzle ORM** - Type-safe database queries
- **React Hooks** - useReferralTracking para tracking
- **localStorage** - Persistencia temporal del código de referido

### Diagrama de Flujo

```
1. Usuario A genera link de referido → /account/referrals
2. Usuario A comparte link → WhatsApp/Facebook/Twitter
3. Usuario B hace click → ?ref=ABCD1234
4. useReferralTracking detecta código → guarda en localStorage
5. Usuario B se registra → signup page
6. processReferralSignup crea referido + cupón
7. Usuario B hace primera compra → createOrder
8. completeReferral marca como completado
9. giveReferralRewards da 200 puntos al Usuario A
10. Stats actualizadas por triggers automáticos
```

---

## 🗄️ Base de Datos

### Migración: `009_add_referral_system.sql`

#### Tabla: `user_referrals`

Registra cada referido individual.

```sql
CREATE TABLE user_referrals (
  id SERIAL PRIMARY KEY,
  referrer_user_id TEXT NOT NULL,       -- Quien refiere
  referred_user_id TEXT NOT NULL,       -- Quien fue referido
  referral_code TEXT NOT NULL,          -- Código usado
  status TEXT DEFAULT 'pending',        -- pending | completed | rewarded
  first_order_id INTEGER,               -- Primera orden del referido
  first_order_amount DECIMAL(10, 2),    -- Valor de la primera orden
  referrer_reward_points INTEGER DEFAULT 0,
  referred_reward_coupon TEXT,          -- Cupón del nuevo usuario
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  rewarded_at TIMESTAMP
);
```

**Estados:**
- `pending`: Usuario se registró, esperando primera compra
- `completed`: Usuario hizo primera compra, pendiente de recompensas
- `rewarded`: Recompensas entregadas

#### Tabla: `referral_stats`

Estadísticas agregadas por usuario (actualizada por triggers).

```sql
CREATE TABLE referral_stats (
  user_id TEXT PRIMARY KEY,
  referral_code TEXT NOT NULL UNIQUE,    -- Código único del usuario
  total_referrals INTEGER DEFAULT 0,     -- Total registrados
  completed_referrals INTEGER DEFAULT 0, -- Total que compraron
  pending_referrals INTEGER DEFAULT 0,   -- Pendientes de comprar
  total_points_earned INTEGER DEFAULT 0,
  total_revenue_generated DECIMAL(10, 2) DEFAULT 0,
  best_month_referrals INTEGER DEFAULT 0,
  best_month_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Triggers Automáticos

1. **create_referral_stats_for_user()** - Crea stats cuando se registra usuario
2. **update_referral_stats()** - Actualiza contadores cuando cambia status de referido
3. **generate_referral_code()** - Genera código único de 8 caracteres

#### Vista: `referral_dashboard`

Query precomputada con todas las métricas + lista de referidos recientes.

---

## 🔄 Flujo del Sistema

### 1. Generación de Código

**Automático al crear usuario:**

```typescript
// Trigger en PostgreSQL se ejecuta automáticamente
CREATE TRIGGER trigger_create_referral_stats
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_referral_stats_for_user();
```

**Formato del código:**
- Primeras 4 letras del `user_id` + 4 caracteres random
- Ejemplo: `ABCD1234`
- Garantizado único por query recursiva

### 2. Tracking del Código

**Hook: `useReferralTracking()`**

```typescript
// Detecta código en URL
const { referralCode, hasReferralCode } = useReferralTracking();

// Guarda en localStorage
localStorage.setItem('mhorp_referral_code', JSON.stringify({
  code: 'ABCD1234',
  expiresAt: '2025-11-18T00:00:00Z' // 30 días
}));
```

### 3. Registro con Código

**Page: `/signup`**

```typescript
// 1. Auto-detecta código de URL o localStorage
useEffect(() => {
  if (urlReferralCode) {
    setReferralCode(urlReferralCode);
    validateCode(urlReferralCode);
  }
}, [urlReferralCode]);

// 2. Valida código en tiempo real
const result = await validateReferralCode(code);
setReferralValid(result.valid);

// 3. Al crear cuenta, procesa referido
const referralResult = await processReferralSignup(savedCode, newUserId);

// 4. Crea cupón automáticamente
// Cupón: BIENVENIDA{primeros6delUserID}
// Descuento: 10%
// Validez: 30 días
```

### 4. Primera Compra

**Action: `createOrder()`**

```typescript
// Detecta si es primera compra
const userOrders = await db.query.orders.findMany({
  where: eq(orders.userId, user.id),
});

if (userOrders.length === 1) {
  // ✅ Es la primera compra
  await completeReferral(user.id, orderId, totalAmount);
}
```

### 5. Entrega de Recompensas

**Action: `completeReferral()` → `giveReferralRewards()`**

```typescript
// 1. Marca referido como 'completed'
await db.update(userReferrals)
  .set({
    status: 'completed',
    firstOrderId: orderId,
    firstOrderAmount: orderAmount,
    completedAt: new Date(),
  });

// 2. Da recompensas y marca como 'rewarded'
await db.update(userReferrals)
  .set({
    status: 'rewarded',
    referrerRewardPoints: 200,
    rewardedAt: new Date(),
  });

// 3. Stats se actualizan automáticamente por trigger
```

---

## 🔌 API Reference

### Server Actions

#### `getUserReferralStats()`

Obtiene las estadísticas del usuario actual.

```typescript
const stats = await getUserReferralStats();
// Returns: UserReferralStats | null

interface UserReferralStats {
  referralCode: string;
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  totalPointsEarned: number;
  totalRevenueGenerated: string;
  conversionRate: number;
  referralLink: string;
}
```

#### `getUserReferrals()`

Obtiene la lista de referidos del usuario.

```typescript
const referrals = await getUserReferrals();
// Returns: ReferralDetails[]

interface ReferralDetails {
  id: number;
  referredUserId: string;
  referredUserEmail: string | null;
  status: 'pending' | 'completed' | 'rewarded';
  createdAt: Date;
  completedAt: Date | null;
  firstOrderAmount: string | null;
}
```

#### `processReferralSignup(code, newUserId)`

Procesa el registro de un nuevo usuario con código de referido.

```typescript
const result = await processReferralSignup('ABCD1234', newUserId);
// Returns: { success: boolean; couponCode?: string; discount?: number; error?: string }
```

**Acciones:**
1. Valida que el código existe
2. Verifica que no sea auto-referido
3. Crea registro en `user_referrals` con status='pending'
4. Crea cupón de bienvenida (10% descuento, 30 días)
5. Actualiza stats (via trigger)

#### `completeReferral(userId, orderId, amount)`

Completa un referido cuando hace su primera compra.

```typescript
const result = await completeReferral(userId, orderId, '150.00');
// Returns: { success: boolean; error?: string }
```

**Acciones:**
1. Busca referido pendiente
2. Verifica monto mínimo (configurable, default: S/ 0)
3. Actualiza a status='completed'
4. Llama a `giveReferralRewards()`
5. Stats actualizadas por trigger

#### `validateReferralCode(code)`

Valida que un código existe y es válido.

```typescript
const result = await validateReferralCode('ABCD1234');
// Returns: { valid: boolean; message?: string }
```

#### `getGlobalReferralStats()` (Admin only)

Obtiene estadísticas globales del sistema.

```typescript
const stats = await getGlobalReferralStats();
// Returns: { totalReferrals, completedReferrals, rewardedReferrals, totalRevenue, topReferrers }
```

### Hooks

#### `useReferralTracking()`

Hook para detectar y trackear códigos de referido.

```typescript
const { referralCode, hasReferralCode } = useReferralTracking();
```

**Funcionalidad:**
- Detecta parámetro `?ref=CODE` en URL
- Guarda en localStorage por 30 días
- Auto-recupera código guardado válido
- Limpia códigos expirados

#### Helper Functions

```typescript
// Obtener código guardado (válido)
const saved = getSavedReferralCode();
// Returns: { code: string; expiresAt: Date } | null

// Limpiar código (después de registro)
clearReferralCode();

// Verificar si hay código activo
const hasCode = hasActiveReferralCode();

// Obtener solo el código
const code = getReferralCode();
```

---

## 🎨 Componentes UI

### `<ReferralDashboard />`

Dashboard completo de referidos.

**Path:** `src/components/account/ReferralDashboard.tsx`

**Características:**
- 📊 Cards con métricas (Total, Completados, Puntos, Conversión%)
- 🔗 Link compartible con botón de copiar
- 📱 Botones para compartir en redes sociales
- 📋 Lista de referidos con estados
- 🎨 UI responsive con Tailwind CSS
- ⚡ Auto-refresh de datos

**Uso:**

```tsx
import { ReferralDashboard } from '@/components/account/ReferralDashboard';

<ReferralDashboard />
```

### Signup Page con Referidos

**Path:** `src/app/(auth)/signup/page.tsx`

**Características:**
- ✅ Auto-detección de código en URL
- 🔍 Validación en tiempo real
- 🎁 Banner de bienvenida si hay código válido
- ⚠️ Feedback visual (verde/rojo)
- 💾 Persistencia en localStorage

---

## ⚙️ Configuración de Recompensas

**File:** `src/actions/referral.ts`

```typescript
const REFERRAL_REWARDS = {
  // Puntos que gana el que refiere
  REFERRER_POINTS: 200,
  
  // Descuento del nuevo usuario
  NEW_USER_DISCOUNT_PERCENTAGE: 10,
  NEW_USER_COUPON_DAYS: 30,
  
  // Mínimo para completar referido
  MINIMUM_ORDER_AMOUNT: 0, // S/ 0 = cualquier compra
};
```

**Para cambiar las recompensas:**

1. Edita el objeto `REFERRAL_REWARDS`
2. Commit y push
3. No requiere migración de DB

---

## 🧪 Testing

### Test Manual Completo

#### 1. Generar Código

```bash
# 1. Crear cuenta de Usuario A
# 2. Ir a /account/referrals
# 3. Verificar que se generó código único
# 4. Copiar link de referido
```

#### 2. Compartir Link

```bash
# 1. Abrir link en navegador incógnito
# 2. Verificar que URL tiene ?ref=CODE
# 3. Verificar en DevTools > localStorage que se guardó el código
```

#### 3. Registro con Código

```bash
# 1. Ir a /signup
# 2. Verificar que código se auto-llenó
# 3. Crear cuenta de Usuario B
# 4. Verificar toast con cupón de bienvenida
```

#### 4. Verificar en DB

```sql
-- Verificar que se creó el referido
SELECT * FROM user_referrals 
WHERE referred_user_id = 'USER_B_ID';

-- Verificar stats del Usuario A
SELECT * FROM referral_stats 
WHERE user_id = 'USER_A_ID';

-- Verificar que se creó el cupón
SELECT * FROM coupons 
WHERE code LIKE 'BIENVENIDA%'
ORDER BY created_at DESC LIMIT 1;
```

#### 5. Primera Compra

```bash
# 1. Login como Usuario B
# 2. Agregar productos al carrito
# 3. Aplicar cupón BIENVENIDA{ID}
# 4. Crear orden
# 5. Verificar que se marca como completado
```

#### 6. Verificar Recompensas

```sql
-- Verificar que referido está completado
SELECT status, referrer_reward_points 
FROM user_referrals 
WHERE referred_user_id = 'USER_B_ID';

-- Verificar stats actualizadas
SELECT completed_referrals, total_points_earned 
FROM referral_stats 
WHERE user_id = 'USER_A_ID';
```

### Queries de Testing

```sql
-- Ver todos los referidos con estado
SELECT 
  ur.id,
  ur.referral_code,
  ur.status,
  ur.created_at,
  ur.completed_at,
  ur.referrer_reward_points,
  u1.email as referrer_email,
  u2.email as referred_email
FROM user_referrals ur
JOIN users u1 ON u1.id = ur.referrer_user_id
JOIN users u2 ON u2.id = ur.referred_user_id
ORDER BY ur.created_at DESC;

-- Top referrers
SELECT 
  rs.referral_code,
  u.email,
  rs.total_referrals,
  rs.completed_referrals,
  rs.total_points_earned,
  rs.total_revenue_generated
FROM referral_stats rs
JOIN users u ON u.id = rs.user_id
ORDER BY rs.total_referrals DESC
LIMIT 10;

-- Tasa de conversión global
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'completed') as completed,
  ROUND(
    COUNT(*) FILTER (WHERE status = 'completed')::DECIMAL / 
    NULLIF(COUNT(*), 0) * 100, 
    2
  ) as conversion_rate
FROM user_referrals;
```

---

## 🚀 Deployment

### 1. Ejecutar Migración

```bash
# En Supabase SQL Editor:
# Copiar y pegar migrations/009_add_referral_system.sql
# Ejecutar (puede tardar 5-10 segundos)
```

### 2. Verificar Tablas Creadas

```sql
-- Debe retornar 2 tablas
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('user_referrals', 'referral_stats');

-- Debe retornar 3 funciones
SELECT proname FROM pg_proc 
WHERE proname IN (
  'generate_referral_code', 
  'create_referral_stats_for_user',
  'update_referral_stats'
);

-- Debe retornar 1 vista
SELECT viewname FROM pg_views 
WHERE schemaname = 'public' 
AND viewname = 'referral_dashboard';
```

### 3. Generar Stats para Usuarios Existentes

```sql
-- Solo si ya tienes usuarios registrados
INSERT INTO referral_stats (user_id, referral_code)
SELECT id, generate_referral_code(id)
FROM users
ON CONFLICT (user_id) DO NOTHING;
```

### 4. Variables de Entorno

```env
# .env.local
NEXT_PUBLIC_SITE_URL=https://tutienda.com
```

### 5. Deploy a Producción

```bash
git add .
git commit -m "feat: implementar sistema de referidos completo"
git push origin main
```

### 6. Testing Post-Deploy

- [ ] Crear cuenta de prueba
- [ ] Verificar que se generó código en `/account/referrals`
- [ ] Compartir link en incógnito
- [ ] Registrar nuevo usuario con código
- [ ] Verificar cupón de bienvenida
- [ ] Hacer primera compra
- [ ] Verificar que se completó referido
- [ ] Verificar puntos en dashboard

---

## 📊 Métricas y Analytics

### KPIs Principales

- **Viral Coefficient** = (Referidos / Total Usuarios)
- **Conversion Rate** = (Completados / Registrados) %
- **Average Revenue per Referral** = Total Revenue / Completados
- **Cost per Acquisition** = Puntos Dados / Completados

### Dashboard de Admin (Futuro)

```typescript
// Ejemplo de query para admin
const stats = await getGlobalReferralStats();

{
  totalReferrals: 150,
  completedReferrals: 85,
  rewardedReferrals: 85,
  totalRevenue: '12,500.00',
  topReferrers: [
    { user_id, referral_code, total_referrals: 15 },
    // ...
  ]
}
```

---

## 🔧 Troubleshooting

### Problema: "Código no se detecta en URL"

**Solución:**
```typescript
// Verificar en DevTools > Console
console.log(searchParams?.get('ref'));

// Verificar localStorage
localStorage.getItem('mhorp_referral_code');
```

### Problema: "Cupón no se crea al registrarse"

**Solución:**
```typescript
// Verificar en server logs
console.log('Referido procesado:', result);

// Verificar en DB
SELECT * FROM coupons 
WHERE code LIKE 'BIENVENIDA%' 
ORDER BY created_at DESC;
```

### Problema: "Recompensas no se dan al comprar"

**Solución:**
```sql
-- Verificar que trigger funciona
SELECT * FROM user_referrals 
WHERE referred_user_id = 'USER_ID';

-- Si está en 'completed' pero no 'rewarded':
-- Ejecutar manualmente
UPDATE user_referrals 
SET status = 'rewarded', 
    referrer_reward_points = 200,
    rewarded_at = NOW()
WHERE id = REFERRAL_ID;
```

### Problema: "Stats no se actualizan"

**Solución:**
```sql
-- Verificar que triggers existen
SELECT tgname FROM pg_trigger 
WHERE tgname IN (
  'trigger_create_referral_stats',
  'trigger_update_referral_stats'
);

-- Re-crear triggers si es necesario
-- (ver migrations/009_add_referral_system.sql)
```

---

## 📝 Changelog

### v1.0.0 (Octubre 2025)

✅ Sistema completo de referidos  
✅ Códigos únicos de 8 caracteres  
✅ Tracking automático via URL  
✅ Recompensas duales (cupón + puntos)  
✅ Dashboard con stats en tiempo real  
✅ Compartir en redes sociales  
✅ Triggers automáticos PostgreSQL  
✅ Documentación completa  

---

## 🤝 Contribuciones

Para agregar features al sistema de referidos:

1. Crea un issue describiendo la feature
2. Haz fork y crea una branch
3. Implementa con tests
4. Actualiza esta documentación
5. Abre PR

---

**Última actualización:** Octubre 2025  
**Versión:** 1.0.0  
**Commit:** TBD
