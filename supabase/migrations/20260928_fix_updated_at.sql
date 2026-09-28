-- Este script soluciona el error al cancelar pedidos
-- (Error: column "updated_at" of relation "productos" does not exist)
ALTER TABLE productos ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
