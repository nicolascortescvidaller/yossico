import re
import os

base = '/Users/nicolascortesvidaller/yossico'

def readf(p):
    with open(p, 'r', encoding='utf-8') as f: return f.read()

def writef(p, c):
    with open(p, 'w', encoding='utf-8') as f: f.write(c)

# -- TAREA 1: SQL RASTREO --
writef(f'{base}/supabase/migrations/20260930_rastreo_cliente.sql', """CREATE OR REPLACE FUNCTION rastrear_pedido(busqueda text)
RETURNS TABLE (
  id uuid,
  cliente_nombre text,
  cliente_telefono text,
  items jsonb,
  total numeric,
  estado text,
  historial_estados jsonb,
  numero_guia text,
  empresa_envio text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id, p.cliente_nombre, p.cliente_telefono,
    p.items::jsonb, p.total::numeric, p.estado,
    COALESCE(p.historial_estados, '[]'::jsonb),
    p.numero_guia, p.empresa_envio, p.created_at
  FROM pedidos p
  WHERE 
    p.cliente_telefono ILIKE '%' || busqueda || '%'
    OR p.id::text ILIKE busqueda || '%'
  ORDER BY p.created_at DESC
  LIMIT 5;
END;
$$;

GRANT EXECUTE ON FUNCTION rastrear_pedido(text) TO anon;
""")

# -- TAREA 2a: SQL GIFTCARD --
writef(f'{base}/supabase/migrations/20260930_giftcard_saldo.sql', """ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS saldo_restante numeric DEFAULT NULL;

-- Actualizar los GiftCards existentes con el saldo_restante inicial
UPDATE subscribers
SET saldo_restante = split_part(name, '|', 2)::numeric
WHERE name LIKE 'GIFTCARD|%' AND saldo_restante IS NULL AND used = false;

-- Función para consumir saldo parcial de gift card
CREATE OR REPLACE FUNCTION usar_giftcard(codigo text, monto_a_descontar numeric)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  registro record;
  saldo_actual numeric;
  saldo_nuevo numeric;
BEGIN
  SELECT saldo_restante, used, name INTO registro
  FROM subscribers WHERE discount_code = codigo;
  
  IF NOT FOUND THEN
    RETURN json_build_object('ok', false, 'error', 'Código no encontrado');
  END IF;
  
  IF registro.used THEN
    RETURN json_build_object('ok', false, 'error', 'Gift Card ya agotada');
  END IF;
  
  saldo_actual := COALESCE(registro.saldo_restante, split_part(registro.name, '|', 2)::numeric);
  saldo_nuevo := saldo_actual - monto_a_descontar;
  
  IF saldo_nuevo <= 0 THEN
    -- Agotar la gift card
    UPDATE subscribers SET used = true, saldo_restante = 0 WHERE discount_code = codigo;
  ELSE
    -- Descontar saldo parcial, dejar activa
    UPDATE subscribers SET saldo_restante = saldo_nuevo WHERE discount_code = codigo;
  END IF;
  
  RETURN json_build_object('ok', true, 'saldo_usado', LEAST(saldo_actual, monto_a_descontar), 'saldo_restante', GREATEST(0, saldo_nuevo));
END;
$$;

GRANT EXECUTE ON FUNCTION usar_giftcard(text, numeric) TO anon;
""")

# -- TAREA 2b: SQL VALIDAR_DESCUENTO --
writef(f'{base}/supabase/migrations/20260930_validar_descuento_v2.sql', """DROP FUNCTION IF EXISTS validar_descuento(text);

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
BEGIN
  SELECT name, used, saldo_restante INTO registro FROM subscribers WHERE discount_code = codigo;
  
  IF NOT FOUND THEN 
    RETURN json_build_object('valido', false); 
  END IF;
  
  IF registro.used THEN
    RETURN json_build_object('valido', true, 'usado', true);
  END IF;
  
  -- Si es Gift Card: usar saldo_restante real
  IF registro.name LIKE 'GIFTCARD|%' THEN
    d_tipo := 'monto';
    d_valor := COALESCE(registro.saldo_restante, split_part(registro.name, '|', 2)::numeric);
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
""")

