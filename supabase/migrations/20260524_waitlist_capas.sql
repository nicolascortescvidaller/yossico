-- ═══════════════════════════════════════════════════════════════
-- YOSSICO — Lista de espera Capas
-- Tabla: waitlist_capas
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS waitlist_capas (
    id         BIGSERIAL PRIMARY KEY,
    nombre     TEXT        NOT NULL,
    telefono   TEXT        NOT NULL,
    correo     TEXT        NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique correo: evita duplicados silenciosos
ALTER TABLE waitlist_capas
    ADD CONSTRAINT waitlist_capas_correo_unique UNIQUE (correo);

-- Índice de búsqueda por correo
CREATE INDEX IF NOT EXISTS waitlist_capas_correo_idx ON waitlist_capas (correo);

-- Row Level Security
ALTER TABLE waitlist_capas ENABLE ROW LEVEL SECURITY;

-- Cualquier visitante anónimo puede insertar (formulario público)
CREATE POLICY "waitlist_capas_insert_public"
    ON waitlist_capas FOR INSERT
    WITH CHECK (true);

-- Solo el service_role (admin) puede leer
CREATE POLICY "waitlist_capas_select_admin"
    ON waitlist_capas FOR SELECT
    USING (auth.role() = 'service_role');
