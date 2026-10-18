-- Leads capturados desde el widget de chat / concierge YOSSICO
CREATE TABLE IF NOT EXISTS chat_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  nombre text NOT NULL,
  contacto text NOT NULL,
  origen_pagina text,
  estado text DEFAULT 'nuevo',
  notas text
);

CREATE INDEX IF NOT EXISTS chat_leads_created_idx ON chat_leads (created_at DESC);

ALTER TABLE chat_leads ENABLE ROW LEVEL SECURITY;
-- Sin políticas públicas directas: todo acceso seguro vía RPCs SECURITY DEFINER.

-- RPC público para registrar lead desde el widget de chat
CREATE OR REPLACE FUNCTION guardar_chat_lead(
  p_nombre text,
  p_contacto text,
  p_origen text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF p_nombre IS NULL OR length(trim(p_nombre)) = 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'El nombre es requerido');
  END IF;

  IF p_contacto IS NULL OR length(trim(p_contacto)) = 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'El contacto es requerido');
  END IF;

  INSERT INTO chat_leads (nombre, contacto, origen_pagina, estado)
  VALUES (trim(p_nombre), trim(p_contacto), p_origen, 'nuevo')
  RETURNING id INTO v_id;

  RETURN jsonb_build_object('ok', true, 'id', v_id);
END;
$$;

GRANT EXECUTE ON FUNCTION guardar_chat_lead(text, text, text) TO anon;
GRANT EXECUTE ON FUNCTION guardar_chat_lead(text, text, text) TO authenticated;

-- RPC administrativo para ver leads desde el Panel Admin
CREATE OR REPLACE FUNCTION admin_get_chat_leads(pin text, dias int DEFAULT 60)
RETURNS TABLE (
  id uuid,
  created_at timestamptz,
  nombre text,
  contacto text,
  origen_pagina text,
  estado text,
  notas text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF pin != 'yossico2025' THEN
    RAISE EXCEPTION 'Acceso denegado';
  END IF;

  RETURN QUERY
  SELECT c.id, c.created_at, c.nombre, c.contacto, c.origen_pagina, c.estado, c.notas
  FROM chat_leads c
  WHERE c.created_at >= now() - make_interval(days => dias)
  ORDER BY c.created_at DESC
  LIMIT 1000;
END;
$$;

GRANT EXECUTE ON FUNCTION admin_get_chat_leads(text, int) TO anon;
GRANT EXECUTE ON FUNCTION admin_get_chat_leads(text, int) TO authenticated;
