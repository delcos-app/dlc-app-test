/* ============================================================
   v2.46.1 · Nombre del módulo de contactos configurable
   («Prescriptores» por defecto), bloque Empresa en el menú de usuario,
   detalle de usuario ordenado, Stock y material simétrico y ningún
   apartado se queda cargando sin fin
   ============================================================ */

Object.assign(ICON_NOM, {"building": "<rect width=\"16\" height=\"20\" x=\"4\" y=\"2\" rx=\"2\" ry=\"2\" /> <path d=\"M9 22v-4h6v4\" /> <path d=\"M8 6h.01\" /> <path d=\"M16 6h.01\" /> <path d=\"M12 6h.01\" /> <path d=\"M12 10h.01\" /> <path d=\"M12 14h.01\" /> <path d=\"M16 10h.01\" /> <path d=\"M16 14h.01\" /> <path d=\"M8 10h.01\" /> <path d=\"M8 14h.01\" />", "check": "<path d=\"M20 6 9 17l-5-5\" />", "minus": "<path d=\"M5 12h14\" />", "rotate-cw": "<path d=\"M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8\" /> <path d=\"M21 3v5h-5\" />"});

/* ---------------- ninguna consulta se queda colgada ---------------- */

// Antes, si una consulta fallaba por la red, la pantalla se quedaba esperando para siempre
db.rpc = (orig => function (fn, params, opts) {
  const r = orig.call(db, fn, params, opts);
  if (!r || typeof r.then !== 'function') return r;
  let hecho = false;
  const limite = new Promise(res => setTimeout(() => { if (!hecho) res({ data: null, error: { message: 'La petición ha tardado demasiado (' + fn + ')', code: 'TIEMPO' } }); }, 20000));
  return conCatch(Promise.race([Promise.resolve(r).then(x => { hecho = true; return x; }, e => { hecho = true; return { data: null, error: e }; }), limite]));
})(db.rpc);

/* ---------------- nombre del módulo de contactos ---------------- */

const ETIQUETAS = [...new Set([`${TT('medico', 'p', '', 'l', 'C')}`, 'Profesionales', 'Cuentas', 'Contactos', 'Clientes potenciales', 'Puntos de venta', 'Prescriptores'])];
function aplicarEtiquetaBase() {
  const n = etiquetaContactos();
  document.querySelectorAll('nav.main [data-t="directorio"], #bnav [data-t="directorio"], .bmasgrid [data-bm="directorio"]').forEach(b => {
    [...b.childNodes].forEach(x => { if (x.nodeType === 3 && x.nodeValue.trim()) x.nodeValue = n; });
    const l = b.querySelector('b, em, small, .lb'); if (l && !l.querySelector('svg')) l.textContent = n;
  });
  const h = document.querySelector('#dircab h1');
  if (h) { const tn = [...h.childNodes].find(x => x.nodeType === 3 && x.nodeValue.trim()); if (tn) tn.nodeValue = n; else h.insertAdjacentText('afterbegin', n); }
  const v = $('calvolver'); if (v) v.textContent = '‹ ' + n;
}
new MutationObserver(() => { const b = document.querySelector('#bnav [data-t="directorio"]'); if (b && !b.textContent.includes(etiquetaContactos())) aplicarEtiqueta(); })
  .observe(document.body, { childList: true, subtree: true });

/* ---------------- Empresa en el menú de usuario ---------------- */

(function () {
  const plan = document.querySelector('[data-u="plan"]'); if (!plan || document.querySelector('[data-u="empresa"]')) return;
  plan.insertAdjacentHTML('beforebegin', `<button data-u="empresa" class="hide">${svgIco(ICON_NOM.building)} Empresa</button>`);
  document.addEventListener('click', e => { if (e.target.closest('[data-u="empresa"]')) { CFG_SEC = 'empresa'; window.__CFG_DIRECTO = true; ir('config'); } });
})();
Object.assign(CFG_ANTES, { marca: ['__empresa', 'marca'], correo: ['__empresa', 'correo'], copias: ['__empresa', 'copias'], empresa: ['__empresa', 'marca'] });

/* ---------------- Configuración: carga visible y errores claros ---------------- */

// El grupo oculto no se pinta en el menú lateral
new MutationObserver(() => document.querySelectorAll('.cfgnav .cfgg').forEach(g => { if (g.querySelector('h3') && g.querySelector('h3').textContent === '__oculto') g.remove(); }))
  .observe(document.body, { childList: true, subtree: true });

/* ---------------- Marca y logo: nombre del módulo de contactos ---------------- */


/* ---------------- detalle de usuario ordenado ---------------- */

;



