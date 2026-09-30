
let adminPin = sessionStorage.getItem("admin_pin") || null;
let sb, stockData = [], todosPedidos = [], todasSubs = [], todosGastos = [], stockEditTarget = null;

document.addEventListener("DOMContentLoaded", () => {
  sb = window.YOSSICO_AUTH.getSb();
  if (adminPin) verificarPin(adminPin);
});

// ── TABS
function cambiarTab(tab, btn) {
  if (tab === 'finanzas') {
    if (sessionStorage.getItem('rent_auth') !== 'true') {
      const pass = prompt("Acceso Restringido. Ingresa la contraseña maestra para ver Finanzas:");
      if (pass !== "Nc1018499182*") {
        mostrarToast("Contraseña incorrecta", "err");
        return; // Detiene el cambio de pestaña
      }
      sessionStorage.setItem('rent_auth', 'true');
    }
  }

  document.querySelectorAll(".tab-content").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
  document.getElementById("tab-" + tab).classList.add("active");
  btn.classList.add("active");
  
  if (tab === "suscriptoras" && todasSubs.length === 0) {
    cargarSuscriptoras();
  } else if (tab === 'stats') {
    if (todasSubs.length === 0) cargarSuscriptoras().then(() => renderStats());
    else renderStats();
  } else if (tab === 'descuentos') {
    if (todasSubs.length === 0) cargarSuscriptoras().then(() => renderDescuentosLista());
    else renderDescuentosLista();
  } else if (tab === 'clientes') {
    if (!window.todosClientes) cargarClientes();
  } else if (tab === 'pauta') {
    if (window.todaPauta.length === 0) cargarPauta();
  } else if (tab === 'finanzas') {
    // Bug Fix #1: Cargar gastos y renderizar finanzas al entrar en la pestaña
    cargarGastos();
    actualizarSimulador(document.getElementById('sim-slider')?.value || 100);
  } else if (tab === 'envios') {
    renderEnvios();
  }
}

// ── LOGIN
async function login() { await verificarPin(document.getElementById("input-pass").value); }
document.getElementById("input-pass").addEventListener("keydown", e => { if (e.key === "Enter") login(); });

async function verificarPin(pin) {
  try {
    const { data, error } = await sb.rpc("admin_get_pedidos", { pin });
    if (error) throw error;
    adminPin = pin;
    sessionStorage.setItem("admin_pin", adminPin);
    document.getElementById("login-screen").classList.add("hidden");
    document.getElementById("panel").classList.remove("hidden");
    document.getElementById("usuario-info").textContent = "Admin";
    document.getElementById("btn-logout").style.display = "block";
    todosPedidos = data || [];
    actualizarResumen();
    aplicarFiltros();
    cargarStock();
    cargarProduccion();
    cargarCotizaciones();
    cargarPauta();
    cargarGastos();
    iniciarCampana();
  } catch (err) {
    mostrarToast("Error en inicio: " + err.message, "err"); console.error(err);
    adminPin = null;
    sessionStorage.removeItem("admin_pin");
  }
}

function cerrarSesion() { sessionStorage.removeItem("admin_pin"); location.reload(); }

// ── RESUMEN
function esPagado(e)    { const s=(e||"").toLowerCase(); return s.includes("pagado")||s.includes("completado")||s.includes("entregado"); }
function esPendiente(e) { const s=(e||"").toLowerCase(); return s.includes("pendiente")||s.includes("preparac")||s.includes("efectivo"); }
function esCancelado(e) { return (e||"").toLowerCase().includes("cancelado"); }

function actualizarResumen() {
  const hoy = new Date().toDateString();
  const ph  = todosPedidos.filter(p => new Date(p.created_at).toDateString() === hoy);
  const pagH = ph.filter(p => esPagado(p.estado));
  const totalHoy = pagH.reduce((s,p) => s + parseFloat(p.total||0), 0);
  const totalHist = todosPedidos.filter(p => esPagado(p.estado)).reduce((s,p) => s + parseFloat(p.total||0), 0);
  document.getElementById("res-total").textContent = fCOP(totalHoy);
  document.getElementById("res-total-hist").textContent = "Histórico: " + fCOP(totalHist);
  document.getElementById("res-phoy").textContent = ph.length;
  document.getElementById("res-ptotal").textContent = "Histórico: " + todosPedidos.length;
  document.getElementById("res-pend").textContent = ph.filter(p => esPendiente(p.estado)).length;
  document.getElementById("res-can").textContent  = ph.filter(p => esCancelado(p.estado)).length;
}

// ── PEDIDOS
async function cargarPedidos() {
  document.getElementById("tabla-pedidos").innerHTML = '<tr><td colspan="8" class="loading">Cargando...</td></tr>';
  const { data, error } = await sb.rpc("admin_get_pedidos", { pin: adminPin });
  if (error) { mostrarToast("Error: " + error.message, "err"); return; }
  todosPedidos = data || [];
  actualizarResumen();
  aplicarFiltros();
}

function aplicarFiltros() {
  const buscar = (document.getElementById("filtro-buscar")?.value||"").toLowerCase();
  const estado = (document.getElementById("filtro-estado")?.value||"").toLowerCase();
  const fecha  = document.getElementById("filtro-fecha")?.value||"todos";
  const ahora  = new Date();
  let f = [...todosPedidos];

  if (fecha === "hoy") f = f.filter(p => new Date(p.created_at).toDateString() === ahora.toDateString());
  else if (fecha === "semana") { const ini = new Date(ahora); ini.setDate(ahora.getDate()-ahora.getDay()); f = f.filter(p => new Date(p.created_at) >= ini); }
  else if (fecha === "mes") f = f.filter(p => { const d=new Date(p.created_at); return d.getMonth()===ahora.getMonth()&&d.getFullYear()===ahora.getFullYear(); });

  if (estado) f = f.filter(p => (p.estado||"").toLowerCase().includes(estado));
  if (buscar) f = f.filter(p => (p.cliente_nombre||"").toLowerCase().includes(buscar)||(p.cliente_telefono||"").toLowerCase().includes(buscar));

  renderPedidos(f);
  renderEnvios();
}

function badgeEst(e) {
  if (esCancelado(e)) return `<span class="badge badge-can">${e}</span>`;
  if (esPagado(e))    return `<span class="badge badge-pag">${e}</span>`;
  return `<span class="badge badge-pend">${e}</span>`;
}

function renderEnvios() {
  const tbody = document.getElementById("tabla-envios");
  if(!tbody) return;
  const filtro = document.getElementById("filtro-envios-estado").value;
  
  // Filtrar solo los que ya están Pagados (los cancelados o pendientes no se envían)
  // Bug Fix #4: usar esPagado() para ser case-insensitive y consistente con el resto del panel
  let base = todosPedidos.filter(p => esPagado(p.estado));
  
  if (filtro === 'pendientes') base = base.filter(p => !p.numero_guia);
  if (filtro === 'enviados') base = base.filter(p => p.numero_guia);

  if (!base.length) { tbody.innerHTML = '<tr><td colspan="6" class="loading">Sin resultados logísticos</td></tr>'; return; }
  
  tbody.innerHTML = base.map(p => {
    return `<tr>
      <td><input type="checkbox" class="chk-envio" value="${p.id}" style="margin-right:8px;"><code style="font-size:.7rem">${(p.id||"").split("-")[0]}</code></td>
      <td style="font-size:.75rem"><strong>${p.cliente_nombre||""}</strong><br>${p.cliente_ciudad||""}</td>
      <td style="font-size:.75rem">${p.empresa_envio||'<span style="color:var(--naranja)">Por definir</span>'}</td>
      <td style="font-size:.75rem">${p.numero_guia ? `<code>${p.numero_guia}</code>` : '<span style="color:var(--naranja)">Sin guía</span>'}</td>
      <td>${p.numero_guia ? '<span class="badge badge-pag">Despachado</span>' : '<span class="badge badge-pend">Por Despachar</span>'}</td>
      <td>
        <div style="display:flex; gap:0.3rem;">
          <button onclick="imprimirRotulo('${p.id}')" style="background:#f4f4f4;border:1px solid #ddd;padding:0.25rem 0.5rem;font-size:0.6rem;cursor:pointer;border-radius:2px;">🖨️ Rótulo</button>
          ${p.numero_guia ? `<button onclick="rastrearGuia('${p.empresa_envio}','${p.numero_guia}')" style="background:#e8f5e9;color:#2e7d32;border:1px solid #c8e6c9;padding:0.25rem 0.5rem;font-size:0.6rem;cursor:pointer;border-radius:2px;">Rastrear</button>
                             <button onclick="enviarGuiaWA('${p.id}')" style="background:#e3f2fd;color:#1565c0;border:1px solid #bbdefb;padding:0.25rem 0.5rem;font-size:0.6rem;cursor:pointer;border-radius:2px;">WhatsApp</button>` : ''}
        </div>
      </td>
    </tr>`;
  }).join('');
}

