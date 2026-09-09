-- ══════════════════════════════════════════════════════════
--  YOSSICO — Limpiar policies abiertas en subscribers
--  Ejecutar en: Supabase → SQL Editor → New Query → Run
--
--  Problema: Security Advisor detecta "RLS Policy Always True"
--  en la tabla subscribers. Debe ser completamente privada
--  (solo la Edge Function con service_role puede leer/escribir).
-- ══════════════════════════════════════════════════════════

-- Eliminar cualquier policy pública que haya quedado abierta
DROP POLICY IF EXISTS "Permitir inserción a cualquier usuario" ON public.subscribers;
DROP POLICY IF EXISTS "Permitir inserción anónima" ON public.subscribers;
DROP POLICY IF EXISTS "anon puede leer subscribers" ON public.subscribers;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.subscribers;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.subscribers;
DROP POLICY IF EXISTS "Allow public insert" ON public.subscribers;
DROP POLICY IF EXISTS "Allow anonymous insert" ON public.subscribers;

-- Asegurar que RLS esté habilitado
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- Verificar que no quede ninguna policy (resultado debe ser vacío para anon)
-- SELECT policyname, cmd, roles FROM pg_policies WHERE tablename = 'subscribers';
