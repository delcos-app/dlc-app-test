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

// ---------- Calendario: días, meses y años ----------
function abrirCalendario(inp, o) {
  o = o || {};
  // Si viene del reloj (o el reloj de él), se sustituye dentro de la misma ventanita: cerrarla y abrirla haría que el primer toque se ignore
  if (o.mismo && SELPOP) { SELPOP.remove(); SELPOP = null; } else cerrarSelector();
  const tipo = selTipo(inp), valor = inp.value || '';
  const diaIni = o.fecha || (tipo === 'mes' ? (valor ? valor + '-01' : '') : valor.slice(0, 10));
  let ver = diaIni ? new Date(diaIni + 'T12:00:00') : new Date(hoyISO() + 'T12:00:00');
  let foco = diaIni || hoyISO();
  let vista = tipo === 'mes' ? 'meses' : 'dias';
  const min = (inp.min || '').slice(0, tipo === 'mes' ? 7 : 10) || null, max = (inp.max || '').slice(0, tipo === 'mes' ? 7 : 10) || null;
  const pop = document.createElement('div'); pop.className = 'selpop cal'; SELPOP = pop; pop.__t = Date.now();
  pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-label', tipo === 'mes' ? 'Elegir mes' : 'Elegir fecha');
  const mesActual = hoyISO().slice(0, 7);
  const elegido = tipo === 'mes' ? valor.slice(0, 7) : valor.slice(0, 10);
  const pinta = () => {
    const y = ver.getFullYear(), m = ver.getMonth();
    let cab = '', cuerpo = '', pie = '';
    if (vista === 'dias') {
      const hueco = (new Date(y, m, 1).getDay() + 6) % 7, dias = new Date(y, m + 1, 0).getDate(), hoy = hoyISO();
      let celdas = '';
      for (let i = 0; i < hueco; i++) celdas += '<span></span>';
      for (let d = 1; d <= dias; d++) {
        const f = `${y}-${selDos(m + 1)}-${selDos(d)}`, fuera = (min && f < min) || (max && f > max);
        celdas += `<button type="button" data-cd="${f}" class="${f === elegido ? 'sel' : ''} ${f === hoy ? 'hoy' : ''}" tabindex="${f === foco ? 0 : -1}" ${f === foco ? 'autofocus' : ''}
          aria-label="${selFechaLarga(f)}" aria-pressed="${f === elegido}" ${fuera ? 'disabled' : ''}>${d}</button>`;
      }
      cab = `<button type="button" data-cm="-1" aria-label="Mes anterior">‹</button><button type="button" class="caltit" data-cv="meses" aria-label="Elegir mes y año">${MESES_L[m]} ${y}</button><button type="button" data-cm="1" aria-label="Mes siguiente">›</button>`;
      cuerpo = `<div class="calg">${['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(x => `<i>${x}</i>`).join('')}${celdas}</div>`;
      pie = `<button type="button" data-cq="hoy">Hoy</button><button type="button" data-cq="manana">Mañana</button>${inp.required ? '' : '<button type="button" data-cq="borrar">Borrar</button>'}`;
    } else if (vista === 'meses') {
      cab = `<button type="button" data-cy="-1" aria-label="Año anterior">‹</button><button type="button" class="caltit" data-cv="anios" aria-label="Elegir año">${y}</button><button type="button" data-cy="1" aria-label="Año siguiente">›</button>`;
      cuerpo = `<div class="calm">${MESES_L.map((n, i) => { const k = `${y}-${selDos(i + 1)}`, fuera = (min && k < min.slice(0, 7)) || (max && k > max.slice(0, 7));
        return `<button type="button" data-cmes="${i}" class="${k === elegido.slice(0, 7) ? 'sel' : ''} ${k === mesActual ? 'hoy' : ''}" aria-label="${n} de ${y}" ${fuera ? 'disabled' : ''}>${MESES_C[i]}</button>`; }).join('')}</div>`;
      pie = tipo === 'mes' ? `<button type="button" data-cq="estemes">Este mes</button>${inp.required ? '' : '<button type="button" data-cq="borrar">Borrar</button>'}` : '';
    } else {
      const ini = y - 5;
      cab = `<button type="button" data-cy="-12" aria-label="Años anteriores">‹</button><b>${ini} – ${ini + 11}</b><button type="button" data-cy="12" aria-label="Años siguientes">›</button>`;
      cuerpo = `<div class="calm">${Array.from({ length: 12 }, (_, i) => ini + i).map(a => `<button type="button" data-canio="${a}" class="${String(a) === elegido.slice(0, 4) ? 'sel' : ''} ${String(a) === mesActual.slice(0, 4) ? 'hoy' : ''}">${a}</button>`).join('')}</div>`;
    }
    pop.innerHTML = `<div class="calh">${cab}</div>${cuerpo}${pie ? `<div class="calp">${pie}</div>` : ''}`;
    colocarPop(pop, inp.closest('.selw') || inp);
    if (!ES_MOVIL() && vista === 'dias') { const b = pop.querySelector(`[data-cd="${foco}"]`); if (b && pop.contains(document.activeElement) || o.teclado) b && b.focus({ preventScroll: true }); }
  };
  const fijar = f => {
    if (tipo === 'fechahora') { abrirReloj(inp, { fecha: f, desdeCal: true, mismo: true }); return; }
    inp.value = f; emitir(inp); cerrarSelector(); inp.focus({ preventScroll: true });
  };
  pop.addEventListener('pointerdown', () => { pop.__t = Date.now(); });
  pop.addEventListener('click', e => {
    e.stopPropagation();
    const t = e.target.closest('button'); if (!t || t.disabled) return;
    const ds = t.dataset;
    if (ds.cd) fijar(ds.cd);
    else if (ds.cm) { ver = new Date(ver.getFullYear(), ver.getMonth() + +ds.cm, 1); pinta(); }
    else if (ds.cy) { ver = new Date(ver.getFullYear() + +ds.cy, ver.getMonth(), 1); pinta(); }
    else if (ds.cv) { vista = ds.cv; pinta(); }
    else if (ds.cmes !== undefined) {
      if (tipo === 'mes') { inp.value = `${ver.getFullYear()}-${selDos(+ds.cmes + 1)}`; emitir(inp); cerrarSelector(); return; }
      ver = new Date(ver.getFullYear(), +ds.cmes, 1); vista = 'dias'; pinta();
    } else if (ds.canio) { ver = new Date(+ds.canio, ver.getMonth(), 1); vista = 'meses'; pinta(); }
    else if (ds.cq === 'hoy') fijar(hoyISO());
    else if (ds.cq === 'manana') fijar(isoMas(hoyISO(), 1));
    else if (ds.cq === 'estemes') { inp.value = mesActual; emitir(inp); cerrarSelector(); }
    else if (ds.cq === 'borrar') { inp.value = ''; emitir(inp); cerrarSelector(); }
  });
  // Teclado: flechas de día en día y de semana en semana, Re Pág / Av Pág de mes en mes, Inicio / Fin de la semana
  pop.addEventListener('keydown', e => {
    if (vista !== 'dias') return;
    const salto = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
    const d = new Date(foco + 'T12:00:00');
    if (salto) d.setDate(d.getDate() + salto);
    else if (e.key === 'PageUp' || e.key === 'PageDown') d.setMonth(d.getMonth() + (e.key === 'PageUp' ? -1 : 1));
    else if (e.key === 'Home') d.setDate(d.getDate() - (d.getDay() + 6) % 7);
    else if (e.key === 'End') d.setDate(d.getDate() + (6 - (d.getDay() + 6) % 7));
    else return;
    e.preventDefault();
    foco = isoLocal(d); ver = new Date(d.getFullYear(), d.getMonth(), 1); o.teclado = true; pinta();
  });
  $('seldlg') ? $('seldlg').appendChild(pop) : capaSelector(inp).appendChild(pop); pinta();
}

