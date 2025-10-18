-- Migración: Crear tabla de historial de precios para notificaciones
-- Fecha: 2024-01-XX
-- Propósito: Rastrear cambios de precio y detectar bajadas para notificar usuarios

-- Crear tabla price_history
CREATE TABLE IF NOT EXISTS price_history (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Crear índices para mejor performance
CREATE INDEX idx_price_history_product_id ON price_history(product_id);
CREATE INDEX idx_price_history_created_at ON price_history(created_at DESC);

-- Insertar precios actuales como punto de partida
INSERT INTO price_history (product_id, price, created_at)
SELECT id, price, created_at FROM products
ON CONFLICT DO NOTHING;

COMMENT ON TABLE price_history IS 'Historial de cambios de precio de productos';
COMMENT ON COLUMN price_history.product_id IS 'ID del producto';
COMMENT ON COLUMN price_history.price IS 'Precio registrado en ese momento';
COMMENT ON COLUMN price_history.created_at IS 'Fecha de registro del precio';
