/**
 * YOSSICO Concierge & Support Chat Widget
 * Minimalist luxury assistant (square, quiet luxury aesthetic).
 * Automated intelligent concierge: "Valentina, asesora virtual de YOSSICO".
 */
(function () {
  'use strict';

  var SUPABASE_URL = 'https://mgzevtcipwfpqgolmpwm.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_1bxubqO9tCMdrCTuWj9CKA_irvrSa19';

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
        tag: 'Atención personalizada',
        headline: 'Hablemos.',
        sub: 'Ingresa tu nombre y WhatsApp o correo para iniciar la asesoría.',
        nameLabel: 'Nombre completo',
        namePh: 'Tu nombre',
        contactLabel: 'WhatsApp o Correo',
        contactPh: 'Número o tu@correo.com',
        submit: 'Comenzar →',
        footer: '¿Prefieres WhatsApp directo?',
        footerLink: 'Escríbenos aquí',
        inputPh: 'Escribe tu consulta aquí...',
        greeting: '¡Hola {name}! Soy <strong>Valentina</strong>, tu asesora virtual en YOSSICO.<br><br>Estoy aquí para acompañarte a elegir tu uniforme médico perfecto, orientarte en tallas, telas técnicas antifluido o guiarte en tu pedido. ¿Sobre qué te gustaría conocer hoy?',
        humanIntro: 'Con mucho gusto, {name}. Te comunico directamente con nuestro equipo de asesoras en WhatsApp para brindarte atención personalizada:'
      },
      en: {
        launcher: "Questions? Let's talk",
        header: 'YOSSICO Concierge',
        tag: 'Personalized concierge',
        headline: "Let's talk.",
        sub: 'Enter your name and WhatsApp or email to begin personal assistance.',
        nameLabel: 'Full name',
        namePh: 'Your name',
        contactLabel: 'WhatsApp or Email',
        contactPh: 'Phone or you@email.com',
        submit: 'Start →',
        footer: 'Prefer direct WhatsApp?',
        footerLink: 'Message us here',
        inputPh: 'Type your message here...',
        greeting: 'Hello {name}! I am <strong>Valentina</strong>, your virtual concierge at YOSSICO.<br><br>I am here to help you select your ideal medical uniform, verify sizing, explore technical fluid-resistant fabrics, or assist with your order. How can I help you today?',
        humanIntro: 'With pleasure, {name}. Connecting you directly with our specialized human concierge team on WhatsApp for tailored support:'
      }
    };

    var t = isEn ? texts.en : texts.es;

    // DOM Container
    var wrap = document.createElement('div');
    wrap.id = 'yos-chat-root';
    wrap.innerHTML = `
      <div class="yos-chat-launcher" id="yos-chat-launcher" role="button" aria-haspopup="dialog" aria-expanded="false" aria-label="${t.launcher}">
        <span class="yos-chat-launcher__label" id="yos-chat-launcher-text">${t.launcher}</span>
        <div class="yos-chat-launcher__circle">
          <div class="yos-chat-launcher__status-dot"></div>
          <div class="yos-chat-launcher__icon">
            <svg class="yos-chat-icon--msg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <svg class="yos-chat-icon--close" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </div>
        </div>
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

        <!-- Screen 1: Minimalist Entry Form (0 Noise) -->
        <div class="yos-chat-body" id="yos-screen-intro">
          <div class="yos-chat-intro-wrap">
            <span class="yos-chat-tag">${t.tag}</span>
            <h3 class="yos-chat-headline">${t.headline}</h3>
            <p class="yos-chat-sub">${t.sub}</p>

            <form class="yos-chat-form" id="yos-chat-form">
              <div class="yos-chat-field">
                <label class="yos-chat-label" for="yos-chat-name">${t.nameLabel}</label>
                <div class="yos-chat-input-wrap">
                  <span class="yos-chat-input-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                  </span>
                  <input type="text" class="yos-chat-input" id="yos-chat-name" placeholder="${t.namePh}" required autocomplete="name">
                </div>
              </div>
              <div class="yos-chat-field">
                <label class="yos-chat-label" for="yos-chat-contact">${t.contactLabel}</label>
                <div class="yos-chat-input-wrap">
                  <span class="yos-chat-input-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                  </span>
                  <input type="text" class="yos-chat-input" id="yos-chat-contact" placeholder="${t.contactPh}" required autocomplete="email tel">
                </div>
              </div>
              <label style="display:flex;align-items:flex-start;gap:8px;font-size:10px;color:#666;line-height:1.4;margin:6px 0 12px;cursor:pointer;text-align:left;">
                <input type="checkbox" id="yos-chat-check-privacidad" style="margin-top:2px;accent-color:#000;cursor:pointer;" required>
                <span>Autorizo el tratamiento de mis datos personales para atención y asesoría comercial (<a href="privacidad.html" target="_blank" style="color:#000;text-decoration:underline;">Política de Privacidad</a> · Ley 1581).</span>
              </label>
              <button type="submit" class="yos-chat-submit">${t.submit}</button>
            </form>
          </div>
        </div>

        <div class="yos-chat-footer" id="yos-foot-intro">
          <span>${t.footer}</span> <a href="https://wa.me/573127300661?text=Hola%20YOSSICO,%20quiero%20informaci%C3%B3n%20sobre%20los%20uniformes" target="_blank" rel="noopener">${t.footerLink}</a>
        </div>

        <!-- Screen 2: Real-time Conversational Concierge -->
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

    // Check if session lead already exists
    try {
      var savedLead = sessionStorage.getItem('yos_chat_lead');
      if (savedLead) {
        var parsed = JSON.parse(savedLead);
        if (parsed.name && parsed.contact) {
          currentLead = parsed;
        }
      }
    } catch (e) {}

    function toggleChat(open) {
      var shouldOpen = typeof open === 'boolean' ? open : !windowEl.classList.contains('active');
      if (shouldOpen) {
        windowEl.classList.add('active');
        windowEl.setAttribute('aria-hidden', 'false');
        launcher.setAttribute('aria-expanded', 'true');
        if (window.yossicoTrack) window.yossicoTrack('abrir_chat');

        // If lead already registered in this session, resume conversation
        if (currentLead.name && !screenConv.classList.contains('active')) {
          resumeChatSession(currentLead.name, currentLead.contact);
        }
      } else {
        windowEl.classList.remove('active');
        windowEl.setAttribute('aria-hidden', 'true');
        launcher.setAttribute('aria-expanded', 'false');
      }
    }

    launcher.addEventListener('click', function () { toggleChat(); });
    closeBtn.addEventListener('click', function () { toggleChat(false); });

    // Save lead to database with safe fallback for any schema
    function persistLead(nombre, contacto) {
      try {
        var metaOrigen = (window.location.pathname || '/') + ' [Habeas Data Ley 1581 Aceptado]';
        var payload5 = {
          p_nombre: nombre,
          p_contacto: contacto,
          p_origen: metaOrigen,
          p_acepto_datos: true,
          p_consentimiento_meta: {
            timestamp_utc: new Date().toISOString(),
            version_privacidad: '2.0-2026',
            user_agent: navigator.userAgent,
            canal: 'chat_widget_concierge'
          }
        };

        // Respaldo local en el navegador
        try {
          var localLeads = JSON.parse(localStorage.getItem('yossico_legal_chat_leads') || '[]');
          localLeads.unshift({
            nombre: nombre,
            contacto: contacto,
            origen: metaOrigen,
            timestamp: new Date().toISOString(),
            canal: 'chat_concierge',
            acepto_datos: true
          });
          localStorage.setItem('yossico_legal_chat_leads', JSON.stringify(localLeads.slice(0, 100)));
        } catch (_) {}

        fetch(SUPABASE_URL + '/rest/v1/rpc/guardar_chat_lead', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_KEY,
            'Authorization': 'Bearer ' + SUPABASE_KEY
          },
          body: JSON.stringify(payload5)
        }).then(function (r) {
          if (!r.ok) {
            // Si la versión de 5 argumentos no está disponible, enviar versión estándar de 3 argumentos
            return fetch(SUPABASE_URL + '/rest/v1/rpc/guardar_chat_lead', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_KEY,
                'Authorization': 'Bearer ' + SUPABASE_KEY
              },
              body: JSON.stringify({
                p_nombre: nombre,
                p_contacto: contacto,
                p_origen: metaOrigen
              })
            }).then(function (r2) { return r2.json(); });
          }
          return r.json();
        }).then(function (res) {
          if (res && res.ok) {
            console.log('[YOSSICO Concierge] Lead registrado ✓ ID:', res.id);
          }
        }).catch(function (err) {
          console.warn('[YOSSICO Concierge] Fallo de guardado lead:', err);
        });
      } catch (err) {
        console.warn('[YOSSICO Concierge] Fallo de conexión lead:', err);
      }
    }

    // Form submit -> Transition to in-widget concierge bot
    formEl.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = (document.getElementById('yos-chat-name').value || '').trim();
      var contact = (document.getElementById('yos-chat-contact').value || '').trim();
      var checkPriv = document.getElementById('yos-chat-check-privacidad');

      if (!name || !contact) return;

      if (!checkPriv || !checkPriv.checked) {
        alert('Por favor autoriza el tratamiento de datos personales para iniciar la conversación.');
        if (checkPriv) checkPriv.focus();
        return;
      }

      currentLead.name = name;
      currentLead.contact = contact;

      try {
        sessionStorage.setItem('yos_chat_lead', JSON.stringify(currentLead));
      } catch (err) {}

      // Persist to Supabase database
      persistLead(name, contact);

      resumeChatSession(name, contact);
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

    function resumeChatSession(name, contact) {
      if (window.yossicoTrack) window.yossicoTrack('chat_iniciado');

      screenIntro.style.display = 'none';
      footIntro.style.display = 'none';
      screenConv.classList.add('active');

      if (msgsContainer.children.length === 0) {
        var firstName = name ? name.split(' ')[0] : (isEn ? 'there' : 'hermosa');
        var welcome = t.greeting.replace('{name}', firstName);

        var primaryActions = [
          {
            label: isEn ? '• Sizing & Measurement Guide' : '• Asesoría de Tallas y Medidas',
            onClick: function () { handleBotQuery('talla'); }
          },
          {
            label: isEn ? '• Fluid-Resistant Fabric Technology' : '• Tecnología de Tela Antifluido',
            onClick: function () { handleBotQuery('tela'); }
          },
          {
            label: isEn ? '• Collection Models & Pricing' : '• Modelos y Precios de la Colección',
            onClick: function () { handleBotQuery('modelos'); }
          },
          {
            label: isEn ? '• Shipping & Delivery Times' : '• Envíos y Tiempos de Entrega',
            onClick: function () { handleBotQuery('envios'); }
          },
          {
            label: isEn ? '• Talk with a Specialist on WhatsApp' : '• Hablar con asesora por WhatsApp',
            onClick: function () { openHumanWhatsApp(); }
          }
        ];

        appendMessage('bot', welcome, primaryActions);
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
      var firstName = currentLead.name ? currentLead.name.split(' ')[0] : (isEn ? 'there' : '');

      // 1. Saludos naturales
      if (/^(hola|buen(as|os)|que tal|como estas|saludos|hey|alo|buenas tardes|buenos dias|buenas noches)/i.test(q)) {
        var ansSaludo = isEn
          ? `Hello ${firstName ? firstName + ' ' : ''}! A pleasure chatting with you. I know every detail of our clinical designs and technical fabric. Would you like to check your size recommendation, review the collection, or consult shipping times?`
          : `¡Hola ${firstName ? firstName + ' ' : ''}! Qué gusto saludarte. Conozco cada diseño, detalle técnico y tallaje de nuestras prendas médicas. ¿Deseas saber cuál es tu talla recomendada, explorar los modelos o resolver alguna duda de tu pedido?`;

        appendMessage('bot', ansSaludo, [
          { label: isEn ? '• Sizing Guide' : '• Consultar Tallas', onClick: function () { handleBotQuery('talla'); } },
          { label: isEn ? '• View Collection' : '• Ver Modelos y Precios', onClick: function () { handleBotQuery('modelos'); } },
          { label: isEn ? '• Fabric Tech' : '• Conocer la Tela Antifluido', onClick: function () { handleBotQuery('tela'); } }
        ]);
      }
      // 2. Identidad del bot ("quien eres")
      else if (/(quien eres|con quien hablo|como te llamas|eres (un )?bot|eres humana|eres persona|quien me habla)/i.test(q)) {
        var ansQuien = isEn
          ? `I am <strong>Valentina</strong>, YOSSICO’s virtual concierge. I am trained in our technical garments, tailored silhouettes, and high-performance fluid-repellent fabrics. I can help guide your choice instantly, or connect you with our human team on WhatsApp if you prefer direct personal attention.`
          : `Soy <strong>Valentina</strong>, la asesora virtual de YOSSICO. Estoy especializada en cada una de nuestras prendas médicas, cortes de sastrería y telas técnicas antifluido. Mi labor es guiarte para encontrar tu conjunto ideal. Y si en cualquier momento deseas hablar con nuestro equipo humano en WhatsApp, te comunico con un solo clic.`;

        appendMessage('bot', ansQuien, [
          { label: isEn ? '• Chat with Advisor on WhatsApp' : '• Hablar con asesora humana por WhatsApp', onClick: function () { openHumanWhatsApp(); } },
          { label: isEn ? '• Explore Sizing' : '• Consultar Tallas', onClick: function () { handleBotQuery('talla'); } }
        ]);
      }
      // 3. Modelos específicos: Oslo, Milan, Kyoto, Lima, Bogotá, Capas
      else if (/\b(oslo|milan|kyoto|lima|bogota|bogotá|hoodie|capa)\b/i.test(q)) {
        var ansModel = '';
        if (/oslo/i.test(q)) {
          ansModel = isEn
            ? `<strong>Set OSLO ($275,900 COP) — Essentials Line:</strong><br>
               • <strong>Top:</strong> Contemporary cross V-neck, tailored feminine silhouette.<br>
               • <strong>Pant:</strong> Jogger fit with soft elastic ankle cuffs and 6 tactical pockets for medical instruments.<br>
               • <strong>Colors:</strong> Deep Black, Navy Blue, Surgical Green.`
            : `<strong>Set OSLO ($275.900 COP) — Línea Essentials:</strong><br>
               • <strong>Top:</strong> Cuello en V cruzado contemporáneo de calce favorecedor.<br>
               • <strong>Pantalón:</strong> Silueta jogger con bota elástica suave y 6 bolsillos utilitarios para instrumental médico.<br>
               • <strong>Colores:</strong> Negro Ónix, Azul Marino, Verde Quirúrgico.<br>
               • Confeccionado en tela técnica antifluido 4-way stretch.`;
        } else if (/milan/i.test(q)) {
          ansModel = isEn
            ? `<strong>Set MILAN ($339,900 COP) — Signature Line:</strong><br>
               • <strong>Top:</strong> Mandarin collar with hidden front zipper and tailored seams.<br>
               • <strong>Pant:</strong> Tailored slim-straight fit with invisible waistband and flush side pockets.<br>
               • YOSSICO's flagship statement piece for an editorial, elevated clinical aesthetic.`
            : `<strong>Set MILAN ($339.900 COP) — Línea Signature:</strong><br>
               • <strong>Top:</strong> Cuello mao con cremallera frontal oculta y cortes sastre de alta gama.<br>
               • <strong>Pantalón:</strong> Corte semirecto estilizado con pretina invisible y bolsillos laterales de fácil acceso.<br>
               • Nuestro diseño insignia para profesionales que buscan un estilo editorial impecable en consulta y clínica.`;
        } else if (/kyoto/i.test(q)) {
          ansModel = isEn
            ? `<strong>Set KYOTO ($339,900 COP) — Oriental Fluid Line:</strong><br>
               • <strong>Top:</strong> Kimono-inspired wrap silhouette with secure interior tie.<br>
               • <strong>Pant:</strong> Fluid palazzo straight-leg cut for unmatched poise and comfort on long shifts.`
            : `<strong>Set KYOTO ($339.900 COP) — Silueta Envolvente:</strong><br>
               • <strong>Top:</strong> Silueta cruzada inspirada en la sastrería kimono oriental con amarre interior seguro.<br>
               • <strong>Pantalón:</strong> Bota recta estilo palazzo fluido que aporta porte elegante y máxima frescura en jornadas extensas.`;
        } else if (/lima/i.test(q)) {
          ansModel = isEn
            ? `<strong>Set LIMA ($275,900 COP) — Relaxed Comfort:</strong><br>
               • <strong>Top:</strong> Wide scoop neck with reinforced side slits for easy movement.<br>
               • <strong>Pant:</strong> Classic anatomic jogger with soft waistband that won't dig in.`
            : `<strong>Set LIMA ($275.900 COP) — Silueta Relajada:</strong><br>
               • <strong>Top:</strong> Cuello redondo amplio con aberturas laterales reforzadas.<br>
               • <strong>Pantalón:</strong> Jogger clásico con pretina anatómica suave que no marca la cintura.`;
        } else if (/bogota|bogotá/i.test(q)) {
          ansModel = isEn
            ? `<strong>Set BOGOTÁ ($229,900 COP) — Core Line:</strong><br>
               • <strong>Top:</strong> Clean deep V-neck with two spacious lower pockets.<br>
               • <strong>Pant:</strong> Straight classic cut built for high durability on 12h-24h shifts.`
            : `<strong>Set BOGOTÁ ($229.900 COP) — Línea Core:</strong><br>
               • <strong>Top:</strong> Cuello en V esencial con dos bolsillos frontales amplios.<br>
               • <strong>Pantalón:</strong> Corte recto clásico de alta durabilidad para turnos intensivos de 12 a 24 horas.`;
        } else {
          ansModel = isEn
            ? `<strong>Capas Line — Medical Hoodie:</strong><br>
               Heavyweight technical fleece with ergonomic hood and kangaroo pocket, tailored to layer seamlessly over your scrub during cold shifts.`
            : `<strong>Línea Capas — Hoodie Médico:</strong><br>
               Sudadera de alto gramaje con capucha ergonómica y bolsillo canguro reforzado, diseñada para llevar sobre tu set en áreas de cirugía o turnos de noche.`;
        }

        appendMessage('bot', ansModel, [
          { label: isEn ? '• View Set in Collection' : '• Ver este Set en la Colección →', onClick: function () { window.location.href = '/coleccion.html'; } },
          { label: isEn ? '• Ask Advisor about Availability' : '• Consultar disponibilidad por WhatsApp', onClick: function () { openHumanWhatsApp(query); } }
        ]);
      }
      // 4. Catálogo general de modelos y precios
      else if (/(modelo|coleccion|colección|conjunto|catalogo|catálogo|prendas|productos)/i.test(q)) {
        var ansColeccion = isEn
          ? `<strong>YOSSICO Medical Collection 2026:</strong><br>
             • <strong>Set OSLO:</strong> $275,900 COP (Essentials jogger)<br>
             • <strong>Set MILAN:</strong> $339,900 COP (Signature mandarin collar)<br>
             • <strong>Set KYOTO:</strong> $339,900 COP (Wrap top & palazzo pant)<br>
             • <strong>Set LIMA:</strong> $275,900 COP (Relaxed scoop neck)<br>
             • <strong>Set BOGOTÁ:</strong> $229,900 COP (Core classic straight)`
          : `<strong>Colección de Sets Médicos YOSSICO:</strong><br>
             • <strong>Set OSLO:</strong> $275.900 COP (Línea Essentials · Pantalón jogger con 6 bolsillos)<br>
             • <strong>Set MILAN:</strong> $339.900 COP (Línea Signature · Cuello mao con cremallera oculta)<br>
             • <strong>Set KYOTO:</strong> $339.900 COP (Silueta envolvente y bota palazzo fluida)<br>
             • <strong>Set LIMA:</strong> $275.900 COP (Cuello redondo amplio y corte relajado)<br>
             • <strong>Set BOGOTÁ:</strong> $229.900 COP (Línea Core · Confort clásico de alta resistencia)`;

        appendMessage('bot', ansColeccion, [
          { label: isEn ? '• Explore Full Collection →' : '• Explorar la Colección Completa →', onClick: function () { window.location.href = '/coleccion.html'; } },
          { label: isEn ? '• Need help choosing?' : '• ¿Dudas sobre cuál modelo elegir? Asesoría WA', onClick: function () { openHumanWhatsApp('Ayuda para elegir entre los modelos'); } }
        ]);
      }
      // 5. Guía de tallas y medidas
      else if (/(talla|medida|fit|ancho|largo|pequeñ|grande|mido|peso|busto|cadera|cintura|size|tabla de medidas)/i.test(q)) {
        var ansTalla = isEn
          ? `<strong>YOSSICO Size & Fit Guide:</strong><br>
             • <strong>Size S:</strong> Bust 105 cm · Waist 66-71 cm · Hips 100 cm<br>
             • <strong>Size M:</strong> Bust 111 cm · Waist 71-76 cm · Hips 102 cm<br>
             • <strong>Size L:</strong> Bust 117 cm · Waist 76-81 cm · Hips 104 cm<br><br>
             <em>Advisor tip:</em> Our cuts feature an elegant, stylized silhouette. If your measurements fall between two sizes, we suggest choosing the larger size for full freedom of movement during procedures.`
          : `<strong>Guía de tallaje YOSSICO:</strong><br>
             • <strong>Talla S:</strong> Busto 105 cm · Cintura 66-71 cm · Cadera 100 cm<br>
             • <strong>Talla M:</strong> Busto 111 cm · Cintura 71-76 cm · Cadera 102 cm<br>
             • <strong>Talla L:</strong> Busto 117 cm · Cintura 76-81 cm · Cadera 104 cm<br><br>
             <em>Consejo de Valentina:</em> Nuestras prendas tienen un corte estructurado que estiliza la figura. Si tus medidas están entre dos tallas, te recomendamos elegir la superior para máxima holgura y confort durante tus guardias y turnos clínicos.`;

        appendMessage('bot', ansTalla, [
          { label: isEn ? '• Open Full Sizing Chart →' : '• Ver Tabla con Ilustración de Medidas →', onClick: function () { window.location.href = '/guia-de-tallas.html'; } },
          { label: isEn ? '• Confirm my size on WhatsApp' : '• Confirmar mi talla exacta con una asesora', onClick: function () { openHumanWhatsApp('Consulta sobre mi talla'); } }
        ]);
      }
      // 6. Telas técnicas y cuidado antifluido
      else if (/(tela|antifluido|material|composicion|lavar|lavado|calor|stretch|arruga|plancha|textil|fabric)/i.test(q)) {
        var ansTela = isEn
          ? `<strong>High-Performance Clinical Textile Tech:</strong><br>
             • <strong>Composition:</strong> 92% polyester + 8% spandex (170 g/m²).<br>
             • <strong>Fluid-repellent:</strong> Certified barrier against liquid and splash hazards.<br>
             • <strong>4-way stretch:</strong> Multidirectional elasticity that moves with you effortlessly.<br>
             • <strong>Care:</strong> Machine wash cold delicate cycle, no bleach, line dry in shade. Wrinkle-resistant.`
          : `<strong>Tecnología textil de grado médico:</strong><br>
             • <strong>Composición:</strong> 92% poliéster + 8% spandex (170 g/m²).<br>
             • <strong>Protección antifluido:</strong> Certificación que repele salpicaduras de líquidos y fluidos protegiendo tu piel.<br>
             • <strong>4-Way Stretch:</strong> Elasticidad en 4 sentidos que acompaña cada flexión sin deformarse.<br>
             • <strong>Respirabilidad & No arruga:</strong> Tejido transpirable de secado rápido que mantiene la caída impecable sin necesidad de plancha frecuente.<br>
             • <strong>Cuidado:</strong> Lavar en frío (ciclo suave), sin blanqueador, secado a la sombra.`;

        appendMessage('bot', ansTela, [
          { label: isEn ? '• Technical Fabric Specs →' : '• Ver Especificaciones Técnicas →', onClick: function () { window.location.href = '/tecnologia-de-la-tela.html'; } },
          { label: isEn ? '• Ask Advisor about Fabric' : '• Hacer una pregunta sobre la tela', onClick: function () { openHumanWhatsApp('Consulta sobre la tela antifluido'); } }
        ]);
      }
      // 7. Envíos y logística
      else if (/(envio|envío|entrega|tiempo|cuanto tarda|ciudad|cobertura|costo de envio|servientrega|coordinadora|shipping)/i.test(q)) {
        var ansEnvio = isEn
          ? `<strong>Nationwide Shipping & Logistics:</strong><br>
             • <strong>Coverage:</strong> We ship to all municipalities across Colombia via Coordinadora & Servientrega.<br>
             • <strong>Free Shipping:</strong> On orders equal to or exceeding $450,000 COP.<br>
             • <strong>Delivery Time:</strong> 4 to 10 business days depending on destination city.<br>
             • <strong>Order Tracking:</strong> You can trace your tracking number live on our tracking portal.`
          : `<strong>Envíos y logística nacional:</strong><br>
             • <strong>Cobertura:</strong> Despachos a todas las ciudades y municipios de Colombia por Coordinadora y Servientrega.<br>
             • <strong>Envío Gratis:</strong> En compras iguales o superiores a $450.000 COP.<br>
             • <strong>Tiempos:</strong> De 4 a 10 días hábiles según la ubicación geográfica.<br>
             • <strong>Rastreo en línea:</strong> Podrás consultar el estado de tu guía en cualquier momento desde nuestra web.`;

        appendMessage('bot', ansEnvio, [
          { label: isEn ? '• Track an Order →' : '• Rastrear un Pedido Existente →', onClick: function () { window.location.href = '/rastreo.html'; } },
          { label: isEn ? '• Shipping question via WhatsApp' : '• Consultar envío a mi ciudad por WhatsApp', onClick: function () { openHumanWhatsApp('Consulta sobre envío'); } }
        ]);
      }
      // 8. Precios, pagos y descuentos
      else if (/(precio|costo|cuanto vale|descuento|codigo|código|promocion|promoción|pago|tarjeta|wompi|pse|nequi|cuotas|bancolombia)/i.test(q)) {
        var ansPago = isEn
          ? `<strong>Pricing & Payment Options:</strong><br>
             • <strong>Scrub Sets:</strong> From $229,900 to $339,900 COP.<br>
             • <strong>Payment Methods:</strong> Credit and debit cards, PSE, Bancolombia transfer, Nequi, and interest-free installments via Wompi.<br>
             • <strong>Welcome Discount:</strong> By subscribing to DROP 01 you receive 10% off your first purchase.`
          : `<strong>Precios y formas de pago:</strong><br>
             • <strong>Sets médicos:</strong> Desde $229.900 hasta $339.900 COP.<br>
             • <strong>Métodos de pago seguros:</strong> Tarjetas de crédito/débito, PSE, transferencias Bancolombia, Nequi y opción de cuotas con Wompi.<br>
             • <strong>Descuento de bienvenida:</strong> Al suscribirte a la lista del Drop 01 recibes un 10% de descuento en tu primera compra.`;

        appendMessage('bot', ansPago, [
          { label: isEn ? '• Explore Collection' : '• Ver Colección y Precios →', onClick: function () { window.location.href = '/coleccion.html'; } },
          { label: isEn ? '• Subscribe for 10% Off' : '• Suscribirme para 10% OFF Drop 01', onClick: function () {
              toggleChat(false);
              var btn = document.querySelector('[data-open-sub]');
              if (btn) btn.click();
            }
          }
        ]);
      }
      // 9. Drops y lanzamientos
      else if (/(drop|lanzamiento|apertura|cuando abre|proximo drop|próximo drop)/i.test(q)) {
        var ansDrop = isEn
          ? `<strong>YOSSICO Limited Drop Model:</strong><br>
             We operate under limited seasonal releases. <strong>DROP 01 — Apertura</strong> will open soon with numbered units that are not restocked.<br><br>
             Subscribe to receive opening notification and an exclusive 10% welcome coupon.`
          : `<strong>Lanzamientos por Drops Limitados:</strong><br>
             En YOSSICO operamos con aperturas exclusivas en ventanas programadas. <strong>DROP 01 — Apertura</strong> estará disponible en unidades limitadas numeradas.<br><br>
             Puedes activar la alerta para recibir el aviso exacto de apertura y un 10% de descuento en tu primer pedido.`;

        appendMessage('bot', ansDrop, [
          { label: isEn ? '• Join Drop Waitlist →' : '• Activar Notificación del Drop (10% OFF) →', onClick: function () {
              toggleChat(false);
              var btn = document.querySelector('[data-open-sub]');
              if (btn) btn.click();
            }
          }
        ]);
      }
      // 10. Transferencia a WhatsApp / Humano
      else if (/(humano|asesor|asesora|persona|whatsapp|hablar con alguien|agente|contacto|telefono|teléfono|llamar)/i.test(q)) {
        var ansHumano = t.humanIntro.replace('{name}', firstName || (isEn ? 'there' : ''));
        appendMessage('bot', ansHumano, [
          { label: isEn ? '• Open WhatsApp Chat Now →' : '• Abrir WhatsApp con asesora humana →', onClick: function () { openHumanWhatsApp(query); } }
        ]);
      }
      // 11. Respuesta contextual de cortesía / Fallback cálido
      else {
        var ansFallback = isEn
          ? `I understand, ${firstName ? firstName : 'friend'}. To provide you with the most exact information for your clinical needs, would you like to speak directly with an advisor on WhatsApp or check one of these options?`
          : `Te comprendo, ${firstName ? firstName : 'amiga'}. Para darte la recomendación más precisa sobre este requerimiento o verificar disponibilidad en bodega, ¿te gustaría que lo consultemos con una asesora humana por WhatsApp o prefieres alguna de estas opciones?`;

        appendMessage('bot', ansFallback, [
          { label: isEn ? '• Chat with Advisor on WhatsApp' : '• Hablar con asesora por WhatsApp', onClick: function () { openHumanWhatsApp(query); } },
          { label: isEn ? '• Sizing Guide' : '• Consultar Guía de Tallas', onClick: function () { handleBotQuery('talla'); } },
          { label: isEn ? '• Explore Collection' : '• Ver Colección y Modelos', onClick: function () { handleBotQuery('modelos'); } }
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
      }, 350);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChat);
  } else {
    initChat();
  }
})();