function renderPedidos(pedidos) {
  document.getElementById("contador-pedidos").textContent = `Mostrando ${pedidos.length} de ${todosPedidos.length} pedidos`;
  if (!pedidos.length) { document.getElementById("tabla-pedidos").innerHTML = '<tr><td colspan="8" class="loading">Sin resultados</td></tr>'; return; }
  document.getElementById("tabla-pedidos").innerHTML = pedidos.map(p => {
    const fecha = new Date(p.created_at).toLocaleDateString("es-CO",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"});
    const prendas = (p.items||[]).map(i => `${i.nombre||""} T${i.talla||""} x${i.qty||1}`).join(", ")||"-";
    return `<tr>
      <td><input type="checkbox" class="chk-envio" value="${p.id}" style="margin-right:8px;"><code style="font-size:.7rem">${(p.id||"").split("-")[0]}</code></td>
      <td style="font-size:.75rem">${fecha}</td>
      <td><strong>${p.cliente_nombre||""}</strong><br><span style="font-size:.7rem;color:var(--grisMed)">${p.cliente_telefono||""}</span></td>
      <td style="font-size:.75rem;max-width:180px;word-break:break-word">${prendas}</td>
      <td><strong>${fCOP(p.total)}</strong></td>
      <td>
        ${badgeEst(p.estado)}
        <div style="margin-top:0.8rem; display:flex; flex-direction:column; gap:0.4rem;">
          <button onclick="imprimirRotulo('${p.id}')" style="background:#f4f4f4;border:1px solid #ddd;padding:0.3rem;font-size:0.65rem;cursor:pointer;border-radius:3px;font-family:inherit;">Imprimir Rótulo</button>
          ${esPendiente(p.estado) ? `<button onclick="recuperarVenta('${p.id}')" style="background:#e8f5e9;color:#2e7d32;border:1px solid #c8e6c9;padding:0.3rem;font-size:0.65rem;cursor:pointer;border-radius:3px;font-family:inherit;">Recuperar WA</button>` : ''}
          <button onclick="abrirModalRMA('${p.id}')" style="background:#fff3e0;color:#e65100;border:1px solid #ffcc80;padding:0.3rem;font-size:0.65rem;cursor:pointer;border-radius:3px;font-family:inherit;margin-top:0.3rem;display:block;width:100%">Procesar Cambio</button>
        </div>
      </td>
      <td>
        <select class="estado-select" style="margin-bottom:.5rem;width:100%;padding:0.6rem;font-size:0.8rem;font-weight:400;font-family:inherit;border:1px solid var(--grisCl);background:var(--grisF);color:var(--negro);outline:none;cursor:pointer;border-radius:4px;" onchange="cambiarEstado('${p.id}',this.value,this)">
          <option value="">Cambiar estado...</option>
          <option value="Pagado">Pagado</option>
          <option value="Pendiente">Pendiente</option>
          <option value="Cancelado">Cancelado</option>
        </select>
        <div style="display:flex;gap:.3rem">
          <input type="text" placeholder="Guía de envío" value="${p.numero_guia||''}"
            style="flex:1;font-size:.7rem;padding:.4rem .6rem;border:1px solid var(--grisCl);font-family:inherit;min-width:0;outline:none;"
            id="guia-${p.id}">
          <button onclick="guardarGuia('${p.id}')"
            style="font-size:.7rem;padding:.4rem .75rem;background:var(--negro);color:var(--blanco);border:none;cursor:pointer;font-family:inherit">✓</button>
        </div>
        <div style="font-size:.65rem;color:var(--grisMed);margin-top:.4rem;text-transform:uppercase;letter-spacing:1px;" id="empresa-${p.id}">
          ${p.empresa_envio ? `<span style="display:block;margin-bottom:0.3rem">📦 ${p.empresa_envio}</span>` : ''}
          ${p.numero_guia ? `
            <div style="display:flex; gap:0.3rem;">
              <button onclick="rastrearGuia('${p.empresa_envio}','${p.numero_guia}')" style="flex:1; background:#f4f4f4;border:1px solid #ddd;padding:0.25rem;font-size:0.6rem;cursor:pointer;border-radius:2px;">Rastrear</button>
              <button onclick="enviarGuiaWA('${p.id}')" style="flex:1; background:#e8f5e9;color:#2e7d32;border:1px solid #c8e6c9;padding:0.25rem;font-size:0.6rem;cursor:pointer;border-radius:2px;">Notificar WA</button>
            </div>
          ` : ''}
        </div>
      </td>
      <td>
        <textarea 
          id="nota-${p.id}" 
          placeholder="Añadir nota interna..." 
          style="font-size:.7rem;padding:.5rem;border:1px solid var(--grisCl);width:100%;min-width:160px;resize:none;height:65px;font-family:inherit;color:var(--negro);margin-bottom:.4rem;background:var(--blanco);outline:none;line-height:1.4;"
          >${p.nota_interna || ''}</textarea>
        <button onclick="guardarNota('${p.id}')" 
          style="font-size:.65rem;padding:.4rem .6rem;background:var(--grisMed);color:var(--blanco);border:none;cursor:pointer;font-family:inherit;width:100%;letter-spacing:1px;text-transform:uppercase;transition:background .2s;" onmouseover="this.style.background='var(--negro)'" onmouseout="this.style.background='var(--grisMed)'">
          Guardar nota
        </button>
      </td>
    </tr>`;
  }).join("");
}

async function cambiarEstado(id, nuevoEstado, sel) {
  if (!nuevoEstado) return;
  if (nuevoEstado === "Cancelado" && !confirm("¿Cancelar pedido?\n\nEl stock se devolverá automáticamente.")) { sel.value=""; return; }
  const { error } = await sb.rpc("admin_actualizar_pedido", { p_id: id, p_nuevo_estado: nuevoEstado, pin: adminPin });
  if (error) { mostrarToast("Error: " + error.message, "err"); sel.value=""; }
  else { mostrarToast("Pedido → " + nuevoEstado, "ok"); cargarPedidos(); cargarStock();
    cargarProduccion();
    cargarCotizaciones();
    cargarPauta(); }
}

function imprimirRotulosLote() {
  const checkboxes = document.querySelectorAll('.chk-envio:checked');
  if (checkboxes.length === 0) { mostrarToast("Selecciona al menos un pedido", "warn"); return; }
  
  let ids = Array.from(checkboxes).map(c => c.value);
  let htmlRotulos = '';
  
  ids.forEach(id => {
    const p = todosPedidos.find(x => x.id === id);
    if(!p) return;
    const prendas = (p.items||[]).map(i => `${i.nombre} T${i.talla} x${i.qty}`).join(", ");
    htmlRotulos += `
      <div class="label" style="page-break-after: always; border: 2px solid #000; width: 10cm; height: 15cm; padding: 1.5rem; box-sizing: border-box; margin: 0 auto; position: relative;">
        <div class="logo" style="font-size: 1.5rem; letter-spacing: 3px; font-weight: bold; margin-bottom: 2rem; border-bottom: 2px solid #000; padding-bottom: 1rem; text-align: center;">YOSSICO</div>
        <div class="row" style="margin-bottom: 1rem;"><div class="lbl" style="font-size: 0.7rem; text-transform: uppercase; letter-spacing: 1px; color: #555;">Destinatario</div><div class="val" style="font-size:1.3rem; font-weight: bold;">${p.cliente_nombre || '-'}</div></div>
        <div class="row" style="margin-bottom: 1rem;"><div class="lbl" style="font-size: 0.7rem; text-transform: uppercase; letter-spacing: 1px; color: #555;">Teléfono</div><div class="val" style="font-size: 1.1rem; font-weight: bold;">${p.cliente_telefono || '-'}</div></div>
        <div class="row" style="margin-bottom: 1rem;"><div class="lbl" style="font-size: 0.7rem; text-transform: uppercase; letter-spacing: 1px; color: #555;">Dirección</div><div class="val" style="font-size: 1.1rem; font-weight: bold;">${p.cliente_direccion || '-'}</div><div class="val" style="margin-top:0.3rem; font-size: 1.1rem; font-weight: bold;">${p.cliente_ciudad || '-'}</div></div>
        <div class="row" style="margin-top:2rem"><div class="lbl" style="font-size: 0.7rem; text-transform: uppercase; letter-spacing: 1px; color: #555;">Contenido</div><div class="val" style="font-size:0.9rem; font-weight:normal;">${prendas}</div></div>
        <div class="footer" style="position: absolute; bottom: 1.5rem; left: 1.5rem; right: 1.5rem; font-size: 0.7rem; text-align: center; border-top: 1px solid #ccc; padding-top: 1rem;">Pedido #${p.id.split('-')[0]}<br>Remitente: YOSSICO - Bogotá, Colombia</div>
      </div>
    `;
  });
  
  const v = window.open('', '_blank');
  v.document.write(`<html><head><title>Rótulos en Lote</title><style>body { font-family: sans-serif; margin: 0; color: #000; }</style></head><body onload="window.print(); setTimeout(()=>window.close(), 500)">${htmlRotulos}
<!-- MODAL RMA / CAMBIOS -->
<div id="modal-rma" class="modal-overlay hidden">
  <div class="modal-content" style="max-width:500px">
    <div class="modal-header">
      <h2 style="font-family:'Cormorant Garamond', serif; margin:0">Procesar Cambio / Devolución</h2>
      <button onclick="cerrarModalRMA()" style="background:none;border:none;font-size:1.5rem;cursor:pointer">&times;</button>
    </div>
    <div style="padding:1.5rem;">
      <p style="font-size:0.85rem; color:var(--grisMed); margin-bottom:1rem;">
        Selecciona las prendas que el cliente devolvió para reingresarlas al inventario.
      </p>
      <input type="hidden" id="rma-pedido-id">
      <div id="rma-items-container" style="display:flex; flex-direction:column; gap:0.5rem; margin-bottom:1.5rem;">
        <!-- Checkboxes generados por JS -->
      </div>
      <div style="font-size:0.75rem; color:var(--naranja); margin-bottom:1rem; background:#fff3e0; padding:0.5rem; border-radius:4px;">
        Nota: Al procesar, el stock de las prendas seleccionadas se sumará automáticamente. Deberás crear un nuevo pedido manual para las nuevas prendas si es un cambio de talla/color.
      </div>
      <button class="btn btn-negro" style="width:100%" onclick="ejecutarRMA()">Reingresar al Inventario</button>
    </div>
  </div>
</div>

</body></html>`);
  v.document.close();
}

function imprimirRotulo(id) {
  const p = todosPedidos.find(x => x.id === id);
  if(!p) return;
  const prendas = (p.items||[]).map(i => `${i.nombre} T${i.talla} x${i.qty}`).join(", ");
  
  const v = window.open('', '_blank');
  v.document.write(`
    <html><head><title>Rótulo - ${p.id.split('-')[0]}</title>
    <style>
      body { font-family: sans-serif; padding: 2rem; margin: 0; color: #000; }
      .label { border: 2px solid #000; width: 10cm; height: 15cm; padding: 1.5rem; box-sizing: border-box; margin: 0 auto; position: relative; }
      .logo { font-size: 1.5rem; letter-spacing: 3px; font-weight: bold; margin-bottom: 2rem; border-bottom: 2px solid #000; padding-bottom: 1rem; text-align: center; }
      .row { margin-bottom: 1rem; }
      .lbl { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 1px; color: #555; }
      .val { font-size: 1.1rem; font-weight: bold; }
      .footer { position: absolute; bottom: 1.5rem; left: 1.5rem; right: 1.5rem; font-size: 0.7rem; text-align: center; border-top: 1px solid #ccc; padding-top: 1rem; }
    </style></head>
    <body onload="window.print(); setTimeout(()=>window.close(), 500)">
      <div class="label">
        <div class="logo">YOSSICO</div>
        
        <div class="row">
          <div class="lbl">Destinatario</div>
          <div class="val" style="font-size:1.3rem">${p.cliente_nombre || '-'}</div>
        </div>
        
        <div class="row">
          <div class="lbl">Teléfono</div>
          <div class="val">${p.cliente_telefono || '-'}</div>
        </div>
        
        <div class="row">
          <div class="lbl">Dirección de Entrega</div>
          <div class="val">${p.cliente_direccion || '-'}</div>
          <div class="val" style="margin-top:0.3rem">${p.cliente_ciudad || '-'}</div>
        </div>

        <div class="row" style="margin-top:2rem">
          <div class="lbl">Contenido del paquete</div>
          <div class="val" style="font-size:0.9rem; font-weight:normal;">${prendas}</div>
        </div>
        
        <div class="footer">
          Pedido #${p.id.split('-')[0]}<br>
          Remitente: YOSSICO - Bogotá, Colombia
        </div>
      </div>
    
<!-- MODAL RMA / CAMBIOS -->
<div id="modal-rma" class="modal-overlay hidden">
  <div class="modal-content" style="max-width:500px">
    <div class="modal-header">
      <h2 style="font-family:'Cormorant Garamond', serif; margin:0">Procesar Cambio / Devolución</h2>
      <button onclick="cerrarModalRMA()" style="background:none;border:none;font-size:1.5rem;cursor:pointer">&times;</button>
    </div>
    <div style="padding:1.5rem;">
      <p style="font-size:0.85rem; color:var(--grisMed); margin-bottom:1rem;">
        Selecciona las prendas que el cliente devolvió para reingresarlas al inventario.
      </p>
      <input type="hidden" id="rma-pedido-id">
      <div id="rma-items-container" style="display:flex; flex-direction:column; gap:0.5rem; margin-bottom:1.5rem;">
        <!-- Checkboxes generados por JS -->
      </div>
      <div style="font-size:0.75rem; color:var(--naranja); margin-bottom:1rem; background:#fff3e0; padding:0.5rem; border-radius:4px;">
        Nota: Al procesar, el stock de las prendas seleccionadas se sumará automáticamente. Deberás crear un nuevo pedido manual para las nuevas prendas si es un cambio de talla/color.
      </div>
      <button class="btn btn-negro" style="width:100%" onclick="ejecutarRMA()">Reingresar al Inventario</button>
    </div>
  </div>
</div>

</body></html>
  `);
  v.document.close();
}

function rastrearGuia(empresa, guia) {
  if (!guia) return;
  const emp = (empresa || '').toLowerCase();
  if (emp.includes('coordinadora')) {
    window.open(`https://www.coordinadora.com/rastreo/rastreo-de-guias/detalle-de-la-guia/?guia=${guia}`, '_blank');
  } else if (emp.includes('servientrega')) {
    window.open(`https://www.servientrega.com/wps/portal/rastreo-envio`, '_blank'); // Requiere input manual usualmente
  } else if (emp.includes('interrapidisimo')) {
    window.open(`https://www.interrapidisimo.com/sigue-tu-envio/?guia=${guia}`, '_blank');
  } else {
    mostrarToast("No se reconoce la URL de la empresa. Copia la guía manualmente.", "warn");
  }
}

function enviarGuiaWA(id) {
  const p = todosPedidos.find(x => x.id === id);
  if(!p || !p.cliente_telefono || !p.numero_guia) return;
  
  let tel = p.cliente_telefono.replace(/\D/g,'');
  if(!tel.startsWith('57') && tel.length === 10) tel = '57' + tel;
  
  const nombreCorto = (p.cliente_nombre || 'Hermosa').split(' ')[0];
  const urlRastreo = (p.empresa_envio||'').toLowerCase().includes('coordinadora') 
    ? `https://www.coordinadora.com/rastreo/rastreo-de-guias/detalle-de-la-guia/?guia=${p.numero_guia}`
    : 'en la página de ' + p.empresa_envio;

  const mensaje = `Hola ${nombreCorto} ✨%0A%0A¡Tu pedido de YOSSICO ya va en camino! 🚀%0A%0A📦 Transportadora: *${p.empresa_envio || 'Nuestra transportadora'}*%0A🔖 Número de Guía: *${p.numero_guia}*%0A%0APuedes rastrearlo aquí:%0A${urlRastreo}%0A%0A¡Gracias por tu compra!`;
  
  window.open(`https://wa.me/${tel}?text=${mensaje}`, '_blank');
}

function recuperarVenta(id) {
  const p = todosPedidos.find(x => x.id === id);
  if(!p || !p.cliente_telefono) { mostrarToast("El cliente no dejó número de teléfono", "warn"); return; }
  
  let tel = p.cliente_telefono.replace(/\D/g,'');
  if(!tel.startsWith('57') && tel.length === 10) tel = '57' + tel; // Asumir Colombia
  
  const nombreCorto = (p.cliente_nombre || 'Hermosa').split(' ')[0];
  const mensaje = `Hola ${nombreCorto}, ¿cómo estás? Soy del equipo YOSSICO ✨.%0A%0ANotamos que dejaste tu pedido en espera. ¿Tuviste algún inconveniente con el pago o la selección de la talla? Estamos aquí para ayudarte a terminarlo sin problemas.`;
  
  window.open(`https://wa.me/${tel}?text=${mensaje}`, '_blank');
}

function exportarCSV() {
  if (!todosPedidos.length) { mostrarToast("Sin pedidos para exportar","warn"); return; }
  const cols = ["ID","Fecha","Cliente","Teléfono","Email","Ciudad","Dirección","Prendas Totales","Descripción Prendas","Costo Estimado","Subtotal","Descuento","Código Descuento","Total Pagado","Pasarela / Método","ID Transacción","Estado Pago","Estado Logístico","Empresa Envío","Número Guía","Notas Internas"];
  const rows = todosPedidos.map(p => {
    const qtyTotal = (p.items||[]).reduce((s,i)=>s+(i.qty||1), 0);
    const prendas = (p.items||[]).map(i=>`${i.nombre||""} T${i.talla||""} x${i.qty||1}`).join(" | ");
    
    // Estimación contable básica
    const total = parseFloat(p.total) || 0;
    let costoEstimado = 0;
    (p.items || []).forEach(item => {
      const prodEnStock = stockData.find(s => s.nombre === item.nombre && s.color === item.color);
      if (prodEnStock && prodEnStock.costo_produccion) costoEstimado += parseFloat(prodEnStock.costo_produccion) * (item.qty || 1);
    });

    return [
      p.id, p.created_at, p.cliente_nombre, p.cliente_telefono, p.cliente_email, p.cliente_ciudad, p.cliente_direccion,
      qtyTotal, prendas, costoEstimado, total + (p.codigo_descuento ? 0 : 0), "", p.codigo_descuento, total,
      p.metodo_pago || "Wompi", p.wompi_id, p.wompi_estado || p.estado, p.estado,
      p.empresa_envio, p.numero_guia, p.nota_interna
    ].map(v=>`"${String(v||"").replace(/"/g,'""')}"`);
  });
  
  // Agregar BOM para Excel y separar con punto y coma (;)
  const csvContent = "\uFEFF" + [cols,...rows].map(r=>r.join(";")).join("\n");
  descargarCSV(csvContent, `yossico-contabilidad-${dHoy()}.csv`);
  mostrarToast("Reporte contable exportado ✓","ok");
}

// ── INVENTARIO

window.todasOrdenesProd = [];
async function cargarProduccion() {
  const tbody = document.getElementById('tabla-produccion');
  if(!tbody) return;
  const { data, error } = await sb.from('ordenes_produccion').select('*').order('created_at', { ascending: false });
  if (error) { tbody.innerHTML = `<tr><td colspan="7" class="loading">Error: ${error.message}</td></tr>`; return; }
  window.todasOrdenesProd = data || [];
  renderProduccion();
}

function renderProduccion() {
  const tbody = document.getElementById('tabla-produccion');
  if (window.todasOrdenesProd.length === 0) { tbody.innerHTML = '<tr><td colspan="7" class="loading" style="text-align:center">Sin órdenes en fábrica</td></tr>'; return; }
  
  tbody.innerHTML = window.todasOrdenesProd.map(o => {
    const estadoBadge = o.estado === 'entregado' ? '<span style="background:#e8f5e9;color:#2e7d32;padding:2px 6px;border-radius:4px;font-size:0.7rem">Entregado</span>' :
                        '<span style="background:#fff3e0;color:#e65100;padding:2px 6px;border-radius:4px;font-size:0.7rem">En Confección</span>';
    return `<tr>
      <td><strong>${o.modelo}</strong></td>
      <td>${o.color}</td>
      <td>${o.talla}</td>
      <td>${o.cantidad} und.</td>
      <td>${o.fecha_esperada || 'Sin fecha'}</td>
      <td>${estadoBadge}</td>
      <td>
        ${o.estado === 'en_confeccion' ? `<button class="btn btn-gris btn-sm" onclick="marcarProdEntregada('${o.id}', '${o.modelo}', '${o.talla}', ${o.cantidad})">Recibir Stock</button>` : '-'}
      </td>
    </tr>`;
  }).join('');
}

async function nuevaOrdenProduccion() {
  const mod = prompt("Modelo (ej: OSLO):"); if(!mod) return;
  const col = prompt("Color:"); if(!col) return;
  const tal = prompt("Talla (S, M, L):"); if(!tal) return;
  const cant = parseInt(prompt("Cantidad a fabricar:")); if(!cant) return;
  const fecha = prompt("Fecha esperada (YYYY-MM-DD):");
  
  const { error } = await sb.from('ordenes_produccion').insert([{ modelo: mod, color: col, talla: tal, cantidad: cant, fecha_esperada: fecha }]);
  if (error) mostrarToast(error.message, 'err');
  else { mostrarToast("Orden creada", "ok"); cargarProduccion(); }
}

async function marcarProdEntregada(id, modelo, talla, cantidad) {
  if(!confirm(`¿Marcar ${cantidad} und de ${modelo} Talla ${talla} como recibidas en inventario?`)) return;
  
  // 1. Marcar estado
  await sb.from('ordenes_produccion').update({ estado: 'entregado' }).eq('id', id);
  
  // 2. Sumar stock
  // This is a direct update, requires logic in BD or direct via REST since we have service_role?
  // Let's do it via direct REST using the anon key (if we gave permissions) or via the stockData JS logic for now, 
  // actually we can find the id in stockData and update it.
  const prod = stockData.find(s => s.nombre.toUpperCase() === modelo.toUpperCase() && s.talla.toUpperCase() === talla.toUpperCase());
  if (prod) {
    const { error } = await sb.from('productos').update({ stock: prod.stock + cantidad }).eq('id', prod.id);
    if(error) mostrarToast(error.message, 'err');
    else { mostrarToast("Stock sumado", "ok"); cargarStock();
    cargarProduccion();
    cargarCotizaciones();
    cargarPauta(); }
  } else {
    mostrarToast("No existe el producto base en inventario, crea la prenda primero", "warn");
  }
  cargarProduccion();
}

async function cargarStock() {
  const grid = document.getElementById("stock-grid");
  if (grid) grid.innerHTML = '<div class="loading">Cargando inventario...</div>';
  const { data, error } = await sb.from("productos").select("*").order("nombre");
  if (error) { if(grid) grid.innerHTML=`<div class="loading" style="color:var(--rojo)">Error: ${error.message}</div>`; return; }
  stockData = data || [];
  renderStock();
  if(typeof actualizarSimulador === "function") actualizarSimulador(100);
  filtrarSKUs();
  chkStockBajo();
}


function calcularDiasStock(nombre, color, talla, stock) {
  if (stock === 0) return 0;
  const hace30Dias = new Date(); hace30Dias.setDate(hace30Dias.getDate() - 30);
  let ventasMes = 0;
  todosPedidos.forEach(p => {
    if (new Date(p.created_at) >= hace30Dias && (p.estado === 'Pagado' || p.estado === 'Pendiente')) {
      (p.items || []).forEach(i => {
        if (i.nombre === nombre && (i.talla||'').toUpperCase() === talla.toUpperCase()) ventasMes += (i.qty || 1);
      });
    }
  });
  if (ventasMes === 0) return 999;
  const ritmoDiario = ventasMes / 30;
  return Math.round(stock / ritmoDiario);
}

function renderStock() {
  const grid = document.getElementById("stock-grid");
  if (!grid) return;
  const grupos = {};
  stockData.forEach(item => {
    const key = `${item.nombre}|${item.color}`;
    if (!grupos[key]) grupos[key] = {
      nombre: item.nombre,
      color: item.color,
      s: 0, m: 0, l: 0,
      bajo: false,
      costo: item.costo_produccion || 0,
      img: item.imagen_url || ''
    };
    if (item.talla==="S") grupos[key].s=item.stock;
    if (item.talla==="M") grupos[key].m=item.stock;
    if (item.talla==="L") grupos[key].l=item.stock;
    if (item.stock<=2&&item.stock>0) grupos[key].bajo=true;
  });
  const badge=(n,t)=>{const c=n===0?"talla-cero":n<=2?"talla-bajo":"talla-ok";return`<div class="talla-badge ${c}">${t}<br><strong>${n}</strong></div>`;};
  grid.innerHTML = Object.values(grupos).map(g=>`
    <div class="stock-item${g.bajo?" agotando":""}">
      <div style="display:flex; justify-content:space-between; align-items:flex-start">
        <div>
          <div class="stock-nombre"><strong>${g.nombre}</strong></div>
          <div class="stock-color">${g.color}</div>
        </div>
        ${g.img ? `<img src="${g.img}" style="width:40px;height:40px;object-fit:cover;border-radius:4px;border:1px solid var(--grisCl)">` : ''}
      </div>
      ${g.bajo?'<div style="font-size:.65rem;color:var(--naranja);margin-bottom:.4rem">⚠️ Stock crítico</div>':""}
      <div style="font-size:.65rem; color:var(--grisMed); margin-bottom:.5rem">Costo unitario: ${fCOP(g.costo)}</div>
      <div class="stock-tallas">${badge(g.s,"S")}${badge(g.m,"M")}${badge(g.l,"L")}</div>
      <button class="btn-editar-stock" onclick="abrirModal('${encodeURIComponent(g.nombre)}','${encodeURIComponent(g.color)}',${g.s},${g.m},${g.l},${g.costo},'${encodeURIComponent(g.img)}')">✏ Configurar producto</button>
    </div>`).join("")||'<div class="loading">Sin productos</div>';
}

function chkStockBajo() {
  const bajos = stockData.filter(p=>p.stock<=2&&p.stock>0);
  const al = document.getElementById("alerta-stock-bajo");
  if (!al) return;
  if (bajos.length) {
    document.getElementById("alerta-stock-texto").textContent = `⚠️ Stock crítico (≤2 uds): ${[...new Set(bajos.map(p=>`${p.nombre} T${p.talla}`))].join(", ")}`;
    al.classList.add("visible");
  } else al.classList.remove("visible");
}

function abrirModal(nEnc,cEnc,s,m,l,costo,imgEnc) {
  const nombre=decodeURIComponent(nEnc), color=decodeURIComponent(cEnc), img = imgEnc ? decodeURIComponent(imgEnc) : '';
  stockEditTarget={nombre,color};
  document.getElementById("modal-titulo").textContent="Configurar Producto";
  document.getElementById("modal-sub").textContent=nombre + " · " + color;
  document.getElementById("modal-s").value=s;
  document.getElementById("modal-m").value=m;
  document.getElementById("modal-l").value=l;
  document.getElementById("modal-costo").value=costo||0;
  document.getElementById("modal-img").value=img;
  document.getElementById("modal-stock").classList.add("visible");
}
function cerrarModalStock() { document.getElementById("modal-stock").classList.remove("visible"); stockEditTarget=null; }
document.getElementById("modal-stock").addEventListener("click",e=>{if(e.target===document.getElementById("modal-stock"))cerrarModalStock();});

async function guardarStock() {
  if (!stockEditTarget) return;
  const {nombre,color}=stockEditTarget;
  const vals={S:parseInt(document.getElementById("modal-s").value)||0,M:parseInt(document.getElementById("modal-m").value)||0,L:parseInt(document.getElementById("modal-l").value)||0};
  const costo=parseInt(document.getElementById("modal-costo").value)||0;
  const img=document.getElementById("modal-img").value.trim();
  
  let err=0;
  for (const [talla,stock] of Object.entries(vals)) {
    // Intentar actualizar stock y metadatos. Si la columna costo_produccion no existe, dará error
    const {error}=await sb.from("productos").update({stock, costo_produccion: costo, imagen_url: img, updated_at:new Date().toISOString()}).eq("nombre",nombre).eq("color",color).eq("talla",talla);
    if(error) {
      // Fallback si no existen las columnas de costo/img en la base de datos (por si no han ejecutado migraciones)
      const {error: errFallback} = await sb.from("productos").update({stock, updated_at:new Date().toISOString()}).eq("nombre",nombre).eq("color",color).eq("talla",talla);
      if(errFallback) err++;
      else err = -1; // Flag para advertir de las columnas faltantes
    }
  }
  if(err > 0) mostrarToast("Error parcial al guardar","warn");
  else if(err === -1) { mostrarToast("Stock actualizado. (Falta correr script SQL para guardar costo/imagen)","warn"); cerrarModalStock(); cargarStock();
    cargarProduccion();
    cargarCotizaciones();
    cargarPauta(); }
  else { mostrarToast("Producto actualizado ✓","ok"); cerrarModalStock(); cargarStock();
    cargarProduccion();
    cargarCotizaciones();
    cargarPauta(); }
}

// ── POS
function filtrarSKUs() {
  const sel=document.getElementById("f-sku"); if(!sel)return;
  sel.innerHTML='<option value="">Seleccionar...</option>';
  [...new Set(stockData.map(s=>s.nombre))].sort().forEach(n=>{const o=document.createElement("option");o.value=n;o.textContent=n;sel.appendChild(o);});
}
function autoColor() {
  const nombre=document.getElementById("f-sku").value;
  const m=stockData.find(s=>s.nombre===nombre);
  if(m) document.getElementById("f-color").value=m.color;
  actualizarStockPreview();
}
function actualizarStockPreview() {
  const n=document.getElementById("f-sku").value,c=document.getElementById("f-color").value,t=document.getElementById("f-talla").value;
  const prev=document.getElementById("stock-preview"),nums=document.getElementById("stock-preview-nums");
  if(!n||!t){prev.style.display="none";return;}
  const m=stockData.find(s=>s.nombre===n&&(c?s.color.includes(c):true)&&s.talla===t);
  if(m){prev.style.display="block";const cl=m.stock===0?"talla-cero":m.stock<=2?"talla-bajo":"talla-ok";nums.innerHTML=`<div class="talla-badge ${cl}" style="padding:.3rem 1rem">${t}: <strong>${m.stock}</strong> uds</div>`;}
  else prev.style.display="none";
}
function checkEfectivo(){document.getElementById("efectivo-banner").classList.toggle("visible",document.getElementById("f-pago").value==="Efectivo");}

async function registrarVenta() {
  const nombre=document.getElementById("f-nombre").value.trim()||"Cliente POS";
  const telefono=document.getElementById("f-telefono").value.trim()||"N/A";
  const ciudad=document.getElementById("f-ciudad").value.trim()||"Venta Manual";
  const dir=document.getElementById("f-direccion").value.trim()||"N/A";
  const sku=document.getElementById("f-sku").value,color=document.getElementById("f-color").value.trim()||"-";
  const talla=document.getElementById("f-talla").value,cantidad=parseInt(document.getElementById("f-cantidad").value)||1;
  const valor=parseInt(document.getElementById("f-valor").value),pago=document.getElementById("f-pago").value;
  if(!sku||!talla||!valor||!pago){mostrarToast("Completa Prenda, Talla, Valor y Pago","err");return;}
  const items=[{nombre:sku,color,talla,qty:cantidad,price:valor}];
  const estado=pago==="Efectivo"?"Efectivo - Pendiente":"Pagado - "+pago;
  const {error}=await sb.from("pedidos").insert([{cliente_nombre:nombre,cliente_telefono:telefono,cliente_ciudad:ciudad,cliente_direccion:dir,items,total:valor,estado,drop_numero:"Admin POS"}]);
  if(error){mostrarToast("Error: "+error.message,"err");return;}
  await sb.rpc("decrementar_stock",{items});
  mostrarToast("Venta registrada ✓","ok");
  limpiarFormulario();cargarPedidos();cargarStock();
    cargarProduccion();
    cargarCotizaciones();
    cargarPauta();
}

function limpiarFormulario() {
  ["f-nombre","f-telefono","f-ciudad","f-direccion","f-color","f-valor"].forEach(id=>document.getElementById(id).value="");
  ["f-sku","f-talla","f-pago"].forEach(id=>document.getElementById(id).selectedIndex=0);
  document.getElementById("f-cantidad").value=1;
  document.getElementById("stock-preview").style.display="none";
  document.getElementById("efectivo-banner").classList.remove("visible");
}

// ── SUSCRIPTORAS
async function cargarSuscriptoras() {
  document.getElementById("tabla-suscriptoras").innerHTML='<tr><td colspan="6" class="loading">Cargando...</td></tr>';
  const {data,error}=await sb.rpc("admin_get_suscriptoras",{pin:adminPin});
  if(error){document.getElementById("tabla-suscriptoras").innerHTML=`<tr><td colspan="6" class="loading" style="color:var(--rojo)">Error: ${error.message}</td></tr>`;return;}
  todasSubs=data||[];
  filtrarSuscriptoras();
}
function filtrarSuscriptoras() {
  const buscar=(document.getElementById("filtro-sub-buscar")?.value||"").toLowerCase();
  const estado=document.getElementById("filtro-sub-estado")?.value||"";
  let f=[...todasSubs];
  if(buscar) f=f.filter(s=>(s.name||"").toLowerCase().includes(buscar)||(s.email||"").toLowerCase().includes(buscar));
  if(estado==="libre") f=f.filter(s=>!s.used);
  if(estado==="usado") f=f.filter(s=>s.used);
  renderSubs(f);
}
function renderSubs(subs) {
  document.getElementById("contador-subs").textContent=`Mostrando ${subs.length} de ${todasSubs.length} · Usados: ${todasSubs.filter(s=>s.used).length}`;
  if(!subs.length){document.getElementById("tabla-suscriptoras").innerHTML='<tr><td colspan="6" class="loading">Sin resultados</td></tr>';return;}
  document.getElementById("tabla-suscriptoras").innerHTML=subs.map(s=>{
    const fecha=new Date(s.created_at).toLocaleDateString("es-CO",{day:"2-digit",month:"2-digit",year:"2-digit"});
    const badge=s.used?'<span class="badge sub-badge-usado">Usado</span>':'<span class="badge sub-badge-libre">Disponible</span>';
    return`<tr><td>${s.name||""}</td><td>${s.email||""}</td><td>${s.phone||""}</td><td><code style="font-size:.75rem;background:var(--grisF);padding:2px 6px">${s.discount_code||""}</code></td><td>${badge}</td><td style="font-size:.75rem;color:var(--grisMed)">${fecha}</td></tr>`;
  }).join("");
}
function exportarSuscriptorasCSV() {
  if(!todasSubs.length){mostrarToast("Sin suscriptoras para exportar","warn");return;}
  const cols=["Nombre","Email","Teléfono","Código","Usado","Registro"];
  const rows=todasSubs.map(s=>[s.name,s.email,s.phone,s.discount_code,s.used?"Sí":"No",s.created_at].map(v=>`"${String(v||"").replace(/"/g,'""')}"`));
  descargarCSV([cols,...rows].map(r=>r.join(",")).join("\n"),`yossico-suscriptoras-${dHoy()}.csv`);
  mostrarToast("CSV exportado ✓","ok");
}

// ── UTILS
function fCOP(n){return"$"+parseInt(n||0).toLocaleString("es-CO");}
function dHoy(){return new Date().toISOString().slice(0,10);}
function descargarCSV(csv,nombre){const b=new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8;"});const u=URL.createObjectURL(b);const a=document.createElement("a");a.href=u;a.download=nombre;a.click();URL.revokeObjectURL(u);}
function mostrarToast(msg,tipo="ok"){const t=document.getElementById("toast");t.textContent=msg;t.className=`toast show toast-${tipo}`;setTimeout(()=>t.classList.remove("show"),3500);}

// ══════════════════════════════════════════════════════════
// 🔔 CAMPANA DE NOTIFICACIONES (polling cada 30s)
// ══════════════════════════════════════════════════════════
let notifInterval     = null;
let notificaciones    = [];  // historial de pedidos nuevos
let ultimoIdVisto     = null;  // ID del último pedido conocido al iniciar

function iniciarCampana() {
  document.getElementById("bell-wrap").style.display = "flex";
  // Guardar el ID del pedido más reciente como "punto de partida"
  if (todosPedidos.length > 0) {
    ultimoIdVisto = todosPedidos[0].created_at; // usamos fecha del más reciente
  }
  // Poll cada 30 segundos
  notifInterval = setInterval(pollPedidosNuevos, 30000);
}

async function pollPedidosNuevos() {
  const { data, error } = await sb.rpc("admin_get_pedidos", { pin: adminPin });
  if (error || !data) return;

  // Detectar pedidos nuevos (los que no estaban antes)
  const anteriores = new Set(todosPedidos.map(p => p.id));
  const nuevos = data.filter(p => !anteriores.has(p.id));

  if (nuevos.length > 0) {
    // Actualizar la lista global
    todosPedidos = data;
    actualizarResumen();
    aplicarFiltros();

    // Añadir al historial de notificaciones
    nuevos.forEach(p => notificaciones.unshift({ ...p, visto: false }));

    // Actualizar badge
    const noVistos = notificaciones.filter(n => !n.visto).length;
    actualizarBadge(noVistos);

    // Animar la campana
    animarCampana();

    // Sonido suave
    tocarSonido();

    // Renderizar el panel
    renderNotifPanel();
  }
}

function actualizarBadge(count) {
  const diasStock = calcularDiasStock(s.nombre, s.color, s.talla, s.stock);
      const badge = document.getElementById("bell-badge");
  if (count > 0) {
    badge.textContent = count > 9 ? "9+" : count;
    badge.style.display = "flex";
  } else {
    badge.style.display = "none";
  }
}

function animarCampana() {
  const btn = document.getElementById("bell-btn");
  btn.classList.remove("ring");
  void btn.offsetWidth; // forzar reflow para reiniciar animación
  btn.classList.add("ring");
  setTimeout(() => btn.classList.remove("ring"), 700);
}

function tocarSonido() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  } catch(e) { /* silencio si el navegador no lo soporta */ }
}

