import re

with open('web/YOSSICO_Panel_Admin.html', 'r', encoding='utf-8') as f:
    content = f.read()

start_str = 'let chartSim = null;'
end_str = '  // --- Lógica Tabla Unit Economics (Catálogo) ---'

idx_start = content.find(start_str)
idx_end = content.find(end_str, idx_start)

if idx_start != -1 and idx_end != -1:
    block = content[idx_start:idx_end]
    content = content[:idx_start] + content[idx_end:]
    content = content.replace('</script>\n</body>', block + '\n</script>\n</body>')
    with open('web/YOSSICO_Panel_Admin.html', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Simulator scope fixed.")
else:
    print("Could not find blocks")
