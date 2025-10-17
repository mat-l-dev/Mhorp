// src/actions/auth.ts
// Propósito: Server Actions para manejar la autenticación de usuarios.
// Incluye login, signup, logout y gestión de sesiones.

'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

/**
 * Inicia sesión de un usuario existente
 */
export async function login(formData: FormData) {
  const supabase = createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  redirect('/');
}

/**
 * Registra un nuevo usuario
 */
export async function signup(formData: FormData) {
  const supabase = createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const name = formData.get('name') as string;

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  redirect('/');
}

/**
 * Cierra la sesión del usuario actual
 */
export async function logout() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

/**
 * Obtiene el usuario actual autenticado
 */
export async function getCurrentUser() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
