-- ══════════════════════════════════════════════════════════
-- YOSSICO — Migración: Motor de Descuentos (RPC)
-- Ejecutar en: Supabase → SQL Editor → New Query → Run
-- ══════════════════════════════════════════════════════════

-- Actualizar la función de validación de descuentos para que retorne el tipo y el valor
DROP FUNCTION IF EXISTS validar_descuento(text);

CREATE OR REPLACE FUNCTION validar_descuento(codigo text)
RETURNS TABLE (valido boolean, usado boolean, tipo text, valor numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    true AS valido, 
    s.used AS usado, 
    COALESCE(s.discount_type, 'porcentaje') AS tipo, 
    COALESCE(s.discount_val, 10) AS valor
  FROM subscribers s
  WHERE s.discount_code = codigo
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION validar_descuento(text) TO anon;
