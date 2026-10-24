/* ============================================================
   v2.335.0 · Menú (peticiones de Eric, 20/10/2026)
   - «Usuarios» fuera del menú (está en Configuración → Equipo → Usuarios): en el menú de escritorio y en «Más» del móvil.
   - Móvil: «Personalizar menú» en «Más» (movPersonalizar): qué pantallas van en la barra de abajo (hasta 4; preferencias.menu.barra)
     y cuáles salen en «Más» (las mismas que se ocultan en el menú de escritorio: preferencias.menu.ocultos). Lo oculto no sale en «Más».
   ============================================================ */
const MOV_BARRA_DEF = ['inicio', 'agenda', 'rutas', 'directorio'];
const MENU_FUERA = ['usuarios'];
function movNombre(t) {
  const b = document.querySelector(`nav.main [data-t="${t}"]`); if (!b) return t;
  const x = txTexto(b); return ((x && x.get()) || b.textContent).replace('Pronto', '').trim();
}
function movDisponibles() {
  const vistos = new Set();
  return [...document.querySelectorAll('nav.main [data-t]')].filter(x => {
    const t = x.dataset.t;
    if (vistos.has(t) || x.classList.contains('hide') || x.disabled || x.classList.contains('bloq') || x.classList.contains('mlplan') || MENU_FUERA.includes(t)) return false;
    vistos.add(t); return true;
  }).map(x => x.dataset.t).sort((x, y) => movOrden(x) - movOrden(y));
}
function movOrden(t) {   // como el menú del ordenador: Tu día, Cartera, Ventas…
  let l = []; try { l = menuGrupos().flatMap(g => g.items); } catch (e) {}
  const i = l.indexOf(t); return i < 0 ? 999 : i;
}
function movBarra() {
  const disp = movDisponibles(), p = menuPrefs().barra;
  let l = (Array.isArray(p) && p.length ? p : MOV_BARRA_DEF).filter(t => disp.includes(t) && t !== 'inicio');
  if (disp.includes('inicio')) l.unshift('inicio');   // v2.337.0: Inicio siempre el primero
  l = l.slice(0, 4);
  if (!l.length) l = MOV_BARRA_DEF.filter(t => disp.includes(t));
  return l;
}
pintarBnav = (orig => function (...a) {
  if (ES_MEDICO()) return orig.apply(this, a);
  const b = $('bnav'); if (!b) return orig.apply(this, a);
  const barra = movBarra();
  b.dataset.n = String(barra.length + 1);
  b.innerHTML = barra.map(t => `<button data-t="${t}" aria-selected="${TAB === t}"><span>${ICO_MOD[t] || '•'}</span>${esc(movNombre(t))}</button>`).join('')
    + `<button id="bmasbtn" aria-selected="${!barra.includes(TAB)}"><span>⋯</span>Más</button>`;
  b.querySelectorAll('[data-t]').forEach(x => x.onclick = () => ir(x.dataset.t));
  $('bmasbtn').onclick = abrirMasMovil;
})(pintarBnav);
abrirMasMovil = (orig => function (...a) {
  const r = orig.apply(this, a);
  const s = $('bmas'), g = s && s.querySelector('.bmasgrid'); if (!g) return r;
  const barra = movBarra(), ocultos = menuPrefs().ocultos || [];
  const quiero = movMasOrden(movDisponibles().filter(t => !barra.includes(t) && !ocultos.includes(t)));
  const cerrar = () => { s.classList.remove('abierto'); setTimeout(() => s.classList.add('hide'), 180); };
  g.querySelectorAll('[data-bm]').forEach(x => { if (!quiero.includes(x.dataset.bm)) x.remove(); });
  quiero.forEach(t => {
    if (g.querySelector(`[data-bm="${t}"]`)) return;
    g.insertAdjacentHTML('beforeend', `<button data-bm="${t}" class="${tabDelMenu() === t ? 'on' : ''}"><span>${ICO_MOD[t] || '•'}</span>${esc(movNombre(t))}</button>`);
    g.querySelector(`[data-bm="${t}"]`).onclick = () => { cerrar(); ir(t); };
  });
  quiero.forEach(t => { const x = g.querySelector(`[data-bm="${t}"]`); if (x) g.appendChild(x); });   // en el orden elegido
  if (!s.querySelector('#bmaspers')) {
    g.insertAdjacentHTML('afterend', '<div class="acts bmaspers"><button type="button" class="btn sec chico" id="bmaspers">Personalizar menú</button></div>');
    $('bmaspers').onclick = () => { cerrar(); movPersonalizar(); };
  }
  return r;
})(abrirMasMovil);