function toggleNotifPanel() {
  const panel = document.getElementById("notif-panel");
  const isOpen = panel.classList.contains("open");

  if (isOpen) {
    panel.classList.remove("open");
  } else {
    // Marcar todos como vistos al abrir
    notificaciones.forEach(n => n.visto = true);
    actualizarBadge(0);
    renderNotifPanel();
    panel.classList.add("open");
  }
}

// Cerrar panel al hacer clic fuera
document.addEventListener("click", e => {
  const wrap = document.getElementById("bell-wrap");
  if (wrap && !wrap.contains(e.target)) {
    document.getElementById("notif-panel")?.classList.remove("open");
  }
});

function renderNotifPanel() {
  const lista = document.getElementById("notif-lista");
  if (notificaciones.length === 0) {
    lista.innerHTML = '<div class="notif-empty">Sin notificaciones nuevas</div>';
    return;
  }

  lista.innerHTML = notificaciones.map(n => {
    const prendas = (n.items||[]).map(i => `${i.nombre||""} T${i.talla||""}`).join(", ") || "-";
    const hora = new Date(n.created_at).toLocaleTimeString("es-CO", { hour:"2-digit", minute:"2-digit" });
    const fecha = new Date(n.created_at).toLocaleDateString("es-CO", { day:"2-digit", month:"2-digit" });
    return `
      <div class="notif-item${!n.visto ? " nueva" : ""}" onclick="irAPedido('${n.id}')">
        <span class="ni-hora">${hora} · ${fecha}</span>
        <div class="ni-nombre">${n.cliente_nombre || "Cliente"}</div>
        <div class="ni-detalle">${prendas}</div>
        <div class="ni-total">${fCOP(n.total)}</div>
      </div>
    `;
  }).join("");
}

