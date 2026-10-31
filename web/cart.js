/* ═══════════════════════════════════════════════
   YOSSICO — Cart
   ─────────────────────────────────────────────── */

const CART_KEY = 'yossico_cart';
const WA_NUMBER = '573127300661';

/* ── Store ────────────────────────────────────── */
const Cart = {
    get items() {
        try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
        catch { return []; }
    },
    save(items) { localStorage.setItem(CART_KEY, JSON.stringify(items)); },

    add(product) {
        const items = this.items;
        const key = product.name + '|' + product.size;
        const idx = items.findIndex(i => i.key === key);
        if (idx > -1) {
            items[idx].qty += 1;
        } else {
            items.push({ key, ...product, qty: 1 });
        }
        this.save(items);
    },

    remove(key) {
        this.save(this.items.filter(i => i.key !== key));
    },

    setQty(key, qty) {
        if (qty < 1) { this.remove(key); return; }
        const items = this.items;
        const idx = items.findIndex(i => i.key === key);
        if (idx > -1) { items[idx].qty = qty; this.save(items); }
    },

    get total() {
        return this.items.reduce((sum, i) => sum + i.price * i.qty, 0);
    },

    get count() {
        return this.items.reduce((sum, i) => sum + i.qty, 0);
    },

    formatPrice(n) {
        return '$' + Math.round(n).toLocaleString('es-CO') + ' COP';
    },

    buildWAMessage() {
        const items = this.items;
        if (!items.length) return '';
        let msg = 'Hola, quiero hacer el siguiente pedido YOSSICO:%0A%0A';
        items.forEach(i => {
            msg += `▸ ${i.name} (Talla: ${i.size}) × ${i.qty} — ${this.formatPrice(i.price * i.qty)}%0A`;
        });
        msg += `%0A*Total: ${this.formatPrice(this.total)}*%0A%0A¡Gracias!`;
        return `https://wa.me/${WA_NUMBER}?text=${msg}`;
    }
};

/* ── Badge ────────────────────────────────────── */
function updateBadge() {
    document.querySelectorAll('.cart-badge').forEach(b => {
        const n = Cart.count;
        b.textContent = n;
        b.style.display = n > 0 ? 'flex' : 'none';
    });
}

/* ── Render drawer body ───────────────────────── */
function renderCart() {
    const body = document.getElementById('cart-body');
    const footer = document.getElementById('cart-footer');
    const items = Cart.items;

    if (!body) return;

    if (!items.length) {
        body.innerHTML = `
            <div class="cart-empty">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round">
                    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                </svg>
                <p>Tu carrito está vacío</p>
                <span>Explora la colección y agrega tus uniformes</span>
            </div>`;
        if (footer) footer.style.display = 'none';
        return;
    }

    if (footer) footer.style.display = 'flex';

    body.innerHTML = items.map(item => `
        <div class="cart-item" data-key="${escHtml(item.key)}">
            <div class="cart-item__img">
                <img src="${escHtml(normalizeCartImg(item.img) || CART_IMG_PLACEHOLDER)}" alt="${escHtml(item.name)}" data-name="${escHtml(item.name)}" data-key="${escHtml(item.key)}" decoding="async" onerror="cartImgFallback(this)">
            </div>
            <div class="cart-item__info">
                <span class="cart-item__name">${escHtml(item.name)}</span>
                <span class="cart-item__size">Talla ${escHtml(item.size)}</span>
                <span class="cart-item__price">${Cart.formatPrice(item.price)}</span>
                <div class="cart-item__controls">
                    <button class="cart-qty-btn" data-action="dec" data-key="${escHtml(item.key)}">−</button>
                    <span class="cart-qty-num">${item.qty}</span>
                    <button class="cart-qty-btn" data-action="inc" data-key="${escHtml(item.key)}">+</button>
                </div>
            </div>
            <button class="cart-item__remove" data-key="${escHtml(item.key)}" aria-label="Eliminar">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
        </div>`).join('');

    /* Total */
    const tp = document.getElementById('cart-total-price');
    if (tp) tp.textContent = Cart.formatPrice(Cart.total);

    /* Checkout button → redirect to checkout page */
    const co = document.getElementById('cart-checkout');
    if (co) {
        co.removeAttribute('href');
        co.onclick = (e) => {
            e.preventDefault();
            if (!Cart.items.length) return;
            window.location.href = 'checkout.html';
        };
    }
}

