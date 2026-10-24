/* ============================================================
   v2.55.0 · Dos anchos (datos y lectura), vistas previas en Datos
   fiscales y Marca, buscador con filtros activos, ajustes en
   rejilla, agenda sin paginación, columnas en un segundo panel,
   criterio único de botones y tablas
   ============================================================ */

/* ---------------- tablas: todas iguales y sin columnas descolocadas ---------------- */

// Si una tabla tiene más columnas que anchos definidos, se completan (antes la última saltaba de línea)
htAplicarColumnas = (orig => function (g) {
  if (!g.dataset.colsBase) {
    const base = getComputedStyle(g).getPropertyValue('--cols').trim();
    const n = (g.querySelector(':scope > .dh') || { children: [] }).children.length;
    const pistas = base.split(/\s+(?![^(]*\))/).filter(Boolean);
    g.dataset.colsBase = pistas.length && pistas.length < n ? base + ' minmax(90px,1fr)'.repeat(n - pistas.length) : base;
  }
  return orig(g);
})(htAplicarColumnas);

/* ---------------- botones de cabecera: siempre en el mismo orden ---------------- */

// (v2.183.0: aquí iba la primera versión de ordenarBotones; se redefine entera más abajo)

/* ---------------- columnas en un segundo panel lateral ---------------- */

(function () {
  if ($('tools2')) return;
  document.body.insertAdjacentHTML('beforeend', '<div class="tools tools2" id="tools2" aria-label="Columnas"></div><div class="toolsfondo hide" id="toolsfondo"></div>');
  // Pulsar fuera cierra los paneles laterales
  $('toolsfondo').addEventListener('pointerdown', () => { $('tools2').classList.remove('abierto'); $('tools').classList.remove('abierto'); });
  const fondo = () => $('toolsfondo').classList.toggle('hide', !($('tools').classList.contains('abierto') || $('tools2').classList.contains('abierto')));
  new MutationObserver(fondo).observe($('tools'), { attributes: true, attributeFilter: ['class'] });
  new MutationObserver(fondo).observe($('tools2'), { attributes: true, attributeFilter: ['class'] });
})();
function panelColumnas(titulo, cols, alCambiar) {
  const d = $('tools2');
  d.innerHTML = `<div class="tbox"><button class="t2volver" id="t2volver" type="button">‹ Volver</button>
    <div class="fh"><h2>${esc(titulo)}</h2><button class="x" id="t2cerrar" aria-label="Cerrar">✕</button></div>
    <p class="sm">Marca las columnas que quieres ver. Se aplica al momento y se recuerda.</p>
    <div class="t2cols">${cols.map(c => `<label class="opt"><input type="checkbox" data-t2c="${c.i}" ${c.on ? 'checked' : ''} ${c.fija ? 'disabled' : ''}> ${esc(c.n)}</label>`).join('')}</div></div>`;
  d.querySelectorAll('[data-t2c]').forEach(x => x.onchange = () => alCambiar(+x.dataset.t2c, x.checked));
  $('t2volver').onclick = () => d.classList.remove('abierto');
  $('t2cerrar').onclick = () => { d.classList.remove('abierto'); $('tools').classList.remove('abierto'); };
  d.classList.add('abierto');
}
// En el panel de «Filtros y columnas», las columnas pasan a un botón que abre el segundo panel
htPintarPanel = (orig => function (sec) {
  orig(sec);
  const auto = $('tools').querySelector('.htauto'); if (!auto || !htLateralAbierto()) return;
  const bloque = [...auto.querySelectorAll('.htbloque')].find(b => b.querySelector('[data-htc]')); if (!bloque) return;
  const g = sec.querySelector('.dgrid'); const tipo = htTipo(g);
  const cols = [...bloque.querySelectorAll('[data-htc]')].map(c => ({ i: +c.dataset.htc, n: c.parentElement.textContent.trim(), on: c.checked, fija: c.disabled }));
  const vis = cols.filter(c => c.on).length;
  bloque.innerHTML = `<h4>Columnas</h4><button class="btn sec t2abrir" type="button">Elegir columnas · ${vis} de ${cols.length} visibles <span>›</span></button>`;
  bloque.querySelector('.t2abrir').onclick = () => panelColumnas('Columnas', cols, (i, on) => {
    const o = new Set(htOcultas(tipo)); on ? o.delete(i) : o.add(i);
    localStorage.setItem('ht-cols-' + tipo, JSON.stringify([...o])); htAplicarColumnas(g);
    const c = cols.find(x => x.i === i); if (c) c.on = on;
    bloque.querySelector('.t2abrir').firstChild.textContent = `Elegir columnas · ${cols.filter(x => x.on).length} de ${cols.length} visibles `;
  });
})(htPintarPanel);
// Prescriptores: sus columnas se abren en el segundo panel, encima del de filtros
function abrirColumnas() {
  const t1 = $('tools'), t2 = $('tools2');
  // La función original pinta en el panel que se llama «tools»: durante la llamada, ese es el segundo
  t1.id = 'tools_1'; t2.id = 'tools';
  try { abrirColumnasBase(); } finally { t2.id = 'tools2'; t1.id = 'tools'; }
  t1.classList.add('abierto'); t2.classList.add('abierto');
  const ajustar = () => {
    const v = t2.querySelector('#tcvolver'); if (v && !v.dataset.v255) { v.dataset.v255 = '1'; v.textContent = '‹ Volver'; v.className = 't2volver'; v.onclick = () => t2.classList.remove('abierto'); }
    const x = t2.querySelector('#tclose'); if (x && !x.dataset.v255) { x.dataset.v255 = '1'; x.onclick = () => { t2.classList.remove('abierto'); t1.classList.remove('abierto'); }; }
  };
  ajustar();
  if (!t2.dataset.obs) { t2.dataset.obs = '1'; new MutationObserver(ajustar).observe(t2, { childList: true, subtree: true }); }
}
// Si se vuelve a los filtros desde cualquier sitio, el segundo panel se cierra
abrirHerramientas = (orig => function (...a) { $('tools2').classList.remove('abierto'); return orig(...a); })(abrirHerramientas);

