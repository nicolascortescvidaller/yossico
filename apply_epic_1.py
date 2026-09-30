import re

with open('web/YOSSICO_Panel_Admin.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace using lambda or string interpolation for the replacement
rma_btn = '<button onclick="abrirModalRMA(\\\'${p.id}\\\')" style="background:#fff3e0;color:#e65100;border:1px solid #ffcc80;padding:0.3rem;font-size:0.65rem;cursor:pointer;border-radius:3px;font-family:inherit;margin-top:0.3rem;display:block;width:100%">🔄 Cambio (RMA)</button>'
content = re.sub(r'(\$\{esPendiente\(p\.estado\) \? `<button onclick="recuperarVenta\(\'\$\{p\.id\}\'\)"[^>]+>💬 Recuperar<\/button>` : \'\'\})', r'\1\n          ' + rma_btn, content)

with open('web/YOSSICO_Panel_Admin.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("RMA Applied Fixed.")
