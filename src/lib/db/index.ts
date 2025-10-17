// src/lib/db/index.ts
// Propósito: Inicializar y exportar el cliente de Drizzle ORM.

// Cargar variables de entorno en scripts (tsx, drizzle-kit)
if (typeof window === 'undefined' && !process.env.NEXT_RUNTIME) {
  // Estamos en Node.js (script o drizzle-kit), no en Next.js runtime
  try {
    const dotenv = require('dotenv');
    dotenv.config({ path: '.env.local' });
  } catch (e) {
    // dotenv no disponible, probablemente en runtime de Next.js
  }
}

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const databaseUrl = process.env.DATABASE_URL;

// Validar que DATABASE_URL esté configurada correctamente
if (!databaseUrl) {
  throw new Error(
    '❌ DATABASE_URL no está configurada.\n\n' +
    '📝 Sigue estos pasos:\n' +
    '   1. Copia .env.local.example a .env.local\n' +
    '   2. Ve a Supabase Dashboard → Settings → Database\n' +
    '   3. Copia la Connection String (con Supavisor)\n' +
    '   4. Pégala en DATABASE_URL dentro de .env.local\n' +
    '   5. Reemplaza [password] con tu contraseña real\n' +
    '   6. Reinicia: Ctrl+C y luego pnpm run dev\n\n' +
    '📖 Guía completa: CONFIGURACION_ENV.md'
  );
}

// Validar que no contenga placeholders
if (
  databaseUrl.includes('[') || 
  databaseUrl.includes('your_database_url_here') ||
  databaseUrl.includes('[TU-PASSWORD]') ||
  databaseUrl.includes('[TU-PROYECTO]')
) {
  throw new Error(
    '❌ DATABASE_URL contiene placeholders.\n\n' +
    '⚠️  Tu DATABASE_URL actual tiene valores de ejemplo:\n' +
    `   "${databaseUrl}"\n\n` +
    '✅ Necesitas:\n' +
    '   1. Ir a Supabase Dashboard de tu proyecto\n' +
    '   2. Settings → Database → Connection string\n' +
    '   3. Copiar la URL REAL (no el ejemplo)\n' +
    '   4. Pegar en .env.local\n' +
    '   5. Asegurar que tenga tu contraseña real\n\n' +
    '📖 Ver guía completa: CONFIGURACION_ENV.md'
  );
}

// Validar formato básico de PostgreSQL URL
if (!databaseUrl.startsWith('postgres://') && !databaseUrl.startsWith('postgresql://')) {
  throw new Error(
    '❌ DATABASE_URL tiene formato inválido.\n\n' +
    '✅ Debe comenzar con: postgresql://\n' +
    `❌ Tu URL actual: ${databaseUrl.substring(0, 20)}...\n\n` +
    '📖 Ver guía completa: CONFIGURACION_ENV.md'
  );
}

const client = postgres(databaseUrl);
export const db = drizzle(client, { schema });
