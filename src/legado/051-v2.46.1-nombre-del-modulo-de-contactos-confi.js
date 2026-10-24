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
// v2.105.0: sin etiqueta propia, el nombre sale del vocabulario de la empresa («Farmacias», «Contactos»…); con el vocabulario por defecto, «Prescriptores»
const etiquetaContactos = () => ((AJUSTES.marca || {}).etiqueta || TT('medico', 'p', '', 'l', 'C'));
function aplicarEtiqueta() {
  const n = etiquetaContactos();
  document.querySelectorAll('nav.main [data-t="directorio"], #bnav [data-t="directorio"], .bmasgrid [data-bm="directorio"]').forEach(b => {
    [...b.childNodes].forEach(x => { if (x.nodeType === 3 && x.nodeValue.trim()) x.nodeValue = n; });
    const l = b.querySelector('b, em, small, .lb'); if (l && !l.querySelector('svg')) l.textContent = n;
  });
  const h = document.querySelector('#dircab h1');
  if (h) { const tn = [...h.childNodes].find(x => x.nodeType === 3 && x.nodeValue.trim()); if (tn) tn.nodeValue = n; else h.insertAdjacentText('afterbegin', n); }
  const v = $('calvolver'); if (v) v.textContent = '‹ ' + n;
}
cargarAjustes = (orig => async function () { await orig(); aplicarEtiqueta(); })(cargarAjustes);
new MutationObserver(() => { const b = document.querySelector('#bnav [data-t="directorio"]'); if (b && !b.textContent.includes(etiquetaContactos())) aplicarEtiqueta(); })
  .observe(document.body, { childList: true, subtree: true });

/* ---------------- Empresa en el menú de usuario ---------------- */

(function () {
  const plan = document.querySelector('[data-u="plan"]'); if (!plan || document.querySelector('[data-u="empresa"]')) return;
  plan.insertAdjacentHTML('beforebegin', `<button data-u="empresa" class="hide">${svgIco(ICON_NOM.building)} Empresa</button>`);
  document.addEventListener('click', e => { if (e.target.closest('[data-u="empresa"]')) { CFG_SEC = 'empresa'; window.__CFG_DIRECTO = true; ir('config'); } });
})();
arbolConfig = (orig => function () { return orig().filter(g => g[0] !== 'Empresa'); })(arbolConfig);
Object.assign(CFG_ANTES, { marca: ['__empresa', 'marca'], correo: ['__empresa', 'correo'], copias: ['__empresa', 'copias'], empresa: ['__empresa', 'marca'] });

/* ---------------- Configuración: carga visible y errores claros ---------------- */

cargarConfig = (orig => async function () {
  // «Empresa» y «Plan» no están en el menú lateral: se abren desde el menú de usuario
  if (CFG_SEC === 'empresa') CFG_SEC = '__empresa';
  await orig();
})(cargarConfig);
// Se amplía el árbol con los apartados ocultos y se envuelve cada pintado para mostrar carga y errores
arbolConfig = (orig => function () {
  const g = orig();
  const envolver = f => async () => {
    const c = $('cfgcuerpo'); c.innerHTML = '<div class="cfgcarga"><span class="giro"></span> Cargando…</div>';
    // Si al cabo de 20 segundos sigue cargando, se avisa en lugar de dejarlo en blanco
    setTimeout(() => { if (c.isConnected && c.querySelector(':scope > .cfgcarga')) mostrarError(new Error('El apartado no ha terminado de cargar. Revisa la conexión y vuelve a intentarlo.')); }, 20000);
    const mostrarError = e => {
      c.innerHTML = `<div class="card cfgpanel"><h2>No se ha podido cargar</h2><p class="sm">${esc(e && e.message ? e.message : String(e))}</p>
        <div class="acts"><button class="btn sec" id="cfgreint">${svgIco(ICON_NOM['rotate-cw'])} Reintentar</button></div></div>`;
      $('cfgreint').onclick = () => envolver(f)();
    };
    try { await f(); }
    catch (e) { mostrarError(e); }
  };
  g.forEach(([, l]) => l.forEach(x => { if (x.r) x.r = envolver(x.r); if (x.sub) x.sub.forEach(s => { s[2] = envolver(s[2]); }); }));
  // Apartado oculto «Empresa» (se abre desde el menú de usuario)
  g.push(['__oculto', [{ k: '__empresa', ic: 'building', t: 'Empresa', d: '', sub: [['marca', 'Marca y logo', envolver(pintarMarca)], ['correo', 'Correo y firma', envolver(pintarCorreo)], ['copias', 'Copias de seguridad', envolver(pintarCopias)]] }]]);
  return g;
})(arbolConfig);
// El grupo oculto no se pinta en el menú lateral
new MutationObserver(() => document.querySelectorAll('.cfgnav .cfgg').forEach(g => { if (g.querySelector('h3') && g.querySelector('h3').textContent === '__oculto') g.remove(); }))
  .observe(document.body, { childList: true, subtree: true });

