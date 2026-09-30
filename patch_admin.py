import re

html_path = '/Users/nicolascortesvidaller/yossico/web/YOSSICO_Panel_Admin.html'
with open(html_path, 'r', encoding='utf-8') as f:
    content = f.read()

# ----------------- TAREA 1: BOTÓN PEDIR RESEÑA -----------------
# in renderPedidos: <button onclick="abrirModalRMA('${p.id}')...
btn_rma = """<button onclick="abrirModalRMA('${p.id}')" style="background:#fff3e0;color:#e65100;border:1px solid #ffcc80;padding:0.3rem;font-size:0.65rem;cursor:pointer;border-radius:3px;font-family:inherit;margin-top:0.3rem;display:block;width:100%">Procesar Cambio</button>"""
btn_resena = """${(p.estado||'').toLowerCase().includes('entregado') ? `
  <button onclick="pedirResena('${p.id}')" 
    style="background:#fce4ec;color:#c62828;border:1px solid #ef9a9a;padding:0.3rem;font-size:0.65rem;cursor:pointer;border-radius:3px;font-family:inherit;margin-top:0.3rem;display:block;width:100%">
    ⭐ Pedir Reseña
  </button>` : ''}"""
if btn_rma in content:
    content = content.replace(btn_rma, btn_rma + '\n          ' + btn_resena)
else:
    print("No encontré btn_rma")

# JS para pedirResena - insert at the end of script
func_pedir_resena = """
function pedirResena(id) {
  const p = todosPedidos.find(x => x.id === id);
  if (!p || !p.cliente_telefono) { mostrarToast('El cliente no tiene teléfono registrado', 'warn'); return; }
  let tel = p.cliente_telefono.replace(/\D/g, '');
  if (!tel.startsWith('57') && tel.length === 10) tel = '57' + tel;
  const nombre = (p.cliente_nombre || 'Hermosa').split(' ')[0];
  const msg = `Hola ${nombre} ✨%0A%0AEsperamos que tu Set YOSSICO haya llegado perfecto y te quede increíble 🥰%0A%0ASi tienes un minutito, nos haría muy felices que nos dejaras una reseña en Google. Solo toca el link y te toma 30 segundos:%0Ahttps://g.page/r/YOSSICO_GOOGLE_MAPS_ID/review%0A%0A¡Gracias por confiar en YOSSICO! 💛`;
  window.open(`https://wa.me/${tel}?text=${msg}`, '_blank');
}
"""

# ----------------- TAREA 2: HISTORIAL ESTADOS -----------------
# 2b. JS renderPedidos estado column:
estado_select = """</select>
        <div style="display:flex;gap:.3rem">
          <input type="text" placeholder="Guía de envío" value="${p.numero_guia||''}\""""

historial_html = """</select>
        ${(p.historial_estados && p.historial_estados.length > 1) ? `
  <div style="margin-top:0.5rem;border-top:1px solid var(--grisCl);padding-top:0.4rem">
    <div style="font-size:0.6rem;color:var(--grisMed);letter-spacing:1px;margin-bottom:0.3rem">HISTORIAL</div>
    ${(p.historial_estados || []).slice(-4).reverse().map(h => `
      <div style="font-size:0.62rem;color:#555;display:flex;justify-content:space-between;gap:0.5rem;padding:0.15rem 0;border-bottom:1px solid #f0f0f0">
        <span>${h.estado || ''}</span>
        <span style="color:var(--grisMed);white-space:nowrap">${h.ts ? new Date(h.ts).toLocaleDateString('es-CO',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}) : ''}</span>
      </div>`).join('')}
  </div>` : ''}
        <div style="display:flex;gap:.3rem">
          <input type="text" placeholder="Guía de envío" value="${p.numero_guia||''}\""""

if estado_select in content:
    content = content.replace(estado_select, historial_html)
else:
    print("No encontré estado_select")

