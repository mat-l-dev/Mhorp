// packages/services/src/__mocks__/supabase.mock.ts
// Propósito: Mock factory para Supabase client

import { vi } from 'vitest';
import type { SupabaseClient, User, Session } from '@supabase/supabase-js';

/**
 * Crea un mock completo del cliente Supabase
 */
export function createMockSupabase(): SupabaseClient {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: null },
        error: null,
      }),
      getSession: vi.fn().mockResolvedValue({
        data: { session: null },
        error: null,
      }),
      signInWithPassword: vi.fn().mockResolvedValue({
        data: { user: null, session: null },
        error: null,
      }),
      signUp: vi.fn().mockResolvedValue({
        data: { user: null, session: null },
        error: null,
      }),
      signOut: vi.fn().mockResolvedValue({
        error: null,
      }),
      updateUser: vi.fn().mockResolvedValue({
        data: { user: null },
        error: null,
      }),
      resetPasswordForEmail: vi.fn().mockResolvedValue({
        data: {},
        error: null,
      }),
      verifyOtp: vi.fn().mockResolvedValue({
        data: { user: null, session: null },
        error: null,
      }),
      refreshSession: vi.fn().mockResolvedValue({
        data: { session: null, user: null },
        error: null,
      }),
    },
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({
          data: { path: 'test-path' },
          error: null,
        }),
        download: vi.fn().mockResolvedValue({
          data: new Blob(['test']),
          error: null,
        }),
        remove: vi.fn().mockResolvedValue({
          data: {},
          error: null,
        }),
        list: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: 'https://example.com/test.jpg' },
        }),
        createSignedUrl: vi.fn().mockResolvedValue({
          data: { signedUrl: 'https://example.com/signed/test.jpg' },
          error: null,
        }),
      }),
    },
  } as unknown as SupabaseClient;
}

/**
 * Helper para mockear usuario autenticado
 */
export function mockAuthenticatedUser(supabase: SupabaseClient, user: Partial<User>) {
  const mockUser: User = {
    id: user.id || 'test-user-id',
    email: user.email || 'test@example.com',
    app_metadata: user.app_metadata || {},
    user_metadata: user.user_metadata || {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
    ...user,
  } as User;

  vi.mocked(supabase.auth.getUser).mockResolvedValue({
    data: { user: mockUser },
    error: null,
  });

  return mockUser;
}

/**
 * Helper para mockear sesión activa
 */
export function mockActiveSession(supabase: SupabaseClient, session: Partial<Session>) {
  const mockSession: Session = {
    access_token: session.access_token || 'mock-access-token',
    refresh_token: session.refresh_token || 'mock-refresh-token',
    expires_in: session.expires_in || 3600,
    expires_at: session.expires_at || Date.now() / 1000 + 3600,
    token_type: 'bearer',
    user: session.user as User || {
      id: 'test-user-id',
      email: 'test@example.com',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    } as User,
  };

  vi.mocked(supabase.auth.getSession).mockResolvedValue({
    data: { session: mockSession },
    error: null,
  });

  return mockSession;
}

/**
 * Helper para mockear upload exitoso
 */
export function mockStorageUpload(supabase: SupabaseClient, path: string, publicUrl?: string) {
  const storage = supabase.storage.from('test-bucket');
  
  vi.mocked(storage.upload).mockResolvedValue({
    data: { path },
    error: null,
  } as any);

  if (publicUrl) {
    vi.mocked(storage.getPublicUrl).mockReturnValue({
      data: { publicUrl },
    } as any);
  }
}

/**
 * Helper para mockear error de Supabase
 */
export function mockSupabaseError(method: any, message: string, code?: string) {
  vi.mocked(method).mockResolvedValue({
    data: null,
    error: {
      message,
      code: code || 'mock_error',
      details: null,
      hint: null,
    },
  });
}
