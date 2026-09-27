-- ══════════════════════════════════════════════════════════
-- YOSSICO — CORRECCIONES CRÍTICAS (Auditoría Sep 27, 2026)
-- Ejecutar en: Supabase → SQL Editor → New Query → Run
-- ══════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────────────────
-- FIX 1: Columnas Wompi en pedidos (migración 20260921 no ejecutada)
-- ──────────────────────────────────────────────────────────
ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS wompi_id          TEXT,
  ADD COLUMN IF NOT EXISTS wompi_referencia  TEXT,
  ADD COLUMN IF NOT EXISTS wompi_estado      TEXT,
  ADD COLUMN IF NOT EXISTS wompi_metodo      TEXT,
  ADD COLUMN IF NOT EXISTS metodo_pago       TEXT DEFAULT 'whatsapp';

CREATE INDEX IF NOT EXISTS pedidos_wompi_referencia_idx ON pedidos (wompi_referencia);
CREATE INDEX IF NOT EXISTS pedidos_wompi_id_idx         ON pedidos (wompi_id);

-- RPC para el webhook de Wompi (lo llama la Edge Function)
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
    wompi_id      = p_wompi_id,
    wompi_estado  = p_estado,
    wompi_metodo  = p_metodo,
    metodo_pago   = p_metodo,
    estado        = CASE
                      WHEN p_estado = 'APPROVED' THEN 'Pagado'
                      WHEN p_estado = 'DECLINED' THEN 'Pago rechazado'
                      WHEN p_estado = 'VOIDED'   THEN 'Pago anulado'
                      ELSE estado
                    END
  WHERE wompi_referencia = p_referencia;
END;
$$;


-- ──────────────────────────────────────────────────────────
-- FIX 2: Trigger congelar_costos usaba 'name' en vez de 'nombre'
-- (Bug crítico: el trigger nunca encontraba el costo porque los items
--  del carrito usan la clave 'nombre', no 'name')
-- ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION congelar_costos_pedido()
RETURNS TRIGGER AS $$
DECLARE
  elem        jsonb;
  nuevo_items jsonb := '[]'::jsonb;
  c_prod      numeric;
  p_precio    numeric;
BEGIN
  IF NEW.items IS NULL OR jsonb_typeof(NEW.items) != 'array' THEN
    RETURN NEW;
  END IF;

  FOR elem IN SELECT * FROM jsonb_array_elements(NEW.items) LOOP
    -- FIX: Los items usan 'nombre', no 'name'
    SELECT costo_produccion INTO c_prod
    FROM productos
    WHERE nombre = elem->>'nombre'
    LIMIT 1;

    -- Inyectar costo_unitario (congelado al momento de la venta)
    elem := jsonb_set(elem, '{costo_unitario}', to_jsonb(COALESCE(c_prod, 0)));

    -- También normalizar el campo de precio: el frontend usa 'precio' pero 
    -- el panel de finanzas busca 'price'. Copiar ambos para compatibilidad.
    IF elem ? 'precio' AND NOT elem ? 'price' THEN
      p_precio := (elem->>'precio')::numeric;
      elem := jsonb_set(elem, '{price}', to_jsonb(p_precio));
    END IF;

    nuevo_items := nuevo_items || elem;
  END LOOP;

  NEW.items := nuevo_items;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recrear el trigger (reemplaza el anterior si existía)
DROP TRIGGER IF EXISTS tr_congelar_costos ON pedidos;
CREATE TRIGGER tr_congelar_costos
  BEFORE INSERT ON pedidos
  FOR EACH ROW EXECUTE FUNCTION congelar_costos_pedido();


-- ──────────────────────────────────────────────────────────
-- FIX 3: Normalizar el campo 'price' en pedidos EXISTENTES
-- (Los pedidos ya guardados usan 'precio', el panel de finanzas
--  busca 'price'. Actualizar los existentes para coherencia.)
-- ──────────────────────────────────────────────────────────
UPDATE pedidos
SET items = (
  SELECT jsonb_agg(
    CASE
      WHEN elem ? 'precio' AND NOT elem ? 'price'
      THEN jsonb_set(elem, '{price}', elem->'precio')
      ELSE elem
    END
  )
  FROM jsonb_array_elements(items) AS elem
)
WHERE items IS NOT NULL
  AND jsonb_typeof(items) = 'array'
  AND items::text NOT LIKE '%"price"%';