/* ── Imágenes del carrito: rutas robustas + respaldo ─────────
   - Normaliza rutas relativas a absolutas desde la raíz (/img/...) para que
     funcionen desde cualquier URL (clean URLs, 404, subrutas).
   - Respeta data:/blob:/http(s) (fotos subidas desde el Studio).
   - Si una imagen falla (carrito antiguo con archivos renombrados), busca la
     foto actual del catálogo y, si no existe, muestra un placeholder de marca. */
const CART_IMG_PLACEHOLDER = 'data:image/svg+xml;utf8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 90"><rect width="72" height="90" fill="#e5e3e0"/>' +
    '<text x="36" y="55" text-anchor="middle" font-family="Georgia,serif" font-size="30" fill="#111" letter-spacing="2">Y</text></svg>'
);

function normalizeCartImg(src) {
    if (!src) return '';
    src = String(src).trim();
    if (!src) return '';
    if (/^(data:|blob:|https?:|\/\/)/i.test(src)) return src;
    return '/' + src.replace(/^(\.\/|\/)+/, '');
}

const CART_CATALOG_FALLBACK = {
    OSLO:   { def: 'oslo_black_front',  navy: 'oslo_navy_front', marino: 'oslo_navy_front', vino: 'oslo_burgundy_front', negro: 'oslo_black_front' },
    MILAN:  { def: 'milan_front' },
    KYOTO:  { def: 'kyoto_front' },
    LIMA:   { def: 'lima_black_front',  pac: 'lima_teal_front', teal: 'lima_teal_front', oliva: 'lima_olive_front', negro: 'lima_black_front' },
    BOGOTA: { def: 'bogota_navy_front' },
    MANTA:  { def: 'manta_navy_1',      vino: 'manta_vino_1', negro: 'manta_black_1', azul: 'manta_navy_1', marino: 'manta_navy_1' },
    HOODIE: { def: 'capa-hoodie',       azul: 'capa-hoodie-azul' }
};

function lookupCatalogImg(name) {
    const raw = String(name || '');
    const base = raw.split('(')[0].trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const color = (raw.match(/\(([^)]+)\)/) || [])[1] || '';
    const col = color.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const key = Object.keys(CART_CATALOG_FALLBACK).find(k => base.startsWith(k));
    if (!key) return '';
    const map = CART_CATALOG_FALLBACK[key];
    const hit = Object.keys(map).find(k => k !== 'def' && col.includes(k));
    return '/img/' + map[hit || 'def'] + '.webp';
}

function cartImgFallback(el) {
    if (!el || el.dataset.fb === 'done') return;
    if (!el.dataset.fb) {
        el.dataset.fb = '1';
        const alt = lookupCatalogImg(el.dataset.name);
        if (alt && alt !== el.getAttribute('src')) {
            el.src = alt;
            /* Reparar el carrito guardado para que no vuelva a fallar */
            try {
                const items = Cart.items;
                const it = items.find(i => i.key === el.dataset.key);
                if (it) { it.img = alt; Cart.save(items); }
            } catch (_) {}
            return;
        }
    }
    el.dataset.fb = 'done';
    el.onerror = null;
    el.src = CART_IMG_PLACEHOLDER;
}

function escHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* ── Drawer open / close ──────────────────────── */
function openDrawer() {
    document.getElementById('cart-drawer')?.classList.add('open');
    document.getElementById('cart-overlay')?.classList.add('open');
    document.body.style.overflow = 'hidden';
    renderCart();
}
function closeDrawer() {
    document.getElementById('cart-drawer')?.classList.remove('open');
    document.getElementById('cart-overlay')?.classList.remove('open');
    document.body.style.overflow = '';
}

/* ── Add to cart (shared helper) ─────────────── */
function addToCart({ name, size, price, img, line }) {
    if (!YOSSICO_TIENDA.abierta()) { YOSSICO_TIENDA.avisar(); return false; }
    if (!size) { shakeNoSize(); return false; }
    Cart.add({ name, size, price, img, line });
    updateBadge();
    openDrawer();
    return true;
}

function shakeNoSize() {
    /* Visual cue: briefly shake size selector near trigger */
    document.querySelectorAll('.size-selector').forEach(s => {
        s.classList.add('shake');
        setTimeout(() => s.classList.remove('shake'), 500);
    });
}

/* ── Event delegation ─────────────────────────── */
document.addEventListener('click', e => {
    /* Cart icon → open */
    if (e.target.closest('.cart-icon-btn')) { openDrawer(); return; }

    /* Close button */
    if (e.target.closest('#cart-close')) { closeDrawer(); return; }

    /* Overlay */
    if (e.target.id === 'cart-overlay') { closeDrawer(); return; }

    /* Remove item */
    const removeBtn = e.target.closest('.cart-item__remove');
    if (removeBtn) {
        Cart.remove(removeBtn.dataset.key);
        updateBadge();
        renderCart();
        return;
    }

    /* Qty buttons */
    const qtyBtn = e.target.closest('.cart-qty-btn');
    if (qtyBtn) {
        const key = qtyBtn.dataset.key;
        const item = Cart.items.find(i => i.key === key);
        if (!item) return;
        const delta = qtyBtn.dataset.action === 'inc' ? 1 : -1;
        Cart.setQty(key, item.qty + delta);
        updateBadge();
        renderCart();
        return;
    }

    /* Add from card */
    const addCardBtn = e.target.closest('.add-to-cart-btn[data-context="card"]');
    if (addCardBtn) {
        const card = addCardBtn.closest('.product-card');
        const gallery = card?.querySelector('.gallery');
        const sizeBtn = card?.querySelector('.size-btn.selected');
        const colorBtn = card?.querySelector('.color-swatch.selected');
        const colorLabel = colorBtn ? ` (${colorBtn.dataset.label})` : '';
        if (!gallery) return;
        addToCart({
            name: gallery.dataset.name + colorLabel,
            size: sizeBtn?.textContent || '',
            price: parseCOP(gallery.dataset.price),
            img: cardCartImage(card, gallery, colorBtn),
            line: gallery.dataset.lineName
        });
        return;
    }

    /* Add from modal */
    const addModalBtn = e.target.closest('.add-to-cart-btn[data-context="modal"]');
    if (addModalBtn) {
        const sizeBtn = document.querySelector('#modal-sizes .modal__size-btn.selected');
        const name = document.getElementById('modal-name')?.textContent;
        const price = document.getElementById('modal-price')?.textContent;
        const tag = document.getElementById('modal-tag')?.textContent;
        /* Get first image from modal track */
        const img = document.querySelector('#modal-track .modal__slide img')?.src || '';
        const colorBtn = document.querySelector('#modal-colors .color-swatch.selected');
        const colorLabel = colorBtn ? ` (${colorBtn.dataset.label})` : '';
        addToCart({
            name: (name || '') + colorLabel,
            size: sizeBtn?.textContent || '',
            price: parseCOP(price),
            img: (img || '').replace(window.location.origin, ''),
            line: tag || ''
        });
        return;
    }
});

function parseCOP(str) {
    if (!str) return 0;
    return parseInt(str.replace(/[^0-9]/g, ''), 10) || 0;
}

