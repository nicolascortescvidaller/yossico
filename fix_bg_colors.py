import re

with open('web/YOSSICO_Panel_Admin.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix progress bar backgrounds
content = content.replace('background:#fbdada', 'background:var(--rojoCl)')
content = content.replace('background:#d32f2f', 'background:var(--rojo)')
content = content.replace('background:#f9fdfa', 'background:var(--blanco)')
content = content.replace('background:#fffaf5', 'background:var(--blanco)')
content = content.replace('background:#f4f9ff', 'background:var(--blanco)')

# Ensure inputs in RMA modal have the right CSS classes so they adapt to dark mode
# Oh, the RMA modal has <select class="input-form"> but CSS is `.form-group input, .form-group select`
content = content.replace('class="input-form"', 'class="input-form" style="background:var(--grisF); color:var(--negro); border:1px solid var(--grisCl); padding:0.5rem; width:100%; border-radius:4px;"')

# Fix the B2B print table colors. Ensure they don't break in dark mode
# Done by the CSS rule we injected earlier.

with open('web/YOSSICO_Panel_Admin.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Background colors fixed.")
