/**
 * YOSSICO — Authentication Module
 * Requires: @supabase/supabase-js@2 loaded via CDN before this script
 * Exposes: window.YOSSICO_AUTH
 */
(function () {
    'use strict';

    const SUPABASE_URL = 'https://mgzevtcipwfpqgolmpwm.supabase.co';
    const SUPABASE_ANON_KEY = 'sb_publishable_1bxubqO9tCMdrCTuWj9CKA_irvrSa19';

    /* ── Supabase Client ─────────────────────────────────────── */
    let _sb = null;
    function getSb() {
        if (!_sb) {
            _sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
                auth: { persistSession: true, storageKey: 'yossico-auth' }
            });
        }
        return _sb;
    }

    /* ── Auth API ────────────────────────────────────────────── */
    async function getUser() {
        const { data: { user } } = await getSb().auth.getUser();
        return user;
    }

    async function signIn(email, password) {
        return getSb().auth.signInWithPassword({ email, password });
    }

    async function signUp(email, password) {
        return getSb().auth.signUp({ email, password });
    }

    async function signOut() {
        await getSb().auth.signOut();
        window.location.href = 'login.html';
    }

    async function resetPassword(email) {
        return getSb().auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/login.html`
        });
    }

    /* ── Profile API ─────────────────────────────────────────── */
    async function getProfile(userId) {
        return getSb()
            .from('user_profiles')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();
    }

    async function upsertProfile(userId, data) {
        return getSb()
            .from('user_profiles')
            .upsert({ user_id: userId, updated_at: new Date().toISOString(), ...data })
            .eq('user_id', userId);
    }

    async function getDiscounts(email) {
        return getSb()
            .from('subscribers')
            .select('discount_code, used, created_at')
            .eq('email', email.toLowerCase())
            .order('created_at', { ascending: false });
    }

    /* ── Nav Injection ───────────────────────────────────────── */
    function injectUserNav() {
        const navLinks = document.querySelector('.nav__links');
        if (!navLinks) return;

        const li = document.createElement('li');
        li.className = 'nav__user';
        li.id = 'nav-user-item';
        li.innerHTML = `
      <button class="nav__user-btn" id="nav-user-btn" aria-label="Mi cuenta" aria-expanded="false">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      </button>
      <div class="nav__user-dropdown" id="nav-user-dropdown" aria-hidden="true">
        <div id="nav-user-menu"></div>
      </div>
    `;

        // Insert before cart (last li)
        const cartLi = navLinks.querySelector('li:last-child');
        navLinks.insertBefore(li, cartLi);

        const btn = document.getElementById('nav-user-btn');
        const dropdown = document.getElementById('nav-user-dropdown');

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const open = dropdown.classList.toggle('open');
            btn.setAttribute('aria-expanded', String(open));
            dropdown.setAttribute('aria-hidden', String(!open));
        });

        document.addEventListener('click', () => {
            dropdown.classList.remove('open');
            btn.setAttribute('aria-expanded', 'false');
            dropdown.setAttribute('aria-hidden', 'true');
        });
    }

    function updateNavState(user) {
        const menu = document.getElementById('nav-user-menu');
        if (!menu) return;

        if (user) {
            const emailShort = user.email.length > 22
                ? user.email.slice(0, 20) + '…'
                : user.email;
            menu.innerHTML = `
        <div class="nav__user-email">${emailShort}</div>
        <a href="perfil.html" class="nav__user-link">Mi Perfil</a>
        <button class="nav__user-link nav__user-logout" id="nav-logout-btn">Cerrar sesión</button>
      `;
            document.getElementById('nav-logout-btn')
                ?.addEventListener('click', signOut);
        } else {
            menu.innerHTML = `
        <a href="login.html"    class="nav__user-link">Iniciar sesión</a>
        <a href="registro.html" class="nav__user-link nav__user-link--cta">Registrarse</a>
      `;
        }
    }

    /* ── Page Guards ─────────────────────────────────────────── */
    /** Redirect to login.html if not authenticated */
    async function requireAuth() {
        const user = await getUser();
        if (!user) { window.location.replace('login.html'); return null; }
        return user;
    }

    /** Redirect to perfil.html if already authenticated */
    async function requireGuest() {
        const user = await getUser();
        if (user) { window.location.replace('perfil.html'); }
    }

    /* ── Init ────────────────────────────────────────────────── */
    document.addEventListener('DOMContentLoaded', async () => {
        injectUserNav();
        const user = await getUser();
        updateNavState(user);
    });

    /* ── Public API ──────────────────────────────────────────── */
    window.YOSSICO_AUTH = {
        getSb,
        getUser,
        signIn,
        signUp,
        signOut,
        resetPassword,
        getProfile,
        upsertProfile,
        getDiscounts,
        updateNavState,
        requireAuth,
        requireGuest,
    };
})();
