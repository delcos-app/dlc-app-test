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

function cerrarPickers(salvo) {
  document.querySelectorAll('.picker .gsug').forEach(g => { if (!salvo || !salvo.contains(g)) g.classList.add('hide'); });
}

function cerrarSelector() {
  if (SELPOP) { SELPOP.remove(); SELPOP = null; }
  const d = $('seldlg'); if (d && d.open) d.close();
}

// Con una ventana abierta, solo se puede pulsar lo que está dentro: el selector se coloca en ella
const capaSelector = inp => inp.closest('dialog[open]') || [...document.querySelectorAll('dialog[open]')].pop() || document.body;

/* ============================================================
   v2.101.0 · Fechas, horas y números
   Los mismos selectores en escritorio y en móvil para todos los campos:
   fecha, hora, mes (liquidaciones) y fecha con hora (llamadas), que antes
   abrían el selector del sistema. Calendario con vista de meses y años
   (se pulsa el título), atajos «Hoy» y «Mañana» y manejo con el teclado.
   Reloj con «Ahora» y los minutos según el paso del campo. Números con el
   teclado adecuado en el móvil, mantener pulsado para sumar o restar
   seguido, la rueda del ratón ya no los cambia sin querer y se respetan
   el mínimo y el máximo al escribir.
   ============================================================ */
const selDos = n => String(n).padStart(2, '0');

const SEL_DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

const selFechaLarga = iso => { const d = new Date(iso + 'T12:00:00'); return `${SEL_DIAS[d.getDay()]}, ${d.getDate()} de ${MESES_L[d.getMonth()]} de ${d.getFullYear()}`; };

const selFechaMedia = iso => { const d = new Date(iso + 'T12:00:00'); return isNaN(d) ? iso : d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }); };

const selTipo = inp => inp.type === 'month' ? 'mes' : inp.type === 'datetime-local' ? 'fechahora' : inp.type === 'time' ? 'hora' : 'fecha';
