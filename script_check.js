
// ── PRODUCT ANALYTICS ──
function renderProductAnalytics(pedidos) {
  const modelMap = {};
  const colorMap = {};
  let totalUds = 0;
  
  pedidos.filter(p => esPagado(p.estado)).forEach(p => {
    (p.items || []).forEach(i => {
      const mod = (i.nombre || 'Desconocido').toUpperCase().trim();
      const col = (i.color || '-').toUpperCase().trim();
      const q = parseInt(i.qty || 1);
      
      modelMap[mod] = (modelMap[mod] || 0) + q;
      if (col !== '-' && col !== '') colorMap[col] = (colorMap[col] || 0) + q;
      totalUds += q;
    });
  });
  
  const buildHTML = (map) => {
    const sorted = Object.entries(map).sort((a,b) => b[1] - a[1]).slice(0, 6);
    if (sorted.length === 0) return '<div class="loading">Sin datos</div>';
    
    return sorted.map(t => {
      const pct = totalUds > 0 ? ((t[1] / totalUds) * 100).toFixed(1) : 0;
      return `
        <div style="margin-bottom:1rem;">
          <div style="display:flex; justify-content:space-between; font-size:0.75rem; margin-bottom:0.4rem;">
            <span style="font-weight:600; color:#333">${t[0]}</span>
            <span style="color:var(--grisMed)">${t[1]} uds (${pct}%)</span>
          </div>
          <div style="width:100%; height:6px; background:var(--grisF); border-radius:3px; overflow:hidden;">
            <div style="height:100%; width:${pct}%; background:#263238;"></div>
          </div>
        </div>
      `;
    }).join('');
  };
  
  const elMod = document.getElementById('stats-top-modelos');
  const elCol = document.getElementById('stats-top-colores');
  if(elMod) elMod.innerHTML = buildHTML(modelMap);
  if(elCol) elCol.innerHTML = buildHTML(colorMap);
}

// ── EMBAJADORAS & GIFTCARDS ──
function renderEmbajadorasYGc() {
  if (!window.todasSubs) return;
  
  const embajadoras = todasSubs.filter(s => s.name && s.name.startsWith('EMBAJADORA|'));
  const giftcards = todasSubs.filter(s => s.name && s.name.startsWith('GIFTCARD|'));
  
  const tbEmb = document.getElementById('tabla-embajadoras');
  if (tbEmb) {
    if (embajadoras.length === 0) tbEmb.innerHTML = '<tr><td colspan="5" class="loading">No hay embajadoras activas</td></tr>';
    else {
      const usosPorCodigo = {};
      (window.todosPedidos || []).filter(p => esPagado(p.estado)).forEach(p => {
        if (p.codigo_descuento) {
          const c = p.codigo_descuento.toUpperCase().trim();
          usosPorCodigo[c] = (usosPorCodigo[c] || 0) + 1;
        }
      });
      
      tbEmb.innerHTML = embajadoras.map(e => {
        const parts = e.name.split('|');
        const realName = parts[1] || 'Sin Nombre';
        const usos = usosPorCodigo[(e.discount_code||'').toUpperCase().trim()] || 0;
        const saldo = usos * 15000; 
        
        return `<tr>
          <td><strong>${realName}</strong></td>
          <td><code style="background:#e8f5e9;color:#2e7d32;padding:0.3rem 0.6rem;border-radius:4px;font-size:0.75rem">${e.discount_code}</code></td>
          <td>${usos} referidos</td>
          <td><strong style="color:var(--verde)">${fCOP(saldo)}</strong></td>
          <td><button class="btn-gris btn-sm" style="font-size:0.65rem;border:1px solid var(--rojo);color:var(--rojo)" onclick="eliminarSub('${e.discount_code}')">Eliminar</button></td>
        </tr>`;
      }).join('');
    }
  }

  const tbGc = document.getElementById('tabla-giftcards');
  if (tbGc) {
    if (giftcards.length === 0) tbGc.innerHTML = '<tr><td colspan="5" class="loading">No hay Gift Cards emitidas</td></tr>';
    else {
      tbGc.innerHTML = giftcards.map(g => {
        const parts = g.name.split('|');
        const valor = parseFloat(parts[1] || 0);
        const owner = parts[2] || 'Sin Propietario';
        const statusBadge = g.used 
            ? `<span style="background:#f4f4f4;color:#757575;padding:0.2rem 0.6rem;font-size:0.65rem;border-radius:12px;font-weight:600">Gastada</span>` 
            : `<span style="background:#e3f2fd;color:#1976d2;padding:0.2rem 0.6rem;font-size:0.65rem;border-radius:12px;font-weight:600">Disponible</span>`;
            
        return `<tr>
          <td>${owner}</td>
          <td><code style="background:#fce4ec;color:#c2185b;padding:0.3rem 0.6rem;border-radius:4px;font-size:0.75rem">${g.discount_code}</code></td>
          <td><strong>${fCOP(valor)}</strong></td>
          <td>${statusBadge}</td>
          <td><button class="btn-gris btn-sm" style="font-size:0.65rem;border:1px solid var(--rojo);color:var(--rojo)" onclick="eliminarSub('${g.discount_code}')">Eliminar</button></td>
        </tr>`;
      }).join('');
    }
  }
}

