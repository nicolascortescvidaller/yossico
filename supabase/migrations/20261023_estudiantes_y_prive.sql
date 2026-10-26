-- ══════════════════════════════════════════════════════════════════════
-- YOSSICO — Migración: Programa Estudiantil y Club Privé
-- Ejecutar en: Supabase → SQL Editor → New Query → Run
-- ══════════════════════════════════════════════════════════════════════

-- 1. TABLA: solicitudes_estudiantes
CREATE TABLE IF NOT EXISTS solicitudes_estudiantes (
    id BIGSERIAL PRIMARY KEY,
    nombre TEXT NOT NULL,
    telefono TEXT NOT NULL,
    correo TEXT NOT NULL,
    universidad TEXT NOT NULL,
    carrera TEXT NOT NULL,
    semestre TEXT,
    ano_graduacion INTEGER NOT NULL,
    documento_url TEXT,
    estado TEXT NOT NULL DEFAULT 'pendiente', -- 'pendiente', 'aprobado', 'rechazado'
    codigo_descuento TEXT,
    motivo_rechazo TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    aprobado_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_solicitudes_estudiantes_correo ON solicitudes_estudiantes(correo);
CREATE INDEX IF NOT EXISTS idx_solicitudes_estudiantes_estado ON solicitudes_estudiantes(estado);

ALTER TABLE solicitudes_estudiantes ENABLE ROW LEVEL SECURITY;

-- Visitantes pueden insertar su solicitud públicamente
DROP POLICY IF EXISTS "solicitudes_estudiantes_insert_public" ON solicitudes_estudiantes;
CREATE POLICY "solicitudes_estudiantes_insert_public"
    ON solicitudes_estudiantes FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "solicitudes_estudiantes_select_admin" ON solicitudes_estudiantes;
CREATE POLICY "solicitudes_estudiantes_select_admin"
    ON solicitudes_estudiantes FOR SELECT
    USING (auth.role() = 'service_role');

-- 2. TABLA: solicitudes_prive
CREATE TABLE IF NOT EXISTS solicitudes_prive (
    id BIGSERIAL PRIMARY KEY,
    nombre TEXT NOT NULL,
    telefono TEXT NOT NULL,
    correo TEXT NOT NULL,
    ciudad TEXT,
    plan TEXT NOT NULL DEFAULT 'mensual', -- 'mensual' ($29.900) o 'anual' ($290.000)
    estado TEXT NOT NULL DEFAULT 'activa',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_solicitudes_prive_telefono ON solicitudes_prive(telefono);

ALTER TABLE solicitudes_prive ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "solicitudes_prive_insert_public" ON solicitudes_prive;
CREATE POLICY "solicitudes_prive_insert_public"
    ON solicitudes_prive FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "solicitudes_prive_select_admin" ON solicitudes_prive;
CREATE POLICY "solicitudes_prive_select_admin"
    ON solicitudes_prive FOR SELECT
    USING (auth.role() = 'service_role');

-- 3. RPC: registrar_solicitud_estudiante (público)
CREATE OR REPLACE FUNCTION registrar_solicitud_estudiante(
    p_nombre TEXT,
    p_telefono TEXT,
    p_correo TEXT,
    p_universidad TEXT,
    p_carrera TEXT,
    p_semestre TEXT,
    p_ano_graduacion INTEGER,
    p_documento_url TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_id BIGINT;
    v_es_edu BOOLEAN;
    v_ano_actual INTEGER;
BEGIN
    v_ano_actual := EXTRACT(YEAR FROM NOW())::integer;
    
    IF p_ano_graduacion < v_ano_actual THEN
        RETURN json_build_object('ok', false, 'error', 'El año de graduación debe ser igual o posterior al año actual.');
    END IF;

    v_es_edu := (p_correo ILIKE '%.edu.co' OR p_correo ILIKE '%.edu');

    INSERT INTO solicitudes_estudiantes (
        nombre, telefono, correo, universidad, carrera, semestre, ano_graduacion, documento_url, estado
    ) VALUES (
        p_nombre, p_telefono, p_correo, p_universidad, p_carrera, p_semestre, p_ano_graduacion, p_documento_url, 'pendiente'
    ) RETURNING id INTO v_id;

    RETURN json_build_object(
        'ok', true,
        'id', v_id,
        'es_edu', v_es_edu,
        'mensaje', 'Solicitud registrada correctamente.'
    );
END;
$$;
GRANT EXECUTE ON FUNCTION registrar_solicitud_estudiante(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, INTEGER, TEXT) TO anon;

-- 4. RPC: registrar_solicitud_prive (público)
CREATE OR REPLACE FUNCTION registrar_solicitud_prive(
    p_nombre TEXT,
    p_telefono TEXT,
    p_correo TEXT,
    p_ciudad TEXT DEFAULT NULL,
    p_plan TEXT DEFAULT 'mensual'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_id BIGINT;
    v_codigo TEXT;
BEGIN
    INSERT INTO solicitudes_prive (
        nombre, telefono, correo, ciudad, plan
    ) VALUES (
        p_nombre, p_telefono, p_correo, p_ciudad, p_plan
    ) RETURNING id INTO v_id;

    v_codigo := 'PRIVE-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT || NOW()::TEXT) FROM 1 FOR 4));

    -- Registrar en subscribers para que el código quede activo de inmediato
    INSERT INTO subscribers (name, email, phone, discount_code, discount_type, discount_val, used)
    VALUES (
        'PRIVE|' || p_plan || '|' || COALESCE(p_ciudad, 'Colombia'),
        p_correo,
        p_telefono,
        v_codigo,
        'porcentaje',
        15,
        false
    ) ON CONFLICT DO NOTHING;

    RETURN json_build_object('ok', true, 'id', v_id, 'codigo', v_codigo);
END;
$$;
GRANT EXECUTE ON FUNCTION registrar_solicitud_prive(TEXT, TEXT, TEXT, TEXT, TEXT) TO anon;

-- 5. RPC: admin_get_estudiantes (protegido por PIN)
CREATE OR REPLACE FUNCTION admin_get_estudiantes(pin TEXT)
RETURNS TABLE (
    id BIGINT,
    nombre TEXT,
    telefono TEXT,
    correo TEXT,
    universidad TEXT,
    carrera TEXT,
    semestre TEXT,
    ano_graduacion INTEGER,
    documento_url TEXT,
    estado TEXT,
    codigo_descuento TEXT,
    motivo_rechazo TEXT,
    created_at TIMESTAMPTZ,
    aprobado_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF pin != 'yossico2025' THEN RAISE EXCEPTION 'Acceso denegado'; END IF;
    RETURN QUERY
    SELECT se.id, se.nombre, se.telefono, se.correo, se.universidad, se.carrera,
           se.semestre, se.ano_graduacion, se.documento_url, se.estado,
           se.codigo_descuento, se.motivo_rechazo, se.created_at, se.aprobado_at
    FROM solicitudes_estudiantes se
    ORDER BY se.created_at DESC;
END;
$$;
GRANT EXECUTE ON FUNCTION admin_get_estudiantes(TEXT) TO anon;

-- 6. RPC: admin_aprobar_estudiante (protegido por PIN)
CREATE OR REPLACE FUNCTION admin_aprobar_estudiante(p_id BIGINT, pin TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_estudiante RECORD;
    v_codigo TEXT;
    v_rand TEXT;
BEGIN
    IF pin != 'yossico2025' THEN RAISE EXCEPTION 'Acceso denegado'; END IF;

    SELECT * INTO v_estudiante FROM solicitudes_estudiantes WHERE id = p_id;
    IF NOT FOUND THEN
        RETURN json_build_object('ok', false, 'error', 'Solicitud no encontrada');
    END IF;

    IF v_estudiante.estado = 'aprobado' AND v_estudiante.codigo_descuento IS NOT NULL THEN
        RETURN json_build_object(
            'ok', true, 
            'codigo', v_estudiante.codigo_descuento, 
            'ya_aprobado', true, 
            'telefono', v_estudiante.telefono, 
            'nombre', v_estudiante.nombre,
            'universidad', v_estudiante.universidad,
            'ano_graduacion', v_estudiante.ano_graduacion
        );
    END IF;

    v_rand := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || NOW()::TEXT) FROM 1 FOR 4));
    v_codigo := 'CAMPUS-' || v_rand;

    INSERT INTO subscribers (
        name, email, phone, discount_code, discount_type, discount_val, used
    ) VALUES (
        'ESTUDIANTE|' || v_estudiante.universidad || '|' || v_estudiante.ano_graduacion,
        v_estudiante.correo,
        v_estudiante.telefono,
        v_codigo,
        'porcentaje',
        15,
        false
    );

    UPDATE solicitudes_estudiantes
    SET estado = 'aprobado',
        codigo_descuento = v_codigo,
        aprobado_at = NOW()
    WHERE id = p_id;

    RETURN json_build_object(
        'ok', true,
        'codigo', v_codigo,
        'telefono', v_estudiante.telefono,
        'nombre', v_estudiante.nombre,
        'universidad', v_estudiante.universidad,
        'ano_graduacion', v_estudiante.ano_graduacion
    );
END;
$$;
GRANT EXECUTE ON FUNCTION admin_aprobar_estudiante(BIGINT, TEXT) TO anon;

-- 7. RPC: admin_rechazar_estudiante (protegido por PIN)
CREATE OR REPLACE FUNCTION admin_rechazar_estudiante(p_id BIGINT, p_motivo TEXT, pin TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF pin != 'yossico2025' THEN RAISE EXCEPTION 'Acceso denegado'; END IF;

    UPDATE solicitudes_estudiantes
    SET estado = 'rechazado',
        motivo_rechazo = p_motivo
    WHERE id = p_id;

    RETURN json_build_object('ok', true);
END;
$$;
GRANT EXECUTE ON FUNCTION admin_rechazar_estudiante(BIGINT, TEXT, TEXT) TO anon;

-- 8. RPC: admin_get_prive (protegido por PIN)
CREATE OR REPLACE FUNCTION admin_get_prive(pin TEXT)
RETURNS TABLE (
    id BIGINT,
    nombre TEXT,
    telefono TEXT,
    correo TEXT,
    ciudad TEXT,
    plan TEXT,
    estado TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF pin != 'yossico2025' THEN RAISE EXCEPTION 'Acceso denegado'; END IF;
    RETURN QUERY
    SELECT sp.id, sp.nombre, sp.telefono, sp.correo, sp.ciudad, sp.plan, sp.estado, sp.created_at
    FROM solicitudes_prive sp
    ORDER BY sp.created_at DESC;
END;
$$;
GRANT EXECUTE ON FUNCTION admin_get_prive(TEXT) TO anon;

-- 9. ACTUALIZACIÓN DE validar_descuento: respeta discount_val (15% OFF) y año de graduación estudiantil
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS discount_type TEXT DEFAULT 'porcentaje';
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS discount_val NUMERIC DEFAULT 10;

DROP FUNCTION IF EXISTS validar_descuento(text);

CREATE OR REPLACE FUNCTION validar_descuento(codigo text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  registro record;
  d_tipo text := 'porcentaje';
  d_valor numeric := 10;
  v_ano_grad integer;
  v_ano_actual integer;
BEGIN
  SELECT name, used, saldo_restante, discount_type, discount_val
  INTO registro
  FROM subscribers
  WHERE UPPER(discount_code) = UPPER(codigo)
  LIMIT 1;
  
  IF NOT FOUND THEN 
    RETURN json_build_object('valido', false); 
  END IF;
  
  IF registro.used THEN
    RETURN json_build_object('valido', true, 'usado', true);
  END IF;

  -- Verificar vigencia por año de graduación si es un código estudiantil (ESTUDIANTE|Universidad|Año)
  IF registro.name LIKE 'ESTUDIANTE|%' THEN
    BEGIN
      v_ano_grad := NULLIF( regexp_replace(split_part(registro.name, '|', 3), '[^0-9]', '', 'g'), '' )::integer;
      v_ano_actual := EXTRACT(YEAR FROM NOW())::integer;
      IF v_ano_grad IS NOT NULL AND v_ano_grad < v_ano_actual THEN
        RETURN json_build_object(
          'valido', true,
          'usado', true,
          'motivo_expirado', 'Tu beneficio estudiantil expiró al finalizar tu año de graduación (' || v_ano_grad || ').'
        );
      END IF;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;

  d_tipo := COALESCE(registro.discount_type, 'porcentaje');
  d_valor := COALESCE(registro.discount_val, 10);

  IF UPPER(codigo) LIKE 'CAMPUS-%' OR UPPER(codigo) LIKE 'PRIVE-%' THEN
    d_valor := GREATEST(d_valor, 15);
  END IF;
  
  -- Si es Gift Card: usar saldo_restante real
  IF registro.name LIKE 'GIFTCARD|%' THEN
    d_tipo := 'monto';
    d_valor := COALESCE(registro.saldo_restante, NULLIF(split_part(registro.name, '|', 2), '')::numeric, d_valor);
  END IF;

  RETURN json_build_object(
    'valido', true, 
    'usado', false, 
    'tipo', d_tipo, 
    'valor', d_valor
  );
END;
$$;

GRANT EXECUTE ON FUNCTION validar_descuento(text) TO anon;
