import re

with open('web/YOSSICO_Panel_Admin.html', 'r', encoding='utf-8') as f:
    content = f.read()

# I will extract the pauta block from inside renderFinanzas and put it outside.
# Let's locate it exactly.
start_str = 'window.todaPauta = [];'
end_str = '  // --- Lógica Tabla Top Prendas (Histórico) ---'

# Find the block
import sys

idx_start = content.find(start_str)
if idx_start == -1:
    print("Not found")
    sys.exit(0)

idx_end = content.find(end_str, idx_start)
if idx_end == -1:
    print("End not found")
    sys.exit(0)

# The block to move
block = content[idx_start:idx_end]

# Remove it from there
content = content[:idx_start] + content[idx_end:]

# Append it at the end of the file, before the closing </script>
content = content.replace('</script>\n</body>', block + '\n</script>\n</body>')

with open('web/YOSSICO_Panel_Admin.html', 'w', encoding='utf-8') as f:
    f.write(content)
print("Scope fixed.")
