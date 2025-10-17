# 📦 Instalación de Dependencias - Mhorp

## Dependencias Requeridas

Antes de poder usar la funcionalidad completa del proyecto, necesitas instalar las siguientes dependencias:

### 1. Base de Datos (Drizzle ORM + PostgreSQL)

```bash
pnpm add drizzle-orm postgres
pnpm add -D drizzle-kit
```

### 2. Autenticación y Storage (Supabase)

```bash
pnpm add @supabase/supabase-js @supabase/ssr
```

### 3. Comando Completo (Instalar Todo)

```bash
pnpm add drizzle-orm postgres @supabase/supabase-js @supabase/ssr
pnpm add -D drizzle-kit
```

## 🔧 Configuración Post-Instalación

### 1. Descomentar el Código en los Archivos de Lib

Una vez instaladas las dependencias, debes descomentar el código en los siguientes archivos:

- `src/lib/db/index.ts` - Cliente de Drizzle ORM
- `src/lib/supabase/client.ts` - Cliente de Supabase para el navegador
- `src/lib/supabase/server.ts` - Cliente de Supabase para el servidor

**Estos archivos tienen comentarios `TODO` que indican qué código descomentar.**

### 2. Configurar Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```env
# Base de Datos PostgreSQL
DATABASE_URL="postgresql://usuario:password@host:5432/nombre_db"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://tu-proyecto.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="tu-anon-key-aqui"
```

### 3. Configurar Drizzle

Crea un archivo `drizzle.config.ts` en la raíz del proyecto:

```typescript
import type { Config } from "drizzle-kit";

export default {
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  driver: "pg",
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
} satisfies Config;
```

### 4. Definir el Schema de la Base de Datos

Edita `src/lib/db/schema.ts` para definir tus tablas. Ejemplo básico:

```typescript
import { pgTable, text, serial, timestamp, integer, decimal } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  stock: integer("stock").default(0).notNull(),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Agregar más tablas según necesites...
```

### 5. Generar y Ejecutar Migraciones

```bash
# Generar migraciones
pnpm drizzle-kit generate:pg

# Aplicar migraciones (push a la DB)
pnpm drizzle-kit push:pg
```

## ✅ Verificación

Para verificar que todo está correctamente instalado:

1. **Verifica que no hay errores de TypeScript**: Los archivos deberían compilar sin errores una vez descomentado el código.

2. **Verifica la conexión a la base de datos**: Puedes probar con:
   ```typescript
   import { db } from '@/lib/db';
   // Hacer una query simple...
   ```

3. **Verifica la conexión a Supabase**: Revisa que las variables de entorno están correctamente configuradas.

## 📝 Notas Importantes

- **Estado Actual**: Los archivos en `src/lib/` tienen el código comentado temporalmente para evitar errores de TypeScript hasta que instales las dependencias.

- **No olvides**: Después de instalar las dependencias, debes descomentar el código en los archivos mencionados arriba.

- **Git**: Los archivos comentados están preparados para hacer commit. Una vez instales las dependencias y descomentes el código, haz otro commit con los cambios.

## 🚀 Próximos Pasos Después de Instalar

1. Instalar dependencias con el comando completo
2. Crear archivo `.env.local` con tus credenciales
3. Crear archivo `drizzle.config.ts`
4. Descomentar código en archivos de `src/lib/`
5. Definir schema completo en `src/lib/db/schema.ts`
6. Generar y aplicar migraciones
7. ¡Empezar a construir las funcionalidades!