/* ---------------- buscador con los filtros activos al lado ---------------- */


/* ---------------- Datos fiscales: vista previa de la factura ---------------- */

pintarEmpresa = (orig => async function (...a) {
  await orig(...a);
  const card = $('fcuerpo') && $('fcuerpo').querySelector('.card'); if (!card || $('fprev')) return;
  const w = document.createElement('div'); w.className = 'conprevia';
  card.parentNode.insertBefore(w, card); w.appendChild(card);
  w.insertAdjacentHTML('beforeend', `<div class="previa"><div class="sm previat">Vista previa de la cabecera de la factura</div><div class="facprev" id="fprev"></div></div>`);
  const v = k => (($('em_' + k) || {}).value || '').trim();
  const pinta = () => {
    const logo = MARCA.logo && (AJUSTES.marca || {}).logo_factura !== false;
    $('fprev').innerHTML = `<div class="fpcab">${logo ? `<img src="${esc(MARCA.logo)}" alt="">` : ''}<div><b>${esc(v('razon_social') || 'Razón social')}</b>
        <span>NIF ${esc(v('nif') || '—')}</span><span>${esc([v('direccion'), [v('cp'), v('municipio') || v('poblacion')].filter(Boolean).join(' '), v('provincia')].filter(Boolean).join(', ') || 'Dirección')}</span>
        <span>${esc([v('telefono'), v('email'), v('web')].filter(Boolean).join(' · '))}</span></div>
        <div class="fpnum"><b>FACTURA</b><span>F260001</span><span>${fechaCorta(hoyISO())}</span></div></div>
      <div class="fplineas"><div><span>Producto de ejemplo</span><span>2 × 30,00 €</span></div></div>
      <div class="fppie">${v('iban') ? `Transferencia: ${esc(v('iban'))}<br>` : ''}${esc(((document.querySelector('#fcuerpo textarea') || {}).value || '').slice(0, 180))}</div>`;
  };
  card.addEventListener('input', pinta); pinta();
})(pintarEmpresa);

/* ---------------- Marca y logo: vista previa del acceso y de la cabecera ---------------- */

pintarMarca = (orig => async function (...a) {
  await orig(...a);
  const card = $('cfgcuerpo') && $('cfgcuerpo').querySelector('.card'); if (!card || $('mkprev2')) return;
  const w = document.createElement('div'); w.className = 'conprevia';
  card.parentNode.insertBefore(w, card); w.appendChild(card);
  w.insertAdjacentHTML('beforeend', `<div class="previa"><div class="sm previat">Así lo verá tu equipo</div><div id="mkprev2"></div></div>`);
  const pinta = () => {
    const n = ($('mknom') || {}).value || nombreApp(), lg = ($('mklogo') || {}).src || 'logo-app.png';
    $('mkprev2').innerHTML = `<div class="mkcab"><img src="${esc(lg)}" alt=""><span class="mkbus">Buscar…</span><span class="mkav">${esc(iniciales(PERFIL ? PERFIL.nombre : ''))}</span></div>
      <div class="mklogin"><img src="${esc(lg)}" alt=""><b>${esc(n)}</b><span>Entra con tu correo y contraseña.</span><i></i><i></i><em>Entrar</em></div>`;
  };
  card.addEventListener('input', pinta); card.addEventListener('change', () => setTimeout(pinta, 300));
  new MutationObserver(pinta).observe($('mklogo'), { attributes: true, attributeFilter: ['src'] });
  pinta();
})(pintarMarca);

/* ---------------- agenda: día a la izquierda, sugerencias y pendientes a la derecha ---------------- */


/* ---------------- manual: columna de lectura con índice ---------------- */

cargarManual = (orig => async function (...a) {
  await orig(...a);
  const v = $('v-manual'); return;   // el índice lateral se retiró
  const tit = [...v.querySelectorAll('h2.mantit')];
  if (tit.length < 2) return;
  tit.forEach((h, i) => { h.id = h.id || 'mant' + i; });
  v.classList.add('conindice');
  v.insertAdjacentHTML('afterbegin', `<nav class="manindice"><b>En esta página</b>${tit.map(h => `<a href="#${h.id}" data-manir="${h.id}">${esc(h.textContent)}</a>`).join('')}</nav>`);
  v.querySelectorAll('[data-manir]').forEach(a => a.onclick = e => { e.preventDefault(); const h = $(a.dataset.manir); scrollTo({ top: h.getBoundingClientRect().top + scrollY - 140, behavior: 'smooth' }); });
})(cargarManual);

/* ---------------- se aplica en cada pantalla ---------------- */

let V255_PEND = false;
new MutationObserver(() => {
  if (V255_PEND) return; V255_PEND = true;
  queueMicrotask(() => { V255_PEND = false; const sec = $('v-' + TAB); if (!sec) return; ordenarBotones(sec); htChips(sec); });
}).observe(document.querySelector('main'), { childList: true, subtree: true });


