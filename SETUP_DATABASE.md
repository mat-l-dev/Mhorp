# 🚀 Instrucciones para Configurar la Base de Datos

## Paso 1: Obtener Credenciales de Supabase

1. Ve a: https://supabase.com/dashboard
2. Selecciona tu proyecto (o crea uno nuevo)
3. Ve a **Project Settings** (icono de engranaje)

### Obtener URL y ANON KEY:
4. Click en **API** en el menú lateral
5. Copia:
   - **Project URL** → Esta es tu `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → Esta es tu `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Obtener DATABASE_URL:
6. Click en **Database** en el menú lateral
7. Busca la sección **Connection string**
8. Selecciona el tab **URI**
9. Copia la URL completa
10. **IMPORTANTE**: Reemplaza `[YOUR-PASSWORD]` con tu contraseña real de la base de datos

## Paso 2: Configurar .env.local

Abre el archivo `.env.local` y reemplaza los valores:

```env
NEXT_PUBLIC_SUPABASE_URL="https://tuproyecto.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="tu-anon-key-real-aqui"
DATABASE_URL="postgresql://postgres.tuproyecto:[TU-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
```

## Paso 3: Ejecutar Migraciones

Una vez configurado `.env.local`, ejecuta:

```bash
pnpm drizzle:push
```

Esto creará todas las tablas en tu base de datos de Supabase.

## Paso 4: Sembrar Datos de Ejemplo

```bash
pnpm db:seed
```

Esto agregará 3 productos de ejemplo a tu base de datos.

## Paso 5: Iniciar la Aplicación

```bash
pnpm dev
```

Visita: http://localhost:3000

---

## ⚠️ Nota Importante

**NO compartas tu `.env.local`** - Este archivo contiene credenciales secretas y ya está en `.gitignore`.

Si trabajas en equipo, cada miembro debe:
1. Copiar `.env.example`
2. Renombrarlo a `.env.local`
3. Configurar sus propias credenciales

---

## 🔍 Verificar que Todo Funciona

1. Ejecuta `pnpm drizzle:push` - Deberías ver: "✅ Success!"
2. Ve a Supabase > Table Editor - Deberías ver las tablas creadas
3. Ejecuta `pnpm db:seed` - Deberías ver: "✅ Sembrado completado!"
4. Ve a la tabla `products` en Supabase - Deberías ver 3 productos
5. Ejecuta `pnpm dev` - La app debería iniciar sin errores
6. Visita http://localhost:3000 - Deberías ver los productos en la página

---

¿Problemas? Verifica:
- ✅ `.env.local` tiene valores reales (no placeholders)
- ✅ La contraseña en DATABASE_URL es correcta
- ✅ No hay espacios extra en las URLs
- ✅ Las comillas están correctamente cerradas
