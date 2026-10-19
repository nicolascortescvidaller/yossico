/* YOSSICO — analítica propia ligera (visitas + clics clave). Sin cookies de terceros. */
(function () {
  'use strict';
  try {
    if (navigator.doNotTrack === '1') return;
    if (/bot|crawl|spider|slurp|preview|lighthouse/i.test(navigator.userAgent)) return;
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') return;

    var URL_ = 'https://mgzevtcipwfpqgolmpwm.supabase.co/rest/v1/rpc/registrar_visita';
    var KEY = 'sb_publishable_1bxubqO9tCMdrCTuWj9CKA_irvrSa19';

    function rid() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }
    function store(s, k) {
      try { var v = s.getItem(k); if (!v) { v = rid(); s.setItem(k, v); } return v; } catch (e) { return rid(); }
    }
    var visitante = store(localStorage, 'yos_vid');
    var sesion = store(sessionStorage, 'yos_sid');

    function fuente() {
      var p = new URLSearchParams(location.search);
      if (p.get('utm_source')) return p.get('utm_source');
      var ref = document.referrer;
      if (!ref) return 'directo';
      try {
        var h = new URL(ref).hostname.replace('www.', '');
        if (h === location.hostname.replace('www.', '')) return 'interno';
        return h;
      } catch (e) { return 'otro'; }
    }
    var src = fuente();
    if (src === 'interno') { try { src = sessionStorage.getItem('yos_src') || 'interno'; } catch (e) {} }
    else { try { sessionStorage.setItem('yos_src', src); } catch (e) {} }

    var dispositivo = /Mobi|Android|iPhone/i.test(navigator.userAgent) ? 'movil' : 'escritorio';
    var pagina = (location.pathname.replace(/\/$/, '') || '/index.html');
    if (pagina === '') pagina = '/';

    function send(evento) {
      try {
        var rawConsent = localStorage.getItem('yossico_cookie_consent');
        if (rawConsent) {
          var parsedConsent = JSON.parse(rawConsent);
          if (parsedConsent && parsedConsent.choice === 'essential') return;
        }
      } catch (_) {}

      var rowLocal = {
        pagina: pagina,
        evento: evento,
        referrer: document.referrer || '',
        fuente: src,
        sesion: sesion,
        visitante: visitante,
        dispositivo: dispositivo,
        created_at: new Date().toISOString()
      };
      try {
        var localLog = JSON.parse(localStorage.getItem('yossico_visitas_local') || '[]');
        localLog.unshift(rowLocal);
        if (localLog.length > 500) localLog = localLog.slice(0, 500);
        localStorage.setItem('yossico_visitas_local', JSON.stringify(localLog));
      } catch (_) {}

      var body = JSON.stringify({
        p_pagina: pagina, p_evento: evento, p_referrer: document.referrer || '',
        p_fuente: src, p_sesion: sesion, p_visitante: visitante, p_dispositivo: dispositivo
      });
      try {
        fetch(URL_, {
          method: 'POST', keepalive: true,
          headers: { 'Content-Type': 'application/json', apikey: KEY, Authorization: 'Bearer ' + KEY },
          body: body
        }).catch(function () {});
      } catch (e) {}
    }

    window.yossicoTrack = send;
    send('pageview');

    // Clics clave: WhatsApp, agregar al carrito, ir a checkout
    document.addEventListener('click', function (e) {
      var el = e.target.closest && e.target.closest('a,button');
      if (!el) return;
      var href = el.getAttribute('href') || '';
      var txt = (el.textContent || '').toLowerCase();
      if (href.indexOf('wa.me') > -1) send('click_whatsapp');
      else if (el.classList.contains('add-to-cart-btn') || /agregar al carrito/.test(txt)) send('agregar_carrito');
      else if (el.classList.contains('cart-checkout') || /checkout/.test(href)) send('ir_checkout');
    }, true);
  } catch (e) { /* nunca romper la tienda */ }
})();
