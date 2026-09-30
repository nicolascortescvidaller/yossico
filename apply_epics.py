import re

with open('web/YOSSICO_Panel_Admin.html', 'r', encoding='utf-8') as f:
    content = f.read()

# --- FEATURE 2: Batch Fulfillment ---
# 1. Add button
batch_btn_html = '''
          <div class="filtros-bar" style="margin:0; gap:0.5rem; display:flex;">
            <button class="btn btn-negro" onclick="imprimirRotulosLote()" style="font-size:0.75rem; padding:0.4rem 0.8rem">🖨️ Imprimir Seleccionados</button>
'''
content = content.replace('<div class="filtros-bar" style="margin:0">', batch_btn_html)

# 2. Add checkboxes in renderEnvios
chk_html = '<td><input type="checkbox" class="chk-envio" value="${p.id}" style="margin-right:8px;"><code style="font-size:.7rem">${(p.id||"").split("-")[0]}</code></td>'
content = re.sub(r'<td><code style="font-size:\.7rem">\$\{\(p\.id\|\|""\)\.split\("-"\)\[0\]\}</code></td>', chk_html, content)

# 3. Add JS function
batch_js = '''
function imprimirRotulosLote() {
  const checkboxes = document.querySelectorAll('.chk-envio:checked');
  if (checkboxes.length === 0) { mostrarToast("Selecciona al menos un pedido", "warn"); return; }
  
  let ids = Array.from(checkboxes).map(c => c.value);
  let htmlRotulos = '';
  
  ids.forEach(id => {
    const p = todosPedidos.find(x => x.id === id);
    if(!p) return;
    const prendas = (p.items||[]).map(i => `${i.nombre} T${i.talla} x${i.qty}`).join(", ");
    htmlRotulos += `
      <div class="label" style="page-break-after: always; border: 2px solid #000; width: 10cm; height: 15cm; padding: 1.5rem; box-sizing: border-box; margin: 0 auto; position: relative;">
        <div class="logo" style="font-size: 1.5rem; letter-spacing: 3px; font-weight: bold; margin-bottom: 2rem; border-bottom: 2px solid #000; padding-bottom: 1rem; text-align: center;">YOSSICO</div>
        <div class="row" style="margin-bottom: 1rem;"><div class="lbl" style="font-size: 0.7rem; text-transform: uppercase; letter-spacing: 1px; color: #555;">Destinatario</div><div class="val" style="font-size:1.3rem; font-weight: bold;">${p.cliente_nombre || '-'}</div></div>
        <div class="row" style="margin-bottom: 1rem;"><div class="lbl" style="font-size: 0.7rem; text-transform: uppercase; letter-spacing: 1px; color: #555;">Teléfono</div><div class="val" style="font-size: 1.1rem; font-weight: bold;">${p.cliente_telefono || '-'}</div></div>
        <div class="row" style="margin-bottom: 1rem;"><div class="lbl" style="font-size: 0.7rem; text-transform: uppercase; letter-spacing: 1px; color: #555;">Dirección</div><div class="val" style="font-size: 1.1rem; font-weight: bold;">${p.cliente_direccion || '-'}</div><div class="val" style="margin-top:0.3rem; font-size: 1.1rem; font-weight: bold;">${p.cliente_ciudad || '-'}</div></div>
        <div class="row" style="margin-top:2rem"><div class="lbl" style="font-size: 0.7rem; text-transform: uppercase; letter-spacing: 1px; color: #555;">Contenido</div><div class="val" style="font-size:0.9rem; font-weight:normal;">${prendas}</div></div>
        <div class="footer" style="position: absolute; bottom: 1.5rem; left: 1.5rem; right: 1.5rem; font-size: 0.7rem; text-align: center; border-top: 1px solid #ccc; padding-top: 1rem;">Pedido #${p.id.split('-')[0]}<br>Remitente: YOSSICO - Bogotá, Colombia</div>
      </div>
    `;
  });
  
  const v = window.open('', '_blank');
  v.document.write(`<html><head><title>Rótulos en Lote</title><style>body { font-family: sans-serif; margin: 0; color: #000; }</style></head><body onload="window.print(); setTimeout(()=>window.close(), 500)">${htmlRotulos}</body></html>`);
  v.document.close();
}
'''
content = content.replace('function imprimirRotulo(id) {', batch_js + '\nfunction imprimirRotulo(id) {')

# --- FEATURE 5: CRM Segmentacion RFM ---
crm_replace = '''
      let badge = '';
      if (c.total_pedidos >= 3) badge = '<span style="background:#fff3e0;color:#e65100;padding:2px 6px;border-radius:4px;font-size:0.65rem;font-weight:bold">👑 VIP</span>';
      else {
         const diasDesdeUltimaCompra = (new Date() - new Date(c.ultimo_pedido)) / 86400000;
         if (c.total_pedidos === 1 && diasDesdeUltimaCompra <= 15) badge = '<span style="background:#e8f5e9;color:#2e7d32;padding:2px 6px;border-radius:4px;font-size:0.65rem;font-weight:bold">🌱 Nuevo</span>';
         else if (diasDesdeUltimaCompra > 90) badge = '<span style="background:#ffebee;color:#c62828;padding:2px 6px;border-radius:4px;font-size:0.65rem;font-weight:bold">⚠️ En Riesgo</span>';
      }
      return `<tr>
        <td><strong>${c.cliente_nombre || '-'}</strong> ${badge}</td>
'''
content = re.sub(r'return `<tr>\s*<td><strong>\$\{c\.cliente_nombre \|\| \'\-\'\}<\/strong><\/td>', crm_replace, content)

with open('web/YOSSICO_Panel_Admin.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Batch & CRM Applied.")
