-- ══════════════════════════════════════════════════════════
-- YOSSICO — Migración: Costos e Imágenes de Productos
-- Ejecutar en: Supabase → SQL Editor → New Query → Run
-- ══════════════════════════════════════════════════════════

-- Agregamos las columnas para soportar el gestor de catálogo y rentabilidad
ALTER TABLE productos 
  ADD COLUMN IF NOT EXISTS costo_produccion numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS imagen_url text;

-- (Opcional) Si quieres probar con datos falsos iniciales para ver cómo lucen:
-- UPDATE productos SET costo_produccion = 45000 WHERE nombre ILIKE '%top%';
-- UPDATE productos SET costo_produccion = 60000 WHERE nombre ILIKE '%pantalon%';
