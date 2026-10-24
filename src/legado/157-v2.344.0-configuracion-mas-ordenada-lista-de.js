/* ============================================================
   v2.344.0 · Configuración más ordenada (lista de Eric, 21/10/2026)
   - Un apartado con partes (Rutas, Cartera y visitas, Stock y material, Importar datos, Clasificadores, Datos fiscales con Series) es
     una sola página: sus partes una debajo de otra, sin pestañas. Cada parte se pinta en su propia sección y funciona igual que antes:
     sus piezas con nombre fijo (#cfgcuerpo, #fcuerpo, el panel #dbody) se le devuelven al tocarla y las de las otras se guardan.
   - Mis datos en una sola tarjeta; Datos fiscales y Series juntos; los botones de KPIs de Inicio junto al título.
   ============================================================ */
const IDS_SEC = ['fcuerpo', 'dbody', 'v-admin'];
let CFG_SEC_ACT = null;
const cfgEstable = (el, max) => new Promise(ok => {
  let t = 0, fin = 0; const ob = new MutationObserver(() => { clearTimeout(t); t = setTimeout(listo, 150); });
  const listo = () => { if (el.querySelector('.cfgcarga, .giro, .spin')) { t = setTimeout(listo, 150); return; } ob.disconnect(); clearTimeout(fin); ok(); };
  ob.observe(el, { childList: true, subtree: true, attributes: true }); t = setTimeout(listo, 200); fin = setTimeout(() => { ob.disconnect(); clearTimeout(t); ok(); }, max || 5000);
});
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
setTimeout(cfgClonarEstilos, 0);


