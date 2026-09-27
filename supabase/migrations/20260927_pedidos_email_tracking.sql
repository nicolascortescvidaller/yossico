-- ══════════════════════════════════════════════════════════
--  YOSSICO — Email del cliente + tracking de envío en pedidos
--  Ejecutar en: Supabase → SQL Editor → New Query → Run
-- ══════════════════════════════════════════════════════════

ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS cliente_email  TEXT,
  ADD COLUMN IF NOT EXISTS numero_guia    TEXT,
  ADD COLUMN IF NOT EXISTS empresa_envio  TEXT;

-- RPC para actualizar guía de envío desde el panel admin (con PIN)
CREATE OR REPLACE FUNCTION admin_actualizar_envio(
  p_id      uuid,
  p_guia    text,
  p_empresa text,
  pin       text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF pin != 'yossico2025' THEN
    RAISE EXCEPTION 'Acceso denegado';
  END IF;
  UPDATE pedidos
  SET numero_guia   = p_guia,
      empresa_envio = p_empresa
  WHERE id = p_id;
END;
$$;

GRANT EXECUTE ON FUNCTION admin_actualizar_envio(uuid, text, text, text) TO anon;