# 2c. Remplaza cambiarEstado
old_cambiar_estado = """async function cambiarEstado(id, nuevoEstado, sel) {
  if (!nuevoEstado) return;
  if (nuevoEstado === "Cancelado" && !confirm("¿Cancelar pedido?\\n\\nEl stock se devolverá automáticamente.")) { sel.value=""; return; }
  const { error } = await sb.rpc("admin_actualizar_pedido", { p_id: id, p_nuevo_estado: nuevoEstado, pin: adminPin });
  if (error) { mostrarToast("Error: " + error.message, "err"); sel.value=""; }
  else { mostrarToast("Pedido → " + nuevoEstado, "ok"); cargarPedidos(); cargarStock();
    cargarProduccion();
    cargarCotizaciones();
    cargarPauta(); }
}"""

new_cambiar_estado = """async function cambiarEstado(id, nuevoEstado, sel) {
  if (!nuevoEstado) return;
  if (nuevoEstado === 'Cancelado' && !confirm('¿Cancelar pedido?\\n\\nEl stock se devolverá automáticamente.')) { sel.value = ''; return; }
  
  const { error } = await sb.rpc('admin_actualizar_pedido_v2', { p_id: id, p_nuevo_estado: nuevoEstado, pin: adminPin });
  if (error) { mostrarToast('Error: ' + error.message, 'err'); sel.value = ''; return; }
  
  mostrarToast('Pedido → ' + nuevoEstado, 'ok');
  
  // Update local cache immediately for the historial
  const pedidoLocal = todosPedidos.find(x => x.id === id);
  if (pedidoLocal) {
    pedidoLocal.estado = nuevoEstado;
    pedidoLocal.historial_estados = pedidoLocal.historial_estados || [];
    pedidoLocal.historial_estados.push({ estado: nuevoEstado, ts: new Date().toISOString() });
  }
  
  cargarPedidos(); cargarStock(); cargarProduccion(); cargarCotizaciones(); cargarPauta();
}"""

if old_cambiar_estado in content:
    content = content.replace(old_cambiar_estado, new_cambiar_estado)
else:
    print("No encontré old_cambiar_estado")


# ----------------- TAREA 3: DROP -----------------
# 3a. Nuevo tab en sidebar
tab_b2b = """<button class="tab-btn" onclick="cambiarTab('b2b',this)">"""
tab_drop = """<button class="tab-btn" onclick="cambiarTab('drop',this)">
  <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
  Drop / Lanzamiento
</button>
      <button class="tab-btn" onclick="cambiarTab('b2b',this)">"""
if tab_b2b in content:
    content = content.replace(tab_b2b, tab_drop)
else:
    print("No encontré tab_b2b")

# 3b. Contenido del tab
main_end = """</div><!-- /main -->"""
tab_drop_content = """<!-- TAB DROP -->
<div id="tab-drop" class="tab-content">
  <div class="form-card hover-module">
    <div class="section-title" style="margin-bottom:0.5rem">🚀 Control de Drop / Lanzamiento</div>
    <div style="font-size:0.8rem;color:var(--grisMed);margin-bottom:1.5rem">Activa el contador en la tienda web. Mientras esté activo, los clientes verán una barra de cuenta regresiva en la colección.</div>
    
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;margin-bottom:2rem">
      <div class="form-group">
        <label>Nombre del Drop</label>
        <input type="text" id="drop-nombre" placeholder="Drop 4 — Colección Invernal" style="width:100%;padding:0.6rem;border:1px solid var(--grisCl);font-family:inherit">
      </div>
      <div class="form-group">
        <label>Fecha y hora de lanzamiento</label>
        <input type="datetime-local" id="drop-fecha" style="width:100%;padding:0.6rem;border:1px solid var(--grisCl);font-family:inherit">
      </div>
    </div>
    
    <div style="display:flex;gap:1rem;margin-bottom:2rem">
      <button class="btn btn-negro" onclick="activarDrop()">🚀 Activar Drop</button>
      <button class="btn btn-gris" onclick="desactivarDrop()">✕ Desactivar Drop</button>
    </div>
    
    <div id="drop-status" style="padding:1rem;border-radius:8px;background:var(--grisF);font-size:0.8rem">Cargando estado del drop...</div>
  </div>

  <!-- Stats del drop actual -->
  <div class="form-card hover-module" style="margin-top:1.5rem">
    <div class="section-title" style="margin-bottom:1rem">📊 Métricas en Tiempo Real (Drop Activo)</div>
    <div class="resumen-grid" style="grid-template-columns:repeat(4,1fr)">
      <div class="resumen-card hover-module verde"><div class="rlabel">Pedidos Drop</div><div class="rvalor" id="drop-pedidos">—</div><div class="rsub">desde el lanzamiento</div></div>
      <div class="resumen-card hover-module azul"><div class="rlabel">Ingresos Drop</div><div class="rvalor" id="drop-ingresos">—</div><div class="rsub">ventas pagadas</div></div>
      <div class="resumen-card hover-module naranja"><div class="rlabel">Ticket Promedio</div><div class="rvalor" id="drop-ticket">—</div><div class="rsub">por pedido</div></div>
      <div class="resumen-card hover-module rojo"><div class="rlabel">Clientes Nuevas</div><div class="rvalor" id="drop-nuevas">—</div><div class="rsub">primera compra</div></div>
    </div>
  </div>
</div>
"""
if main_end in content:
    content = content.replace(main_end, tab_drop_content + '\n  </div><!-- /main -->')
