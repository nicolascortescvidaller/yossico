import re

with open('web/YOSSICO_Panel_Admin.html', 'r', encoding='utf-8') as f:
    content = f.read()

# --- 1. CSS for Hover and Details ---
hover_css = '''
  .hover-module { transition: transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94), box-shadow 0.2s ease; }
  .hover-module:hover { transform: scale(1.02); box-shadow: 0 10px 25px rgba(0,0,0,0.06); z-index: 10; position: relative; }
  
  .info-tooltip { display: inline-flex; align-items: center; justify-content: center; width: 14px; height: 14px; border-radius: 50%; background: var(--grisCl); color: var(--negro); font-size: 0.6rem; font-weight: bold; cursor: help; margin-left: 0.3rem; }
  
  .dist-step { background: var(--blanco); border: 1px solid var(--grisCl); border-radius: 8px; padding: 1.2rem; margin-bottom: 0.8rem; display: flex; align-items: center; cursor: pointer; transition: all 0.2s; }
  .dist-step:hover { border-color: var(--negro); }
  .dist-step .step-number { font-family: 'Cormorant Garamond', serif; font-size: 1.5rem; font-weight: bold; color: var(--grisMed); margin-right: 1.2rem; min-width: 25px; }
  .dist-step .step-info { flex: 1; }
  .dist-step .step-title { font-weight: 600; font-size: 0.85rem; letter-spacing: 1px; color: var(--negro); }
  .dist-step .step-desc { font-size: 0.7rem; color: var(--grisMed); margin-top: 0.2rem; }
  .dist-step .step-value { font-weight: bold; font-size: 1.1rem; color: var(--negro); }
  
  .dist-details { display: none; padding: 1rem 1.2rem; background: var(--grisF); border-radius: 6px; margin-top: 0.5rem; border-left: 3px solid var(--negro); font-size: 0.75rem; color: var(--negro); }
  .dist-step.open .dist-details { display: block; }
'''
content = content.replace('/* LOGIN */', hover_css + '\n  /* LOGIN */')

# Apply hover-module to resumen-cards and form-cards globally
content = content.replace('class="resumen-card', 'class="resumen-card hover-module')
content = content.replace('class="form-card"', 'class="form-card hover-module"')

# --- 2. Refactor Distribution HTML ---
# Locate the current distribution HTML block
old_dist_pattern = r'<!-- ESQUEMA DE DISTRIBUCIÓN DEL DROP -->.*?Este esquema aplica igual en los 3 escenarios — solo cambia el monto\.\n            </div>\n          </div>'