window.crearEmbajadora = async function() {
  const nombre = prompt("Nombre de la Embajadora (Ej. Camila Rojas):");
  if (!nombre) return;
  const codigo = prompt("Código que usará para referir (Ej. CAMILA10):");
  if (!codigo) return;

  const slug = codigo.toLowerCase().replace(/[^a-z0-9]/g, '');
  const placeholderEmail = `embajadora.${slug}@yossico.internal`;

  const payload = {
    name: `EMBAJADORA|${nombre}`,
    email: placeholderEmail,
    discount_code: codigo.toUpperCase().trim(),
    used: false
  };
  
  const { error } = await sb.from('subscribers').insert([payload]);
  if (error) mostrarToast("Error: " + error.message, "err");
  else {
    mostrarToast("Embajadora creada ✓", "ok");
    cargarSuscriptoras();
  }
};

window.crearGiftcard = async function() {
  const monto = prompt("Valor de la Gift Card en COP (Ej. 250000):");
  if (!monto || isNaN(monto)) return;
  const owner = prompt("¿Para quién es o motivo? (Ej. Devolución María Pérez):");
  if (!owner) return;
  
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const codigo = `GC-${monto.substring(0, 2)}${randomSuffix}`;
  const placeholderEmail = `giftcard.${codigo.toLowerCase().replace(/[^a-z0-9]/g, '')}@yossico.internal`;

  const payload = {
    name: `GIFTCARD|${monto}|${owner}`,
    email: placeholderEmail,
    discount_code: codigo,
    used: false
  };
  
  const { error } = await sb.from('subscribers').insert([payload]);
  if (error) mostrarToast("Error: " + error.message, "err");
  else {
    prompt("Gift Card creada con éxito. Copia este código y envíaselo al cliente:", codigo);
    cargarSuscriptoras();
  }
};


// ── METAS DEL MES Y PACING ──
function renderMetaMensual() {
  const goalStr = localStorage.getItem('yossico_meta_mensual') || '30000000';
  const goal = parseFloat(goalStr);
  
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const currentDay = now.getDate();

  let ventasMes = 0;
  (todosPedidos || []).filter(p => esPagado(p.estado)).forEach(p => {
    const d = new Date(p.created_at);
    if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
      ventasMes += parseFloat(p.total || 0);
    }
  });

  const mGoalTxt = document.getElementById('meta-goal-text');
  const mCurTxt = document.getElementById('meta-current-text');
  if(mGoalTxt) mGoalTxt.textContent = fCOP(goal);
  if(mCurTxt) mCurTxt.textContent = fCOP(ventasMes);

  let pct = (ventasMes / goal) * 100;
  if (pct > 100) pct = 100;
  const pb = document.getElementById('meta-progress-bar');
  if(pb) pb.style.width = pct + '%';

  if (currentDay > 0) {
    const dailyRate = ventasMes / currentDay;
    const projected = dailyRate * daysInMonth;
    const projPct = (projected / goal) * 100;
    
    const pm = document.getElementById('meta-pacing-marker');
    if(pm) {
      pm.style.display = 'block';
      pm.style.left = Math.min(projPct, 100) + '%';
    }

    const pText = document.getElementById('meta-pacing-text');
    if(pText) {
      if (projected >= goal) {
        pText.innerHTML = `🚀 Vas a buen ritmo. Proyección a cierre: <strong>${fCOP(projected)}</strong>`;
        pText.style.color = '#2e7d32';
      } else {
        pText.innerHTML = `⚠️ A este ritmo cerrarás en <strong>${fCOP(projected)}</strong>. Faltan ${fCOP(goal - projected)}`;
        pText.style.color = '#e65100';
      }
    }
  }
}