else:
    print("No encontré main_end")

# 3c. JS Drop
js_drop = """
// ── DROP / LANZAMIENTO ──
function renderDropStatus() {
  const dropData = JSON.parse(localStorage.getItem('yossico_drop_activo') || 'null');
  const el = document.getElementById('drop-status');
  if (!el) return;
  
  if (!dropData || !dropData.activo) {
    el.innerHTML = '<span style="color:var(--grisMed)">⬜ No hay ningún Drop activo en este momento. El contador en la web está apagado.</span>';
    return;
  }
  
  const fechaLanzamiento = new Date(dropData.fecha);
  const ahora = new Date();
  const diff = fechaLanzamiento - ahora;
  
  if (diff > 0) {
    const horas = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    el.innerHTML = `<span style="color:#1b5e20;font-weight:600">🟢 DROP ACTIVO: <strong>${dropData.nombre}</strong></span><br><span style="color:var(--grisMed)">Lanzamiento en: ${horas}h ${mins}min (${fechaLanzamiento.toLocaleString('es-CO')})</span>`;
  } else {
    el.innerHTML = `<span style="color:#1565c0;font-weight:600">🔵 DROP EN VIVO: <strong>${dropData.nombre}</strong></span><br><span style="color:var(--grisMed)">Lanzado el ${fechaLanzamiento.toLocaleString('es-CO')}</span>`;
  }
  
  // Calcular métricas del drop
  const pedidosDrop = (window.todosPedidos || []).filter(p => new Date(p.created_at) >= fechaLanzamiento && esPagado(p.estado));
  const ingresosDrop = pedidosDrop.reduce((s, p) => s + parseFloat(p.total || 0), 0);
  const ticketProm = pedidosDrop.length > 0 ? ingresosDrop / pedidosDrop.length : 0;
  
  // Clientes nuevas = teléfonos que no aparecen en pedidos ANTES del drop
  const telefonosAntes = new Set((window.todosPedidos || []).filter(p => new Date(p.created_at) < fechaLanzamiento).map(p => p.cliente_telefono));
  const nuevas = pedidosDrop.filter(p => !telefonosAntes.has(p.cliente_telefono)).length;
  
  const elPed = document.getElementById('drop-pedidos'); if(elPed) elPed.textContent = pedidosDrop.length;
  const elIng = document.getElementById('drop-ingresos'); if(elIng) elIng.textContent = fCOP(ingresosDrop);
  const elTck = document.getElementById('drop-ticket'); if(elTck) elTck.textContent = fCOP(ticketProm);
  const elNuv = document.getElementById('drop-nuevas'); if(elNuv) elNuv.textContent = nuevas;
}

window.activarDrop = function() {
  const nombre = document.getElementById('drop-nombre').value.trim();
  const fecha = document.getElementById('drop-fecha').value;
  if (!nombre || !fecha) { mostrarToast('Completa el nombre y la fecha del Drop', 'warn'); return; }
  localStorage.setItem('yossico_drop_activo', JSON.stringify({ activo: true, nombre, fecha }));
  mostrarToast('Drop activado ✓', 'ok');
  renderDropStatus();
};

window.desactivarDrop = function() {
  if (!confirm('¿Desactivar el Drop? El contador en la web desaparecerá.')) return;
  localStorage.removeItem('yossico_drop_activo');
  mostrarToast('Drop desactivado', 'ok');
  renderDropStatus();
};
"""

