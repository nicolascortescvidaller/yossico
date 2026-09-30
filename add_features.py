import re

with open('web/YOSSICO_Panel_Admin.html', 'r', encoding='utf-8') as f:
    content = f.read()

# --- 1. TAB PAUTA ---
tab_btn_pauta = '''
      <button class="tab-btn" onclick="cambiarTab('pauta',this)">📢 Pauta</button>
'''
content = content.replace('<button class="tab-btn" onclick="cambiarTab(\'stats\',this)">Estadísticas</button>', 
                          '<button class="tab-btn" onclick="cambiarTab(\'stats\',this)">Estadísticas</button>\n' + tab_btn_pauta)

tab_content_pauta = '''
    <!-- TAB PAUTA Y MARKETING -->
    <div id="tab-pauta" class="tab-content">
      <div class="form-card">
        <div class="flex-between" style="margin-bottom:1.5rem">
          <div class="section-title" style="margin:0">Inversión en Marketing (Pauta)</div>
          <div class="rvalor" id="pauta-total-acumulado" style="font-size:1.2rem">$0</div>
        </div>
        
        <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:1rem; margin-bottom:1.5rem; background:var(--grisF); padding:1rem; border-radius:6px; border:1px solid var(--grisCl)">
          <div class="form-group"><label>Plataforma / Canal</label>
            <select id="pt-plataforma" class="input-form" style="width:100%;background:#fff;border:1px solid #ccc;padding:0.5rem;border-radius:4px">
              <option value="Meta Ads (IG/FB)">Meta Ads (IG/FB)</option>
              <option value="Google Ads">Google Ads</option>
              <option value="TikTok Ads">TikTok Ads</option>
              <option value="Influencers/PR">Influencers / PR</option>
              <option value="Otro">Otro</option>
            </select>
          </div>
          <div class="form-group"><label>Objetivo</label>
            <select id="pt-objetivo" class="input-form" style="width:100%;background:#fff;border:1px solid #ccc;padding:0.5rem;border-radius:4px">
              <option value="Ventas/Conversión">Ventas / Conversión</option>
              <option value="Mensajes a WA">Mensajes a WA</option>
              <option value="Reconocimiento/Alcance">Reconocimiento (Branding)</option>
              <option value="Tráfico a Web">Tráfico a la Web</option>
            </select>
          </div>
          <div class="form-group"><label>Inversión (COP)</label><input type="number" id="pt-monto" class="input-form" style="width:100%;background:#fff;border:1px solid #ccc;padding:0.5rem;border-radius:4px" placeholder="Ej: 500000"></div>
          <div class="form-group" style="grid-column: span 2"><label>Nombre de Campaña / Detalles</label><input type="text" id="pt-campana" class="input-form" style="width:100%;background:#fff;border:1px solid #ccc;padding:0.5rem;border-radius:4px" placeholder="Por qué, qué creativos se usan, estrategia..."></div>
          <div class="form-group" style="display:flex; align-items:flex-end;"><button class="btn btn-negro" style="width:100%" onclick="guardarPauta()">Guardar Inversión</button></div>
        </div>

        <table style="width:100%">
          <thead><tr><th>Fecha</th><th>Plataforma</th><th>Campaña & Detalles</th><th>Objetivo</th><th style="text-align:right">Inversión</th></tr></thead>
          <tbody id="tabla-pauta"><tr><td colspan="5" class="loading">Cargando...</td></tr></tbody>
        </table>
      </div>
    </div>
'''
content = content.replace('<!-- TAB FINANZAS / RENTABILIDAD -->', tab_content_pauta + '\n    <!-- TAB FINANZAS / RENTABILIDAD -->')

# Logic for Pauta
js_pauta = '''
window.todaPauta = [];
async function cargarPauta() {
  const { data, error } = await sb.from("gastos_pauta").select("*").order("fecha", { ascending: false });
  if(!error && data) window.todaPauta = data;
  renderPautaLista();
}
function renderPautaLista() {
  const tbody = document.getElementById("tabla-pauta");
  if(!tbody) return;
  if(window.todaPauta.length === 0) { tbody.innerHTML = '<tr><td colspan="5" class="loading">No hay registros de pauta</td></tr>'; return; }
  
  let sum = 0;
  tbody.innerHTML = window.todaPauta.map(p => {
    sum += parseFloat(p.monto||0);
    const bdg = p.plataforma.includes('Meta') ? '<span style="background:#e3f2fd;color:#1565c0;padding:2px 6px;border-radius:4px;font-size:0.7rem">Meta</span>' : 
                p.plataforma.includes('TikTok') ? '<span style="background:#000;color:#fff;padding:2px 6px;border-radius:4px;font-size:0.7rem">TikTok</span>' : 
                p.plataforma.includes('Google') ? '<span style="background:#fff3e0;color:#e65100;padding:2px 6px;border-radius:4px;font-size:0.7rem">Google</span>' : 
                `<span style="background:#f4f4f4;color:#666;padding:2px 6px;border-radius:4px;font-size:0.7rem">${p.plataforma}</span>`;
    return `<tr>
      <td>${new Date(p.fecha).toLocaleDateString()}</td>
      <td>${bdg}</td>
      <td><strong>${p.campana || '-'}</strong></td>
      <td>${p.objetivo}</td>
      <td style="text-align:right; font-weight:bold">${fCOP(p.monto)}</td>
    </tr>`;
  }).join('');
  document.getElementById('pauta-total-acumulado').textContent = 'Inversión Total: ' + fCOP(sum);
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
'''
content = content.replace('// --- Lógica Tabla Top Prendas (Histórico) ---', js_pauta + '\n  // --- Lógica Tabla Top Prendas (Histórico) ---')

