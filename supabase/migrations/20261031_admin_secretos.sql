-- ============================================================
-- Seguridad del panel admin: las claves dejan de estar escritas
-- en el código (HTML y funciones SQL) y pasan a guardarse cifradas
-- (bcrypt) en una tabla privada que la API pública no puede leer.
--
-- Qué hace:
--   1. Crea private.admin_secretos (clave → hash bcrypt).
--   2. Crea admin_verificar_pin(pin) y admin_verificar_finanzas(pin, clave).
--   3. Reescribe TODAS las funciones que comparaban contra el PIN
--      escrito a mano para que usen admin_verificar_pin(...).
--      Si alguna no se puede reescribir, se cancela todo (no queda
--      nada a medias).
--
-- El PIN actual sigue funcionando hasta que lo cambies (paso 2,
-- al final de este archivo). La clave de Finanzas queda vacía
-- hasta que la definas.
-- ============================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
REVOKE ALL ON SCHEMA private FROM anon, authenticated;

CREATE TABLE IF NOT EXISTS private.admin_secretos (
  clave      text PRIMARY KEY,
  hash       text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE private.admin_secretos ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.admin_secretos FROM PUBLIC;
REVOKE ALL ON private.admin_secretos FROM anon, authenticated;

-- Se conserva el PIN actual para no dejar el panel bloqueado.
-- Cámbialo con el paso 2 apenas apliques esta migración.
INSERT INTO private.admin_secretos (clave, hash)
VALUES ('admin_pin', extensions.crypt('yossico2025', extensions.gen_salt('bf')))
ON CONFLICT (clave) DO NOTHING;

-- Cambiar una clave: SELECT private.cambiar_secreto('admin_pin', '...');
CREATE OR REPLACE FUNCTION private.cambiar_secreto(p_clave text, p_valor text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF p_clave NOT IN ('admin_pin', 'finanzas') THEN
    RAISE EXCEPTION 'Clave desconocida: %', p_clave;
  END IF;
  IF length(coalesce(p_valor, '')) < 10 THEN
    RAISE EXCEPTION 'Usa al menos 10 caracteres';
  END IF;
  INSERT INTO private.admin_secretos (clave, hash, updated_at)
  VALUES (p_clave, extensions.crypt(p_valor, extensions.gen_salt('bf')), now())
  ON CONFLICT (clave) DO UPDATE SET hash = EXCLUDED.hash, updated_at = now();
END;
$$;
REVOKE ALL ON FUNCTION private.cambiar_secreto(text, text) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.admin_verificar_pin(pin text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT coalesce(admin_verificar_pin.pin, '') <> '' AND EXISTS (
    SELECT 1 FROM private.admin_secretos s
    WHERE s.clave = 'admin_pin'
      AND s.hash = extensions.crypt(admin_verificar_pin.pin, s.hash)
  );
$$;
REVOKE ALL ON FUNCTION public.admin_verificar_pin(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_verificar_pin(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_verificar_finanzas(pin text, clave text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT public.admin_verificar_pin(admin_verificar_finanzas.pin)
     AND coalesce(admin_verificar_finanzas.clave, '') <> ''
     AND EXISTS (
       SELECT 1 FROM private.admin_secretos s
       WHERE s.clave = 'finanzas'
         AND s.hash = extensions.crypt(admin_verificar_finanzas.clave, s.hash)
     );
$$;
REVOKE ALL ON FUNCTION public.admin_verificar_finanzas(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_verificar_finanzas(text, text) TO anon, authenticated;

-- Reescribe las funciones existentes que tenían el PIN escrito a mano.
-- Convierte  `x != 'PIN'` / `x <> 'PIN'`  →  `NOT public.admin_verificar_pin(x)`
-- y          `x = 'PIN'`                  →  `public.admin_verificar_pin(x)`
DO $$
DECLARE
  r     record;
  def   text;
  nuevo text;
  total int := 0;
BEGIN
  FOR r IN
    SELECT p.oid
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosrc LIKE '%yossico2025%'
  LOOP
    def := pg_get_functiondef(r.oid);
    nuevo := regexp_replace(def,
      '([A-Za-z_][A-Za-z0-9_.]*)\s*(!=|<>)\s*''yossico2025''',
      'NOT public.admin_verificar_pin(\1)', 'g');
    nuevo := regexp_replace(nuevo,
      '([A-Za-z_][A-Za-z0-9_.]*)\s*=\s*''yossico2025''',
      'public.admin_verificar_pin(\1)', 'g');
    IF nuevo LIKE '%yossico2025%' THEN
      RAISE EXCEPTION 'No se pudo migrar automáticamente %; revisa su comparación de PIN a mano',
        r.oid::regprocedure;
    END IF;
    EXECUTE nuevo;
    total := total + 1;
  END LOOP;
  RAISE NOTICE 'Funciones migradas: %', total;
END;
$$;

COMMIT;

-- ============================================================
-- PASO 2 (obligatorio): define tus claves nuevas.
-- Ejecútalo en el SQL Editor de Supabase reemplazando los textos.
-- NO guardes las claves reales en este archivo ni en el repo.
--
--   SELECT private.cambiar_secreto('admin_pin', 'TU-NUEVO-PIN-ADMIN');
--   SELECT private.cambiar_secreto('finanzas',  'TU-NUEVA-CLAVE-FINANZAS');
--
-- Comprobación (debe devolver true con el PIN nuevo y false con el viejo):
--   SELECT public.admin_verificar_pin('TU-NUEVO-PIN-ADMIN');
-- ============================================================
