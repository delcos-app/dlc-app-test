/* ============================================================
   v2.344.0 · Configuración más ordenada (lista de Eric, 21/10/2026)
   - Un apartado con partes (Rutas, Cartera y visitas, Stock y material, Importar datos, Clasificadores, Datos fiscales con Series) es
     una sola página: sus partes una debajo de otra, sin pestañas. Cada parte se pinta en su propia sección y funciona igual que antes:
     sus piezas con nombre fijo (#cfgcuerpo, #fcuerpo, el panel #dbody) se le devuelven al tocarla y las de las otras se guardan.
   - Mis datos en una sola tarjeta; Datos fiscales y Series juntos; los botones de KPIs de Inicio junto al título.
   ============================================================ */
const IDS_SEC = ['fcuerpo', 'dbody', 'v-admin'];
let CFG_SEC_ACT = null;
function cfgSecDormir(sec) {
  sec.querySelectorAll(IDS_SEC.map(i => '#' + i).join(',')).forEach(e => { e.dataset.idd = e.id; e.removeAttribute('id'); });
  const c = sec.querySelector(':scope > .cfgsecc'); if (c && c.id === 'cfgcuerpo') c.removeAttribute('id');
}
function cfgSecDespertar(sec) {
  if (!sec || CFG_SEC_ACT === sec) return;
  document.querySelectorAll('#cfgcuerpo-hub .cfgsec').forEach(o => { if (o !== sec) cfgSecDormir(o); });
  const viejo = $('cfgcuerpo'); if (viejo && !sec.contains(viejo)) viejo.removeAttribute('id');
  sec.querySelector(':scope > .cfgsecc').id = 'cfgcuerpo';
  sec.querySelectorAll('[data-idd]').forEach(e => { e.id = e.dataset.idd; delete e.dataset.idd; });
  // La ventana de siempre (#dbody) solo se aparta si la sección tiene su panel
  if (sec.__panel) { const m = document.querySelector('dialog #dbody'); if (m) m.id = 'dbody-modal'; PANEL_ACTIVO = sec.__panel; }
  else { const m = $('dbody-modal'); if (m && !document.querySelector('#dbody')) m.id = 'dbody'; PANEL_ACTIVO = null; }
  CFG_SEC_ACT = sec; CFG_KEY = sec.dataset.cfgsec;
}
const cfgEstable = (el, max) => new Promise(ok => {
  let t = 0, fin = 0; const ob = new MutationObserver(() => { clearTimeout(t); t = setTimeout(listo, 150); });
  const listo = () => { if (el.querySelector('.cfgcarga, .giro, .spin')) { t = setTimeout(listo, 150); return; } ob.disconnect(); clearTimeout(fin); ok(); };
  ob.observe(el, { childList: true, subtree: true, attributes: true }); t = setTimeout(listo, 200); fin = setTimeout(() => { ob.disconnect(); clearTimeout(t); ok(); }, max || 5000);
});
async function cfgApilar(it, foco) {
  const hub = $('cfgcuerpo-hub'); if (!hub) return;
  CFG_SEC_ACT = null;
  // Se preparan escondidas y la página aparece entera de una vez (sin fantasmas)
  hub.innerHTML = '<div class="cfgsecs" hidden>' + it.hijos.map(h => `<section class="cfgsec" data-cfgsec="${h.k}"><h3 class="cfgsectit">${esc(h.t)}</h3><div class="cfgsecc"></div></section>`).join('') + '</div><div class="cfgcarga cargandolocal"><span class="giro"></span> Cargando…</div>';
  hub.dataset.apilado = '1';
  for (const sec of hub.querySelectorAll('.cfgsec')) {
    if (!hub.isConnected) return;
    const h = it.hijos.find(x => x.k === sec.dataset.cfgsec);
    sec.__panel = null; PANEL_ACTIVO = null;
    const m = $('dbody-modal'); if (m && !document.querySelector('#dbody')) m.id = 'dbody';
    cfgSecDespertar(sec);
    try { await h.r(); } catch (e) {}
    await cfgEstable(sec, 4000);
    if (PANEL_ACTIVO && sec.querySelector('[data-panel]')) sec.__panel = PANEL_ACTIVO;
    try { if (typeof pulirCfg === 'function') pulirCfg(); } catch (e) {}
    // Sin título repetido: si la parte ya empieza con su título, fuera el de la sección
    if ([...sec.querySelectorAll('.cfgsecc h2')].some(x => x.offsetParent)) sec.querySelector('.cfgsectit').hidden = true;   // la parte ya trae su título
    CFG_SEC_ACT = null;
  }
  const caja = hub.querySelector('.cfgsecs'); if (caja) caja.hidden = false; const cg = hub.querySelector(':scope > .cfgcarga'); if (cg) cg.remove();
  const primera = (foco && hub.querySelector(`.cfgsec[data-cfgsec="${foco.k}"]`)) || hub.querySelector('.cfgsec');
  cfgSecDespertar(primera);
  if (foco && foco !== it.hijos[0] && primera) primera.scrollIntoView({ block: 'start', behavior: 'smooth' });
}
// Tocar una parte le devuelve sus piezas (en captura: antes de que su botón haga nada)
['pointerdown', 'focusin', 'keydown'].forEach(ev => document.addEventListener(ev, e => {
  const sec = e.target.closest && e.target.closest('#cfgcuerpo-hub .cfgsec'); if (sec) cfgSecDespertar(sec);
}, true));
// Al cambiar de apartado, la ventana de siempre vuelve a su sitio
cargarConfig = (orig => async function (...a) {
  const hub = $('cfgcuerpo-hub');
  if (hub && hub.dataset.apilado) {
    hub.querySelectorAll('[data-idd]').forEach(e => e.removeAttribute('data-idd'));
    const m = $('dbody-modal'); if (m) { const p = document.querySelector('#dbody[data-panel]'); if (p) p.removeAttribute('id'); m.id = 'dbody'; }
    PANEL_ACTIVO = null; CFG_SEC_ACT = null; delete hub.dataset.apilado;
  }
  return orig.apply(this, a);
})(cargarConfig);