function irAPedido(id) {
  // Ir a la tab de pedidos y resaltar el pedido
  document.getElementById("notif-panel").classList.remove("open");
  document.querySelector('.tab-btn').click(); // ir a tab Pedidos
  document.getElementById("filtro-fecha").value = "todos";
  document.getElementById("filtro-estado").value = "";
  document.getElementById("filtro-buscar").value = "";
  aplicarFiltros();
}

function limpiarNotificaciones() {
  notificaciones = [];
  actualizarBadge(0);
  renderNotifPanel();
}

// ══════════════════════════════════════════════════════════
// 📊 ESTADÍSTICAS — Motor de gráficas con Chart.js
// ══════════════════════════════════════════════════════════
let charts = {}; // referencias a instancias de Chart.js para destruirlas al re-renderizar

const COLORES = {
  negro:   '#111111',
  verde:   '#2D6A4F',
  verdeCl: '#D8F0E4',
  azul:    '#1A5276',
  azulCl:  '#D6EAF8',
  naranja: '#CA6F1E',
  naranjaCl:'#FDEBD0',
  rojo:    '#C0392B',
  rojoCl:  '#FDECEA',
  gris:    '#E8E6E2',
};

// Hook en cambiarTab para activar stats (movido arriba)

function renderStats() {
  const dias = parseInt(document.getElementById('stats-periodo')?.value || '14');
  const ahora = new Date();
  const desde = dias === 0 ? new Date(0) : new Date(ahora.getTime() - dias * 86400000);

  const pedidosFiltrados = todosPedidos.filter(p => new Date(p.created_at) >= desde);

  renderKPIs(pedidosFiltrados);
  renderChartLinea(pedidosFiltrados, dias);
  renderChartEstados(pedidosFiltrados);
  renderChartPrendas(pedidosFiltrados);
  renderChartMetodos(pedidosFiltrados);
  renderIngresosProenda(pedidosFiltrados);
  renderStockCritico();
  renderFinanzas(pedidosFiltrados);
}

// ── KPIs ─────────────────────────────────────────────────
function renderKPIs(pedidos) {
  const pagados = pedidos.filter(p => esPagado(p.estado));
  const total   = pagados.reduce((s, p) => s + parseFloat(p.total || 0), 0);
  const ticket  = pagados.length ? total / pagados.length : 0;

  // Calcular Costos Estimados basados en stockData actual (costo_produccion)
  let costosTotales = 0;
  pagados.forEach(p => {
    (p.items || []).forEach(item => {
      const prodEnStock = stockData.find(s => s.nombre === item.nombre && s.color === item.color);
      const costoUnitario = prodEnStock && prodEnStock.costo_produccion ? parseFloat(prodEnStock.costo_produccion) : 0;
      costosTotales += costoUnitario * (item.qty || 1);
    });
  });
  const utilidad = total - costosTotales;

  document.getElementById('sk-ingresos').textContent     = fCOP(total);
  document.getElementById('sk-ingresos-sub').textContent = `${pagados.length} pedidos pagados`;
  document.getElementById('sk-utilidad').textContent     = fCOP(utilidad);
  document.getElementById('sk-pedidos').textContent      = pedidos.length;
  document.getElementById('sk-pedidos-sub').textContent  = `${pagados.length} pagados · ${pedidos.filter(p=>esPendiente(p.estado)).length} pendientes`;
  document.getElementById('sk-ticket').textContent       = fCOP(ticket);
  document.getElementById('sk-subs').textContent         = todasSubs.length;
}

