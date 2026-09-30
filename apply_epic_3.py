import re

with open('web/YOSSICO_Panel_Admin.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add UI for Production Orders above stock grid
ui_prod = '''
      <!-- ÓRDENES DE PRODUCCIÓN -->
      <div class="stock-section" style="margin-bottom:2rem; background:var(--blanco); padding:1rem; border:1px solid var(--grisCl); border-radius:4px;">
        <div class="flex-between">
          <div class="section-title" style="margin-bottom:0">Órdenes a Fábrica 🏭</div>
          <button class="btn btn-gris btn-sm" onclick="nuevaOrdenProduccion()">+ Nueva Orden</button>
        </div>
        <table style="margin-top:1rem; width:100%">
          <thead><tr><th>Modelo</th><th>Color</th><th>Talla</th><th>Cantidad</th><th>F. Esperada</th><th>Estado</th><th>Acción</th></tr></thead>
          <tbody id="tabla-produccion"><tr><td colspan="7" class="loading">Cargando órdenes...</td></tr></tbody>
        </table>
      </div>
'''
content = content.replace('<div id="stock-grid" class="stock-grid">', ui_prod + '\n<div id="stock-grid" class="stock-grid">')

# 2. Add Velocity indicator in renderStock
# We inject a function calculateVelocity(nombre, talla)
vel_fn = '''
function calcularDiasStock(nombre, color, talla, stock) {
  if (stock === 0) return 0;
  const hace30Dias = new Date(); hace30Dias.setDate(hace30Dias.getDate() - 30);
  let ventasMes = 0;
  todosPedidos.forEach(p => {
    if (new Date(p.created_at) >= hace30Dias && (p.estado === 'Pagado' || p.estado === 'Pendiente')) {
      (p.items || []).forEach(i => {
        if (i.nombre === nombre && (i.talla||'').toUpperCase() === talla.toUpperCase()) ventasMes += (i.qty || 1);
      });
    }
  });
  if (ventasMes === 0) return 999;
  const ritmoDiario = ventasMes / 30;
  return Math.round(stock / ritmoDiario);
}
'''
content = content.replace('function renderStock() {', vel_fn + '\nfunction renderStock() {')

# Inject into the stock card HTML
# Find the badge html injection point
stock_card_badge = '''
      const diasStr = diasStock === 999 ? '>30d' : (diasStock + 'd');
      const velBadge = diasStock < 14 ? `<span style="background:#ffebee;color:#c62828;padding:2px 4px;font-size:0.6rem;border-radius:2px;margin-left:5px">Agota en ${diasStr}</span>` : 
                       (diasStock < 30 ? `<span style="background:#fff3e0;color:#e65100;padding:2px 4px;font-size:0.6rem;border-radius:2px;margin-left:5px">Agota en ${diasStr}</span>` : '');
      const badge = s.stock <= 5 
        ? '<span style="background:var(--rojoCl);color:var(--rojo);padding:2px 6px;border-radius:2px;font-size:.7rem;margin-left:5px">Crítico</span>' 
        : '';
      return `<div style="display:flex;justify-content:space-between;padding:.4rem 0;border-bottom:1px solid var(--grisCl)">
        <span style="font-size:.85rem;font-weight:500">Talla ${s.talla} ${badge} ${velBadge}</span>
'''
content = re.sub(r'const badge = s\.stock <= 5[\s\S]*?<span style="font-size:\.85rem;font-weight:500">Talla \$\{s\.talla\} \$\{badge\}<\/span>', stock_card_badge, content)
content = content.replace('const badge =', 'const diasStock = calcularDiasStock(s.nombre, s.color, s.talla, s.stock);\n      const badge =')

# 3. JS for Production Orders
prod_js = '''
window.todasOrdenesProd = [];
async function cargarProduccion() {
  const tbody = document.getElementById('tabla-produccion');
  if(!tbody) return;
  const { data, error } = await sb.from('ordenes_produccion').select('*').order('created_at', { ascending: false });
  if (error) { tbody.innerHTML = `<tr><td colspan="7" class="loading">Error: ${error.message}</td></tr>`; return; }
  window.todasOrdenesProd = data || [];
  renderProduccion();
}

function renderProduccion() {
  const tbody = document.getElementById('tabla-produccion');
  if (window.todasOrdenesProd.length === 0) { tbody.innerHTML = '<tr><td colspan="7" class="loading" style="text-align:center">Sin órdenes en fábrica</td></tr>'; return; }
  
  tbody.innerHTML = window.todasOrdenesProd.map(o => {
    const estadoBadge = o.estado === 'entregado' ? '<span style="background:#e8f5e9;color:#2e7d32;padding:2px 6px;border-radius:4px;font-size:0.7rem">✅ Entregado</span>' :
                        '<span style="background:#fff3e0;color:#e65100;padding:2px 6px;border-radius:4px;font-size:0.7rem">⏳ En Confección</span>';
    return `<tr>
      <td><strong>${o.modelo}</strong></td>
      <td>${o.color}</td>
      <td>${o.talla}</td>
      <td>${o.cantidad} und.</td>
      <td>${o.fecha_esperada || 'Sin fecha'}</td>
      <td>${estadoBadge}</td>
      <td>
        ${o.estado === 'en_confeccion' ? `<button class="btn btn-gris btn-sm" onclick="marcarProdEntregada('${o.id}', '${o.modelo}', '${o.talla}', ${o.cantidad})">Recibir Stock</button>` : '-'}
      </td>
    </tr>`;
  }).join('');
}

async function nuevaOrdenProduccion() {
  const mod = prompt("Modelo (ej: OSLO):"); if(!mod) return;
  const col = prompt("Color:"); if(!col) return;
  const tal = prompt("Talla (S, M, L):"); if(!tal) return;
  const cant = parseInt(prompt("Cantidad a fabricar:")); if(!cant) return;
  const fecha = prompt("Fecha esperada (YYYY-MM-DD):");
  
  const { error } = await sb.from('ordenes_produccion').insert([{ modelo: mod, color: col, talla: tal, cantidad: cant, fecha_esperada: fecha }]);
  if (error) mostrarToast(error.message, 'err');
  else { mostrarToast("Orden creada", "ok"); cargarProduccion(); }
}

async function marcarProdEntregada(id, modelo, talla, cantidad) {
  if(!confirm(`¿Marcar ${cantidad} und de ${modelo} Talla ${talla} como recibidas en inventario?`)) return;
  
  // 1. Marcar estado
  await sb.from('ordenes_produccion').update({ estado: 'entregado' }).eq('id', id);
  
  // 2. Sumar stock
  // This is a direct update, requires logic in BD or direct via REST since we have service_role?
  // Let's do it via direct REST using the anon key (if we gave permissions) or via the stockData JS logic for now, 
  // actually we can find the id in stockData and update it.
  const prod = stockData.find(s => s.nombre.toUpperCase() === modelo.toUpperCase() && s.talla.toUpperCase() === talla.toUpperCase());
  if (prod) {
    const { error } = await sb.from('productos').update({ stock: prod.stock + cantidad }).eq('id', prod.id);
    if(error) mostrarToast(error.message, 'err');
    else { mostrarToast("Stock sumado", "ok"); cargarStock(); }
  } else {
    mostrarToast("No existe el producto base en inventario, crea la prenda primero", "warn");
  }
  cargarProduccion();
}
'''
content = content.replace('async function cargarStock() {', prod_js + '\nasync function cargarStock() {')

# Hook cargarProduccion into the login flow
content = content.replace('cargarStock();', 'cargarStock();\n    cargarProduccion();')

with open('web/YOSSICO_Panel_Admin.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Inventory Intelligence Applied.")
