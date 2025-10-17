// src/actions/auth.ts
// Propósito: Contiene las Server Actions para un ciclo de autenticación robusto.
'use server';

import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export async function login(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return redirect('/login?message=Error: Credenciales inválidas.');
  }

  return redirect('/');
}

export async function signup(formData: FormData) {
  const headersList = await headers();
  const origin = headersList.get('origin');
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    return redirect('/login?message=Error: No se pudo registrar el usuario.');
  }

  return redirect('/login?message=Revisa tu email para completar el registro.');
}

export async function logout() {
    const supabase = await createClient();
    await supabase.auth.signOut();
    return redirect('/login');
}

/**
 * Obtiene el usuario actual autenticado
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