/* Foto para el carrito desde una tarjeta: prioriza la del color elegido.
   No usa split(',') sobre data-imgs porque las fotos subidas desde el Studio
   son data-URLs que contienen comas. */
function cardCartImage(card, gallery, colorBtn) {
    const fromSwatch = colorBtn && (colorBtn.getAttribute('data-img-0') || colorBtn.getAttribute('data-img0'));
    if (fromSwatch) return fromSwatch;
    const slideImg = card && card.querySelector('.gallery__slide img');
    if (slideImg) {
        const s = slideImg.getAttribute('src') || '';
        if (s && !/^data:image\/svg\+xml/i.test(s)) return s;
        const ds = slideImg.getAttribute('data-src');
        if (ds) return ds;
    }
    const imgs = (gallery && gallery.dataset.imgs) || '';
    if (/^data:/i.test(imgs)) return imgs.replace(/,(?=data:)/g, '\n').split('\n')[0].trim();
    return imgs.split(',')[0].trim();
}

/* ── Estado de la tienda (pre-lanzamiento) ─────────────────
   Antes de la fecha de apertura (la fecha de la Cuenta Regresiva en el
   Editor Web) no se puede comprar: los botones de compra pasan a
   "Avísame cuando abra" y el checkout queda cerrado. La tienda se abre
   sola al llegar esa fecha, sin tocar nada.
   Para probar compras antes de abrir: ?tienda=abierta (se recuerda en
   ese navegador; ?tienda=auto lo devuelve al modo normal). */
