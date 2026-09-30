import re

with open('web/YOSSICO_Panel_Admin.html', 'r', encoding='utf-8') as f:
    content = f.read()

pattern = r'        <!-- SIMULADOR HIPOTÉTICOS -->.*?<canvas id="chart-simulador"></canvas></div>\n        </div>\n'
content = re.sub(pattern, '', content, flags=re.DOTALL)

# Inject exactly BEFORE <!-- TAB PAUTA Y MARKETING -->
sim_html = '''
        <!-- SIMULADOR HIPOTÉTICOS -->
        <div class="form-card" id="simulador-card" style="margin-top:2.5rem; background:var(--blanco); border:1px solid var(--grisCl); box-shadow:0 4px 12px rgba(0,0,0,0.05)">
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

content = content.replace('    <!-- TAB PAUTA Y MARKETING -->', sim_html + '\n    <!-- TAB PAUTA Y MARKETING -->')

with open('web/YOSSICO_Panel_Admin.html', 'w', encoding='utf-8') as f:
    f.write(content)
print("Duplicates removed, injected once.")
