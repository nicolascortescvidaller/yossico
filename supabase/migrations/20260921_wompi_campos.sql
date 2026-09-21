-- ══════════════════════════════════════════════════════════
--  YOSSICO — Columnas para integración Wompi
--  Ejecutar en: Supabase → SQL Editor → New Query → Run
-- ══════════════════════════════════════════════════════════

-- Añadir campos de Wompi a la tabla pedidos
ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS wompi_id         TEXT,           -- Transaction ID de Wompi
  ADD COLUMN IF NOT EXISTS wompi_referencia TEXT,           -- Referencia única enviada a Wompi
  ADD COLUMN IF NOT EXISTS wompi_estado     TEXT,           -- PENDING / APPROVED / DECLINED / VOIDED / ERROR
  ADD COLUMN IF NOT EXISTS wompi_metodo     TEXT,           -- CARD / NEQUI / PSE / BANCOLOMBIA_TRANSFER
  ADD COLUMN IF NOT EXISTS metodo_pago      TEXT DEFAULT 'whatsapp'; -- canal general

-- Índice para buscar pedidos por referencia Wompi (webhook la necesita rápido)
CREATE INDEX IF NOT EXISTS pedidos_wompi_referencia_idx ON pedidos (wompi_referencia);
CREATE INDEX IF NOT EXISTS pedidos_wompi_id_idx         ON pedidos (wompi_id);

-- RPC para que el webhook actualice el estado sin exponer service_role al cliente
-- (Solo lo llama la Edge Function wompi-webhook con service_role — no necesita GRANT anon)
CREATE OR REPLACE FUNCTION actualizar_pago_wompi(
  p_referencia TEXT,
  p_wompi_id   TEXT,
  p_estado     TEXT,
  p_metodo     TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE pedidos
  SET
    wompi_id     = p_wompi_id,
    wompi_estado = p_estado,
    wompi_metodo = p_metodo,
    metodo_pago  = p_metodo,
    estado       = CASE
                     WHEN p_estado = 'APPROVED' THEN 'Pagado'
                     WHEN p_estado = 'DECLINED' THEN 'Pago rechazado'
                     WHEN p_estado = 'VOIDED'   THEN 'Pago anulado'
                     ELSE estado
                   END
  WHERE wompi_referencia = p_referencia;
END;
$$;
-- Solo la Edge Function (service_role) la usa — no se necesita GRANT anon