// ── RENTABILIDAD & FINANZAS ──────────────────────────────
async function cargarGastos() {
  const { data, error } = await sb.from("gastos_operativos").select("*").order("fecha", { ascending: false });
  if (!error && data) todosGastos = data;
  renderGastosLista();
  if (todosPedidos.length) renderFinanzas(todosPedidos); // refresca rentabilidad total
}

function renderFinanzas(pedidos) {
  const pagados = pedidos.filter(p => esPagado(p.estado));
  const ingresosBrutos = pagados.reduce((s, p) => s + parseFloat(p.total || 0), 0);
  
  let costosTotalesProd = 0;
  const prendasRenta = {};

  pagados.forEach(p => {
    (p.items || []).forEach(item => {
      const key = `${item.nombre} · ${item.color}`;
      if (!prendasRenta[key]) prendasRenta[key] = { q:0, ingresos:0, costos:0 };
      
      // Usa el costo unitario congelado del pedido, o el del catálogo como fallback
      let costoUni = parseFloat(item.costo_unitario || 0);
      if (!costoUni) {
        const prodEnStock = stockData.find(s => s.nombre === item.nombre && s.color === item.color);
        costoUni = prodEnStock && prodEnStock.costo_produccion ? parseFloat(prodEnStock.costo_produccion) : 0;
      }
      
      const subIngreso = parseFloat(item.price || 0) * (item.qty || 1);
      const subCosto = costoUni * (item.qty || 1);
      
      prendasRenta[key].q += (item.qty || 1);
      prendasRenta[key].ingresos += subIngreso;
      prendasRenta[key].costos += subCosto;
      costosTotalesProd += subCosto;
    });
  });

  // Bug Fix #2: Los gastos operativos en Finanzas son SIEMPRE acumulados totales,
  // no filtrados por el período de la pestaña de Estadísticas.
  // todosGastos ya viene cargado con todos los registros desde cargarGastos().
  const sumGastos = todosGastos.reduce((acc, g) => acc + parseFloat(g.monto || 0), 0);
  const sumPauta = (window.todaPauta || []).reduce((acc, p) => acc + parseFloat(p.monto || 0), 0);
  const totalOpex = sumGastos + sumPauta;
  
  const costosTotales = costosTotalesProd + totalOpex;

  const utilidadNeta = ingresosBrutos - costosTotales;
  const margenNeto = ingresosBrutos > 0 ? ((utilidadNeta / ingresosBrutos) * 100).toFixed(1) : 0;
  
  // Margen Bruto Promedio (Sin OPEX)
  const utilidadBrutaTotal = ingresosBrutos - costosTotalesProd;
  let margenBrutoPromedio = ingresosBrutos > 0 ? (utilidadBrutaTotal / ingresosBrutos) : 0;

  // NUEVO: Análisis de Catálogo y Unit Economics (Precios estimados por el sistema)
  const pre = { "Kyoto": 275900, "Oslo": 339900, "Milan": 275900, "Core": 229900, "Sudadera": 159400 };
  const preciosEstimados = (nombre) => {
    for (let k in pre) { if(nombre.includes(k)) return pre[k]; }
    return 250000; // fallback
  };

  // Bug Fix #3: Calcular precio real promedio por prenda desde los pedidos históricos
  const preciosReales = {};
  todosPedidos.forEach(p => {
    (p.items || []).forEach(item => {
      if (!preciosReales[item.nombre]) preciosReales[item.nombre] = { suma: 0, q: 0 };
      if (item.price && parseFloat(item.price) > 0) {
        preciosReales[item.nombre].suma += parseFloat(item.price);
        preciosReales[item.nombre].q += 1;
      }
    });
  });
  const getPrecioReal = (nombre) => {
    const r = preciosReales[nombre];
    if (r && r.q > 0) return r.suma / r.q; // promedio de ventas reales
    return preciosEstimados(nombre); // fallback al hardcoded si no hay ventas
  };

  const modelosUnicos = {};
  stockData.forEach(s => {
    if (!modelosUnicos[s.nombre]) {
      const pVenta = getPrecioReal(s.nombre);
      const cProd = parseFloat(s.costo_produccion || 0);
      modelosUnicos[s.nombre] = { 
        precio: pVenta, 
        costo: cProd, 
        utilidad: pVenta - cProd,
        margen: pVenta > 0 ? ((pVenta - cProd) / pVenta) : 0,
        fuentePrecio: preciosReales[s.nombre]?.q > 0 ? 'real' : 'estimado'
      };
    }
  });

  // Margen promedio de catálogo como fallback si no hay ventas reales
  let margenCatalogoPromedio = 0;
  let sumaM = 0, countM = 0;
  Object.values(modelosUnicos).forEach(m => {
    if (m.margen > 0) { sumaM += m.margen; countM++; }
  });
  if (countM > 0) margenCatalogoPromedio = sumaM / countM;

  let mostrarNotaProyeccion = false;
  if (ingresosBrutos === 0) {
    margenBrutoPromedio = margenCatalogoPromedio; // Usamos el del catálogo para proyectar!
    mostrarNotaProyeccion = true;
  }

  document.getElementById('fin-ingresos').textContent = fCOP(ingresosBrutos);
  document.getElementById('fin-costos').textContent = fCOP(costosTotales);
  document.getElementById('fin-utilidad').textContent = fCOP(utilidadNeta);
  document.getElementById('fin-utilidad').style.color = utilidadNeta < 0 ? 'var(--rojo)' : 'var(--azul)';
  document.getElementById('fin-margen').textContent = `Margen Neto Global: ${margenNeto}%`;

  // --- Lógica de Punto de Equilibrio ---
  const beContainer = document.getElementById('fin-breakeven-container');
  const suContainer = document.getElementById('fin-success-container');
  
  if (utilidadNeta < 0) {
    beContainer.style.display = 'block';
    suContainer.style.display = 'none';
    
    const faltante = Math.abs(utilidadNeta);
    document.getElementById('fin-breakeven-monto').textContent = fCOP(faltante);
    
    let txtMargen = (margenBrutoPromedio * 100).toFixed(1);
    if(mostrarNotaProyeccion) txtMargen += " (Proyectado)";
    document.getElementById('fin-breakeven-margen').textContent = txtMargen;
    
    // Cuánto falta vender = Faltante / Margen Bruto
    let ventasNecesarias = 0;
    if (margenBrutoPromedio > 0) ventasNecesarias = faltante / margenBrutoPromedio;
    document.getElementById('fin-breakeven-ventas').textContent = fCOP(ventasNecesarias);
    
    // Unidades necesarias (Ticket promedio de la utilidad)
    let unidadesNecesarias = 0;
    const totalPrendasVendidas = Object.values(prendasRenta).reduce((acc, curr) => acc + curr.q, 0);
    
    if (totalPrendasVendidas > 0 && utilidadBrutaTotal > 0) {
      const utilidadBrutaPromedioPorPrenda = utilidadBrutaTotal / totalPrendasVendidas;
      unidadesNecesarias = Math.ceil(faltante / utilidadBrutaPromedioPorPrenda);
    } else {
      // Proyección basada en catálogo
      let sumU = 0, countU = 0;
      Object.values(modelosUnicos).forEach(m => {
        if(m.utilidad > 0) { sumU += m.utilidad; countU++; }
      });
      if(countU > 0) unidadesNecesarias = Math.ceil(faltante / (sumU / countU));
    }
    document.getElementById('fin-breakeven-unidades').textContent = unidadesNecesarias > 0 ? unidadesNecesarias : 'N/A';
    
    // Barra de progreso (Inversión Recuperada)
    let pctRecuperado = 0;
    if (totalOpex > 0 && utilidadBrutaTotal > 0) pctRecuperado = Math.min(100, Math.max(0, (utilidadBrutaTotal / totalOpex) * 100));
    document.getElementById('fin-breakeven-barra').style.width = pctRecuperado + '%';
    document.getElementById('fin-breakeven-progress-txt').textContent = pctRecuperado.toFixed(1) + '% de la inversión recuperada';
    
  } else if (totalOpex > 0 && utilidadNeta >= 0) {
    beContainer.style.display = 'none';
    suContainer.style.display = 'block';
  } else {
    beContainer.style.display = 'none';
    suContainer.style.display = 'none';
  }

  
  // --- Lógica Tabla Top Prendas (Histórico) ---
  const sorted = Object.entries(prendasRenta).sort((a,b) => (b[1].ingresos - b[1].costos) - (a[1].ingresos - a[1].costos));
  const tbody = document.getElementById('tabla-finanzas-prendas');
  if (!sorted.length) { tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--grisMed)">No hay datos de ventas pagadas para el período</td></tr>'; }
  else {
    tbody.innerHTML = sorted.map(([k, v]) => {
      const pUtilidad = v.ingresos - v.costos;
      const pMargen = v.ingresos > 0 ? ((pUtilidad / v.ingresos) * 100).toFixed(1) : 0;
      return `<tr>
        <td><strong>${k}</strong></td>
        <td style="text-align:center">${v.q}</td>
        <td style="text-align:right">${fCOP(v.ingresos)}</td>
        <td style="text-align:right;color:var(--naranja)">${fCOP(v.costos)}</td>
        <td style="text-align:right;font-size:0.75rem;">
          <span style="background:#e0f2e9;color:#2e7d32;padding:0.2rem 0.4rem;border-radius:4px;">${pMargen}%</span>
        </td>
        <td style="text-align:right;color:var(--verde);font-weight:600">${fCOP(pUtilidad)}</td>
      </tr>`;
    }).join('');
  }

  
  // --- Lógica Tabla Unit Economics (Catálogo) ---
  const tCat = document.getElementById('tabla-finanzas-catalogo');
  if(!Object.keys(modelosUnicos).length) tCat.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--grisMed)">Sin prendas en catálogo. Primero agrega productos en la pestaña Inventario y asígnales un costo de producción.</td></tr>';
  else {
    tCat.innerHTML = Object.entries(modelosUnicos).map(([nombre, m]) => {
      const mPct = (m.margen * 100).toFixed(1);
      const mColor = m.margen >= 0.5 ? '#2e7d32' : m.margen >= 0.3 ? '#e65100' : '#c62828';
      const mBg = m.margen >= 0.5 ? '#e0f2e9' : m.margen >= 0.3 ? '#fff3e0' : '#ffebee';
      const precioLabel = m.fuentePrecio === 'real' 
        ? `${fCOP(m.precio)} <span style="font-size:0.65rem;color:#2e7d32">(real)</span>` 
        : `${fCOP(m.precio)} <span style="font-size:0.65rem;color:var(--grisMed)">(est.)</span>`;
      return `<tr>
        <td><strong>${nombre}</strong></td>
        <td style="text-align:right">${precioLabel}</td>
        <td style="text-align:right;color:var(--naranja)">${fCOP(m.costo)}</td>
        <td style="text-align:right;color:var(--verde);font-weight:600">${fCOP(m.utilidad)}</td>
        <td style="text-align:right;font-size:0.75rem;"><span style="background:${mBg};color:${mColor};padding:0.2rem 0.4rem;border-radius:4px;font-weight:600">${mPct}%</span></td>
      </tr>`;
    }).join('');
  }
}

async function agregarGastoFijo() {
  const categoria = document.getElementById('opex-categoria').value.trim();
  const descripcion = document.getElementById('opex-desc').value.trim();
  const monto = parseFloat(document.getElementById('opex-monto').value);

  if (!categoria || !monto) { mostrarToast("Categoría y monto obligatorios", "err"); return; }

  const { error } = await sb.from('gastos_operativos').insert([{ categoria, descripcion, monto }]);
  if (error) { mostrarToast("Error al guardar: " + error.message, "err"); return; }
  
  mostrarToast("Gasto agregado ✓", "ok");
  document.getElementById('opex-categoria').value = '';
  document.getElementById('opex-desc').value = '';
  document.getElementById('opex-monto').value = '';
  cargarGastos();
}

function renderGastosLista() {
  const tbody = document.getElementById('tabla-gastos-operativos');
  if(!tbody) return; // Si no estamos en la tab, evitamos errores
  
  if (!todosGastos.length) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--grisMed)">No hay gastos registrados</td></tr>';
    return;
  }
  tbody.innerHTML = todosGastos.map(g => {
    return `<tr>
      <td style="font-size:0.7rem;color:var(--grisMed)">${g.fecha.split('T')[0]}</td>
      <td><strong>${g.categoria}</strong></td>
      <td>${g.descripcion || ''}</td>
      <td style="text-align:right;color:var(--rojo)">${fCOP(g.monto)}</td>
    </tr>`;
  }).join('');
}

