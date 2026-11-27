/* YOSSICO — Monitor de Rendimiento, Tiempo en Secciones, Zonas Calientes/Frías y Conversión (100% Propio) */
(function () {
  'use strict';
  try {
    if (navigator.doNotTrack === '1') return;
    if (/bot|crawl|spider|slurp|preview|lighthouse/i.test(navigator.userAgent)) return;
    // No rastrear el panel admin ni el editor web
    if (/Panel_Admin|Editor_Web/i.test(location.pathname)) return;

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
    if (pagina === '' || pagina === '/') pagina = '/index.html';

    function send(evento, extraMeta) {
      try {
        var rawConsent = localStorage.getItem('yossico_cookie_consent');
        if (rawConsent) {
          var parsedConsent = JSON.parse(rawConsent);
          if (parsedConsent && parsedConsent.choice === 'essential') return;
        }
      } catch (_) {}

      var refOrMeta = extraMeta ? ('META:' + JSON.stringify(extraMeta)) : (document.referrer || '');

      var rowLocal = {
        pagina: pagina,
        evento: String(evento || 'pageview').slice(0, 60),
        referrer: String(refOrMeta).slice(0, 300),
        fuente: src,
        sesion: sesion,
        visitante: visitante,
        dispositivo: dispositivo,
        created_at: new Date().toISOString()
      };

      try {
        var localLog = JSON.parse(localStorage.getItem('yossico_visitas_local') || '[]');
        localLog.unshift(rowLocal);
        if (localLog.length > 600) localLog = localLog.slice(0, 600);
        localStorage.setItem('yossico_visitas_local', JSON.stringify(localLog));
      } catch (_) {}

      // No enviar telemetría remota desde localhost si el usuario sólo prueba localmente, pero sí en producción
      if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') return;

      var body = JSON.stringify({
        p_pagina: rowLocal.pagina,
        p_evento: rowLocal.evento,
        p_referrer: rowLocal.referrer,
        p_fuente: rowLocal.fuente,
        p_sesion: rowLocal.sesion,
        p_visitante: rowLocal.visitante,
        p_dispositivo: rowLocal.dispositivo
      });

      try {
        fetch(URL_, {
          method: 'POST',
          keepalive: true,
          headers: { 'Content-Type': 'application/json', apikey: KEY, Authorization: 'Bearer ' + KEY },
          body: body
        }).catch(function () {});
      } catch (e) {}
    }

    window.yossicoTrack = send;

    /* ── 0. META PIXEL (FACEBOOK / INSTAGRAM ADS) — ID: 1146486127770032 ── */
    var META_PIXEL_ID = '1146486127770032';

    var META_CATALOG_MAP = {
      oslo:   { id: 'oslo',   name: 'Set OSLO',   line: 'Essentials', price: 275900 },
      milan:  { id: 'milan',  name: 'Set MILAN',  line: 'Signature',  price: 339900 },
      kyoto:  { id: 'kyoto',  name: 'Set KYOTO',  line: 'Signature',  price: 339900 },
      lima:   { id: 'lima',   name: 'Set LIMA',   line: 'Essentials', price: 275900 },
      bogota: { id: 'bogota', name: 'Set BOGOTÁ', line: 'Core',       price: 229900 },
      manta:  { id: 'manta',  name: 'Set MANTA',  line: 'Core',       price: 229900 }
    };

    function hasMarketingConsent() {
      try {
        var rawConsent = localStorage.getItem('yossico_cookie_consent');
        if (rawConsent) {
          var parsedConsent = JSON.parse(rawConsent);
          if (parsedConsent && parsedConsent.choice === 'essential') return false;
        }
      } catch (_) {}
      return true;
    }

    function normalizeSku(rawName, color, size) {
      var base = String(rawName || '').split('(')[0].trim().toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '');
      if (base.indexOf('set') === 0 && base.length > 3) base = base.slice(3);
      var colMatch = (String(rawName || '').match(/\(([^)]+)\)/) || [])[1] || color || '';
      var colSlug = String(colMatch).trim().toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      var szSlug = String(size || '').trim().toUpperCase();
      var sku = base || 'yossico';
      if (colSlug) sku += '-' + colSlug;
      if (szSlug) sku += '-' + szSlug;
      return sku;
    }

    function initMetaPixel() {
      if (!hasMarketingConsent()) return;
      if (window.fbq) return;
      try {
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');

        // Advanced Matching si la clienta ya dejó sus datos en la sesión
        var advMatch = {};
        try {
          var lastOrder = JSON.parse(sessionStorage.getItem('yossico_ultimo_pedido') || '{}');
          if (lastOrder.email) advMatch.em = String(lastOrder.email).trim().toLowerCase();
          if (lastOrder.tel)   advMatch.ph = '57' + String(lastOrder.tel).replace(/\D/g, '').replace(/^57/, '');
          if (lastOrder.ciudad) advMatch.ct = String(lastOrder.ciudad).trim().toLowerCase();
        } catch (_) {}

        if (Object.keys(advMatch).length > 0) {
          window.fbq('init', META_PIXEL_ID, advMatch);
        } else {
          window.fbq('init', META_PIXEL_ID);
        }
        window.fbq('track', 'PageView');
      } catch (_) {}
    }

    function metaTrack(eventName, params, options) {
      if (!hasMarketingConsent()) return;
      if (!window.fbq) initMetaPixel();
      try {
        if (typeof window.fbq === 'function') {
          if (options) window.fbq('track', eventName, params || {}, options);
          else window.fbq('track', eventName, params || {});
        }
      } catch (_) {}
    }

    window.yossicoMetaTrack = metaTrack;
    window.yossicoNormalizeSku = normalizeSku;

    initMetaPixel();

    // Auto-disparar ViewContent en páginas de producto y InitiateCheckout en checkout.html
    function autoTrackEcommercePage() {
      try {
        var pathSlug = (location.pathname.split('/').pop() || '').replace(/\.html$/i, '').toLowerCase();
        var prodKey = META_CATALOG_MAP[pathSlug] ? pathSlug : null;
        if (!prodKey && pathSlug === 'producto') {
          var qId = (new URLSearchParams(location.search).get('id') || '').toLowerCase();
          if (META_CATALOG_MAP[qId]) prodKey = qId;
        }
        if (prodKey) {
          var pInfo = META_CATALOG_MAP[prodKey];
          metaTrack('ViewContent', {
            content_ids: [pInfo.id],
            content_name: pInfo.name,
            content_category: pInfo.line,
            content_type: 'product_group',
            value: pInfo.price,
            currency: 'COP'
          });
        } else if (pathSlug === 'checkout') {
          var cartItems = [];
          try { cartItems = JSON.parse(localStorage.getItem('yossico_cart') || '[]'); } catch (_) {}
          if (cartItems && cartItems.length) {
            var totalVal = cartItems.reduce(function (s, i) { return s + (Number(i.price) || 0) * (Number(i.qty) || 1); }, 0);
            var cIds = cartItems.map(function (i) { return normalizeSku(i.name, i.color, i.size); });
            var numItems = cartItems.reduce(function (s, i) { return s + (Number(i.qty) || 1); }, 0);
            metaTrack('InitiateCheckout', {
              content_ids: cIds,
              content_type: 'product',
              num_items: numItems,
              value: totalVal,
              currency: 'COP'
            });
          }
        }
      } catch (_) {}
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', autoTrackEcommercePage);
    } else {
      autoTrackEcommercePage();
    }

    send('pageview');

    /* ── 1. MONITOR DE VELOCIDAD Y CUELLOS DE BOTELLA (Web Vitals + Recursos) ── */
    var lcpVal = 0;
    var clsVal = 0;

    if ('PerformanceObserver' in window) {
      try {
        var lcpObs = new PerformanceObserver(function (list) {
          var entries = list.getEntries();
          if (entries.length) {
            var last = entries[entries.length - 1];
            lcpVal = Math.round(last.startTime || last.renderTime || 0);
          }
        });
        lcpObs.observe({ type: 'largest-contentful-paint', buffered: true });
      } catch (_) {}

      try {
        var clsObs = new PerformanceObserver(function (list) {
          list.getEntries().forEach(function (entry) {
            if (!entry.hadRecentInput) clsVal += (entry.value || 0);
          });
        });
        clsObs.observe({ type: 'layout-shift', buffered: true });
      } catch (_) {}
    }

    window.addEventListener('load', function () {
      setTimeout(function () {
        try {
          var nav = performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
          var paints = (performance.getEntriesByType && performance.getEntriesByType('paint')) || [];
          var fcpEntry = paints.find(function (p) { return p.name === 'first-contentful-paint'; });
          var fcp = fcpEntry ? Math.round(fcpEntry.startTime) : 0;
          var ttfb = nav ? Math.round(nav.responseStart - nav.requestStart) : 0;
          var dom = nav ? Math.round(nav.domContentLoadedEventEnd) : 0;
          var loadTime = nav ? Math.round(nav.loadEventEnd || performance.now()) : Math.round(performance.now());
          if (!lcpVal) lcpVal = fcp || dom || loadTime;

          // Identificar qué recurso frena más la página (imágenes, scripts, estilos, fuentes)
          var resources = (performance.getEntriesByType && performance.getEntriesByType('resource')) || [];
          var slowestName = '';
          var slowestDur = 0;
          var totalKB = 0;
          var slowList = [];

          resources.forEach(function (r) {
            var dur = Math.round(r.duration || 0);
            var kb = Math.round((r.transferSize || r.encodedBodySize || 0) / 1024);
            totalKB += kb;
            var shortName = (r.name || '').split('/').pop().split('?')[0].slice(0, 32) || 'recurso';
            if (dur > slowestDur && !/supabase|analytics/i.test(r.name)) {
              slowestDur = dur;
              slowestName = shortName;
            }
            if ((dur > 350 || kb > 180) && !/supabase|analytics/i.test(r.name)) {
              slowList.push({ n: shortName, d: dur, k: kb, t: r.initiatorType || 'other' });
            }
          });

          slowList.sort(function (a, b) { return b.d - a.d; });

          // Guardar detalle enriquecido local de recursos para el auditor en el mismo navegador
          try {
            var perfLocal = JSON.parse(localStorage.getItem('yossico_perf_resources') || '[]');
            perfLocal.unshift({
              pagina: pagina,
              dispositivo: dispositivo,
              ttfb: ttfb,
              fcp: fcp,
              lcp: lcpVal,
              dom: dom,
              load: loadTime,
              cls: Number(clsVal.toFixed(3)),
              kb: totalKB,
              slowest: slowestName,
              slowMs: slowestDur,
              resources: slowList.slice(0, 8),
              ts: new Date().toISOString()
            });
            localStorage.setItem('yossico_perf_resources', JSON.stringify(perfLocal.slice(0, 60)));
          } catch (_) {}

          send('perf_vitals', {
            ttfb: ttfb,
            fcp: fcp,
            lcp: lcpVal,
            dom: dom,
            load: loadTime,
            cls: Number(clsVal.toFixed(3)),
            kb: totalKB,
            slow: slowestName,
            sms: slowestDur
          });
        } catch (_) {}
      }, 2200);
    });

    /* ── 2. MAPA DE ATENCIÓN: TIEMPO POR SECCIÓN, SCROLL Y ZONAS CALIENTES / FRÍAS ── */
    var secDwell = {};     // id -> ms acumulados visibles
    var secVisibleAt = {}; // id -> timestamp inicio visibilidad
    var secClicks = {};    // id -> cantidad de clics dentro de la sección
    var maxScrollPct = 0;
    var pageStart = Date.now();
    var isTabActive = true;

    function detectSectionName(el) {
      if (!el) return '';
      if (el.id === 'countdown-section' || el.classList.contains('countdown-section')) return 'barra-drop-countdown';
      if (el.classList.contains('hero')) return 'hero-principal';
      if (el.classList.contains('drops')) return 'manifiesto-drops';
      if (el.classList.contains('prive-spotlight') || el.id === 'linea-prive' || el.classList.contains('prive-hero') || el.classList.contains('prive-showcase')) return 'seccion-prive';
      if (el.classList.contains('nosotros')) return 'por-que-yossico';
      if (el.id === 'linea-uniformes') return 'catalogo-uniformes';
      if (el.id === 'linea-capas') return 'seccion-capas';
      if (el.classList.contains('campus-hero') || el.classList.contains('campus-benefits') || el.id === 'formulario-estudiantes') return 'programa-campus';
      if (el.classList.contains('contacto-cta')) return 'cta-whatsapp-cierre';
      if (el.tagName === 'FOOTER' || el.classList.contains('footer')) return 'footer-legal';
      if (el.id) return el.id.slice(0, 28);
      return (el.className || 'seccion').toString().split(' ')[0].slice(0, 28);
    }

    // Observar secciones principales de la página
    var trackedSections = [];
    function initSectionObserver() {
      var candidates = document.querySelectorAll('section, footer, .page-header, #unirme-prive, #formulario-estudiantes');
      if (!('IntersectionObserver' in window) || !candidates.length) return;

      var io = new IntersectionObserver(function (entries) {
        var now = Date.now();
        entries.forEach(function (entry) {
          var sName = entry.target.getAttribute('data-yos-sec');
          if (!sName) return;
          if (entry.isIntersecting && entry.intersectionRatio >= 0.25 && isTabActive) {
            if (!secVisibleAt[sName]) secVisibleAt[sName] = now;
          } else {
            if (secVisibleAt[sName]) {
              secDwell[sName] = (secDwell[sName] || 0) + (now - secVisibleAt[sName]);
              delete secVisibleAt[sName];
            }
          }
        });
      }, { threshold: [0, 0.25, 0.6] });

      candidates.forEach(function (el) {
        var sName = detectSectionName(el);
        if (!sName) return;
        el.setAttribute('data-yos-sec', sName);
        trackedSections.push(sName);
        if (secDwell[sName] === undefined) secDwell[sName] = 0;
        io.observe(el);
      });
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initSectionObserver);
    } else {
      initSectionObserver();
    }

    // Medir profundidad máxima de scroll
    window.addEventListener('scroll', function () {
      try {
        var docH = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight) - window.innerHeight;
        if (docH > 0) {
          var pct = Math.min(100, Math.round((window.scrollY / docH) * 100));
          if (pct > maxScrollPct) maxScrollPct = pct;
        }
      } catch (_) {}
    }, { passive: true });

    // Clics clave + Mapa de calor por sección y por uniforme
    document.addEventListener('click', function (e) {
      var secEl = e.target.closest && e.target.closest('[data-yos-sec]');
      if (secEl) {
        var sName = secEl.getAttribute('data-yos-sec');
        if (sName) secClicks[sName] = (secClicks[sName] || 0) + 1;
      }

      // Detectar interés por uniforme específico en colección
      var prodCard = e.target.closest && e.target.closest('.product-card');
      if (prodCard) {
        var gal = prodCard.querySelector('.gallery');
        var prodId = (gal && (gal.dataset.name || gal.dataset.product)) || '';
        if (prodId) {
          send('interes_prenda:' + prodId.toUpperCase().slice(0, 20));
        }
      }

      var el = e.target.closest && e.target.closest('a,button');
      if (!el) return;
      var href = el.getAttribute('href') || '';
      var txt = (el.textContent || '').toLowerCase();
      if (href.indexOf('wa.me') > -1) {
        send('click_whatsapp');
        metaTrack('Contact', { content_name: 'WhatsApp Directo', content_category: pagina });
      }
      else if (el.classList.contains('add-to-cart-btn') || /agregar al carrito/.test(txt)) send('agregar_carrito');
      else if (el.classList.contains('cart-checkout') || /checkout/.test(href)) send('ir_checkout');
      else if (/prive\.html|#linea-prive|abrirmodalprive/i.test(href + ' ' + (el.getAttribute('onclick') || ''))) send('interes_prive');
      else if (/estudiantes\.html/i.test(href)) send('interes_campus');
    }, true);

    // Volcar métricas de atención y zonas calientes/frías al salir o cambiar de pestaña
    var flushed = false;
    function flushEngagement() {
      if (flushed) return;
      var now = Date.now();
      Object.keys(secVisibleAt).forEach(function (sName) {
        secDwell[sName] = (secDwell[sName] || 0) + (now - secVisibleAt[sName]);
        delete secVisibleAt[sName];
      });

      var totalSec = Math.round((now - pageStart) / 1000);
      if (totalSec < 2) return;
      flushed = true;

      // Convertir ms a segundos enteros para compactar JSON (<300 chars)
      var dwellSecMap = {};
      Object.keys(secDwell).forEach(function (k) {
        var s = Math.round(secDwell[k] / 1000);
        if (s > 0 || secClicks[k]) dwellSecMap[k] = s;
      });

      send('ux_engagement', {
        t: Math.min(totalSec, 1800),
        sc: maxScrollPct || 15,
        d: dwellSecMap,
        c: secClicks
      });
    }

    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') {
        isTabActive = false;
        flushEngagement();
      } else {
        isTabActive = true;
        flushed = false;
      }
    });
    window.addEventListener('pagehide', flushEngagement);
  } catch (e) { /* nunca romper la tienda */ }
})();