window.editarMetaMensual = function() {
  const current = localStorage.getItem('yossico_meta_mensual') || '30000000';
  const res = prompt('Ingresa la meta de ventas para este mes (solo números, sin puntos):', current);
  if (res && !isNaN(res)) {
    localStorage.setItem('yossico_meta_mensual', res);
    renderMetaMensual();
  }
};

// ── INTELIGENCIA DE PRODUCCIÓN ──
let prodDist = { S: 0, M: 0, L: 0, total: 0 };
function analizarTallasHistoricas() {
  prodDist = { S: 0, M: 0, L: 0, total: 0 };
  (todosPedidos || []).filter(p => esPagado(p.estado)).forEach(p => {
    (p.items || []).forEach(i => {
      const t = (i.talla || '').toUpperCase();
      const q = parseInt(i.qty || 1);
      if (t === 'S' || t === 'M' || t === 'L') {
        prodDist[t] += q;
        prodDist.total += q;
      }
    });
  });

  if (prodDist.total > 0) {
    ['S', 'M', 'L'].forEach(t => {
      const pct = (prodDist[t] / prodDist.total) * 100;
      const elPct = document.getElementById('prod-pct-' + t.toLowerCase());
      const elBar = document.getElementById('prod-bar-' + t.toLowerCase());
      if(elPct) elPct.textContent = pct.toFixed(1) + '%';
      if(elBar) elBar.style.width = pct + '%';
    });
  }
  calcularLoteProduccion();
}

window.calcularLoteProduccion = function() {
  const loteStr = document.getElementById('prod-calc-input');
  if(!loteStr) return;
  const lote = parseInt(loteStr.value) || 0;
  if (prodDist.total > 0) {
    ['S', 'M', 'L'].forEach(t => {
      const amount = Math.round((prodDist[t] / prodDist.total) * lote);
      const elVal = document.getElementById('prod-calc-' + t.toLowerCase());
      if(elVal) elVal.textContent = amount;
    });
  }
};

// ── ALERTAS CRM (RECOMPRA) ──
function renderAlertasCRM(clientes) {
  const container = document.getElementById('crm-recompra-container');
  const list = document.getElementById('crm-recompra-list');
  if (!container || !list) return;

  const now = new Date();
  const opportunities = [];

  clientes.forEach(c => {
    if (c.ultimo_pedido) {
      const last = new Date(c.ultimo_pedido);
      const diffDays = Math.floor((now - last) / (1000 * 60 * 60 * 24));
      if (diffDays >= 90 && diffDays <= 180) { // Extended to 6 months to catch more
        opportunities.push({ ...c, diffDays });
      }
    }
  });

  if (opportunities.length > 0) {
    opportunities.sort((a,b) => b.total_gastado - a.total_gastado);
    list.innerHTML = opportunities.map(c => {
      const telStr = c.cliente_telefono ? c.cliente_telefono.replace(/[^0-9]/g, '') : '';
      const msg = encodeURIComponent(`Hola ${c.cliente_nombre.split(' ')[0]}, ¿cómo están tus scrubs YOSSICO? Hace unos meses compraste y nos acaba de llegar la nueva colección. ¡Te dejo un detalle especial si quieres renovar!`);
      const wpLink = telStr ? `https://wa.me/57${telStr}?text=${msg}` : '#';
      
      return `<div style="background:#fff; border:1px solid #ffcc80; padding:0.8rem; border-radius:6px; min-width:220px; flex-shrink:0;">
        <div style="font-weight:600; font-size:0.85rem; margin-bottom:0.2rem;">${c.cliente_nombre}</div>
        <div style="font-size:0.75rem; color:var(--grisMed); margin-bottom:0.6rem;">Compró hace ${c.diffDays} días</div>
        <a href="${wpLink}" target="_blank" style="display:inline-block; background:#25D366; color:#fff; text-decoration:none; padding:0.3rem 0.6rem; border-radius:4px; font-size:0.75rem; font-weight:600;">Escribir WhatsApp</a>
      </div>`;
    }).join('');
    container.style.display = 'block';
  } else {
    container.style.display = 'none';
  }
}


