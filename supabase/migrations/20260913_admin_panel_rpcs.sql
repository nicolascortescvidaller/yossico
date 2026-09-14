-- ══════════════════════════════════════════════════════════
--  YOSSICO — RPCs para Panel de Administrador Seguro
--  Ejecutar en: Supabase → SQL Editor → New Query → Run
-- ══════════════════════════════════════════════════════════

-- 1. Leer Pedidos
CREATE OR REPLACE FUNCTION admin_get_pedidos(pin text)
RETURNS SETOF pedidos
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF pin != 'yossico2025' THEN
    RAISE EXCEPTION 'Acceso denegado: PIN incorrecto';
  END IF;
  
  RETURN QUERY 
  SELECT * FROM pedidos 
  ORDER BY created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION admin_get_pedidos(text) TO anon;

-- 2. Actualizar Estado de Pedido y Devolver Stock
CREATE OR REPLACE FUNCTION admin_actualizar_pedido(p_id uuid, p_nuevo_estado text, pin text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_estado_actual text;
  v_items jsonb;
  v_item jsonb;
  v_qty integer;
BEGIN
  IF pin != 'yossico2025' THEN
    RAISE EXCEPTION 'Acceso denegado: PIN incorrecto';
  END IF;

  SELECT estado, items INTO v_estado_actual, v_items
  FROM pedidos 
  WHERE id = p_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pedido no encontrado';
  END IF;

  -- Si pasa de pendiente/pagado a cancelado, devolver stock
  IF p_nuevo_estado = 'cancelado' AND v_estado_actual != 'cancelado' THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(v_items)
    LOOP
      v_qty := (v_item->>'qty')::integer;
      
      UPDATE productos
      SET stock = stock + v_qty, 
          updated_at = NOW()
      WHERE nombre = v_item->>'nombre'
        AND color = v_item->>'color'
        AND talla = v_item->>'talla';
    END LOOP;
  END IF;

  -- Si se restaura desde cancelado a otro estado, volvemos a restar el stock
  IF v_estado_actual = 'cancelado' AND p_nuevo_estado != 'cancelado' THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(v_items)
    LOOP
      v_qty := (v_item->>'qty')::integer;
      
      UPDATE productos
      SET stock = GREATEST(stock - v_qty, 0), 
          updated_at = NOW()
      WHERE nombre = v_item->>'nombre'
        AND color = v_item->>'color'
        AND talla = v_item->>'talla';
    END LOOP;
  END IF;

  UPDATE pedidos
  SET estado = p_nuevo_estado
  WHERE id = p_id;
END;
$$;

GRANT EXECUTE ON FUNCTION admin_actualizar_pedido(uuid, text, text) TO anon;
