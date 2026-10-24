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
abrirCalendario = function (inp, o) {
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
};

// ---------- Reloj: horas, minutos según el paso, «Ahora» ----------
abrirReloj = function (inp, o) {
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
};

// ---------- Valor visible de mes y de fecha con hora ----------
valorVisible = (orig => function (inp) {
  const t = selTipo(inp);
  if (t !== 'mes' && t !== 'fechahora') return orig(inp);
  const w = inp.closest('.selw'), sp = w && w.querySelector('.selval'); if (!sp) return;
  const v = inp.value;
  if (!v) { sp.textContent = t === 'mes' ? 'Elige un mes' : 'Elige fecha y hora'; sp.classList.add('vacio'); return; }
  sp.classList.remove('vacio');
  if (t === 'mes') { const [y, mm] = v.split('-'); sp.textContent = `${MESES_L[+mm - 1] || ''} ${y}`; return; }
  sp.textContent = `${selFechaMedia(v.slice(0, 10))} · ${v.slice(11, 16)}`;
})(valorVisible);

mejorarCampos = (orig => function (raiz) { orig(raiz); mejorarCamposNuevos(raiz); })(mejorarCampos);
mejorarCamposNuevos(document);

// Números: mantener pulsado «+» o «−» repite; el último clic no suma otra vez
(function () {
  let t1 = 0, t2 = 0, repetido = false;
  const parar = () => { clearTimeout(t1); clearInterval(t2); t1 = t2 = 0; };
  document.addEventListener('pointerdown', e => {
    const nb = e.target.closest('.numw .nb'); if (!nb) return;
    repetido = false; parar();
    t1 = setTimeout(() => { t2 = setInterval(() => { repetido = true; nb.dispatchEvent(new MouseEvent('click', { bubbles: true })); }, 90); }, 450);
  });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => document.addEventListener(ev, parar, true));
  // En la ventana y en captura: va antes que el manejador de los botones, que está en el documento
  window.addEventListener('click', e => {
    if (e.isTrusted && repetido && e.target.closest && e.target.closest('.numw .nb')) { repetido = false; e.stopPropagation(); e.preventDefault(); }
  }, true);
})();
// La rueda del ratón no cambia un número sin querer
document.addEventListener('wheel', e => { const i = e.target; if (i && i.matches && i.matches('input[type=number]') && document.activeElement === i) i.blur(); }, { passive: true });
// Al escribir un número fuera de su mínimo o máximo, se corrige al salir del campo
document.addEventListener('change', e => {
  const i = e.target; if (!i.matches || !i.matches('input[type=number]') || i.value === '') return;
  let n = +i.value; if (isNaN(n)) return;
  if (i.min !== '' && n < +i.min) n = +i.min; if (i.max !== '' && n > +i.max) n = +i.max;
  if (n !== +i.value) { i.value = n; i.dispatchEvent(new Event('input', { bubbles: true })); }
}, true);

/* v2.109.0 · Las ventanas no muestran lo escrito en otras ocasiones. El navegador sugería, por ejemplo, la nota del pedido
   anterior al crear uno nuevo: los campos de las ventanas y de las pantallas no guardan historial (salvo los que lo piden). */
function sinHistorial(raiz) {
  (raiz || document).querySelectorAll('input:not([autocomplete]):not([type=checkbox]):not([type=radio]):not([type=file]):not([type=hidden]), textarea:not([autocomplete])')
    .forEach(i => i.setAttribute('autocomplete', 'off'));
}
// Una pasada por fotograma como mucho, aunque la pantalla cambie muchas veces seguidas
let sinHistorialPend = false;
const sinHistorialLuego = () => { if (sinHistorialPend) return; sinHistorialPend = true; requestAnimationFrame(() => { sinHistorialPend = false; sinHistorial(document.body); }); };
new MutationObserver(sinHistorialLuego).observe(document.body, { childList: true, subtree: true });
sinHistorial(document.body);

/* v2.109.0 · Permisos propios en los roles: importar, clasificadores y dar acceso.
   Configuración → Usuarios y roles → Roles tiene debajo de las plantillas la tabla «Permisos» (las capacidades del grupo
   «Permisos»; el resto de capacidades no se cambian desde aquí). Quien tiene «Dar acceso a fichas de su cartera» da acceso
   al portal desde la ficha, sin pasar por Usuarios: se crea la invitación ligada a la ficha y después el usuario. */
