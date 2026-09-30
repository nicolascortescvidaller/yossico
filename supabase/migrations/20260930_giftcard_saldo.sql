ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS saldo_restante numeric DEFAULT NULL;

-- Actualizar los GiftCards existentes con el saldo_restante inicial
UPDATE subscribers
SET saldo_restante = split_part(name, '|', 2)::numeric
WHERE name LIKE 'GIFTCARD|%' AND saldo_restante IS NULL AND used = false;

-- Función para consumir saldo parcial de gift card
CREATE OR REPLACE FUNCTION usar_giftcard(codigo text, monto_a_descontar numeric)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  registro record;
  saldo_actual numeric;
  saldo_nuevo numeric;
BEGIN
  SELECT saldo_restante, used, name INTO registro
  FROM subscribers WHERE discount_code = codigo;
  
  IF NOT FOUND THEN
    RETURN json_build_object('ok', false, 'error', 'Código no encontrado');
  END IF;
  
  IF registro.used THEN
    RETURN json_build_object('ok', false, 'error', 'Gift Card ya agotada');
  END IF;
  
  saldo_actual := COALESCE(registro.saldo_restante, split_part(registro.name, '|', 2)::numeric);
  saldo_nuevo := saldo_actual - monto_a_descontar;
  
  IF saldo_nuevo <= 0 THEN
    -- Agotar la gift card
    UPDATE subscribers SET used = true, saldo_restante = 0 WHERE discount_code = codigo;
  ELSE
    -- Descontar saldo parcial, dejar activa
    UPDATE subscribers SET saldo_restante = saldo_nuevo WHERE discount_code = codigo;
  END IF;
  
  RETURN json_build_object('ok', true, 'saldo_usado', LEAST(saldo_actual, monto_a_descontar), 'saldo_restante', GREATEST(0, saldo_nuevo));
END;
$$;

GRANT EXECUTE ON FUNCTION usar_giftcard(text, numeric) TO anon;
