-- Migración: Agregar campo is_verified a tabla reviews
-- Fecha: 2024-01-XX
-- Propósito: Identificar reseñas de usuarios que compraron el producto

-- Agregar columna is_verified
ALTER TABLE reviews 
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE NOT NULL;

-- Actualizar reseñas existentes basado en compras
-- Marca como verificadas las reseñas de usuarios que compraron el producto
UPDATE reviews r
SET is_verified = TRUE
WHERE EXISTS (
  SELECT 1
  FROM order_items oi
  INNER JOIN orders o ON oi.order_id = o.id
  WHERE o.user_id = r.user_id
    AND oi.product_id = r.product_id
    AND o.status IN ('processing', 'shipped', 'delivered')
);

-- Crear índice para mejorar queries
CREATE INDEX IF NOT EXISTS idx_reviews_is_verified ON reviews(is_verified);

COMMENT ON COLUMN reviews.is_verified IS 'Indica si la reseña es de un usuario que compró el producto';
