// src/lib/db/index.ts
// Propósito: Inicializar y exportar el cliente de Drizzle ORM.

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set in .env.local');
}

const client = postgres(process.env.DATABASE_URL);
export const db = drizzle(client, { schema });
