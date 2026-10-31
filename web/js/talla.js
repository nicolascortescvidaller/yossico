/* ═══════════════════════════════════════════════
   YOSSICO — Recomendador de talla
   Uso: YOSSICO_TALLA.montar(elemento, { onElegir: talla => {...} })

   La tabla de la web tiene medidas de la PRENDA (busto 105/111/117 cm,
   cadera 103/109/115, cintura elástica 66/71/76, largo pantalón 100/102/104).
   Los rangos de abajo son medidas del CUERPO estimadas a partir de esa
   tabla dejando holgura para un scrub. Ajústalos aquí si las pruebas de
   ajuste con clientas reales muestran otra cosa.
   ═══════════════════════════════════════════════ */
const YOSSICO_TALLA = (() => {
    const TALLAS = ['S', 'M', 'L'];

    /* Hasta cuántos cm (cuerpo) entra cada talla: [S, M, L] */
    const RANGOS = {
        busto:   [90, 97, 104],
        cintura: [72, 80, 88],
        cadera:  [98, 104, 110]
    };
    /* Sin medidas: peso ajustado por estatura → hasta cuánto entra cada talla */
    const RANGO_PESO = [57, 69, 81];
    const LARGO_PANTALON = { S: 100, M: 102, L: 104 };
    const STORE = 'yossico_mi_talla';

    const leer = () => { try { return JSON.parse(localStorage.getItem(STORE) || 'null'); } catch (_) { return null; } };
    const guardar = d => { try { localStorage.setItem(STORE, JSON.stringify(d)); } catch (_) {} };
    const num = v => { const n = parseFloat(String(v || '').replace(',', '.')); return isNaN(n) ? null : n; };

    /* Índice 0..2 = S..L; 3 = más grande que L */
    function indice(valor, limites) {
        const i = limites.findIndex(l => valor <= l);
        return i === -1 ? 3 : i;
    }

    function recomendar(d) {
        const ajuste = d.ajuste || 'normal';
        const medidas = ['busto', 'cintura', 'cadera'].filter(k => d[k]);
        let idx, base;

        if (medidas.length) {
            const extra = ajuste === 'holgado' ? 3 : ajuste === 'ajustado' ? -2 : 0;
            idx = Math.max(...medidas.map(k => indice(d[k] + extra, RANGOS[k])));
            base = 'medidas';
        } else if (d.peso) {
            const extra = ajuste === 'holgado' ? 5 : ajuste === 'ajustado' ? -3 : 0;
            const puntaje = d.peso + ((d.estatura || 160) - 160) * 0.3 + extra;
            idx = indice(puntaje, RANGO_PESO);
            base = 'peso';
        } else {
            return null;
        }

        const talla = TALLAS[Math.min(idx, 2)];
        const notas = [];
        if (idx > 2) {
            notas.push('Nuestra talla más grande es L y según tus datos podría quedarte justa. Escríbenos por WhatsApp y te asesoramos antes de comprar.');
        }
        if (d.estatura >= 172) {
            notas.push(`Con tu estatura, el pantalón talla ${talla} (${LARGO_PANTALON[talla]} cm de largo) podría quedarte un poco corto.`);
        } else if (d.estatura && d.estatura <= 152) {
            notas.push('Con tu estatura, quizá quieras ajustar el ruedo del pantalón.');
        }
        if (base === 'peso') {
            notas.push('Es una estimación con estatura y peso. Si agregas tu busto y cadera, la recomendación es más precisa.');
        }
        return { talla, notas, base };
    }

    const ESTILOS = `
        .yt [hidden] { display: none !important; }
        .yt { font-family: var(--font-body, Montserrat, sans-serif); color: var(--black, #111); background: var(--white, #fff); border: 1px solid var(--border, #c8c6c3); padding: 22px 20px; margin: 4px 0 18px; }
        .yt__title { font-family: var(--font-display, serif); font-size: 22px; font-weight: 400; margin: 0 0 4px; }
        .yt__sub { font-size: 12px; color: var(--gray, #4a4a4a); margin: 0 0 16px; line-height: 1.6; }
        .yt__row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; }
        .yt__row--3 { grid-template-columns: 1fr 1fr 1fr; }
        .yt label { display: block; font-size: 9px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--gray, #4a4a4a); margin-bottom: 5px; }
        .yt input { width: 100%; box-sizing: border-box; padding: 11px 10px; border: 1px solid var(--border, #c8c6c3); background: #fafaf9; font: inherit; font-size: 14px; }
        .yt input:focus { outline: none; border-color: var(--black, #111); background: #fff; }
        .yt__more { background: none; border: none; padding: 4px 0 10px; font: inherit; font-size: 12px; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; color: var(--black, #111); }
        .yt__fit { display: flex; gap: 6px; margin: 4px 0 16px; }
        .yt__fit button { flex: 1; padding: 10px 6px; border: 1px solid var(--border, #c8c6c3); background: none; font: inherit; font-size: 11px; letter-spacing: 1px; cursor: pointer; }
        .yt__fit button.is-on { background: var(--black, #111); color: #fff; border-color: var(--black, #111); }
        .yt__go { width: 100%; padding: 14px; background: var(--black, #111); color: #fff; border: none; font: inherit; font-size: 11px; letter-spacing: 2.5px; text-transform: uppercase; cursor: pointer; }
        .yt__res { margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border, #c8c6c3); }
        .yt__res .yt__res-size { font-family: var(--font-display, serif); font-size: 30px; margin: 0 0 6px; }
        .yt__res-size strong { font-weight: 500; }
        .yt__res p { font-size: 12px; line-height: 1.6; margin: 0 0 8px; color: var(--gray, #4a4a4a); }
        .yt__res .yt__check { color: var(--black, #111); }
        .yt__use { margin-top: 6px; padding: 12px 18px; background: none; border: 1px solid var(--black, #111); font: inherit; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; cursor: pointer; }
        .yt__use:hover { background: var(--black, #111); color: #fff; }
        .yt__err { font-size: 12px; color: #9b1c1c; margin: 8px 0 0; }
    `;

    function montar(host, opts = {}) {
        if (!host) return;
        if (!document.getElementById('yt-estilos')) {
            const st = document.createElement('style');
            st.id = 'yt-estilos';
            st.textContent = ESTILOS;
            document.head.appendChild(st);
        }
        const prev = leer() || {};
        host.innerHTML = `
            <div class="yt">
                <p class="yt__title">Encuentra tu talla</p>
                <p class="yt__sub">Cuéntanos un poco de ti y te recomendamos una talla. Luego confírmala con la tabla de medidas.</p>
                <div class="yt__row">
                    <div><label for="yt-estatura">Estatura (cm)</label><input id="yt-estatura" inputmode="decimal" placeholder="Ej. 162" value="${prev.estatura || ''}"></div>
                    <div><label for="yt-peso">Peso (kg)</label><input id="yt-peso" inputmode="decimal" placeholder="Ej. 60" value="${prev.peso || ''}"></div>
                </div>
                <button type="button" class="yt__more" id="yt-more">+ Conozco mis medidas (más preciso)</button>
                <div class="yt__row yt__row--3" id="yt-medidas" hidden>
                    <div><label for="yt-busto">Busto (cm)</label><input id="yt-busto" inputmode="decimal" placeholder="Ej. 92" value="${prev.busto || ''}"></div>
                    <div><label for="yt-cintura">Cintura (cm)</label><input id="yt-cintura" inputmode="decimal" placeholder="Ej. 74" value="${prev.cintura || ''}"></div>
                    <div><label for="yt-cadera">Cadera (cm)</label><input id="yt-cadera" inputmode="decimal" placeholder="Ej. 100" value="${prev.cadera || ''}"></div>
                </div>
                <label>¿Cómo te gusta que te quede?</label>
                <div class="yt__fit" id="yt-fit">
                    <button type="button" data-fit="ajustado">Ajustado</button>
                    <button type="button" data-fit="normal">Normal</button>
                    <button type="button" data-fit="holgado">Holgado</button>
                </div>
                <button type="button" class="yt__go" id="yt-go">Recomendar mi talla</button>
                <div class="yt__res" id="yt-res" hidden></div>
            </div>`;

        const $ = id => host.querySelector('#' + id);
        let ajuste = prev.ajuste || 'normal';
        const pintarFit = () => host.querySelectorAll('#yt-fit button').forEach(b => b.classList.toggle('is-on', b.dataset.fit === ajuste));
        pintarFit();
        host.querySelectorAll('#yt-fit button').forEach(b => b.addEventListener('click', () => { ajuste = b.dataset.fit; pintarFit(); }));
        if (prev.busto || prev.cintura || prev.cadera) $('yt-medidas').hidden = false;
        $('yt-more').addEventListener('click', () => { $('yt-medidas').hidden = !$('yt-medidas').hidden; });

        function calcular() {
            const d = {
                estatura: num($('yt-estatura').value), peso: num($('yt-peso').value),
                busto: num($('yt-busto').value), cintura: num($('yt-cintura').value), cadera: num($('yt-cadera').value),
                ajuste
            };
            const res = $('yt-res');
            const r = recomendar(d);
            res.hidden = false;
            if (!r) {
                res.innerHTML = '<p class="yt__err">Escribe al menos tu peso, o tus medidas de busto, cintura o cadera.</p>';
                return;
            }
            guardar({ ...d, talla: r.talla });
            res.innerHTML = `
                <p class="yt__res-size">Tu talla recomendada: <strong>${r.talla}</strong></p>
                ${r.notas.map(n => `<p>${n}</p>`).join('')}
                <p class="yt__check">Revisa la tabla de medidas de abajo para confirmar antes de comprar.</p>
                <button type="button" class="yt__use" id="yt-use">Elegir talla ${r.talla}</button>`;
            $('yt-use').addEventListener('click', () => opts.onElegir && opts.onElegir(r.talla));
            if (opts.onRecomendar) opts.onRecomendar(r.talla);
        }
        $('yt-go').addEventListener('click', calcular);
        host.querySelectorAll('input').forEach(i => i.addEventListener('keydown', e => { if (e.key === 'Enter') calcular(); }));
    }

    return { montar, recomendar, guardada: () => (leer() || {}).talla || null };
})();
