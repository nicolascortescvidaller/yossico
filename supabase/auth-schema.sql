-- ════════════════════════════════════════════════════════════
--  YOSSICO — user_profiles schema
--  Run in: Supabase → SQL Editor → New Query → Run
-- ════════════════════════════════════════════════════════════

create table if not exists user_profiles (
  user_id              uuid primary key references auth.users(id) on delete cascade,
  nombre_completo      text,
  apellido             text,
  direccion            text,
  ciudad               text,
  apartamento_numero   text,
  correo_electronico   text,
  historial_pedidos    jsonb    default '[]'::jsonb,
  descuentos_disponibles text[] default array[]::text[],
  created_at           timestamp default now(),
  updated_at           timestamp default now()
);

alter table user_profiles enable row level security;

create policy "Users can view own profile"
  on user_profiles for select
  using (auth.uid() = user_id);

create policy "Users can update own profile"
  on user_profiles for update
  using (auth.uid() = user_id);

create policy "Users can insert own profile"
  on user_profiles for insert
  with check (auth.uid() = user_id);
