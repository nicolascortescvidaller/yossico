/**
 * YOSSICO — Shared JavaScript
 * Cursor, scroll reveal, nav blur, ticker, stagger animations
 */

/* ── Custom Cursor ─────────────────────────────────────────── */
const cursorDot  = document.getElementById('cursor-dot');
const cursorRing = document.getElementById('cursor-ring');

let mouseX = 0, mouseY = 0;
let ringX  = 0, ringY  = 0;
let animId = null;

function lerp(a, b, t) { return a + (b - a) * t; }

function animateCursor() {
  ringX = lerp(ringX, mouseX, 0.12);
  ringY = lerp(ringY, mouseY, 0.12);

  if (cursorDot) {
    cursorDot.style.left  = mouseX + 'px';
    cursorDot.style.top   = mouseY + 'px';
  }
  if (cursorRing) {
    cursorRing.style.left = ringX + 'px';
    cursorRing.style.top  = ringY + 'px';
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

/* ── Init ──────────────────────────────────────────────────── */
animId = requestAnimationFrame(animateCursor);
