/* YOSSICO — English version (client-side). Spanish remains the default language.
   Switch with the ES | EN toggle in the header or with ?lang=en */
(function () {
  'use strict';

  var STORE = 'yos_lang';
  var qs = new URLSearchParams(location.search).get('lang');
  if (qs === 'en' || qs === 'es') { try { localStorage.setItem(STORE, qs); } catch (e) {} }
  var lang = 'es';
  try { lang = localStorage.getItem(STORE) || 'es'; } catch (e) {}

  /* ── Language toggle (always available) ─────────────────── */
  function injectToggle() {
    var host = document.querySelector('.nav__actions');
    if (!host || document.getElementById('lang-toggle')) return;
    var wrap = document.createElement('div');
    wrap.id = 'lang-toggle';
    wrap.setAttribute('translate', 'no');
    wrap.style.cssText = 'display:inline-flex;align-items:center;height:40px;line-height:1;gap:6px;font-family:Montserrat,sans-serif;font-size:10px;letter-spacing:2px;margin-right:6px;flex-shrink:0;';
    function btn(code, label) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = label;
      b.setAttribute('aria-label', code === 'en' ? 'English' : 'Español');
      b.style.cssText = 'background:none;border:none;padding:2px;margin:0;line-height:1;cursor:pointer;font:inherit;letter-spacing:inherit;color:inherit;' +
        (lang === code ? 'font-weight:700;border-bottom:1px solid currentColor;' : 'opacity:.5;');
      b.addEventListener('click', function () {
        try { localStorage.setItem(STORE, code); } catch (e) {}
        var u = new URL(location.href); u.searchParams.delete('lang');
        location.href = u.toString();
      });
      return b;
    }
    wrap.appendChild(btn('es', 'ES'));
    var sep = document.createElement('span'); sep.textContent = '|'; sep.style.opacity = '.4';
    wrap.appendChild(sep);
    wrap.appendChild(btn('en', 'EN'));
    host.insertBefore(wrap, host.firstChild);
  }

  if (lang !== 'en') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', injectToggle);
    else injectToggle();
    return;
  }

  /* ── Dictionary (Spanish → English) ─────────────────────── */
  var D = {};
  function add(pairs) { for (var i = 0; i < pairs.length; i += 2) D[pairs[i]] = pairs[i + 1]; }

  add([
    // Global / nav / footer
    `YOSSICO — Uniformes Médicos Premium`, `YOSSICO — Premium Medical Uniforms`,
    `Envío gratis en compras superiores a $300.000`, `Free shipping on orders over $300,000`,
    `· Exclusivo para Colombia`, `· Colombia only`,
    `Envío gratis en compras superiores a $300.000 · Exclusivo para Colombia`, `Free shipping on orders over $300,000 · Colombia only`,
    `ENVÍO GRATIS A TODA COLOMBIA EN COMPRAS SUPERIORES A $300.000 COP`, `FREE SHIPPING ACROSS COLOMBIA ON ORDERS OVER $300,000 COP`,
    `YOSSICO símbolo`, `YOSSICO symbol`,
    `Colección`, `Collection`,
    `Colección 2026`, `2026 Collection`,
    `Capas — Hoodies`, `Layers — Hoodies`,
    `El Acrónimo`, `The Acronym`,
    `Historia`, `Story`,
    `Nosotros`, `About Us`,
    `Contacto`, `Contact`,
    `Carrito`, `Cart`,
    `Inicio`, `Home`,
    `Navegación`, `Navigation`,
    `DROP 01 — APERTURA`, `DROP 01 — OPENING`,
    `SEMANAS`, `WEEKS`, `DÍAS`, `DAYS`, `HORAS`, `HOURS`, `MINUTOS`, `MINUTES`, `SEGUNDOS`, `SECONDS`,

    // Hero
    `Uniformes Médicos ·`, `Medical Uniforms ·`,
    `Uniformes`, `Uniforms`,
    `pensados`, `designed`,
    `para ti.`, `for you.`,
    `Para la mujer que lo da todo en cada turno. Telas que resisten, cortes que se mueven contigo y un diseño que te hace sentir tan segura como eres. Porque quien cuida a los demás también merece verse increíble.`,
      `For the woman who gives her all every shift. Fabrics that last, cuts that move with you and a design that makes you feel as confident as you are. Because those who care for others deserve to look incredible too.`,
    `Encuentra tu uniforme`, `Find your uniform`,
    `Vestidos`, `Dressed`,
    `para`, `to`,
    `sanar.`, `heal.`,
    `Uniformes para mujer diseñados para quienes dan todo en su día a día, hechos con muchísima precisión, identidad y orgullo para ellas.`,
      `Women's uniforms designed for those who give everything every day, made with meticulous precision, identity and pride for them.`,
    `Ver Colección`, `View Collection`,
    `Nuestra historia`, `Our story`,
    `YOSSICO — Modelo Principal`, `YOSSICO — Main Model`,

    // Drops
    `Modelo de lanzamiento`, `Launch model`,
    `Algunas`, `Some`,
    `prendas`, `pieces`,
    `regresan.`, `come back.`,
    `Pero nunca`, `But they're never`,
    `están siempre.`, `here forever.`,
    `Ediciones limitadas · Ventanas de disponibilidad · Colombia`, `Limited editions · Availability windows · Colombia`,
    `YOSSICO no opera como una marca tradicional. Lanzamos por drops: colecciones disponibles en ventanas específicas del año, en cantidades que no se repiten.`,
      `YOSSICO doesn't operate like a traditional brand. We launch in drops: collections available in specific windows of the year, in quantities that are never repeated.`,
    `"Cuando se acaba, se acaba."`, `"When it's gone, it's gone."`,
    `Algunos modelos regresan. Otros no. En ambos casos, la regla es la misma: cada prenda tiene su momento, y quien la elige lo sabe.`,
      `Some models come back. Others don't. Either way, the rule is the same: every piece has its moment, and whoever chooses it knows it.`,
    `Queremos que cada persona que vista YOSSICO lo haga porque eligió estar ahí.`, `We want everyone who wears YOSSICO to do so because they chose to be there.`,
    `VER COLECCIÓN DISPONIBLE`, `VIEW AVAILABLE COLLECTION`,
    `Suscríbete para el próximo drop`, `Subscribe for the next drop`,

    // Why different
    `Por qué somos diferentes`, `Why we are different`,
    `Por qué`, `Why`,
    `es diferente.`, `is different.`,
    `Telas de alto desempeño`, `High-performance fabrics`,
    `Materiales seleccionados para resistir largas jornadas: antifluidos, transpirables, duraderos. Tu comodidad no se negocia.`,
      `Materials selected to withstand long shifts: fluid-resistant, breathable, durable. Your comfort is non-negotiable.`,
    `Identidad en cada detalle`, `Identity in every detail`,
    `Cortes diseñados para el cuerpo en movimiento. Bordados de precisión. Un uniforme que te representa, no que te uniforma.`,
      `Cuts designed for the body in motion. Precision embroidery. A uniform that represents you, not one that just makes you uniform.`,
    `Entrega y experiencia`, `Delivery and experience`,
    `Cada pedido llega con una presentación pensada al detalle. Porque la primera vez que tocas un uniforme YOSSICO también hace parte de la experiencia.`,
      `Every order arrives with carefully thought-out presentation. Because the first time you touch a YOSSICO uniform is part of the experience too.`,
    `Solo para ellas`, `Only for her`,
    `Diseñada desde el principio para la mujer en la salud. Cada corte, cada detalle, cada decisión — pensados para quien da todo en cada turno.`,
      `Designed from the start for women in healthcare. Every cut, every detail, every decision — made for those who give everything on every shift.`,

    // CTA
    `Habla con nosotros`, `Talk to us`,
    `¿Listo para`, `Ready to`,
    `elevar`, `elevate`,
    `tu imagen?`, `your image?`,
    `Pedidos, tallas, guía de uniformes — estamos en WhatsApp.`, `Orders, sizes, uniform guide — we're on WhatsApp.`,
    `WhatsApp`, `WhatsApp`, `Instagram`, `Instagram`,

    // Footer
    `YOSSICO Institucional`, `YOSSICO for Institutions`,
    `Embajadoras YOSSICO`, `YOSSICO Ambassadors`,
    `AYUDA`, `HELP`,
    `Guía de Tallas`, `Size Guide`,
    `Cuidado de tus prendas`, `Care of your garments`,
    `Tecnología de la tela`, `Fabric technology`,
    `Envíos y Logística`, `Shipping & Logistics`,
    `Devoluciones y Garantía`, `Returns & Warranty`,
    `Rastreo de pedido`, `Order tracking`,
    `CONTACTO`, `CONTACT`,
    `WhatsApp: +57 312 730 0661`, `WhatsApp: +57 312 730 0661`,
    `Horario: Lunes a viernes, 10:00 a.m. – 4:00 p.m.`, `Hours: Monday to Friday, 10:00 a.m. – 4:00 p.m. (Colombia time)`,
    `© 2026 YOSSICO · Colombia ·`, `© 2026 YOSSICO · Colombia ·`,
    `Términos y Condiciones`, `Terms & Conditions`,
    `SUPERINTENDENCIA DE`, `SUPERINTENDENCE OF`,
    `INDUSTRIA Y COMERCIO`, `INDUSTRY AND COMMERCE`,

    // Cart
    `Tu Pedido`, `Your Order`,
    `Cerrar`, `Close`,
    `Total`, `Total`,
    `Pedir por WhatsApp`, `Order via WhatsApp`,
    `Tu carrito está vacío`, `Your cart is empty`,
    `Tu carrito está vacío.`, `Your cart is empty.`,
    `Explora la colección y agrega tus uniformes`, `Explore the collection and add your uniforms`,
    `Carrito de compras`, `Shopping cart`,
    `Cerrar carrito`, `Close cart`,
    `Impuestos incluidos.`, `Taxes included.`,
    `Cantidad`, `Quantity`,
    `Confirmar por WhatsApp`, `Confirm via WhatsApp`,

    // Subscribe modal
    `Suscríbete al drop`, `Subscribe to the drop`,
    `YOSSICO Drops`, `YOSSICO Drops`,
    `Sé el primero`, `Be the first`,
    `en saber`, `to know`,
    `cuándo abre.`, `when it opens.`,
    `10% de descuento en tu primera compra`, `10% off your first purchase`,
    `DROP 01`, `DROP 01`,
    `Únete al drop`, `Join the drop`,
    `Cuéntanos quién eres y te avisamos antes de que abra el próximo drop — más tu descuento de bienvenida.`,
      `Tell us who you are and we'll notify you before the next drop opens — plus your welcome discount.`,
    `Nombre completo`, `Full name`,
    `Tu nombre`, `Your name`,
    `Correo electrónico`, `Email`,
    `tu@correo.com`, `you@email.com`,
    `Celular / WhatsApp`, `Mobile / WhatsApp`,
    `Quiero mi descuento →`, `I want my discount →`,
    `Al registrarte aceptas recibir notificaciones de drops y promociones de YOSSICO. Sin spam.`,
      `By signing up you agree to receive drop and promotion notifications from YOSSICO. No spam.`,
    `¡Estás dentro.`, `You're in.`,
    `Te avisamos cuando abra el próximo drop.`, `We'll let you know when the next drop opens.`,
    `Usa este código en tu primera compra:`, `Use this code on your first purchase:`,
    `Tu código de descuento`, `Your discount code`,
    `Válido para tu primera compra · 10% de descuento · Te lo enviamos también por email`,
      `Valid for your first purchase · 10% off · We also sent it to you by email`,
    `Completa todos los campos.`, `Please fill in all fields.`,
    `Por favor completa la verificación de seguridad.`, `Please complete the security check.`,
    `Este correo ya está en la lista.`, `This email is already on the list.`,
    `Error al guardar. Intenta de nuevo.`, `Error saving. Please try again.`,
    `¡Listo! Te avisamos cuando lleguen.`, `Done! We'll let you know when they arrive.`,
    `Error de conexión. Intenta de nuevo.`, `Connection error. Please try again.`,

    // Collection
    `Colección — YOSSICO`, `Collection — YOSSICO`,
    `Scrubs que te`, `Scrubs that`,
    `definen.`, `define you.`,
    `Todo`, `All`,
    `Etiquetas`, `Labels`,
    `Ver detalle`, `View details`,
    `Anterior`, `Previous`, `Siguiente`, `Next`,
    `Set · Scrub Femenino · Top + Pantalón`, `Set · Women's Scrub · Top + Pants`,
    `Set · Top + Pantalón · Tela Técnica`, `Set · Top + Pants · Technical Fabric`,
    `Color`, `Color`, `Talla`, `Size`,
    `¿Cuál es mi talla? →`, `What's my size? →`,
    `¿Cuál es mi talla?`, `What's my size?`,
    `Pedir`, `Order`,
    `+ Agregar al carrito`, `+ Add to cart`,
    `Complementos`, `Accessories`,
    `Capas`, `Layers`,
    `Próximamente`, `Coming soon`,
    `Sudadera · Capucha · Canguro`, `Sweatshirt · Hood · Kangaroo pocket`,
    `Próximamente — déjanos tus datos`, `Coming soon — leave us your details`,
    `y te avisamos cuando lleguen`, `and we'll notify you when they arrive`,
    `Nombre`, `Name`, `Teléfono`, `Phone`, `Correo`, `Email`,
    `Avisarme`, `Notify me`,
    `Avisarme al abrir`, `Notify me on launch`,
    `ya está en la lista`, `is already on the list`,
    `¿No encuentras tu talla?`, `Can't find your size?`,
    `Escríbenos directamente y te asesoramos.`, `Write to us directly and we'll advise you.`,
    `Contactar por WhatsApp`, `Contact via WhatsApp`,
    `Detalle de producto`, `Product detail`,
    `Imagen anterior`, `Previous image`, `Imagen siguiente`, `Next image`,
    `Volver a la colección`, `Back to collection`,
    `Volver`, `Back`,
    `Tela técnica de alto rendimiento`, `High-performance technical fabric`,
    `Bolsillos funcionales estratégicamente ubicados`, `Functional, strategically placed pockets`,
    `Costuras reforzadas para mayor durabilidad`, `Reinforced seams for added durability`,
    `Lavado a máquina — resistente a decoloración`, `Machine washable — fade resistant`,
    `Selecciona tu talla`, `Select your size`,
    `Consultando disponibilidad…`, `Checking availability…`,

    // Size chart
    `Hombro`, `Shoulder`, `Busto`, `Bust`, `Manga`, `Sleeve`, `Largo top`, `Top length`,
    `Cintura`, `Waist`, `Cadera`, `Hip`, `Largo pant`, `Pant length`,
    `Puño`, `Cuff`, `Largo pantalón`, `Pant length`,

    // Product pages / accordions
    `Envíos nacionales`, `Domestic shipping`,
    `Entrega entre 4 días hábiles a 10 días hábiles según ciudad`, `Delivery in 4 to 10 business days depending on the city`,
    `Métodos de pago: Transferencia, Daviplata, Nequi y Efectivo`, `Payment methods: Bank transfer, Daviplata, Nequi and Cash`,
    `Cuidado e Instrucciones de Lavado`, `Care & Washing Instructions`,
    `Lavar a máquina en agua fría, ciclo delicado`, `Machine wash in cold water, delicate cycle`,
    `No usar blanqueadores ni productos con cloro`, `Do not use bleach or chlorine products`,
    `No secar en secadora — secar a la sombra`, `Do not tumble dry — dry in the shade`,
    `Planchar a temperatura baja si es necesario`, `Iron on low heat if necessary`,
    `No lavar en seco`, `Do not dry clean`,
    `Detalles del Producto`, `Product Details`,
    `Detalles del producto`, `Product details`,
    `Línea:`, `Line:`, `Composición:`, `Composition:`, `Gramaje:`, `Weight:`, `Corte:`, `Cut:`,
    `Detalles top:`, `Top details:`, `Pantalón:`, `Pants:`, `Tallas:`, `Sizes:`,
    `Peso de la tela:`, `Fabric weight:`, `Incluye:`, `Includes:`,
    `Colores disponibles:`, `Available colors:`, `Tallas disponibles:`, `Available sizes:`,
    `Top + Pantalón`, `Top + Pants`,
    `Negro, Azul Marino, Vinotinto`, `Black, Navy, Burgundy`,
    `Fit femenino ajustado`, `Fitted women's fit`,
    `Cuello en V · bolsillo pecho`, `V-neck · chest pocket`,
    `Bota recta · elástico + cordón en cintura`, `Straight leg · elastic + drawstring waist`,
    `Fit estándar · corte funcional adaptado para mujer`, `Standard fit · functional cut adapted for women`,
    `Cuello mao · bolsillos laterales`, `Mandarin collar · side pockets`,
    `Bota jogger · elástico + cordón en cintura`, `Jogger leg · elastic + drawstring waist`,
    `Fit premium femenino`, `Premium women's fit`,
    `92% poliéster + 8% spandex`, `92% polyester + 8% spandex`,
    `94% poliéster + 6% spandex`, `94% polyester + 6% spandex`,
    `72% poliéster + 21% rayón + 7% spandex`, `72% polyester + 21% rayon + 7% spandex`,
    `Conjunto Kyoto`, `Kyoto Set`, `Conjunto Lima`, `Lima Set`, `Conjunto Bogotá`, `Bogotá Set`,
    `Conjunto Milán`, `Milan Set`, `Conjunto Oslo`, `Oslo Set`, `Buzo Manta`, `Manta Sweatshirt`,
    `Carrito (`, `Cart (`,

    // Product descriptions (productos.js)
    `Inspirado en la serenidad escandinava, el Set OSLO combina líneas limpias y una paleta de colores sobria con una confección estructurada. Top con cuello V clásico, bolsillos funcionales a los lados y pantalón recto de corte femenino con elástico y cordón. Pensado para la profesional que valora el confort sin sacrificar la elegancia.`,
      `Inspired by Scandinavian serenity, the OSLO Set combines clean lines and a sober color palette with structured tailoring. Classic V-neck top, functional side pockets and straight-leg women's pants with elastic and drawstring. Made for the professional who values comfort without sacrificing elegance.`,
    `El Set MILAN captura la elegancia italiana con un top de cuello mao, corte entallado y pantalón recto de alta precisión. En navy profundo, proyecta autoridad y sofisticación en cada turno. La línea Signature eleva el uniforme a una declaración de identidad profesional.`,
      `The MILAN Set captures Italian elegance with a mandarin-collar top, tailored cut and precision straight-leg pants. In deep navy, it projects authority and sophistication on every shift. The Signature line elevates the uniform into a statement of professional identity.`,
    `KYOTO encarna la filosofía zen japonesa: un top cruzado con cuello cruzado y pantalón palazzo de caída impecable. Para la profesional que busca fluidez, calma y presencia. La línea Signature está diseñada para quienes entienden que el detalle lo es todo.`,
      `KYOTO embodies Japanese Zen philosophy: a wrap top with crossover neckline and palazzo pants with an impeccable drape. For the professional who seeks flow, calm and presence. The Signature line is designed for those who understand that detail is everything.`,
    `LIMA captura la calidez latinoamericana en un diseño atemporal. Top suelto con cuello V redondeado y pantalón palazzo de caída fluida, pensado para quienes buscan comodidad sin perder el estilo. Una prenda que acompaña desde el primer turno hasta el último.`,
      `LIMA captures Latin American warmth in a timeless design. Relaxed top with a rounded V-neck and flowing palazzo pants, made for those who want comfort without losing style. A piece that stays with you from the first shift to the last.`,
    `BOGOTÁ es el primer uniforme de la línea Core. Confección limpia, corte funcional y tela técnica de alto rendimiento para la profesional que da sus primeros pasos con YOSSICO. Sin adornos innecesarios, solo lo esencial llevado con orgullo.`,
      `BOGOTÁ is the first uniform of the Core line. Clean tailoring, functional cut and high-performance technical fabric for the professional taking her first steps with YOSSICO. No unnecessary frills, just the essentials worn with pride.`,
    `MANTA es el segundo uniforme de la línea Core. Un diseño depurado y funcional con corte que prioriza el movimiento. Disponible en Azul Marino, un color que transmite calma y profesionalismo en cada turno.`,
      `MANTA is the second uniform of the Core line. A refined, functional design with a cut that prioritizes movement. Available in Navy, a color that conveys calm and professionalism on every shift.`,

    // About
    `Nosotros — YOSSICO`, `About Us — YOSSICO`,
    `La Marca`, `The Brand`,
    `No solo una marca`, `Not just a brand`,
    `de`, `of`,
    `uniformes.`, `uniforms.`,
    `Nuestros pilares`, `Our pillars`,
    `Por qué somos`, `Why we are`,
    `diferentes.`, `different.`,
    `Materiales seleccionados para resistir las jornadas más largas: antifluidos, transpirables, resistentes al lavado industrial. Tu comodidad no se negocia en ningún turno.`,
      `Materials selected to withstand the longest shifts: fluid-resistant, breathable, industrial-wash resistant. Your comfort is non-negotiable on any shift.`,
    `Cortes diseñados para el cuerpo en movimiento. Bordados de precisión. Proporciones estudiadas. Un uniforme que te representa — no que te uniforma.`,
      `Cuts designed for the body in motion. Precision embroidery. Carefully studied proportions. A uniform that represents you — not one that just makes you uniform.`,
    `Nuestra filosofía`, `Our philosophy`,
    `El uniforme que llevas`, `The uniform you wear`,
    `dice quién`, `says who`,
    `eres.`, `you are.`,
    `En YOSSICO creemos que los profesionales de la salud merecen vestir a la altura de su vocación. No batas genéricas, no telas baratas, no diseños que ignoran el cuerpo que los lleva.`,
      `At YOSSICO we believe healthcare professionals deserve to dress at the level of their vocation. No generic scrubs, no cheap fabrics, no designs that ignore the body wearing them.`,
    `Somos una marca seria, exclusiva, pensada para la mujer en salud que sabe exactamente quién es. El uniforme que te hace sentir que estás en el lugar correcto, haciendo lo correcto, vestida como lo mereces.`,
      `We are a serious, exclusive brand, made for the woman in healthcare who knows exactly who she is. The uniform that makes you feel you're in the right place, doing the right thing, dressed as you deserve.`,
    `Ver la colección`, `View the collection`,
    `Posicionamiento`, `Positioning`,
    `Lujo accesible.`, `Accessible luxury.`,
    `El mejor uniforme médico del mercado.`, `The best medical uniform on the market.`,
    `YOSSICO es la referencia premium en uniformes médicos femeninos. Una marca que entiende que la profesional de la salud merece uniformes al nivel de su vocación. Premium, con identidad propia.`,
      `YOSSICO is the premium reference in women's medical uniforms. A brand that understands that the healthcare professional deserves uniforms at the level of her vocation. Premium, with its own identity.`,
    `Referencias en colección inicial`, `Styles in the initial collection`,
    `Compromiso con la calidad`, `Commitment to quality`,
    `Hecho para durar tanto como tu vocación.`, `Made to last as long as your vocation.`,

    // Story
    `Historia — YOSSICO`, `Story — YOSSICO`,
    `Historia de marca`, `Brand story`,
    `Un estándar`, `A standard`,
    `para quienes`, `for those who`,
    `cuidan a`, `take care of`,
    `los demás.`, `others.`,
    `"En Colombia, encontrar un uniforme médico que realmente estuviera a la altura era más difícil de lo que debería ser."`,
      `"In Colombia, finding a medical uniform that was truly up to standard was harder than it should have been."`,
    `El origen de YOSSICO`, `The origin of YOSSICO`,
    `01 — El origen`, `01 — The origin`,
    `No para llenar`, `Not to fill`,
    `un mercado,`, `a market,`,
    `sino para`, `but to`,
    `crear`, `create`,
    `un estándar.`, `a standard.`,
    `Las opciones existentes no reflejaban el nivel de las mujeres que los usaban:`, `Existing options did not reflect the level of the women who wore them:`,
    `profesionales con formación, con criterio, con una identidad construida con esfuerzo.`, `trained professionals with judgment and an identity built through effort.`,
    `YOSSICO nació de esa observación. Una marca seria y exclusiva, pensada desde el principio para la mujer en salud que sabe exactamente quién es y cómo quiere presentarse al mundo.`,
      `YOSSICO was born from that observation. A serious, exclusive brand, designed from the start for the woman in healthcare who knows exactly who she is and how she wants to present herself to the world.`,
    `"La mujer que cuida a otros merece un uniforme que la cuide a ella."`, `"The woman who cares for others deserves a uniform that cares for her."`,
    `La promesa YOSSICO`, `The YOSSICO promise`,
    `02 — La promesa`, `02 — The promise`,
    `Cada detalle es`, `Every detail is`,
    `una`, `a`,
    `decisión deliberada.`, `deliberate decision.`,
    `Cada prenda es una decisión deliberada en el corte, en la calidad, en los detalles que otros pasan por alto.`, `Every piece is a deliberate decision in the cut, in the quality, in the details others overlook.`,
    `Porque un uniforme que te hace sentir segura, profesional y completamente tú misma dentro de él no es un lujo — es lo mínimo que mereces en cada turno.`,
      `Because a uniform that makes you feel confident, professional and completely yourself is not a luxury — it's the least you deserve on every shift.`,
    `El nombre`, `The name`,
    `Detrás del nombre`, `Behind the name`,
    `hay`, `there are`,
    `siete palabras.`, `seven words.`,
    `Cada letra de YOSSICO tiene un significado. Juntas, definen quiénes son las mujeres que visten esta marca.`, `Every letter of YOSSICO has a meaning. Together, they define who the women who wear this brand are.`,
    `Ver el acrónimo →`, `See the acronym →`,
    `"Vestidos para sanar.`, `"Dressed to heal.`,
    `Diseñados para perdurar."`, `Designed to last."`,
    `Ver la colección →`, `View the collection →`,

    // Contact
    `Contacto — YOSSICO`, `Contact — YOSSICO`,
    `Estamos aquí`, `We're here`,
    `Hablemos`, `Let's talk`,
    `hoy.`, `today.`,
    `Pedidos, tallas, información, dudas — todo por WhatsApp o Instagram.`, `Orders, sizes, information, questions — all via WhatsApp or Instagram.`,
    `Escribir ahora →`, `Write now →`,
    `Ver perfil →`, `View profile →`,
    `Horario de atención`, `Business hours`,
    `Lunes a viernes`, `Monday to Friday`,
    `10:00 am – 4:00 pm`, `10:00 am – 4:00 pm`,
    `Tiempo de respuesta`, `Response time`,
    `Menos de 2h`, `Under 2h`,
    `En horario laboral`, `During business hours`,
    `Ubicación`, `Location`,
    `Envíos a todo el país`, `Shipping nationwide`,

    // Acronym
    `El Acrónimo — YOSSICO`, `The Acronym — YOSSICO`,
    `Lo que significa`, `What it means`,
    `YOSSICO.`, `YOSSICO.`,
    `Cada letra es una decisión. Siete palabras que definen quiénes son las mujeres que visten esta marca.`, `Every letter is a decision. Seven words that define who the women who wear this brand are.`,
    `Your Standard`, `Your Standard`,
    `Tu nivel de excelencia. El estándar que te pusiste a ti misma el día que elegiste esta carrera — y que YOSSICO está aquí para reflejar.`,
      `Your level of excellence. The standard you set for yourself the day you chose this career — and that YOSSICO is here to reflect.`,
    `Origen`, `Origin`,
    `La vocación que no se elige, se siente. Todo lo que eres parte de un propósito más grande que un título o una bata.`,
      `A vocation isn't chosen, it's felt. Everything you are is part of a purpose bigger than a title or a coat.`,
    `Salud`, `Health`,
    `La razón de existir. YOSSICO nació para quienes dedican su vida al cuidado de los demás — y cada prenda honra eso.`,
      `The reason to exist. YOSSICO was born for those who dedicate their lives to caring for others — and every piece honors that.`,
    `Servicio`, `Service`,
    `Cada turno, cada paciente, cada detalle. El servicio no es un deber — es una expresión de quién eres.`,
      `Every shift, every patient, every detail. Service isn't a duty — it's an expression of who you are.`,
    `Identidad`, `Identity`,
    `Un uniforme que te reconoce. No que te uniforma. Porque detrás de cada prenda hay una mujer con historia, criterio y presencia propia.`,
      `A uniform that recognizes you. Not one that makes you uniform. Because behind every piece there is a woman with her own story, judgment and presence.`,
    `Calidad`, `Quality`,
    `Sin negociación. Materiales de alto desempeño, cortes pensados para el movimiento, detalles que resisten cada jornada sin perder la forma.`,
      `Non-negotiable. High-performance materials, cuts made for movement, details that withstand every shift without losing shape.`,
    `Orgullo`, `Pride`,
    `De quién eres y lo que haces. El orgullo de entrar a trabajar sintiéndote completamente tú misma — y de salir sabiendo que lo diste todo.`,
      `Of who you are and what you do. The pride of walking into work feeling completely yourself — and leaving knowing you gave it your all.`,
    `"Vestidos para sanar. Diseñados para perdurar."`, `"Dressed to heal. Designed to last."`,

    // Size guide
    `Guía de Tallas — YOSSICO`, `Size Guide — YOSSICO`,
    `Todas las medidas son tomadas manualmente. Puede existir una diferencia de 1-2 cm.`, `All measurements are taken by hand. There may be a 1–2 cm difference.`,
    `Ilustración de cómo tomar medidas`, `Illustration of how to take measurements`,
    `¿Tienes dudas con tu talla? Escríbenos por WhatsApp y te asesoramos personalmente.`, `Unsure about your size? Message us on WhatsApp and we'll advise you personally.`,
    `Contactar por WhatsApp →`, `Contact via WhatsApp →`,

    // Care
    `Cuidado de tus prendas — YOSSICO`, `Garment Care — YOSSICO`,
    `Tus uniformes YOSSICO están diseñados para durar. Sigue estas instrucciones para mantenerlos en perfecto estado.`, `Your YOSSICO uniforms are designed to last. Follow these instructions to keep them in perfect condition.`,
    `Lavado a máquina`, `Machine wash`,
    `Lavar en agua fría o máximo 30°C. Ciclo delicado. Separar colores oscuros de claros en el primer lavado.`, `Wash in cold water or 30°C maximum. Delicate cycle. Separate dark from light colors on the first wash.`,
    `Sin blanqueador`, `No bleach`,
    `No usar blanqueador ni productos con cloro. Dañan las fibras técnicas y afectan el color permanentemente.`, `Do not use bleach or chlorine products. They damage technical fibers and permanently affect color.`,
    `Secado`, `Drying`,
    `Secar a baja temperatura o al aire libre. Evitar secadora a alta temperatura — puede encoger la prenda y dañar el spandex.`, `Dry at low temperature or air dry. Avoid high-heat tumble drying — it can shrink the garment and damage the spandex.`,
    `Planchado`, `Ironing`,
    `Planchar a temperatura baja si es necesario. No planchar directamente sobre bordados o estampados.`, `Iron on low heat if necessary. Do not iron directly over embroidery or prints.`,
    `Lavado a mano`, `Hand wash`,
    `Para mayor durabilidad, el lavado a mano en agua fría es la mejor opción.`, `For greater durability, hand washing in cold water is the best option.`,
    `No remojar`, `Do not soak`,
    `Evitar remojar las prendas por períodos prolongados.`, `Avoid soaking garments for long periods.`,
    `Con el cuidado adecuado, tu uniforme YOSSICO te acompañará por mucho tiempo.`, `With proper care, your YOSSICO uniform will be with you for a long time.`,

    // Fabric
    `Tecnología de la tela — YOSSICO`, `Fabric Technology — YOSSICO`,
    `No todos los uniformes son iguales. La diferencia está en el material.`, `Not all uniforms are the same. The difference is in the material.`,
    `92% poliéster + 8% spandex · 170 g/m²`, `92% polyester + 8% spandex · 170 g/m²`,
    `Tela de alto desempeño diseñada para jornadas largas. El poliéster garantiza resistencia y durabilidad; el spandex permite libertad de movimiento en cada posición. Peso medio que equilibra comodidad y estructura.`,
      `High-performance fabric designed for long shifts. Polyester ensures strength and durability; spandex allows freedom of movement in every position. Medium weight that balances comfort and structure.`,
    `94% poliéster + 6% spandex · 120 g/m²`, `94% polyester + 6% spandex · 120 g/m²`,
    `Tela ultraligera ideal para entornos de alta actividad. Mayor transpirabilidad sin sacrificar resistencia. El menor gramaje la hace especialmente cómoda en turnos exigentes.`,
      `Ultralight fabric ideal for high-activity environments. Greater breathability without sacrificing strength. The lower weight makes it especially comfortable on demanding shifts.`,
    `72% poliéster + 21% rayón + 7% spandex · 210 g/m²`, `72% polyester + 21% rayon + 7% spandex · 210 g/m²`,
    `La tela más premium de la colección. El rayón aporta una caída suave y un tacto sedoso que la diferencia visualmente. Mayor gramaje para una presencia más estructurada y elegante.`,
      `The most premium fabric in the collection. Rayon adds a soft drape and a silky feel that sets it apart visually. Higher weight for a more structured, elegant presence.`,
    `Beneficios`, `Benefits`,
    `Antifluidos`, `Fluid-resistant`,
    `Transpirable`, `Breathable`,
    `Elástico en 4 direcciones`, `4-way stretch`,
    `Resistente al color`, `Colorfast`,
    `Secado rápido`, `Quick-dry`,
    `Cada tela fue seleccionada con un propósito. Porque lo que vistes en el trabajo dice quién eres.`, `Every fabric was selected with a purpose. Because what you wear to work says who you are.`,

    // Institutional
    `Institucional — YOSSICO`, `Institutional — YOSSICO`,
    `YOSSICO PARA INSTITUCIONES`, `YOSSICO FOR INSTITUTIONS`,
    `Cuando el equipo también representa a la marca.`, `When the team also represents the brand.`,
    `Algunas clínicas, consultorios y grupos médicos nos han escrito con una pregunta distinta: no buscan un uniforme, buscan una identidad para su equipo.`,
      `Some clinics, practices and medical groups have written to us with a different question: they're not looking for a uniform, they're looking for an identity for their team.`,
    `Si eso es lo que tienes en mente, nos interesa escucharte.`, `If that's what you have in mind, we'd love to hear from you.`,
    `Trabajamos con instituciones que quieren vestir a su equipo con la misma atención al detalle que ponemos en cada prenda. El proceso es diferente al de nuestros drops — más personalizado, más conversado.`,
      `We work with institutions that want to dress their team with the same attention to detail we put into every piece. The process differs from our drops — more personalized, more conversational.`,
    `Si quieres explorar cómo podría verse YOSSICO en tu institución, escríbenos. Sin compromisos.`, `If you'd like to explore how YOSSICO could look at your institution, write to us. No commitment.`,
    `Institución / Clínica / Consultorio`, `Institution / Clinic / Practice`,
    `Ciudad`, `City`,
    `Número aproximado de personas en el equipo`, `Approximate number of people on the team`,
    `Mensaje (Opcional)`, `Message (Optional)`,
    `Acepto los`, `I accept the`,
    `términos y condiciones`, `terms and conditions`,
    `de YOSSICO`, `of YOSSICO`,
    `Enviar Solicitud`, `Send Request`,
    `También puedes escribirnos directamente a`, `You can also write to us directly at`,
    `— respondemos en máximo 48 horas.`, `— we respond within 48 hours.`,

    // Ambassadors
    `Embajadoras — YOSSICO`, `Ambassadors — YOSSICO`,
    `Embajadoras Yossico`, `YOSSICO Ambassadors`,
    `Más que un uniforme.`, `More than a uniform.`,
    `Una identidad.`, `An identity.`,
    `Buscamos profesionales de la salud que inspiren con su presencia, que lideren con su ejemplo y que entiendan que vestir bien es también una forma de ejercer con orgullo.`,
      `We're looking for healthcare professionals who inspire with their presence, lead by example, and understand that dressing well is also a way of practicing with pride.`,
    `Quiero ser embajadora →`, `I want to be an ambassador →`,
    `Embajadora Yossico`, `YOSSICO Ambassador`,
    `Uniformes YOSSICO`, `YOSSICO Uniforms`,
    `Acceso a prendas de la colección como parte del programa.`, `Access to pieces from the collection as part of the program.`,
    `Descuentos exclusivos`, `Exclusive discounts`,
    `Beneficios especiales para ti y tu comunidad.`, `Special benefits for you and your community.`,
    `Comunidad`, `Community`,
    `Haz parte de un grupo selecto de profesionales que representan la marca.`, `Be part of a select group of professionals who represent the brand.`,
    `Profesional de la salud Yossico`, `YOSSICO healthcare professional`,
    `"No buscamos influenciadoras. Buscamos mujeres que ya son una referencia en su entorno. Si eso eres tú, nos interesa conocerte."`,
      `"We're not looking for influencers. We're looking for women who are already a reference in their environment. If that's you, we want to meet you."`,
    `Cuéntanos sobre ti`, `Tell us about yourself`,
    `Nombre completo *`, `Full name *`,
    `Especialidad / área de la salud *`, `Specialty / healthcare area *`,
    `Ciudad *`, `City *`,
    `Correo electrónico *`, `Email *`,
    `Instagram (opcional)`, `Instagram (optional)`,
    `@usuario`, `@username`,
    `¿Por qué quieres ser embajadora YOSSICO? (opcional)`, `Why do you want to be a YOSSICO ambassador? (optional)`,
    `Máximo 200 caracteres...`, `Maximum 200 characters...`,
    `Postularme`, `Apply`,
    `Revisamos cada postulación personalmente. Te contactamos en un plazo de 48 a 72 horas.`, `We review every application personally. We'll contact you within 48 to 72 hours.`,
    `Éxito`, `Success`,
    `¡Gracias por tu postulación!`, `Thank you for applying!`,
    `Hemos recibido tu solicitud. Nos pondremos en contacto contigo en un plazo de 48 a 72 horas.`, `We have received your application. We will contact you within 48 to 72 hours.`,

    // Checkout
    `Checkout — YOSSICO`, `Checkout — YOSSICO`,
    `Pedido confirmado — YOSSICO`, `Order confirmed — YOSSICO`,
    `Ver colección →`, `View collection →`,
    `Tus datos`, `Your details`,
    `para recibir confirmación`, `to receive confirmation`,
    `Dirección de entrega`, `Delivery address`,
    `Notas del pedido`, `Order notes`,
    `Color preferido, instrucciones especiales...`, `Preferred color, special instructions...`,
    `Código de descuento`, `Discount code`,
    `Método de pago`, `Payment method`,
    `Tarjeta débito / crédito · Nequi · PSE · Bancolombia`, `Debit / credit card · Nequi · PSE · Bancolombia`,
    `Confirma tu pedido y coordina el pago directamente con el equipo YOSSICO`, `Confirm your order and arrange payment directly with the YOSSICO team`,
    `Al confirmar, serás redirigido a WhatsApp para finalizar tu pedido con el equipo YOSSICO.`, `Once confirmed, you'll be redirected to WhatsApp to complete your order with the YOSSICO team.`,
    `Error al validar el código.`, `Error validating the code.`,
    `Código no válido o inexistente.`, `Invalid or non-existent code.`,
    `Este código ya fue utilizado.`, `This code has already been used.`,
    `Envío Gratis`, `Free Shipping`,
    `Válido para Pago Efectivo`, `Valid for Cash payment`,
    `Error al validar. Intenta de nuevo.`, `Error validating. Please try again.`,
    `Por favor completa: nombre, ciudad y dirección.`, `Please complete: name, city and address.`,
    `Pagar con Wompi`, `Pay with Wompi`,
    `Al confirmar, se abrirá la pasarela segura de Wompi para procesar tu pago con tarjeta o PSE.`, `Once confirmed, Wompi's secure gateway will open to process your card or PSE payment.`,
    `Confirmar pedido por WhatsApp`, `Confirm order via WhatsApp`,

    // Tracking
    `Rastreo de Pedido — YOSSICO`, `Order Tracking — YOSSICO`,
    `Rastrea tu pedido`, `Track your order`,
    `Ingresa tu número de celular o los primeros 8 caracteres de tu #ID de pedido.`, `Enter your mobile number or the first 8 characters of your order #ID.`,
    `Tu número de teléfono o #ID de pedido`, `Your phone number or order #ID`,
    `Rastrear pedido →`, `Track order →`,

    // Login / register / profile
    `Iniciar Sesión — YOSSICO`, `Sign In — YOSSICO`,
    `Bienvenida de vuelta`, `Welcome back`,
    `Tu uniforme`, `Your uniform`,
    `te`, `is`,
    `espera.`, `waiting.`,
    `Accede a tu perfil para ver tus descuentos, gestionar tus datos y estar lista para el próximo drop.`, `Access your profile to see your discounts, manage your details and be ready for the next drop.`,
    `© 2026 YOSSICO · Colombia`, `© 2026 YOSSICO · Colombia`,
    `Iniciar sesión`, `Sign in`,
    `Ingresa tus datos para acceder a tu cuenta.`, `Enter your details to access your account.`,
    `Contraseña`, `Password`,
    `¿Olvidaste tu contraseña?`, `Forgot your password?`,
    `Recordarme en este dispositivo`, `Remember me on this device`,
    `¿No tienes cuenta?`, `Don't have an account?`,
    `Regístrate aquí`, `Sign up here`,
    `Registrarse — YOSSICO`, `Sign Up — YOSSICO`,
    `Únete a la comunidad`, `Join the community`,
    `Empieza con`, `Start with`,
    `el`, `the`,
    `uniforme`, `right`,
    `adecuado.`, `uniform.`,
    `Crea tu cuenta, accede a descuentos exclusivos y sé la primera en conocer cada nuevo drop de YOSSICO.`, `Create your account, access exclusive discounts and be the first to know about every new YOSSICO drop.`,
    `Modelo KYOTO de espaldas`, `KYOTO model, back view`,
    `Crear cuenta`, `Create account`,
    `Completa los campos para registrarte.`, `Fill in the fields to sign up.`,
    `(mín. 8 caracteres)`, `(min. 8 characters)`,
    `Confirmar contraseña`, `Confirm password`,
    `Al registrarte aceptas los`, `By signing up you accept the`,
    `de YOSSICO.`, `of YOSSICO.`,
    `Crear mi cuenta`, `Create my account`,
    `¿Ya tienes cuenta?`, `Already have an account?`,
    `Inicia sesión`, `Sign in`,
    `Mi Perfil — YOSSICO`, `My Profile — YOSSICO`,
    `Mi cuenta`, `My account`,
    `Mi Perfil`, `My Profile`,
    `Datos de Envío`, `Shipping Details`,
    `Historial de Pedidos`, `Order History`,
    `Mis Descuentos`, `My Discounts`,
    `Cerrar sesión`, `Sign out`,
    `Tu cuenta`, `Your account`,
    `Apellido`, `Last name`,
    `Editar perfil`, `Edit profile`,
    `Cambiar contraseña`, `Change password`,
    `Guardar cambios`, `Save changes`,
    `Cancelar`, `Cancel`,
    `Logística`, `Logistics`,
    `Dirección`, `Address`,
    `Apartamento / Número`, `Apartment / Number`,
    `Editar datos de envío`, `Edit shipping details`,
    `Guardar`, `Save`,
    `Tus compras`, `Your purchases`,
    `Aún no tienes pedidos registrados.`, `You don't have any orders yet.`,
    `Cargando…`, `Loading…`,
    `Verificando sesión…`, `Verifying session…`,
    `Producto — YOSSICO`, `Product — YOSSICO`,

    // 404
    `Página no encontrada — YOSSICO`, `Page not found — YOSSICO`,
    `Error 404`, `Error 404`,
    `Página no`, `Page`,
    `encontrada.`, `not found.`,
    `Puede que esta página haya sido movida o ya no exista.`, `This page may have been moved or no longer exists.`,
    `Ir al inicio →`, `Go to home →`,
    `Ver colección`, `View collection`,

    // Thank-you page
    `Pedido confirmado`, `Order confirmed`
  ]);

  /* Descriptors used inside alt/title texts, e.g. "Set OSLO — Vista frontal" */
  var PARTS = {
    'Vista frontal': 'Front view', 'Detalle top': 'Top detail', 'Vista de espalda': 'Back view',
    'Cuerpo completo frontal': 'Full body front', 'Detalle top y etiqueta': 'Top and label detail',
    'Vista de espalda y caída': 'Back view and drape', 'Etiquetas': 'Labels',
    'Azul Marino Frontal': 'Navy Front', 'Azul Marino Medio': 'Navy Half-body', 'Azul Marino Espalda': 'Navy Back',
    'Azul Marino Perfil': 'Navy Side', 'Azul Marino Detalles': 'Navy Details', 'Azul Marino': 'Navy',
    'Perfil': 'Side view'
  };

  var ATTRS = ['placeholder', 'alt', 'title', 'aria-label'];

  function norm(s) { return s.replace(/\s+/g, ' ').trim(); }

  function translate(str) {
    var n = norm(str);
    if (!n) return null;
    if (D.hasOwnProperty(n)) return D[n];
    if (n.indexOf(' — ') > -1) {                       // "Set OSLO — Vista frontal"
      var parts = n.split(' — '), changed = false;
      var out = parts.map(function (p) {
        var t = D.hasOwnProperty(p) ? D[p] : (PARTS.hasOwnProperty(p) ? PARTS[p] : null);
        if (t !== null) { changed = true; return t; }
        return p;
      });
      if (changed) return out.join(' — ');
    }
    var c = n.match(/^Carrito \((\d+)\)$/);
    if (c) return 'Cart (' + c[1] + ')';
    var m = n.match(/^(Set|Conjunto) ([A-ZÁÉÍÓÚ]+)$/);
    if (m) return m[2] + ' Set';
    return null;
  }

  function doText(node) {
    var v = node.nodeValue;
    if (!v || !v.trim()) return;
    var t = translate(v);
    if (t === null || t === norm(v)) return;
    var lead = v.match(/^\s*/)[0], trail = v.match(/\s*$/)[0];
    node.nodeValue = lead + t + trail;
  }

  function doEl(el) {
    if (el.nodeType !== 1) return;
    var tag = el.tagName;
    if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'SVG' || tag === 'NOSCRIPT') return;
    if (el.getAttribute && el.getAttribute('translate') === 'no') return;
    ATTRS.forEach(function (a) {
      if (el.hasAttribute && el.hasAttribute(a)) {
        var t = translate(el.getAttribute(a));
        if (t !== null) el.setAttribute(a, t);
      }
    });
    if (tag === 'INPUT' && (el.type === 'submit' || el.type === 'button') && el.value) {
      var tv = translate(el.value); if (tv !== null) el.value = tv;
    }
  }

  function walk(root) {
    if (root.nodeType === 3) { doText(root); return; }
    if (root.nodeType !== 1) return;
    doEl(root);
    var w = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        if (n.nodeType === 1) {
          var tg = n.tagName;
          if (tg === 'SCRIPT' || tg === 'STYLE' || tg === 'NOSCRIPT' || tg === 'svg' || tg === 'SVG') return NodeFilter.FILTER_REJECT;
          if (n.getAttribute('translate') === 'no') return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var n;
    while ((n = w.nextNode())) { if (n.nodeType === 3) doText(n); else doEl(n); }
  }

  var busy = false;
  function start() {
    document.documentElement.lang = 'en';
    var t = translate(document.title); if (t !== null) document.title = t;
    walk(document.body);
    injectToggle();
    new MutationObserver(function (muts) {
      if (busy) return;
      busy = true;
      muts.forEach(function (m) {
        if (m.type === 'characterData') doText(m.target);
        else if (m.type === 'attributes') doEl(m.target);
        else m.addedNodes.forEach(walk);
      });
      busy = false;
    }).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