// ---------- Reloj: horas, minutos según el paso, «Ahora» ----------
function abrirReloj(inp, o) {
  o = o || {};
  const tipo = selTipo(inp);
  if (!o.desdeCal && (tipo === 'mes' || tipo === 'fechahora')) return abrirCalendario(inp);
  if (o.mismo && SELPOP) { SELPOP.remove(); SELPOP = null; } else cerrarSelector();
  const actual = tipo === 'fechahora' ? (inp.value || '').slice(11, 16) : (inp.value || '');
  const pasoMin = (() => { const s = +inp.step; const m = s >= 60 ? Math.round(s / 60) : 5; return [1, 2, 3, 4].includes(m) || m > 30 ? 5 : m; })();
  const redondea = x => Math.min(60 - pasoMin, Math.round(x / pasoMin) * pasoMin);
  const [h0, m0] = (actual || '09:00').split(':').map(Number);
  let h = isNaN(h0) ? 9 : h0, m = isNaN(m0) ? 0 : m0;
  const pop = document.createElement('div'); pop.className = 'selpop reloj'; SELPOP = pop; pop.__t = Date.now();
  pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-label', 'Elegir hora');
  const mins = Array.from({ length: Math.ceil(60 / pasoMin) }, (_, i) => i * pasoMin);
  const pinta = () => {
    pop.innerHTML = `${o.fecha ? `<div class="rjfecha"><span>${selFechaMedia(o.fecha)}</span><button type="button" data-rq="dia">Cambiar día</button></div>` : ''}
      <div class="rjh"><b>${selDos(h)}:${selDos(m)}</b></div>
      <div class="rjt">Hora</div><div class="rjg">${Array.from({ length: 24 }, (_, i) => `<button type="button" data-rh="${i}" class="${i === h ? 'sel' : ''}" aria-pressed="${i === h}">${selDos(i)}</button>`).join('')}</div>
      <div class="rjt">Minutos</div><div class="rjg m">${mins.map(i => `<button type="button" data-rm="${i}" class="${i === m ? 'sel' : ''}" aria-pressed="${i === m}">${selDos(i)}</button>`).join('')}</div>
      <div class="calp"><button type="button" data-rq="ahora">Ahora</button>${inp.required ? '' : '<button type="button" data-rq="borrar">Borrar</button>'}<button type="button" data-rq="ok" class="okb">Aceptar</button></div>`;
    colocarPop(pop, inp.closest('.selw') || inp);
  };
  pop.addEventListener('pointerdown', () => { pop.__t = Date.now(); });
  pop.addEventListener('click', e => {
    e.stopPropagation();
    const a = e.target.closest('[data-rh]'), b = e.target.closest('[data-rm]'), q = e.target.closest('[data-rq]');
    if (a) { h = +a.dataset.rh; pinta(); }
    if (b) { m = +b.dataset.rm; pinta(); }
    if (!q) return;
    const accion = q.dataset.rq;
    if (accion === 'dia') { abrirCalendario(inp, { fecha: o.fecha, mismo: true }); return; }
    if (accion === 'ahora') { const d = new Date(); h = d.getHours(); m = redondea(d.getMinutes()); pinta(); return; }
    const hora = `${selDos(h)}:${selDos(m)}`;
    inp.value = accion === 'borrar' ? '' : tipo === 'fechahora' ? `${o.fecha || (inp.value || hoyISO()).slice(0, 10)}T${hora}` : hora;
    emitir(inp); cerrarSelector(); inp.focus({ preventScroll: true });
  });
  $('seldlg') ? $('seldlg').appendChild(pop) : capaSelector(inp).appendChild(pop); pinta();
}

