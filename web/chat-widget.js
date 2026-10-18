/**
 * YOSSICO Concierge & Support Chat Widget
 * Inspired by FIGS customer support aesthetics (square, minimalist, luxury).
 */
(function () {
  'use strict';

  function initChat() {
    if (document.getElementById('yos-chat-launcher')) return;

    // Auto-inject CSS if not already linked
    if (!document.querySelector('link[href*="chat-widget.css"]')) {
      var link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = '/chat-widget.css';
      document.head.appendChild(link);
    }

    var isEn = (document.documentElement.lang === 'en') || (localStorage.getItem('yos_lang') === 'en');

    var texts = {
      es: {
        launcher: '¿Hablamos?',
        header: 'YOSSICO Concierge',
        headline: '¿Tienes alguna duda?',
        sub: 'Estamos en línea para responder tus preguntas sobre tallas, telas técnicas y el próximo drop.',
        pillTalla: 'Guía de tallas y medidas',
        pillDrop: 'Próximo Drop y lanzamientos',
        pillTela: 'Tela antifluido y materiales',
        namePh: 'Tu nombre',
        contactPh: 'WhatsApp o correo',
        submit: 'Iniciar conversación',
        footer: '¿Prefieres WhatsApp directo?',
        footerLink: 'Escríbenos aquí',
        waMsg: 'Hola YOSSICO, mi nombre es {name} ({contact}). Quisiera resolver unas dudas sobre los uniformes.'
      },
      en: {
        launcher: "Questions? Let's talk",
        header: 'YOSSICO Concierge',
        headline: 'Have a question?',
        sub: "We're online to answer your questions about sizing, technical fabrics, and the upcoming drop.",
        pillTalla: 'Size & measurement guide',
        pillDrop: 'Next Drop & launches',
        pillTela: 'Fluid-resistant fabric & materials',
        namePh: 'Your name',
        contactPh: 'WhatsApp or email',
        submit: 'Start conversation',
        footer: 'Prefer direct WhatsApp?',
        footerLink: 'Message us here',
        waMsg: 'Hello YOSSICO, my name is {name} ({contact}). I would like to ask a few questions about your medical uniforms.'
      }
    };

    var t = isEn ? texts.en : texts.es;

    // SVG icons (monochrome 1.5px stroke, pure YOSSICO quiet luxury aesthetic)
    var iconRuler = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21.3 8.7 8.7 21.3a2 2 0 0 1-2.8 0L2.7 18.1a2 2 0 0 1 0-2.8L15.3 2.7a2 2 0 0 1 2.8 0l3.2 3.2a2 2 0 0 1 0 2.8Z"></path><path d="m14.5 5.5 1.5 1.5"></path><path d="m11.5 8.5 2 2"></path><path d="m8.5 11.5 1.5 1.5"></path></svg>';
    var iconClock = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>';
    var iconDrop  = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path></svg>';

    // DOM Container
    var wrap = document.createElement('div');
    wrap.id = 'yos-chat-root';
    wrap.innerHTML = `
      <div class="yos-chat-launcher" id="yos-chat-launcher" role="button" aria-haspopup="dialog" aria-expanded="false" aria-label="${t.launcher}">
        <div class="yos-chat-launcher__status-dot"></div>
        <div class="yos-chat-launcher__icon">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        </div>
        <span id="yos-chat-launcher-text">${t.launcher}</span>
      </div>

      <div class="yos-chat-window" id="yos-chat-window" role="dialog" aria-hidden="true">
        <div class="yos-chat-header">
          <div class="yos-chat-header__title">
            <span class="yos-chat-launcher__status-dot"></span>
            ${t.header}
          </div>
          <button type="button" class="yos-chat-header__close" id="yos-chat-close" aria-label="Cerrar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div class="yos-chat-body">
          <div class="yos-chat-avatar">Y</div>
          <h3 class="yos-chat-headline">${t.headline}</h3>
          <p class="yos-chat-sub">${t.sub}</p>

          <div class="yos-chat-pills">
            <button type="button" class="yos-chat-pill" id="yos-pill-talla">
              <span>${iconRuler} ${t.pillTalla}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
            <button type="button" class="yos-chat-pill" id="yos-pill-drop">
              <span>${iconClock} ${t.pillDrop}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
            <button type="button" class="yos-chat-pill" id="yos-pill-tela">
              <span>${iconDrop} ${t.pillTela}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          </div>

          <form class="yos-chat-form" id="yos-chat-form">
            <div class="yos-chat-input-wrap">
              <span class="yos-chat-input-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              </span>
              <input type="text" class="yos-chat-input" id="yos-chat-name" placeholder="${t.namePh}" required>
            </div>
            <div class="yos-chat-input-wrap">
              <span class="yos-chat-input-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
              </span>
              <input type="text" class="yos-chat-input" id="yos-chat-contact" placeholder="${t.contactPh}" required>
            </div>
            <button type="submit" class="yos-chat-submit">${t.submit}</button>
          </form>
        </div>

        <div class="yos-chat-footer">
          <span>${t.footer}</span> <a href="https://wa.me/573127300661?text=Hola%20YOSSICO,%20quiero%20informaci%C3%B3n%20sobre%20los%20uniformes" target="_blank" rel="noopener">${t.footerLink}</a>
        </div>
      </div>
    `;

    document.body.appendChild(wrap);

    var launcher = document.getElementById('yos-chat-launcher');
    var windowEl = document.getElementById('yos-chat-window');
    var closeBtn = document.getElementById('yos-chat-close');
    var formEl = document.getElementById('yos-chat-form');

    function toggleChat(open) {
      var shouldOpen = typeof open === 'boolean' ? open : !windowEl.classList.contains('active');
      if (shouldOpen) {
        windowEl.classList.add('active');
        windowEl.setAttribute('aria-hidden', 'false');
        launcher.setAttribute('aria-expanded', 'true');
        if (window.yossicoTrack) window.yossicoTrack('abrir_chat');
      } else {
        windowEl.classList.remove('active');
        windowEl.setAttribute('aria-hidden', 'true');
        launcher.setAttribute('aria-expanded', 'false');
      }
    }

    launcher.addEventListener('click', function () { toggleChat(); });
    closeBtn.addEventListener('click', function () { toggleChat(false); });

    // Quick pills actions
    var pillTalla = document.getElementById('yos-pill-talla');
    if (pillTalla) {
      pillTalla.addEventListener('click', function () {
        window.location.href = '/guia-de-tallas.html';
      });
    }

    var pillDrop = document.getElementById('yos-pill-drop');
    if (pillDrop) {
      pillDrop.addEventListener('click', function () {
        toggleChat(false);
        var subTrigger = document.querySelector('[data-open-sub]');
        if (subTrigger) subTrigger.click();
        else window.location.href = '/#countdown-section';
      });
    }

    var pillTela = document.getElementById('yos-pill-tela');
    if (pillTela) {
      pillTela.addEventListener('click', function () {
        window.location.href = '/tecnologia-de-la-tela.html';
      });
    }

    // Submit form -> Open WhatsApp directly with personalized greeting
    formEl.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = (document.getElementById('yos-chat-name').value || '').trim();
      var contact = (document.getElementById('yos-chat-contact').value || '').trim();

      if (window.yossicoTrack) window.yossicoTrack('iniciar_chat_lead');

      var msg = t.waMsg.replace('{name}', name).replace('{contact}', contact);
      var waUrl = 'https://wa.me/573127300661?text=' + encodeURIComponent(msg);

      window.open(waUrl, '_blank');
      toggleChat(false);
      formEl.reset();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChat);
  } else {
    initChat();
  }
})();