/* ---------------- Marca y logo: nombre del módulo de contactos ---------------- */

pintarMarca = (orig => async function () {
  await orig();
  const ok = $('mkok'); if (!ok || $('mketq')) return;
  const actual = etiquetaContactos(), otra = !ETIQUETAS.includes(actual);
  ok.closest('.acts').insertAdjacentHTML('beforebegin', `<div class="mketqbox"><label for="mketq">Cómo llamáis a quienes visitáis</label>
    <div class="g2"><select id="mketq">${ETIQUETAS.map(e => `<option ${e === actual ? 'selected' : ''}>${e}</option>`).join('')}<option value="__otra" ${otra ? 'selected' : ''}>Otro nombre…</option></select>
      <input id="mketqo" class="${otra ? '' : 'hide'}" value="${otra ? esc(actual) : ''}" placeholder="Escribe el nombre"></div>
    <div class="sm">Es el nombre del módulo donde están ${TT('medico', 'p', '', 'l', 'l')}, centros y cualquier otro contacto al que visitáis.</div></div>`);
  const ETQ_TERM = { medico: 'Profesional al que visitáis', paciente: 'Cliente final', visita: 'Cada encuentro con el profesional' };
  ok.closest('.acts').insertAdjacentHTML('beforebegin', `<div class="mkvoc"><label>Vocabulario de la plataforma</label>
    <div class="sm">Cómo se llaman en todos los textos. En blanco, se usa el nombre de siempre.</div>
    ${Object.keys(TERM_DEF).map(k => { const d = TERM_DEF[k], t = TERMINOS[k] || {}; return `<div class="g3 mkvocf" data-term="${k}">
      <div><label class="sm">${esc(ETQ_TERM[k])} · singular</label><input data-tf="s" value="${esc(t.s || '')}" placeholder="${esc(d.s)}"></div>
      <div><label class="sm">Plural</label><input data-tf="p" value="${esc(t.p || '')}" placeholder="${esc(d.p)}"></div>
      <div><label class="sm">Género</label><select data-tf="g"><option value="">${d.g === 'f' ? 'Femenino' : 'Masculino'} (el de siempre)</option>
        <option value="m" ${t.g === 'm' ? 'selected' : ''}>Masculino</option><option value="f" ${t.g === 'f' ? 'selected' : ''}>Femenino</option></select></div></div>`; }).join('')}</div>`);
  $('mketq').onchange = () => $('mketqo').classList.toggle('hide', $('mketq').value !== '__otra');
  const guardar = ok.onclick;
  ok.onclick = async () => {
    const etq = $('mketq').value === '__otra' ? ($('mketqo').value.trim() || TT('medico', 'p', '', 'l', 'C')) : $('mketq').value;
    await guardar();
    const v = Object.assign({}, AJUSTES.marca || {}, { etiqueta: etq });
    const { error } = await db.rpc('guardar_ajuste', { p_clave: 'marca', p_valor: v });
    if (!error) { AJUSTES.marca = v; aplicarEtiqueta(); }
    const voc = {};
    document.querySelectorAll('.mkvocf').forEach(f => { const o = {}; f.querySelectorAll('[data-tf]').forEach(i => { if (i.value.trim()) o[i.dataset.tf] = i.value.trim(); }); if (Object.keys(o).length) voc[f.dataset.term] = o; });
    if (JSON.stringify(voc) !== JSON.stringify(TERMINOS || {})) {
      const { error: e3 } = await db.rpc('guardar_ajuste', { p_clave: 'terminos', p_valor: voc });
      if (e3) { toast('No se ha podido guardar el vocabulario', true); return; }
      try { localStorage.setItem(TERMKEY, JSON.stringify(voc)); } catch (e) {}
      toast('Vocabulario guardado: se recarga la plataforma'); setTimeout(() => location.reload(), 900);
    }
  };
})(pintarMarca);

/* ---------------- detalle de usuario ordenado ---------------- */

;



