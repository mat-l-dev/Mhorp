// src/actions/auth.ts
// Propósito: Contiene las Server Actions para la autenticación de usuarios.

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
    // TODO: Manejar y mostrar el error en el formulario
    console.error('Error en el login:', error);
    return redirect('/login?message=Could not authenticate user');
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
    // TODO: Manejar y mostrar el error en el formulario
    console.error('Error en el signup:', error);
    return redirect('/login?message=Could not authenticate user');
  }

  // TODO: Mostrar un mensaje de "revisa tu email para confirmar"
  return redirect('/login?message=Check email to continue sign in process');
}

/**
 * Cierra la sesión del usuario actual
 */
export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

/**
 * Obtiene el usuario actual autenticado
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