function cambiarSubTabFinanzas(tabId, btn) {
  document.querySelectorAll('.fin-subtab-content').forEach(el => el.classList.remove('active'));
  document.getElementById(tabId).classList.add('active');
  
  const nav = btn.closest('div');
  nav.querySelectorAll('.subtab-btn').forEach(el => el.classList.remove('active'));
  btn.classList.add('active');
}

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
    cargarGastos();
    if(window.todosPedidos) renderFinanzas(window.todosPedidos);
    actualizarSimulador(document.getElementById('sim-slider')?.value || 100);
  } else if (tab === 'embajadoras' || tab === 'giftcards') {
    if (!window.todasSubs || window.todasSubs.length === 0) cargarSuscriptoras();
    else renderEmbajadorasYGc();
  } else if (tab === 'envios') {
    renderEnvios();
  } else if (tab === 'drop') {
    renderDropStatus();
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
                             <button onclick="enviarGuiaWA('${p.id}')" style="background:#e3f2fd;color:#1565c0;border:1px solid #bbdefb;padding:0.25rem 0.5rem;font-size:0.6rem;cursor:pointer;border-radius:2px;">WhatsApp</button>
                             ${!(p.estado||'').toLowerCase().includes('entregado') ? `<button onclick="marcarEntregado('${p.id}')" style="background:#e8f5e9;color:#2e7d32;border:1px solid #c8e6c9;padding:0.25rem 0.5rem;font-size:0.6rem;cursor:pointer;border-radius:2px;margin-top:2px;">✓ Entregado</button>` : ''}` : ''}
        </div>
      </td>
    </tr>`;
  }).join('');
}

