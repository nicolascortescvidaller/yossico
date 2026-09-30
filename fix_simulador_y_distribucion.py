import re

with open('web/YOSSICO_Panel_Admin.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Eliminar la burbuja morada (🔮)
content = content.replace('Simulador de Escenarios (Venta de Inventario) 🔮', 'Simulador de Escenarios (Venta de Inventario)')

# 2. Agregar el texto de unidades a las tarjetas del simulador
card_ventas = '''              <div class="rvalor" id="sim-ventas" style="color:#1565c0">$0</div>
              <div class="rsub">Lo que pagarían los clientes</div>'''
new_card_ventas = '''              <div class="rvalor" id="sim-ventas" style="color:#1565c0">$0</div>
              <div class="rsub" id="sim-ventas-uds" style="font-weight:600; color:#0d47a1; margin-top:0.2rem">0 unidades</div>
              <div class="rsub">Lo que pagarían los clientes</div>'''
content = content.replace(card_ventas, new_card_ventas)

# 3. HTML del Esquema de Distribución de Drop (Basado en la Diapositiva)
distribucion_html = '''
          <!-- ESQUEMA DE DISTRIBUCIÓN DEL DROP -->
          <div style="margin-top:3rem; border: 1px solid var(--negro); border-radius: 8px; overflow: hidden; background: #fafafa;">
            <div style="background: var(--negro); color: var(--blanco); padding: 1rem 1.5rem; font-family: 'Montserrat', sans-serif; font-size: 0.9rem; letter-spacing: 2px; font-weight: 600;">
              CÓMO SE DISTRIBUYE EL DINERO EN ESTE ESCENARIO
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; padding: 1.5rem;">
              
              <!-- Columna Izquierda: Steps 1-5 -->
              <div style="display:flex; flex-direction:column; gap: 0.5rem; font-family: 'Montserrat', sans-serif;">
                
                <!-- 1. Ingresos -->
                <div style="display:flex; border:1px solid #e0e0e0; background:#f4f4f4; align-items:center;">
                  <div style="background:#1a1a1a; color:#fff; padding:0.8rem 1.2rem; font-weight:bold; font-size:1.2rem; min-width:50px; text-align:center;">1</div>
                  <div style="padding:0.5rem 1rem; flex:1;">
                    <div style="font-size:0.85rem; font-weight:700;">INGRESOS POR VENTAS</div>
                    <div style="font-size:0.7rem; color:#666; font-style:italic;">Precio de venta × unidades vendidas</div>
                  </div>
                  <div id="dist-ingresos" style="padding:0.8rem 1rem; font-weight:bold; font-size:1.1rem; color:#1a1a1a;">$0</div>
                </div>

                <!-- 2. Costo -->
                <div style="display:flex; border:1px solid #ffcdd2; background:#ffebee; align-items:center;">
                  <div style="background:#c62828; color:#fff; padding:0.8rem 1.2rem; font-weight:bold; font-size:1.2rem; min-width:50px; text-align:center;">2</div>
                  <div style="padding:0.5rem 1rem; flex:1;">
                    <div style="font-size:0.85rem; font-weight:700; color:#c62828;">MENOS: COSTO DEL PEDIDO</div>
                    <div style="font-size:0.7rem; color:#b71c1c; font-style:italic;">Lo que costó producir el stock simulado</div>
                  </div>
                  <div id="dist-costos" style="padding:0.8rem 1rem; font-weight:bold; font-size:1.1rem; color:#c62828;">$0</div>
                </div>

                <!-- 3. Ganancia Neta -->
                <div style="display:flex; border:1px solid #e0e0e0; background:#eeeeee; align-items:center;">
                  <div style="background:#1a1a1a; color:#fff; padding:0.8rem 1.2rem; font-weight:bold; font-size:1.2rem; min-width:50px; text-align:center;">3</div>
                  <div style="padding:0.5rem 1rem; flex:1;">
                    <div style="font-size:0.85rem; font-weight:700;">= GANANCIA NETA DEL DROP</div>
                    <div style="font-size:0.7rem; color:#666; font-style:italic;">El resultado real del negocio en este drop</div>
                  </div>
                  <div id="dist-neta" style="padding:0.8rem 1rem; font-weight:bold; font-size:1.1rem; color:#1a1a1a;">$0</div>
                </div>

                <!-- 4. Retorno Garantizado -->
                <div style="display:flex; border:1px solid #c8e6c9; background:#e8f5e9; align-items:center;">
                  <div style="background:#2e7d32; color:#fff; padding:0.8rem 1.2rem; font-weight:bold; font-size:1.2rem; min-width:50px; text-align:center;">4</div>
                  <div style="padding:0.5rem 1rem; flex:1;">
                    <div style="font-size:0.85rem; font-weight:700; color:#2e7d32;">MENOS: RETORNO GARANTIZADO</div>
                    <div style="font-size:0.7rem; color:#1b5e20; font-style:italic;">Monto fijo extraído primero</div>
                  </div>
                  <div style="padding:0.5rem 1rem;">
                    <input type="number" id="dist-retorno-input" value="10000000" step="500000" style="width:110px; padding:0.3rem; border:1px solid #81c784; border-radius:4px; text-align:right; font-weight:bold; font-size:0.9rem;" oninput="actualizarSimulador(document.getElementById('sim-slider').value)">
                  </div>
                </div>

                <!-- 5. Ganancia Post-Retorno -->
                <div style="display:flex; border:1px solid #e0e0e0; background:#f4f4f4; align-items:center;">
                  <div style="background:#1a1a1a; color:#fff; padding:0.8rem 1.2rem; font-weight:bold; font-size:1.2rem; min-width:50px; text-align:center;">5</div>
                  <div style="padding:0.5rem 1rem; flex:1;">
                    <div style="font-size:0.85rem; font-weight:700;">= GANANCIA POST-RETORNO</div>
                    <div style="font-size:0.7rem; color:#666; font-style:italic;">Base para calcular reinversión y reparto</div>
                  </div>
                  <div id="dist-post" style="padding:0.8rem 1rem; font-weight:bold; font-size:1.2rem; color:#1a1a1a;">$0</div>
                </div>

              </div>

              <!-- Columna Derecha: División -->
              <div style="border: 2px solid #1a1a1a; background: #fff; display:flex; flex-direction:column; font-family: 'Montserrat', sans-serif;">
                <div style="text-align:center; padding:1.5rem; font-weight:bold; font-size:1.1rem; border-bottom: 2px solid #1a1a1a; font-family: 'Cormorant Garamond', serif; letter-spacing:1px;">
                  GANANCIA POST-RETORNO<br>se divide así:
                </div>
                
                <div style="padding:1.5rem; display:flex; flex-direction:column; gap:1.5rem; flex:1; background:#fdfdfd;">
                  
                  <!-- 30% Reinversión -->
                  <div style="border:1px solid #90caf9; border-radius:6px; overflow:hidden;">
                    <div style="background:#e3f2fd; padding:1rem; display:flex; align-items:center; border-bottom:1px solid #90caf9;">
                      <div style="font-size:2.2rem; font-weight:700; color:#1565c0; margin-right:1rem; font-family:'Cormorant Garamond', serif;">30%</div>
                      <div>
                        <div style="font-weight:700; color:#0d47a1; font-size:0.9rem;">REINVERSIÓN</div>
                        <div style="font-size:0.75rem; color:#1565c0;">empresa</div>
                      </div>
                      <div id="dist-reinv-total" style="margin-left:auto; font-weight:bold; font-size:1.1rem; color:#1565c0;">$0</div>
                    </div>
                    <div style="display:flex; background:#e8f5e9; font-size:0.75rem; font-weight:600;">
                      <div style="flex:0.8; padding:0.5rem; text-align:center; color:#2e7d32; border-right:1px solid #a5d6a7;">80% → Pedido <br><span id="dist-reinv-ped">$0</span></div>
                      <div style="flex:0.2; padding:0.5rem; text-align:center; color:#0277bd; background:#e1f5fe;">20% → Operación <br><span id="dist-reinv-op">$0</span></div>
                    </div>
                  </div>

                  <!-- 70% Repartible -->
                  <div style="border:1px solid #a5d6a7; border-radius:6px; overflow:hidden;">
                    <div style="background:#e8f5e9; padding:1rem; display:flex; align-items:center; border-bottom:1px solid #a5d6a7;">
                      <div style="font-size:2.2rem; font-weight:700; color:#2e7d32; margin-right:1rem; font-family:'Cormorant Garamond', serif;">70%</div>
                      <div>
                        <div style="font-weight:700; color:#1b5e20; font-size:0.9rem;">REPARTIBLE</div>
                        <div style="font-size:0.75rem; color:#2e7d32;">entre socios</div>
                      </div>
                      <div id="dist-rep-total" style="margin-left:auto; font-weight:bold; font-size:1.1rem; color:#2e7d32;">$0</div>
                    </div>
                    <div style="display:flex; background:#e8f5e9; font-size:0.75rem; font-weight:600;">
                      <div style="flex:0.7; padding:0.5rem; text-align:center; color:#2e7d32; border-right:1px solid #a5d6a7;">70% → Nico <br><span id="dist-rep-nico">$0</span></div>
                      <div style="flex:0.3; padding:0.5rem; text-align:center; color:#e65100; background:#fff3e0;">30% → Socio <br><span id="dist-rep-socio">$0</span></div>
                    </div>
                  </div>

                </div>
              </div>

            </div>
            <div style="text-align:center; padding: 0.8rem; background:#eaeaea; color:#666; font-size:0.75rem; font-style:italic; font-family: 'Montserrat', sans-serif;">
              Este esquema aplica igual en los 3 escenarios — solo cambia el monto.
            </div>
          </div>
'''
content = content.replace('<div style="position:relative;height:300px; width:100%"><canvas id="chart-simulador"></canvas></div>', '<div style="position:relative;height:300px; width:100%"><canvas id="chart-simulador"></canvas></div>\n' + distribucion_html)

# 4. Modificar actualizarSimulador en JS
old_js_pattern = r'const udsSimuladas = Math\.round\(s\.stock \* pct\);'
new_js_logic = r'const udsSimuladas = s.stock * pct;'
content = re.sub(old_js_pattern, new_js_logic, content)

# 5. Inyectar variables de unidades y actualizacion del DOM de distribucion
js_update_pattern = r'document\.getElementById\(\'sim-utilidad\'\)\.textContent = fCOP\(totalVentas - totalCostos\);'
new_js_update = '''document.getElementById('sim-utilidad').textContent = fCOP(totalVentas - totalCostos);
  
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
'''
content = re.sub(js_update_pattern, new_js_update, content)

with open('web/YOSSICO_Panel_Admin.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updates applied to Simulador and Distribución.")
