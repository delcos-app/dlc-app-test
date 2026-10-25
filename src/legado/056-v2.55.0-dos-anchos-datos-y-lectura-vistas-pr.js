/* ============================================================
   v2.55.0 · Dos anchos (datos y lectura), vistas previas en Datos
   fiscales y Marca, buscador con filtros activos, ajustes en
   rejilla, agenda sin paginación, columnas en un segundo panel,
   criterio único de botones y tablas
   ============================================================ */

/* ---------------- tablas: todas iguales y sin columnas descolocadas ---------------- */


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
function panelColumnasBase(titulo, cols, alCambiar) {
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
// Si se vuelve a los filtros desde cualquier sitio, el segundo panel se cierra
function abrirHerramientasBase3(...a) { $('tools2').classList.remove('abierto'); return abrirHerramientasBase2(...a); }

/* ---------------- buscador con los filtros activos al lado ---------------- */


/* ---------------- Datos fiscales: vista previa de la factura ---------------- */

async function pintarEmpresa(...a) {
  await pintarEmpresaBase2(...a);
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
}

/* ---------------- Marca y logo: vista previa del acceso y de la cabecera ---------------- */


/* ---------------- agenda: día a la izquierda, sugerencias y pendientes a la derecha ---------------- */


/* ---------------- manual: columna de lectura con índice ---------------- */


/* ---------------- se aplica en cada pantalla ---------------- */

let V255_PEND = false;
new MutationObserver(() => {
  if (V255_PEND) return; V255_PEND = true;
  queueMicrotask(() => { V255_PEND = false; const sec = $('v-' + TAB); if (!sec) return; ordenarBotones(sec); htChips(sec); });
}).observe(document.querySelector('main'), { childList: true, subtree: true });


