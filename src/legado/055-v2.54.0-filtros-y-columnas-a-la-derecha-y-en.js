/* ============================================================
   v2.54.0 · «Filtros y columnas» a la derecha y en el panel lateral
   en todas las pantallas, sin parpadeo al cambiar de pestaña, sin
   saltos por la barra de desplazamiento e IVA con selector
   ============================================================ */

/* ---------------- «Filtros y columnas» en el panel lateral ---------------- */

new MutationObserver(() => { if (!$('tools').classList.contains('abierto')) htDevolver(); }).observe($('tools'), { attributes: true, attributeFilter: ['class'] });
function htAbrirLateral(sec) {
  const d = $('tools'), id = sec.id.replace('v-', '');
  if (htLateralAbierto() && HERR_CTX === 'ht-' + id) { d.classList.remove('abierto'); return; }
  htDevolver();
  HERR_CTX = 'ht-' + id;
  d.innerHTML = `<div class="tbox"><div class="fh"><h2>Filtros y columnas</h2><button class="x" id="tclose" aria-label="Cerrar">✕</button></div>
    <div class="htpropios lat"></div><div class="htauto"></div></div>`;
  const hold = sec.querySelector('.htpanel .htpropios');
  if (hold) [...hold.children].forEach(ch => d.querySelector('.htpropios.lat').appendChild(chicoEn(ch, false)));
  $('tclose').onclick = () => d.classList.remove('abierto');
  d.classList.add('abierto');
  htPintarPanel(sec);
}
// El contenido automático (buscar, filtrar por columna, columnas) se pinta en el panel lateral
htPintarPanel = (orig => function (sec) {
  const d = $('tools');
  if (!(htLateralAbierto() && HERR_CTX === 'ht-' + sec.id.replace('v-', ''))) return;
  // Se reutiliza la función anterior pintando sobre un «panel» temporal y se lleva el resultado al lateral
  const tmp = document.createElement('div'); tmp.className = 'htpanel'; tmp.innerHTML = '<div class="htauto"></div>';
  const real = sec.querySelector('.htpanel'); if (real) real.classList.add('htreal');
  sec.appendChild(tmp);
  const antes = sec.querySelector('.htpanel:not(.htreal)');
  if (real) real.classList.remove('htpanel');
  try { orig(sec); } finally { if (real) real.classList.add('htpanel'); }
  const auto = d.querySelector('.htauto'); auto.replaceWith(tmp.querySelector('.htauto')); tmp.remove();
  if (real) real.classList.remove('htreal');
})(htPintarPanel);
htActivos = (orig => function (sec) {
  let n = orig(sec);
  if (htLateralAbierto() && HERR_CTX === 'ht-' + sec.id.replace('v-', '')) $('tools').querySelectorAll('.htpropios.lat select').forEach(s => { if (s.selectedIndex > 0) n++; });
  return n;
})(htActivos);
new MutationObserver(() => {
  if (HT2_PEND) return; HT2_PEND = true;
  queueMicrotask(() => { HT2_PEND = false; const sec = $('v-' + TAB); if (sec) htColocarBoton(sec); });
}).observe(document.querySelector('main'), { childList: true, subtree: true });

/* ---------------- sin parpadeo al cambiar de pestaña ---------------- */

// (v2.183.0: aquí iba la primera versión de congelar; se redefine entera más abajo)
document.addEventListener('click', e => {
  const b = e.target.closest('main .subnav button, main [data-pedsec], main [data-psec], main [data-fsec], main [data-ansec], main [data-avista], main [data-ag="equipo"]');
  if (!b || b.getAttribute('aria-pressed') === 'true') return;
  congelar(b.closest('main > section'));
}, true);

/* ---------------- IVA: selector con los tipos legales ---------------- */

function ivaSelector(inp) {
  if (!inp || inp.dataset.ivasel || inp.type === 'hidden') return;
  inp.dataset.ivasel = '1';
  const v = inp.value === '' ? '' : +inp.value;
  const sel = document.createElement('select');
  sel.className = 'ivasel'; if (inp.disabled || inp.readOnly) sel.disabled = true;
  sel.innerHTML = TIPOS_IVA.map(([n, t]) => `<option value="${n}" ${n === v ? 'selected' : ''}>${t}</option>`).join('')
    + (v !== '' && !TIPOS_IVA.some(x => x[0] === v) ? `<option value="${v}" selected>${v} % (no habitual)</option>` : '');
  if (inp.id) { const l = document.querySelector(`label[for="${inp.id}"]`); if (l) l.setAttribute('for', inp.id + '_sel'); sel.id = inp.id + '_sel'; }
  inp.classList.add('hide'); inp.after(sel);
  if (inp.value === '') { inp.value = sel.value; }
  // El campo original sigue siendo el que lee la plataforma: el selector le pasa el valor y avisa del cambio
  sel.onchange = () => { inp.value = sel.value; inp.dispatchEvent(new Event('input', { bubbles: true })); inp.dispatchEvent(new Event('change', { bubbles: true })); };
}
new MutationObserver(ms => {
  for (const m of ms) for (const n of m.addedNodes) if (n.nodeType === 1)
    (n.matches && n.matches('#priva, #penvv, input[data-f="iva"]') ? [n] : [...n.querySelectorAll('#priva, #penvv, input[data-f="iva"]')]).forEach(ivaSelector);
}).observe(document.body, { childList: true, subtree: true });