# 3d. Hook en cambiarTab
hook_cambiarTab = """else if (tab === 'envios') {
    renderEnvios();
  }"""
hook_cambiarTab_new = """else if (tab === 'envios') {
    renderEnvios();
  } else if (tab === 'drop') {
    renderDropStatus();
  }"""
if hook_cambiarTab in content:
    content = content.replace(hook_cambiarTab, hook_cambiarTab_new)
else:
    print("No encontré hook_cambiarTab")


# ----------------- TAREA 4: REPORTE SEMANAL -----------------
btn_actualizar_stats = """<button class="btn btn-gris btn-sm" onclick="renderStats()">↻ Actualizar</button>"""
btn_reporte = """<button class="btn btn-gris btn-sm" onclick="renderStats()">↻ Actualizar</button>
        <button class="btn btn-gris btn-sm" onclick="enviarReporteSemanal()" style="background:#25D366;color:#fff;border:none">📊 Reporte WA</button>"""
if btn_actualizar_stats in content:
    content = content.replace(btn_actualizar_stats, btn_reporte)
else:
    print("No encontré btn_actualizar_stats")

js_reporte = """
function enviarReporteSemanal() {
  const hace7dias = new Date(Date.now() - 7 * 86400000);
  const semana = (window.todosPedidos || []).filter(p => new Date(p.created_at) >= hace7dias && esPagado(p.estado));
  
  const ingresos = semana.reduce((s, p) => s + parseFloat(p.total || 0), 0);
  const ticket = semana.length > 0 ? Math.round(ingresos / semana.length) : 0;
  
  // Top producto
  const mapa = {};
  semana.forEach(p => (p.items||[]).forEach(i => { const k=(i.nombre||'?')+' '+(i.color||''); mapa[k]=(mapa[k]||0)+parseInt(i.qty||1); }));
  const topProducto = Object.entries(mapa).sort((a,b)=>b[1]-a[1])[0];
  const topStr = topProducto ? `${topProducto[0]} (${topProducto[1]} uds)` : 'N/A';
  
  // Stock crítico
  const criticos = (window.stockData||[]).filter(s=>s.stock<=3&&s.stock>0).map(s=>`${s.nombre} T${s.talla}`).slice(0,3).join(', ') || 'Ninguno ✅';
  
  // Nuevas clientas (números que no habían comprado antes)
  const antes = new Set((window.todosPedidos||[]).filter(p=>new Date(p.created_at)<hace7dias).map(p=>p.cliente_telefono));
  const nuevas = semana.filter(p=>!antes.has(p.cliente_telefono)).length;
  
  const numAdmin = '573219937221'; // Número de WhatsApp del admin
  const msg = `📊 *Resumen Semanal YOSSICO*%0A${new Date(hace7dias).toLocaleDateString('es-CO')} → hoy%0A%0A💰 Ingresos: *${fCOP(ingresos)}*%0A📦 Pedidos pagados: *${semana.length}*%0A🎯 Ticket promedio: *${fCOP(ticket)}*%0A🌟 Set más vendido: *${topStr}*%0A👤 Clientas nuevas: *${nuevas}*%0A⚠️ Stock crítico: ${criticos}%0A%0A_Generado automáticamente desde Panel YOSSICO_`;
  
  window.open(`https://wa.me/${numAdmin}?text=${msg}`, '_blank');
}
"""


