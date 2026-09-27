-- ══════════════════════════════════════════════════════════
-- YOSSICO — CRM Clientes y Notas Internas
-- Ejecutar en: Supabase → SQL Editor → New Query → Run
-- ══════════════════════════════════════════════════════════

-- 1. Columna de Notas Internas en Pedidos
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS nota_interna TEXT;

-- 2. Función para actualizar la nota interna
CREATE OR REPLACE FUNCTION admin_actualizar_nota(p_id uuid, p_nota text, pin text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF pin != 'yossico2025' THEN
    RAISE EXCEPTION 'Acceso denegado';
  END IF;
  UPDATE pedidos SET nota_interna = p_nota WHERE id = p_id;
END;
$$;
GRANT EXECUTE ON FUNCTION admin_actualizar_nota(uuid, text, text) TO anon;

-- 3. Función para obtener la vista de clientes (CRM)
CREATE OR REPLACE FUNCTION admin_get_clientes(pin text)
RETURNS TABLE (
  cliente_nombre text,
  cliente_telefono text,
  cliente_email text,
  total_pedidos bigint,
  total_gastado numeric,
  ultimo_pedido timestamptz,
  ciudades text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF pin != 'yossico2025' THEN
    RAISE EXCEPTION 'Acceso denegado';
  END IF;
  
  RETURN QUERY
  SELECT
    p.cliente_nombre,
    p.cliente_telefono,
    p.cliente_email,
    COUNT(*)::bigint AS total_pedidos,
    SUM(p.total)::numeric AS total_gastado,
    MAX(p.created_at) AS ultimo_pedido,
    string_agg(DISTINCT p.cliente_ciudad, ', ') AS ciudades
  FROM pedidos p
  WHERE p.estado NOT IN ('cancelado', 'Cancelado')
  GROUP BY p.cliente_nombre, p.cliente_telefono, p.cliente_email
  ORDER BY total_gastado DESC;
END;
$$;
GRANT EXECUTE ON FUNCTION admin_get_clientes(text) TO anon;
