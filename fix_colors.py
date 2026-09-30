import re

with open('web/YOSSICO_Panel_Admin.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace hardcoded colors in Finanzas cards
content = content.replace('color:#000', 'color:var(--negro)')
content = content.replace('color:#d32f2f', 'color:var(--rojo)')
content = content.replace('color:#666', 'color:var(--grisMed)')
content = content.replace('color:#999', 'color:var(--grisMed)')
content = content.replace('color:#33691e', 'color:var(--verde)')

# For the CRM VIP badge, the background is #fff3e0 and text #e65100.
# It's better if these are explicitly defined or if we just leave them alone. 
# Since they have BOTH explicit background and explicit text, they will be readable regardless of the theme.

# There might be inline colors in table cells or headers:
# "color:#333" -> "color:var(--negro)" (only outside of b2b-print-view, but doing a global replace might break the print view).
# Let's check where #333 is. It's in <div id="b2b-print-view" ... color:#333;>. It's fine because the background is white.

# Fix the B2B Print view so it doesn't get messed up if some elements inherit dark mode
# Add a CSS rule: .dark-mode #b2b-print-view, .dark-mode #b2b-print-view * { color: initial... }
# It's easier to just add the CSS inside <style>
css_fix = '''
  body.dark-mode .resumen-card { background: var(--blanco) !important; border-color: var(--grisCl) !important; }
  body.dark-mode .stock-section { background: var(--blanco) !important; border-color: var(--grisCl) !important; }
  body.dark-mode #b2b-print-view { background: #FFFFFF !important; color: #333333 !important; }
  body.dark-mode #b2b-print-view * { color: inherit; }
  body.dark-mode #b2b-print-view .table-head { color: #0C4E57 !important; background: #EBF3F5 !important; }
'''
content = content.replace('body.dark-mode {', css_fix + '\n  body.dark-mode {')

with open('web/YOSSICO_Panel_Admin.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Colors fixed.")
