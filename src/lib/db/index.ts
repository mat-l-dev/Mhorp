// src/lib/db/index.ts
// Propósito: Inicializar y exportar el cliente de Drizzle ORM.

// Cargar variables de entorno en scripts (tsx, drizzle-kit)
if (typeof window === 'undefined' && !process.env.NEXT_RUNTIME) {
  // Estamos en Node.js (script o drizzle-kit), no en Next.js runtime
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const dotenv = require('dotenv');
    dotenv.config({ path: '.env.local' });
  } catch {
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

// Configuración de connection pooling optimizado
const poolConfig = {
  // Connection Pool Settings
  max: parseInt(process.env.DB_POOL_MAX || '20'), // Máximo de conexiones en el pool
  idle_timeout: parseInt(process.env.DB_IDLE_TIMEOUT || '20'), // Segundos antes de cerrar conexión idle
  connect_timeout: parseInt(process.env.DB_CONNECT_TIMEOUT || '10'), // Timeout de conexión inicial
  
  // Performance Optimizations
  prepare: true, // Usar prepared statements (más rápido)
  
  // Connection Management
  connection: {
    application_name: 'mhor-ecommerce',
  },
};

const client = postgres(databaseUrl, poolConfig);
export const db = drizzle(client, { schema });

// Health check helper
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await client`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection check failed:', error);
    return false;
  }
}

// Graceful shutdown
export async function closeDatabaseConnection(): Promise<void> {
  try {
    await client.end();
    console.log('Database connection closed gracefully');
  } catch (error) {
    console.error('Error closing database connection:', error);
  }
}
