import sys

with open("web/YOSSICO_Panel_Admin.html", "r") as f:
    content = f.read()

# Find where the script starts
script_start = content.find("<script>")
if script_start == -1:
    print("Script tag not found")
    sys.exit(1)

# Replace the script with our new one
new_script = """
<!-- DEPENDENCIAS SUPABASE -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="js/auth.js"></script>

<script>
let adminPin = sessionStorage.getItem("admin_pin") || null;
let sb;
let stockData = [];

document.addEventListener("DOMContentLoaded", () => {
  sb = window.YOSSICO_AUTH.getSb();
  if (adminPin) {
    verificarPin(adminPin);
  }
});

// ── LOGIN ────────────────────────────────────────────────
async function login() {
  const pass = document.getElementById("input-pass").value;
  await verificarPin(pass);
}

document.getElementById("input-pass").addEventListener("keydown", e => {
  if (e.key === "Enter") login();
});

async function verificarPin(pin) {
  try {
    const { data, error } = await sb.rpc('admin_get_pedidos', { pin: pin });
    if (error) throw error;
    
    // Login exitoso
    adminPin = pin;
    sessionStorage.setItem("admin_pin", adminPin);
    document.getElementById("login-screen").classList.add("hidden");
    document.getElementById("panel").classList.remove("hidden");
    document.getElementById("usuario-info").textContent = "Admin";
    
    cargarStock();
    renderPedidos(data);
  } else {
    mostrarToast("Contraseña incorrecta", "err");
    adminPin = null;
    sessionStorage.removeItem("admin_pin");
  }
}

// ── CARGAR PEDIDOS ───────────────────────────────────────
async function cargarPedidos() {
  const tbody = document.getElementById("tabla-pedidos");
  tbody.innerHTML = '<tr><td colspan="7" class="loading">Cargando pedidos...</td></tr>';
  
  const { data, error } = await sb.rpc('admin_get_pedidos', { pin: adminPin });
  if (error) {
    mostrarToast("Error cargando pedidos", "err");
    return;
  }
  renderPedidos(data);
}

function renderPedidos(pedidos) {
  const tbody = document.getElementById("tabla-pedidos");
  document.getElementById("contador-hoy").textContent = `${pedidos.length} pedidos históricos`;
  
  if (pedidos.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="loading">No hay pedidos registrados</td></tr>';
    return;
  }
  
  tbody.innerHTML = pedidos.map(p => {
    let primerSKU = "Varios";
    let primerTalla = "-";
    if (p.items && p.items.length > 0) {
      primerSKU = p.items[0].nombre;
      primerTalla = p.items[0].talla;
    }
    
    const est = (p.estado || "").toLowerCase();
    const isCancelado = est.includes("cancelado");
    const isPagado = est.includes("pagado") || est.includes("completado");
    const statusClass = isCancelado ? 'err' : isPagado ? 'ok' : 'warn';
    
    return `
      <tr>
        <td><small>${p.id.split('-')[0]}</small></td>
        <td>${p.cliente_nombre}<br><small>${p.cliente_telefono || ''}</small></td>
        <td>${primerSKU}</td>
        <td>${primerTalla}</td>
        <td>$${parseInt(p.total).toLocaleString('es-CO')}</td>
        <td>-</td>
        <td>
          <span class="toast-${statusClass}" style="padding:4px 8px;border-radius:4px;font-size:0.8em;display:inline-block;margin-bottom:4px;">${p.estado}</span><br>
          <select onchange="cambiarEstadoPedido('${p.id}', this.value)" style="font-size:0.8em;padding:2px">
            <option value="">Mover a...</option>
            <option value="Pagado">✅ Pagado</option>
            <option value="Pendiente">⏳ Pendiente</option>
            <option value="Cancelado">❌ Cancelado</option>
          </select>
        </td>
      </tr>
    `;
  }).join("");
}

async function cambiarEstadoPedido(id, nuevoEstado) {
  if (!nuevoEstado) return;
  
  if (nuevoEstado === "Cancelado") {
    if (!confirm("¿Seguro que deseas cancelar? El stock será devuelto automáticamente.")) {
      cargarPedidos();
      return;
    }
  }
  
  const { error } = await sb.rpc('admin_actualizar_pedido', { 
    p_id: id, 
    p_nuevo_estado: nuevoEstado, 
    pin: adminPin 
  });
  
  if (error) {
    mostrarToast("Error actualizando: " + error.message, "err");
  } else {
    mostrarToast("Pedido actualizado", "ok");
    cargarPedidos();
    cargarStock();
  }
}

// ── CARGAR STOCK ─────────────────────────────────────────
async function cargarStock() {
  const grid = document.getElementById("stock-grid");
  grid.innerHTML = '<div class="loading">Actualizando stock...</div>';

  try {
    const { data, error } = await sb.from('productos').select('*');
    if (error) throw error;
    
    stockData = data;
    
    const agrupado = {};
    data.forEach(item => {
      const key = `${item.nombre}|${item.color}`;
      if (!agrupado[key]) agrupado[key] = { nombre: item.nombre, color: item.color, stock_s: 0, stock_m: 0, stock_l: 0 };
      if (item.talla === 'S') agrupado[key].stock_s = item.stock;
      if (item.talla === 'M') agrupado[key].stock_m = item.stock;
      if (item.talla === 'L') agrupado[key].stock_l = item.stock;
    });
    
    renderStock(Object.values(agrupado));
    filtrarSKUs();
  } catch (err) {
    grid.innerHTML = `<div class="loading" style="color:var(--rojo)">Error stock: ${err.message}</div>`;
  }
}

function renderStock(stock) {
  const grid = document.getElementById("stock-grid");
  grid.innerHTML = stock.map(item => {
    const badge = (n, label) => {
      const cls = n === 0 ? "talla-cero" : n <= 3 ? "talla-bajo" : "talla-ok";
      return `<div class="talla-badge ${cls}">${label}<br><strong>${n}</strong></div>`;
    };
    return `
      <div class="stock-item">
        <div class="stock-nombre"><strong>${item.nombre}</strong></div>
        <div class="stock-color" style="font-size:0.8rem;color:var(--grisMed);margin-bottom:8px">${item.color}</div>
        <div class="stock-tallas">
          ${badge(item.stock_s, "S")}
          ${badge(item.stock_m, "M")}
          ${badge(item.stock_l, "L")}
        </div>
      </div>
    `;
  }).join("");
}

// ── FORMULARIO MANUAL (POS) ──────────────────────────────
function filtrarSKUs() {
  // Ignoramos f-linea y mostramos todos los SKUs disponibles en la DB
  const sel = document.getElementById("f-sku");
  sel.innerHTML = '<option value="">Seleccionar Prenda...</option>';
  
  const nombresUnicos = [...new Set(stockData.map(s => s.nombre))].sort();
  nombresUnicos.forEach(nombre => {
    const opt = document.createElement("option");
    opt.value = nombre;
    opt.textContent = nombre;
    sel.appendChild(opt);
  });
}

function autoColor() {
  const nombre = document.getElementById("f-sku").value;
  const match = stockData.find(s => s.nombre === nombre);
  if (match) {
    document.getElementById("f-color").value = match.color;
  }
  actualizarStockPreview();
}

document.getElementById("f-sku").addEventListener("change", autoColor);
document.getElementById("f-color").addEventListener("input", actualizarStockPreview);
document.getElementById("f-talla").addEventListener("change", actualizarStockPreview);

function actualizarStockPreview() {
  const n = document.getElementById("f-sku").value;
  const c = document.getElementById("f-color").value;
  const t = document.getElementById("f-talla").value;
  
  const prev = document.getElementById("stock-preview");
  const nums = document.getElementById("stock-preview-nums");
  
  if (!n || !t) {
    prev.style.display = "none";
    return;
  }
  
  const match = stockData.find(s => s.nombre === n && (c ? s.color.includes(c) : true) && s.talla === t);
  
  if (match) {
    prev.style.display = "block";
    const qty = match.stock;
    const cls = qty === 0 ? "talla-cero" : qty <= 3 ? "talla-bajo" : "talla-ok";
    nums.innerHTML = `<div class="talla-badge ${cls}" style="padding:.3rem .75rem">${match.talla}: <strong>${qty}</strong> disponibles</div>`;
  } else {
    prev.style.display = "none";
  }
}

function checkEfectivo() {
  const pago = document.getElementById("f-pago").value;
  const banner = document.getElementById("efectivo-banner");
  if (pago === "Efectivo") banner.classList.add("visible");
  else banner.classList.remove("visible");
}

async function registrarVenta() {
  const nombre = document.getElementById("f-nombre").value.trim() || "Cliente POS";
  const telefono = document.getElementById("f-telefono").value.trim() || "N/A";
  const sku = document.getElementById("f-sku").value;
  const color = document.getElementById("f-color").value.trim() || '-';
  const talla = document.getElementById("f-talla").value;
  const cantidad = parseInt(document.getElementById("f-cantidad").value) || 1;
  const valor = document.getElementById("f-valor").value;
  const pago = document.getElementById("f-pago").value;

  if (!sku || !talla || !valor || !pago) {
    mostrarToast("Completa SKU, Talla, Valor y Pago", "err");
    return;
  }

  const items = [{
    nombre: sku,
    color: color,
    talla: talla,
    qty: cantidad,
    price: parseInt(valor)
  }];
  
  const estado = (pago === "Efectivo") ? "Efectivo - Pendiente" : "Pagado - " + pago;

  // Insertar en Supabase
  const { error } = await sb.from('pedidos').insert([{
    cliente_nombre: nombre,
    cliente_telefono: telefono,
    cliente_ciudad: "Venta Manual (POS)",
    cliente_direccion: "N/A",
    items: items,
    total: parseInt(valor),
    estado: estado,
    drop_numero: "Admin POS"
  }]);

  if (error) {
    mostrarToast("Error guardando pedido", "err");
    return;
  }
  
  // Descontar stock
  await sb.rpc('decrementar_stock', { items: items });
  
  mostrarToast("Venta registrada con éxito", "ok");
  limpiarFormulario();
  cargarPedidos();
  cargarStock();
}

function limpiarFormulario() {
  document.getElementById("f-nombre").value = "";
  document.getElementById("f-telefono").value = "";
  document.getElementById("f-sku").value = "";
  document.getElementById("f-color").value = "";
  document.getElementById("f-talla").selectedIndex = 0;
  document.getElementById("f-cantidad").value = 1;
  document.getElementById("f-valor").value = "";
  document.getElementById("f-pago").selectedIndex = 0;
  document.getElementById("f-linea").selectedIndex = 0;
  document.getElementById("f-descuento").selectedIndex = 0;
  document.getElementById("stock-preview").style.display = "none";
  checkEfectivo();
}

// ── UTILIDADES ───────────────────────────────────────────
function mostrarToast(msg, tipo = "ok") {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.className = "toast show " + (tipo === "err" ? "toast-err" : tipo === "warn" ? "toast-warn" : "toast-ok");
  setTimeout(() => t.classList.remove("show"), 3500);
}
</script>
</body>
</html>
"""

new_content = content[:script_start] + new_script

with open("web/YOSSICO_Panel_Admin.html", "w") as f:
    f.write(new_content)

print("Updated YOSSICO_Panel_Admin.html successfully")
