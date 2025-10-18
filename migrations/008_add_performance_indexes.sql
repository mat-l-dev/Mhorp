-- ============================================
-- MIGRACIÓN 008: INDEXES PARA PERFORMANCE
-- ============================================
-- Fecha: 2025-10-17
-- Descripción: Agregar indexes críticos para optimizar queries frecuentes
--              y mejorar performance del sistema

-- ============================================
-- 1. INDEXES PARA PRODUCTOS
-- ============================================

-- Búsqueda y filtrado por categoría y stock
CREATE INDEX IF NOT EXISTS idx_products_category_id 
ON products(category_id) 
WHERE category_id IS NOT NULL;

-- Productos en stock (para filtros de disponibilidad)
CREATE INDEX IF NOT EXISTS idx_products_stock 
ON products(stock) 
WHERE stock > 0;

-- Búsqueda combinada categoría + stock
CREATE INDEX IF NOT EXISTS idx_products_category_stock 
ON products(category_id, stock) 
WHERE category_id IS NOT NULL AND stock > 0;

-- Productos activos ordenados por fecha de creación
CREATE INDEX IF NOT EXISTS idx_products_created_at 
ON products(created_at DESC);

-- ============================================
-- 2. INDEXES PARA ORDERS
-- ============================================

-- Queries por usuario (historial de órdenes)
CREATE INDEX IF NOT EXISTS idx_orders_user_id 
ON orders(user_id);

-- Filtrado por estado de orden
CREATE INDEX IF NOT EXISTS idx_orders_status 
ON orders(status);

-- Combinado: órdenes de usuario por estado
CREATE INDEX IF NOT EXISTS idx_orders_user_status 
ON orders(user_id, status);

-- Órdenes por fecha (para analytics y reportes)
CREATE INDEX IF NOT EXISTS idx_orders_created_at 
ON orders(created_at DESC);

-- Analytics: órdenes por fecha y estado (excluir canceladas)
CREATE INDEX IF NOT EXISTS idx_orders_created_status 
ON orders(created_at DESC, status) 
WHERE status != 'cancelled';

-- ============================================
-- 3. INDEXES PARA ORDER_ITEMS
-- ============================================

-- Queries de items por orden
CREATE INDEX IF NOT EXISTS idx_order_items_order_id 
ON order_items(order_id);

-- Top productos vendidos (group by product_id)
CREATE INDEX IF NOT EXISTS idx_order_items_product_id 
ON order_items(product_id);

-- Analytics: join orders + order_items
CREATE INDEX IF NOT EXISTS idx_order_items_order_product 
ON order_items(order_id, product_id);

-- ============================================
-- 4. INDEXES PARA REVIEWS
-- ============================================

-- Reviews por producto (mostrar en página de producto)
CREATE INDEX IF NOT EXISTS idx_reviews_product_id 
ON reviews(product_id);

-- Reviews por usuario
CREATE INDEX IF NOT EXISTS idx_reviews_user_id 
ON reviews(user_id);

-- Reviews por rating (top rated products)
CREATE INDEX IF NOT EXISTS idx_reviews_rating 
ON reviews(rating DESC);

-- Combinado: reviews de producto ordenadas por rating
CREATE INDEX IF NOT EXISTS idx_reviews_product_rating 
ON reviews(product_id, rating DESC);

-- Reviews recientes por fecha
CREATE INDEX IF NOT EXISTS idx_reviews_created_at 
ON reviews(created_at DESC);

-- Reviews verificadas (compradores reales)
CREATE INDEX IF NOT EXISTS idx_reviews_is_verified 
ON reviews(is_verified) 
WHERE is_verified = true;

-- ============================================
-- 5. INDEXES PARA WISHLIST_ITEMS
-- ============================================

-- Wishlist por usuario (mostrar wishlist del usuario)
CREATE INDEX IF NOT EXISTS idx_wishlist_items_user_id 
ON wishlist_items(user_id);

-- Productos más deseados (group by product_id)
CREATE INDEX IF NOT EXISTS idx_wishlist_items_product_id 
ON wishlist_items(product_id);

