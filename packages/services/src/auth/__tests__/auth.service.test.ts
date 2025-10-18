// packages/services/src/auth/__tests__/auth.service.test.ts
// Propósito: Unit tests para AuthService

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from '../auth.service';
import { createMockSupabase, mockAuthenticatedUser } from '../../__mocks__/supabase.mock';
import { createMockDb, mockFindFirst } from '../../__mocks__/db.mock';
import { UnauthorizedError, ForbiddenError, NotFoundError } from '../../common/errors';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { DrizzleClient } from '../../common/types';

describe('AuthService', () => {
  let authService: AuthService;
  let mockSupabase: SupabaseClient;
  let mockDb: DrizzleClient;
  let mockUsersTable: unknown;

  beforeEach(() => {
    mockSupabase = createMockSupabase();
    mockDb = createMockDb();
    mockUsersTable = {}; // Tabla mock
    authService = new AuthService(mockSupabase, mockDb, mockUsersTable);
  });

  describe('getCurrentUser', () => {
    it('should return authenticated user', async () => {
      const mockUser = mockAuthenticatedUser(mockSupabase, {
        id: 'user-123',
        email: 'test@example.com',
      });

      const result = await authService.getCurrentUser();

      expect(result).toEqual(mockUser);
      expect(mockSupabase.auth.getUser).toHaveBeenCalled();
    });

    it('should throw UnauthorizedError when no user is authenticated', async () => {
      vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as never);

      await expect(authService.getCurrentUser()).rejects.toThrow(UnauthorizedError);
      await expect(authService.getCurrentUser()).rejects.toThrow('No hay sesión activa');
    });

    it('should throw UnauthorizedError when auth error occurs', async () => {
      vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: { message: 'Auth error', name: 'AuthError', status: 401 } as never,
      } as never);

      await expect(authService.getCurrentUser()).rejects.toThrow(UnauthorizedError);
    });
  });

  describe('getCurrentUserOrNull', () => {
    it('should return user when authenticated', async () => {
      const mockUser = mockAuthenticatedUser(mockSupabase, {
        id: 'user-123',
        email: 'test@example.com',
      });

      const result = await authService.getCurrentUserOrNull();

      expect(result).toEqual(mockUser);
    });

    it('should return null when not authenticated', async () => {
      vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as never);

      const result = await authService.getCurrentUserOrNull();

      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      vi.mocked(mockSupabase.auth.getUser).mockRejectedValue(new Error('Network error'));

      const result = await authService.getCurrentUserOrNull();

      expect(result).toBeNull();
    });
  });

  describe('getDatabaseUser', () => {
    it('should return database user', async () => {
      mockAuthenticatedUser(mockSupabase, { id: 'user-123' });

      const mockDbUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
        createdAt: new Date(),
      };

      mockFindFirst(mockDb, 'users', mockDbUser);

      const result = await authService.getDatabaseUser();

      expect(result).toEqual({
        id: mockDbUser.id,
        email: mockDbUser.email,
        name: mockDbUser.name,
        role: mockDbUser.role,
        createdAt: mockDbUser.createdAt,
      });
    });

    it('should throw NotFoundError when user not in database', async () => {
      mockAuthenticatedUser(mockSupabase, { id: 'user-123' });
      mockFindFirst(mockDb, 'users', null);

      await expect(authService.getDatabaseUser()).rejects.toThrow(NotFoundError);
    });

    it('should throw UnauthorizedError when not authenticated', async () => {
      vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as never);

      await expect(authService.getDatabaseUser()).rejects.toThrow(UnauthorizedError);
    });
  });

  describe('requireAdmin', () => {
    it('should return user when user is admin', async () => {
      mockAuthenticatedUser(mockSupabase, { id: 'admin-123' });

      const mockDbUser = {
        id: 'admin-123',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'admin',
        createdAt: new Date(),
      };

      mockFindFirst(mockDb, 'users', mockDbUser);

      const result = await authService.requireAdmin();

      expect(result.role).toBe('admin');
    });

    it('should throw ForbiddenError when user is not admin', async () => {
      mockAuthenticatedUser(mockSupabase, { id: 'user-123' });

      const mockDbUser = {
        id: 'user-123',
        email: 'user@example.com',
        name: 'Regular User',
        role: 'user',
        createdAt: new Date(),
      };

      mockFindFirst(mockDb, 'users', mockDbUser);

      await expect(authService.requireAdmin()).rejects.toThrow(ForbiddenError);
      await expect(authService.requireAdmin()).rejects.toThrow(
        'Se requieren permisos de administrador'
      );
    });
  });

  describe('isAdmin', () => {
    it('should return true for admin user', async () => {
      mockAuthenticatedUser(mockSupabase, { id: 'admin-123' });

      const mockDbUser = {
        id: 'admin-123',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'admin',
        createdAt: new Date(),
      };

      mockFindFirst(mockDb, 'users', mockDbUser);

      const result = await authService.isAdmin();

      expect(result).toBe(true);
    });

    it('should return false for regular user', async () => {
      mockAuthenticatedUser(mockSupabase, { id: 'user-123' });

      const mockDbUser = {
        id: 'user-123',
        email: 'user@example.com',
        name: 'Regular User',
        role: 'user',
        createdAt: new Date(),
      };

      mockFindFirst(mockDb, 'users', mockDbUser);

      const result = await authService.isAdmin();

      expect(result).toBe(false);
    });

    it('should return false when not authenticated', async () => {
      vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as never);

      const result = await authService.isAdmin();

      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      vi.mocked(mockSupabase.auth.getUser).mockRejectedValue(new Error('Network error'));

      const result = await authService.isAdmin();

      expect(result).toBe(false);
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when user is authenticated', async () => {
      mockAuthenticatedUser(mockSupabase, { id: 'user-123' });

      const result = await authService.isAuthenticated();

      expect(result).toBe(true);
    });

    it('should return false when user is not authenticated', async () => {
      vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as never);

      const result = await authService.isAuthenticated();

      expect(result).toBe(false);
    });
  });

  describe('signIn', () => {
    it('should sign in user with valid credentials', async () => {
      const mockUser: User = {
        id: 'user-123',
        email: 'test@example.com',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      };

      const mockSession = {
        access_token: 'token-123',
        refresh_token: 'refresh-123',
        expires_in: 3600,
        expires_at: Date.now() / 1000 + 3600,
        token_type: 'bearer' as const,
        user: mockUser,
      };

      vi.mocked(mockSupabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      const result = await authService.signIn({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.user).toEqual(mockUser);
      expect(result.session).toEqual(mockSession);
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('should throw UnauthorizedError on invalid credentials', async () => {
      vi.mocked(mockSupabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid credentials', name: 'AuthError', status: 401 } as never,
      } as never);

      await expect(
        authService.signIn({
          email: 'test@example.com',
          password: 'wrong-password',
        })
      ).rejects.toThrow(UnauthorizedError);
    });
  });

  describe('signOut', () => {
    it('should sign out user successfully', async () => {
      vi.mocked(mockSupabase.auth.signOut).mockResolvedValue({
        error: null,
      });

      await expect(authService.signOut()).resolves.not.toThrow();

      expect(mockSupabase.auth.signOut).toHaveBeenCalled();
    });

    it('should throw error on sign out failure', async () => {
      vi.mocked(mockSupabase.auth.signOut).mockResolvedValue({
        error: { message: 'Sign out failed', name: 'AuthError', status: 500 } as never,
      } as never);

      await expect(authService.signOut()).rejects.toThrow('Sign out failed');
    });
  });

  describe('signUp', () => {
    it('should create new user account', async () => {
      const mockUser: User = {
        id: 'new-user-123',
        email: 'newuser@example.com',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      };

      vi.mocked(mockSupabase.auth.signUp).mockResolvedValue({
        data: { user: mockUser, session: null },
        error: null,
      });

      const result = await authService.signUp({
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
      });

      expect(result.user).toEqual(mockUser);
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        password: 'password123',
        options: {
          data: {
            name: 'New User',
          },
        },
      });
    });

    it('should throw error when email already exists', async () => {
      vi.mocked(mockSupabase.auth.signUp).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'User already exists', name: 'AuthError', status: 400 } as never,
      } as never);

      await expect(
        authService.signUp({
          email: 'existing@example.com',
          password: 'password123',
          name: 'Test User',
        })
      ).rejects.toThrow('User already exists');
    });
  });
});
