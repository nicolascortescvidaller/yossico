import re

with open('web/YOSSICO_Panel_Admin.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. B2B UI Changes
ui_b2b_extra = '''
          <div class="section-title" style="margin-top:2rem;font-size:1.1rem">Historial de Cotizaciones</div>
          <table style="width:100%">
            <thead><tr><th>#</th><th>Cliente</th><th>Total</th><th>Fecha</th><th>Estado</th><th>Acciones</th></tr></thead>
            <tbody id="tabla-cotizaciones"><tr><td colspan="6" class="loading">Cargando...</td></tr></tbody>
          </table>
'''
content = content.replace('<div class="section-title" style="margin-bottom:1.5rem;font-size:1.1rem">Generador de Cotizaciones Institucionales</div>', '<div class="section-title" style="margin-bottom:1.5rem;font-size:1.1rem">Generador de Cotizaciones Institucionales</div>\n' + ui_b2b_extra)

# Button in b2b-print-controls
save_btn = '<button class="btn btn-negro" onclick="b2bGuardarCotizacion()" style="font-family:\'Montserrat\', sans-serif;">💾 Guardar Cotización en Base de Datos</button>'
content = content.replace('<button class="btn btn-gris" onclick="window.print()" style="font-family:\'Montserrat\', sans-serif;">🖨️ Imprimir / Guardar PDF</button>', '<button class="btn btn-gris" onclick="window.print()" style="font-family:\'Montserrat\', sans-serif;">🖨️ Imprimir PDF</button>\n' + save_btn)

# 2. JS Logic for B2B
b2b_js = '''
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
    let bdg = '<span style="background:#f4f4f4;color:#666;padding:2px 6px;border-radius:4px;font-size:0.7rem">Borrador</span>';
    if(c.estado === 'Aprobada') bdg = '<span style="background:#e8f5e9;color:#2e7d32;padding:2px 6px;border-radius:4px;font-size:0.7rem">Aprobada (Pedido)</span>';
    return `<tr>
      <td><strong>#${c.serial || ''}</strong></td>
      <td>${c.cliente_nombre}</td>
      <td>${fCOP(c.total)}</td>
      <td>${new Date(c.created_at).toLocaleDateString()}</td>
      <td>${bdg}</td>
      <td>
        ${c.estado !== 'Aprobada' ? `<button class="btn btn-negro btn-sm" onclick="convertirCotizacionAPedido('${c.id}')">Convertir a Pedido 🚀</button>` : '-'}
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
  }
}

async function convertirCotizacionAPedido(id) {
  if(!confirm("¿Convertir esta cotización en un pedido real? Esto generará un pedido en estado Pagado y se reflejará en las finanzas y logística.")) return;
  const { error } = await sb.rpc('admin_convertir_cotizacion_a_pedido', { p_cotizacion_id: id, pin: adminPin });
  if (error) mostrarToast(error.message, 'err');
  else {
    mostrarToast("Convertido a pedido exitosamente ✓", "ok");
    cargarCotizaciones();
    // Refresh pedidos
    const { data } = await sb.rpc("admin_get_pedidos", { pin: adminPin });
    if(data) todosPedidos = data;
    actualizarResumen();
    renderPedidos();
  }
}
'''
content = content.replace('function b2bGenerarImpresion() {', b2b_js + '\nfunction b2bGenerarImpresion() {')

# Hook login
content = content.replace('cargarStock();\n    cargarProduccion();', 'cargarStock();\n    cargarProduccion();\n    cargarCotizaciones();')

with open('web/YOSSICO_Panel_Admin.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("B2B Applied.")
