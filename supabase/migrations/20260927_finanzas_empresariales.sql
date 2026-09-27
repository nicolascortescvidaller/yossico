-- ══════════════════════════════════════════════════════════
-- YOSSICO — Migración: Gastos Operativos y Congelación de Costos
-- Ejecutar en: Supabase → SQL Editor → New Query → Run
-- ══════════════════════════════════════════════════════════

-- 1. Tabla de Gastos Operativos (Opex)
CREATE TABLE IF NOT EXISTS gastos_operativos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  fecha timestamptz DEFAULT now(),
  categoria text NOT NULL,
  monto numeric NOT NULL,
  descripcion text,
  created_at timestamptz DEFAULT now()
);

-- Permisos (Ajustar según necesidad, aquí permitimos a anon/admin gestionarlo)
ALTER TABLE gastos_operativos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo a todos" ON gastos_operativos FOR ALL USING (true);
GRANT ALL ON gastos_operativos TO anon;


-- 2. Trigger para CONGELAR los costos de producción al momento de la venta
-- Así, si la tela sube de precio en 6 meses, las ventas de hoy conservarán el costo actual.
CREATE OR REPLACE FUNCTION congelar_costos_pedido() 
RETURNS TRIGGER AS $$
DECLARE
  elem jsonb;
  nuevo_items jsonb := '[]'::jsonb;
  c_prod numeric;
BEGIN
  -- Si no hay items, lo dejamos igual
  IF NEW.items IS NULL OR jsonb_typeof(NEW.items) != 'array' THEN
    RETURN NEW;
  END IF;

  -- Iterar sobre cada prenda del carrito
  FOR elem IN SELECT * FROM jsonb_array_elements(NEW.items) LOOP
    -- Buscar el costo de producción actual en el inventario
    SELECT costo_produccion INTO c_prod 
    FROM productos 
    WHERE nombre = elem->>'name' 
    LIMIT 1;
    
    -- Inyectar el costo al item JSON
    elem := jsonb_set(elem, '{costo_unitario}', to_jsonb(COALESCE(c_prod, 0)));
    
    -- Reconstruir el array
    nuevo_items := nuevo_items || elem;
  END LOOP;
  
  NEW.items := nuevo_items;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_congelar_costos ON pedidos;
CREATE TRIGGER tr_congelar_costos
BEFORE INSERT ON pedidos
FOR EACH ROW EXECUTE FUNCTION congelar_costos_pedido();