function exportarFinanzasCSV() {
  const pagados = todosPedidos.filter(p => esPagado(p.estado));
  if (!pagados.length) { mostrarToast("No hay pedidos pagados para analizar", "warn"); return; }
  
  const prendasRenta = {};
  pagados.forEach(p => {
    (p.items || []).forEach(item => {
      const key = `${item.nombre} · ${item.color}`;
      if (!prendasRenta[key]) prendasRenta[key] = { q:0, ingresos:0, costos:0 };
      
      let costoUni = parseFloat(item.costo_unitario || 0);
      if (!costoUni) {
        const prodEnStock = stockData.find(s => s.nombre === item.nombre && s.color === item.color);
        costoUni = prodEnStock && prodEnStock.costo_produccion ? parseFloat(prodEnStock.costo_produccion) : 0;
      }

      prendasRenta[key].q += (item.qty || 1);
      prendasRenta[key].ingresos += parseFloat(item.price || 0) * (item.qty || 1);
      prendasRenta[key].costos += costoUni * (item.qty || 1);
    });
  });

  const cols = ["Prenda", "Cant. Vendida", "Ingresos Brutos Estimados", "Costo Produccion Directo", "Utilidad Producto", "Margen Bruto %"];
  const rows = Object.entries(prendasRenta).map(([k, v]) => {
    const pUtilidad = v.ingresos - v.costos;
    const margen = v.ingresos > 0 ? ((pUtilidad / v.ingresos) * 100).toFixed(1) : 0;
    return [k, v.q, v.ingresos, v.costos, pUtilidad, margen].map(val => `"${String(val).replace(/"/g,'""')}"`);
  });

  const csvContent = "\uFEFF" + [cols, ...rows].map(r => r.join(";")).join("\n");
  descargarCSV(csvContent, `yossico-rentabilidad-productos-${dHoy()}.csv`);
  mostrarToast("Reporte de rentabilidad exportado ✓", "ok");
}

// ── GRÁFICA LÍNEA: pedidos e ingresos por día ─────────────
function renderChartLinea(pedidos, dias) {
  const etiquetas = [];
  const contPedidos = [];
  const ingresos    = [];

  const hoy = new Date();
  const rango = dias === 0 ? 30 : dias; // si es histórico mostramos 30 días

  for (let i = rango - 1; i >= 0; i--) {
    const d = new Date(hoy);
    d.setDate(hoy.getDate() - i);
    const label = d.toLocaleDateString('es-CO', { day:'2-digit', month:'2-digit' });
    etiquetas.push(label);

    const del_dia = pedidos.filter(p => {
      const pd = new Date(p.created_at);
      return pd.toDateString() === d.toDateString();
    });
    contPedidos.push(del_dia.length);
    ingresos.push(del_dia.filter(p=>esPagado(p.estado)).reduce((s,p)=>s+parseFloat(p.total||0),0));
  }

  destruirChart('chart-linea');
  const ctx = document.getElementById('chart-linea')?.getContext('2d');
  if (!ctx) return;

  charts['chart-linea'] = new Chart(ctx, {
    type: 'line',
    data: {
      labels: etiquetas,
      datasets: [
        {
          label: 'Pedidos',
          data: contPedidos,
          borderColor: COLORES.negro,
          backgroundColor: 'rgba(17,17,17,.06)',
          borderWidth: 2,
          fill: true,
          tension: .35,
          pointRadius: 3,
          pointHoverRadius: 5,
          yAxisID: 'y',
        },
        {
          label: 'Ingresos (COP)',
          data: ingresos,
          borderColor: COLORES.verde,
          backgroundColor: 'rgba(45,106,79,.08)',
          borderWidth: 2,
          fill: true,
          tension: .35,
          pointRadius: 3,
          pointHoverRadius: 5,
          yAxisID: 'y1',
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: { legend: { display: true, position: 'top', labels: { font: { size: 10, family: 'Montserrat' }, boxWidth: 12, padding: 12 } } },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 9, family: 'Montserrat' }, maxRotation: 0 } },
        y: { position: 'left', grid: { color: '#F0EEE9' }, ticks: { font: { size: 9, family: 'Montserrat' }, stepSize: 1 }, title: { display: true, text: 'Pedidos', font: { size: 9, family: 'Montserrat' } } },
        y1: { position: 'right', grid: { display: false }, ticks: { font: { size: 9, family: 'Montserrat' }, callback: v => '$' + (v/1000).toFixed(0) + 'k' }, title: { display: true, text: 'Ingresos', font: { size: 9, family: 'Montserrat' } } },
      },
    },
  });
}

// ── GRÁFICA DONA: estados ─────────────────────────────────
function renderChartEstados(pedidos) {
  const grupos = { 'Pagado': 0, 'Pendiente': 0, 'Cancelado': 0 };
  pedidos.forEach(p => {
    if (esPagado(p.estado))    grupos['Pagado']++;
    else if (esCancelado(p.estado)) grupos['Cancelado']++;
    else grupos['Pendiente']++;
  });

  destruirChart('chart-estados');
  const ctx = document.getElementById('chart-estados')?.getContext('2d');
  if (!ctx) return;

  const labels = Object.keys(grupos);
  const vals   = Object.values(grupos);
  const colors = [COLORES.verde, COLORES.naranja, COLORES.rojo];

  charts['chart-estados'] = new Chart(ctx, {
    type: 'doughnut',
    data: { labels, datasets: [{ data: vals, backgroundColor: colors, borderWidth: 2, borderColor: '#fff', hoverOffset: 6 }] },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.raw}` } } },
      cutout: '65%',
    },
  });

  // Leyenda manual
  const leg = document.getElementById('chart-estados-leyenda');
  if (leg) {
    leg.innerHTML = labels.map((l, i) => `
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span style="display:flex;align-items:center;gap:.4rem">
          <span style="width:10px;height:10px;border-radius:50%;background:${colors[i]};display:inline-block"></span>${l}
        </span>
        <strong>${vals[i]}</strong>
      </div>`).join('');
  }
}

// ── GRÁFICA BARRAS HORIZONTALES: top prendas ─────────────
function renderChartPrendas(pedidos) {
  const conteo = {};
  pedidos.forEach(p => {
    (p.items || []).forEach(i => {
      const key = i.nombre || 'Sin nombre';
      conteo[key] = (conteo[key] || 0) + (i.qty || 1);
    });
  });

  const sorted = Object.entries(conteo).sort((a, b) => b[1] - a[1]).slice(0, 8);

  destruirChart('chart-prendas');
  const ctx = document.getElementById('chart-prendas')?.getContext('2d');
  if (!ctx) return;

  charts['chart-prendas'] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: sorted.map(([k]) => k.length > 22 ? k.slice(0, 22) + '…' : k),
      datasets: [{
        data: sorted.map(([,v]) => v),
        backgroundColor: COLORES.negro,
        borderRadius: 3,
        barThickness: 14,
      }],
    },
    options: {
      indexAxis: 'y',
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${ctx.raw} unidades` } } },
      scales: {
        x: { grid: { color: '#F0EEE9' }, ticks: { font: { size: 9, family: 'Montserrat' }, stepSize: 1 } },
        y: { grid: { display: false }, ticks: { font: { size: 9, family: 'Montserrat' } } },
      },
    },
  });
}

// ── GRÁFICA DONA: métodos de pago ────────────────────────
function renderChartMetodos(pedidos) {
  const conteo = {};
  pedidos.forEach(p => {
    const metodo = p.metodo_pago || 'WhatsApp';
    const label  = metodo.replace('whatsapp','WhatsApp').replace('wompi','Wompi');
    conteo[label] = (conteo[label] || 0) + 1;
  });

  const labels = Object.keys(conteo);
  const vals   = Object.values(conteo);
  const colors = [COLORES.negro, COLORES.verde, COLORES.azul, COLORES.naranja, COLORES.rojo];

  destruirChart('chart-metodos');
  const ctx = document.getElementById('chart-metodos')?.getContext('2d');
  if (!ctx) return;

  charts['chart-metodos'] = new Chart(ctx, {
    type: 'doughnut',
    data: { labels, datasets: [{ data: vals, backgroundColor: colors.slice(0,labels.length), borderWidth: 2, borderColor: '#fff', hoverOffset: 6 }] },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      cutout: '65%',
    },
  });

  const leg = document.getElementById('chart-metodos-leyenda');
  if (leg) {
    leg.innerHTML = labels.map((l, i) => `
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span style="display:flex;align-items:center;gap:.4rem">
          <span style="width:10px;height:10px;border-radius:50%;background:${colors[i]||'#ccc'};display:inline-block"></span>${l}
        </span>
        <strong>${vals[i]}</strong>
      </div>`).join('');
  }
}

// ── TABLA: ingresos por prenda ────────────────────────────
function renderIngresosProenda(pedidos) {
  const conteo = {};
  pedidos.filter(p => esPagado(p.estado)).forEach(p => {
    (p.items || []).forEach(i => {
      const key = i.nombre || 'Sin nombre';
      if (!conteo[key]) conteo[key] = { uds: 0, total: 0 };
      conteo[key].uds   += (i.qty || 1);
      conteo[key].total += (i.price || 0) * (i.qty || 1);
    });
  });

  const sorted = Object.entries(conteo).sort((a,b) => b[1].total - a[1].total);
  const maxVal = sorted[0]?.[1].total || 1;

  const el = document.getElementById('tabla-ingresos-prenda');
  if (!el) return;

  if (!sorted.length) { el.innerHTML = '<div class="loading">Sin datos en este período</div>'; return; }

  el.innerHTML = sorted.map(([nombre, { uds, total }]) => `
    <div class="stats-bar-row">
      <div class="stats-bar-label" title="${nombre}">${nombre}</div>
      <div class="stats-bar-track"><div class="stats-bar-fill" style="width:${Math.round(total/maxVal*100)}%"></div></div>
      <div class="stats-bar-val">${fCOP(total)} · <span style="color:var(--grisMed)">${uds} uds</span></div>
    </div>`).join('');
}

// ── LISTA: alertas de stock crítico ───────────────────────
function renderStockCritico() {
  const el = document.getElementById('lista-stock-critico');
  if (!el) return;

  const bajos   = stockData.filter(p => p.stock <= 2 && p.stock > 0);
  const agotado = stockData.filter(p => p.stock === 0);

  if (!bajos.length && !agotado.length) {
    el.innerHTML = '<div style="font-size:.8rem;color:var(--verde);padding:.5rem 0">✅ Todo el inventario en buen estado</div>';
    return;
  }

  el.innerHTML = [
    ...agotado.map(p => `
      <div class="stock-alert-row">
        <span>${p.nombre} · ${p.color} · T${p.talla}</span>
        <span style="background:var(--rojoCl);color:var(--rojo);font-size:.65rem;padding:2px 7px;font-weight:500">AGOTADO</span>
      </div>`),
    ...bajos.map(p => `
      <div class="stock-alert-row">
        <span>${p.nombre} · ${p.color} · T${p.talla}</span>
        <span style="background:var(--naranjaCl);color:var(--naranja);font-size:.65rem;padding:2px 7px;font-weight:500">${p.stock} unid.</span>
      </div>`),
  ].join('');
}

// ── Destruir chart anterior si existe ────────────────────
function destruirChart(id) {
  if (charts[id]) { charts[id].destroy(); delete charts[id]; }
}

// ══════════════════════════════════════════════════════════
// ➕ TAREA 3: Agregar nueva prenda al inventario
// ══════════════════════════════════════════════════════════
function toggleAgregarPrenda() {
  const form = document.getElementById('form-agregar-prenda');
  const icon = document.getElementById('toggle-agregar-icon');
  const visible = form.style.display !== 'none';
  form.style.display = visible ? 'none' : 'block';
  icon.textContent = visible ? '▼' : '▲';
}

async function crearPrenda() {
  const nombre = document.getElementById('np-nombre').value.trim();
  const color  = document.getElementById('np-color').value.trim();
  const stocks = {
    S: parseInt(document.getElementById('np-s').value) || 0,
    M: parseInt(document.getElementById('np-m').value) || 0,
    L: parseInt(document.getElementById('np-l').value) || 0,
  };
  if (!nombre || !color) { mostrarToast('Completa nombre y color', 'err'); return; }

  // Comprobar si ya existe una prenda con ese nombre+color
  const existe = stockData.some(p => p.nombre === nombre && p.color === color);
  if (existe) { mostrarToast('Ya existe una prenda con ese nombre y color', 'warn'); return; }

  const rows = ['S', 'M', 'L'].map(talla => ({ nombre, color, talla, stock: stocks[talla] }));
  const { error } = await sb.from('productos').insert(rows);
  if (error) { mostrarToast('Error: ' + error.message, 'err'); return; }

  mostrarToast('Prenda agregada ✓', 'ok');

  // Limpiar campos
  document.getElementById('np-nombre').value = '';
  document.getElementById('np-color').value  = '';
  document.getElementById('np-s').value = '0';
  document.getElementById('np-m').value = '0';
  document.getElementById('np-l').value = '0';

  // Cerrar formulario
  document.getElementById('form-agregar-prenda').style.display = 'none';
  document.getElementById('toggle-agregar-icon').textContent = '▼';

  // Recargar inventario
  cargarStock();
    cargarProduccion();
    cargarCotizaciones();
    cargarPauta();
}