function movPersonalizar() {
  // v2.337.0 (Eric): agrupadas: primero la barra de abajo, después «Más» y al final las ocultas. Al cambiar una de grupo va directa a su
  // grupo (al final; a la barra, si está llena, la última pasa a ser la primera de «Más»). Se ordenan arrastrando (dedo o ratón, por el
  // asa ⠿; se puede soltar también en otro grupo) o con las flechas, dentro de su grupo. Inicio, siempre la primera de la barra.
  const disp = movDisponibles(), p = menuPrefs(), FIJA = disp.includes('inicio') ? 'inicio' : null;
  const barra0 = movBarra().filter(t => t !== FIJA), resto = movMasOrden(disp.filter(t => !barra0.includes(t) && t !== FIJA));
  const G = { barra: [...barra0], mas: resto.filter(t => !(p.ocultos || []).includes(t)), oculta: resto.filter(t => (p.ocultos || []).includes(t)) };
  const MAXB = FIJA ? 3 : 4;
  const GRUPOS = [['barra', 'Barra de abajo', 'Hasta 4'], ['mas', 'En «Más»', ''], ['oculta', 'Ocultas', 'Tampoco salen en el menú del ordenador']];
  const ZONAS = [['barra', 'Barra'], ['mas', 'Más'], ['oculta', 'Oculta']];
  const ajustar = () => { while (G.barra.length > MAXB) G.mas.unshift(G.barra.pop()); };
  const fila = (t, z, i, n) => `<div class="movp movp-${z}" data-mpt="${t}">
      <span class="movpdrag" data-mpd="${t}" aria-hidden="true" title="Arrastrar">⠿</span>
      <span class="movpmv"><button type="button" class="kmv" data-mpm="-1|${t}" aria-label="Subir" ${i === 0 ? 'disabled' : ''}>↑</button><button type="button" class="kmv" data-mpm="1|${t}" aria-label="Bajar" ${i === n - 1 ? 'disabled' : ''}>↓</button></span>
      <span class="movpico">${ICO_MOD[t] || '•'}</span><span class="movpn">${esc(movNombre(t))}</span>
      <div class="segs" role="group" aria-label="Dónde va">${ZONAS.map(([k, x]) => `<button type="button" data-mpz="${k}|${t}" class="${z === k ? 'on' : ''}">${x}</button>`).join('')}</div></div>`;
  const pinta = () => {
    $('dlg2body').innerHTML = `<div class="fh"><div><h2>Personalizar menú</h2></div><button class="x" data-cerrar2 aria-label="Cerrar">✕</button></div>
      <p class="sm">Arrastra por ⠿ (o usa las flechas) para cambiar el orden. Si pasas una pantalla a otro grupo, se coloca sola al final de ese grupo.</p>
      ${GRUPOS.map(([z, n, x]) => `<div class="movpg"><h3>${n} <span class="sm">· ${G[z].length + (z === 'barra' && FIJA ? 1 : 0)}${x ? ' · ' + x : ''}</span></h3>
        ${z === 'barra' && FIJA ? `<div class="movp movp-barra movpfijo"><span class="movpico">${ICO_MOD[FIJA] || '•'}</span><span class="movpn">${esc(movNombre(FIJA))}</span><span class="sm">Siempre la primera</span></div>` : ''}
        <div class="movpl" data-mpg="${z}">${G[z].map((t, i) => fila(t, z, i, G[z].length)).join('') || '<div class="movpvac sm">Suelta aquí una pantalla</div>'}</div></div>`).join('')}
      <div class="acts"><button type="button" class="btn sec" id="movpdef">Restablecer</button><button type="button" class="btn" id="movpok">Guardar</button></div>`;
  };
  pinta();
  const d = $('dlg2'), cuerpo = $('dlg2body');
  const grupoDe = t => Object.keys(G).find(z => G[z].includes(t));
  const clic = async e => {
    const mv = e.target.closest('[data-mpm]'), zn = e.target.closest('[data-mpz]');
    if (mv) {
      const [dir, t] = mv.dataset.mpm.split('|'), l = G[grupoDe(t)], i = l.indexOf(t), j = i + +dir;
      if (j < 0 || j >= l.length) return;
      [l[i], l[j]] = [l[j], l[i]]; pinta(); return;
    }
    if (zn) {
      const [z, t] = zn.dataset.mpz.split('|'), de = grupoDe(t);
      if (z === de) return;
      if (de === 'barra' && !FIJA && G.barra.length <= 1) { toast('La barra de abajo necesita al menos una pantalla', true); return; }
      G[de] = G[de].filter(x => x !== t);
      if (z === 'barra' && G.barra.length >= MAXB) G.mas.unshift(G.barra.pop());
      G[z].push(t); pinta(); return;
    }
    if (e.target.closest('#movpdef')) {
      G.barra = MOV_BARRA_DEF.filter(t => disp.includes(t) && t !== FIJA); G.mas = disp.filter(t => !G.barra.includes(t) && t !== FIJA); G.oculta = []; pinta(); return;
    }
    const ok = e.target.closest('#movpok'); if (!ok) return;
    const ocultos = [...new Set([...(p.ocultos || []).filter(t => !disp.includes(t)), ...G.oculta])];
    const barra = FIJA ? [FIJA, ...G.barra] : [...G.barra];
    const prefs = Object.assign({}, PERFIL.preferencias || {}, { menu: Object.assign({}, menuPrefs(), { barra, mas: [...G.mas, ...G.oculta], ocultos }) });
    ok.disabled = true;
    const { data, error } = await db.rpc('guardar_preferencias', { p: prefs });
    ok.disabled = false;
    if (error) { toast('No se ha podido guardar el menú', true); return; }
    PERFIL.preferencias = data || prefs;
    d.close();
    pintarBnav(); MENU_FIRMA = ''; try { montarMenuLateral(); } catch (er) {}
    toast('Menú guardado');
  };
  // Arrastrar con el dedo o el ratón (eventos de puntero: el arrastrar del navegador no funciona con el dedo)
  let arr = null;
  const abajo = e => {
    const h = e.target.closest('[data-mpd]'); if (!h) return;
    const row = h.closest('.movp'); e.preventDefault();
    const r = row.getBoundingClientRect();
    arr = { row, dy: e.clientY - r.top, id: e.pointerId, h };
    arr.hueco = document.createElement('div'); arr.hueco.className = 'movphueco'; arr.hueco.style.height = r.height + 'px';
    row.before(arr.hueco);
    row.classList.add('movparr'); row.style.width = r.width + 'px'; row.style.top = r.top + 'px'; row.style.left = r.left + 'px';
    try { h.setPointerCapture(e.pointerId); } catch (er) {}
  };
  const mueve = e => {
    if (!arr || e.pointerId !== arr.id) return;
    arr.row.style.top = (e.clientY - arr.dy) + 'px';
    const filas = [...cuerpo.querySelectorAll('.movpl > .movp:not(.movparr), .movpl > .movpvac')];
    const destino = filas.find(f => { const r = f.getBoundingClientRect(); return e.clientY < r.top + r.height / 2; });
    if (destino) destino.before(arr.hueco);
    else { const ls = cuerpo.querySelectorAll('.movpl'); ls[ls.length - 1].appendChild(arr.hueco); }
    const sc = d.getBoundingClientRect(); if (e.clientY < sc.top + 60) d.scrollTop -= 12; else if (e.clientY > sc.bottom - 60) d.scrollTop += 12;
  };
  const suelta = e => {
    if (!arr || e.pointerId !== arr.id) return;
    const { row, hueco } = arr; arr = null;
    hueco.replaceWith(row); row.classList.remove('movparr'); row.style.width = row.style.top = row.style.left = '';
    const t = row.dataset.mpt;
    cuerpo.querySelectorAll('.movpl').forEach(l => { G[l.dataset.mpg] = [...l.querySelectorAll(':scope > .movp')].map(x => x.dataset.mpt); });
    if (!FIJA && !G.barra.length) { Object.keys(G).forEach(z => { G[z] = G[z].filter(x => x !== t); }); G.barra = [t]; toast('La barra de abajo necesita al menos una pantalla', true); }
    ajustar(); pinta();
  };
  const evs = [['click', clic], ['pointerdown', abajo], ['pointermove', mueve], ['pointerup', suelta], ['pointercancel', suelta]];
  evs.forEach(([n, f]) => cuerpo.addEventListener(n, f));
  d.addEventListener('close', () => evs.forEach(([n, f]) => cuerpo.removeEventListener(n, f)), { once: true });
  d.showModal();
}
// Orden de «Más»: el que eligió la persona y, detrás, lo nuevo en el orden del menú
function movMasOrden(l) {
  const o = menuPrefs().mas || [];
  return [...l].sort((x, y) => { const a = o.indexOf(x), b = o.indexOf(y); return (a < 0 ? 900 + movOrden(x) : a) - (b < 0 ? 900 + movOrden(y) : b); });
}