# -- TAREA 3a: SQL CONFIG GLOBAL --
writef(f'{base}/supabase/migrations/20260930_config_global.sql', """CREATE TABLE IF NOT EXISTS config_yossico (
  clave text PRIMARY KEY,
  valor jsonb,
  updated_at timestamptz DEFAULT now()
);

-- Insertar configuración inicial del Drop
INSERT INTO config_yossico (clave, valor) 
VALUES ('drop_activo', '{"activo": false}'::jsonb)
ON CONFLICT (clave) DO NOTHING;

-- RPC para leer config (público, solo lectura)
CREATE OR REPLACE FUNCTION get_config(p_clave text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (SELECT valor FROM config_yossico WHERE clave = p_clave);
END;
$$;
GRANT EXECUTE ON FUNCTION get_config(text) TO anon;

-- RPC para actualizar config (solo admin con PIN)
CREATE OR REPLACE FUNCTION set_config(p_clave text, p_valor jsonb, pin text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF pin != 'yossico2025' THEN RAISE EXCEPTION 'Acceso denegado'; END IF;
  INSERT INTO config_yossico (clave, valor, updated_at)
  VALUES (p_clave, p_valor, now())
  ON CONFLICT (clave) DO UPDATE SET valor = p_valor, updated_at = now();
END;
$$;
GRANT EXECUTE ON FUNCTION set_config(text, jsonb, text) TO anon;
""")

# -- CHECKOUT.HTML --
ck = readf(f'{base}/web/checkout.html')
ck = ck.replace("let discountPct = 0;", "let discountPct = 0;\n      let discountMonto = 0;")
ck = ck.replace("discountPct = dType === 'porcentaje' ? dVal : 0; // Para el mensaje WA", 
                "discountPct = dType === 'porcentaje' ? dVal : 0; // Para el mensaje WA\n          discountMonto = dType === 'monto' ? dVal : 0;")

old_final_total = "const finalTotal = t * (1 - discountPct / 100);"
new_final_total = """let finalTotal = t;
        if (discountPct > 0) finalTotal = t * (1 - discountPct / 100);
        else if (discountMonto > 0) finalTotal = Math.max(0, t - discountMonto);"""
ck = ck.replace(old_final_total, new_final_total)

old_mark_used = """/* Marcar código de descuento como usado */
            if (dcode) {
              const { error: usedError } = await sb.rpc('marcar_descuento_usado', { codigo: dcode });
              if (usedError) console.warn('[checkout] mark used error:', usedError.message);
            }"""
new_mark_used = """/* Consumir código de descuento (Gift Cards: saldo parcial; otros: marcar usado) */
            if (dcode) {
              const isGiftCard = dcode.startsWith('GC-');
              if (isGiftCard) {
                const montoDescontado = t - finalTotal;
                const { error: gcError } = await sb.rpc('usar_giftcard', { codigo: dcode, monto_a_descontar: montoDescontado });
                if (gcError) console.warn('[checkout] usar_giftcard error:', gcError.message);
              } else {
                const { error: usedError } = await sb.rpc('marcar_descuento_usado', { codigo: dcode });
                if (usedError) console.warn('[checkout] mark used error:', usedError.message);
              }
            }"""
ck = ck.replace(old_mark_used, new_mark_used)
writef(f'{base}/web/checkout.html', ck)

# -- PANEL ADMIN --
adm = readf(f'{base}/web/YOSSICO_Panel_Admin.html')

# Add saldo map
old_render_emb = "async function renderEmbajadorasYGc() {"
new_render_emb = """async function renderEmbajadorasYGc() {
  const { data: saldos } = await window.sb.from('subscribers').select('discount_code, saldo_restante').like('name', 'GIFTCARD|%');
  const saldoMap = {};
  (saldos || []).forEach(s => saldoMap[s.discount_code] = s.saldo_restante);
"""
adm = adm.replace(old_render_emb, new_render_emb)