pintarRoles = (orig => async function (...a) {
  await orig(...a);
  if (!puede('administrar') || !$('cfgcuerpo')) return;
  const { data: caps } = await db.from('capacidades').select('clave,nombre,descripcion,orden').eq('grupo', 'Permisos').order('orden');
  if (!(caps || []).length || !$('cfgcuerpo') || $('rolperm')) return;
  const roles = rolesNombres().filter(r => !rolPuede(r, 'portal_prescriptor'));
  $('cfgcuerpo').insertAdjacentHTML('beforeend', `<div class="card cfgpanel" id="rolperm"><h2>Permisos</h2>
    <p class="sm">Lo que puede hacer cada rol además de sus módulos. Se aplica a todas las personas del rol al guardar.</p>
    <div class="dgrid-wrap"><table class="rolmat"><thead><tr><th>Permiso</th>${roles.map(r => `<th>${esc(r)}</th>`).join('')}</tr></thead>
      <tbody>${caps.map(c => `<tr><td><b>${esc(c.nombre)}</b><span class="sm">${esc(c.descripcion || '')}</span></td>
        ${roles.map(r => `<td><input type="checkbox" data-prol="${esc(r)}" data-pcap="${esc(c.clave)}" aria-label="${esc(c.nombre)} · ${esc(r)}" ${rolPuede(r, c.clave) ? 'checked' : ''}></td>`).join('')}</tr>`).join('')}</tbody></table></div>
    <div class="acts" style="justify-content:flex-end"><button class="btn" id="rolpermok">Guardar permisos</button></div></div>`);
  $('rolpermok').onclick = async ev => {
    ev.target.disabled = true;
    let fallo = false;
    for (const r of roles) {
      const lista = [...$('rolperm').querySelectorAll(`[data-prol="${CSS.escape(r)}"]:checked`)].map(x => x.dataset.pcap);
      const { data: x, error } = await db.rpc('guardar_permisos_rol', { p_rol: r, p_permisos: lista });
      if (error || (x && x.ok === false)) fallo = true;
    }
    ev.target.disabled = false;
    await cargarRoles();
    const { data: yo } = await db.from('perfiles').select('capacidades').eq('id', PERFIL.id).single();
    if (yo && Array.isArray(yo.capacidades)) PERFIL.capacidades = yo.capacidades;
    toast(fallo ? 'No se han podido guardar todos los permisos' : 'Permisos guardados', fallo);
  };
})(pintarRoles);


/* v2.111.0 · Teclado en escritorio.
   1. Buscadores: con las flechas se recorren los resultados (el desplegable de sugerencias o, en los buscadores que filtran
      una lista o una tabla, sus filas) e Intro abre el marcado. El elemento marcado lleva la clase .activo.
   2. F5 (o Ctrl+R) recarga la app y vuelve a la pantalla en la que se estaba; Ctrl+F5 (o Ctrl+Mayús+R) entra de cero. */
