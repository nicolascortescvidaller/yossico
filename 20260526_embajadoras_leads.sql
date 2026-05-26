-- Crear tabla para postulaciones de Embajadoras YOSSICO
create table public.embajadoras_leads (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    nombre text not null,
    especialidad text not null,
    ciudad text not null,
    instagram text,
    correo text not null,
    mensaje text not null,
    estado text default 'nueva'::text
);

-- Habilitar RLS
alter table public.embajadoras_leads enable row level security;

-- Política de inserción pública (cualquiera puede enviar postulación)
create policy "Permitir inserción pública en embajadoras_leads" on public.embajadoras_leads
    for insert
    with check (true);

-- Política de lectura solo para administradores (asumiendo que el dashboard o cliente tiene sus propias reglas, pero por defecto no dejar que anónimos lean)
create policy "Solo lectura para auth users en embajadoras_leads" on public.embajadoras_leads
    for select
    using (auth.role() = 'authenticated');
