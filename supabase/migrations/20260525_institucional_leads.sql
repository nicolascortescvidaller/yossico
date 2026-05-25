-- ═══════════════════════════════════════════════════════════════
-- YOSSICO — Institucional Leads
-- Tabla: institucional_leads
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS institucional_leads (
    id           BIGSERIAL PRIMARY KEY,
    nombre       TEXT        NOT NULL,
    institucion  TEXT        NOT NULL,
    ciudad       TEXT        NOT NULL,
    num_personas INTEGER     NOT NULL,
    correo       TEXT        NOT NULL,
    mensaje      TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice de búsqueda por correo
CREATE INDEX IF NOT EXISTS institucional_leads_correo_idx ON institucional_leads (correo);

-- Row Level Security
ALTER TABLE institucional_leads ENABLE ROW LEVEL SECURITY;

-- Cualquier visitante anónimo puede insertar (formulario público)
CREATE POLICY "institucional_leads_insert_public"
    ON institucional_leads FOR INSERT
    WITH CHECK (true);

-- Solo el service_role (admin) puede leer
CREATE POLICY "institucional_leads_select_admin"
    ON institucional_leads FOR SELECT
    USING (auth.role() = 'service_role');