const TECLA_LISTAS = '.gsug, .cpres, .lista, .dgrid, [role=listbox], table';
const teclaVisible = x => x.offsetParent !== null && !x.classList.contains('hide');
function teclaLista(inp) {
  const caja = inp.closest('.gsearch, .picker, .cpbus');
  if (caja) return caja.querySelector('.gsug, .cpres');
  // Lo primero con resultados que haya después del buscador, en su ventana o en su pantalla
  const zona = inp.closest('dialog, section, .card') || document.body;
  return [...zona.querySelectorAll(TECLA_LISTAS)].find(l => (inp.compareDocumentPosition(l) & Node.DOCUMENT_POSITION_FOLLOWING)
    && !l.closest('.hide') && teclaItems(l).length) || null;
}
function teclaItems(l) {
  const xs = l.matches('table') ? [...l.querySelectorAll(':scope > tbody > tr')]
    : l.matches('.dgrid') ? [...l.querySelectorAll(':scope > .dr')]
    : l.matches('.lista') ? [...l.children]
    : [...l.querySelectorAll('button, [role=option], a[href]')];
  return xs.filter(x => teclaVisible(x) && !x.matches('.gsh, .gload, .vacio, [disabled]'));
}
// Solo los buscadores: los de tipo búsqueda y los campos con su lista de resultados justo debajo
const esBuscador = i => i && i.matches && i.matches('input') && !i.list && (i.type === 'search' || (!!i.nextElementSibling && i.nextElementSibling.matches('.gsug, .cpres, .lista, [role=listbox]')));
function teclaActivar(x) {
  const b = x.matches('button, a[href], [role=option], tr, .dr') ? x : (x.querySelector('button, a[href], [data-inificha]') || x);
  b.click();
}
document.addEventListener('keydown', e => {
  if (!['ArrowDown', 'ArrowUp', 'Enter'].includes(e.key) || e.altKey || e.ctrlKey || e.metaKey || !esBuscador(e.target)) return;
  const l = teclaLista(e.target); if (!l) return;
  const its = teclaItems(l); if (!its.length) return;
  let i = its.findIndex(x => x.classList.contains('activo'));
  if (e.key === 'Enter') {
    if (i < 0) return;
    e.preventDefault(); e.stopImmediatePropagation(); teclaActivar(its[i]); return;
  }
  e.preventDefault();
  its.forEach(x => { x.classList.remove('activo'); x.removeAttribute('aria-selected'); });
  i = e.key === 'ArrowDown' ? (i + 1) % its.length : (i <= 0 ? its.length - 1 : i - 1);
  its[i].classList.add('activo'); its[i].setAttribute('aria-selected', 'true'); its[i].scrollIntoView({ block: 'nearest' });
}, true);
// Al escribir de nuevo, la marca se quita (los resultados cambian); con el ratón, la marca sigue al puntero
document.addEventListener('input', e => {
  if (!esBuscador(e.target)) return;
  const l = teclaLista(e.target); if (l) l.querySelectorAll('.activo').forEach(x => { x.classList.remove('activo'); x.removeAttribute('aria-selected'); });
}, true);
document.addEventListener('mouseover', e => {
  const l = e.target.closest && e.target.closest('.gsug, .cpres'); if (!l) return;
  const x = teclaItems(l).find(y => y.contains(e.target)); if (!x || x.classList.contains('activo')) return;
  l.querySelectorAll('.activo').forEach(y => { y.classList.remove('activo'); y.removeAttribute('aria-selected'); });
  x.classList.add('activo');
});

// La clave va escrita en cada sitio: el arranque lee la pantalla guardada antes de que se evalúe el final de este archivo
document.addEventListener('keydown', e => {
  const f5 = e.key === 'F5', r = (e.ctrlKey || e.metaKey) && (e.key === 'r' || e.key === 'R');
  if (!f5 && !r) return;
  const completa = f5 ? (e.ctrlKey || e.shiftKey) : e.shiftKey;
  try {
    if (completa || !PERFIL) sessionStorage.removeItem('dlc-f5');
    else sessionStorage.setItem('dlc-f5', JSON.stringify({ t: TAB, c: CFG_SEC, s: CFG_SUB, p: PAG_TAB, h: Date.now() }));
  } catch (x) {}
  // La recarga la hace el navegador (en Ctrl+F5, sin caché)
});
function pantallaTrasF5() {
  let v = null;
  try { v = JSON.parse(sessionStorage.getItem('dlc-f5') || 'null'); sessionStorage.removeItem('dlc-f5'); } catch (x) { v = null; }
  // Solo si se acaba de pulsar (una recarga horas después, o desde el botón del navegador, entra por el inicio)
  return v && v.t && Date.now() - (v.h || 0) < 60000 ? v : null;
}

// v2.112.0 · Ventanas: al abrir, el foco no se queda en la X (se veía un recuadro de foco sin haber usado el teclado)
// y, al desplazar una ventana larga, la cabecera muestra una línea de separación
(() => {
  const sinFocoX = d => {
    d.classList.remove('desplazada');
    const a = document.activeElement;
    if (a && a.classList && a.classList.contains('x') && d.contains(a)) {
      if (!d.hasAttribute('tabindex')) d.setAttribute('tabindex', '-1');
      d.focus({ preventScroll: true });
    }
  };
  const abrir = HTMLDialogElement.prototype.showModal;
  HTMLDialogElement.prototype.showModal = function () { abrir.apply(this, arguments); sinFocoX(this); };
  // #dlg tiene su propia apertura (paneles de Configuración): se envuelve también
  const dl = $('dlg'), propia = dl.showModal;
  dl.showModal = function () { propia.apply(this, arguments); if (this.open) sinFocoX(this); };
  document.addEventListener('scroll', e => {
    const d = e.target;
    if (d && d.tagName === 'DIALOG') d.classList.toggle('desplazada', d.scrollTop > 4);
  }, true);
})();


