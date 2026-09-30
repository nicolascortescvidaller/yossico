import re

with open('web/YOSSICO_Panel_Admin.html', 'r', encoding='utf-8') as f:
    content = f.read()

rma_html = '''
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
'''

if 'id="modal-rma"' not in content:
    content = content.replace('</body>', rma_html + '\n</body>')

rma_js = '''
// --- LÓGICA RMA / CAMBIOS ---
function abrirModalRMA(pedidoId) {
  const p = todosPedidos.find(x => x.id === pedidoId);
  if (!p) return;
  document.getElementById('rma-pedido-id').value = pedidoId;
  
  const container = document.getElementById('rma-items-container');
  container.innerHTML = '';
  
  (p.items || []).forEach((item, index) => {
    const div = document.createElement('div');
    div.style = "display:flex; align-items:center; gap:0.5rem; padding:0.5rem; border:1px solid var(--grisCl); border-radius:4px; background:var(--blanco);";
    div.innerHTML = `
      <input type="checkbox" id="rma-item-${index}" value='${JSON.stringify(item)}'>
      <label for="rma-item-${index}" style="font-size:0.8rem; cursor:pointer; flex:1">
        <strong>${item.nombre}</strong> ${item.color ? '- ' + item.color : ''} ${item.talla ? ' (Talla ' + item.talla + ')' : ''} x${item.qty || 1}
      </label>
    `;
    container.appendChild(div);
  });
  
  document.getElementById('modal-rma').classList.remove('hidden');
}

function cerrarModalRMA() {
  document.getElementById('modal-rma').classList.add('hidden');
}

async function ejecutarRMA() {
  const checkboxes = document.querySelectorAll('input[id^="rma-item-"]:checked');
  if (checkboxes.length === 0) {
    mostrarToast("Selecciona al menos una prenda para reingresar.", "warn");
    return;
  }
  
  if (!confirm(`¿Reingresar ${checkboxes.length} línea(s) al inventario?`)) return;
  
  const itemsAReingresar = Array.from(checkboxes).map(cb => JSON.parse(cb.value));
  const pedidoId = document.getElementById('rma-pedido-id').value;
  
  let successCount = 0;
  let failCount = 0;
  
  for (const item of itemsAReingresar) {
    // Buscar en stockData el ID real
    const prod = stockData.find(s => s.nombre.toUpperCase() === item.nombre.toUpperCase() && (s.talla||'').toUpperCase() === (item.talla||'').toUpperCase());
    if (prod) {
      const nuevaCant = prod.stock + (item.qty || 1);
      const { error } = await sb.from('productos').update({ stock: nuevaCant }).eq('id', prod.id);
      if (!error) successCount++;
      else failCount++;
    } else {
      failCount++; // No se encontró en la BD local
    }
  }
  
  // Opcional: Agregar una nota interna al pedido
  const notaExtra = `[RMA] Reingreso de ${successCount} items al inventario el ${new Date().toLocaleDateString()}.`;
  const p = todosPedidos.find(x => x.id === pedidoId);
  const notaFinal = p.nota_interna ? p.nota_interna + '\\n' + notaExtra : notaExtra;
  await sb.rpc('admin_actualizar_nota', { p_id: pedidoId, p_nota: notaFinal, pin: adminPin });
  
  cerrarModalRMA();
  
  if (failCount === 0) {
    mostrarToast(`Se reingresaron ${successCount} prendas al stock.`, "ok");
  } else {
    mostrarToast(`Se reingresaron ${successCount} prendas. Hubo ${failCount} errores.`, "warn");
  }
  
  cargarStock();
  cargarPedidos();
}
'''

if 'function abrirModalRMA' not in content:
    content = content.replace('</script>\n</body>', rma_js + '\n</script>\n</body>')

with open('web/YOSSICO_Panel_Admin.html', 'w', encoding='utf-8') as f:
    f.write(content)
print("RMA modal and JS injected successfully.")
