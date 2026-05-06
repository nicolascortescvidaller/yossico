-- ══════════════════════════════════════════════════════════
--  YOSSICO — Pedidos + Stock schema
--  Ejecutar en: Supabase → SQL Editor → New Query → Run
-- ══════════════════════════════════════════════════════════

-- ── 1. Tabla pedidos ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pedidos (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_nombre   TEXT NOT NULL,
  cliente_telefono TEXT,
  cliente_ciudad   TEXT NOT NULL,
  cliente_direccion TEXT NOT NULL,
  items            JSONB NOT NULL,          -- array de {name,size,color,qty,price}
  total            NUMERIC(12,2) NOT NULL,
  estado           TEXT NOT NULL DEFAULT 'pendiente',
  codigo_descuento TEXT,
  drop_numero      TEXT NOT NULL DEFAULT 'Drop 1',
  created_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- RLS: cualquier visitante puede crear un pedido, nadie puede leer/editar los ajenos
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon puede insertar pedidos"
  ON pedidos FOR INSERT TO anon WITH CHECK (true);
-- Sólo service_role (dashboard / funciones) puede SELECT/UPDATE/DELETE
-- (sin políticas adicionales para SELECT → anon no puede leer pedidos ajenos)

-- ── 2. Tabla productos (stock) ───────────────────────────────
CREATE TABLE IF NOT EXISTS productos (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre    TEXT NOT NULL,   -- ej. "OSLO"
  color     TEXT NOT NULL,   -- ej. "negro"
  talla     TEXT NOT NULL,   -- "S" | "M" | "L"
  stock     INTEGER NOT NULL DEFAULT 10,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (nombre, color, talla)
);

-- RLS: anon puede leer stock (para mostrar en UI), no puede modificarlo
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon puede leer stock"
  ON productos FOR SELECT TO anon USING (true);

-- ── 3. Función RPC para decremento atómico de stock ─────────
-- Llamada desde el frontend con SECURITY DEFINER para poder hacer UPDATE
-- sin exponer la clave service_role
CREATE OR REPLACE FUNCTION decrementar_stock(items JSONB)
RETURNS TABLE(nombre TEXT, color TEXT, talla TEXT, nuevo_stock INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item JSONB;
  qty  INTEGER;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(items)
  LOOP
    qty := (item->>'qty')::INTEGER;

    UPDATE productos p
    SET stock = GREATEST(stock - qty, 0),
        updated_at = NOW()
    WHERE p.nombre = item->>'nombre'
      AND p.color  = item->>'color'
      AND p.talla  = item->>'talla';
  END LOOP;

  RETURN QUERY
    SELECT p.nombre, p.color, p.talla, p.stock
    FROM productos p;
END;
$$;

-- Permite que anon key llame a esta función
GRANT EXECUTE ON FUNCTION decrementar_stock(JSONB) TO anon;

-- ── 4. Seed inicial de stock ─────────────────────────────────
-- 8 productos × 4-5 colores × 3 tallas = ~120 filas
-- Ajustar cantidades reales luego desde el dashboard de Supabase

DO $$
DECLARE
  productos_data TEXT[][] := ARRAY[
    ARRAY['OSLO',    'negro'],
    ARRAY['OSLO',    'azul-oscuro'],
    ARRAY['OSLO',    'gris'],
    ARRAY['OSLO',    'azul-claro'],
    ARRAY['MILAN',   'azul-oscuro'],
    ARRAY['MILAN',   'negro'],
    ARRAY['MILAN',   'gris'],
    ARRAY['MILAN',   'azul-claro'],
    ARRAY['KYOTO',   'negro'],
    ARRAY['KYOTO',   'gris'],
    ARRAY['KYOTO',   'azul-claro'],
    ARRAY['KYOTO',   'nativo'],
    ARRAY['RIO',     'negro'],
    ARRAY['RIO',     'azul-oscuro'],
    ARRAY['RIO',     'gris'],
    ARRAY['RIO',     'azul-claro'],
    ARRAY['LIMA',    'negro'],
    ARRAY['LIMA',    'azul-oscuro'],
    ARRAY['LIMA',    'gris'],
    ARRAY['BOGOTÁ',  'negro'],
    ARRAY['BOGOTÁ',  'azul-oscuro'],
    ARRAY['BOGOTÁ',  'gris'],
    ARRAY['MANTA',   'negro'],
    ARRAY['MANTA',   'azul-oscuro'],
    ARRAY['MANTA',   'gris'],
    ARRAY['HOODIE',  'negro'],
    ARRAY['HOODIE',  'gris']
  ];
  tallas TEXT[] := ARRAY['S', 'M', 'L'];
  prod TEXT[];
  talla TEXT;
BEGIN
  FOREACH prod SLICE 1 IN ARRAY productos_data
  LOOP
    FOREACH talla IN ARRAY tallas
    LOOP
      INSERT INTO productos (nombre, color, talla, stock)
      VALUES (prod[1], prod[2], talla, 10)
      ON CONFLICT (nombre, color, talla) DO NOTHING;
    END LOOP;
  END LOOP;
END;
$$;