-- Combinado: usuario + producto (verificar si existe)
CREATE INDEX IF NOT EXISTS idx_wishlist_items_user_product 
ON wishlist_items(user_id, product_id);

-- ============================================
-- 6. INDEXES PARA CART_ITEMS
-- ============================================

-- Items del carrito por cart_id
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id 
ON cart_items(cart_id);

-- Verificar producto en carrito
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id 
ON cart_items(product_id);

-- Combinado: cart + producto (update quantity)
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_product 
ON cart_items(cart_id, product_id);

-- ============================================
-- 7. INDEXES PARA PRICE_HISTORY
-- ============================================

-- Historial de precios por producto
CREATE INDEX IF NOT EXISTS idx_price_history_product_id 
ON price_history(product_id);

-- Historial ordenado por fecha
CREATE INDEX IF NOT EXISTS idx_price_history_product_date 
ON price_history(product_id, changed_at DESC);

-- ============================================
-- 8. INDEXES PARA COUPONS
-- ============================================

-- Cupones activos (filtrar en checkout)
CREATE INDEX IF NOT EXISTS idx_coupons_is_active 
ON coupons(is_active) 
WHERE is_active = true;

-- Búsqueda por código (único, pero agregamos index)
CREATE INDEX IF NOT EXISTS idx_coupons_code 
ON coupons(code);

-- Cupones válidos (activos y no expirados)
CREATE INDEX IF NOT EXISTS idx_coupons_active_expires 
ON coupons(is_active, expires_at) 
WHERE is_active = true;

-- ============================================
-- 9. INDEXES PARA SHARED_WISHLISTS
-- ============================================

-- Búsqueda por token (acceso público)
CREATE INDEX IF NOT EXISTS idx_shared_wishlists_token 
ON shared_wishlists(token);

-- Wishlists de usuario
CREATE INDEX IF NOT EXISTS idx_shared_wishlists_user_id 
ON shared_wishlists(user_id);

-- Wishlists públicas no expiradas
CREATE INDEX IF NOT EXISTS idx_shared_wishlists_public 
ON shared_wishlists(is_public, expires_at) 
WHERE is_public = true;

-- ============================================
-- 10. FULL-TEXT SEARCH INDEXES (PostgreSQL)
-- ============================================

-- Habilitar extensión pg_trgm para búsqueda por similitud
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Index para búsqueda full-text en nombre de producto
CREATE INDEX IF NOT EXISTS idx_products_name_trgm 
ON products USING gin(name gin_trgm_ops);

-- Index para búsqueda full-text en descripción de producto
CREATE INDEX IF NOT EXISTS idx_products_description_trgm 
ON products USING gin(description gin_trgm_ops);

-- ============================================
-- 11. COMPOSITE INDEXES PARA ANALYTICS
-- ============================================

-- Revenue por categoría
CREATE INDEX IF NOT EXISTS idx_analytics_category_revenue 
ON order_items(product_id)
INCLUDE (quantity, price_at_purchase);

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Para verificar que los indexes se crearon correctamente, ejecuta:
-- SELECT schemaname, tablename, indexname 
-- FROM pg_indexes 
-- WHERE schemaname = 'public' 
-- ORDER BY tablename, indexname;

-- Para ver tamaño de indexes:
-- SELECT 
--   schemaname,
--   tablename,
--   indexname,
--   pg_size_pretty(pg_relation_size(indexrelid)) as index_size
-- FROM pg_stat_user_indexes 
-- WHERE schemaname = 'public'
-- ORDER BY pg_relation_size(indexrelid) DESC;

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================

-- 1. Los indexes mejoran SELECT pero pueden ralentizar INSERT/UPDATE/DELETE
-- 2. Mantén balance entre performance de lectura y escritura
-- 3. Monitorea uso de indexes con pg_stat_user_indexes
-- 4. Considera VACUUM ANALYZE después de crear indexes masivos
-- 5. Los indexes parciales (WHERE clause) son más eficientes

-- ============================================
-- FIN DE MIGRACIÓN
-- ============================================