// Cada campo de fecha, hora o número se mejora al aparecer en pantalla
function mejorarCamposBase(raiz) {
  (raiz || document).querySelectorAll('input[type=date]:not([data-sel]), input[type=time]:not([data-sel]), input[type=number]:not([data-sel])').forEach(inp => {
    inp.dataset.sel = '1';
    if (inp.closest('.selpop')) return;
    if (inp.type === 'number') {
      if (inp.closest('.lrow') && inp.offsetWidth && inp.offsetWidth < 70) return;
      const w = document.createElement('span'); w.className = 'numw';
      inp.parentNode.insertBefore(w, inp); w.appendChild(inp);
      w.insertAdjacentHTML('afterbegin', '<button type="button" class="nb" data-nd="-1" aria-label="Menos" tabindex="-1">−</button>');
      w.insertAdjacentHTML('beforeend', '<button type="button" class="nb" data-nd="1" aria-label="Más" tabindex="-1">+</button>');
      if (inp.disabled) w.classList.add('dis');
      return;
    }
    const w = document.createElement('span'); w.className = 'selw ' + (inp.type === 'date' ? 'fecha' : 'hora');
    inp.parentNode.insertBefore(w, inp); w.appendChild(inp);
    w.insertAdjacentHTML('beforeend', `<span class="selico" aria-hidden="true">${inp.type === 'date' ? '📅' : '🕒'}</span>`);
    inp.dataset.ro = inp.readOnly ? '1' : '';
    inp.readOnly = true; inp.setAttribute('inputmode', 'none');
    // Se muestra el valor en formato español, sin depender del idioma del navegador
    w.insertAdjacentHTML('afterbegin', '<span class="selval"></span>');
    const desc = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
    Object.defineProperty(inp, 'value', { configurable: true, get() { return desc.get.call(this); }, set(v) { desc.set.call(this, v); valorVisible(this); } });
    inp.addEventListener('change', () => valorVisible(inp)); inp.addEventListener('input', () => valorVisible(inp));
    valorVisible(inp);
  });
}

