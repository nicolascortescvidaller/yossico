-- Columna para historial de estados con timestamps
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS historial_estados JSONB DEFAULT '[]'::jsonb;

-- RPC para actualizar estado Y appendear al historial
CREATE OR REPLACE FUNCTION admin_actualizar_pedido_v2(
  p_id uuid,
  p_nuevo_estado text,
  pin text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  nuevo_log jsonb;
BEGIN
  IF pin != 'yossico2025' THEN RAISE EXCEPTION 'Acceso denegado'; END IF;
  
  nuevo_log := json_build_object(
    'estado', p_nuevo_estado,
    'ts', now()::text
  );
  
  UPDATE pedidos 
  SET 
    estado = p_nuevo_estado,
    historial_estados = COALESCE(historial_estados, '[]'::jsonb) || nuevo_log
  WHERE id = p_id;
END;
$$;

GRANT EXECUTE ON FUNCTION admin_actualizar_pedido_v2(uuid, text, text) TO anon;
