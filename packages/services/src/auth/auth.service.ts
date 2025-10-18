// packages/services/src/auth/auth.service.ts
// Propósito: Servicio centralizado de autenticación

import type { SupabaseClient } from '@supabase/supabase-js';
import type { DrizzleClient } from '../common/types';
import { eq } from 'drizzle-orm';
import {
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  DatabaseError,
} from '../common/errors';
import type { AuthUser, DatabaseUser, AuthSession } from '../common/types';
import type { RateLimiter } from '../rate-limit';

export interface SignInCredentials {
  email: string;
  password: string;
}

export interface SignUpData {
  email: string;
  password: string;
  name?: string;
}

/**
 * Interfaz que debe cumplir la tabla users del schema
 * (evita dependencia directa del schema de Drizzle)
 */
export interface UsersTable {
  id: string;
  email: string;
  name: string | null;
  role: 'customer' | 'admin';
  createdAt: Date;
}

/**
 * Servicio de Autenticación
 * 
 * Centraliza toda la lógica relacionada con:
 * - Obtener usuario actual
 * - Verificar permisos (admin)
 * - Sign in / Sign up
 * - Sign out
 */
export class AuthService {
  constructor(
    private supabase: SupabaseClient,
    private db: DrizzleClient,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private usersTable: any, // Tabla users del schema Drizzle
    private rateLimiter?: RateLimiter // Rate limiter opcional para auth
  ) {}

  /**
   * Obtiene el usuario autenticado actual de Supabase Auth
   * @throws {UnauthorizedError} Si no hay usuario autenticado
   */
  async getCurrentUser(): Promise<AuthUser> {
    const { data: { user }, error } = await this.supabase.auth.getUser();

    if (error || !user) {
      throw new UnauthorizedError('No hay sesión activa');
    }

    return user;
  }

  /**
   * Obtiene el usuario autenticado actual sin lanzar error
   * @returns Usuario o null si no está autenticado
   */
  async getCurrentUserOrNull(): Promise<AuthUser | null> {
    try {
      return await this.getCurrentUser();
    } catch {
      return null;
    }
  }

  /**
   * Obtiene el usuario de la base de datos (tabla users)
   * @throws {UnauthorizedError} Si no hay usuario autenticado
   * @throws {NotFoundError} Si el usuario no existe en la DB
   */
  async getDatabaseUser(): Promise<DatabaseUser> {
    const authUser = await this.getCurrentUser();

    const result = await this.db
      .select()
      .from(this.usersTable)
      .where(eq(this.usersTable.id, authUser.id))
      .limit(1);

    const dbUser = result[0];

    if (!dbUser) {
      throw new NotFoundError('Usuario', authUser.id);
    }

    return {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role,
      createdAt: dbUser.createdAt,
    };
  }

  /**
   * Verifica si el usuario actual es administrador
   * @throws {UnauthorizedError} Si no hay usuario autenticado
   * @throws {ForbiddenError} Si el usuario no es admin
   */
  async requireAdmin(): Promise<DatabaseUser> {
    const dbUser = await this.getDatabaseUser();

    if (dbUser.role !== 'admin') {
      throw new ForbiddenError('Se requieren permisos de administrador');
    }

    return dbUser;
  }

  /**
   * Verifica si el usuario actual es admin (sin lanzar error)
   */
  async isAdmin(): Promise<boolean> {
    try {
      const dbUser = await this.getDatabaseUser();
      return dbUser.role === 'admin';
    } catch {
      return false;
    }
  }

  /**
   * Verifica si hay un usuario autenticado
   */
  async isAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentUserOrNull();
    return user !== null;
  }

  /**
   * Inicia sesión con email y contraseña
   */
  async signIn(credentials: SignInCredentials): Promise<{ user: AuthUser; session: AuthSession }> {
    // Rate limit por email
    if (this.rateLimiter) {
      const result = await this.rateLimiter.check(credentials.email);
      if (!result.allowed) {
        throw new UnauthorizedError(
          'Demasiados intentos de inicio de sesión. Por favor intenta más tarde.'
        );
      }
    }

    const { data, error } = await this.supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (error || !data.user || !data.session) {
      // Consumir rate limit (fallo)
      if (this.rateLimiter) {
        await this.rateLimiter.consume(credentials.email, false);
      }
      throw new UnauthorizedError('Credenciales inválidas');
    }

    // Consumir rate limit (éxito - será decrementado si skipSuccessfulRequests=true)
    if (this.rateLimiter) {
      await this.rateLimiter.consume(credentials.email, true);
    }

    return {
      user: data.user,
      session: data.session,
    };
  }

  /**
   * Registra un nuevo usuario
   */
  async signUp(data: SignUpData): Promise<{ user: AuthUser; session: AuthSession | null }> {
    // 1. Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await this.supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });

    if (authError || !authData.user) {
      throw new DatabaseError('Error al crear usuario: ' + authError?.message);
    }

    // 2. Crear registro en tabla users
    try {
      await this.db.insert(this.usersTable).values({
        id: authData.user.id,
        email: data.email,
        name: data.name || null,
        role: 'customer',
      });
    } catch {
      // Si falla la inserción, intentar eliminar el usuario de Auth
      await this.supabase.auth.admin.deleteUser(authData.user.id);
      throw new DatabaseError('Error al crear perfil de usuario');
    }

    return {
      user: authData.user,
      session: authData.session,
    };
  }

  /**
   * Cierra la sesión del usuario actual
   */
  async signOut(): Promise<void> {
    const { error } = await this.supabase.auth.signOut();

    if (error) {
      throw new DatabaseError('Error al cerrar sesión: ' + error.message);
    }
  }

  /**
   * Obtiene la sesión actual
   */
  async getSession(): Promise<AuthSession | null> {
    const { data: { session } } = await this.supabase.auth.getSession();
    return session;
  }

  /**
   * Verifica si el usuario tiene permisos sobre un recurso
   * @param userId ID del usuario dueño del recurso
   */
  async canAccessResource(userId: string): Promise<boolean> {
    const currentUser = await this.getCurrentUserOrNull();
    
    if (!currentUser) {
      return false;
    }

    // Admin puede acceder a todo
    if (await this.isAdmin()) {
      return true;
    }

    // Usuario solo puede acceder a sus propios recursos
    return currentUser.id === userId;
  }
}
