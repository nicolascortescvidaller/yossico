-- ══════════════════════════════════════════════════════════
--  YOSSICO — RPC: marcar_descuento_usado
--  Ejecutar en: Supabase → SQL Editor → New Query → Run
--
--  Problema que resuelve:
--    La tabla subscribers tiene RLS sin policy de UPDATE para anon.
--    El checkout no puede marcar used=true directamente con el anon key.
--    Este RPC usa SECURITY DEFINER para bypassear RLS (igual que
--    decrementar_stock y validar_descuento).
-- ══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION marcar_descuento_usado(codigo text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE subscribers
  SET used = true
  WHERE discount_code = codigo;
END;
$$;

-- Permite que el frontend (anon key) llame a esta función
GRANT EXECUTE ON FUNCTION marcar_descuento_usado(text) TO anon;
