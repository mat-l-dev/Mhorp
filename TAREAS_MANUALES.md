# 📋 TAREAS MANUALES PENDIENTES

Este documento lista todas las tareas que **TÚ** debes hacer manualmente para completar la implementación de las nuevas features.

---

## 🗄️ 1. EJECUTAR MIGRACIONES EN SUPABASE

### Migración 1: Tabla de Historial de Precios
**Archivo:** `migrations/005_add_price_history.sql`

**Pasos:**
1. Ve a [Supabase Dashboard](https://app.supabase.com)
2. Selecciona tu proyecto
3. Click en **SQL Editor** (menú izquierdo)
4. Click en **New Query**
5. Copia y pega el contenido completo de `migrations/005_add_price_history.sql`
6. Click en **Run** (o presiona Ctrl+Enter)
7. ✅ Verifica que aparezca: "Success. No rows returned"

### Migración 2: Campo is_verified en Reviews
**Archivo:** `migrations/006_add_reviews_is_verified.sql`

**Pasos:**
1. En el mismo SQL Editor de Supabase
2. Click en **New Query**
3. Copia y pega el contenido completo de `migrations/006_add_reviews_is_verified.sql`
4. Click en **Run**
5. ✅ Verifica que aparezca: "Success. No rows returned"

### Migración 3: Tabla de Wishlists Compartidas
**Archivo:** `migrations/007_add_shared_wishlists.sql`

**Pasos:**
1. En el mismo SQL Editor de Supabase
2. Click en **New Query**
3. Copia y pega el contenido completo de `migrations/007_add_shared_wishlists.sql`
4. Click en **Run**
5. ✅ Verifica que aparezca: "Success. No rows returned"

### Verificación
Para confirmar que las migraciones se aplicaron correctamente:
```sql
-- Verifica que existe la tabla price_history
SELECT * FROM price_history LIMIT 5;

-- Verifica que existe la columna is_verified en reviews
SELECT id, rating, is_verified FROM reviews LIMIT 5;

-- Verifica que existe la tabla shared_wishlists
SELECT * FROM shared_wishlists LIMIT 5;
```

---

## 🔑 2. CONFIGURAR VARIABLES DE ENTORNO

### En Local (.env.local)
Agrega estas variables a tu archivo `.env.local`:

```env
# ============================================
# NOTIFICACIONES DE EMAIL (RESEND)
# ============================================
RESEND_API_KEY=re_xxxxxxxxxxxxx
EMAIL_FROM=noreply@tutienda.com

# ============================================
# CRON JOB SECURITY
# ============================================
CRON_SECRET=tu_secreto_super_seguro_aqui

# ============================================
# URL DEL SITIO (para links en emails)
# ============================================
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# ============================================
# VERCEL KV (REDIS CACHE)
# ============================================
KV_URL=redis://localhost:6379  # Para desarrollo local
# O usa las variables de Vercel KV:
# KV_REST_API_URL=https://xxxxx.kv.vercel-storage.com
# KV_REST_API_TOKEN=xxxxxxxxxxxxx
# KV_REST_API_READ_ONLY_TOKEN=xxxxxxxxxxxxx

# ============================================
# ADMIN SECRET (API de Cache)
# ============================================
ADMIN_SECRET=tu_secreto_para_admin_api
```

### Generar CRON_SECRET
Ejecuta UNO de estos comandos para generar un secret seguro:

```bash
# Opción 1: Con OpenSSL
openssl rand -base64 32

# Opción 2: Con Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Opción 3: Con PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

Copia el resultado y úsalo como valor de `CRON_SECRET`.

### Obtener RESEND_API_KEY
1. Ve a [resend.com](https://resend.com)
2. Crea una cuenta (gratis hasta 3,000 emails/mes)
3. Ve a **API Keys**
4. Click en **Create API Key**
5. Dale un nombre (ej: "MHOR Production")
6. Copia la key que empieza con `re_`
7. Pégala en `RESEND_API_KEY`

**IMPORTANTE:** También configura el dominio de envío en Resend:
- Settings > Domains > Add Domain
- Agrega tu dominio (ej: `tutienda.com`)
- Sigue las instrucciones para verificar con DNS records
- Mientras tanto, puedes usar `onboarding@resend.dev` para pruebas

---

## ☁️ 3. CONFIGURAR VARIABLES EN VERCEL (PRODUCCIÓN)

### Opción 1: Desde el Dashboard de Vercel
1. Ve a [vercel.com/dashboard](https://vercel.com/dashboard)
2. Selecciona tu proyecto **Mhorp**
3. Click en **Settings** > **Environment Variables**
4. Agrega cada variable:

| Variable | Value | Environments |
|----------|-------|--------------|
| `RESEND_API_KEY` | `re_xxxxx` | Production, Preview, Development |
| `EMAIL_FROM` | `noreply@tutienda.com` | Production, Preview, Development |
| `CRON_SECRET` | (el secret que generaste) | Production, Preview, Development |
| `NEXT_PUBLIC_SITE_URL` | `https://tudominio.vercel.app` | Production |
| `NEXT_PUBLIC_SITE_URL` | `https://preview-url.vercel.app` | Preview |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | Development |
| `KV_REST_API_URL` | (auto-generada por Vercel KV) | Production, Preview, Development |
| `KV_REST_API_TOKEN` | (auto-generada por Vercel KV) | Production, Preview, Development |
| `KV_REST_API_READ_ONLY_TOKEN` | (auto-generada por Vercel KV) | Production, Preview, Development |
| `ADMIN_SECRET` | (secreto para API de cache) | Production, Preview, Development |

5. Click en **Save** para cada una

### Opción 2: Desde la Terminal con Vercel CLI
```bash
# Instalar Vercel CLI si no lo tienes
npm i -g vercel

# Agregar variables
vercel env add RESEND_API_KEY
# Pega el valor cuando te lo pida
# Selecciona: Production, Preview, Development

vercel env add EMAIL_FROM
# Pega: noreply@tutienda.com

vercel env add CRON_SECRET
# Pega el secret que generaste

vercel env add NEXT_PUBLIC_SITE_URL
# Para Production: https://tudominio.vercel.app
# Para Preview: https://preview-url.vercel.app
# Para Development: http://localhost:3000
```

### Re-deploy después de agregar variables
```bash
# Opción 1: Desde la terminal
vercel --prod

# Opción 2: Desde el dashboard
# Deployments > ... > Redeploy
```

---

## ⏰ 4. VERIFICAR CRON JOB EN VERCEL

### Requisito: Plan Pro de Vercel
⚠️ **IMPORTANTE:** Los Cron Jobs solo funcionan en **Vercel Pro** ($20/mes). El plan Hobby NO soporta crons.

Si no tienes Pro, el cron job no se ejecutará automáticamente, pero puedes:
- Llamarlo manualmente con curl
- Usar un servicio externo como [cron-job.org](https://cron-job.org)
- Usar GitHub Actions como alternativa

### Verificar Configuración
1. Ve al Dashboard de Vercel
2. Proyecto **Mhorp** > **Settings** > **Cron Jobs**
3. Deberías ver:
   ```
   /api/cron/price-drop
   Schedule: 0 9 * * *
   Status: Active
   ```

### Probar Manualmente
Ejecuta esto desde tu terminal (reemplaza con tu CRON_SECRET):

```bash
# Local
curl -X GET http://localhost:3000/api/cron/price-drop \
  -H "Authorization: Bearer tu_cron_secret_aqui"

# Producción
curl -X GET https://tudominio.vercel.app/api/cron/price-drop \
  -H "Authorization: Bearer tu_cron_secret_aqui"
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "productsChecked": 42,
  "priceDropsDetected": 2,
  "notificationsSent": 8,
  "details": [...],
  "timestamp": "2025-10-17T09:00:00.000Z"
}
```

---

## 🧪 5. PROBAR LAS NUEVAS FEATURES

### A. Analytics Dashboard
```bash
# 1. Inicia el servidor de desarrollo
pnpm run dev

# 2. Ve a http://localhost:3000/admin/analytics
# 3. Verifica que se muestren:
#    - KPIs (Ingresos, Órdenes, Ticket Promedio, Usuarios)
#    - Productos más vendidos
#    - Productos mejor calificados
#    - Productos más en wishlist
#    - Cupones más usados
#    - Ventas recientes (últimos 30 días)
#    - Conversión de wishlist
```

### B. Social Sharing
```bash
# 1. Ve a cualquier producto: http://localhost:3000/product/1
# 2. Click en el botón de "Compartir" (icono de share)
# 3. Prueba cada opción:
#    ✓ WhatsApp (debe abrir WhatsApp)
#    ✓ Facebook (debe abrir popup de Facebook)
#    ✓ Twitter (debe abrir popup de Twitter)
#    ✓ Copiar Link (debe mostrar checkmark verde)
# 4. En móvil, debe aparecer opción "Compartir..." con el menú nativo
```

### C. Verified Reviews Badge
```bash
# 1. Crea una orden con un producto (estado: delivered)
# 2. Deja una reseña en ese producto
# 3. Recarga la página del producto
# 4. Verifica que aparezca el badge verde "✓ Compra Verificada"
#    junto a tu reseña
```

### D. Price Drop Notifications
```bash
# 1. Agrega un producto a tu wishlist
# 2. Baja el precio de ese producto manualmente en la base de datos:
#    UPDATE products SET price = price * 0.7 WHERE id = 1;
# 3. Llama al cron job manualmente:
curl -X GET http://localhost:3000/api/cron/price-drop \
  -H "Authorization: Bearer tu_cron_secret"

# 4. Verifica:
#    - Logs en la terminal (debe mostrar "Bajada de precio detectada")
#    - Email recibido (si configuraste Resend)
#    - O logs simulando envío (si no hay Resend configurado)
```

---

## 📊 6. VERIFICAR QUE TODO FUNCIONA

### Checklist Final

#### Base de Datos
- [ ] Tabla `price_history` existe
- [ ] Columna `is_verified` existe en `reviews`
- [ ] Hay al menos un registro en `price_history`

#### Variables de Entorno (Local)
- [ ] `RESEND_API_KEY` configurado
- [ ] `EMAIL_FROM` configurado
- [ ] `CRON_SECRET` configurado
- [ ] `NEXT_PUBLIC_SITE_URL` configurado
- [ ] `KV_*` configuradas (Vercel KV o Redis local)
- [ ] `ADMIN_SECRET` configurado

#### Variables de Entorno (Vercel)
- [ ] Todas las variables agregadas en Vercel
- [ ] Vercel KV database creada y conectada
- [ ] Re-deploy realizado después de agregar variables

#### Funcionalidades
- [ ] Analytics Dashboard muestra datos correctamente
- [ ] Cache funciona (ver logs CACHE HIT/MISS)
- [ ] API de cache responde con stats
- [ ] Botones de compartir funcionan en página de producto
- [ ] Badge de "Compra Verificada" aparece en reseñas
- [ ] Wishlist compartida funciona (crear y ver públicamente)
- [ ] Imágenes tienen blur placeholder y lazy loading
- [ ] Cron job responde correctamente (prueba manual)
- [ ] Emails se envían (o simulan si no hay Resend)

#### Producción
- [ ] Código pusheado a GitHub (✅ Ya hecho)
- [ ] Deploy automático en Vercel exitoso
- [ ] Cron Job activo en Vercel (requiere Plan Pro)

---

## 🚀 7. CONFIGURAR VERCEL KV (REDIS CACHE)

### Crear Base de Datos KV en Vercel
1. Ve a [vercel.com/dashboard](https://vercel.com/dashboard)
2. Selecciona tu proyecto **Mhorp**
3. Click en **Storage** (menú lateral)
4. Click en **Create Database**
5. Selecciona **KV (Redis)**
6. Dale un nombre: `mhor-cache` o similar
7. Elige la región más cercana a tu deployment
8. Click en **Create**

### Conectar a tu Proyecto
1. En la página de tu database KV
2. Click en **Connect Project**
3. Selecciona tu proyecto **Mhorp**
4. Click en **Connect**
5. ✅ Las variables `KV_*` se agregan automáticamente

### Verificar Variables
1. Ve a **Settings** > **Environment Variables**
2. Deberías ver automáticamente:
   - `KV_URL`
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`
   - `KV_REST_API_READ_ONLY_TOKEN`

### Desarrollo Local
Para usar cache localmente:

**Opción 1: Redis Local (Recomendado)**
```bash
# Con Docker
docker run -d -p 6379:6379 redis:alpine

# O con WSL/Linux
sudo apt-get install redis-server
redis-server
```

**Opción 2: Usar Vercel KV en Local**
```bash
# Instala Vercel CLI
npm i -g vercel

# Descarga las variables de entorno
vercel env pull .env.local

# Las variables KV_* se descargarán automáticamente
```

### Generar ADMIN_SECRET
Este secret protege la API de cache (`/api/cache`):

```bash
# Con OpenSSL
openssl rand -base64 32

# O con Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Agrega el resultado en:
- `.env.local` para desarrollo
- Vercel Environment Variables para producción

### Probar Cache
```bash
# 1. Inicia el servidor
pnpm run dev

# 2. Ve al Analytics Dashboard
open http://localhost:3000/admin/analytics

# 3. Revisa los logs - Primera carga debe mostrar:
[CACHE MISS] analytics:metrics
[CACHE MISS] analytics:top-products:selling

# 4. Recarga la página - Segunda carga debe mostrar:
[CACHE HIT] analytics:metrics  ⚡
[CACHE HIT] analytics:top-products:selling  ⚡

# 5. Prueba la API de cache
curl -X GET http://localhost:3000/api/cache \
  -H "Authorization: Bearer $ADMIN_SECRET"
```

### Limpiar Cache Manualmente
```bash
# Limpiar todo el cache
curl -X POST http://localhost:3000/api/cache \
  -H "Authorization: Bearer $ADMIN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"action": "clear-all"}'

# Limpiar solo analytics
curl -X POST http://localhost:3000/api/cache \
  -H "Authorization: Bearer $ADMIN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"action": "clear-tag", "tag": "analytics"}'
```

### Documentación Completa
📖 Ver `CACHE_SYSTEM.md` para:
- Guía completa de uso
- Estrategias de TTL
- Mejores prácticas
- Troubleshooting avanzado

---

## 🆘 TROUBLESHOOTING

### Error: "price_history table does not exist"
**Solución:** Ejecuta la migración `005_add_price_history.sql` en Supabase.

### Error: "is_verified column does not exist"
**Solución:** Ejecuta la migración `006_add_reviews_is_verified.sql` en Supabase.

### Error: "shared_wishlists table does not exist"
**Solución:** Ejecuta la migración `007_add_shared_wishlists.sql` en Supabase.

### Error: "Cannot connect to Redis" / Cache no funciona
**Solución:**
1. Verifica que Vercel KV esté creado y conectado al proyecto
2. En local, verifica que Redis esté corriendo: `redis-cli ping` (debe retornar "PONG")
3. Verifica que las variables `KV_*` estén en `.env.local`
4. Reinicia el servidor de desarrollo

### Cron job retorna 401 Unauthorized
**Solución:** Verifica que el header `Authorization: Bearer` tenga el mismo valor que `CRON_SECRET`.

### Emails no se envían
**Solución:** 
1. Verifica que `RESEND_API_KEY` esté configurado
2. Verifica que el dominio esté verificado en Resend
3. Revisa los logs del cron job para ver errores específicos

### Analytics muestra 0 en todo
**Solución:** 
1. Crea datos de prueba (órdenes, reseñas, wishlist)
2. Verifica que las relaciones en el schema sean correctas
3. Revisa la consola del navegador para errores

### Botones de compartir no funcionan
**Solución:**
1. Verifica que el componente `ShareButtons` esté importado correctamente
2. Revisa la consola del navegador para errores de JavaScript
3. En móvil, verifica que el navegador soporte Web Share API

---

## 📝 NOTAS IMPORTANTES

### Resend Limits (Plan Gratuito)
- 3,000 emails/mes
- 100 emails/día
- Debes verificar tu dominio para enviar desde tu email

### Cron Job en Desarrollo
Si no tienes Vercel Pro, puedes usar:
1. **Manual:** Llamar el endpoint con curl cuando quieras
2. **GitHub Actions:** Gratis, configurar workflow
3. **Cron-job.org:** Servicio gratis que llama tu endpoint

### Backup de Variables
Guarda tus variables en un lugar seguro (1Password, Bitwarden, etc).
**NUNCA** las commits al repositorio.

---

## ✅ CUANDO TERMINES TODAS LAS TAREAS

Marca este archivo con un commit:
```bash
git add TAREAS_MANUALES.md
git commit -m "docs: completed manual tasks checklist"
git push
```

Y avísame para que actualicemos el progreso en el ROADMAP! 🚀