# Add UI for saldo in admin panel
old_td = "<td><strong>${fCOP(valor)}</strong></td>"
new_td = """<td>
  <strong>${fCOP(valor)}</strong>
  ${saldoMap[g.discount_code] !== null && saldoMap[g.discount_code] !== undefined && saldoMap[g.discount_code] < valor 
    ? `<br><span style="font-size:0.65rem;color:var(--grisMed)">Saldo: ${fCOP(saldoMap[g.discount_code])}</span>` 
    : ''}
</td>"""
adm = adm.replace(old_td, new_td)

# Drop control replacements
old_activar = """window.activarDrop = function() {
  const nombre = document.getElementById('drop-nombre').value.trim();
  const fecha = document.getElementById('drop-fecha').value;
  if (!nombre || !fecha) { mostrarToast('Completa el nombre y la fecha del Drop', 'warn'); return; }
  localStorage.setItem('yossico_drop_activo', JSON.stringify({ activo: true, nombre, fecha }));
  mostrarToast('Drop activado ✓', 'ok');
  renderDropStatus();
};"""
new_activar = """window.activarDrop = async function() {
  const nombre = document.getElementById('drop-nombre').value.trim();
  const fecha = document.getElementById('drop-fecha').value;
  if (!nombre || !fecha) { mostrarToast('Completa el nombre y la fecha del Drop', 'warn'); return; }
  const dropData = { activo: true, nombre, fecha };
  const { error } = await sb.rpc('set_config', { p_clave: 'drop_activo', p_valor: dropData, pin: adminPin });
  if (error) { mostrarToast('Error: ' + error.message, 'err'); return; }
  localStorage.setItem('yossico_drop_activo', JSON.stringify(dropData));
  mostrarToast('Drop activado globalmente ✓', 'ok');
  renderDropStatus();
};"""
adm = adm.replace(old_activar, new_activar)

old_desactivar = """window.desactivarDrop = function() {
  if (!confirm('¿Desactivar el Drop? El contador en la web desaparecerá.')) return;
  localStorage.removeItem('yossico_drop_activo');
  mostrarToast('Drop desactivado', 'ok');
  renderDropStatus();
};"""
new_desactivar = """window.desactivarDrop = async function() {
  if (!confirm('¿Desactivar el Drop? El contador desaparecerá para todos.')) return;
  const { error } = await sb.rpc('set_config', { p_clave: 'drop_activo', p_valor: { activo: false }, pin: adminPin });
  if (error) { mostrarToast('Error: ' + error.message, 'err'); return; }
  localStorage.removeItem('yossico_drop_activo');
  mostrarToast('Drop desactivado ✓', 'ok');
  renderDropStatus();
};"""
adm = adm.replace(old_desactivar, new_desactivar)

old_render_drop = """async function renderDropStatus() {
  const el = document.getElementById('drop-status');
  if (!el) return;
  
  const dropData = JSON.parse(localStorage.getItem('yossico_drop_activo') || 'null');"""

new_render_drop = """async function renderDropStatus() {
  const el = document.getElementById('drop-status');
  if (!el) return;
  
  let dropData = null;
  try {
    const { data } = await sb.rpc('get_config', { p_clave: 'drop_activo' });
    dropData = data;
    if (dropData && dropData.activo) {
      localStorage.setItem('yossico_drop_activo', JSON.stringify(dropData));
    }
  } catch(e) {
    dropData = JSON.parse(localStorage.getItem('yossico_drop_activo') || 'null');
  }"""
adm = re.sub(r'async function renderDropStatus\(\) \{[\s\S]*?const dropData = JSON\.parse\(localStorage\.getItem\(\'yossico_drop_activo\'\) \|\| \'null\'\);', new_render_drop, adm)

