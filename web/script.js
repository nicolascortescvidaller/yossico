/**
 * YOSSICO — Shared JavaScript
 * Cursor, scroll reveal, nav blur, ticker, stagger animations
 */

/* ── Custom Cursor ─────────────────────────────────────────── */
const cursorDot = document.getElementById('cursor-dot');
const cursorRing = document.getElementById('cursor-ring');

let mouseX = 0, mouseY = 0;
let ringX = 0, ringY = 0;
let animId = null;

function lerp(a, b, t) { return a + (b - a) * t; }

function animateCursor() {
  ringX = lerp(ringX, mouseX, 0.12);
  ringY = lerp(ringY, mouseY, 0.12);

  if (cursorDot) {
    cursorDot.style.left = mouseX + 'px';
    cursorDot.style.top = mouseY + 'px';
  }
  if (cursorRing) {
    cursorRing.style.left = ringX + 'px';
    cursorRing.style.top = ringY + 'px';
  }

  animId = requestAnimationFrame(animateCursor);
}

document.addEventListener('mousemove', e => {
  mouseX = e.clientX;
  mouseY = e.clientY;
});

document.addEventListener('mouseenter', () => {
  if (!animId) animId = requestAnimationFrame(animateCursor);
});

document.addEventListener('mouseleave', () => {
  if (animId) { cancelAnimationFrame(animId); animId = null; }
});

// Hover state
document.querySelectorAll('a, button, .product-card, [data-hover]').forEach(el => {
  el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
  el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
});

/* ── Nav Scroll Blur ───────────────────────────────────────── */
const nav = document.querySelector('.nav');

function onScroll() {
  if (!nav) return;
  if (window.scrollY > 40) {
    nav.classList.add('scrolled');
  } else {
    nav.classList.remove('scrolled');
  }
}

window.addEventListener('scroll', onScroll, { passive: true });
onScroll(); // run once on load

/* ── Scroll Reveal (Intersection Observer) ─────────────────── */
const revealEls = document.querySelectorAll('.reveal');

const revealObserver = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
);

revealEls.forEach(el => revealObserver.observe(el));

/* ── Hero Vertical Line Growth ─────────────────────────────── */
const heroLine = document.getElementById('hero-line');

if (heroLine) {
  heroLine.style.height = '0';
  heroLine.style.transition = 'height 1.4s cubic-bezier(0.22, 0.61, 0.36, 1)';
  setTimeout(() => {
    heroLine.style.height = '100%';
  }, 400);
}

/* ── Acronym Section ───────────────────────────────────────── */
const acronymItems = document.querySelectorAll('.acronym__item');

if (acronymItems.length) {
  const acronymObserver = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          acronymItems.forEach((item, i) => {
            setTimeout(() => {
              item.classList.add('is-visible');
            }, i * 100);
          });
          acronymObserver.disconnect();
        }
      });
    },
    { threshold: 0.2 }
  );
  acronymObserver.observe(document.querySelector('.historia__left'));
}

/* ── Active Nav Link ───────────────────────────────────────── */
const currentPath = window.location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav__links a').forEach(link => {
  const href = link.getAttribute('href');
  if (href === currentPath || (currentPath === '' && href === 'index.html')) {
    link.classList.add('active');
  }
});

/* ── Size Button Selection ──────────────────────────────────── */
document.addEventListener('click', e => {
  /* Card size buttons */
  const sizeBtn = e.target.closest('.size-btn');
  if (sizeBtn) {
    const selector = sizeBtn.closest('.size-selector');
    if (selector) {
      selector.querySelectorAll('.size-btn').forEach(b => b.classList.remove('selected'));
      sizeBtn.classList.add('selected');
    }
    return;
  }

  /* Modal size buttons */
  const modalSizeBtn = e.target.closest('.modal__size-btn');
  if (modalSizeBtn) {
    const modalSizes = modalSizeBtn.closest('.modal__sizes');
    if (modalSizes) {
      modalSizes.querySelectorAll('.modal__size-btn').forEach(b => b.classList.remove('selected'));
      modalSizeBtn.classList.add('selected');
    }
    return;
  }
});

/* ── Init ──────────────────────────────────────────────────── */
animId = requestAnimationFrame(animateCursor);

/* ── Mobile Hamburger Menu ─────────────────────────────────── */
(function initMobileNav() {
  const navEl = document.querySelector('.nav');
  if (!navEl) return;

  /* Build hamburger button */
  const burger = document.createElement('button');
  burger.className = 'nav__hamburger';
  burger.setAttribute('aria-label', 'Menú');
  burger.innerHTML = '<span></span><span></span><span></span>';
  navEl.appendChild(burger);

  /* Build mobile slide-in menu */
  const mobileMenu = document.createElement('nav');
  mobileMenu.className = 'nav__mobile-menu';
  mobileMenu.innerHTML = `
    <a href="coleccion.html">Colección</a>
    <a href="acronimo.html">El Acrónimo</a>
    <a href="historia.html">Historia</a>
    <a href="nosotros.html">Nosotros</a>
    <a href="contacto.html">Contacto</a>
    <a href="coleccion.html" class="nav__mobile-cta">Ver Colección</a>
  `;
  document.body.appendChild(mobileMenu);

  /* Toggle */
  burger.addEventListener('click', () => {
    const isOpen = burger.classList.toggle('open');
    mobileMenu.classList.toggle('open', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  /* Close on link click */
  mobileMenu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      burger.classList.remove('open');
      mobileMenu.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  /* Close on outside tap */
  document.addEventListener('click', e => {
    if (mobileMenu.classList.contains('open') &&
        !mobileMenu.contains(e.target) &&
        !burger.contains(e.target)) {
      burger.classList.remove('open');
      mobileMenu.classList.remove('open');
      document.body.style.overflow = '';
    }
  });
})();
