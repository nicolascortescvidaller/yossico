/**
 * YOSSICO — Stock en tiempo real
 * Lee la tabla `productos` de Supabase y actualiza la UI de coleccion.html
 * cuando el usuario selecciona color + talla.
 *
 * Requiere: @supabase/supabase-js@2 cargado antes de este script.
 * Expone: window.YOSSICO_STOCK
 */
(function () {
  'use strict';

  const SUPABASE_URL     = 'https://mgzevtcipwfpqgolmpwm.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_1bxubqO9tCMdrCTuWj9CKA_irvrSa19';

  /* ── Supabase client (reusa el de auth.js si ya existe) ──── */
  function getSb() {
    if (window.YOSSICO_AUTH) return window.YOSSICO_AUTH.getSb();
    return window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }

  /* ── Stock map: "NOMBRE|color|talla" → stock (int) ───────── */
  let stockMap = {};

  async function fetchStock() {
    try {
      const { data, error } = await getSb()
        .from('productos')
        .select('nombre, color, talla, stock');

      if (error) { console.warn('[stock] fetch error:', error.message); return; }

      stockMap = {};
      data.forEach(r => {
        stockMap[`${r.nombre}|${r.color}|${r.talla}`] = r.stock;
      });

      updateAllCards();
    } catch (e) {
      console.warn('[stock] fetch exception:', e);
    }
  }

  /* Devuelve el stock de una combinación, o null si no está en la tabla */
  function getStock(nombre, color, talla) {
    const key = `${nombre}|${color}|${talla}`;
    return key in stockMap ? stockMap[key] : null;
  }

  /* ── Actualiza un product-card o modal según color+talla actuales ── */
  function updateCardUI(card) {
    const gallery     = card.querySelector('[data-name]');
    if (!gallery) return;

    const nombre      = gallery.dataset.name;                       // "OSLO"
    const colorSwatch = card.querySelector('.color-swatch.selected');
    const sizeBtn     = card.querySelector('.size-btn.selected, .modal__size-btn.selected');

    const addBtn      = card.querySelector('.add-to-cart-btn');
    let   badge       = card.querySelector('.stock-badge');

    /* Ensure badge element exists */
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'stock-badge';
      if (addBtn) addBtn.insertAdjacentElement('beforebegin', badge);
    }

    if (!colorSwatch || !sizeBtn) {
      badge.textContent = '';
      return;
    }

    const color  = colorSwatch.dataset.color;
    const talla  = sizeBtn.textContent.trim();
    const stock  = getStock(nombre, color, talla);

    if (stock === null) {
      /* Producto no encontrado en tabla → no bloquear */
      badge.textContent = '';
      if (addBtn) { addBtn.disabled = false; addBtn.classList.remove('is-agotado'); }
      return;
    }

    if (stock <= 0) {
      badge.textContent = 'Agotado';
      badge.style.cssText = 'color:#c0392b;font-family:var(--font-body);font-size:9px;letter-spacing:2px;text-transform:uppercase;display:block;margin-bottom:6px;';
      if (addBtn) { addBtn.disabled = true; addBtn.classList.add('is-agotado'); }
    } else if (stock <= 3) {
      badge.textContent = `Solo ${stock} disponibles`;
      badge.style.cssText = 'color:#e67e22;font-family:var(--font-body);font-size:9px;letter-spacing:1px;display:block;margin-bottom:6px;';
      if (addBtn) { addBtn.disabled = false; addBtn.classList.remove('is-agotado'); }
    } else {
      badge.textContent = '';
      if (addBtn) { addBtn.disabled = false; addBtn.classList.remove('is-agotado'); }
    }
  }

  /* Actualiza todas las product-cards visibles */
  function updateAllCards() {
    document.querySelectorAll('.product-card').forEach(updateCardUI);
    /* También el modal si está abierto */
    const modal = document.querySelector('.modal-overlay.open .modal');
    if (modal) updateCardUI(modal);
  }

  /* ── Hook: escucha selección de color/talla en cualquier card ── */
  function attachListeners() {
    document.addEventListener('click', e => {
      const swatch  = e.target.closest('.color-swatch');
      const sizeBtn = e.target.closest('.size-btn, .modal__size-btn');

      if (swatch || sizeBtn) {
        /* Espera el tick para que .selected se actualice */
        setTimeout(() => {
          const card = (swatch || sizeBtn).closest('.product-card, .modal');
          if (card) updateCardUI(card);
        }, 50);
      }
    });
  }

  /* ── Init ─────────────────────────────────────────────────── */
  function init() {
    attachListeners();
    fetchStock();
    /* Refresco cada 90 segundos */
    setInterval(fetchStock, 90_000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* ── API pública ─────────────────────────────────────────── */
  window.YOSSICO_STOCK = { getStock, fetchStock };
})();