# ----------------- TAREA 5: TRAZABILIDAD ENTREGADO -----------------
btn_rastrear_wa = """<button onclick="rastrearGuia('${p.empresa_envio}','${p.numero_guia}')" style="background:#e8f5e9;color:#2e7d32;border:1px solid #c8e6c9;padding:0.25rem 0.5rem;font-size:0.6rem;cursor:pointer;border-radius:2px;">Rastrear</button>
                             <button onclick="enviarGuiaWA('${p.id}')" style="background:#e3f2fd;color:#1565c0;border:1px solid #bbdefb;padding:0.25rem 0.5rem;font-size:0.6rem;cursor:pointer;border-radius:2px;">WhatsApp</button>` : ''}"""
btn_rastrear_wa_new = """<button onclick="rastrearGuia('${p.empresa_envio}','${p.numero_guia}')" style="background:#e8f5e9;color:#2e7d32;border:1px solid #c8e6c9;padding:0.25rem 0.5rem;font-size:0.6rem;cursor:pointer;border-radius:2px;">Rastrear</button>
                             <button onclick="enviarGuiaWA('${p.id}')" style="background:#e3f2fd;color:#1565c0;border:1px solid #bbdefb;padding:0.25rem 0.5rem;font-size:0.6rem;cursor:pointer;border-radius:2px;">WhatsApp</button>
                             ${!(p.estado||'').toLowerCase().includes('entregado') ? `<button onclick="marcarEntregado('${p.id}')" style="background:#e8f5e9;color:#2e7d32;border:1px solid #c8e6c9;padding:0.25rem 0.5rem;font-size:0.6rem;cursor:pointer;border-radius:2px;margin-top:2px;">✓ Entregado</button>` : ''}` : ''}"""

if btn_rastrear_wa in content:
    content = content.replace(btn_rastrear_wa, btn_rastrear_wa_new)
else:
    print("No encontré btn_rastrear_wa")

js_entregado = """
async function marcarEntregado(id) {
  if (!confirm('¿Confirmar que el pedido fue entregado?')) return;
  const { error } = await sb.rpc('admin_actualizar_pedido_v2', { p_id: id, p_nuevo_estado: 'Entregado', pin: adminPin });
  if (error) { mostrarToast('Error: ' + error.message, 'err'); return; }
  mostrarToast('Pedido marcado como Entregado ✓', 'ok');
  cargarPedidos();
}
"""

# Añadir funciones JS nuevas al final antes del </body>
js_all_new = f"""
<script>
{func_pedir_resena}
{js_drop}
{js_reporte}
{js_entregado}
</script>
"""
if "</body>" in content:
    content = content.replace("</body>", js_all_new + "\n</body>")
else:
    print("No encontré </body>")

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("YOSSICO_Panel_Admin.html editado exitosamente")

# TAREA 3e: Banner en coleccion.html
col_path = '/Users/nicolascortesvidaller/yossico/web/coleccion.html'
try:
    with open(col_path, 'r', encoding='utf-8') as f:
        col_content = f.read()

    banner_html = """
<!-- YOSSICO Drop Countdown Banner -->
<div id="drop-banner" style="display:none;position:fixed;bottom:0;left:0;right:0;background:linear-gradient(135deg,#000 0%,#1a1a1a 100%);color:#fff;text-align:center;padding:0.8rem 1rem;z-index:9999;font-family:Montserrat,sans-serif;font-size:0.8rem;letter-spacing:2px;">
  <span id="drop-banner-text"></span>
  <button onclick="document.getElementById('drop-banner').style.display='none'" style="background:none;border:none;color:#888;cursor:pointer;margin-left:1.5rem;font-size:0.9rem">✕</button>
</div>
<script>
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
</script>
"""
    if "</body>" in col_content:
        if "id=\"drop-banner\"" not in col_content:
            col_content = col_content.replace("</body>", banner_html + "\n</body>")
            with open(col_path, 'w', encoding='utf-8') as f:
                f.write(col_content)
            print("coleccion.html editado exitosamente")
        else:
            print("coleccion.html ya tenía el banner")
    else:
        print("No encontré </body> en coleccion.html")
except FileNotFoundError:
    print(f"No se encontró {col_path}")

