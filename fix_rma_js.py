import re

with open('web/YOSSICO_Panel_Admin.html', 'r', encoding='utf-8') as f:
    content = f.read()

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
    // Codificamos el value para evitar que las comillas simples/dobles rompan el HTML
    const valObj = encodeURIComponent(JSON.stringify(item));
    div.innerHTML = `
      <input type="checkbox" id="rma-item-${index}" value="${valObj}">
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
  
  const itemsAReingresar = Array.from(checkboxes).map(cb => JSON.parse(decodeURIComponent(cb.value)));
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
  
  // Recargar pedidos para que se vea la nueva nota interna
  const { data } = await sb.rpc("admin_get_pedidos", { pin: adminPin });
  if (data) todosPedidos = data;
  renderPedidos();
}
'''

if 'function abrirModalRMA' not in content:
    # Append the JS right before the LAST </script> tag
    content = content.replace('</script>\n\n<!-- MODAL RMA / CAMBIOS -->', rma_js + '\n</script>\n\n<!-- MODAL RMA / CAMBIOS -->')
    with open('web/YOSSICO_Panel_Admin.html', 'w', encoding='utf-8') as f:
        f.write(content)
    print("JS injected.")
else:
    print("JS already exists.")
