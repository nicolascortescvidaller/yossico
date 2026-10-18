/**
 * YOSSICO Concierge & Support Chat Widget
 * Automated in-widget assistant inspired by FIGS (square, minimalist, luxury).
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
        inputPh: 'Escribe tu consulta aquí...',
        greeting: '¡Hola {name}! Soy la asistente virtual de YOSSICO. ¿En qué te puedo asesorar hoy?',
        askHuman: 'Hablar con un asesor humano por WhatsApp',
        humanIntro: 'Con gusto te comunico con nuestra asesora en WhatsApp para atenderte de forma personalizada:'
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
        inputPh: 'Type your question here...',
        greeting: 'Hello {name}! I am YOSSICO’s virtual concierge. How can I assist you today?',
        askHuman: 'Talk with a human specialist via WhatsApp',
        humanIntro: 'I’d be happy to connect you with our specialist on WhatsApp for personal assistance:'
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

        <!-- Screen 1: Lead capture & Quick options -->
        <div class="yos-chat-body" id="yos-screen-intro">
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

        <div class="yos-chat-footer" id="yos-foot-intro">
          <span>${t.footer}</span> <a href="https://wa.me/573127300661?text=Hola%20YOSSICO,%20quiero%20informaci%C3%B3n%20sobre%20los%20uniformes" target="_blank" rel="noopener">${t.footerLink}</a>
        </div>

        <!-- Screen 2: Interactive Real-time Conversation -->
        <div class="yos-chat-conversation" id="yos-screen-conv">
          <div class="yos-chat-messages" id="yos-chat-msgs"></div>
          <form class="yos-chat-input-bar" id="yos-msg-form">
            <input type="text" id="yos-msg-input" placeholder="${t.inputPh}" autocomplete="off">
            <button type="submit" class="yos-chat-send-btn" aria-label="Enviar">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </form>
        </div>
      </div>
    `;

    document.body.appendChild(wrap);

    var launcher = document.getElementById('yos-chat-launcher');
    var windowEl = document.getElementById('yos-chat-window');
    var closeBtn = document.getElementById('yos-chat-close');
    var formEl = document.getElementById('yos-chat-form');
    var screenIntro = document.getElementById('yos-screen-intro');
    var footIntro = document.getElementById('yos-foot-intro');
    var screenConv = document.getElementById('yos-screen-conv');
    var msgsContainer = document.getElementById('yos-chat-msgs');
    var msgForm = document.getElementById('yos-msg-form');
    var msgInput = document.getElementById('yos-msg-input');

    var currentLead = { name: '', contact: '' };

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

    // Quick pills in Screen 1
    document.getElementById('yos-pill-talla').addEventListener('click', function () {
      startChatSession('Visitante', '', 'talla');
    });

    document.getElementById('yos-pill-drop').addEventListener('click', function () {
      toggleChat(false);
      var subTrigger = document.querySelector('[data-open-sub]');
      if (subTrigger) subTrigger.click();
      else window.location.href = '/#countdown-section';
    });

    document.getElementById('yos-pill-tela').addEventListener('click', function () {
      startChatSession('Visitante', '', 'tela');
    });

    // Form submit -> Transition to in-widget real-time bot!
    formEl.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = (document.getElementById('yos-chat-name').value || '').trim();
      var contact = (document.getElementById('yos-chat-contact').value || '').trim();
      startChatSession(name, contact);
    });

    function appendMessage(sender, textHtml, actions) {
      var el = document.createElement('div');
      el.className = 'yos-chat-msg yos-chat-msg--' + sender;
      el.innerHTML = textHtml;

      if (actions && actions.length > 0) {
        var actWrap = document.createElement('div');
        actWrap.className = 'yos-chat-msg-actions';
        actions.forEach(function (act) {
          var btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'yos-chat-msg-btn';
          btn.innerHTML = `<span>${act.label}</span> <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>`;
          btn.addEventListener('click', act.onClick);
          actWrap.appendChild(btn);
        });
        el.appendChild(actWrap);
      }

      msgsContainer.appendChild(el);
      msgsContainer.scrollTop = msgsContainer.scrollHeight;
    }

    function startChatSession(name, contact, initialTopic) {
      currentLead.name = name;
      currentLead.contact = contact;

      if (window.yossicoTrack) window.yossicoTrack('chat_iniciado');

      screenIntro.style.display = 'none';
      footIntro.style.display = 'none';
      screenConv.classList.add('active');

      var displayName = name && name !== 'Visitante' ? name.split(' ')[0] : (isEn ? 'there' : 'hermosa');
      var welcome = t.greeting.replace('{name}', displayName);

      var defaultActions = [
        {
          label: isEn ? '📏 Size & Fit Advisor' : '📏 Asesoría de Tallas y Medidas',
          onClick: function () { handleBotQuery('talla'); }
        },
        {
          label: isEn ? '💧 Technical Fabric Details' : '💧 Tecnología de la Tela Antifluido',
          onClick: function () { handleBotQuery('tela'); }
        },
        {
          label: isEn ? '📦 Shipping & Delivery times' : '📦 Envíos y Tiempos de Entrega',
          onClick: function () { handleBotQuery('envio'); }
        },
        {
          label: isEn ? '💬 Talk to a Human Specialist' : '💬 Hablar con una asesora por WhatsApp',
          onClick: function () { openHumanWhatsApp(); }
        }
      ];

      appendMessage('bot', welcome, defaultActions);

      if (initialTopic) {
        setTimeout(function () {
          handleBotQuery(initialTopic);
        }, 300);
      }
    }

    function openHumanWhatsApp(customMsg) {
      var name = currentLead.name || 'Cliente';
      var contact = currentLead.contact ? ` (${currentLead.contact})` : '';
      var query = customMsg ? `%0A%0AConsulta:%20${encodeURIComponent(customMsg)}` : '';
      var text = isEn 
        ? `Hello YOSSICO, my name is ${encodeURIComponent(name)}${encodeURIComponent(contact)}. I would like personalized assistance regarding your medical uniforms.${query}`
        : `Hola YOSSICO, mi nombre es ${encodeURIComponent(name)}${encodeURIComponent(contact)}. Quisiera recibir asesoría personalizada sobre los uniformes.${query}`;
      window.open(`https://wa.me/573127300661?text=${text}`, '_blank');
    }

    function handleBotQuery(query) {
      var q = query.toLowerCase().trim();

      // Bot knowledge base logic
      if (/talla|medida|fit|ancho|largo|pequeñ|grande|size/.test(q)) {
        var ansTalla = isEn 
          ? `<strong>YOSSICO Size Guide:</strong><br>
             • <strong>S:</strong> Bust 105cm · Waist 66-71cm · Hips 100cm<br>
             • <strong>M:</strong> Bust 111cm · Waist 71-76cm · Hips 102cm<br>
             • <strong>L:</strong> Bust 117cm · Waist 76-81cm · Hips 104cm<br><br>
             Our tops have an elegant tailored feminine fit and pants include an elastic waistband with drawstring. If you are between two sizes, we suggest choosing the larger size for maximum comfort on shift.`
          : `<strong>Guía rápida de tallas YOSSICO:</strong><br>
             • <strong>Talla S:</strong> Busto 105 cm · Cintura 66-71 cm · Cadera 100 cm<br>
             • <strong>Talla M:</strong> Busto 111 cm · Cintura 71-76 cm · Cadera 102 cm<br>
             • <strong>Talla L:</strong> Busto 117 cm · Cintura 76-81 cm · Cadera 104 cm<br><br>
             Nuestros tops tienen corte femenino estilizado y los pantalones cuentan con pretina elástica y cordón ajustable. Si estás entre dos tallas, te sugerimos elegir la talla superior para mayor libertad de movimiento durante tu turno.`;
        
        appendMessage('bot', ansTalla, [
          { label: isEn ? 'View Full Sizing Chart →' : 'Ver tabla completa con ilustración →', onClick: function () { window.location.href = '/guia-de-tallas.html'; } },
          { label: isEn ? 'Need help deciding with an advisor?' : '¿Quieres que una asesora confirme tu talla?', onClick: function () { openHumanWhatsApp('Ayuda con mi talla'); } }
        ]);
      }
      else if (/tela|antifluido|material|composicion|lavar|lavado|calor|stretch|arruga|fabric/.test(q)) {
        var ansTela = isEn
          ? `<strong>Technical High-Performance Fabric:</strong><br>
             • <strong>Composition:</strong> 92% polyester + 8% spandex (170g/m²).<br>
             • <strong>Fluid-resistant:</strong> Certified repels liquids and splashes.<br>
             • <strong>4-way stretch:</strong> Total freedom of movement without losing shape.<br>
             • <strong>Care:</strong> Machine wash cold (delicate cycle), no bleach, shade dry. No ironing required.`
          : `<strong>Tecnología textil de alto desempeño:</strong><br>
             • <strong>Composición:</strong> 92% poliéster + 8% spandex (170 g/m²).<br>
             • <strong>Antifluido:</strong> Repele fluidos y salpicaduras protegiendo tu piel.<br>
             • <strong>Elongación 4 direcciones:</strong> Libertad de movimiento total sin perder la caída.<br>
             • <strong>Cuidado:</strong> Lavar en frío (ciclo suave), sin blanqueador, secado a la sombra. No requiere planchado constante.`;

        appendMessage('bot', ansTela, [
          { label: isEn ? 'Read full fabric specs →' : 'Ver especificaciones técnicas →', onClick: function () { window.location.href = '/tecnologia-de-la-tela.html'; } },
          { label: isEn ? 'Ask an advisor' : 'Hacer una pregunta sobre la tela', onClick: function () { openHumanWhatsApp('Consulta sobre la tela antifluido'); } }
        ]);
      }
      else if (/envio|entrega|tiempo|cuanto tarda|ciudad|costo|shipping/.test(q)) {
        var ansEnvio = isEn
          ? `<strong>Shipping & Logistics:</strong><br>
             • <strong>Nationwide:</strong> We ship to all cities across Colombia via Servientrega & Coordinadora.<br>
             • <strong>Free Shipping:</strong> On orders over $450,000 COP.<br>
             • <strong>Delivery Time:</strong> 4 to 10 business days depending on destination.`
          : `<strong>Envíos y logística nacional:</strong><br>
             • <strong>Cobertura:</strong> Enviamos a toda Colombia por Servientrega y Coordinadora.<br>
             • <strong>Envío Gratis:</strong> En compras superiores a $450.000 COP.<br>
             • <strong>Tiempos:</strong> De 4 a 10 días hábiles según la ciudad de entrega.`;

        appendMessage('bot', ansEnvio, [
          { label: isEn ? 'Track an existing order →' : 'Rastrear un pedido existente →', onClick: function () { window.location.href = '/rastreo.html'; } },
          { label: isEn ? 'Speak with shipping support' : 'Consultar envío por WhatsApp', onClick: function () { openHumanWhatsApp('Consulta sobre envíos'); } }
        ]);
      }
      else if (/drop|lanzamiento|apertura|cuando|proximo|reserva/.test(q)) {
        var ansDrop = isEn
          ? `<strong>YOSSICO Drops Model:</strong><br>
             We operate by limited drops. <strong>DROP 01 — Apertura</strong> is launching soon with limited units that will not be restocked.<br><br>
             You can subscribe to be notified the exact hour it opens and receive 10% off your first purchase.`
          : `<strong>Lanzamientos por Drops:</strong><br>
             YOSSICO lanza en ventanas exclusivas del año. <strong>DROP 01 — Apertura</strong> estará disponible en cantidades limitadas que no se repiten.<br><br>
             Puedes activar la alerta para enterarte antes que nadie y asegurar un 10% de descuento de bienvenida.`;

        appendMessage('bot', ansDrop, [
          { label: isEn ? 'Subscribe to Drop (10% Off) →' : 'Suscribirme al Drop (10% OFF) →', onClick: function () {
              toggleChat(false);
              var btn = document.querySelector('[data-open-sub]');
              if (btn) btn.click();
            }
          }
        ]);
      }
      else if (/precio|costo|cuanto vale|conjunto|oslo|milan|kyoto|lima|bogota|manta|coleccion/.test(q)) {
        var ansColeccion = isEn
          ? `<strong>Collection 2026:</strong><br>
             • <strong>Set OSLO:</strong> $275,900 COP (Essentials line)<br>
             • <strong>Set MILAN:</strong> $339,900 COP (Signature line)<br>
             • <strong>Set KYOTO:</strong> $339,900 COP (Palazzo cut)<br>
             • <strong>Set LIMA:</strong> $275,900 COP (Relaxed fit)<br>
             • <strong>Set BOGOTÁ:</strong> $229,900 COP (Core line)`
          : `<strong>Precios de la Colección 2026:</strong><br>
             • <strong>Set OSLO:</strong> $275.900 COP (Línea Essentials)<br>
             • <strong>Set MILAN:</strong> $339.900 COP (Línea Signature)<br>
             • <strong>Set KYOTO:</strong> $339.900 COP (Corte palazzo cruzado)<br>
             • <strong>Set LIMA:</strong> $275.900 COP (Corte fluido)<br>
             • <strong>Set BOGOTÁ:</strong> $229.900 COP (Línea Core)`;

        appendMessage('bot', ansColeccion, [
          { label: isEn ? 'Explore Collection →' : 'Ver Colección Completa →', onClick: function () { window.location.href = '/coleccion.html'; } }
        ]);
      }
      else if (/humano|asesor|persona|hablar|whatsapp|contacto/.test(q)) {
        appendMessage('bot', t.humanIntro, [
          { label: isEn ? 'Open WhatsApp Chat Now →' : 'Abrir chat en WhatsApp ahora →', onClick: function () { openHumanWhatsApp(query); } }
        ]);
      }
      else {
        // Fallback response with helpful options
        var ansGen = isEn
          ? `Thank you for your message! To give you the exact details, would you like me to connect you directly with one of our specialized advisors?`
          : `¡Gracias por tu consulta! Para brindarte la información más exacta y personalizada, ¿deseas que te comunique directamente con una asesora de nuestro equipo?`;

        appendMessage('bot', ansGen, [
          { label: isEn ? '💬 Chat with Advisor via WhatsApp' : '💬 Chatear con asesora por WhatsApp', onClick: function () { openHumanWhatsApp(query); } },
          { label: isEn ? '📏 Check Size Guide' : '📏 Consultar Guía de Tallas', onClick: function () { handleBotQuery('talla'); } },
          { label: isEn ? '💧 Check Fabrics' : '💧 Conocer Telas Técnicas', onClick: function () { handleBotQuery('tela'); } }
        ]);
      }
    }

    // Message Input Submit in Screen 2
    msgForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var txt = (msgInput.value || '').trim();
      if (!txt) return;

      appendMessage('user', txt);
      msgInput.value = '';

      setTimeout(function () {
        handleBotQuery(txt);
      }, 400);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChat);
  } else {
    initChat();
  }
})();