// ══════════════════════════════════════════════════════════
// 📦 TAREA 4: Guardar guía de envío
// ══════════════════════════════════════════════════════════
async function guardarGuia(id) {
  const guia = document.getElementById('guia-' + id)?.value.trim();
  if (!guia) return;
  // Auto-detectar empresa por formato del número
  const empresa = (guia.startsWith('1') || guia.startsWith('0')) ? 'Coordinadora' : 'Servientrega';
  const { error } = await sb.rpc('admin_actualizar_envio', {
    p_id: id, p_guia: guia, p_empresa: empresa, pin: adminPin
  });
  if (error) { mostrarToast('Error: ' + error.message, 'err'); return; }
  mostrarToast('Guía guardada ✓', 'ok');
  const el = document.getElementById('empresa-' + id);
  if (el) el.textContent = '📦 ' + empresa;
}

// ── NOTAS INTERNAS
async function guardarNota(id) {
  const nota = document.getElementById('nota-' + id)?.value?.trim() || '';
  const { error } = await sb.rpc('admin_actualizar_nota', { p_id: id, p_nota: nota, pin: adminPin });
  if (error) mostrarToast('Error: ' + error.message, 'err');
  else mostrarToast('Nota guardada ✓', 'ok');
}

// ── DESCUENTOS (CREAR Y LISTAR)
async function crearDescuentoManual() {
  const nombre = document.getElementById('desc-nombre').value.trim();
  const tipo = document.getElementById('desc-tipo').value;
  const valor = parseFloat(document.getElementById('desc-pct').value) || 0;
  let codigo = document.getElementById('desc-codigo').value.trim().toUpperCase();

  if (!nombre) { mostrarToast('Ingresa un beneficiario', 'err'); return; }

  // Generar código automático si no se ingresó uno
  if (!codigo) {
    const prefijo = tipo === 'envio' ? 'ENVIO' : tipo === 'efectivo' ? 'EFEC' : 'PROMO';
    const sufijo = Array.from({length:4}, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random()*32)]).join('');
    codigo = `YOSSICO-${prefijo}-${sufijo}`;
  }

  // Verificar si ya existe el código
  const existe = todasSubs.some(s => s.discount_code === codigo);
  if (existe) { mostrarToast('Este código ya existe', 'err'); return; }

  // Insertar en Supabase
  const insertData = {
    name: nombre,
    discount_code: codigo,
    used: false,
    discount_type: tipo,
    discount_val: valor
  };

  const { error } = await sb.from('subscribers').insert([insertData]);

  if (error) {
    // Fallback por si no han corrido la migración SQL de discount_type/val
    if (error.message.includes('discount_type') || error.message.includes('column')) {
      const { error: err2 } = await sb.from('subscribers').insert([{
        name: nombre, discount_code: codigo, used: false
      }]);
      if (err2) { mostrarToast('Error al crear código: ' + err2.message, 'err'); return; }
      mostrarToast('Código básico creado (Falta SQL para tipos avanzados)', 'warn');
    } else {
      mostrarToast('Error al crear código: ' + error.message, 'err'); return;
    }
  }

  // Éxito
  document.getElementById('desc-nombre').value = '';
  document.getElementById('desc-codigo').value = '';
  document.getElementById('desc-resultado').style.display = 'block';
  document.getElementById('desc-codigo-texto').textContent = codigo;
  if (!error) mostrarToast('Código creado', 'ok');

  // Recargar la lista
  await cargarSuscriptoras();
  renderDescuentosLista();
}

function renderDescuentosLista() {
  const filtro = document.getElementById('filtro-desc-estado')?.value || 'todos';
  let filtrados = todasSubs.filter(s => s.discount_code); // Solo los que tengan código

  if (filtro === 'disponibles') filtrados = filtrados.filter(s => !s.used);
  if (filtro === 'usados') filtrados = filtrados.filter(s => s.used);

  const tbody = document.getElementById('tabla-descuentos');
  if (!tbody) return;

  if (filtrados.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="loading">No hay códigos</td></tr>';
    return;
  }

  tbody.innerHTML = filtrados.map(s => {
    return `<tr>
      <td>${s.name || '-'}</td>
      <td><code style="font-weight:600">${s.discount_code}</code></td>
      <td>
        ${s.used 
          ? '<span style="background:var(--grisCl);color:var(--grisMed);padding:2px 6px;border-radius:2px;font-size:.7rem">Usado</span>'
          : '<span style="background:var(--verdeCl);color:var(--verde);padding:2px 6px;border-radius:2px;font-size:.7rem">Disponible</span>'
        }
      </td>
      <td>
        ${!s.used 
          ? `<button class="btn btn-gris btn-sm" onclick="marcarDescuentoLista('${s.discount_code}')">Marcar Usado</button>`
          : '-'
        }
      </td>
    </tr>`;
  }).join('');
}

async function marcarDescuentoLista(codigo) {
  if (!confirm(`¿Marcar ${codigo} como usado?`)) return;
  const { error } = await sb.rpc('marcar_descuento_usado', { codigo });
  if (error) { mostrarToast('Error: ' + error.message, 'err'); return; }
  
  mostrarToast('Código marcado como usado', 'ok');
  await cargarSuscriptoras();
  renderDescuentosLista();
}

// ── CLIENTES (CRM)
window.todosClientes = null;

async function cargarClientes() {
  const tbody = document.getElementById('tabla-clientes');
  if (tbody) tbody.innerHTML = '<tr><td colspan="6" class="loading">Cargando clientes...</td></tr>';
  
  const { data, error } = await sb.rpc('admin_get_clientes', { pin: adminPin });
  if (error) {
    console.error(error);
    if (tbody) tbody.innerHTML = `<tr><td colspan="6" class="loading" style="color:var(--rojo)">Error: ${error.message}</td></tr>`;
    return;
  }
  
  window.todosClientes = data || [];
  
  // Calcular resumen
  const totalGasto = window.todosClientes.reduce((acc, c) => acc + parseFloat(c.total_gastado || 0), 0);
  const gastoPromedio = window.todosClientes.length ? totalGasto / window.todosClientes.length : 0;
  
  document.getElementById('clientes-resumen').textContent = 
    `${window.todosClientes.length} clientes · Gasto promedio: ${fCOP(gastoPromedio)}`;

  renderClientes();
}

function filtrarClientes() { renderClientes(); }

function renderClientes() {
  const query = (document.getElementById('filtro-cliente-buscar')?.value || '').toLowerCase();
  
  const filtrados = (window.todosClientes || []).filter(c => {
    return (c.cliente_nombre || '').toLowerCase().includes(query) ||
           (c.cliente_telefono || '').includes(query);
  });

  const tbody = document.getElementById('tabla-clientes');
  if (!tbody) return;

  if (filtrados.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="loading">Sin clientes encontrados</td></tr>';
    return;
  }

  // Max gasto para la barra
  const maxGastado = filtrados.length ? Math.max(...filtrados.map(c => parseFloat(c.total_gastado || 0))) : 1;

  tbody.innerHTML = filtrados.map(c => {
    const fecha = c.ultimo_pedido ? new Date(c.ultimo_pedido).toLocaleDateString("es-CO") : '-';
    const gastado = parseFloat(c.total_gastado || 0);
    const pct = Math.max(1, Math.round((gastado / maxGastado) * 100));

    return `<tr>
      <td><strong>${c.cliente_nombre || 'Sin nombre'}</strong></td>
      <td style="font-size:.75rem">
        ${c.cliente_telefono || ''}<br>
        <span style="color:var(--grisMed)">${c.cliente_email || ''}</span>
      </td>
      <td style="font-size:.75rem">${c.ciudades || '-'}</td>
      <td>${c.total_pedidos}</td>
      <td style="font-size:.75rem">${fecha}</td>
      <td>
        <div style="display:flex;align-items:center;gap:.5rem">
          <div style="flex:1;background:var(--grisCl);height:4px;border-radius:2px">
            <div style="background:var(--negro);height:100%;border-radius:2px;width:${pct}%"></div>
          </div>
          <strong style="font-size:.8rem">${fCOP(gastado)}</strong>
        </div>
      </td>
    </tr>`;
  }).join('');
}

// ── COTIZADOR B2B ─────────────────────────────────────────
function b2bAgregarItem() {
  const container = document.getElementById('b2b-items-container');
  const div = document.createElement('div');
  div.style.display = 'flex';
  div.style.gap = '0.5rem';
  div.innerHTML = `
    <input type="text" class="input-form b2b-item-sku" placeholder="SKU" style="width:90px;font-size:0.8rem">
    <input type="text" class="input-form b2b-item-desc" placeholder="Descripción de la prenda" style="flex:1;font-size:0.8rem">
    <input type="number" class="input-form b2b-item-qty" placeholder="Cant." value="1" min="1" style="width:70px;font-size:0.8rem">
    <input type="number" class="input-form b2b-item-price" placeholder="Precio COP" style="width:130px;font-size:0.8rem">
    <button class="btn btn-gris btn-sm" onclick="this.parentElement.remove()" style="padding:0 0.8rem;font-size:0.8rem">X</button>
  `;
  container.appendChild(div);
}


window.todasCotizaciones = [];
async function cargarCotizaciones() {
  const tbody = document.getElementById('tabla-cotizaciones');
  if(!tbody) return;
  const { data, error } = await sb.from('cotizaciones_b2b').select('*').order('created_at', { ascending: false });
  if (error) { tbody.innerHTML = `<tr><td colspan="6" class="loading">Error: ${error.message}</td></tr>`; return; }
  window.todasCotizaciones = data || [];
  renderCotizaciones();
}

function renderCotizaciones() {
  const tbody = document.getElementById('tabla-cotizaciones');
  if (window.todasCotizaciones.length === 0) { tbody.innerHTML = '<tr><td colspan="6" class="loading" style="text-align:center">No hay cotizaciones guardadas</td></tr>'; return; }
  
  tbody.innerHTML = window.todasCotizaciones.map(c => {
    let bdg = '<span style="background:#f4f4f4;color:var(--grisMed);padding:2px 6px;border-radius:4px;font-size:0.7rem">Borrador</span>';
    if(c.estado === 'Aprobada') bdg = '<span style="background:#e8f5e9;color:#2e7d32;padding:2px 6px;border-radius:4px;font-size:0.7rem">Aprobada (Pedido)</span>';
    return `<tr>
      <td><strong>#${c.serial || ''}</strong></td>
      <td>${c.cliente_nombre}</td>
      <td>${fCOP(c.total)}</td>
      <td>${new Date(c.created_at).toLocaleDateString()}</td>
      <td>${bdg}</td>
      <td>
        ${c.estado !== 'Aprobada' ? `<button class="btn btn-negro btn-sm" onclick="convertirCotizacionAPedido('${c.id}')">Aprobar a Pedido</button>` : '-'}
      </td>
    </tr>`;
  }).join('');
}

async function b2bGuardarCotizacion() {
  const cliente = document.getElementById('b2b-print-empresa').textContent;
  const nit = document.getElementById('b2b-print-nit').textContent;
  
  const trs = document.querySelectorAll('#b2b-print-tbody tr');
  const items = [];
  let subtotal = 0;
  
  trs.forEach(tr => {
    const tds = tr.querySelectorAll('td');
    if(tds.length >= 6) {
      const p = parseFloat(tds[4].textContent.replace(/[^0-9]/g, '')) || 0;
      const q = parseInt(tds[3].textContent) || 0;
      items.push({ sku: tds[0].textContent, nombre: tds[1].textContent, qty: q, price: p });
      subtotal += p * q;
    }
  });
  
  const total = subtotal * 1.19; // con IVA
  
  const { error } = await sb.from('cotizaciones_b2b').insert([{
    cliente_nombre: cliente, nit: nit, items: items, subtotal: subtotal, total: total
  }]);
  
  if(error) mostrarToast(error.message, 'err');
  else {
    mostrarToast("Cotización guardada", "ok");
    document.getElementById('b2b-print-controls').style.display = 'none';
    document.getElementById('b2b-form-area').style.display = 'block';
    cargarCotizaciones();
    cargarPauta();
  }
}

async function convertirCotizacionAPedido(id) {
  if(!confirm("¿Convertir esta cotización en un pedido real? Esto generará un pedido en estado Pagado y se reflejará en las finanzas y logística.")) return;
  const { error } = await sb.rpc('admin_convertir_cotizacion_a_pedido', { p_cotizacion_id: id, pin: adminPin });
  if (error) mostrarToast(error.message, 'err');
  else {
    mostrarToast("Convertido a pedido exitosamente ✓", "ok");
    cargarCotizaciones();
    cargarPauta();
    // Refresh pedidos
    const { data } = await sb.rpc("admin_get_pedidos", { pin: adminPin });
    if(data) todosPedidos = data;
    actualizarResumen();
    renderPedidos();
  }
}

