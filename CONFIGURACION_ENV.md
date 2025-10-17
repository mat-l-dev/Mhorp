# 🔧 Configuración de Variables de Entorno

## Paso 1: Crear archivo `.env.local`

Copia el archivo de ejemplo:

```bash
# En PowerShell
Copy-Item .env.local.example .env.local

# O manualmente crea un archivo .env.local en la raíz del proyecto
```

## Paso 2: Obtener Credenciales de Supabase

### A. URL y Anon Key

1. Ve a [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto **Mhorp**
3. Ve a **Settings** → **API**
4. Copia:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Anon/Public Key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### B. Database URL (Connection String)

1. En el mismo proyecto de Supabase
2. Ve a **Settings** → **Database**
3. Busca la sección **Connection string**
4. Selecciona **Supavisor** (para connection pooling)
5. Copia la URL que tiene este formato:
   ```
   postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
   ```
6. **IMPORTANTE**: Reemplaza `[password]` con tu contraseña de base de datos

## Paso 3: Configurar `.env.local`

Tu archivo `.env.local` debe verse así (con tus valores reales):

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Database URL
DATABASE_URL=postgresql://postgres.xxxxxxxxxxxx:tu-password@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

## Paso 4: Verificar Configuración

```bash
# Reinicia el servidor de desarrollo
pnpm run dev
```

Si todo está bien configurado, la aplicación debería iniciar sin errores.

## 🔒 Seguridad

- ✅ `.env.local` está en `.gitignore` (no se sube a GitHub)
- ✅ `.env.local.example` SÍ se sube (sin valores reales)
- ❌ **NUNCA** compartas tus credenciales reales
- ❌ **NUNCA** subas `.env.local` a GitHub

## ⚠️ Errores Comunes

### Error: "Invalid URL"
- **Causa**: `DATABASE_URL` no está configurada o tiene formato incorrecto
- **Solución**: Verifica que copiaste la URL completa desde Supabase

### Error: "password authentication failed"
- **Causa**: La contraseña en `DATABASE_URL` es incorrecta
- **Solución**: Reemplaza `[password]` con tu contraseña real

### Error: "connection refused"
- **Causa**: La URL del proyecto es incorrecta
- **Solución**: Verifica el `project-ref` en la URL

## 🚀 Siguiente Paso

Una vez configurado `.env.local`:

```bash
# Ejecutar migraciones
pnpm run drizzle:push

# Poblar base de datos con productos de ejemplo
pnpm run db:seed
```
