-- ══════════════════════════════════════════════════════════
--  YOSSICO — Subscribers schema
--  Run this in: Supabase → SQL Editor → New Query → Run
-- ══════════════════════════════════════════════════════════

-- 1. Create table
CREATE TABLE IF NOT EXISTS subscribers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  email         TEXT NOT NULL,
  phone         TEXT NOT NULL,
  discount_code TEXT NOT NULL,
  used          BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 2. Unique constraints
ALTER TABLE subscribers
  ADD CONSTRAINT subscribers_email_unique UNIQUE (email),
  ADD CONSTRAINT subscribers_discount_code_unique UNIQUE (discount_code);

-- 3. Index for fast lookups by email
CREATE INDEX IF NOT EXISTS subscribers_email_idx ON subscribers (email);

-- 4. Row Level Security — the Edge Function uses service_role so it bypasses RLS.
--    Public reads/writes are blocked by default.
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;

-- No public policies — only service_role (Edge Function) can read/write.
-- This means the anon key (exposed in frontend) has zero access to this table.
