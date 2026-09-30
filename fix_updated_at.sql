ALTER TABLE productos ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