old_no_drop = "el.innerHTML = '<span style=\"color:var(--grisMed)\">⬜ No hay ningún Drop activo en este momento. El contador en la web está apagado.</span>';"
new_no_drop = """el.innerHTML = '<span style="color:var(--grisMed)">⬛ No hay ningún Drop activo. El contador en la web está apagado para todos.</span>';
    ['drop-pedidos','drop-ingresos','drop-ticket','drop-nuevas'].forEach(id => { const e=document.getElementById(id); if(e) e.textContent='—'; });"""
adm = adm.replace(old_no_drop, new_no_drop)
writef(f'{base}/web/YOSSICO_Panel_Admin.html', adm)

# -- COLECCION BANNER --
col = readf(f'{base}/web/coleccion.html')
old_banner_script = """<script>
(function() {
  const dropData = JSON.parse(localStorage.getItem('yossico_drop_activo') || 'null');
  if (!dropData || !dropData.activo) return;
  const banner = document.getElementById('drop-banner');
  const textEl = document.getElementById('drop-banner-text');
  const target = new Date(dropData.fecha);
  function tick() {
    const diff = target - new Date();
    if (diff > 0) {
      const h = Math.floor(diff/3600000);
      const m = Math.floor((diff%3600000)/60000);
      const s = Math.floor((diff%60000)/1000);
      textEl.textContent = `🚀 ${dropData.nombre} — Lanzamiento en ${h}h ${m}m ${s}s`;
      banner.style.display = 'block';
    } else {
      textEl.textContent = `🔥 ${dropData.nombre} — ¡YA DISPONIBLE!`;
      banner.style.display = 'block';
    }
  }
  tick();
  setInterval(tick, 1000);
})();
</script>"""

new_banner_script = """<script>
(function() {
  const SUPA_URL = 'https://mgzevtcipwfpqgolmpwm.supabase.co';
  const SUPA_KEY = 'sb_publishable_1bxubqO9tCMdrCTuWj9CKA_irvrSa19';
  
  async function initDropBanner() {
    let dropData = null;
    try {
      const res = await fetch(`${SUPA_URL}/rest/v1/rpc/get_config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': SUPA_KEY, 'Authorization': 'Bearer ' + SUPA_KEY },
        body: JSON.stringify({ p_clave: 'drop_activo' })
      });
      dropData = await res.json();
    } catch(e) {
      dropData = JSON.parse(localStorage.getItem('yossico_drop_activo') || 'null');
    }
    
    if (!dropData || !dropData.activo) return;
    
    const banner = document.getElementById('drop-banner');
    const textEl = document.getElementById('drop-banner-text');
    const target = new Date(dropData.fecha);
    
    function tick() {
      const diff = target - new Date();
      if (diff > 0) {
        const h = Math.floor(diff/3600000);
        const m = Math.floor((diff%3600000)/60000);
        const s = Math.floor((diff%60000)/1000);
        textEl.textContent = `🚀 ${dropData.nombre} — Lanzamiento en ${h}h ${m}m ${s}s`;
        banner.style.display = 'block';
      } else {
        textEl.textContent = `🔥 ${dropData.nombre} — ¡YA DISPONIBLE!`;
        banner.style.display = 'block';
      }
    }
    tick();
    setInterval(tick, 1000);
  }
  
  initDropBanner();
})();
</script>"""
col = col.replace(old_banner_script, new_banner_script)

# LINK RASTREO
idx = readf(f'{base}/web/index.html')
link_html = '<a href="rastreo.html">Rastreo de pedido</a>'
if '<a href="terminos.html#s7">Devoluciones y Garantía</a>' in idx:
    idx = idx.replace('<a href="terminos.html#s7">Devoluciones y Garantía</a>', 
                      f'<a href="terminos.html#s7">Devoluciones y Garantía</a>\n                    {link_html}')
    writef(f'{base}/web/index.html', idx)

if '<a href="terminos.html#s7">Devoluciones y Garantía</a>' in col:
    col = col.replace('<a href="terminos.html#s7">Devoluciones y Garantía</a>', 
                      f'<a href="terminos.html#s7">Devoluciones y Garantía</a>\n                    {link_html}')
    writef(f'{base}/web/coleccion.html', col)

print("do_all.py done")
