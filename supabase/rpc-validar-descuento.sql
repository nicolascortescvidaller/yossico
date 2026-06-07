-- ══════════════════════════════════════════════════════════
--  YOSSICO — Validación de Descuento (Bypass RLS)
--  Ejecutar en: Supabase → SQL Editor → New Query → Run
-- ══════════════════════════════════════════════════════════

-- Esta función permite validar si un código existe y si fue usado, 
-- permitiendo que la tienda frontend (anon key) pueda hacerlo 
-- SIN tener que exponer toda la tabla subscribers al público.

CREATE OR REPLACE FUNCTION validar_descuento(codigo text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  registro record;
BEGIN
  -- Buscar el código exactamente como viene
  SELECT discount_code, used INTO registro
  FROM subscribers 
  WHERE discount_code = codigo;

  -- Si no existe
  IF NOT FOUND THEN
    RETURN json_build_object('valido', false);
  END IF;

  -- Si existe, retornamos si es válido y si ya se usó
  RETURN json_build_object(
    'valido', true,
    'usado', registro.used
  );
END;
$$;

-- Otorgar permiso de ejecución al frontend público (anon key)
GRANT EXECUTE ON FUNCTION validar_descuento(text) TO anon;
