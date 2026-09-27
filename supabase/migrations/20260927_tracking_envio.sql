-- ─────────────────────────────────────────────────────────────────────────────
-- Migración: Guía de envío en pedidos
-- Fecha: 2026-09-27
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Agregar columnas a la tabla pedidos
ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS numero_guia  TEXT,
  ADD COLUMN IF NOT EXISTS empresa_envio TEXT;

-- 2. Función RPC protegida por PIN para actualizar la guía de envío
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
    SET numero_guia  = p_guia,
        empresa_envio = p_empresa
  WHERE id = p_id;
END;
$$;

-- 3. Permitir ejecución anónima (el panel llama con anon key)
GRANT EXECUTE ON FUNCTION admin_actualizar_envio(uuid, text, text, text) TO anon;
