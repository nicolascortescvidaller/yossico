/**
 * YOSSICO — Cookie Consent Banner
 * Cumplimiento de transparencia y consentimiento informado (SIC / Habeas Data)
 */
(function() {
  'use strict';

  var STORAGE_KEY = 'yossico_cookie_consent';

  // Si el usuario ya tomó una decisión, no mostrar el banner
  try {
    if (localStorage.getItem(STORAGE_KEY)) {
      return;
    }
  } catch(e) {
    return;
  }

  function renderBanner() {
    if (document.getElementById('yossico-cookie-banner')) return;

    var banner = document.createElement('div');
    banner.id = 'yossico-cookie-banner';
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-label', 'Aviso de Cookies y Privacidad');
    
    // CSS inline para no depender de archivos externos
    banner.style.cssText = [
      'position: fixed',
      'bottom: 16px',
      'left: 16px',
      'right: 16px',
      'max-width: 600px',
      'margin: 0 auto',
      'background: #111111',
      'color: #FFFFFF',
      'padding: 16px 20px',
      'border-radius: 4px',
      'box-shadow: 0 10px 30px rgba(0,0,0,0.3)',
      'z-index: 99998',
      'display: flex',
      'flex-direction: column',
      'gap: 12px',
      'font-family: Montserrat, -apple-system, sans-serif',
      'font-size: 11px',
      'line-height: 1.6',
      'letter-spacing: 0.3px',
      'border: 1px solid rgba(255,255,255,0.15)',
      'animation: yosSlideUp 0.3s ease-out'
    ].join(';');

    var content = [
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;">',
      '  <div>',
      '    <span style="font-size:8px;letter-spacing:2px;text-transform:uppercase;color:#888;display:block;margin-bottom:4px;">Privacidad y Transparencia · SIC</span>',
      '    <p style="margin:0;color:#ddd;">Utilizamos cookies técnicas necesarias para tu carrito y pago seguro, y cookies de analítica para mejorar nuestra tienda. Puedes consultar nuestra <a href="cookies.html" style="color:#FFFFFF;text-decoration:underline;">Política de Cookies</a> y <a href="privacidad.html" style="color:#FFFFFF;text-decoration:underline;">Política de Privacidad</a>.</p>',
      '  </div>',
      '</div>',
      '<div style="display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;margin-top:4px;">',
      '  <button id="yos-cookie-essential" style="background:transparent;border:1px solid rgba(255,255,255,0.3);color:#fff;padding:6px 14px;font-family:inherit;font-size:10px;letter-spacing:1px;text-transform:uppercase;cursor:pointer;border-radius:2px;">Solo esenciales</button>',
      '  <button id="yos-cookie-all" style="background:#fff;border:1px solid #fff;color:#000;padding:6px 16px;font-family:inherit;font-size:10px;font-weight:600;letter-spacing:1px;text-transform:uppercase;cursor:pointer;border-radius:2px;">Aceptar todas</button>',
      '</div>'
    ].join('');

    banner.innerHTML = content;
    document.body.appendChild(banner);

    // Event handlers
    var btnAll = document.getElementById('yos-cookie-all');
    var btnEssential = document.getElementById('yos-cookie-essential');

    function closeBanner(choice) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          choice: choice,
          timestamp: new Date().toISOString(),
          version: '1.0'
        }));
      } catch(e) {}
      if (banner && banner.parentNode) {
        banner.style.opacity = '0';
        banner.style.transform = 'translateY(10px)';
        banner.style.transition = 'opacity 0.25s, transform 0.25s';
        setTimeout(function() {
          banner.parentNode.removeChild(banner);
        }, 250);
      }
    }

    if (btnAll) btnAll.addEventListener('click', function() { closeBanner('all'); });
    if (btnEssential) btnEssential.addEventListener('click', function() { closeBanner('essential'); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderBanner);
  } else {
    renderBanner();
  }
})();
