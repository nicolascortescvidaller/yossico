import re

base = '/Users/nicolascortesvidaller/yossico'
def readf(p):
    with open(p, 'r', encoding='utf-8') as f: return f.read()
def writef(p, c):
    with open(p, 'w', encoding='utf-8') as f: f.write(c)

index = readf(f'{base}/web/index.html')

# Extract head
head_match = re.search(r'(<!DOCTYPE html>\s*<html[^>]*>\s*<head>.*?</head>)', index, re.DOTALL)
head = head_match.group(1) if head_match else ""

# Extract top banner and nav
# Let's extract everything from <body> to </header>
nav_match = re.search(r'(<body.*?</header>)', index, re.DOTALL)
nav = nav_match.group(1) if nav_match else "<body><header></header>"

# Extract footer and scripts
footer_match = re.search(r'(<footer class="footer">.*</html>)', index, re.DOTALL)
footer = footer_match.group(1) if footer_match else "</footer></body></html>"

css = """
  <style>
    .rastreo-container {
      max-width: 600px;
      margin: 120px auto;
      padding: 40px 20px;
      text-align: center;
      min-height: 50vh;
    }
    .rastreo-title {
      font-family: var(--font-display);
      font-size: 32px;
      margin-bottom: 10px;
    }
    .rastreo-subtitle {
      font-family: var(--font-body);
      font-size: 14px;
      color: var(--gray-mid);
      margin-bottom: 30px;
    }
    .rastreo-input {
      width: 100%;
      padding: 12px;
      border: 1px solid var(--border);
      border-radius: 4px;
      font-family: var(--font-body);
      font-size: 14px;
      margin-bottom: 20px;
    }
    .rastreo-btn {
      background: var(--black);
      color: #fff;
      border: none;
      padding: 14px 24px;
      font-family: var(--font-body);
      font-size: 13px;
      cursor: pointer;
      width: 100%;
      transition: background 0.3s;
    }
    .rastreo-btn:hover { background: #333; }
    .rastreo-results {
      margin-top: 40px;
      text-align: left;
    }
    .r-pedido {
      border: 1px solid var(--border);
      padding: 20px;
      margin-bottom: 20px;
      border-radius: 4px;
    }
    .r-header {
      display: flex;
      justify-content: space-between;
      border-bottom: 1px solid var(--border);
      padding-bottom: 10px;
      margin-bottom: 15px;
    }
    .badge {
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 11px;
      color: white;
      text-transform: uppercase;
      font-weight: 600;
    }
    .bg-green { background: #27ae60; }
    .bg-blue { background: #2980b9; }
    .bg-orange { background: #f39c12; }
    .bg-gray { background: #7f8c8d; }
    
    .timeline {
      margin-top: 20px;
      padding-left: 10px;
      border-left: 2px solid var(--border);
    }
    .timeline-item {
      position: relative;
      padding-bottom: 15px;
      padding-left: 15px;
    }
    .timeline-item::before {
      content: '';
      position: absolute;
      left: -21px;
      top: 0;
      width: 10px;
      height: 10px;
      background: var(--black);
      border-radius: 50%;
      border: 2px solid white;
    }
    .t-date { font-size: 11px; color: var(--gray-mid); }
    .t-status { font-size: 13px; font-weight: 600; }
  </style>
"""

head = head.replace('</head>', css + '</head>')
head = head.replace('<title>YOSSICO — Uniformes Médicos Premium</title>', '<title>Rastreo de Pedido — YOSSICO</title>')

