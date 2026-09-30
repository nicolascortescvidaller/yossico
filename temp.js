let adminPin = sessionStorage.getItem("admin_pin") || null;
let sb, stockData = [], todosPedidos = [], todasSubs = [], stockEditTarget = null;

document.addEventListener("DOMContentLoaded", () => {
  sb = window.YOSSICO_AUTH.getSb();
  if (adminPin) verificarPin(adminPin);
});

// ── TABS
function cambiarTab(tab, btn) {
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
    iniciarCampana();
  } catch (err) {
    mostrarToast("Contraseña incorrecta", "err");
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
}

function badgeEst(e) {
  if (esCancelado(e)) return `<span class="badge badge-can">${e}</span>`;
  if (esPagado(e))    return `<span class="badge badge-pag">${e}</span>`;
  return `<span class="badge badge-pend">${e}</span>`;
}

function renderPedidos(pedidos) {
  document.getElementById("contador-pedidos").textContent = `Mostrando ${pedidos.length} de ${todosPedidos.length} pedidos`;
  if (!pedidos.length) { document.getElementById("tabla-pedidos").innerHTML = '<tr><td colspan="8" class="loading">Sin resultados</td></tr>'; return; }
  document.getElementById("tabla-pedidos").innerHTML = pedidos.map(p => {
    const fecha = new Date(p.created_at).toLocaleDateString("es-CO",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"});
    const prendas = (p.items||[]).map(i => `${i.nombre||""} T${i.talla||""} x${i.qty||1}`).join(", ")||"-";
    return `<tr>
      <td><code style="font-size:.7rem">${(p.id||"").split("-")[0]}</code></td>
      <td style="font-size:.75rem">${fecha}</td>
      <td><strong>${p.cliente_nombre||""}</strong><br><span style="font-size:.7rem;color:var(--grisMed)">${p.cliente_telefono||""}</span></td>
      <td style="font-size:.75rem;max-width:180px;word-break:break-word">${prendas}</td>
      <td><strong>${fCOP(p.total)}</strong></td>
      <td>${badgeEst(p.estado)}</td>
      <td>
        <select class="estado-select" style="margin-bottom:.5rem;width:100%;padding:.4rem;font-size:.7rem;font-family:inherit;border:1px solid var(--grisCl);background:var(--grisF);outline:none;cursor:pointer;" onchange="cambiarEstado('${p.id}',this.value,this)">
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
          ${p.empresa_envio ? p.empresa_envio : ''}
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
  else { mostrarToast("Pedido → " + nuevoEstado, "ok"); cargarPedidos(); cargarStock(); }
}

function exportarCSV() {
  if (!todosPedidos.length) { mostrarToast("Sin pedidos para exportar","warn"); return; }
  const cols = ["ID","Fecha","Cliente","Teléfono","Ciudad","Prendas","Total","Estado","Descuento"];
  const rows = todosPedidos.map(p => {
    const prendas = (p.items||[]).map(i=>`${i.nombre||""} T${i.talla||""} x${i.qty||1}`).join(" | ");
    return [p.id,p.created_at,p.cliente_nombre,p.cliente_telefono,p.cliente_ciudad,prendas,p.total,p.estado,p.codigo_descuento||""]
      .map(v=>`"${String(v||"").replace(/"/g,'""')}"`);
  });
  descargarCSV([cols,...rows].map(r=>r.join(",")).join("\n"), `yossico-pedidos-${dHoy()}.csv`);
  mostrarToast("CSV exportado ✓","ok");
}

// ── INVENTARIO
async function cargarStock() {
  const grid = document.getElementById("stock-grid");
  if (grid) grid.innerHTML = '<div class="loading">Cargando inventario...</div>';
  const { data, error } = await sb.from("productos").select("*").order("nombre");
  if (error) { if(grid) grid.innerHTML=`<div class="loading" style="color:var(--rojo)">Error: ${error.message}</div>`; return; }
  stockData = data || [];
  renderStock();
  filtrarSKUs();
  chkStockBajo();
}

