import os
import re

html_files = [f for f in os.listdir('web') if f.endswith('.html')]

seo_data = {
    "index.html": {"title": "YOSSICO — Uniformes médicos premium para la mujer en salud", "desc": "Diseños exclusivos de uniformes médicos para enfermeras y profesionales de la salud en Colombia. Calidad premium, telas técnicas, estilo editorial."},
    "coleccion.html": {"title": "Colección — YOSSICO", "desc": "Explora la colección de uniformes médicos YOSSICO: Essentials, Signature, Core y Capas. Diseñados para la mujer en salud."},
    "nosotros.html": {"title": "Nosotros — YOSSICO", "desc": "Conoce la historia detrás de YOSSICO, la marca colombiana que redefine la ropa médica femenina."},
    "historia.html": {"title": "Historia — YOSSICO", "desc": "Cómo nació YOSSICO: la marca que nació del propósito de vestir con dignidad a la mujer en salud."},
    "contacto.html": {"title": "Contacto — YOSSICO", "desc": "Escríbenos o contáctanos por WhatsApp. Estamos para atenderte."},
    "acronimo.html": {"title": "El Acrónimo — YOSSICO", "desc": "El significado detrás de YOSSICO y los valores que definen cada prenda."},
    "terminos.html": {"title": "Términos y condiciones — YOSSICO", "desc": "Política de compra, devoluciones y términos de uso de la tienda YOSSICO."},
    "guia-de-tallas.html": {"title": "Guía de tallas — YOSSICO", "desc": "Encuentra tu talla perfecta con nuestra guía de medidas para uniformes médicos YOSSICO."},
    "gracias.html": {"title": "Pedido confirmado — YOSSICO", "desc": "Gracias por tu pedido en YOSSICO.", "noindex": True},
    "checkout.html": {"title": "Checkout — YOSSICO", "desc": "Completa tu pedido de uniformes médicos YOSSICO.", "noindex": True},
    "404.html": {"title": "Página no encontrada — YOSSICO", "desc": "Página no encontrada.", "noindex": True}
}

default_seo = {"title": "YOSSICO — Ropa médica premium", "desc": "Uniformes médicos premium para la mujer en salud."}

for filename in html_files:
    filepath = os.path.join('web', filename)
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Don't add tags if they already exist
    if '<!-- SEO -->' in content or '<meta property="og:title"' in content:
        continue

    data = seo_data.get(filename, default_seo)
    noindex = data.get("noindex", False)
    
    meta_block = f"""
  <!-- SEO -->
  <meta name="description" content="{data['desc']}">
  <meta name="keywords" content="uniformes médicos, enfermería, Colombia, ropa médica premium, YOSSICO">
  <meta name="author" content="YOSSICO">"""
    
    if noindex:
        meta_block += '\n  <meta name="robots" content="noindex">'

    meta_block += f"""
  <!-- Open Graph -->
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="YOSSICO">
  <meta property="og:title" content="{data['title']}">
  <meta property="og:description" content="{data['desc']}">
  <meta property="og:image" content="https://yossico.com/img/og-yossico.jpg">
  <meta property="og:url" content="https://yossico.com/{filename}">
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{data['title']}">
  <meta name="twitter:description" content="{data['desc']}">
  <meta name="twitter:image" content="https://yossico.com/img/og-yossico.jpg">
"""
    
    if '<meta name="viewport"' in content:
        new_content = re.sub(r'(<meta name="viewport"[^>]*>)', r'\1' + meta_block, content, count=1)
    else:
        new_content = re.sub(r'(<head>)', r'\1' + meta_block, content, count=1, flags=re.IGNORECASE)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)

print("SEO tags injected successfully.")
