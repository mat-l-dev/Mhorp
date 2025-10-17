// src/lib/supabase/client.ts
// Propósito: Crear un cliente de Supabase para el lado del cliente (navegador).

import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
