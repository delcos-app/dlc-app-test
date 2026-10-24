// componentes/selector_fecha.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.

// ---------- Mes y fecha con hora con el mismo selector; teclado de los números ----------
function mejorarCamposNuevos(raiz) {
  const r = raiz && raiz.querySelectorAll ? raiz : document;
  const lista = [...r.querySelectorAll('input[type=month]:not([data-sel]), input[type=datetime-local]:not([data-sel])')];
  if (r.matches && r.matches('input[type=month]:not([data-sel]), input[type=datetime-local]:not([data-sel])')) lista.push(r);
  lista.forEach(inp => {
    inp.dataset.sel = '1';
    if (inp.closest('.selpop')) return;
    const w = document.createElement('span'); w.className = 'selw fecha';
    inp.parentNode.insertBefore(w, inp); w.appendChild(inp);
    w.insertAdjacentHTML('beforeend', '<span class="selico" aria-hidden="true">📅</span>');
    inp.dataset.ro = inp.readOnly ? '1' : '';
    inp.readOnly = true; inp.setAttribute('inputmode', 'none');
    w.insertAdjacentHTML('afterbegin', '<span class="selval"></span>');
    const desc = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
    Object.defineProperty(inp, 'value', { configurable: true, get() { return desc.get.call(this); }, set(v) { desc.set.call(this, v); valorVisible(this); } });
    inp.addEventListener('change', () => valorVisible(inp)); inp.addEventListener('input', () => valorVisible(inp));
    valorVisible(inp);
  });
  r.querySelectorAll('input[type=number]:not([inputmode])').forEach(inp => {
    const paso = inp.step && inp.step !== 'any' ? +inp.step : 1;
    inp.setAttribute('inputmode', paso < 1 || inp.step === 'any' ? 'decimal' : 'numeric');
  });
}

function sinSelectorDelSistema(raiz) {
  if (!PANTALLA_TACTIL || !raiz || !raiz.querySelectorAll) return;
  const l = [...raiz.querySelectorAll('input')];
  if (raiz.matches && raiz.matches('input')) l.push(raiz);
  l.forEach(i => { if (/^(date|time|month|datetime-local)$/.test(i.type) && !i.closest('.selpop')) i.inert = true; });
}
