-- ══════════════════════════════════════════════════════════
-- YOSSICO — Migración: Motor de Descuentos
-- Ejecutar en: Supabase → SQL Editor → New Query → Run
-- ══════════════════════════════════════════════════════════

-- Agregamos las columnas a la tabla subscribers para reglas avanzadas de descuento
ALTER TABLE subscribers
  ADD COLUMN IF NOT EXISTS discount_type text DEFAULT 'porcentaje', -- 'porcentaje', 'monto', 'efectivo', 'envio'
  ADD COLUMN IF NOT EXISTS discount_val numeric DEFAULT 10;

-- Aseguramos que los códigos existentes funcionen como siempre
UPDATE subscribers SET discount_type = 'porcentaje' WHERE discount_type IS NULL;