# Inject Pauta logic into tab switching & loading
content = content.replace('} else if (tab === \'finanzas\') {', '} else if (tab === \'pauta\') {\n    if (window.todaPauta.length === 0) cargarPauta();\n  } else if (tab === \'finanzas\') {')
content = content.replace('cargarCotizaciones();', 'cargarCotizaciones();\n    cargarPauta();')

# Modify Finanzas OPEX calculation to include Pauta
content = content.replace('const totalOpex = todosGastos.reduce((acc, g) => acc + parseFloat(g.monto || 0), 0);', 
                          'const sumGastos = todosGastos.reduce((acc, g) => acc + parseFloat(g.monto || 0), 0);\n  const sumPauta = (window.todaPauta || []).reduce((acc, p) => acc + parseFloat(p.monto || 0), 0);\n  const totalOpex = sumGastos + sumPauta;')


# --- 2. TAB FINANZAS (SIMULADOR) ---
simulador_html = '''
        <!-- SIMULADOR HIPOTÉTICOS -->
        <div class="form-card" style="margin-top:2.5rem; background:var(--blanco); border:1px solid var(--grisCl); box-shadow:0 4px 12px rgba(0,0,0,0.05)">
          <div class="section-title">Simulador de Escenarios (Venta de Inventario) 🔮</div>
          <div style="font-size:0.85rem; color:var(--grisMed); margin-bottom:1.5rem;">Descubre cuánto dinero ingresaría a tu cuenta si vendes el stock actual de fábrica.</div>
          
          <div style="display:flex; align-items:center; gap:1rem; margin-bottom:2rem; background:var(--grisF); padding:1rem; border-radius:8px">
            <span style="font-weight:600; white-space:nowrap;">Si logramos vender el: </span>
            <input type="range" id="sim-slider" min="0" max="100" value="100" step="1" style="flex:1; cursor:pointer;" oninput="actualizarSimulador(this.value)">
            <span id="sim-slider-val" style="font-weight:bold; font-size:1.5rem; color:var(--negro); min-width:60px; text-align:right">100%</span>
            <span style="font-weight:600">del stock actual.</span>
          </div>
          
          <div class="resumen-grid" style="grid-template-columns: repeat(3, 1fr); margin-bottom: 2rem;">
            <div class="resumen-card" style="background:#f4f9ff; border:1px solid #ddecff">
              <div class="rlabel" style="color:#0d47a1">Ventas Brutas Esperadas</div>
              <div class="rvalor" id="sim-ventas" style="color:#1565c0">$0</div>
              <div class="rsub">Lo que pagarían los clientes</div>
            </div>
            <div class="resumen-card" style="background:#fffaf5; border:1px solid #fcecdb">
              <div class="rlabel" style="color:#e65100">Costo de la Mercancía</div>
              <div class="rvalor" id="sim-costos" style="color:#ef6c00">$0</div>
              <div class="rsub">Lo que costó producirla</div>
            </div>
            <div class="resumen-card" style="background:#f9fdfa; border:1px solid #e0f2e9">
              <div class="rlabel" style="color:#1b5e20">Utilidad Bruta Proyectada</div>
              <div class="rvalor" id="sim-utilidad" style="color:#2e7d32">$0</div>
              <div class="rsub">Ganancia antes de Opex/Pauta</div>
            </div>
          </div>
          <div style="position:relative;height:300px; width:100%"><canvas id="chart-simulador"></canvas></div>
        </div>
'''
content = content.replace('<!-- /form-card finanzas -->', '<!-- /form-card finanzas -->\n' + simulador_html)

simulador_js = '''
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
      const udsSimuladas = Math.round(s.stock * pct);
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
      plugins: { legend: { position: 'top' }, tooltip: { callbacks: { label: function(context) { return context.dataset.label + ': $' + context.raw.toLocaleString('es-CO'); } } } },
      scales: { y: { beginAtZero: true, ticks: { callback: function(value) { return '$' + (value/1000000).toFixed(1) + 'M'; } } } }
    }
  });
}
'''
content = content.replace('// --- Lógica Tabla Unit Economics (Catálogo) ---', simulador_js + '\n  // --- Lógica Tabla Unit Economics (Catálogo) ---')
# Trigger initialization of simulator when stock data is loaded
content = content.replace('renderStock();', 'renderStock();\n  if(typeof actualizarSimulador === "function") actualizarSimulador(100);')


with open('web/YOSSICO_Panel_Admin.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Pauta and Simulador injected.")
