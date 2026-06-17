import os
import glob
import re

html_files = glob.glob('/Users/nicolascortesv/Documents/Proyectos/Yossico/web/*.html')

new_cart_html = """  <div class="nav__actions">
    <button class="cart-icon-btn" id="cart-open" aria-label="Carrito">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <path d="M16 10a4 4 0 0 1-8 0"></path>
      </svg>
      <span class="cart-badge" id="cart-badge">0</span>
    </button>
  </div>"""

for filepath in html_files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Match the specific cart li block
    # It might have varying whitespace, but generally looks like:
    #       <li>
    #         <button class="cart-icon-btn" id="cart-open" aria-label="Carrito">
    #           ...
    #         </button>
    #       </li>
    pattern = r'<li>\s*<button class="cart-icon-btn".*?</button>\s*</li>'
    
    if re.search(pattern, content, re.DOTALL):
        # Remove the li block
        content = re.sub(pattern, '', content, flags=re.DOTALL)
        
        # Now find the closing </ul> of the nav__links
        # Usually: </ul>\n  </nav>
        # We will insert the new_cart_html right after the </ul> that closes nav__links
        # Because we already removed the <li>, the </ul> should be preceded by </li> or whitespace
        
        # Let's find: `</ul>` and replace it with `</ul>\n` + new_cart_html
        # To be safe and target only the nav__links ul, we can do:
        # replace the first </ul> that appears after `<ul class="nav__links">`
        
        # A simpler approach: Just replace `</ul>` with `</ul>\n` + new_cart_html.
        # But some files (like coleccion.html) have multiple ul's!
        # So we split by `<ul class="nav__links">`, then replace the first `</ul>` in the second half.
        
        parts = content.split('<ul class="nav__links">')
        if len(parts) == 2:
            subparts = parts[1].split('</ul>', 1)
            if len(subparts) == 2:
                parts[1] = subparts[0] + '</ul>\n' + new_cart_html + subparts[1]
                content = '<ul class="nav__links">'.join(parts)
        
        # Fix index.html missing cart.js
        if "index.html" in filepath and "cart.js" not in content:
            content = content.replace('<script src="script.js"></script>', '<script src="script.js"></script>\n  <script src="cart.js"></script>')

        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")
