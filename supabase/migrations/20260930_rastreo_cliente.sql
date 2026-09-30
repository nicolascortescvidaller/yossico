CREATE OR REPLACE FUNCTION rastrear_pedido(busqueda text)
RETURNS TABLE (
  id uuid,
  cliente_nombre text,
  cliente_telefono text,
  items jsonb,
  total numeric,
  estado text,
  historial_estados jsonb,
  numero_guia text,
  empresa_envio text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id, p.cliente_nombre, p.cliente_telefono,
    p.items::jsonb, p.total::numeric, p.estado,
    COALESCE(p.historial_estados, '[]'::jsonb),
    p.numero_guia, p.empresa_envio, p.created_at
  FROM pedidos p
  WHERE 
    p.cliente_telefono ILIKE '%' || busqueda || '%'
    OR p.id::text ILIKE busqueda || '%'
  ORDER BY p.created_at DESC
  LIMIT 5;
END;
$$;

GRANT EXECUTE ON FUNCTION rastrear_pedido(text) TO anon;