new_dist_html = '''<!-- ESQUEMA DE DISTRIBUCIÓN DEL DROP -->
          <div style="margin-top:3rem;">
            <div class="section-title" style="margin-bottom:0.5rem;">Cálculo de Utilidades y Reparto</div>
            <div style="font-size:0.85rem; color:var(--grisMed); margin-bottom:1.5rem;">Desglose interactivo del flujo de caja. Haz clic en cada paso para ver la explicación matemática.</div>
            
            <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 2.5rem; align-items: start;">
              
              <!-- Columna Izquierda: Flujo de Caja -->
              <div style="display:flex; flex-direction:column;">
                
                <div class="dist-step hover-module" onclick="this.classList.toggle('open')">
                  <div class="step-number">1</div>
                  <div class="step-info">
                    <div class="step-title">INGRESOS POR VENTAS</div>
                    <div class="step-desc">Total de dinero recaudado por ventas.</div>
                    <div class="dist-details"><strong>Fórmula:</strong> Precio de venta unitario × Unidades simuladas.<br>Este es el monto bruto antes de descontar cualquier gasto.</div>
                  </div>
                  <div class="step-value" id="dist-ingresos">$0</div>
                </div>

                <div class="dist-step hover-module" onclick="this.classList.toggle('open')">
                  <div class="step-number">2</div>
                  <div class="step-info">
                    <div class="step-title" style="color:var(--rojo)">COSTO DEL PEDIDO</div>
                    <div class="step-desc">Lo que costó fabricar y traer la mercancía.</div>
                    <div class="dist-details"><strong>Fórmula:</strong> Costo de producción unitario × Unidades simuladas.<br>Incluye materiales, confección y extras fijos (como envíos desde Yiwu).</div>
                  </div>
                  <div class="step-value" id="dist-costos" style="color:var(--rojo)">$0</div>
                </div>

                <div class="dist-step hover-module" onclick="this.classList.toggle('open')" style="background:var(--grisF);">
                  <div class="step-number" style="color:var(--negro)">3</div>
                  <div class="step-info">
                    <div class="step-title">GANANCIA NETA DEL DROP</div>
                    <div class="step-desc">El resultado real de la operación.</div>
                    <div class="dist-details"><strong>Fórmula:</strong> Ingresos (1) - Costos (2).<br>Es el margen de contribución directo de los productos vendidos.</div>
                  </div>
                  <div class="step-value" id="dist-neta">$0</div>
                </div>

                <div class="dist-step hover-module" onclick="this.classList.toggle('open')" style="border-color:var(--verde);">
                  <div class="step-number">4</div>
                  <div class="step-info">
                    <div class="step-title" style="color:var(--verde)">RETORNO GARANTIZADO</div>
                    <div class="step-desc">Monto inicial que se extrae antes del reparto.</div>
                    <div class="dist-details">
                      Edita este valor según los términos con tus socios inversores. Este dinero sale limpio antes de dividir las ganancias.
                      <div style="margin-top:0.5rem;" onclick="event.stopPropagation()">
                        <input type="number" id="dist-retorno-input" value="10000000" step="500000" class="input-form" style="width:140px; text-align:right; border-color:var(--verde)" oninput="actualizarSimulador(document.getElementById('sim-slider').value)">
                      </div>
                    </div>
                  </div>
                  <div class="step-value" style="color:var(--verde)">Variable</div>
                </div>

                <div class="dist-step hover-module" onclick="this.classList.toggle('open')" style="background:var(--negro); color:var(--blanco); border:none;">
                  <div class="step-number" style="color:var(--grisCl)">5</div>
                  <div class="step-info">
                    <div class="step-title" style="color:var(--blanco)">GANANCIA POST-RETORNO</div>
                    <div class="step-desc" style="color:var(--grisCl)">Base líquida para calcular reinversión y reparto final.</div>
                    <div class="dist-details" style="color:var(--blanco); border-color:var(--blanco); background:#222;"><strong>Fórmula:</strong> Ganancia Neta (3) - Retorno Garantizado (4).<br>Si la ganancia no supera el retorno, este valor es $0.</div>
                  </div>
                  <div class="step-value" id="dist-post" style="color:var(--blanco)">$0</div>
                </div>

              </div>

              <!-- Columna Derecha: División -->
              <div style="display:flex; flex-direction:column; gap:1.5rem;">
                
                <div style="padding:1.5rem; border:1px solid var(--grisCl); border-radius:8px; background:var(--blanco);" class="hover-module">
                  <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:1rem; border-bottom:1px solid var(--grisCl); padding-bottom:1rem;">
                    <div>
                      <div style="font-family:'Cormorant Garamond', serif; font-size:2.5rem; font-weight:bold; color:var(--azul); line-height:1;">30%</div>
                      <div style="font-weight:700; font-size:0.8rem; letter-spacing:1px;">Fondo de Reinversión</div>
                    </div>
                    <div id="dist-reinv-total" style="font-size:1.4rem; font-weight:bold; color:var(--azul)">$0</div>
                  </div>
                  
                  <div style="display:flex; flex-direction:column; gap:0.5rem;">
                    <div style="display:flex; justify-content:space-between; font-size:0.75rem;">
                      <span style="color:var(--grisMed)">80% destinado al próximo Pedido</span>
                      <span id="dist-reinv-ped" style="font-weight:600">$0</span>
                    </div>
                    <div style="width:100%; height:4px; background:var(--grisF); border-radius:2px; overflow:hidden;"><div style="width:80%; height:100%; background:var(--azul);"></div></div>
                    
                    <div style="display:flex; justify-content:space-between; font-size:0.75rem; margin-top:0.5rem;">
                      <span style="color:var(--grisMed)">20% destinado a Operación (Opex)</span>
                      <span id="dist-reinv-op" style="font-weight:600">$0</span>
                    </div>
                    <div style="width:100%; height:4px; background:var(--grisF); border-radius:2px; overflow:hidden;"><div style="width:20%; height:100%; background:var(--azul);"></div></div>
                  </div>
                </div>

                <div style="padding:1.5rem; border:1px solid var(--verde); border-radius:8px; background:#f9fdfa;" class="hover-module">
                  <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:1rem; border-bottom:1px solid #c8e6c9; padding-bottom:1rem;">
                    <div>
                      <div style="font-family:'Cormorant Garamond', serif; font-size:2.5rem; font-weight:bold; color:var(--verde); line-height:1;">70%</div>
                      <div style="font-weight:700; font-size:0.8rem; letter-spacing:1px; color:var(--verde)">Utilidad Repartible</div>
                    </div>
                    <div id="dist-rep-total" style="font-size:1.4rem; font-weight:bold; color:var(--verde)">$0</div>
                  </div>
                  
                  <div style="display:flex; flex-direction:column; gap:0.5rem;">
                    <div style="display:flex; justify-content:space-between; font-size:0.75rem;">
                      <span style="color:var(--verde)">70% → Nico</span>
                      <span id="dist-rep-nico" style="font-weight:bold; color:var(--verde)">$0</span>
                    </div>
                    <div style="width:100%; height:4px; background:#e8f5e9; border-radius:2px; overflow:hidden;"><div style="width:70%; height:100%; background:var(--verde);"></div></div>
                    
                    <div style="display:flex; justify-content:space-between; font-size:0.75rem; margin-top:0.5rem;">
                      <span style="color:var(--verde)">30% → Socio</span>
                      <span id="dist-rep-socio" style="font-weight:bold; color:var(--verde)">$0</span>
                    </div>
                    <div style="width:100%; height:4px; background:#e8f5e9; border-radius:2px; overflow:hidden;"><div style="width:30%; height:100%; background:var(--verde);"></div></div>
                  </div>
                </div>

              </div>
            </div>
          </div>'''

content = re.sub(old_dist_pattern, new_dist_html, content, flags=re.DOTALL)

# --- 3. Replace Lock Icon on Tab Button ---
rent_tab_old = '''<button class="tab-btn" onclick="cambiarTab('finanzas',this)">
        <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        Rentabilidad
      </button>'''

rent_tab_new = '''<button class="tab-btn" onclick="cambiarTab('finanzas',this)" style="justify-content: space-between;">
        <div style="display:flex; align-items:center; gap:0.8rem;">
          <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          Rentabilidad
        </div>
        <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="opacity:0.4;"><path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
      </button>'''

content = content.replace(rent_tab_old, rent_tab_new)

with open('web/YOSSICO_Panel_Admin.html', 'w', encoding='utf-8') as f:
    f.write(content)
print("done")
