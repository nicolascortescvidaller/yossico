DROP FUNCTION IF EXISTS validar_descuento(text);

CREATE OR REPLACE FUNCTION validar_descuento(codigo text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  registro record;
  d_tipo text := 'porcentaje';
  d_valor numeric := 10;
BEGIN
  SELECT name, used, saldo_restante INTO registro FROM subscribers WHERE discount_code = codigo;
  
  IF NOT FOUND THEN 
    RETURN json_build_object('valido', false); 
  END IF;
  
  IF registro.used THEN
    RETURN json_build_object('valido', true, 'usado', true);
  END IF;
  
  -- Si es Gift Card: usar saldo_restante real
  IF registro.name LIKE 'GIFTCARD|%' THEN
    d_tipo := 'monto';
    d_valor := COALESCE(registro.saldo_restante, split_part(registro.name, '|', 2)::numeric);
  END IF;

  RETURN json_build_object(
    'valido', true, 
    'usado', false, 
    'tipo', d_tipo, 
    'valor', d_valor
  );
END;
$$;

GRANT EXECUTE ON FUNCTION validar_descuento(text) TO anon;