function mejorarCamposBase2(raiz) {
  if (!raiz || raiz === document) return mejorarCamposBase(raiz);
  if (raiz.nodeType !== 1 || !raiz.querySelector && raiz.tagName !== 'INPUT') return;
  MEJ_PEND.add(raiz);
  if (MEJ_RAF) return;
  MEJ_RAF = 1; queueMicrotask(() => {
    MEJ_RAF = 0; const l = [...MEJ_PEND]; MEJ_PEND.clear();
    l.forEach(n => { if (n.isConnected && (n.tagName === 'INPUT' ? n.parentNode : n.querySelector('input[type=date],input[type=time],input[type=number]'))) mejorarCamposBase(n.tagName === 'INPUT' ? n.parentNode : n); });
  });
}

// Cantidades con botones; importes y porcentajes sin ellos (sumar de uno en uno a un importe no tiene sentido)
function mejorarCamposBase3(raiz) {
  (raiz || document).querySelectorAll('input[type=number]:not([data-sel])').forEach(i => {
    if (ES_IVA(i)) { ivaSelector(i); return; }
    const txt = (i.id + ' ' + (i.dataset.f || '') + ' ' + (i.placeholder || '') + ' ' + (((i.id && document.querySelector(`label[for="${i.id}"]`)) || i.closest('label') || {}).textContent || '')).toLowerCase();
    const decimal = /^(0?\.\d+|any)$/.test(i.getAttribute('step') || '');
    if (decimal || /€|precio|importe|coste|portes|env[ií]o|descuento|pvp|cobro|total|base/.test(txt)) { i.dataset.sel = '1'; i.classList.add('numdec'); }
  });
  return mejorarCamposBase2(raiz);
}

function mejorarCamposBase4(raiz) { mejorarCamposBase3(raiz); mejorarCamposNuevos(raiz); }

function mejorarCampos(raiz) { const r = mejorarCamposBase4(raiz); try { sinSelectorDelSistema(raiz || document); } catch (e) {} return r; }
