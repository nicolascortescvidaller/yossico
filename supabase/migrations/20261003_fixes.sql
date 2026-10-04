-- 1) v2: conserva historial Y devuelve/descuenta stock al cancelar/restaurar (case-insensitive)
CREATE OR REPLACE FUNCTION admin_actualizar_pedido_v2(p_id uuid, p_nuevo_estado text, pin text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_estado text; v_items jsonb; v_item jsonb; v_qty integer;
BEGIN
  IF pin != 'yossico2025' THEN RAISE EXCEPTION 'Acceso denegado'; END IF;
  SELECT estado, items INTO v_estado, v_items FROM pedidos WHERE id = p_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Pedido no encontrado'; END IF;

  IF lower(p_nuevo_estado) = 'cancelado' AND lower(coalesce(v_estado,'')) <> 'cancelado' THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(v_items) LOOP
      v_qty := COALESCE((v_item->>'qty')::int, 1);
      UPDATE productos SET stock = stock + v_qty, updated_at = NOW()
      WHERE nombre = v_item->>'nombre' AND color = v_item->>'color' AND talla = v_item->>'talla';
    END LOOP;
  ELSIF lower(coalesce(v_estado,'')) = 'cancelado' AND lower(p_nuevo_estado) <> 'cancelado' THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(v_items) LOOP
      v_qty := COALESCE((v_item->>'qty')::int, 1);
      UPDATE productos SET stock = GREATEST(stock - v_qty, 0), updated_at = NOW()
      WHERE nombre = v_item->>'nombre' AND color = v_item->>'color' AND talla = v_item->>'talla';
    END LOOP;
  END IF;

  UPDATE pedidos SET estado = p_nuevo_estado,
    historial_estados = COALESCE(historial_estados,'[]'::jsonb) ||
      jsonb_build_object('estado', p_nuevo_estado, 'ts', now()::text)
  WHERE id = p_id;
END; $$;
GRANT EXECUTE ON FUNCTION admin_actualizar_pedido_v2(uuid, text, text) TO anon;

-- 2) Códigos de Embajadora son reutilizables: no se "queman"
CREATE OR REPLACE FUNCTION marcar_descuento_usado(codigo text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE subscribers SET used = true
  WHERE discount_code = codigo AND name NOT LIKE 'EMBAJADORA|%';
END; $$;
GRANT EXECUTE ON FUNCTION marcar_descuento_usado(text) TO anon;

-- 3) Rastreo: evita filtrar pedidos ajenos con búsquedas cortas
CREATE OR REPLACE FUNCTION rastrear_pedido(busqueda text)
RETURNS TABLE (id uuid, cliente_nombre text, cliente_telefono text, items jsonb, total numeric,
  estado text, historial_estados jsonb, numero_guia text, empresa_envio text, created_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF length(regexp_replace(coalesce(busqueda,''), '\s', '', 'g')) < 7 THEN RETURN; END IF;
  RETURN QUERY
  SELECT p.id, p.cliente_nombre, p.cliente_telefono, p.items::jsonb, p.total::numeric, p.estado,
    COALESCE(p.historial_estados,'[]'::jsonb), p.numero_guia, p.empresa_envio, p.created_at
  FROM pedidos p
  WHERE regexp_replace(coalesce(p.cliente_telefono,''), '\D', '', 'g') LIKE '%' || regexp_replace(busqueda, '\D', '', 'g') || '%'
     OR p.id::text ILIKE busqueda || '%'
  ORDER BY p.created_at DESC LIMIT 5;
END; $$;
GRANT EXECUTE ON FUNCTION rastrear_pedido(text) TO anon;