function renderPedidos(pedidos) {
  document.getElementById("contador-pedidos").textContent = `Mostrando ${pedidos.length} de ${todosPedidos.length} pedidos`;
  if (!pedidos.length) { document.getElementById("tabla-pedidos").innerHTML = '<tr><td colspan="8" class="loading">Sin resultados</td></tr>'; return; }
  
  // ── LÓGICA VIP (Experiencia de Empaque) ──
  const gastosPorCliente = {};
  (window.todosPedidos || []).filter(x => esPagado(x.estado)).forEach(x => {
    const cid = x.cliente_telefono ? x.cliente_telefono.replace(/[^0-9]/g, '') : (x.cliente_nombre ? x.cliente_nombre.trim().toUpperCase() : null);
    if (cid) gastosPorCliente[cid] = (gastosPorCliente[cid] || 0) + parseFloat(x.total || 0);
  });

  document.getElementById("tabla-pedidos").innerHTML = pedidos.map(p => {
    const cid = p.cliente_telefono ? p.cliente_telefono.replace(/[^0-9]/g, '') : (p.cliente_nombre ? p.cliente_nombre.trim().toUpperCase() : null);
    const gastoTotal = cid ? (gastosPorCliente[cid] || 0) : 0;
    
    let vipBadge = '';
    let rowStyle = '';
    
    if (gastoTotal >= 1000000) {
      vipBadge = '<div style="display:inline-block; margin-top:0.3rem; background:linear-gradient(135deg, #FFD700 0%, #FDB931 100%); color:#5c4000; font-size:0.6rem; padding:0.15rem 0.5rem; border-radius:12px; font-weight:700; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">👑 VIP (>$1M)</div>';
      rowStyle = 'background-color:#fffcf2; border-left: 3px solid #FFD700;';
    } else if (gastoTotal >= 500000) {
      vipBadge = '<div style="display:inline-block; margin-top:0.3rem; background:#e0e0e0; color:#424242; font-size:0.6rem; padding:0.15rem 0.5rem; border-radius:12px; font-weight:700;">🥈 Frecuente (>$500k)</div>';
    }

    const fecha = new Date(p.created_at).toLocaleDateString("es-CO",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"});
    const prendas = (p.items||[]).map(i => `${i.nombre||""} T${i.talla||""} x${i.qty||1}`).join(", ")||"-";
    return `<tr style="${rowStyle}">
      <td><input type="checkbox" class="chk-envio" value="${p.id}" style="margin-right:8px;"><code style="font-size:.7rem">${(p.id||"").split("-")[0]}</code></td>
      <td style="font-size:.75rem">${fecha}</td>
      <td><strong>${p.cliente_nombre||""}</strong><br><span style="font-size:.7rem;color:var(--grisMed)">${p.cliente_telefono||""}</span><br>${vipBadge}</td>
      <td style="font-size:.75rem;max-width:180px;word-break:break-word">${prendas}</td>
      <td><strong>${fCOP(p.total)}</strong></td>
      <td>
        ${badgeEst(p.estado)}
        <div style="margin-top:0.8rem; display:flex; flex-direction:column; gap:0.4rem;">
          <button onclick="imprimirRotulo('${p.id}')" style="background:#f4f4f4;border:1px solid #ddd;padding:0.3rem;font-size:0.65rem;cursor:pointer;border-radius:3px;font-family:inherit;">Imprimir Rótulo</button>
          ${esPendiente(p.estado) ? `<button onclick="recuperarVenta('${p.id}')" style="background:#e8f5e9;color:#2e7d32;border:1px solid #c8e6c9;padding:0.3rem;font-size:0.65rem;cursor:pointer;border-radius:3px;font-family:inherit;">Recuperar WA</button>` : ''}
          <button onclick="abrirModalRMA('${p.id}')" style="background:#fff3e0;color:#e65100;border:1px solid #ffcc80;padding:0.3rem;font-size:0.65rem;cursor:pointer;border-radius:3px;font-family:inherit;margin-top:0.3rem;display:block;width:100%">Procesar Cambio</button>
          ${(p.estado||'').toLowerCase().includes('entregado') ? `
  <button onclick="pedirResena('${p.id}')" 
    style="background:#fce4ec;color:#c62828;border:1px solid #ef9a9a;padding:0.3rem;font-size:0.65rem;cursor:pointer;border-radius:3px;font-family:inherit;margin-top:0.3rem;display:block;width:100%">
    ⭐ Pedir Reseña
  </button>` : ''}
        </div>
      </td>
      <td>
        <select class="estado-select" style="margin-bottom:.5rem;width:100%;padding:0.6rem;font-size:0.8rem;font-weight:400;font-family:inherit;border:1px solid var(--grisCl);background:var(--grisF);color:var(--negro);outline:none;cursor:pointer;border-radius:4px;" onchange="cambiarEstado('${p.id}',this.value,this)">
          <option value="">Cambiar estado...</option>
          <option value="Pagado">Pagado</option>
          <option value="Pendiente">Pendiente</option>
          <option value="Cancelado">Cancelado</option>
        </select>
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
              <button onclick="enviarGuiaWA('${p.id}')" style="flex:1; background:#25D366;color:#fff;border:none;padding:0.3rem;font-size:0.65rem;cursor:pointer;border-radius:4px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:4px">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a5.8 5.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                Notificar Envío
              </button>
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
  if (nuevoEstado === 'Cancelado' && !confirm('¿Cancelar pedido?\n\nEl stock se devolverá automáticamente.')) { sel.value = ''; return; }
  
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
  v.document.write(`<html><head><title>Rótulos en Lote</title><style>body { font-family: sans-serif; margin: 0; color: #000; }

  </style></head><body onload="window.print(); setTimeout(()=>window.close(), 500)">${htmlRotulos}



function pedirResena(id) {
  const p = todosPedidos.find(x => x.id === id);
  if (!p || !p.cliente_telefono) { mostrarToast('El cliente no tiene teléfono registrado', 'warn'); return; }
  let tel = p.cliente_telefono.replace(/\D/g, '');
  if (!tel.startsWith('57') && tel.length === 10) tel = '57' + tel;
  const nombre = (p.cliente_nombre || 'Hermosa').split(' ')[0];
  const msg = `Hola ${nombre} ✨%0A%0AEsperamos que tu Set YOSSICO haya llegado perfecto y te quede increíble 🥰%0A%0ASi tienes un minutito, nos haría muy felices que nos dejaras una reseña en Google. Solo toca el link y te toma 30 segundos:%0Ahttps://g.page/r/YOSSICO_GOOGLE_MAPS_ID/review%0A%0A¡Gracias por confiar en YOSSICO! 💛`;
  window.open(`https://wa.me/${tel}?text=${msg}`, '_blank');
}


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


async function marcarEntregado(id) {
  if (!confirm('¿Confirmar que el pedido fue entregado?')) return;
  const { error } = await sb.rpc('admin_actualizar_pedido_v2', { p_id: id, p_nuevo_estado: 'Entregado', pin: adminPin });
  if (error) { mostrarToast('Error: ' + error.message, 'err'); return; }
  mostrarToast('Pedido marcado como Entregado ✓', 'ok');
  cargarPedidos();
}



function pedirResena(id) {
  const p = todosPedidos.find(x => x.id === id);
  if (!p || !p.cliente_telefono) { mostrarToast('El cliente no tiene teléfono registrado', 'warn'); return; }
  let tel = p.cliente_telefono.replace(/\D/g, '');
  if (!tel.startsWith('57') && tel.length === 10) tel = '57' + tel;
  const nombre = (p.cliente_nombre || 'Hermosa').split(' ')[0];
  const msg = `Hola ${nombre} ✨%0A%0AEsperamos que tu Set YOSSICO haya llegado perfecto y te quede increíble 🥰%0A%0ASi tienes un minutito, nos haría muy felices que nos dejaras una reseña en Google. Solo toca el link y te toma 30 segundos:%0Ahttps://g.page/r/YOSSICO_GOOGLE_MAPS_ID/review%0A%0A¡Gracias por confiar en YOSSICO! 💛`;
  window.open(`https://wa.me/${tel}?text=${msg}`, '_blank');
}


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


async function marcarEntregado(id) {
  if (!confirm('¿Confirmar que el pedido fue entregado?')) return;
  const { error } = await sb.rpc('admin_actualizar_pedido_v2', { p_id: id, p_nuevo_estado: 'Entregado', pin: adminPin });
  if (error) { mostrarToast('Error: ' + error.message, 'err'); return; }
  mostrarToast('Pedido marcado como Entregado ✓', 'ok');
  cargarPedidos();
}




function pedirResena(id) {
  const p = todosPedidos.find(x => x.id === id);
  if (!p || !p.cliente_telefono) { mostrarToast('El cliente no tiene teléfono registrado', 'warn'); return; }
  let tel = p.cliente_telefono.replace(/\D/g, '');
  if (!tel.startsWith('57') && tel.length === 10) tel = '57' + tel;
  const nombre = (p.cliente_nombre || 'Hermosa').split(' ')[0];
  const msg = `Hola ${nombre} ✨%0A%0AEsperamos que tu Set YOSSICO haya llegado perfecto y te quede increíble 🥰%0A%0ASi tienes un minutito, nos haría muy felices que nos dejaras una reseña en Google. Solo toca el link y te toma 30 segundos:%0Ahttps://g.page/r/YOSSICO_GOOGLE_MAPS_ID/review%0A%0A¡Gracias por confiar en YOSSICO! 💛`;
  window.open(`https://wa.me/${tel}?text=${msg}`, '_blank');
}


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


async function marcarEntregado(id) {
  if (!confirm('¿Confirmar que el pedido fue entregado?')) return;
  const { error } = await sb.rpc('admin_actualizar_pedido_v2', { p_id: id, p_nuevo_estado: 'Entregado', pin: adminPin });
  if (error) { mostrarToast('Error: ' + error.message, 'err'); return; }
  mostrarToast('Pedido marcado como Entregado ✓', 'ok');
  cargarPedidos();
}


