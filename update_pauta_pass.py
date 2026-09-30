import re

with open('web/YOSSICO_Panel_Admin.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add Pauta button before Rentabilidad
pauta_btn = '''      <button class="tab-btn" onclick="cambiarTab('pauta',this)">
        <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"></path></svg>
        Pauta & Mkt
      </button>\n'''

if 'onclick="cambiarTab(\'pauta\',this)"' not in content:
    content = content.replace('<button class="tab-btn" onclick="cambiarTab(\'finanzas\',this)">', pauta_btn + '      <button class="tab-btn" onclick="cambiarTab(\'finanzas\',this)">')

# 2. Add password check in cambiarTab
# First, remove the existing visual switch from the top of the function
old_switch = '''function cambiarTab(tab, btn) {
  document.querySelectorAll(".tab-content").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
  document.getElementById("tab-" + tab).classList.add("active");
  btn.classList.add("active");'''

new_switch = '''function cambiarTab(tab, btn) {
  if (tab === 'finanzas') {
    if (sessionStorage.getItem('rent_auth') !== 'true') {
      const pass = prompt("Acceso Restringido. Ingresa la contraseña maestra para ver Finanzas:");
      if (pass !== "Nc1018499182*") {
        mostrarToast("Contraseña incorrecta", "err");
        return; // Detiene el cambio de pestaña
      }
      sessionStorage.setItem('rent_auth', 'true');
    }
  }

  document.querySelectorAll(".tab-content").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
  document.getElementById("tab-" + tab).classList.add("active");
  btn.classList.add("active");'''

content = content.replace(old_switch, new_switch)

with open('web/YOSSICO_Panel_Admin.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Pauta button and Password added.")
