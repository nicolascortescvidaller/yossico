-- ══════════════════════════════════════════════════════════
-- YOSSICO — ÉPICA: 5 Funcionalidades Avanzadas
-- ══════════════════════════════════════════════════════════

-- 1. TABLA: Órdenes de Producción (Fábrica)
CREATE TABLE IF NOT EXISTS ordenes_produccion (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  modelo text NOT NULL,
  color text NOT NULL,
  talla text NOT NULL,
  cantidad integer NOT NULL,
  costo_estimado numeric,
  fecha_esperada date,
  estado text DEFAULT 'en_confeccion', -- en_confeccion, entregado, cancelado
  created_at timestamptz DEFAULT now()
);

-- 2. TABLA: Cotizaciones B2B
CREATE TABLE IF NOT EXISTS cotizaciones_b2b (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  serial SERIAL,
  cliente_nombre text,
  nit text,
  email text,
  telefono text,
  items jsonb,
  subtotal numeric,
  descuento numeric,
  total numeric,
  estado text DEFAULT 'Borrador', -- Borrador, Enviada, Aprobada, Rechazada
  created_at timestamptz DEFAULT now()
);

-- 3. TABLA: Cambios y Devoluciones (RMA)
CREATE TABLE IF NOT EXISTS cambios_devoluciones (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_id uuid REFERENCES pedidos(id) ON DELETE CASCADE,
  item_devuelto jsonb, -- {nombre, talla, color, qty}
  item_nuevo jsonb, -- {nombre, talla, color, qty}
  motivo text,
  estado text DEFAULT 'Pendiente', -- Pendiente, Recibido, Despachado
  created_at timestamptz DEFAULT now()
);

-- Seguridad
ALTER TABLE ordenes_produccion ENABLE ROW LEVEL SECURITY;
ALTER TABLE cotizaciones_b2b ENABLE ROW LEVEL SECURITY;
ALTER TABLE cambios_devoluciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_produccion" ON ordenes_produccion FOR ALL USING (true);
CREATE POLICY "admin_all_cotizaciones" ON cotizaciones_b2b FOR ALL USING (true);
CREATE POLICY "admin_all_cambios" ON cambios_devoluciones FOR ALL USING (true);

GRANT ALL ON ordenes_produccion TO anon;
GRANT ALL ON cotizaciones_b2b TO anon;
GRANT ALL ON cambios_devoluciones TO anon;

-- RPC: Convertir Cotización a Pedido
CREATE OR REPLACE FUNCTION admin_convertir_cotizacion_a_pedido(p_cotizacion_id uuid, pin text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  cot record;
BEGIN
  IF pin != 'yossico2025' THEN RAISE EXCEPTION 'Acceso denegado'; END IF;
  
  SELECT * INTO cot FROM cotizaciones_b2b WHERE id = p_cotizacion_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Cotización no encontrada'; END IF;

  INSERT INTO pedidos (
    cliente_nombre, cliente_telefono, cliente_email, 
    items, total, estado, metodo_pago, nota_interna
  ) VALUES (
    cot.cliente_nombre, cot.telefono, cot.email,
    cot.items, cot.total, 'Pagado', 'B2B', 'Generado desde cotización B2B #' || cot.serial
  );

  UPDATE cotizaciones_b2b SET estado = 'Aprobada' WHERE id = p_cotizacion_id;
END;
$$;
GRANT EXECUTE ON FUNCTION admin_convertir_cotizacion_a_pedido(uuid, text) TO anon;

-- RPC: Procesar Cambio de Talla (Stock automático)
CREATE OR REPLACE FUNCTION admin_procesar_cambio(
  p_pedido_id uuid, p_item_devuelto jsonb, p_item_nuevo jsonb, p_motivo text, pin text
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF pin != 'yossico2025' THEN RAISE EXCEPTION 'Acceso denegado'; END IF;
  
  -- Insertar en tabla de cambios
  INSERT INTO cambios_devoluciones (pedido_id, item_devuelto, item_nuevo, motivo)
  VALUES (p_pedido_id, p_item_devuelto, p_item_nuevo, p_motivo);
  
  -- Ajustar inventario (devuelve stock al item viejo)
  UPDATE productos SET stock = stock + (p_item_devuelto->>'qty')::int
  WHERE nombre = p_item_devuelto->>'nombre' AND talla = p_item_devuelto->>'talla';
  
  -- Resta stock al item nuevo
  UPDATE productos SET stock = stock - (p_item_nuevo->>'qty')::int
  WHERE nombre = p_item_nuevo->>'nombre' AND talla = p_item_nuevo->>'talla';
END;
$$;
GRANT EXECUTE ON FUNCTION admin_procesar_cambio(uuid, jsonb, jsonb, text, text) TO anon;
