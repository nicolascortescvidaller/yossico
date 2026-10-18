-- Analítica propia de YOSSICO (sin cookies de terceros)
CREATE TABLE IF NOT EXISTS visitas (
  id bigserial PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  pagina text,
  evento text DEFAULT 'pageview',
  referrer text,
  fuente text,
  sesion text,
  visitante text,
  dispositivo text
);
CREATE INDEX IF NOT EXISTS visitas_created_idx ON visitas (created_at DESC);

ALTER TABLE visitas ENABLE ROW LEVEL SECURITY;
-- Sin políticas: nadie lee/escribe directo; solo las funciones SECURITY DEFINER.

CREATE OR REPLACE FUNCTION registrar_visita(
  p_pagina text, p_evento text, p_referrer text, p_fuente text,
  p_sesion text, p_visitante text, p_dispositivo text
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO visitas (pagina, evento, referrer, fuente, sesion, visitante, dispositivo)
  VALUES (left(p_pagina,200), left(coalesce(p_evento,'pageview'),60), left(p_referrer,300),
          left(p_fuente,80), left(p_sesion,60), left(p_visitante,60), left(p_dispositivo,20));
END;
$$;
GRANT EXECUTE ON FUNCTION registrar_visita(text,text,text,text,text,text,text) TO anon;

CREATE OR REPLACE FUNCTION admin_get_visitas(pin text, dias int DEFAULT 30)
RETURNS TABLE (created_at timestamptz, pagina text, evento text, referrer text,
               fuente text, sesion text, visitante text, dispositivo text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF pin != 'yossico2025' THEN RAISE EXCEPTION 'Acceso denegado'; END IF;
  RETURN QUERY
  SELECT v.created_at, v.pagina, v.evento, v.referrer, v.fuente, v.sesion, v.visitante, v.dispositivo
  FROM visitas v
  WHERE v.created_at >= now() - make_interval(days => dias)
  ORDER BY v.created_at DESC
  LIMIT 50000;
END;
$$;
GRANT EXECUTE ON FUNCTION admin_get_visitas(text,int) TO anon;