body = """
<main class="rastreo-container">
  <h1 class="rastreo-title">Rastrea tu pedido</h1>
  <p class="rastreo-subtitle">Ingresa tu número de celular o los primeros 8 caracteres de tu #ID de pedido.</p>
  
  <input type="text" id="busqueda" class="rastreo-input" placeholder="Tu número de teléfono o #ID de pedido">
  <button id="btn-rastrear" class="rastreo-btn">Rastrear pedido →</button>
  
  <div id="rastreo-resultados" class="rastreo-results"></div>
</main>

<script>
  function formatPrice(val) {
    if (!val) return '$0';
    return '$' + parseFloat(val).toLocaleString('es-CO');
  }
  
  function getBadgeClass(status) {
    if (status === 'entregado') return 'bg-green';
    if (status === 'enviado') return 'bg-blue';
    if (status === 'confirmado') return 'bg-orange';
    return 'bg-gray';
  }

  document.getElementById('btn-rastrear').addEventListener('click', async () => {
    const val = document.getElementById('busqueda').value.trim();
    const resDiv = document.getElementById('rastreo-resultados');
    
    if (!val) {
      resDiv.innerHTML = '<p style="color:red">Por favor ingresa un dato para buscar.</p>';
      return;
    }
    
    resDiv.innerHTML = '<p>Buscando...</p>';
    
    try {
      const { data, error } = await window.supabaseClient.rpc('rastrear_pedido', { busqueda: val });
      if (error) throw error;
      
      if (!data || data.length === 0) {
        resDiv.innerHTML = `<p style="text-align:center;margin-top:40px;">
          No encontramos pedidos con ese dato.<br>
          Escríbenos a WhatsApp si necesitas ayuda.<br><br>
          <a href="https://wa.me/573219937221" target="_blank" style="display:inline-block;padding:10px 20px;background:#25D366;color:white;text-decoration:none;border-radius:4px;">Contactar por WhatsApp</a>
        </p>`;
        return;
      }
      
      let html = '';
      data.forEach(p => {
        let itemsHtml = '';
        (p.items || []).forEach(i => {
          itemsHtml += `<div style="font-size:13px;margin-bottom:5px;">▸ ${i.nombre} - Talla ${i.talla} (×${i.qty})</div>`;
        });
        
        let timelineHtml = '<div class="timeline">';
        if (p.historial_estados && p.historial_estados.length > 0) {
          p.historial_estados.forEach(h => {
            timelineHtml += `
              <div class="timeline-item">
                <div class="t-status">${(h.estado || 'Actualizado').toUpperCase()}</div>
                <div class="t-date">${new Date(h.fecha).toLocaleString('es-CO')}</div>
              </div>
            `;
          });
        } else {
           timelineHtml += `
              <div class="timeline-item">
                <div class="t-status">${(p.estado || 'Pendiente').toUpperCase()}</div>
                <div class="t-date">${new Date(p.created_at).toLocaleString('es-CO')}</div>
              </div>
            `;
        }
        timelineHtml += '</div>';
        
        let envioHtml = '';
        if (p.numero_guia && p.empresa_envio) {
          envioHtml = `<div style="margin-top:15px;padding:10px;background:#f9f9f9;border:1px solid #ddd;">
            <strong>Envío:</strong> ${p.empresa_envio} - Guía: ${p.numero_guia}
          </div>`;
        }
        
        html += `
          <div class="r-pedido">
            <div class="r-header">
              <div>
                <strong>Pedido:</strong> ${p.id.substring(0,8)}...<br>
                <span style="font-size:12px;color:gray">${new Date(p.created_at).toLocaleDateString('es-CO')}</span>
              </div>
              <div>
                <span class="badge ${getBadgeClass(p.estado)}">${p.estado}</span>
              </div>
            </div>
            
            <div style="margin-bottom:15px;">
              <strong>Cliente:</strong> ${p.cliente_nombre}<br>
              <strong>Total pagado:</strong> ${formatPrice(p.total)}
            </div>
            
            <div style="margin-bottom:15px;">
              <strong>Artículos:</strong><br>
              ${itemsHtml}
            </div>
            
            ${envioHtml}
            
            <div style="margin-top:20px;">
              <strong>Historial:</strong>
              ${timelineHtml}
            </div>
          </div>
        `;
      });
      
      resDiv.innerHTML = html;
      
    } catch(err) {
      console.error(err);
      resDiv.innerHTML = '<p style="color:red">Ocurrió un error al buscar. Intenta de nuevo.</p>';
    }
  });
</script>
"""

# I need to ensure supabaseClient is initialized in rastreo.html
# Wait, index.html might have supabase initialization in the footer, but maybe not globally available as window.supabaseClient.
# Let's just create a small init block.
init_supabase = """
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script>
  const SU_URL = 'https://mgzevtcipwfpqgolmpwm.supabase.co';
  const SU_KEY = 'sb_publishable_1bxubqO9tCMdrCTuWj9CKA_irvrSa19';
  window.supabaseClient = supabase.createClient(SU_URL, SU_KEY);
</script>
"""

full_html = head + nav + init_supabase + body + footer
writef(f'{base}/web/rastreo.html', full_html)
print("rastreo.html built")

