-- ============================================
-- MIGRACIÓN 009: Sistema de Referidos
-- ============================================
-- Fecha: Octubre 2025
-- Descripción: Implementa el programa de referidos completo
-- con códigos únicos, tracking y recompensas automáticas
-- ============================================

-- 1. Tabla principal de referidos
CREATE TABLE IF NOT EXISTS user_referrals (
  id SERIAL PRIMARY KEY,
  
  -- Usuario que refiere (el que invita)
  referrer_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Usuario referido (el nuevo que se registra)
  referred_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Código de referido usado
  referral_code TEXT NOT NULL,
  
  -- Estado del referido
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'rewarded'
  -- pending: usuario se registró pero no ha comprado
  -- completed: usuario hizo su primera compra
  -- rewarded: recompensas ya fueron entregadas
  
  -- Orden de la primera compra (cuando se completa)
  first_order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
  
  -- Valor de la primera compra
  first_order_amount DECIMAL(10, 2),
  
  -- Recompensas entregadas
  referrer_reward_points INTEGER DEFAULT 0,
  referred_reward_coupon TEXT, -- código del cupón dado al nuevo usuario
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP, -- cuando hizo la primera compra
  rewarded_at TIMESTAMP, -- cuando se dieron las recompensas
  
  -- Constraints
  CONSTRAINT unique_referred_user UNIQUE(referred_user_id),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'completed', 'rewarded'))
);

-- 2. Tabla de estadísticas de referidos por usuario
CREATE TABLE IF NOT EXISTS referral_stats (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  
  -- Código único de referido del usuario
  referral_code TEXT NOT NULL UNIQUE,
  
  -- Contadores
  total_referrals INTEGER DEFAULT 0, -- Total de personas que se registraron
  completed_referrals INTEGER DEFAULT 0, -- Cuántos hicieron su primera compra
  pending_referrals INTEGER DEFAULT 0, -- Cuántos están pendientes de comprar
  
  -- Recompensas ganadas
  total_points_earned INTEGER DEFAULT 0, -- Puntos ganados por referidos
  total_revenue_generated DECIMAL(10, 2) DEFAULT 0, -- Revenue generado por referidos
  
  -- Mejor streak
  best_month_referrals INTEGER DEFAULT 0, -- Mes con más referidos
  best_month_date DATE,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Índices para optimizar queries
CREATE INDEX idx_user_referrals_referrer ON user_referrals(referrer_user_id);
CREATE INDEX idx_user_referrals_referred ON user_referrals(referred_user_id);
CREATE INDEX idx_user_referrals_code ON user_referrals(referral_code);
CREATE INDEX idx_user_referrals_status ON user_referrals(status);
CREATE INDEX idx_user_referrals_created_at ON user_referrals(created_at DESC);
CREATE INDEX idx_referral_stats_code ON referral_stats(referral_code);

-- 4. Función para generar código único de referido
CREATE OR REPLACE FUNCTION generate_referral_code(user_id TEXT)
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists_code BOOLEAN;
BEGIN
  LOOP
    -- Generar código de 8 caracteres: primeras 4 del user_id + 4 random
    code := UPPER(
      SUBSTRING(user_id FROM 1 FOR 4) || 
      SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4)
    );
    
    -- Verificar que no existe
    SELECT EXISTS(SELECT 1 FROM referral_stats WHERE referral_code = code)
    INTO exists_code;
    
    EXIT WHEN NOT exists_code;
  END LOOP;
  
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- 5. Trigger para crear stats cuando se registra un usuario
CREATE OR REPLACE FUNCTION create_referral_stats_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO referral_stats (user_id, referral_code)
  VALUES (NEW.id, generate_referral_code(NEW.id))
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_referral_stats
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_referral_stats_for_user();