/* v2.115.0 · Justificante del pago: una foto (se reduce a 1600 px en JPEG antes de subirla) o un PDF de hasta 3 MB,
   guardado en la tabla pedidos_justificantes. Lo ve quien ve el pedido. */
const JUSTIF_MAX = 3000000;
const aBase64 = blob => new Promise((ok, mal) => { const fr = new FileReader(); fr.onload = () => ok(String(fr.result).split(',')[1] || ''); fr.onerror = mal; fr.readAsDataURL(blob); });
async function verJustificante(id) {
  const { data, error } = await db.from('pedidos_justificantes').select('nombre,tipo,datos').eq('id', id).single();
  if (error || !data) { toast('No se ha podido abrir el justificante', true); return; }
  const bin = atob(data.datos), u8 = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  const url = URL.createObjectURL(new Blob([u8], { type: data.tipo }));
  const w = window.open(url, '_blank');
  if (!w) { const a = document.createElement('a'); a.href = url; a.download = data.nombre; a.click(); }
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

// Ver pedido · Pago: origen, referencia (editable por quien lleva la operativa) y justificantes (añadir, ver y quitar)
async function pedidoPago(id) {
  if (!$('dlg').open || $('pdpago')) return;
  const [{ data }, { data: js }] = await Promise.all([RPC_ORIG('pedido_detalle', { p_id: id }),
    db.from('pedidos_justificantes').select('id,nombre,tipo,tamano,creado_por,creado_en').eq('pedido_id', id).order('creado_en')]);
  const p = data && data.pedido; if (!p || !$('dlg').open || $('pdpago')) return;
  const edita = puede('administrar') || (VE_TODO() && nivelDe2('V') >= 2);
  const acts = $('dbody').querySelector('.acts:last-of-type'); if (!acts) return;
  const ref = $('pdops') || acts;
  ref.insertAdjacentHTML('beforebegin', `<div class="blk" id="pdpago"><h3>Pago</h3>
    ${p.origen === 'web' ? '<p class="sm"><span class="pill p-est">Pedido por la web</span></p>' : ''}
    ${edita ? `<div class="g2"><div><label for="pdref">Referencia del pago</label><input id="pdref" value="${esc(p.pago_referencia || '')}" placeholder="Código de la transferencia, bizum…"></div>
        <div style="align-self:end"><button type="button" class="btn sec" id="pdrefok">Guardar referencia</button></div></div>`
      : `<p class="sm">Referencia: ${p.pago_referencia ? `<b>${esc(p.pago_referencia)}</b>` : 'sin referencia'}</p>`}
    <div class="lista" id="pdjus">${(js || []).map(j => `<div class="item"><span class="tx"><b>📎 ${esc(j.nombre)}</b><span class="sm">${fechaCorta(String(j.creado_en).slice(0, 10))} · ${num(Math.round(j.tamano / 1024))} KB</span></span>
      <button type="button" class="btn sec chico" data-jver="${j.id}">Ver</button>${j.creado_por === PERFIL.id || puede('administrar') ? `<button type="button" class="btn sec chico" data-jdel="${j.id}" aria-label="Quitar ${esc(j.nombre)}">Quitar</button>` : ''}</div>`).join('')
      || '<div class="sm">Sin justificante.</div>'}</div>
    <label class="btn sec chico" style="margin-top:8px;display:inline-flex">📎 Añadir justificante<input type="file" id="pdjusf" accept="image/*,application/pdf" data-fp="1" hidden></label></div>`);
  const repinta = () => { const b = $('pdpago'); if (b) b.remove(); pedidoPago(id); };
  if ($('pdrefok')) $('pdrefok').onclick = async ev => {
    ev.target.disabled = true;
    const { data: r, error } = await db.rpc('guardar_referencia_pago', { p_pedido: id, p_referencia: $('pdref').value });
    ev.target.disabled = false;
    toast(error || (r && r.ok === false) ? 'No se ha podido guardar la referencia' : 'Referencia guardada', !!(error || (r && r.ok === false)));
  };
  $('pdjusf').onchange = async e => {
    const f = e.target.files[0]; e.target.value = ''; if (!f) return;
    const j = await leerJustificante(f); if (!j) return;
    const { error } = await db.from('pedidos_justificantes').insert({ pedido_id: id, nombre: j.nombre, tipo: j.tipo, tamano: j.tamano, datos: j.datos });
    if (error) { toast('No se ha podido subir el justificante', true); return; }
    toast('Justificante añadido'); repinta();
  };
  $('pdpago').querySelectorAll('[data-jver]').forEach(b => b.onclick = () => verJustificante(b.dataset.jver));
  $('pdpago').querySelectorAll('[data-jdel]').forEach(b => b.onclick = async () => {
    if (!await preguntar('¿Quitar este justificante del pedido?', { titulo: 'Quitar justificante', ok: 'Quitar' })) return;
    const { error } = await db.from('pedidos_justificantes').delete().eq('id', b.dataset.jdel);
    if (error) { toast('No se ha podido quitar', true); return; }
    toast('Justificante quitado'); repinta();
  });
}


/* v2.117.0 · Planes por usuario: Campo, Comercial, Empresa y A medida (precio por usuario y mes, IVA no incluido; con pago anual
   se pagan 10 meses de 12). Mínimo 3 usuarios salvo A medida; se añaden o quitan cuando se quiera. El plan de cada empresa
   (ajustes.plan: plan, usuarios contratados, pago, estado y, en prueba, prueba_hasta) solo se cambia desde la plataforma. */
PLANES.splice(0, PLANES.length,
  { id: 'campo', nombre: 'Campo', precio: 29, anual: 24, minimo: 3, incluidos: 3, bloque: [1, 29], medicos: 0,
    para: `Equipos que salen a ver ${TT('medico', 'p', '', 'l', 'l')} cada día`,
    modulos: ['inicio', 'agenda', 'rutas', 'directorio', 'seguimiento'],
    ventajas: [`Cartera de ${TT('medico', 'p', '', 'l', 'l')} y centros`, `Agenda, «Tu día» y registro de ${TT('visita', 'p', '', 'l', 'l')}`,
      'Rutas y planificación semanal', 'Muestras y material', 'Calidad del dato y duplicados'] },
  // El nombre del plan va entre comillas dobles: no es el rol «Comercial» (la prueba de literales busca roles escritos a mano)
  { id: 'comercial', nombre: "Comercial", precio: 42, anual: 35, minimo: 3, incluidos: 3, bloque: [1, 42], medicos: 0,
    para: 'Equipos que venden y quieren medir resultados',
    modulos: ['inicio', 'agenda', 'rutas', 'directorio', 'seguimiento', 'ventas', 'pacientes', 'productos', 'analitica'],
    ventajas: ['Todo lo de Campo', 'Pedidos, televenta y clientes', 'Productos y stock por lotes', `Analítica de ventas y ${TT('visita', 'p', '', 'l', 'l')}`, 'Comisiones por tramos'] },
  { id: 'empresa', nombre: 'Empresa', precio: 59, anual: 49, minimo: 3, incluidos: 3, bloque: [1, 59], medicos: 50,
    para: 'Empresas con facturación propia y varios equipos',
    modulos: ['inicio', 'agenda', 'rutas', 'directorio', 'seguimiento', 'ventas', 'pacientes', 'productos', 'analitica', 'facturacion'],
    ventajas: ['Todo lo de Comercial', 'Facturación con VeriFactu y cobros', 'Compras, proveedores y trazabilidad', 'Zonas, supervisión del equipo y auditoría',
      `Espacio ${TT('medico', 's', 'del', 'l', 'l')} (hasta 50)`] },
  { id: 'medida', nombre: 'A medida', precio: null, anual: null, minimo: 50, incluidos: 50, bloque: [1, 0], medicos: null, presupuesto: true,
    para: 'Redes comerciales grandes, desde 50 usuarios',
    modulos: ['inicio', 'agenda', 'rutas', 'directorio', 'seguimiento', 'ventas', 'pacientes', 'productos', 'analitica', 'facturacion'],
    ventajas: ['Todo lo de Empresa', 'Migración de datos', 'Conexión con tu programa de gestión', `Espacio ${TT('medico', 's', 'del', 'l', 'l')} sin límite`,
      'Ver la plataforma como cada persona de tu equipo, para ayudarla', 'Soporte prioritario'] });
const PUESTA_EN_MARCHA = 490;
const precioPlan = p => p.presupuesto ? 'presupuesto a medida' : `${eurI(p.precio)} por usuario al mes, ${eurI(p.anual)} con pago anual`;
// Usuarios contratados (A medida o sin dato: sin límite)
const usuariosContratados = () => PLAN_ACTUAL.plan === 'medida' || PLAN_ACTUAL.usuarios == null ? Infinity : +PLAN_ACTUAL.usuarios;

// Plan y suscripción: tu plan (usuarios contratados, pago, prueba), los cuatro planes y la comparativa por módulos
pintarPaginaPlan = async function () {
  const { data } = await RPC_ORIG('plan_uso', {});
  const d = data || {}, pl = d.plan || {}; if (pl.plan) PLAN_ACTUAL = pl;
  const act = planDe(pl.plan), contr = usuariosContratados(), usados = +d.usuarios || 0, anual = pl.pago === 'anual';
  const pct = contr === Infinity ? 0 : Math.min(100, Math.round(usados / contr * 100));
  // Con pago anual se pagan 10 meses de 12: la cuota mensual equivalente es precio × 10 / 12
  const cuota = act.presupuesto || contr === Infinity ? null : contr * (anual ? act.precio * 10 / 12 : act.precio);
  const mailto = asunto => 'mailto:?subject=' + encodeURIComponent(asunto + ' · ' + ((AJUSTES.marca || {}).nombre || ''));
  const cont = $('cfgcuerpo'); if (!cont) return;
  // El plan que se destaca es el siguiente al tuyo (con A medida, ninguno)
  const siguiente = PLANES[PLANES.indexOf(act) + 1] || null;
  // v2.120.0: «incluido» y «no incluido» como icono y raya suave, con su texto para lectores de pantalla
  const celda = (p, v) => `<td class="${p.id === act.id ? 'act' : ''}">${v === '✓' ? `<span class="si" role="img" aria-label="Incluido">${svgIco(ICON_NOM.check)}</span>`
    : v === '—' ? '<span class="no" role="img" aria-label="No incluido">—</span>' : v}</td>`;
  cont.innerHTML = `${TAB === 'organizacion' || TAB === 'config' ? '<p class="sm">Precio por usuario y mes, IVA no incluido. Con pago anual pagas 10 meses de 12.</p>' : '<div class="saludo"><div><h1>Plan y suscripción</h1><div class="fecha">Precio por usuario y mes, IVA no incluido. Con pago anual pagas 10 meses de 12.</div></div></div>'}
    <div class="card" id="planact"><h2>Tu plan: ${esc(act.nombre)}</h2>
      ${pl.estado === 'prueba' ? `<div class="banda-aviso">Estás en la prueba gratuita hasta el <b>${fechaCorta(pl.prueba_hasta)}</b>. Sin permanencia: si no sigues, te llevas tus datos.</div>` : ''}
      <div class="kpis">
        <div class="kpi"><b>${contr === Infinity ? 'Sin límite' : num(contr)}</b><span>Usuarios contratados</span></div>
        <div class="kpi"><b>${num(usados)}</b><span>Usuarios en uso</span></div>
        <div class="kpi"><b>${act.presupuesto ? 'A medida' : anual ? 'Anual' : 'Mensual'}</b><span>Pago</span></div>
        ${cuota != null ? `<div class="kpi"><b>${eurI(cuota)}</b><span>Al mes, sin IVA</span></div>` : ''}
        ${act.medicos !== 0 ? `<div class="kpi"><b>${num(d.medicos || 0)}${act.medicos ? ' / ' + act.medicos : ''}</b><span>${TT('medico', 'p', '', 'l', 'C')} con acceso</span></div>` : ''}
      </div>
      ${contr !== Infinity ? `<div class="barrauso" title="${num(usados)} de ${num(contr)}"><i style="width:${pct}%"></i></div>` : ''}
      ${contr !== Infinity && usados > contr ? `<div class="banda-aviso" id="plansobre">Tienes ${usados - contr === 1 ? '1 usuario' : num(usados - contr) + ' usuarios'} más de ${num(contr)} contratados. Añádelos a tu plan o desactiva los que ya no usen la plataforma.</div>` : ''}
      <div class="acts"><a class="btn sec" href="${mailto('Cambiar el número de usuarios')}">Añadir o quitar usuarios</a></div></div>
    <div class="planes">${PLANES.map(p => `<div class="plan ${p.id === act.id ? 'actual' : ''} ${p === siguiente ? 'dest' : ''}" data-plan="${p.id}">
      <h3>${esc(p.nombre)}</h3><div class="sm">${esc(p.para)}</div>
      <div class="precio">${p.presupuesto ? '<b>A medida</b> <span class="sm">Presupuesto · desde 50 usuarios</span>'
        : `<b>${eurI(p.precio)}</b> <span class="sm">por usuario al mes · ${eurI(p.anual)} con pago anual (${eurI(p.precio * 10)} al año)</span>`}</div>
      <ul class="manlist">${p.ventajas.map(v => `<li><span>✓</span><span>${esc(v)}</span></li>`).join('')}</ul>
      ${p.id === act.id ? '<button class="btn sec" disabled>Tu plan actual</button>'
        : `<a class="btn ${p === siguiente ? '' : 'sec'}" href="${mailto(p.presupuesto ? 'Presupuesto del plan A medida' : 'Cambiar al plan ' + p.nombre)}">${p.presupuesto ? 'Pedir presupuesto' : 'Cambiar a ' + esc(p.nombre)}</a>`}</div>`).join('')}</div>
    <div class="card" id="plancond"><h2>Condiciones</h2><ul class="manlist">
      <li><span>✓</span><span>Mínimo 3 usuarios en Campo, Comercial y Empresa. Añades o quitas usuarios cuando quieras.</span></li>
      <li><span>✓</span><span>Puesta en marcha (importar tus Excel, configurar la empresa y formar al equipo): incluida con pago anual; con pago mensual, ${eurI(PUESTA_EN_MARCHA)} una sola vez.</span></li>
      <li><span>✓</span><span>Prueba de 30 días con tus propios datos, sin permanencia. Si no sigues, te llevas tus datos.</span></li>
      <li><span>✓</span><span>Desarrollos y configuraciones a medida: presupuesto según lo que necesites.</span></li></ul></div>
    <div class="card"><h2>Qué incluye cada plan</h2><div class="dgrid-wrap"><table class="planmat"><thead><tr><th>Módulo</th>${PLANES.map(p => `<th class="${p.id === act.id ? 'act' : ''}">${esc(p.nombre)}</th>`).join('')}</tr></thead>
      <tbody>${MOD_PLAN.map(([m, n, desc]) => `<tr><td><b>${esc(n)}</b><span class="sm">${esc(desc)}</span></td>${PLANES.map(p => celda(p, p.modulos.includes(m) ? '✓' : '—')).join('')}</tr>`).join('')}
        <tr><td><b>Espacio ${TT('medico', 's', 'del', 'l', 'l')}</b><span class="sm">Su informe y sus avisos</span></td>${PLANES.map(p => celda(p, p.medicos === 0 ? '—' : p.medicos ? 'Hasta ' + p.medicos : 'Sin límite')).join('')}</tr>
        <tr><td><b>Ver la plataforma como cada persona</b><span class="sm">De tu equipo, para ayudarla</span></td>${PLANES.map(p => celda(p, p.id === 'medida' ? '✓' : '—')).join('')}</tr>
        <tr><td><b>Precio por usuario</b><span class="sm">Al mes, IVA no incluido</span></td>${PLANES.map(p => celda(p, p.presupuesto ? 'A medida' : eurI(p.precio) + ' · ' + eurI(p.anual) + ' anual')).join('')}</tr>
      </tbody></table></div></div>`;
};


function orgEstado(o) {
  const pd = o.plan_datos || {};
  if (o.bloqueada === 'desactivada') return '<span class="pill p-anu">Desactivada</span> ';
  if (o.bloqueada === 'prueba_terminada') return `<span class="pill p-warn">Prueba terminada el ${fechaCorta(pd.prueba_hasta)}</span> `;
  if (pd.estado === 'prueba') return `<span class="pill p-est">Prueba hasta el ${fechaCorta(pd.prueba_hasta)}</span> `;
  return '';
}
function orgAcciones(c, l) {
  const de = id => l.find(x => x.id === id);
  // Plan: el de pago o una prueba (con su fecha de fin)
  c.querySelectorAll('[data-orgplan]').forEach(b => b.onclick = () => {
    const o = de(b.dataset.orgplan); if (!o) return;
    const pd = o.plan_datos || {}, fin = pd.prueba_hasta || new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);
    $('dbody').innerHTML = `<div class="fh"><div><h2>Plan de ${esc(o.nombre)}</h2><div class="sm">Solo la plataforma cambia el plan de una empresa</div></div>
        <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
      <div class="g2"><div><label for="opplan">Plan</label><select id="opplan">${PLANES.map(p => `<option value="${p.id}" ${p.id === (pd.plan || o.plan) ? 'selected' : ''}>${esc(p.nombre)}</option>`).join('')}</select></div>
        <div><label for="opusu">Usuarios contratados</label><input id="opusu" type="number" min="3" value="${esc(pd.usuarios == null ? '' : pd.usuarios)}" placeholder="Sin límite"></div>
        <div><label for="oppago">Pago</label><select id="oppago"><option value="mensual">Mensual</option><option value="anual" ${pd.pago === 'anual' ? 'selected' : ''}>Anual</option></select></div>
        <div><label for="opest">Estado</label><select id="opest"><option value="activo">De pago</option><option value="prueba" ${pd.estado === 'prueba' ? 'selected' : ''}>Prueba</option></select></div>
        <div id="opfinw" class="${pd.estado === 'prueba' ? '' : 'hide'}"><label for="opfin">Prueba hasta</label><input id="opfin" type="date" value="${esc(fin)}"></div></div>
      <div class="acts" style="justify-content:flex-end"><button class="btn sec" data-cerrar>Cancelar</button><button class="btn" id="opok">Guardar plan</button></div>`;
    $('opest').onchange = () => $('opfinw').classList.toggle('hide', $('opest').value !== 'prueba');
    $('opok').onclick = async ev => {
      ev.target.disabled = true;
      const { data: r, error } = await db.rpc('guardar_plan_organizacion', { p_org: o.id, p: { plan: $('opplan').value, usuarios: $('opusu').value === '' ? null : +$('opusu').value,
        pago: $('oppago').value, estado: $('opest').value, prueba_hasta: $('opest').value === 'prueba' ? $('opfin').value : null } });
      ev.target.disabled = false;
      if (error || !r || !r.ok) {
        toast(({ permiso: 'No tienes permiso', minimo: 'Mínimo 3 usuarios (salvo A medida)', prueba_hasta: 'Falta la fecha de fin de la prueba', plan: 'Plan no válido' })[(r && r.error) || ''] || 'No se ha podido guardar', true);
        return;
      }
      $('dlg').close(); toast('Plan guardado'); pintarOrganizaciones();
    };
    $('dlg').showModal();
  });
  // Descargar todos sus datos (para entregárselos si deja la prueba)
  c.querySelectorAll('[data-orgexp]').forEach(b => b.onclick = async () => {
    const o = de(b.dataset.orgexp); if (!o) return;
    b.disabled = true; const t = b.textContent; b.textContent = 'Preparando…';
    const { data, error } = await RPC_ORIG('exportar_organizacion', { p_org: o.id });
    b.disabled = false; b.textContent = t;
    if (error || !data) { toast('No se han podido descargar sus datos', true); return; }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' }));
    a.download = `datos_${o.nombre.replace(/[^\p{L}\p{N}]+/gu, '_')}_${hoyISO()}.json`; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 60000);
    toast('Datos descargados');
  });
  // Borrar una empresa de prueba o desactivada (nunca con facturas): hay que escribir su nombre
  c.querySelectorAll('[data-orgdel]').forEach(b => b.onclick = async () => {
    const o = de(b.dataset.orgdel); if (!o) return;
    if (o.facturas) { toast(`${o.nombre} tiene facturas emitidas: no se puede borrar (VeriFactu). Desactívala en su lugar.`, true); return; }
    const txt = await pedirTexto(`Se borrarán ${o.nombre} y todos sus datos (${num(o.usuarios)} usuarios, ${num(o.cuentas)} cuentas, pedidos, agenda…). No se puede deshacer: descarga antes sus datos si hay que entregárselos. Escribe su nombre para confirmarlo.`,
      '', { titulo: 'Borrar empresa', ok: 'Borrar' });
    if (txt === null) return;
    if (txt.trim() !== o.nombre) { toast('El nombre no coincide: no se ha borrado nada', true); return; }
    const { data: r, error } = await db.rpc('borrar_organizacion', { p_org: o.id });
    if (error || !r || !r.ok) {
      toast(({ permiso: 'No tienes permiso', principal: 'La organización principal no se puede borrar', activa: 'Solo se borran empresas de prueba o desactivadas',
        facturas: 'Tiene facturas emitidas: no se puede borrar' })[(r && r.error) || ''] || ('No se ha podido borrar' + (error ? ': ' + error.message : '')), true);
      return;
    }
    toast(`${o.nombre} borrada` + (String(r.acceso || '').startsWith('no_borrado') ? '. Borra sus usuarios en Supabase → Authentication.' : ''));
    pintarOrganizaciones();
  });
}