const YOSSICO_TIENDA = (() => {
    const APERTURA_POR_DEFECTO = '2026-12-01T00:00';
    const SUPA = 'https://mgzevtcipwfpqgolmpwm.supabase.co';
    const SUPA_PUB = 'sb_publishable_1bxubqO9tCMdrCTuWj9CKA_irvrSa19';
    const CFG_KEY = 'yossico_landing_config';
    const PREVIEW_KEY = 'yossico_tienda_preview';

    try {
        const q = new URLSearchParams(location.search).get('tienda');
        if (q === 'abierta') localStorage.setItem(PREVIEW_KEY, 'abierta');
        if (q === 'auto') localStorage.removeItem(PREVIEW_KEY);
    } catch (_) {}

    const en = () => { try { return localStorage.getItem('yos_lang') === 'en'; } catch (_) { return false; } };

    function fechaApertura() {
        let raw = APERTURA_POR_DEFECTO;
        try {
            const cfg = JSON.parse(localStorage.getItem(CFG_KEY) || 'null');
            if (cfg && cfg.countdown && cfg.countdown.targetDate) raw = cfg.countdown.targetDate;
        } catch (_) {}
        const ts = new Date(raw).getTime();
        return isNaN(ts) ? new Date(APERTURA_POR_DEFECTO).getTime() : ts;
    }

    function abierta() {
        try { if (localStorage.getItem(PREVIEW_KEY) === 'abierta') return true; } catch (_) {}
        return Date.now() >= fechaApertura();
    }

    function fechaTexto() {
        return new Date(fechaApertura()).toLocaleDateString(en() ? 'en-US' : 'es-CO', { day: 'numeric', month: 'long' });
    }

    function avisar() {
        if (typeof openSubPopup === 'function') { openSubPopup(); return; }
        window.location.href = '/?avisar=1';
    }

    function setTexto(el, html) {
        if (el && el.innerHTML !== html) el.innerHTML = html;
    }

    function aplicar() {
        const cerrada = !abierta();
        document.body.classList.toggle('tienda-cerrada', cerrada);
        if (!cerrada) return;
        const t = en()
            ? { avisa: 'Notify me at launch', consulta: 'Ask on WhatsApp', ver: 'View details', col: 'View the collection' }
            : { avisa: 'Avísame cuando abra', consulta: 'Consultar por WhatsApp', ver: 'Ver detalles', col: 'Ver la colección' };

        document.querySelectorAll('.add-to-cart-btn').forEach(b => setTexto(b, t.avisa));
        const pd = document.getElementById('pd-add-cart');
        if (pd && !pd.querySelector('.tienda-label')) {
            const lbl = document.createElement('span');
            lbl.className = 'tienda-label';
            lbl.textContent = t.avisa;
            pd.appendChild(lbl);
        }
        setTexto(document.getElementById('pd-wa'), t.consulta);
        document.querySelectorAll('.product-card__cta').forEach(a => setTexto(a, `${t.consulta} <span class="arrow">→</span>`));
        document.querySelectorAll('.destacados__btn').forEach(a => setTexto(a, t.ver));
        document.querySelectorAll('.drops__main-cta').forEach(a => setTexto(a, `${t.col} <span class="arrow-icon">→</span>`));

        const co = document.getElementById('cart-checkout');
        if (co && !document.getElementById('cart-cerrada-nota')) {
            const nota = document.createElement('p');
            nota.id = 'cart-cerrada-nota';
            nota.className = 'tienda-nota';
            nota.textContent = en()
                ? `The store opens on ${fechaTexto()}. Your cart will be waiting for you.`
                : `La tienda abre el ${fechaTexto()}. Tu carrito te espera.`;
            co.parentNode.insertBefore(nota, co);
        }
    }

    /* Los botones de compra llevan a la lista de espera mientras esté cerrada */
    document.addEventListener('click', e => {
        if (abierta()) return;
        const btn = e.target.closest('.add-to-cart-btn, #pd-add-cart');
        if (!btn) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        avisar();
    }, true);

    const estilos = document.createElement('style');
    estilos.textContent = `
        body.tienda-cerrada #pd-add-cart { opacity: 1 !important; }
        body.tienda-cerrada #pd-add-cart > svg, body.tienda-cerrada #pd-add-text { display: none !important; }
        body.tienda-cerrada #cart-checkout { display: none !important; }
        .tienda-nota { font-size: 12px; line-height: 1.5; color: #4a4a4a; text-align: center; margin: 0 0 8px; }
        body:not(.tienda-cerrada) .tienda-nota, body:not(.tienda-cerrada) .tienda-label { display: none; }
    `;
    document.head.appendChild(estilos);

    /* Fecha publicada desde el Editor Web (la misma de la cuenta regresiva) */
    async function refrescar() {
        try {
            const res = await fetch(`${SUPA}/rest/v1/rpc/get_config`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', apikey: SUPA_PUB, Authorization: 'Bearer ' + SUPA_PUB },
                body: JSON.stringify({ p_clave: 'landing_config' })
            });
            if (!res.ok) return;
            const cfg = await res.json();
            if (cfg && typeof cfg === 'object' && Object.keys(cfg).length) {
                localStorage.setItem(CFG_KEY, JSON.stringify(cfg));
            }
        } catch (_) {}
        programarApertura();
        aplicar();
    }

    /* Abre la tienda en vivo si la página está abierta cuando llega la hora */
    let timer = null;
    function programarApertura() {
        clearTimeout(timer);
        const falta = fechaApertura() - Date.now();
        if (falta > 0 && falta < 2147483647) timer = setTimeout(() => location.reload(), falta + 1000);
    }

    document.addEventListener('DOMContentLoaded', () => {
        aplicar();
        programarApertura();
        refrescar();
        /* Re-aplica si otra parte de la página re-dibuja botones (Editor, stock, idioma) */
        let pendiente = false;
        new MutationObserver(() => {
            if (pendiente || abierta()) return;
            pendiente = true;
            requestAnimationFrame(() => { pendiente = false; aplicar(); });
        }).observe(document.body, { childList: true, subtree: true });
    });

    return { abierta, avisar, aplicar, fechaApertura, fechaTexto };
})();

/* ── Keyboard close ───────────────────────────── */
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeDrawer();
});

/* ── Init ─────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
    updateBadge();
});
