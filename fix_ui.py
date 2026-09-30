import re

with open('web/YOSSICO_Panel_Admin.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Fix RMA Button syntax
content = content.replace("abrirModalRMA(\\'${p.id}\\')", "abrirModalRMA('${p.id}')")

# 2. Fix the select size (estado-select)
# Currently it has style in line 1151: "margin-bottom:.5rem;width:100%;padding:.4rem;font-size:.7rem..."
# Let's override it in CSS or replace inline.
old_select_style = 'style="margin-bottom:.5rem;width:100%;padding:.4rem;font-size:.7rem;font-family:inherit;border:1px solid var(--grisCl);background:var(--grisF);outline:none;cursor:pointer;"'
new_select_style = 'style="margin-bottom:.5rem;width:100%;padding:0.6rem;font-size:0.8rem;font-weight:400;font-family:inherit;border:1px solid var(--grisCl);background:var(--grisF);color:var(--negro);outline:none;cursor:pointer;border-radius:4px;"'
content = content.replace(old_select_style, new_select_style)

# Also fix the general CSS for estado-select just in case
content = content.replace('.estado-select{font-size:.7rem;padding:.25rem .4rem;', '.estado-select{font-size:.8rem;padding:.5rem .6rem;border-radius:4px;')

# 3. Remove Emojis from Tabs
content = content.replace('📦 Pedidos', 'Pedidos')
content = content.replace('🚚 Envíos', 'Logística')
content = content.replace('👕 Inventario', 'Inventario')
content = content.replace('🛍️ POS', 'POS (Venta Manual)')
content = content.replace('📊 Estadísticas', 'Estadísticas')
content = content.replace('💰 Rentabilidad', 'Rentabilidad')
content = content.replace('🏷️ Descuentos', 'Descuentos')
content = content.replace('👥 Clientes', 'Clientes')
content = content.replace('🏢 B2B', 'Cotizador B2B')

# 4. Remove Emojis from Buttons
content = content.replace('🖨️ Imprimir', 'Imprimir')
content = content.replace('💬 Recuperar', 'Recuperar WA')
content = content.replace('💬 Notificar', 'Notificar WA')
content = content.replace('💬 WA', 'WhatsApp')
content = content.replace('🔄 Cambio (RMA)', 'Procesar Cambio')
content = content.replace('📍 Rastrear', 'Rastrear')
content = content.replace('💾 Guardar Cotización en Base de Datos', 'Guardar Cotización')
content = content.replace('Convertir a Pedido 🚀', 'Aprobar a Pedido')
content = content.replace('Órdenes a Fábrica 🏭', 'Órdenes a Fábrica')

# 5. Emojis in Badges & Statuses
content = content.replace('👑 VIP', 'VIP')
content = content.replace('🌱 Nuevo', 'NUEVO')
content = content.replace('⚠️ En Riesgo', 'EN RIESGO')
content = content.replace('✅ Entregado', 'Entregado')
content = content.replace('⏳ En Confección', 'En Confección')
content = content.replace('⏳ Pendientes de Despacho', 'Pendientes de Despacho')
content = content.replace('📦 Ya Despachados', 'Ya Despachados')

with open('web/YOSSICO_Panel_Admin.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("UI Emojis and RMA Fixed.")