-- 6. Función para actualizar estadísticas cuando cambia un referido
CREATE OR REPLACE FUNCTION update_referral_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Incrementar total_referrals si es nuevo
  IF TG_OP = 'INSERT' THEN
    UPDATE referral_stats
    SET 
      total_referrals = total_referrals + 1,
      pending_referrals = pending_referrals + 1,
      updated_at = NOW()
    WHERE user_id = NEW.referrer_user_id;
  END IF;
  
  -- Actualizar cuando se completa
  IF TG_OP = 'UPDATE' AND OLD.status = 'pending' AND NEW.status = 'completed' THEN
    UPDATE referral_stats
    SET 
      completed_referrals = completed_referrals + 1,
      pending_referrals = pending_referrals - 1,
      updated_at = NOW()
    WHERE user_id = NEW.referrer_user_id;
  END IF;
  
  -- Actualizar cuando se dan recompensas
  IF TG_OP = 'UPDATE' AND OLD.status = 'completed' AND NEW.status = 'rewarded' THEN
    UPDATE referral_stats
    SET 
      total_points_earned = total_points_earned + NEW.referrer_reward_points,
      total_revenue_generated = total_revenue_generated + COALESCE(NEW.first_order_amount, 0),
      updated_at = NOW()
    WHERE user_id = NEW.referrer_user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_referral_stats
  AFTER INSERT OR UPDATE ON user_referrals
  FOR EACH ROW
  EXECUTE FUNCTION update_referral_stats();

-- 7. Vista para el dashboard de referidos
CREATE OR REPLACE VIEW referral_dashboard AS
SELECT 
  rs.user_id,
  rs.referral_code,
  rs.total_referrals,
  rs.completed_referrals,
  rs.pending_referrals,
  rs.total_points_earned,
  rs.total_revenue_generated,
  
  -- Referidos recientes (últimos 10)
  (
    SELECT json_agg(
      json_build_object(
        'id', ur.id,
        'referred_user_id', ur.referred_user_id,
        'status', ur.status,
        'created_at', ur.created_at,
        'completed_at', ur.completed_at,
        'first_order_amount', ur.first_order_amount
      )
      ORDER BY ur.created_at DESC
    )
    FROM (
      SELECT * FROM user_referrals 
      WHERE referrer_user_id = rs.user_id 
      ORDER BY created_at DESC 
      LIMIT 10
    ) ur
  ) as recent_referrals,
  
  -- Tasa de conversión
  CASE 
    WHEN rs.total_referrals > 0 
    THEN ROUND((rs.completed_referrals::DECIMAL / rs.total_referrals * 100), 2)
    ELSE 0
  END as conversion_rate,
  
  rs.created_at,
  rs.updated_at
FROM referral_stats rs;

-- 8. Función helper para obtener stats de un usuario
CREATE OR REPLACE FUNCTION get_user_referral_stats(p_user_id TEXT)
RETURNS TABLE(
  referral_code TEXT,
  total_referrals INTEGER,
  completed_referrals INTEGER,
  pending_referrals INTEGER,
  total_points_earned INTEGER,
  total_revenue_generated DECIMAL,
  conversion_rate DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rd.referral_code,
    rd.total_referrals,
    rd.completed_referrals,
    rd.pending_referrals,
    rd.total_points_earned,
    rd.total_revenue_generated,
    rd.conversion_rate
  FROM referral_dashboard rd
  WHERE rd.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- DATOS DE EJEMPLO (opcional, solo para testing)
-- ============================================
-- NOTA: Comentar o eliminar en producción

-- Ejemplo: Crear stats para usuarios existentes
-- INSERT INTO referral_stats (user_id, referral_code)
-- SELECT id, generate_referral_code(id)
-- FROM users
-- ON CONFLICT (user_id) DO NOTHING;

-- ============================================
-- VERIFICACIÓN
-- ============================================
-- Para verificar que todo se creó correctamente:
-- SELECT * FROM user_referrals LIMIT 5;
-- SELECT * FROM referral_stats LIMIT 5;
-- SELECT * FROM referral_dashboard LIMIT 5;
