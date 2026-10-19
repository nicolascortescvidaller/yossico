-- ══════════════════════════════════════════════════════════════════════════
-- YOSSICO — Migración de Cumplimiento Legal SIC & Habeas Data (Ley 1581 / Ley 1480)
-- Trazabilidad probatoria de consentimiento informado y responsabilidad demostrada (Accountability)
-- ══════════════════════════════════════════════════════════════════════════

-- 1. Tabla pedidos: Registro auditable de aceptación legal
ALTER TABLE pedidos 
  ADD COLUMN IF NOT EXISTS consentimiento_legal JSONB DEFAULT '{}'::jsonb;

-- 2. Tabla subscribers: Registro auditable de autorización para tratamiento de datos y mercadeo
ALTER TABLE subscribers
  ADD COLUMN IF NOT EXISTS acepto_terminos BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS acepto_politica_datos BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS consentimiento_ts TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS consentimiento_meta JSONB DEFAULT '{}'::jsonb;

-- 3. Tabla chat_leads: Registro de autorización para captación de leads en concierge
ALTER TABLE chat_leads
  ADD COLUMN IF NOT EXISTS acepto_politica_datos BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS consentimiento_ts TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS consentimiento_meta JSONB DEFAULT '{}'::jsonb;

-- 4. Actualizar RPC guardar_chat_lead para recibir metadatos probatorios de consentimiento
CREATE OR REPLACE FUNCTION guardar_chat_lead(
  p_nombre text,
  p_contacto text,
  p_origen text DEFAULT NULL,
  p_acepto_datos boolean DEFAULT true,
  p_consentimiento_meta jsonb DEFAULT '{}'::jsonb
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

  INSERT INTO chat_leads (
    nombre, contacto, origen_pagina, estado, acepto_politica_datos, consentimiento_ts, consentimiento_meta
  )
  VALUES (
    trim(p_nombre), trim(p_contacto), p_origen, 'nuevo', p_acepto_datos, now(), p_consentimiento_meta
  )
  RETURNING id INTO v_id;

  RETURN jsonb_build_object('ok', true, 'id', v_id);
END;
$$;

GRANT EXECUTE ON FUNCTION guardar_chat_lead(text, text, text, boolean, jsonb) TO anon;
GRANT EXECUTE ON FUNCTION guardar_chat_lead(text, text, text, boolean, jsonb) TO authenticated;
