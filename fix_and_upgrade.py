import re

with open('web/YOSSICO_Panel_Admin.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. MOVE SIMULATOR INTO TAB-FINANZAS
sim_block_pattern = r'        <!-- SIMULADOR HIPOTÉTICOS -->.*?<canvas id="chart-simulador"></canvas></div>\n        </div>\n'
sim_match = re.search(sim_block_pattern, content, re.DOTALL)
if sim_match:
    sim_html = sim_match.group(0)
    # Remove it from its current floating position
    content = content.replace(sim_html, '')
    
    # Find the end of tab-finanzas
    # The structure is:
    #     <!-- TAB FINANZAS / RENTABILIDAD -->
    #     <div id="tab-finanzas" class="tab-content">
    #       ...
    #       <div class="form-card">
    #         ... tabla-finanzas-catalogo ...
    #       </div>
    #     </div>
    finanzas_end_pattern = r'(<tbody id="tabla-finanzas-catalogo">.*?</tbody>\n          </table>\n        </div>\n)'
    if re.search(finanzas_end_pattern, content, re.DOTALL):
        content = re.sub(finanzas_end_pattern, r'\1' + '\n' + sim_html, content, flags=re.DOTALL)

# 2. UPGRADE PAUTA MODULE HTML
pauta_old_html_pattern = r'    <!-- TAB PAUTA Y MARKETING -->\n    <div id="tab-pauta" class="tab-content">.*?</table>\n      </div>\n    </div>'
pauta_new_html = '''    <!-- TAB PAUTA Y MARKETING -->
    <div id="tab-pauta" class="tab-content">
      <div class="form-card">
        <div class="flex-between" style="margin-bottom:1.5rem">
          <div class="section-title" style="margin:0">Dashboard de Marketing & Pauta 📣</div>
          <div class="rvalor" id="pauta-total-acumulado" style="font-size:1.2rem; color:var(--negro)">$0</div>
        </div>
        
        <!-- KPIs de Marketing -->
        <div class="resumen-grid" style="grid-template-columns: repeat(4, 1fr); margin-bottom: 2rem;">
          <div class="resumen-card" style="background:var(--blanco); border-color:var(--grisCl)">
            <div class="rlabel">Inversión Total</div>
            <div class="rvalor" id="pt-kpi-inv" style="color:var(--naranja)">$0</div>
          </div>
          <div class="resumen-card" style="background:var(--blanco); border-color:var(--grisCl)">
            <div class="rlabel">ROAS (Retorno)</div>
            <div class="rvalor" id="pt-kpi-roas" style="color:var(--verde)">0x</div>
            <div class="rsub" style="font-size:0.65rem">Por cada $1 invertido, recuperas X</div>
          </div>
          <div class="resumen-card" style="background:var(--blanco); border-color:var(--grisCl)">
            <div class="rlabel">CAC (Costo Adquisición)</div>
            <div class="rvalor" id="pt-kpi-cac" style="color:var(--azul)">$0</div>
            <div class="rsub" style="font-size:0.65rem">Costo por cliente nuevo</div>
          </div>
          <div class="resumen-card" style="background:var(--blanco); border-color:var(--grisCl)">
            <div class="rlabel">% Sobre Ventas</div>
            <div class="rvalor" id="pt-kpi-pct" style="color:var(--negro)">0%</div>
            <div class="rsub" style="font-size:0.65rem">Ideal: 10% - 20%</div>
          </div>
        </div>

        <!-- Gráficas de Marketing -->
        <div style="display:grid; grid-template-columns: 2fr 1fr; gap:1rem; margin-bottom:2rem;">
          <div style="position:relative; height:250px; background:var(--grisF); border-radius:8px; padding:1rem;">
             <div class="rlabel" style="margin-bottom:0.5rem">Evolución de Inversión</div>
             <canvas id="chart-pauta-hist"></canvas>
          </div>
          <div style="position:relative; height:250px; background:var(--grisF); border-radius:8px; padding:1rem;">
             <div class="rlabel" style="margin-bottom:0.5rem">Distribución por Plataforma</div>
             <canvas id="chart-pauta-pie"></canvas>
          </div>
        </div>
        
        <div class="section-title" style="margin-top:2rem; margin-bottom:1rem; font-size:1rem;">Registrar Nueva Campaña / Gasto</div>
        <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:1rem; margin-bottom:2rem; background:#fbfbfb; padding:1.5rem; border-radius:8px; border:1px dashed var(--grisCl)">
          <div class="form-group"><label>Plataforma / Canal</label>
            <select id="pt-plataforma" class="input-form" style="width:100%;background:#fff;border:1px solid #ccc;padding:0.5rem;border-radius:4px">
              <option value="Meta Ads (IG/FB)">Meta Ads (IG/FB)</option>
              <option value="Google Ads">Google Ads</option>
              <option value="TikTok Ads">TikTok Ads</option>
              <option value="Influencers/PR">Influencers / PR</option>
              <option value="Email Marketing">Email Marketing</option>
              <option value="Otro">Otro</option>
            </select>
          </div>
          <div class="form-group"><label>Objetivo Principal</label>
            <select id="pt-objetivo" class="input-form" style="width:100%;background:#fff;border:1px solid #ccc;padding:0.5rem;border-radius:4px">
              <option value="Ventas/Conversión">Ventas / Conversión</option>
              <option value="Mensajes a WA">Mensajes a WA</option>
              <option value="Reconocimiento/Alcance">Reconocimiento (Branding)</option>
              <option value="Tráfico a Web">Tráfico a la Web</option>
            </select>
          </div>
          <div class="form-group"><label>Inversión Total (COP)</label><input type="number" id="pt-monto" class="input-form" style="width:100%;background:#fff;border:1px solid #ccc;padding:0.5rem;border-radius:4px" placeholder="Ej: 500000"></div>
          <div class="form-group" style="grid-column: span 2"><label>Nombre de Campaña / Estrategia / Creativos</label><input type="text" id="pt-campana" class="input-form" style="width:100%;background:#fff;border:1px solid #ccc;padding:0.5rem;border-radius:4px" placeholder="Por qué, qué creativos se usan, estrategia..."></div>
          <div class="form-group" style="display:flex; align-items:flex-end;"><button class="btn btn-negro" style="width:100%; height:38px;" onclick="guardarPauta()">Guardar Inversión</button></div>
        </div>

        <div class="section-title" style="margin-bottom:1rem; font-size:1rem;">Historial de Inversiones</div>
        <table style="width:100%">
          <thead><tr><th>Fecha</th><th>Plataforma</th><th>Campaña & Estrategia</th><th>Objetivo</th><th style="text-align:right">Inversión</th></tr></thead>
          <tbody id="tabla-pauta"><tr><td colspan="5" class="loading">Cargando...</td></tr></tbody>
        </table>
      </div>
    </div>'''
content = re.sub(pauta_old_html_pattern, pauta_new_html, content, flags=re.DOTALL)

# 3. UPGRADE PAUTA JS
# Add new variables and charting logic to renderPautaLista
js_pauta_update_pattern = r'function renderPautaLista\(\) \{.*?\}(?=\nasync function guardarPauta)'
new_render_pauta = '''let chartPautaHist = null; let chartPautaPie = null;
function renderPautaLista() {
  const tbody = document.getElementById("tabla-pauta");
  if(!tbody) return;
  if(window.todaPauta.length === 0) { 
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
}'''
content = re.sub(js_pauta_update_pattern, new_render_pauta, content, flags=re.DOTALL)

with open('web/YOSSICO_Panel_Admin.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updates applied.")
