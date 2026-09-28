-- ══════════════════════════════════════════════════════════
-- YOSSICO — MÓDULO DE PAUTA Y MARKETING
-- Ejecutar en: Supabase → SQL Editor → New Query → Run
-- ══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS gastos_pauta (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  plataforma text,
  objetivo text,
  campana text,
  monto numeric,
  fecha date DEFAULT CURRENT_DATE,
  estrategia_notas text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE gastos_pauta ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all_pauta" ON gastos_pauta FOR ALL USING (true);
GRANT ALL ON gastos_pauta TO anon;
