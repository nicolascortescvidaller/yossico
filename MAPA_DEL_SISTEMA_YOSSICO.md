# 🗺️ MAPA MAESTRO DEL SISTEMA YOSSICO
> **Fuente Única de Verdad (Single Source of Truth)**  
> *Documento de arquitectura, funcionalidades activas, flujos de usuario y panel de administración.*  
> *Última actualización: Octubre 2026*

---

## 1. Arquitectura General y Accesos

| Componente | Plataforma / Tecnología | Ubicación / Referencia |
| :--- | :--- | :--- |
| **Dominio Principal** | DNS en Cloudflare / Vercel | `https://yossico.com` |
| **Hosting Frontend** | Vercel (Sitio estático de ultra-alta velocidad) | `web/` |
| **Base de Datos & Auth** | Supabase PostgreSQL (Sao Paulo / US-East) | `https://mgzevtcipwfpqgolmpwm.supabase.co` |
| **Email Transaccional** | Resend API (`RESEND_API_KEY`) | Envío desde `hola@yossico.com` |
| **Pasarela de Pagos** | Wompi Colombia (Bancolombia, Nequi, Tarjetas, PSE) | Integración Widget + Webhook Edge Function |
| **Panel Administrativo** | Aplicación web standalone en archivo único | [`web/YOSSICO_Panel_Admin.html`](file:///Users/nicolascortesvidaller/yossico/web/YOSSICO_Panel_Admin.html) |
| **PIN Admin General** | Autenticación en frontend | `yossico2025` |
| **PIN Finanzas Maestro**| Submódulo financiero protegido | `Nc1018499182*` |
| **Teléfono WhatsApp Oficial** | Línea comercial y soporte | `+57 312 730 0661` |
| **Email Administrador** | Recepción de alertas de ventas y leads | `hola@yossico.com` |

---

## 2. Tienda Online (Storefront / Experiencia de la Clienta)

### 2.1. Catálogo y Navegación
* **Inicio ([`index.html`](file:///Users/nicolascortesvidaller/yossico/web/index.html)):**
  * Barra fija superior con anuncio de **Envío Gratis en Colombia** (pedidos > $250.000 COP).
  * Video / Slider de presentación con estética editorial de lujo silencioso.
  * Selector de colecciones y prendas destacadas.
  * Modal VIP de bienvenida (10% OFF en primera compra) con validación explícita mediante Cloudflare Turnstile.
  * Widget flotante de asesoría virtual (*Concierge*).

* **Colección Completa ([`coleccion.html`](file:///Users/nicolascortesvidaller/yossico/web/coleccion.html)):**
  * Filtros por líneas: *Essentials*, *Signature*, *Noir*, y *Capas*.
  * Tarjetas de producto con efecto hover zoom, visualización de colores disponibles y tallas (S, M, L).
  * Modal rápido de selección de prenda para agregar al carrito sin salir de la página.
  * Formulario de lista de espera para la línea *Capas*.
  * **Banner Dinámico de Drop:** Barra de cuenta regresiva que lee en tiempo real la configuración global de Supabase para anunciar el próximo lanzamiento.

* **Fichas de Producto Individuales:**
  * Páginas dedicadas con galería, especificaciones técnicas y selector de compra:
    * [`oslo.html`](file:///Users/nicolascortesvidaller/yossico/web/oslo.html) · [`milan.html`](file:///Users/nicolascortesvidaller/yossico/web/milan.html) · [`kyoto.html`](file:///Users/nicolascortesvidaller/yossico/web/kyoto.html)
    * [`lima.html`](file:///Users/nicolascortesvidaller/yossico/web/lima.html) · [`bogota.html`](file:///Users/nicolascortesvidaller/yossico/web/bogota.html) · [`manta.html`](file:///Users/nicolascortesvidaller/yossico/web/manta.html)
    * [`producto.html`](file:///Users/nicolascortesvidaller/yossico/web/producto.html) (Visor dinámico universal por parámetro URL).

* **Páginas Institucionales y de Marca:**
  * [`nosotros.html`](file:///Users/nicolascortesvidaller/yossico/web/nosotros.html): Filosofía, estándares y valores de la marca.
  * [`historia.html`](file:///Users/nicolascortesvidaller/yossico/web/historia.html): Historia editorial del fundador.
  * [`acronimo.html`](file:///Users/nicolascortesvidaller/yossico/web/acronimo.html): Significado de cada letra de YOSSICO.
  * [`tecnologia-de-la-tela.html`](file:///Users/nicolascortesvidaller/yossico/web/tecnologia-de-la-tela.html): Desglose técnico (antifluido, 4-way stretch, transpirabilidad, microfibra).
  * [`cuidado-de-tus-prendas.html`](file:///Users/nicolascortesvidaller/yossico/web/cuidado-de-tus-prendas.html): Instrucciones de lavado y prolongación de vida útil.
  * [`guia-de-tallas.html`](file:///Users/nicolascortesvidaller/yossico/web/guia-de-tallas.html): Tabla de medidas anatómicas (busto, cintura, cadera en cm).
  * [`institucional.html`](file:///Users/nicolascortesvidaller/yossico/web/institucional.html): Cotizador para dotaciones de clínicas, hospitales y consultorios B2B.
  * [`embajadoras.html`](file:///Users/nicolascortesvidaller/yossico/web/embajadoras.html): Programa de creadoras de contenido y profesionales embajadoras de marca.
  * [`contacto.html`](file:///Users/nicolascortesvidaller/yossico/web/contacto.html) / [`terminos.html`](file:///Users/nicolascortesvidaller/yossico/web/terminos.html) / [`404.html`](file:///Users/nicolascortesvidaller/yossico/web/404.html): Soporte directo, políticas legales y página 404 personalizada.

---

### 2.2. Flujo de Compra y Checkout

1. **Cajón Deslizante del Carrito ([`cart.js`](file:///Users/nicolascortesvidaller/yossico/web/cart.js)):**
   * Persistencia en `localStorage ('yossico_cart')`.
   * Contador en tiempo real en la barra de navegación.
   * Barra de progreso hacia el envío gratis nacional.
   * Controles de cantidad (+/-) y eliminación de prendas.
   * Campo de cupón de descuento o Gift Card.

2. **Pantalla de Checkout ([`checkout.html`](file:///Users/nicolascortesvidaller/yossico/web/checkout.html)):**
   * **Validación rigurosa de datos:** Nombre, celular/WhatsApp verificado, correo electrónico con validación de sintaxis (obligatorio para recepción de factura y número de guía).
   * **Caja de Garantías YOSSICO:**
     * *Cambios de talla sin costo.*
     * *Envío asegurado a toda Colombia con Coordinadora / Servientrega.*
     * *Telas técnicas certificadas antifluido.*
   * **Soporte de Cupones y Gift Cards:** Compatible con descuentos porcentuales y saldo parcial en Gift Cards (`GC-XXXX`).
   * **Métodos de Pago:**
     * **Confirmar por WhatsApp:** Guarda el pedido en Supabase como `Pendiente`, abre WhatsApp con el desglose exacto y redirige a la página de confirmación.
     * **Pasarela Wompi:** Pago digital con tarjeta, Nequi o PSE. Al completarse, Wompi actualiza el pedido a `Pagado` vía Webhook.
   * **Limpieza de Carrito:** Al completar la orden, el carrito local se vacía automáticamente para evitar compras duplicadas accidentales.

3. **Página de Confirmación ([`gracias.html`](file:///Users/nicolascortesvidaller/yossico/web/gracias.html)):**
   * Resumen claro del pedido, referencia (#ID), total pagado y badge de estado.
   * Confirmación visual de envío del comprobante por correo electrónico.
   * Botón de acción principal: **`Rastrear mi pedido en tiempo real →`**, que transfiere los datos a la página de rastreo con un solo clic.

4. **Portal de Rastreo Público ([`rastreo.html`](file:///Users/nicolascortesvidaller/yossico/web/rastreo.html)):**
   * Consulta pública segura (sin contraseña) mediante teléfono o referencia de pedido.
   * **Lectura automática de parámetros URL:** Si la clienta abre un enlace `yossico.com/rastreo.html?busqueda=GUIA123`, el sistema ejecuta la consulta inmediatamente sin necesidad de teclear.
   * Muestra:
     * Nombre de la clienta y prendas adquiridas.
     * Estado logístico actual con badge dinámico.
     * **Línea de tiempo histórica** con fecha y hora exacta de cada cambio de estado.
     * Número de guía y botón con enlace directo a la transportadora (Coordinadora / Inter Rapidísimo / Servientrega).

---

### 2.3. Concierge Virtual Inteligente ("Valentina")
* **Archivos:** [`chat-widget.js`](file:///Users/nicolascortesvidaller/yossico/web/chat-widget.js) y [`chat-widget.css`](file:///Users/nicolascortesvidaller/yossico/web/chat-widget.css).
* **Diseño:** Botón flotante cuadrado negro con diseño editorial minimalista (*¿Hablamos?*).
* **Pantalla 1 (Cero Ruido):** Solicita nombre y WhatsApp/correo de forma limpia para iniciar.
* **Persistencia Inmediata:** Al enviar, los datos se guardan automáticamente en la tabla Supabase `chat_leads` mediante el RPC `guardar_chat_lead`.
* **Pantalla 2 (Conversación):** Presenta a **Valentina**, asesora virtual de YOSSICO, con botones de preguntas frecuentes:
  * 📏 *¿Cómo elijo mi talla?* (guía de medidas y recomendación de calce).
  * 🧵 *¿Cómo son las telas?* (tecnología antifluido y 4-way stretch).
  * 🚚 *Tiempos y costos de envío* (tiempos para Bogotá y resto del país).
  * 💬 *Hablar con una asesora humana en WhatsApp* (abre chat directo con el equipo).

---

## 3. Panel de Administración ([`YOSSICO_Panel_Admin.html`](file:///Users/nicolascortesvidaller/yossico/web/YOSSICO_Panel_Admin.html))

Acceso universal centralizado: **`https://yossico.com/YOSSICO_Panel_Admin.html`** (PIN: `yossico2025`).

### 3.1. Módulos y Pestañas Disponibles

| Pestaña | Nombre | Funcionalidades Principales |
| :---: | :--- | :--- |
| 📦 | **Pedidos** | • Tabla de pedidos en tiempo real conectada a Supabase.<br>• Filtro por estado: *Todos*, *Pagados*, *Pendientes*, *Enviados*, *Cancelados*.<br>• **Clasificación VIP de Clientas:** Insignias de fidelidad (Platinum, Gold, Silver) según gasto acumulado histórico.<br>• **Cambio de Estado con Trazabilidad:** Al mover el estado de un pedido, se guarda el timestamp en el array `historial_estados`. Si se cancela, el stock se devuelve automáticamente.<br>• **Impresión de Rótulo:** Genera e imprime la etiqueta física para pegar en el paquete de despacho.<br>• **Recuperar Venta por WhatsApp:** Mensaje prellenado para contactar a clientas con pedidos en espera.<br>• **Procesar Cambio (RMA):** Modal para registrar cambios de talla o devoluciones.<br>• **⭐ Pedir Reseña:** Si el pedido está en `Entregado`, genera mensaje de WhatsApp invitando a calificar en Google.<br>• **Guía de Despacho:** Registro de número de guía, autodetecta Coordinadora / Servientrega / Inter Rapidísimo.<br>• **Notificación de Envío en 1 Clic:** Abre WhatsApp con mensaje de lujo y enlace directo de rastreo en `yossico.com/rastreo.html?busqueda=GUIA`, y actualiza el pedido a `Enviado` automáticamente.<br>• **Notas Internas:** Campo de anotaciones privadas por pedido (`admin_actualizar_nota`).<br>• **Exportar a CSV:** Descarga masiva con todos los campos contables y logísticos. |
| 🚚 | **Envíos** | • Vista especializada para empaque y logística.<br>• Selección múltiple con checkboxes para generar manifiestos de despacho.<br>• Filtro rápido entre *Pendientes de Despacho* y *Despachados*.<br>• Botón rápido de confirmación *Marcar Entregado*. |
| 👗 | **Inventario / Stock** | • Control de unidades en tiempo real desglosado por Prenda, Color y Talla (S, M, L).<br>• Botones de ajuste rápido (+1, -1, o edición numérica directa).<br>• **Alertas Inteligentes de Stock Bajo:** Destaca referencias con ≤ 3 unidades.<br>• **Capital Inmovilizado en Bodega:** Calcula el valor total del inventario tanto a precio de costo como a precio de venta.<br>• **+ Agregar Nueva Prenda:** Formulario desplegable para crear nuevas referencias en la base de datos generando automáticamente las filas para S, M y L. |
| 💳 | **POS / Venta Manual** | • Creador de pedidos para ventas físicas, eventos, showrooms o pedidos cerrados por chat.<br>• Selección de prendas con descuento de inventario en vivo.<br>• **Generador de Link Wompi:** Crea links de pago instantáneos para cobrar digitalmente en el punto de venta. |
| 🚀 | **Drop / Lanzamiento** | • **Control Global del Drop:** Activa o desactiva la cuenta regresiva en toda la tienda web mediante Supabase (`config_yossico`).<br>• Configuración de nombre del drop y fecha/hora exacta de apertura.<br>• **Métricas del Drop en Vivo:** Calcula pedidos generados, ingresos recaudados, ticket promedio y clientas nuevas desde la fecha del lanzamiento. |
| 🏷️ | **Descuentos** | • Generador de códigos de descuento promocionales con porcentaje configurable (5% a 50%).<br>• Tabla de todos los cupones existentes, beneficiario y estado (*Disponible* o *Usado*).<br>• Botón para quemar/marcar un cupón como usado manualmente. |
| 🎁 | **Gift Cards** | • Emisión de tarjetas de regalo digitales (`GC-XXXX`).<br>• **Soporte de Saldo Parcial:** Almacena el valor emitido y el `saldo_restante`. Si una clienta usa solo una parte de la Gift Card, el remanente queda disponible para su próxima compra. |
| ✨ | **Embajadoras** | • Registro y seguimiento de médicas, enfermeras y creadoras de contenido afiliadas.<br>• Asignación de cupones personalizados y botón directo de contacto por WhatsApp. |
| 👥 | **Clientes / CRM** | • Tabla de inteligencia comercial (`admin_get_clientes`).<br>• Consulta por clienta: Total de pedidos realizados, dinero total gastado (LTV), última fecha de compra y ciudades registradas.<br>• Gráfica de barras de mayor gasto acumulado.<br>• **Alertas CRM de Recompra:** Notifica clientas habituales con más de 60-90 días sin comprar para reactivarlas. |
| 💬 | **Leads del Chat** | • Registro centralizado de todas las personas que inician conversación con Valentina en la web.<br>• Datos: Nombre, contacto (WhatsApp o correo), página donde navegaba y fecha de registro.<br>• Botón directo de 1 clic para contactar a la interesada por WhatsApp. |
| 📊 | **Estadísticas** | • Resumen ejecutivo: Ingresos totales pagados, pedidos cerrados, ticket promedio y tasa de conversión.<br>• Gráficas dinámicas con Chart.js de ventas en el tiempo.<br>• **Inteligencia de Producción (Distribución de Tallas):** Historial porcentual de venta por tallas (S, M, L) para optimizar el corte de lotes futuros de confección.<br>• **Battle of Products:** Ranking de sets y colores más vendidos.<br>• **📊 Reporte WA:** Botón que redacta y envía automáticamente el resumen semanal del negocio al WhatsApp del administrador. |
| 📣 | **Pauta / Ads** | • Registro de inversión publicitaria diaria en Meta Ads, Google Ads o TikTok Ads.<br>• Cálculo automático de **ROAS** (Retorno del Gasto Publicitario) cruzado con las ventas reales en Supabase. |
| 💰 | **Finanzas & Simulador** | *(Protegido con contraseña maestra: `Nc1018499182*`)*<br>• **Sub-tab Resumen:** Estado de resultados mensual (Ingresos, Costo de Ventas, Margen Bruto, OPEX y Margen Neto), gráfico de Cashflow.<br>• **Sub-tab Unit Economics:** Desglose exacto de costos por prenda (tela, confección, insumos, marquillas, empaque, comisión pasarela).<br>• **Sub-tab OPEX:** Registro y control de gastos fijos operativos.<br>• **Sub-tab Simulador Drop:** Modelo matemático interactivo en 5 fases:<br>  1. Ingresos brutos y costos de producción proyectados.<br>  2. Retorno garantizado de capital.<br>  3. Fondo de reinversión del 30% (80% producción nueva / 20% operación).<br>  4. Utilidad neta repartible del 70% (70% Nicolás / 30% Socio inversor).<br>  5. Gráficos dinámicos con Chart.js en tiempo real. |
| 🏢 | **Cotizador B2B** | • Gestión de solicitudes de dotación corporativa enviadas desde `institucional.html`. |

---

## 4. Backend, Base de Datos y Edge Functions (Supabase)

### 4.1. Tablas en PostgreSQL
* **`pedidos`:** Registra cada transacción. Columnas: `id`, `cliente_nombre`, `cliente_telefono`, `cliente_email`, `cliente_ciudad`, `cliente_direccion`, `items` (JSONB), `total`, `estado`, `codigo_descuento`, `wompi_id`, `wompi_referencia`, `wompi_estado`, `numero_guia`, `empresa_envio`, `historial_estados` (JSONB), `nota_interna`.
* **`productos`:** Catálogo e inventario. Columnas: `id`, `nombre`, `color`, `talla`, `stock`, `updated_at`.
* **`subscribers`:** Base de suscriptoras al Drop, códigos de descuento promocionales y Gift Cards. Columnas: `id`, `email`, `phone`, `name`, `discount_code`, `used`, `saldo_restante`.
* **`chat_leads`:** Contactos capturados por el widget de chat. Columnas: `id`, `nombre`, `contacto`, `origen_pagina`, `estado`, `notas`, `created_at`.
* **`config_yossico`:** Configuración global del sitio (estado y fecha del Drop activo).
* **`pauta_gastos`:** Registro contable de inversión en anuncios digitales.
* **`finanzas_gastos`:** Registro contable de costos fijos y operativos.
* **`cotizaciones_b2b`:** Solicitudes institucionales de dotaciones.

### 4.2. Funciones RPC Clave (Seguridad y Lógica de Negocio)
* `rastrear_pedido(busqueda text)`: Lectura pública segura para clientes por teléfono o referencia.
* `validar_descuento(codigo text)`: Valida cupones y saldos en Gift Cards.
* `usar_giftcard(codigo text, monto numeric)`: Descuenta saldo parcial o agota tarjetas de regalo.
* `marcar_descuento_usado(codigo text)`: Desactiva cupones de uso único.
* `guardar_chat_lead(p_nombre, p_contacto, p_origen)`: Inserción segura de prospectos del chat.
* `get_config(p_clave)` / `set_config(p_clave, p_valor, pin)`: Lectura y control global del Drop.
* `admin_actualizar_pedido_v2(p_id, p_nuevo_estado, pin)`: Actualiza estado y apenda al historial con fecha.
* `admin_actualizar_envio(p_id, p_guia, p_empresa, pin)`: Guarda guía y transportadora.
* `admin_actualizar_nota(p_id, p_nota, pin)`: Guarda anotaciones privadas.
* `admin_get_clientes(pin)`: Agregación de datos CRM de clientas.
* `admin_get_chat_leads(pin)`: Consulta administrativa de prospectos del chat.

### 4.3. Edge Functions y Notificaciones Automáticas
1. **`email-confirmacion-pedido`:**
   * Recibe la orden confirmada.
   * Envía email de lujo al cliente con detalle de compra, resumen de pago y botón directo a `rastreo.html`.
   * **Alerta al Administrador:** Envía inmediatamente una notificación por correo a **`hola@yossico.com`** con los datos de la clienta, enlace directo a su WhatsApp, detalle de prendas compradas y acceso al Panel Admin.
2. **`wompi-webhook`:**
   * Escucha eventos de Wompi, valida la firma criptográfica (`checksum`), actualiza el pedido a `Pagado` y dispara automáticamente la confirmación por correo.
3. **`register-subscriber`:**
   * Valida Cloudflare Turnstile en el backend y emite el código de bienvenida para el 10% de descuento.

---

## 5. Reglas de Mantenimiento para Futuros Desarrollos

> [!IMPORTANT]
> **Antes de proponer o crear una funcionalidad nueva, consulta siempre este documento.**
> 1. **No duplicar:** Gran parte de las necesidades logísticas, comerciales y analíticas ya están construidas en el Panel Admin o en la web.
> 2. **Identidad Visual:** YOSSICO es una marca de **lujo silencioso** (Cormorant Garamond + Montserrat, blanco, negro, grises neutros). Nunca uses emojis infantiles ni colores estridentes no corporativos.
> 3. **Actualización Obligatoria:** Cada vez que se agregue o modifique un flujo, página o tab en el Panel, este archivo (`MAPA_DEL_SISTEMA_YOSSICO.md`) debe ser actualizado en el mismo commit.