function renderStock() {
  const grid = document.getElementById("stock-grid");
  if (!grid) return;
  const grupos = {};
  stockData.forEach(item => {
    const key = `${item.nombre}|${item.color}`;
    if (!grupos[key]) grupos[key]={nombre:item.nombre,color:item.color,s:0,m:0,l:0,bajo:false};
    if (item.talla==="S") grupos[key].s=item.stock;
    if (item.talla==="M") grupos[key].m=item.stock;
    if (item.talla==="L") grupos[key].l=item.stock;
    if (item.stock<=2&&item.stock>0) grupos[key].bajo=true;
  });
  const badge=(n,t)=>{const c=n===0?"talla-cero":n<=2?"talla-bajo":"talla-ok";return`<div class="talla-badge ${c}">${t}<br><strong>${n}</strong></div>`;};
  grid.innerHTML = Object.values(grupos).map(g=>`
    <div class="stock-item${g.bajo?" agotando":""}">
      <div class="stock-nombre"><strong>${g.nombre}</strong></div>
      <div class="stock-color">${g.color}</div>
      ${g.bajo?'<div style="font-size:.65rem;color:var(--naranja);margin-bottom:.4rem">⚠️ Stock crítico</div>':""}
      <div class="stock-tallas">${badge(g.s,"S")}${badge(g.m,"M")}${badge(g.l,"L")}</div>
      <button class="btn-editar-stock" onclick="abrirModal('${encodeURIComponent(g.nombre)}','${encodeURIComponent(g.color)}',${g.s},${g.m},${g.l})">✏ Editar stock</button>
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

function abrirModal(nEnc,cEnc,s,m,l) {
  const nombre=decodeURIComponent(nEnc), color=decodeURIComponent(cEnc);
  stockEditTarget={nombre,color};
  document.getElementById("modal-titulo").textContent=nombre;
  document.getElementById("modal-sub").textContent=color;
  document.getElementById("modal-s").value=s;
  document.getElementById("modal-m").value=m;
  document.getElementById("modal-l").value=l;
  document.getElementById("modal-stock").classList.add("visible");
}
function cerrarModalStock() { document.getElementById("modal-stock").classList.remove("visible"); stockEditTarget=null; }
document.getElementById("modal-stock").addEventListener("click",e=>{if(e.target===document.getElementById("modal-stock"))cerrarModalStock();});

async function guardarStock() {
  if (!stockEditTarget) return;
  const {nombre,color}=stockEditTarget;
  const vals={S:parseInt(document.getElementById("modal-s").value)||0,M:parseInt(document.getElementById("modal-m").value)||0,L:parseInt(document.getElementById("modal-l").value)||0};
  let err=0;
  for (const [talla,stock] of Object.entries(vals)) {
    const {error}=await sb.from("productos").update({stock,updated_at:new Date().toISOString()}).eq("nombre",nombre).eq("color",color).eq("talla",talla);
    if(error)err++;
  }
  if(err) mostrarToast("Error parcial al guardar","warn");
  else { mostrarToast("Stock actualizado ✓","ok"); cerrarModalStock(); cargarStock(); }
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
}

// ── KPIs ─────────────────────────────────────────────────
function renderKPIs(pedidos) {
  const pagados = pedidos.filter(p => esPagado(p.estado));
  const total   = pagados.reduce((s, p) => s + parseFloat(p.total || 0), 0);
  const ticket  = pagados.length ? total / pagados.length : 0;

  document.getElementById('sk-ingresos').textContent     = fCOP(total);
  document.getElementById('sk-ingresos-sub').textContent = `${pagados.length} pedidos pagados`;
  document.getElementById('sk-pedidos').textContent      = pedidos.length;
  document.getElementById('sk-pedidos-sub').textContent  = `${pagados.length} pagados · ${pedidos.filter(p=>esPendiente(p.estado)).length} pendientes`;
  document.getElementById('sk-ticket').textContent       = fCOP(ticket);
  document.getElementById('sk-subs').textContent         = todasSubs.length;
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
  const pct = parseInt(document.getElementById('desc-pct').value) || 10;
  let codigo = document.getElementById('desc-codigo').value.trim().toUpperCase();

  if (!nombre) { mostrarToast('Ingresa un beneficiario', 'err'); return; }

  // Generar código automático si no se ingresó uno
  if (!codigo) {
    const sufijo = Array.from({length:4}, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random()*32)]).join('');
    codigo = `YOSSICO-PROMO-${sufijo}`;
  }

  // Verificar si ya existe el código
  const existe = todasSubs.some(s => s.discount_code === codigo);
  if (existe) { mostrarToast('Este código ya existe', 'err'); return; }

  // Insertar en Supabase (asumiendo que discount_pct no existe, guardamos solo código)
  // NOTA: Para bypassear RLS en inserción, normalmente anon puede insertar, pero si RLS está cerrado
  // tendríamos que usar un RPC. Aquí probamos la inserción estándar porque subscribers permitía anon insert.
  const { error } = await sb.from('subscribers').insert([{
    name: nombre,
    discount_code: codigo,
    used: false
  }]);

  if (error) {
    mostrarToast('Error al crear código: ' + error.message, 'err');
    return;
  }

  // Éxito
  document.getElementById('desc-nombre').value = '';
  document.getElementById('desc-codigo').value = '';
  document.getElementById('desc-resultado').style.display = 'block';
  document.getElementById('desc-codigo-texto').textContent = codigo;
  mostrarToast('Código creado', 'ok');

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
