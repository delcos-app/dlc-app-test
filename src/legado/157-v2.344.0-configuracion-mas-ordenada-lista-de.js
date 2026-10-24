/* ============================================================
   v2.344.0 · Configuración más ordenada (lista de Eric, 21/10/2026)
   - Un apartado con partes (Rutas, Cartera y visitas, Stock y material, Importar datos, Clasificadores, Datos fiscales con Series) es
     una sola página: sus partes una debajo de otra, sin pestañas. Cada parte se pinta en su propia sección y funciona igual que antes:
     sus piezas con nombre fijo (#cfgcuerpo, #fcuerpo, el panel #dbody) se le devuelven al tocarla y las de las otras se guardan.
   - Mis datos en una sola tarjeta; Datos fiscales y Series juntos; los botones de KPIs de Inicio junto al título.
   ============================================================ */
const IDS_SEC = ['fcuerpo', 'dbody', 'v-admin'];
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
function arbolCfgUnico(...a) {
  const g = arbolCfgUnicoBase8.apply(this, a), f = g.find(x => x[0] === 'Facturación'); if (!f) return g;
  const fi = f[1].find(x => x.k === 'o.fiscal'), se = f[1].find(x => x.k === 'o.series');
  if (fi && se && !fi.hijos) f[1] = f[1].filter(x => x !== se).map(x => x === fi ? Object.assign({}, fi, { d: 'Razón social, NIF, dirección y numeración de las facturas',
    hijos: [{ k: 'o.fiscal', t: fi.t, r: fi.r }, { k: 'o.series', t: se.t, r: se.r }] }) : x);
  return g;
}


// KPIs de Inicio: Restaurar y Guardar junto al título
new MutationObserver(() => {
  if (TAB !== 'config' || CFG_KEY !== 'inicio.kpis') return;
  const cab = document.querySelector('#v-config .cfucab'), c = $('cfgcuerpo'); if (!cab || !c) return;
  const acts = [...c.querySelectorAll('.acts')].filter(x => x.querySelector('.btn') && !x.classList.contains('cfuacts')).pop(); if (!acts) return;
  cab.querySelectorAll('.cfuacts').forEach(x => x.remove());
  acts.classList.add('cfuacts'); cab.appendChild(acts);
}).observe(document.body, { childList: true, subtree: true });
setTimeout(cfgClonarEstilos, 0);


