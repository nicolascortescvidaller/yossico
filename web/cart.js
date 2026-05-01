/* ═══════════════════════════════════════════════
   YOSSICO — Cart
   ─────────────────────────────────────────────── */

const CART_KEY = 'yossico_cart';
const WA_NUMBER = '573202562307';

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
                <img src="${escHtml(item.img)}" alt="${escHtml(item.name)}">
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
        if (!gallery) return;
        addToCart({
            name: gallery.dataset.name,
            size: sizeBtn?.textContent || '',
            price: parseCOP(gallery.dataset.price),
            img: gallery.dataset.imgs.split(',')[0].trim(),
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
        addToCart({
            name: name || '',
            size: sizeBtn?.textContent || '',
            price: parseCOP(price),
            img: img.replace(window.location.origin, '').replace(window.location.pathname.replace(/[^/]+$/, ''), ''),
            line: tag || ''
        });
        return;
    }
});

function parseCOP(str) {
    if (!str) return 0;
    return parseInt(str.replace(/[^0-9]/g, ''), 10) || 0;
}

/* ── Keyboard close ───────────────────────────── */
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeDrawer();
});

/* ── Init ─────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
    updateBadge();
});
