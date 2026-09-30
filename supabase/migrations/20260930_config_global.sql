CREATE TABLE IF NOT EXISTS config_yossico (
  clave text PRIMARY KEY,
  valor jsonb,
  updated_at timestamptz DEFAULT now()
);

-- Insertar configuración inicial del Drop
INSERT INTO config_yossico (clave, valor) 
VALUES ('drop_activo', '{"activo": false}'::jsonb)
ON CONFLICT (clave) DO NOTHING;

-- RPC para leer config (público, solo lectura)
CREATE OR REPLACE FUNCTION get_config(p_clave text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (SELECT valor FROM config_yossico WHERE clave = p_clave);
END;
$$;
GRANT EXECUTE ON FUNCTION get_config(text) TO anon;

-- RPC para actualizar config (solo admin con PIN)
CREATE OR REPLACE FUNCTION set_config(p_clave text, p_valor jsonb, pin text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF pin != 'yossico2025' THEN RAISE EXCEPTION 'Acceso denegado'; END IF;
  INSERT INTO config_yossico (clave, valor, updated_at)
  VALUES (p_clave, p_valor, now())
  ON CONFLICT (clave) DO UPDATE SET valor = p_valor, updated_at = now();
END;
$$;
GRANT EXECUTE ON FUNCTION set_config(text, jsonb, text) TO anon;
