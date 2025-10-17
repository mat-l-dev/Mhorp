// src/lib/db/index.ts
// Propósito: Inicializar y exportar el cliente de la base de datos Drizzle.
// Este es el único lugar desde donde se debe importar la DB para asegurar una única instancia.

// TODO: Instalar dependencias: pnpm add drizzle-orm postgres
// TODO: Descomentar el código siguiente una vez instaladas las dependencias

/*
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Desactivar `prepare: false` solo si usas serverless.
const client = postgres(process.env.DATABASE_URL!, { prepare: false });
export const db = drizzle(client, { schema });
*/

// Exportación temporal hasta instalar las dependencias
export const db = {} as any;