// Datos fiscales y Series, juntos
arbolCfgUnico = (orig => function (...a) {
  const g = orig.apply(this, a), f = g.find(x => x[0] === 'Facturación'); if (!f) return g;
  const fi = f[1].find(x => x.k === 'o.fiscal'), se = f[1].find(x => x.k === 'o.series');
  if (fi && se && !fi.hijos) f[1] = f[1].filter(x => x !== se).map(x => x === fi ? Object.assign({}, fi, { d: 'Razón social, NIF, dirección y numeración de las facturas',
    hijos: [{ k: 'o.fiscal', t: fi.t, r: fi.r }, { k: 'o.series', t: se.t, r: se.r }] }) : x);
  return g;
})(arbolCfgUnico);

// Mis datos: una sola tarjeta (la persona, sus datos y la seguridad)
pintarPerfil = (orig => function (...a) {
  const r = orig.apply(this, a);
  if (TAB !== 'config') return r;
  const c = $('cfgcuerpo'); if (!c || c.querySelector('.perfuno')) return r;
  const mp = c.querySelector('#miperfil'), dt = [...c.children].find(x => x.querySelector && x.querySelector('#pfn')), sg = c.querySelector('.perfseg');
  if (!dt) return r;
  const u = document.createElement('div'); u.className = 'card cfgpanel perfuno';
  u.innerHTML = '<div class="perfunorow"></div>';
  const row = u.firstChild;
  [mp, dt].filter(Boolean).forEach(x => { x.classList.remove('card', 'cfgpanel'); x.classList.add('perfparte'); row.appendChild(x); });
  if (sg) { sg.classList.remove('card', 'cfgpanel'); sg.classList.add('perfparte'); u.appendChild(sg); }
  c.prepend(u);
  return r;
})(pintarPerfil);
// pintarPrefsPerfil pone la tarjeta de la persona después: va a su sitio dentro de la tarjeta única
pintarPrefsPerfil = (orig => async function (...a) {
  const p = orig.apply(this, a);
  const mp = $('miperfil'), row = document.querySelector('#cfgcuerpo .perfunorow');
  if (mp && row && mp.parentElement !== row) { mp.classList.remove('card', 'cfgpanel'); mp.classList.add('perfparte'); row.prepend(mp); }
  return p;
})(pintarPrefsPerfil);

// KPIs de Inicio: Restaurar y Guardar junto al título
new MutationObserver(() => {
  if (TAB !== 'config' || CFG_KEY !== 'inicio.kpis') return;
  const cab = document.querySelector('#v-config .cfucab'), c = $('cfgcuerpo'); if (!cab || !c) return;
  const acts = [...c.querySelectorAll('.acts')].filter(x => x.querySelector('.btn') && !x.classList.contains('cfuacts')).pop(); if (!acts) return;
  cab.querySelectorAll('.cfuacts').forEach(x => x.remove());
  acts.classList.add('cfuacts'); cab.appendChild(acts);
}).observe(document.body, { childList: true, subtree: true });
// v2.344.0: los estilos de Configuración hablan de #cfgcuerpo (el contenedor activo); se copian para las demás secciones de la página
function cfgClonarEstilos() {
  const re = /#cfgcuerpo(?![-\w])/g;
  const nuevo = sel => sel.split(',').filter(p => re.test(p) && !(re.lastIndex = 0)).map(p => p.replace(re, '#cfgcuerpo-hub .cfgsecc')).join(',');
  const recorrer = (lista, dentro) => {
    for (const r of [...lista]) {
      if (r.cssRules && (r.media || (typeof CSSLayerBlockRule !== 'undefined' && r instanceof CSSLayerBlockRule))) { recorrer(r.cssRules, r); continue; }   // v2.356.0: también dentro de las capas
      if (!r.selectorText || !r.selectorText.includes('#cfgcuerpo')) continue;
      re.lastIndex = 0; const sel = nuevo(r.selectorText); if (!sel) continue;
      // v2.361.0: la copia va justo detrás de su original (al final del bloque, la de escritorio quedaba detrás de la del @media y le ganaba)
      const caja = dentro || r.parentStyleSheet;
      try { caja.insertRule(`${sel}{${r.style.cssText}}`, [...caja.cssRules].indexOf(r) + 1); } catch (e) {}
    }
  };
  for (const h of document.styleSheets) { try { if (!h.href) recorrer(h.cssRules, null); } catch (e) {} }
}
setTimeout(cfgClonarEstilos, 0);


