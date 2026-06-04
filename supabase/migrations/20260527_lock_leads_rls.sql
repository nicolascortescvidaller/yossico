-- Revoke public (anon) insert permissions from leads tables to force usage of Edge Functions
-- This prevents bots from bypassing Cloudflare Turnstile

-- 1. embajadoras_leads
DROP POLICY IF EXISTS "Permitir inserción a cualquier usuario" ON public.embajadoras_leads;
-- We leave only the policy for service_role and authenticated users to read/manage if needed

-- 2. institucional_leads
DROP POLICY IF EXISTS "Permitir inserción a cualquier usuario" ON public.institucional_leads;

-- 3. waitlist_capas
DROP POLICY IF EXISTS "Permitir inserción anónima" ON public.waitlist_capas;
DROP POLICY IF EXISTS "Permitir inserción a cualquier usuario" ON public.waitlist_capas;

-- Ensure RLS is still enabled for all of them
ALTER TABLE public.embajadoras_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institucional_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist_capas ENABLE ROW LEVEL SECURITY;

-- Subscribers table should also be protected if it had public insert (the edge function uses service role)
DROP POLICY IF EXISTS "Permitir inserción a cualquier usuario" ON public.subscribers;
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;
