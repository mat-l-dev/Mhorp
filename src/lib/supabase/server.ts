// src/lib/supabase/server.ts
// Propósito: Crear un cliente de Supabase para el lado del servidor.

// TODO: Instalar dependencias: pnpm add @supabase/supabase-js @supabase/ssr
// TODO: Descomentar el código siguiente una vez instaladas las dependencias

/*
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // El método `setAll` fue llamado desde un Server Component.
            // Esto puede ser ignorado si tienes middleware refrescando sesiones de usuario.
          }
        },
      },
    }
  );
}
*/

// Exportación temporal hasta instalar las dependencias
export async function createClient() {
  return {} as any;
}