function b2bGenerarImpresion() {
  const emp = document.getElementById('b2b-empresa').value || '[ NOMBRE EMPRESA ]';
  const nit = document.getElementById('b2b-nit').value || '[ NIT ]';
  const mail = document.getElementById('b2b-correo').value || '[ CORREO ]';
  let fecha = document.getElementById('b2b-fecha').value;
  if(!fecha) {
    const d = new Date();
    fecha = `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
  } else {
    const [y,m,d] = fecha.split('-');
    fecha = `${d}/${m}/${y}`;
  }

  document.getElementById('b2b-print-cliente').innerHTML = `${emp}<br>${nit}<br>${mail}`;
  document.getElementById('b2b-print-fecha').textContent = `[ ${fecha} ]`;

  const rows = document.getElementById('b2b-items-container').children;
  let html = '';
  let subtotal = 0;

  for(let i=0; i<rows.length; i++) {
    const r = rows[i];
    const sku = r.querySelector('.b2b-item-sku').value || '-';
    const desc = r.querySelector('.b2b-item-desc').value || '-';
    const qty = parseInt(r.querySelector('.b2b-item-qty').value) || 0;
    const price = parseFloat(r.querySelector('.b2b-item-price').value) || 0;
    const total = qty * price;
    subtotal += total;

    html += `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 0.6rem 1rem;">${sku}</td>
        <td style="padding: 0.6rem 1rem;">${desc}</td>
        <td style="padding: 0.6rem 1rem; text-align:center;">${qty}</td>
        <td style="padding: 0.6rem 1rem; text-align:right;">${fCOP(price)} COP</td>
        <td style="padding: 0.6rem 1rem; text-align:right;">${fCOP(total)} COP</td>
      </tr>
    `;
  }

  document.getElementById('b2b-print-tbody').innerHTML = html;
  
  const iva = subtotal * 0.19;
  const totalF = subtotal + iva;
  
  document.getElementById('b2b-print-sub').textContent = fCOP(subtotal) + ' COP';
  document.getElementById('b2b-print-iva').textContent = fCOP(iva) + ' COP';
  document.getElementById('b2b-print-tot').textContent = fCOP(totalF) + ' COP';

  document.getElementById('b2b-form-area').style.display = 'none';
  document.getElementById('b2b-print-view').style.display = 'block';
  document.getElementById('b2b-print-controls').style.display = 'flex';
}

// Inicializar B2B con un item vacío
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(b2bAgregarItem, 1000);
  
  // Theme logic
  if (localStorage.getItem('yossico_admin_theme') === 'dark') {
    document.body.classList.add('dark-mode');
    document.getElementById('theme-icon').innerHTML = '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="4.22" x2="19.78" y2="5.64"></line>';
  }
});

function toggleTheme() {
  const isDark = document.body.classList.toggle('dark-mode');
  const icon = document.getElementById('theme-icon');
  if (isDark) {
    localStorage.setItem('yossico_admin_theme', 'dark');
    icon.innerHTML = '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="4.22" x2="19.78" y2="5.64"></line>';
  } else {
    localStorage.setItem('yossico_admin_theme', 'light');
    icon.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>';
  }
}
window.todaPauta = [];
async function cargarPauta() {
  const { data, error } = await sb.from("gastos_pauta").select("*").order("fecha", { ascending: false });
  if(!error && data) window.todaPauta = data;
  renderPautaLista();
}
let chartPautaHist = null; let chartPautaPie = null;
function renderPautaLista() {
  const tbody = document.getElementById("tabla-pauta");
  if(!tbody) return;
  if((window.todaPauta || []).length === 0) { 
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--grisMed)">No hay registros de pauta. Registra tu primera campaña arriba.</td></tr>'; 
    return; 
  }
  
  let sum = 0;
  const platData = {};
  
  tbody.innerHTML = window.todaPauta.map(p => {
    const m = parseFloat(p.monto||0);
    sum += m;
    platData[p.plataforma] = (platData[p.plataforma] || 0) + m;
    
    const bdg = p.plataforma.includes('Meta') ? '<span style="background:#e3f2fd;color:#1565c0;padding:2px 6px;border-radius:4px;font-size:0.7rem">Meta</span>' : 
                p.plataforma.includes('TikTok') ? '<span style="background:#000;color:#fff;padding:2px 6px;border-radius:4px;font-size:0.7rem">TikTok</span>' : 
                p.plataforma.includes('Google') ? '<span style="background:#fff3e0;color:#e65100;padding:2px 6px;border-radius:4px;font-size:0.7rem">Google</span>' : 
                `<span style="background:#f4f4f4;color:#666;padding:2px 6px;border-radius:4px;font-size:0.7rem">${p.plataforma}</span>`;
    return `<tr>
      <td>${new Date(p.fecha).toLocaleDateString()}</td>
      <td>${bdg}</td>
      <td><strong>${p.campana || '-'}</strong></td>
      <td>${p.objetivo}</td>
      <td style="text-align:right; font-weight:bold">${fCOP(m)}</td>
    </tr>`;
  }).join('');
  
  // Calculate ROAS, CAC, % sobre ventas
  const pagados = window.todosPedidos ? window.todosPedidos.filter(p => esPagado(p.estado)) : [];
  const ingresosTotales = pagados.reduce((s, p) => s + parseFloat(p.total || 0), 0);
  const totalClientes = window.todosClientes ? window.todosClientes.length : pagados.length;
  
  const roas = sum > 0 ? (ingresosTotales / sum).toFixed(1) : 0;
  const cac = totalClientes > 0 ? (sum / totalClientes) : 0;
  const pctVentas = ingresosTotales > 0 ? ((sum / ingresosTotales) * 100).toFixed(1) : 0;
  
  document.getElementById('pt-kpi-inv').textContent = fCOP(sum);
  document.getElementById('pt-kpi-roas').textContent = roas + 'x';
  document.getElementById('pt-kpi-cac').textContent = fCOP(cac);
  document.getElementById('pt-kpi-pct').textContent = pctVentas + '%';
  document.getElementById('pauta-total-acumulado').textContent = 'Acumulado: ' + fCOP(sum);

  // Render Charts
  const ctxPie = document.getElementById('chart-pauta-pie')?.getContext('2d');
  if(ctxPie) {
    if(chartPautaPie) chartPautaPie.destroy();
    chartPautaPie = new Chart(ctxPie, {
      type: 'doughnut',
      data: {
        labels: Object.keys(platData),
        datasets: [{ data: Object.values(platData), backgroundColor: ['#1976d2', '#e53935', '#43a047', '#ffb300', '#8e24aa'] }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { boxWidth: 12 } } } }
    });
  }
  
  const ctxHist = document.getElementById('chart-pauta-hist')?.getContext('2d');
  if(ctxHist) {
    if(chartPautaHist) chartPautaHist.destroy();
    
    // Group by month
    const histData = {};
    window.todaPauta.forEach(p => {
      const mes = new Date(p.fecha).toLocaleDateString('es-CO', {month:'short', year:'numeric'});
      histData[mes] = (histData[mes] || 0) + parseFloat(p.monto||0);
    });
    
    chartPautaHist = new Chart(ctxHist, {
      type: 'bar',
      data: {
        labels: Object.keys(histData).reverse(),
        datasets: [{ label: 'Inversión Total', data: Object.values(histData).reverse(), backgroundColor: '#ff9800', borderRadius: 4 }]
      },
      options: { 
        responsive: true, maintainAspectRatio: false, 
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { callback: function(value) { return '$' + (value/1000).toFixed(0) + 'k'; } } } }
      }
    });
  }
}
async function guardarPauta() {
  const plat = document.getElementById('pt-plataforma').value;
  const obj = document.getElementById('pt-objetivo').value;
  const mon = parseFloat(document.getElementById('pt-monto').value);
  const camp = document.getElementById('pt-campana').value.trim();
  if(!mon || !camp) { mostrarToast("Llena monto y campaña", "warn"); return; }
  
  const { error } = await sb.from('gastos_pauta').insert([{ plataforma: plat, objetivo: obj, monto: mon, campana: camp }]);
  if(error) mostrarToast(error.message, 'err');
  else {
    mostrarToast("Pauta registrada", "ok");
    document.getElementById('pt-monto').value = ''; document.getElementById('pt-campana').value = '';
    cargarPauta();
    // Refrescar finanzas para integrar costo
    if (document.getElementById("tab-finanzas").classList.contains("active")) cargarGastos();
  }
}


let chartSim = null;
function actualizarSimulador(pctStr) {
  const pct = parseInt(pctStr) / 100;
  document.getElementById('sim-slider-val').textContent = pctStr + '%';
  
  if(!stockData || stockData.length === 0) return;
  
  // Re-use logic for getting real prices
  const preciosReales = {};
  todosPedidos.forEach(p => {
    (p.items || []).forEach(item => {
      if (!preciosReales[item.nombre]) preciosReales[item.nombre] = { suma: 0, q: 0 };
      if (item.price && parseFloat(item.price) > 0) {
        preciosReales[item.nombre].suma += parseFloat(item.price);
        preciosReales[item.nombre].q += 1;
      }
    });
  });
  
  const getP = (nombre) => {
    const r = preciosReales[nombre];
    if (r && r.q > 0) return r.suma / r.q;
    // Hardcoded fallback logic directly here as it's self-contained
    const pr = { "Kyoto": 275900, "Oslo": 339900, "Milan": 275900, "Core": 229900, "Sudadera": 159400, "KYOTO":275900, "OSLO":339900, "MILAN":275900 };
    for (let k in pr) { if(nombre.includes(k)) return pr[k]; }
    return 250000;
  };
  
  let totalVentas = 0;
  let totalCostos = 0;
  
  // Group by model for the chart
  const modelStats = {};
  
  stockData.forEach(s => {
    if (s.stock > 0) {
      const udsSimuladas = s.stock * pct;
      if (udsSimuladas > 0) {
        const precio = getP(s.nombre);
        const costo = parseFloat(s.costo_produccion || 0);
        const ventasItem = precio * udsSimuladas;
        const costosItem = costo * udsSimuladas;
        
        totalVentas += ventasItem;
        totalCostos += costosItem;
        
        if (!modelStats[s.nombre]) modelStats[s.nombre] = { ventas:0, utilidad:0 };
        modelStats[s.nombre].ventas += ventasItem;
        modelStats[s.nombre].utilidad += (ventasItem - costosItem);
      }
    }
  });
  
  document.getElementById('sim-ventas').textContent = fCOP(totalVentas);
  document.getElementById('sim-costos').textContent = fCOP(totalCostos);
  document.getElementById('sim-utilidad').textContent = fCOP(totalVentas - totalCostos);
  
  // Update Unidades Totales
  const udsTotal = stockData.reduce((acc, s) => acc + (s.stock * pct), 0);
  document.getElementById('sim-ventas-uds').textContent = udsTotal.toFixed(1) + ' unidades';

  // Lógica de Distribución (Diapositiva)
  const neta = totalVentas - totalCostos;
  const retornoInput = parseFloat(document.getElementById('dist-retorno-input')?.value || 0);
  let postRetorno = neta - retornoInput;
  if (postRetorno < 0) postRetorno = 0; // Previene repartir negativos si no se cubre el retorno

  // Step 1 a 5
  if(document.getElementById('dist-ingresos')) document.getElementById('dist-ingresos').textContent = fCOP(totalVentas);
  if(document.getElementById('dist-costos')) document.getElementById('dist-costos').textContent = fCOP(totalCostos);
  if(document.getElementById('dist-neta')) document.getElementById('dist-neta').textContent = fCOP(neta);
  if(document.getElementById('dist-post')) document.getElementById('dist-post').textContent = fCOP(postRetorno);

  // División 30 / 70
  const reinversion = postRetorno * 0.30;
  const repartible = postRetorno * 0.70;
  
  if(document.getElementById('dist-reinv-total')) {
    document.getElementById('dist-reinv-total').textContent = fCOP(reinversion);
    document.getElementById('dist-reinv-ped').textContent = fCOP(reinversion * 0.80);
    document.getElementById('dist-reinv-op').textContent = fCOP(reinversion * 0.20);
    
    document.getElementById('dist-rep-total').textContent = fCOP(repartible);
    document.getElementById('dist-rep-nico').textContent = fCOP(repartible * 0.70);
    document.getElementById('dist-rep-socio').textContent = fCOP(repartible * 0.30);
  }

  
  // Render Chart
  const labels = Object.keys(modelStats);
  const dataVentas = labels.map(l => modelStats[l].ventas);
  const dataUtilidad = labels.map(l => modelStats[l].utilidad);
  
  if(chartSim) { chartSim.destroy(); }
  const ctx = document.getElementById('chart-simulador').getContext('2d');
  chartSim = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        { label: 'Ingresos Proyectados', data: dataVentas, backgroundColor: '#1976d2', borderRadius: 4 },
        { label: 'Utilidad Neta Esperada', data: dataUtilidad, backgroundColor: '#43a047', borderRadius: 4 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.dataset.label;
              const value = context.raw;
              const modelName = context.label;
              // Calculate units for this model using stored modelStats
              const stats = modelStats[modelName];
              let udsLabel = '';
              if (stats && stats.ventas > 0) {
                const udsModelo = stockData
                  .filter(s => s.nombre === modelName && s.stock > 0)
                  .reduce((acc, s) => acc + (s.stock * pct), 0);
                if (udsModelo > 0) udsLabel = ` (${udsModelo.toFixed(0)} uds)`;
              }
              return label + ': $' + value.toLocaleString('es-CO') + udsLabel;
            }
          }
        }
      },
      scales: { y: { beginAtZero: true, ticks: { callback: function(value) { return '$' + (value/1000000).toFixed(1) + 'M'; } } } }
    }
  });
}



