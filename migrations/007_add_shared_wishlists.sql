-- Migración: Crear tabla de wishlists compartibles
-- Fecha: 2024-01-XX
-- Propósito: Permitir a usuarios compartir sus wishlists con links públicos

-- Crear tabla shared_wishlists
CREATE TABLE IF NOT EXISTS shared_wishlists (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  name TEXT,
  description TEXT,
  is_public BOOLEAN DEFAULT TRUE NOT NULL,
  view_count INTEGER DEFAULT 0 NOT NULL,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Crear índices para mejor performance
CREATE INDEX idx_shared_wishlists_user_id ON shared_wishlists(user_id);
CREATE INDEX idx_shared_wishlists_token ON shared_wishlists(token);
CREATE INDEX idx_shared_wishlists_is_public ON shared_wishlists(is_public);
CREATE INDEX idx_shared_wishlists_expires_at ON shared_wishlists(expires_at);

-- Comentarios
COMMENT ON TABLE shared_wishlists IS 'Wishlists compartibles con links públicos';
COMMENT ON COLUMN shared_wishlists.token IS 'Token único para generar el link compartible';
COMMENT ON COLUMN shared_wishlists.name IS 'Nombre opcional de la wishlist (ej: Cumpleaños de Juan)';
COMMENT ON COLUMN shared_wishlists.is_public IS 'Si la wishlist es visible públicamente';
COMMENT ON COLUMN shared_wishlists.view_count IS 'Contador de veces que se ha visto el link';
COMMENT ON COLUMN shared_wishlists.expires_at IS 'Fecha opcional de expiración del link';
