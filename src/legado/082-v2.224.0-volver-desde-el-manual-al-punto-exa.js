/* v2.224.0 · Volver desde el manual al punto exacto (aviso de Eric: al pulsar un «?» y llegar al manual faltaba una flecha para volver).
   - Al entrar en el manual desde otra pantalla se guarda dónde estaba (MANUAL_VUELTA: pantalla y desplazamiento); la pestaña de cada página,
     el apartado de Configuración y el día de la Agenda ya se recuerdan solos (PAG_TAB, CFG_KEY, AG_FECHA).
   - La cabecera del manual lleva «‹ Volver a …» (#manvolver): vuelve a esa pantalla y, cuando ha terminado de pintarse, al mismo punto. */
let MANUAL_VUELTA = null;
function nombrePantalla(t) {
  const b = document.querySelector(`nav.main [data-t="${t}"]`);
  const n = (b && b.textContent.trim()) || (typeof PAGINAS !== 'undefined' && PAGINAS[t] && PAGINAS[t].t) || (t === 'config' ? 'Configuración' : '');
  return n || 'donde estabas';
}
ir = (orig => function (t, ...r) {
  if (t === 'manual' && TAB !== 'manual') MANUAL_VUELTA = { tab: TAB, y: window.scrollY || 0 };
  return orig.call(this, t, ...r);
})(ir);
async function volverDelManual() {
  const v = MANUAL_VUELTA; MANUAL_VUELTA = null;
  if (!v) { ir('inicio'); return; }
  ir(v.tab);
  // Espera a que la pantalla esté pintada (sin «preparando») y tenga alto suficiente para volver al mismo punto
  const fin = Date.now() + 4000;
  while (Date.now() < fin) {
    await new Promise(res => setTimeout(res, 120));
    const sec = $('v-' + v.tab) || document.querySelector('main > section:not(.hide)');
    const listo = !document.querySelector('main > section.preparando') && (!sec || !sec.classList.contains('cargando'));
    if (listo && document.documentElement.scrollHeight - innerHeight >= v.y - 2) break;
  }
  window.scrollTo(0, v.y);
}
cargarManual = (orig => async function (...a) {
  const r = await orig.apply(this, a);
  const h = document.querySelector('#v-manual .saludo');
  if (h && MANUAL_VUELTA && !$('manvolver')) {
    h.insertAdjacentHTML('afterbegin', `<button type="button" class="manvuelta" id="manvolver"><b aria-hidden="true">‹</b> Volver a ${esc(nombrePantalla(MANUAL_VUELTA.tab))}</button>`);
    $('manvolver').onclick = () => volverDelManual();
  }
  return r;
})(cargarManual);


/* v2.225.0 · Clientes sin duplicados (aviso de Eric: no se puede dar de alta otra vez a un cliente con el mismo NIF/CIF, correo o móvil).
   - La base no lo deja (disparador contactos_sin_duplicados, SQL 134); aquí se avisa mientras se escribe: clientes_coincidencias con lo que
     hay en NIF, correo, móvil y teléfono (sin contar el propio cliente al editarlo).
   - Aviso #kodup encima de los botones: «Este cliente ya existe · mismo móvil», con su nombre y datos y un botón:
     «Usar este cliente» si se viene de un pedido o de una nueva venta (carga sus datos de un clic), «Ver su ficha» en el resto.
     Si lo lleva otra persona y no se puede ver, solo se dice que existe. Mientras haya coincidencia, Crear queda desactivado. */
editorContacto = (orig => function (c, alGuardar, op) {
  const r = orig.apply(this, arguments);
  c = c || {};
  if (!$('konif') || !$('kook')) return r;
  const acts = $('kook').closest('.acts');
  if (acts && !$('kodup')) acts.insertAdjacentHTML('beforebegin', '<div id="kodup" class="kodup hide" role="alert" aria-live="polite"></div>');
  const ids = ['konif', 'komail', 'komov', 'kotel'];
  const leer = () => ({ nif: $('konif').value, email: $('komail').value, movil: $('komov').value, telefono: $('kotel').value, excluir: c.id || null });
  const hayDato = d => d.nif.replace(/[^A-Za-z0-9]/g, '').length >= 8 || /.@.+\../.test(d.email) || [d.movil, d.telefono].some(x => x.replace(/\D/g, '').length >= 9);
  const usar = !c.id && !!alGuardar && TAB !== 'pacientes';
  let t = null, turno = 0;
  const pintar = x => {
    const k = $('kodup'); if (!k) return;
    ids.forEach(id => $(id) && $(id).classList.remove('campodup'));
    [$('kook'), $('kopedido')].filter(Boolean).forEach(b => { b.disabled = !!x; });
    if (!x) { k.classList.add('hide'); k.innerHTML = ''; return; }
    const marca = { NIF: ['konif'], correo: ['komail'] }[x.campo] || ['komov', 'kotel'].filter(id => $(id).value.replace(/\D/g, '').length >= 9);
    marca.forEach(id => $(id) && $(id).classList.add('campodup'));
    k.innerHTML = x.visible
      ? `<div class="kodupt"><b>${TT('paciente', 's', 'este', 'C', 'l')} ya existe</b><span>mismo ${esc(x.campo)}</span></div>
         <div class="kodupc"><b>${esc(x.nombre || '')}</b><span class="sm">${esc([x.nif, x.movil || x.telefono, x.email, x.municipio].filter(Boolean).join(' · '))}</span></div>
         <button type="button" class="btn" id="kodupusar">${usar ? `Usar ${TT('paciente', 's', 'este', 'l', 'l')}` : 'Ver su ficha'}</button>`
      : `<div class="kodupt"><b>Ya existe ${TT('paciente', 's', 'un', 'l', 'l')} con ese ${esc(x.campo)}</b></div>
         <div class="sm">Lo lleva otra persona del equipo: pide que te lo asignen en lugar de crearlo de nuevo.</div>`;
    k.classList.remove('hide');
    if ($('kodupusar')) $('kodupusar').onclick = () => {
      $('dlg2').close();
      const res = Object.assign({}, x, x.cuenta_id ? { medico: x.cuenta, medico_codigo: x.cuenta_codigo } : {});
      if (usar) alGuardar(res); else fichaPaciente(x.id);
    };
  };
  const comprobar = () => {
    clearTimeout(t);
    t = setTimeout(async () => {
      const d = leer(), mio = ++turno;
      if (!hayDato(d)) { pintar(null); return; }
      const { data } = await db.rpc('clientes_coincidencias', { p: d });
      if (mio !== turno || !$('kodup')) return;
      pintar(Array.isArray(data) && data.length ? data[0] : null);
    }, 350);
  };
  ids.forEach(id => $(id) && $(id).addEventListener('input', comprobar));
  if (!c.id && hayDato(leer())) comprobar();
  return r;
})(editorContacto);

/* v2.226.0 · Arreglos de la lista de Eric (9/10/2026).
   1. Una sola ayuda por pantalla: fuera el «?» del manual (.manq); cada título lleva su «i» (las páginas nuevas también: Ciclo, Intervenciones,
      Eventos…) y la ventanita de la «i» termina con «Ver en el manual de uso», que abre el manual en el apartado de esa pantalla; desde allí,
      «‹ Volver a …» devuelve al mismo punto (v2.224.0).
   2. Agenda: el selector «Mi agenda» y el botón «Equipo» se reponen siempre que la cabecera se vuelve a pintar (al pulsar Día se pintaba dos
      veces seguidas y se perdían) y, dentro de Equipo, el botón pasa a «Mi agenda» para volver de un clic.
   3. Una tarea hecha se abre en modo lectura, con «Volver a pendiente» y «Borrar».
   4. Pedidos: fuera la tarjeta «Pedidos sin atribuir».
   5. Menú de la persona: sin «Organización» (está dentro de Configuración); «Manual de uso» y «Reportar un problema», aparte, como ayuda. */
ponerAyudaManual = function () {
  document.querySelectorAll('.manq').forEach(b => b.remove());
  if (ES_MEDICO() || TAB === 'manual' || TAB === 'delcos' || /^pd-/.test(TAB)) return;   // el Panel delcos es interno
  const v = $('v-' + TAB), h = v && v.querySelector('.saludo h1'); if (!h) return;
  const sal = h.closest('.saludo') || h;
  if (sal.querySelector('.ai')) return;
  if (AYUDA[TAB]) { h.insertAdjacentHTML('beforeend', `<button class="ai" data-ayuda="${TAB}" aria-label="Ayuda">i</button>`); return; }
  const P = (typeof PAGINAS !== 'undefined' && PAGINAS[TAB]) || {};
  h.insertAdjacentHTML('beforeend', `<button class="ai" data-ayuda-tit="${esc(P.t || h.textContent.trim())}" data-ayuda-txt="${esc(P.d || '')}" aria-label="Ayuda">i</button>`);
};
const anclaAyuda = b => {
  const k = b.dataset.ayuda || '';
  if (b.dataset.manual) return b.dataset.manual;
  if (MANUAL_ANCLA[k]) return MANUAL_ANCLA[k];
  if (/^ini_/.test(k)) return MANUAL_ANCLA.inicio;
  return MANUAL_ANCLA[TAB] || '';
};
// La ventanita ya llevaba «Ver más en el manual de uso» (resumirAyuda), que abría el buscador del manual: ahora abre el apartado de esa pantalla
resumirAyuda = (orig => function (pop) {
  orig.call(this, pop);
  const l = pop.querySelector('.aiman'); if (!l) return;
  const b = pop.__de, ancla = b ? anclaAyuda(b) : (MANUAL_ANCLA[TAB] || '');
  l.innerHTML = 'Ver en el manual de uso <span aria-hidden="true">›</span>';
  l.onclick = ev => { ev.preventDefault(); ev.stopPropagation(); pop.remove(); abrirManual(ancla); };
})(resumirAyuda);

function asegurarEquipo() {
  if (TAB !== 'agenda' || !VE_TODO()) return;
  // Solo en la cabecera que se ve: mientras se repinta puede quedar una copia congelada con los mismos id
  const acts = document.querySelector('#v-agenda > .saludo .acts'); if (!acts) return;
  let sel = acts.querySelector('#agvista');
  if (!sel) {
    if (!COMS.length) { cargarComerciales().then(asegurarEquipo); return; }
    acts.insertAdjacentHTML('afterbegin', `<select id="agvista" aria-label="Agenda de" title="Ver la agenda de otra persona">
        <option value="">Mi agenda</option>${COMS.filter(u => u.id !== PERFIL.id).map(u => `<option value="${u.id}" ${AG_VISTA && AG_VISTA.id === u.id ? 'selected' : ''}>${esc(u.nombre)}</option>`).join('')}</select>`);
    sel = acts.querySelector('#agvista');
    sel.onchange = e => verAgendaDe(e.target.value);
  }
  let b = acts.querySelector('[data-ag="equipo"]');
  if (!b) { sel.insertAdjacentHTML('afterend', '<button class="btn sec" data-ag="equipo">Equipo</button>'); b = acts.querySelector('[data-ag="equipo"]'); }
  const eq = AG_MODO === 'equipo';
  b.textContent = eq ? 'Mi agenda' : 'Equipo';
  b.classList.toggle('sec', !eq);
  b.title = eq ? 'Volver a tu agenda' : 'Ver el cumplimiento del equipo';
}
window.addEventListener('click', e => {
  const b = e.target.closest('[data-ag="equipo"]'); if (!b || AG_MODO !== 'equipo') return;
  e.stopImmediatePropagation(); e.preventDefault();
  AG_MODO = 'dia'; AG_VISTA = null; if ($('agvista')) $('agvista').value = '';
  cargarAgenda();
}, true);

editarTarea = (orig => function (t, fecha) {
  if (!t || !t.id || !t.hecha) return orig.apply(this, arguments);
  $('dbody').innerHTML = `
    <div class="fh"><div><h2>Tarea hecha</h2><div class="sm">${esc(fechaLarga(new Date(t.fecha + 'T00:00:00')))}${t.hora ? ' · ' + esc(String(t.hora).slice(0, 5)) : ''}</div></div>
      <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
    <div class="tarlec"><span class="tarok">Hecha</span><b>${esc(t.titulo || '')}</b>${t.nota ? `<p>${esc(t.nota)}</p>` : ''}</div>
    <div class="acts" style="justify-content:space-between">
      <button type="button" class="btn sec peligro" id="taborrar">Borrar</button>
      <span style="display:flex;gap:8px"><button type="button" class="btn sec" data-cerrar>Cerrar</button><button type="button" class="btn" id="tareabrir">Volver a pendiente</button></span></div>`;
  $('tareabrir').onclick = async ev => {
    ev.target.disabled = true;
    const { error } = await db.from('tareas').update({ hecha: false, modificado_en: new Date().toISOString() }).eq('id', t.id);
    ev.target.disabled = false;
    if (error) { toast('No se ha podido cambiar', true); return; }
    TAREAS_DIA = null; pintarTuDia(); orig.call(this, Object.assign({}, t, { hecha: false }), fecha);
  };
  $('taborrar').onclick = async () => {
    if (!await preguntar('La tarea desaparece.', { titulo: '¿Borrar la tarea?', ok: 'Borrar', peligro: true })) return;
    const { error } = await db.from('tareas').delete().eq('id', t.id);
    if (error) { toast('No se ha podido borrar', true); return; }
    $('dlg').close(); toast('Tarea borrada'); TAREAS_DIA = null; pintarTuDia();
  };
  $('dlg').classList.add('pequena');
  $('dlg').showModal();
})(editarTarea);

pintarSinAtribuir = async function () { const c = $('cardsinatr'); if (c) c.remove(); };

/* v2.227.0 · Ordenar cualquier tabla por su columna y filtros por columna según su tipo (lista de Eric del 9/10/2026).
   - Pulsar el nombre de una columna ordena (▲), volver a pulsar invierte (▼) y una tercera vez quita el orden. Se recuerda por tabla.
   - Las tablas que se cargan por páginas se ordenan en la base para que valga para todas las páginas (SQL 135): Profesionales
     (buscar_cuentas: orden), Pedidos (pedidos_pagina: p_orden) y Clientes (clientes_lista: p_orden). El resto, en la pantalla.
   - «Filtros y columnas»: cada columna con el filtro de su tipo: texto («contiene»), número (desde/hasta) o fecha (desde/hasta, y nada si la
     pantalla ya tiene su «Periodo»). Fuera los desplegables inventados con lo que se ve: las listas de valores fijos son las de Clasificadores
     (su apartado propio). Tampoco se repiten columnas que la pantalla ya filtra con lo suyo (Estado, Canal…). */
const htNorm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();
const HT_ORDEN = {};   // por tabla: { i, dir: 1 | -1, k }
try { Object.assign(HT_ORDEN, JSON.parse(localStorage.getItem('delcos-orden') || '{}')); } catch (e) {}
const htGuardarOrden = () => { try { localStorage.setItem('delcos-orden', JSON.stringify(HT_ORDEN)); } catch (e) {} };
const MESES_CORTOS = { ene: 1, feb: 2, mar: 3, abr: 4, may: 5, jun: 6, jul: 7, ago: 8, sep: 9, sept: 9, oct: 10, nov: 11, dic: 12 };
// Valor de una celda para ordenar o filtrar: { n: número } | { f: 'AAAA-MM-DD' } | { t: texto } | {} vacía
function htValor(txt) {
  const s = String(txt || '').replace(/\s+/g, ' ').trim();
  if (!s || s === '—' || s === '-') return {};
  let m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (m) return { f: `${m[3].length === 2 ? '20' + m[3] : m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` };
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})/); if (m) return { f: m[0] };
  m = s.toLowerCase().match(/^(?:[a-záéíóú]{3,4}\.? )?(\d{1,2}) (ene|feb|mar|abr|may|jun|jul|ago|sept?|oct|nov|dic)[a-z.]*(?: (\d{4}))?/);
  if (m) { const y = m[3] || String(new Date().getFullYear()); return { f: `${y}-${String(MESES_CORTOS[m[2]]).padStart(2, '0')}-${m[1].padStart(2, '0')}` }; }
  m = s.match(/^[-−]?\s?\d{1,3}(?:\.\d{3})*(?:,\d+)?\s*(?:€|%|uds?\.?|h|min|km)?$/i) || s.match(/^[-−]?\d+(?:[.,]\d+)?\s*(?:€|%|uds?\.?|h|min|km)?$/i);
  if (m) { const n = parseFloat(s.replace(/[−]/, '-').replace(/[^\d,.-]/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.')); if (!isNaN(n)) return { n }; }
  return { t: s.toLowerCase() };
}
function htComparar(a, b) {
  const va = htValor(a), vb = htValor(b);
  const vacia = x => !('n' in x) && !('f' in x) && !('t' in x);
  if (vacia(va) || vacia(vb)) return vacia(va) - vacia(vb);
  if ('n' in va && 'n' in vb) return va.n - vb.n;
  if ('f' in va && 'f' in vb) return va.f < vb.f ? -1 : va.f > vb.f ? 1 : 0;
  return String(va.t ?? va.n ?? va.f).localeCompare(String(vb.t ?? vb.n ?? vb.f), 'es', { numeric: true, sensitivity: 'base' });
}
// Tablas que se ordenan en la base: qué clave usa cada columna (por su posición o su nombre)
const ORD_SRV = {
  peds2: (i, n) => i === 2 ? 'profesional' : ({ Fecha: 'fecha', Cliente: 'cliente', Comercial: 'comercial', 'Uds.': 'unidades', Base: 'base', Total: 'total', Estado: 'estado' })[n] || null,
  pacs: (i, n) => i === 6 ? 'profesional' : ({ Cliente: 'nombre', Tipo: 'tipo', 'DNI / CIF': 'nif', Email: 'email', 'Población': 'municipio', Comercial: 'comercial', Pedidos: 'pedidos', 'Uds.': 'unidades', 'Último pedido': 'ultimo' })[n] || null
};
const ORD_DIR = { nombre: 'nombre', especialidad: 'especialidad', centro_nombre: 'lugar', municipio: 'municipio', ultima_visita: 'reciente', estado_comercial: 'estado' };
const htCeldaNoOrdenable = n => !n || /^(operativa|acciones?|productos)$/i.test(n);
const htNoFiltrable = n => !n || /^(operativa|acciones?)$/i.test(n);
function htMarcarCabecera(g) {
  const tipo = htTipo(g), o = HT_ORDEN[tipo], cab = g.querySelector(':scope > .dh'); if (!cab) return;
  [...cab.children].forEach((c, i) => {
    const n = c.textContent.trim(), srv = ORD_SRV[tipo], ok = srv ? !!srv(i, n) : !htCeldaNoOrdenable(n);
    c.classList.toggle('htord', ok);
    c.classList.toggle('ord-asc', !!o && o.i === i && o.dir === 1);
    c.classList.toggle('ord-desc', !!o && o.i === i && o.dir === -1);
    if (ok) { c.setAttribute('role', 'button'); c.title = 'Ordenar por esta columna'; }
  });
}
function htOrdenarFilas(g) {
  const tipo = htTipo(g), o = HT_ORDEN[tipo]; htMarcarCabecera(g);
  if (!o || ORD_SRV[tipo]) return;
  const cab = g.querySelector(':scope > .dh'); if (!cab) return;
  const filas = [...g.querySelectorAll(':scope > .dr')];
  if (!filas.length) return;
  filas.forEach((f, k) => { if (f.dataset.htpos == null) f.dataset.htpos = k; });
  const orden = [...filas].sort((a, b) => o.dir * htComparar((a.children[o.i] || {}).textContent, (b.children[o.i] || {}).textContent) || (+a.dataset.htpos - +b.dataset.htpos));
  if (orden.some((f, k) => f !== filas[k])) { let ref = cab; orden.forEach(f => { ref.after(f); ref = f; }); }
}
function htQuitarOrden(g) {
  const filas = [...g.querySelectorAll(':scope > .dr')];
  if (filas.some(f => f.dataset.htpos == null)) return;
  let ref = g.querySelector(':scope > .dh');
  [...filas].sort((a, b) => +a.dataset.htpos - +b.dataset.htpos).forEach(f => { ref.after(f); ref = f; });
}
// Pulsar una cabecera: asc → desc → sin orden
document.addEventListener('click', e => {
  const c = e.target.closest('.dgrid > .dh > *'); if (!c || e.target.closest('input, button, select, .res')) return;
  const g = c.closest('.dgrid'), tipo = htTipo(g), i = [...c.parentElement.children].indexOf(c), n = c.textContent.trim();
  const srv = ORD_SRV[tipo]; const k = srv ? srv(i, n) : null;
  if (srv ? !k : htCeldaNoOrdenable(n)) return;
  const o = HT_ORDEN[tipo];
  if (!o || o.i !== i) HT_ORDEN[tipo] = { i, dir: 1, k }; else if (o.dir === 1) o.dir = -1; else delete HT_ORDEN[tipo];
  htGuardarOrden();
  if (srv) {
    if (tipo === 'peds2' && typeof listaPedidos === 'function') { PEDPAG = 0; listaPedidos(); }
    if (tipo === 'pacs' && typeof listaPacientes === 'function') { PAC.pagina = 0; listaPacientes(); }
    htMarcarCabecera(g); return;
  }
  if (HT_ORDEN[tipo]) htOrdenarFilas(g); else { htQuitarOrden(g); htMarcarCabecera(g); }
});
// El orden de las tablas de la base viaja con la consulta
db.rpc = (orig => function (fn, args, ...r) {
  const o = fn === 'pedidos_pagina' ? HT_ORDEN.peds2 : fn === 'clientes_lista' ? HT_ORDEN.pacs : null;
  if (o && o.k && args && !('p_orden' in args) && (fn !== 'clientes_lista' || args.lim > 5)) args = Object.assign({}, args, { p_orden: o.k + (o.dir === -1 ? ':desc' : ':asc') });
  return orig.call(this, fn, args, ...r);
})(db.rpc);
// La memoria de resultados de Pedidos distingue el orden
rpcCache = (orig => function (fn, params, clave, ...r) {
  const o = fn === 'pedidos_pagina' ? HT_ORDEN.peds2 : null;
  return orig.call(this, fn, params, o && clave ? clave + '|orden:' + o.k + o.dir : clave, ...r);
})(rpcCache);
// Profesionales: su cabecera es propia y el orden va en F.orden (buscar_cuentas)
cabeceraTabla = (orig => function (...a) {
  const r = orig.apply(this, a);
  const cfg = colsConfig().filter(c => c.on), cab = $('thead'); if (!cab) return r;
  const [k, dir] = String(F.orden || '').split(':');
  [...cab.querySelectorAll('.th')].forEach((th, i) => {
    const c = cfg[i]; if (!c || !ORD_DIR[c.k]) return;
    th.dataset.ordk = c.k; th.classList.add('htord'); th.title = 'Ordenar por esta columna';
    const actual = ORD_DIR[c.k] === k && !(k === 'nombre' && !dir) && !(k === 'reciente' && !dir);
    th.classList.toggle('ord-asc', actual && dir !== 'desc');
    th.classList.toggle('ord-desc', actual && dir === 'desc');
  });
  return r;
})(cabeceraTabla);
document.addEventListener('click', e => {
  const th = e.target.closest('#thead .th[data-ordk]'); if (!th || e.target.closest('.res')) return;
  const k = ORD_DIR[th.dataset.ordk], [ak, ad] = String(F.orden || '').split(':');
  F.orden = ak === k && ad === 'asc' ? k + ':desc' : ak === k && ad === 'desc' ? 'nombre' : k + ':asc';
  if ($('forden') && [...$('forden').options].some(x => x.value === F.orden)) $('forden').value = F.orden;
  buscar(true); cabeceraTabla();
});

// Filtros por columna según el tipo de dato
function htTipoColumna(vals) {
  const v = vals.map(htValor).filter(x => Object.keys(x).length);
  if (!v.length) return 'texto';
  if (v.every(x => 'f' in x)) return 'fecha';
  if (v.every(x => 'n' in x)) return 'numero';
  return 'texto';
}
htPintarPanel = (orig => function (sec) {
  orig.call(this, sec);
  // El panel se abre al lado (#tools) y allí van también los filtros propios de la pantalla
  const lateral = typeof htLateralAbierto === 'function' && htLateralAbierto(), panel = lateral ? $('tools') : sec.querySelector('.htpanel'), g = sec.querySelector('.dgrid');
  if (!panel || !g || !panel.querySelector('.htauto')) return;
  const tipo = htTipo(g), st = HT_ESTADO[tipo] = HT_ESTADO[tipo] || { texto: '', facetas: {} };
  st.rangos = st.rangos || {};
  const zona = panel.querySelector('.htauto'), bloque = zona.querySelector('.htfacetas') && zona.querySelector('.htfacetas').closest('.htbloque');
  const propias = [...panel.querySelectorAll('.htpropios label, .htpropios h4, .htpropios .lab')].map(x => htNorm(x.textContent));
  const hayPeriodo = propias.some(t => /periodo|fecha/.test(t));
  const cab = [...(g.querySelector(':scope > .dh') || { children: [] }).children].map(c => c.textContent.trim());
  const filas = [...g.querySelectorAll(':scope > .dr')];
  const cols = cab.map((nombre, i) => {
    if (htNoFiltrable(nombre) || propias.includes(htNorm(nombre))) return null;
    const t = htTipoColumna(filas.map(f => (f.children[i] || {}).textContent || ''));
    if (t === 'fecha' && hayPeriodo) return null;
    return { i, nombre, t };
  }).filter(Boolean);
  const html = cols.length ? `<div class="htbloque htcolf"><h4>Filtrar por columna</h4><div class="htfacetas">${cols.map(c => c.t === 'texto'
      ? `<label><span>${esc(c.nombre)}</span><input type="search" class="chico" data-htt="${c.i}" value="${esc(st.facetas[c.i] || '')}" placeholder="Contiene…"></label>`
      : `<div class="htrango"><span>${esc(c.nombre)}</span><div><input type="${c.t === 'fecha' ? 'date' : 'number'}" class="chico" data-htd="${c.i}" data-htk="${c.t}" value="${esc((st.rangos[c.i] || {}).d || '')}" aria-label="${esc(c.nombre)} desde" placeholder="Desde">
          <input type="${c.t === 'fecha' ? 'date' : 'number'}" class="chico" data-hth="${c.i}" data-htk="${c.t}" value="${esc((st.rangos[c.i] || {}).h || '')}" aria-label="${esc(c.nombre)} hasta" placeholder="Hasta"></div></div>`).join('')}</div></div>` : '';
  const antesDe = [...zona.querySelectorAll('.htbloque')].find(b => b.querySelector('[data-htc], .t2abrir')) || zona.querySelector('.acts');
  if (bloque) bloque.outerHTML = html; else if (html) { if (antesDe) antesDe.insertAdjacentHTML('beforebegin', html); else zona.insertAdjacentHTML('beforeend', html); }
  // Los filtros de antes (desplegable con un valor exacto) pasan a «contiene»
  Object.keys(st.facetas).forEach(i => { if (!cols.some(c => c.i === +i && c.t === 'texto')) delete st.facetas[i]; });
  zona.querySelectorAll('[data-htt]').forEach(inp => inp.oninput = () => { st.facetas[inp.dataset.htt] = inp.value; htAplicarFiltros(g); htContador(sec); });
  zona.querySelectorAll('[data-htd], [data-hth]').forEach(inp => inp.oninput = inp.onchange = () => {
    const i = inp.dataset.htd || inp.dataset.hth, r = st.rangos[i] = st.rangos[i] || {};
    r.k = inp.dataset.htk; if (inp.dataset.htd) r.d = inp.value; else r.h = inp.value;
    htAplicarFiltros(g); htContador(sec);
  });
  const limpiar = zona.querySelector('[data-htlimpiar]');
  if (limpiar) { const v = limpiar.onclick; limpiar.onclick = () => { st.rangos = {}; v && v(); }; }
  if (typeof mejorarCampos === 'function') try { mejorarCampos(zona); } catch (e) {}
})(htPintarPanel);
htAplicarFiltros = function (g) {
  const st = HT_ESTADO[htTipo(g)] || { texto: '', facetas: {} };
  const t = htNorm(st.texto || ''), fac = Object.entries(st.facetas || {}).filter(([, v]) => v), ran = Object.entries(st.rangos || {}).filter(([, r]) => r.d || r.h);
  g.querySelectorAll(':scope > .dr').forEach(f => {
    const celdas = [...f.children];
    const ok = (!t || htNorm(f.textContent).includes(t))
      && fac.every(([i, v]) => celdas[i] && htNorm(celdas[i].textContent).includes(htNorm(v)))
      && ran.every(([i, r]) => {
        const v = htValor(celdas[i] && celdas[i].textContent), x = r.k === 'fecha' ? v.f : v.n;
        if (x == null) return false;
        const d = r.k === 'fecha' ? r.d : (r.d === '' || r.d == null ? null : +r.d), h = r.k === 'fecha' ? r.h : (r.h === '' || r.h == null ? null : +r.h);
        return (d == null || d === '' || x >= d) && (h == null || h === '' || x <= h);
      });
    f.classList.toggle('htfuera', !ok);
  });
};
htActivos = (orig => function (sec) {
  const g = sec.querySelector('.dgrid'), st = g ? HT_ESTADO[htTipo(g)] || {} : {};
  return orig.call(this, sec) + Object.values(st.rangos || {}).filter(r => r.d || r.h).length;
})(htActivos);
// Al pintarse una tabla (datos nuevos o «Ver más»), se aplica su orden y se marcan las cabeceras
htPreparar = (orig => function (sec, ...r) {
  const x = orig.call(this, sec, ...r);
  sec.querySelectorAll('.dgrid').forEach(g => { const n = g.querySelectorAll(':scope > .dr').length; if (g.dataset.htn != n) { g.dataset.htn = n; htOrdenarFilas(g); } });
  return x;
})(htPreparar);

/* v2.228.0 · Inicio de toda la empresa, en mosaico (decisión de Eric, 10/10/2026: variante «Mosaico» de https://claude.ai/artifact/5UMynF3SKQnJYBVkR6CCk7).
   - Fuera las listas que solo miraban la Agenda (rutas sugeridas, agenda, próximas acciones, urgentes, últimas visitas, Mi semana…). En su lugar,
     un mosaico con piezas de distintos tamaños: «Requiere tu atención» (grande: pagos por validar, facturas vencidas, urgentes, paquetes, stock,
     intervenciones por reponer, concursos que vencen, llamadas, duplicados…; cada línea lleva a su pantalla), Ventas del mes (frente al mes pasado y
     visitas de los últimos 14 días), Tu día (tus citas y tareas), Cobros, Ciclo, Stock, Cartera y Lo que viene (eventos, concursos, intervenciones
     y revisiones de equipos).
   - Cada persona ve solo las áreas de su plan y sus permisos (las mismas del menú) y los importes solo con permiso de importes.
   - Los indicadores de siempre siguen, plegados al final («Ver tus indicadores»), con su configuración.
   - Los números cuentan y las gráficas crecen al llegar, todo a la vez; sin animación con «reducir movimiento».
   - Datos: inicio_areas() (SQL 136) más panel_inicio, inicio_graficas, operativa_pendiente, alertas_stock, ciclo_cuentas y las citas de hoy. */
const verArea = t => { const b = document.querySelector(`nav.main [data-t="${t}"]`); return !!b && !b.classList.contains('hide') && !b.classList.contains('bloq'); };
const MOS_MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'], MOS_DS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const mosEur = n => Math.round(+n || 0).toLocaleString('es-ES') + ' €';
const mosIco = n => svgIco(ICON_NOM[n] || ICON_NOM.info);
let MOS_TURNO = 0;
async function datosMosaico() {
  const h = hoyISO(), r = x => Promise.resolve(x).then(v => (v && v.data) || null, () => null);
  const [ar, op, al, ci, ll, citas, ta] = await Promise.all([
    r(db.rpc('inicio_areas')),
    VE_TODO() && nivelDe2('V') >= 1 ? r(RPC_ORIG('operativa_pendiente', {})) : null,
    verArea('productos') ? r(RPC_ORIG('alertas_stock', {})) : null,
    verArea('ciclo') ? r(RPC_ORIG('ciclo_cuentas', { p_usuario: null })) : null,
    VE_TODO() && typeof hayOportunidades === 'function' && hayOportunidades() ? r(RPC_ORIG('llamadas_seguimiento', {})) : null,
    citasDelDia(h).catch(() => []), r(db.from('tareas').select('id,titulo,hora,hecha').eq('fecha', h))]);
  if (!KV_INI) { const p = await r(db.rpc('panel_inicio')); KV_INI = p; }
  return { h, ar: ar || {}, op, al: al || [], ci, ll, citas: citas || [], ta: ta || [], k: (KV_INI && KV_INI.kpis) || {}, gr: KV_GRAF };
}
function mosAtencion(D) {
  const it = [], add = (n, g, ic, t, s, fn) => { if (n) it.push({ n, g, ic, t, s, fn }); };
  const c = D.ar.cobros, op = D.op || {}, nop = k => (op[k] || []).length;
  if (c && verArea('facturacion')) add(c.n_vencidas, 'alta', 'receipt', 'Facturas vencidas', `${mosEur(c.vencido)} por cobrar`, () => ir('facturacion'));
  add(nop('pago'), 'alta', 'credit-card', 'Pendientes de cobro', 'Pedidos confirmados que aún no están cobrados', () => { PEDSEC = 'ventas'; ir('ventas'); });
  add(D.k.urgentes, 'alta', 'zap', `${TT('medico', 'p', '', 'l', 'C', 'urgente')} sin visitar`, 'Marcados como urgentes en su ficha', () => ir('directorio'));
  if (verArea('cirugias')) add(D.ar.cirugias_reponer, 'alta', 'scissors', 'Material de intervenciones por reponer', 'Reposición en 48 horas', () => ir('cirugias'));
  add(nop('paquete'), 'media', 'package', 'Paquetes por preparar', 'Pedidos confirmados sin enviar', () => { PEDSEC = 'ventas'; ir('ventas'); });
  (D.al || []).forEach(a => add(a.n, a.gravedad === 'alta' ? 'alta' : 'media', 'package', a.titulo, (a.items || []).slice(0, 2).map(x => x.nombre).join(' · '), () => ir('productos')));
  if (D.ll) { const p = D.ll.filter(x => x.proxima_fecha && x.proxima_fecha <= D.h); add(p.length, 'media', 'phone', 'Volver a llamar hoy', p.some(x => x.proxima_fecha < D.h) ? 'Algunas llamadas van con retraso' : 'Clientes a los que quedaste en llamar', () => { PEDSEC = 'llamadas'; ir('ventas'); }); }
  if (verArea('concursos')) add(D.ar.concursos_vencen, 'media', 'gavel', 'Contratos que vencen en 90 días', 'Concursos por renovar', () => ir('concursos'));
  add(nop('email_factura') + nop('email_pago'), 'media', 'mail', 'Correos por enviar', 'Facturas y avisos de pago sin enviar al cliente', () => { PEDSEC = 'ventas'; ir('ventas'); });
  if (typeof puedeDuplicados === 'function' && puedeDuplicados()) add(D.k.pendientes_unificar, 'media', 'copy', 'Fichas duplicadas por revisar', 'Posibles duplicados', () => ir('duplicados'));
  it.sort((a, b) => (a.g === b.g ? b.n - a.n : a.g === 'alta' ? -1 : 1));
  return it;
}
function pintarMosaicoHtml(D) {
  const A = mosAtencion(D), k = D.k, imp = verImportes(), tiles = [];
  const total = A.reduce((a, x) => a + x.n, 0);
  tiles.push(`<div class="mt mtat ${A.length <= 2 ? 'pocas' : ''}"><div class="mtt">${mosIco('bell')} Requiere tu atención${total ? `<span class="mtatn" data-mcnt="${total}">${total}</span>` : ''}</div>
    <div class="mtl">${A.slice(0, 7).map((x, i) => `<button type="button" class="mti ${x.g}" data-mat="${i}"><span class="mic">${mosIco(x.ic)}</span>
      <span class="mtx"><b>${esc(x.t)}</b><span>${esc(x.s || '')}</span></span><span class="mn" data-mcnt="${x.n}">${x.n}</span><span class="mfl" aria-hidden="true">›</span></button>`).join('')
      || `<div class="mtok">${mosIco('check')}<span><b>Todo al día</b>No hay nada pendiente en ninguna área.</span></div>`}</div></div>`);
  // Ventas del mes
  const v = D.ar.ventas || {};
  if (verArea('ventas')) {
    const base = imp && v.importe != null, act = base ? v.importe : v.unidades, ant = base ? v.importe_ant : v.unidades_ant;
    const dif = ant ? Math.round(100 * (act - ant) / ant) : null;
    const dias = {}; ((D.gr && D.gr.por_dia) || []).forEach(x => { dias[x.fecha] = x.n; });
    const bs = [...Array(14)].map((_, i) => isoMas(D.h, i - 13)), mx = Math.max(1, ...bs.map(f => dias[f] || 0));
    tiles.push(`<div class="mt mtven"><div class="mtt">${mosIco('chart-column')} Ventas del mes</div>
      <div class="mn1" ${base ? `data-meur="${act}"` : `data-mcnt="${act}"`}>${base ? mosEur(act) : num(act) + '<small>uds.</small>'}</div>
      <div class="ms">${dif == null ? '' : `<span class="${dif >= 0 ? 'mup' : 'mdown'}">${dif >= 0 ? '▲' : '▼'} ${Math.abs(dif)} %</span> frente al mismo día del mes pasado · `}<b>${num(v.pedidos || 0)}</b> pedidos${base ? ` · <b>${num(v.unidades || 0)}</b> uds.` : ''}</div>
      <div class="mbars" role="img" aria-label="${TT('visita', 'p', '', 'l', 'C')} por día en los últimos 14 días">${bs.map(f => `<i class="${f === D.h ? 'h' : ''}" style="height:${Math.max(4, 100 * (dias[f] || 0) / mx)}%"></i>`).join('')}</div>
      <div class="mleg">${TT('visita', 'p', '', 'l', 'C')} de los últimos 14 días</div></div>`);
  }
  // Tu día
  const ab = D.citas.filter(c => CITA_ABIERTA.includes(c.estado)), hechas = D.citas.filter(c => !CITA_ABIERTA.includes(c.estado) && !citaAnulada(c.estado)).length;
  const vivas = D.citas.filter(c => !citaAnulada(c.estado)).length, tpend = D.ta.filter(t => !t.hecha).length;
  tiles.push(`<div class="mt mthoy"><div class="mtt">${mosIco('calendar-days')} Tu día</div>
    <div class="mn1"><span data-mcnt="${vivas}">${vivas}</span><small>${vivas === 1 ? 'cita' : 'citas'}</small></div>
    <div class="ms"><b>${hechas}</b> hechas · <b>${tpend}</b> ${tpend === 1 ? 'tarea pendiente' : 'tareas pendientes'}</div>
    <div class="mprog"><i style="width:${vivas ? Math.max(3, 100 * hechas / vivas) : 0}%"></i></div>
    <div class="mcitas">${ab.slice(0, 4).map(c => `<div><b>${esc(String(c.hora || '').slice(0, 5) || '—')}</b><span>${esc(c.medico || c.nombre || '')}</span></div>`).join('')
      || `<button type="button" class="lnk" data-mplan>${vivas ? 'Día completado' : 'Planifica tu día'}</button>`}</div></div>`);
  // Cobros
  const c = D.ar.cobros;
  if (c && imp && verArea('facturacion')) tiles.push(`<div class="mt mtcob"><div class="mtt">${mosIco('euro')} Cobros</div>
    <div class="mn1" data-meur="${c.pendiente}">${mosEur(c.pendiente)}</div><div class="ms">pendiente en <b>${num(c.n)}</b> ${c.n === 1 ? 'factura' : 'facturas'}</div>
    <div class="mmini"><div><span>Vencido</span><b class="${c.vencido > 0 ? 'mdown' : ''}">${mosEur(c.vencido)}</b></div><div><span>Facturado este mes</span><b>${mosEur(c.facturado_mes)}</b></div></div></div>`);
  // Ciclo
  if (D.ci && (D.ci.resumen || []).length) {
    const r = D.ci.resumen, hh = r.reduce((a, x) => a + x.hechas, 0), o = r.reduce((a, x) => a + x.objetivo, 0), pc = o ? Math.round(100 * hh / o) : 0, C = 2 * Math.PI * 30;
    tiles.push(`<div class="mt mtcic"><div class="mtt">${mosIco('target')} Ciclo de ${TT('visita', 'p', '', 'l', 'l')}</div>
      <div class="mfila"><svg class="mring" viewBox="0 0 70 70" aria-hidden="true"><circle class="f" cx="35" cy="35" r="30"/><circle class="v" cx="35" cy="35" r="30" style="stroke-dasharray:${C * pc / 100} ${C}"/></svg>
      <div><div class="mn1" style="margin:0"><span data-mcnt="${pc}">${pc}</span> %</div><div class="ms"><b>${hh}</b> de ${o} · quedan ${D.ci.quedan_dias || 0} días</div></div></div></div>`);
  }
  // Stock
  if (verArea('productos')) { const n = (D.al || []).reduce((a, x) => a + x.n, 0);
    tiles.push(`<div class="mt mtsto"><div class="mtt">${mosIco('package')} Stock</div><div class="mn1"><span data-mcnt="${n}">${n}</span><small>${n === 1 ? 'aviso' : 'avisos'}</small></div>
      <div class="mmini">${(D.al || []).slice(0, 3).map(a => `<div><span>${esc(a.titulo)}</span><b>${a.n}</b></div>`).join('') || '<div><span>Todo en orden</span></div>'}</div></div>`); }
  // Cartera
  if (verArea('directorio')) tiles.push(`<div class="mt mtcar"><div class="mtt">${mosIco('users')} Cartera</div>
    <div class="mn1"><span data-mcnt="${k.cuentas || 0}">${num(k.cuentas || 0)}</span><small>${TT('medico', 'p', '', 'l', 'l')}</small></div>
    <div class="mmini">${verArea('ventas') ? `<div><span>Han vendido este mes</span><b>${num(k.prescriptores_mes || 0)}</b></div>` : ''}<div><span>Sin contactar</span><b>${num(k.sin_contactar || 0)}</b></div><div><span>Sin ${TT('visita', 's', '', 'l', 'l')} en 60 días</span><b>${num(k.sin_visita_60 || 0)}</b></div></div></div>`);
  // Lo que viene
  const pr = (D.ar.proximos || []).filter(x => x.tipo !== 'evento' || verArea('eventos')).filter(x => x.tipo !== 'concurso' || verArea('concursos')).filter(x => x.tipo !== 'cirugia' || verArea('cirugias')).filter(x => x.tipo !== 'equipo' || verArea('parque'));
  if (pr.length) tiles.push(`<div class="mt mtprox"><div class="mtt">${mosIco('clock')} Lo que viene</div><div class="mtl2">${pr.slice(0, 6).map(x => { const d = new Date(x.fecha + 'T12:00:00');
      return `<div class="me"><span class="md">${d.getDate()} ${MOS_MES[d.getMonth()]}<small>${MOS_DS[d.getDay()]}</small></span><span class="mp ${x.tipo}"></span><span class="mtx"><b>${esc(x.titulo)}</b><span>${esc(x.sub || '')}</span></span></div>`; }).join('')}</div></div>`);
  return { html: tiles.join(''), A };
}
function mosContar(box) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const els = [...box.querySelectorAll('[data-mcnt], [data-meur]')], t0 = performance.now();
  const paso = t => { const p = Math.min(1, (t - t0) / 900), e = 1 - Math.pow(1 - p, 3);
    els.forEach(el => { if (el.dataset.meur != null) el.textContent = mosEur(+el.dataset.meur * e); else el.textContent = num(Math.round(+el.dataset.mcnt * e)); });
    if (p < 1) requestAnimationFrame(paso); };
  requestAnimationFrame(paso);
}
async function pintarMosaico() {
  if (TAB !== 'inicio' || ES_MEDICO()) return;
  const sec = $('v-inicio'); if (!sec) return;
  const turno = ++MOS_TURNO, D = await datosMosaico();
  if (turno !== MOS_TURNO || TAB !== 'inicio') return;
  const { html, A } = pintarMosaicoHtml(D);
  let box = $('inimos');
  if (!box) { sec.querySelector('.saludo').insertAdjacentHTML('afterend', '<div id="inimos" class="inimos"></div><div class="inikpisb"><button type="button" class="btn sec" id="inikpisver">Ver tus indicadores</button></div>'); box = $('inimos');
    $('inikpisver').onclick = () => { const on = !sec.classList.contains('conkpis'); sec.classList.toggle('conkpis', on); $('inikpisver').textContent = on ? 'Ocultar tus indicadores' : 'Ver tus indicadores'; }; }
  box.innerHTML = html;
  box.querySelectorAll('[data-mat]').forEach(b => b.onclick = () => A[+b.dataset.mat].fn());
  const pl = box.querySelector('[data-mplan]'); if (pl) pl.onclick = () => ir('agenda');
  sec.classList.add('conmos');
  mosContar(box);
}
cargarInicio = (orig => function (...a) {
  const r = orig.apply(this, a);
  Promise.resolve(r).then(() => pintarMosaico()).catch(() => {});
  return r;
})(cargarInicio);

/* v2.229.0 · Agenda en una sola pantalla (decisión de Eric, 10/10/2026: variante B de https://claude.ai/artifact/7iht52N5whHBhAueRH7pso).
   - Cinta: cada día lleva su «⋯» (nueva cita, ver el día, bloquear o desbloquear: festivo, vacaciones, formación…) y los bloqueados se ven
     rayados con su motivo. «Planificar la semana» pasa a «Ver la semana»: despliega la semana debajo de la cinta, en la misma pantalla, con la
     rejilla de siempre (pintarSemanaAgenda pintada en #agsemexp: citas, arrastrar, «⋯» por día) y un solo botón, «Repartir la semana» (el
     planificador; su propuesta se guarda o descarta allí mismo).
   - Las sugerencias van dentro de «Tu día»: cada cita lleva «En este centro también» con los profesionales del mismo centro (un toque, su
     «+ Cita» de siempre). «Les toca visita» y «Pendientes de días anteriores» pasan a dos bandejas con su número bajo «Tu día», que abren el
     panel lateral con su lista.
   - La columna derecha es «Tu semana» (#agsemlat): día a día con sus citas, su «⋯» y «Repartir la semana». */
let AG_SEM_ABIERTA = false;
async function agBloqueos(desde, n) { try { return await bloqueadosSemana(desde, isoMas(desde, n - 1)); } catch (e) { return {}; } }
async function agMenusCinta() {
  const cin = $('agcinta'); if (!cin) return;
  const ini = cin.dataset.ini; if (!ini) return;
  const bloq = await agBloqueos(ini, 14);
  if ($('agcinta') !== cin) return;
  cin.querySelectorAll('button').forEach(b => {
    const f = b.dataset.cf || b.dataset.agdia || b.dataset.f || b.dataset.fecha; if (!f || !/^\d{4}-\d{2}-\d{2}$/.test(f)) return;
    b.classList.add('cdia'); b.classList.toggle('bloq', !!bloq[f]);
    if (bloq[f]) b.dataset.bloq = bloq[f]; else delete b.dataset.bloq;
    if (f >= hoyISO() && !b.querySelector('.cdmas')) {
      b.insertAdjacentHTML('beforeend', '<span class="cdmas" role="button" tabindex="0" aria-label="Opciones del día" title="Opciones del día">⋯</span>');
      const m = b.querySelector('.cdmas');
      const abrir = ev => { ev.stopPropagation(); ev.preventDefault(); menuDiaSemana(m, f, b.classList.contains('bloq')); };
      m.addEventListener('click', abrir, true); m.addEventListener('keydown', ev => { if (ev.key === 'Enter') abrir(ev); });
    }
  });
}
// La semana de siempre, pintada debajo de la cinta (se cambia el id un momento para que pintarSemanaAgenda pinte allí)
async function agPintarSemanaExp() {
  const cin = $('agcinta'); if (!cin || !AG_SEM_ABIERTA) { const x = $('agsemexp'); if (x) x.remove(); return; }
  let cont = $('agsemexp'); if (!cont) { cin.insertAdjacentHTML('beforeend', '<div id="agsemexp" class="agsemexp"></div>'); cont = $('agsemexp'); }
  const real = $('agcuerpo'), modo = AG_MODO;
  if (!real) return;
  real.id = 'agcuerpo-dia'; cont.id = 'agcuerpo'; AG_MODO = 'semana';
  try { await pintarSemanaAgenda(); } finally { cont.id = 'agsemexp'; real.id = 'agcuerpo'; AG_MODO = modo; }
  const h = cont.querySelector('.semhead h2'); if (h) h.remove();
  const p = cont.querySelector('#semplan'); if (p) p.textContent = 'Repartir la semana';
  const head = cont.querySelector('.semhead'); if (head) head.insertAdjacentHTML('afterbegin', '<span class="sm">Arrastra una cita a otro día para moverla · «⋯» en un día para bloquearlo o añadir una cita</span>');
}
// Columna derecha: tu semana
async function agSemanaLateral() {
  if (TAB !== 'agenda' || AG_MODO !== 'dia') return;
  const v = $('v-agenda'); if (!v || !v.classList.contains('agcinta')) return;
  let box = $('agsemlat');
  if (!box) { $('agcuerpo').insertAdjacentHTML('afterend', '<div class="card" id="agsemlat"></div>'); box = $('agsemlat'); }
  const desde = lunesDe(AG_FECHA || hoyISO()), hasta = isoMas(desde, 6);
  const [r, bloq] = await Promise.all([rpcCache('agenda_rango', { p_desde: desde, p_hasta: hasta, p_usuario: agUsuarioFiltro() }, 'agenda-' + desde), agBloqueos(desde, 7)]);
  if (!$('agsemlat')) return;
  const por = {}; ((r && r.data) || []).filter(c => !citaAnulada(c.estado)).forEach(c => (por[c.fecha] = por[c.fecha] || []).push(c));
  const DS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
  box.innerHTML = `<h2>Tu semana</h2><p class="sm agslnota">«⋯» en un día para bloquearlo (festivo, vacaciones, formación) o añadir una cita.</p>
    <div class="agsl">${[...Array(7)].map((_, i) => { const f = isoMas(desde, i), d = new Date(f + 'T12:00:00'), l = (por[f] || []).sort((a, b) => String(a.hora || '').localeCompare(String(b.hora || '')));
      return `<div class="agsld ${f === hoyISO() ? 'hoy' : ''} ${f === AG_FECHA ? 'sel' : ''} ${bloq[f] ? 'bloq' : ''}" data-agsl="${f}" role="button" tabindex="0" aria-label="Ver el ${fechaCorta(f)}">
        <span class="agslf">${d.getDate()}<small>${DS[d.getDay()]}</small></span>
        <span class="agslc">${bloq[f] ? `<span class="agslb">${esc(bloq[f])}</span>` : ''}${l.slice(0, 3).map(c => `<span class="agslx"><b>${esc(String(c.hora || '').slice(0, 5))}</b>${esc(c.medico || c.nombre || '')}</span>`).join('')}${l.length > 3 ? `<span class="agslv">y ${l.length - 3} más</span>` : ''}${!l.length && !bloq[f] ? '<span class="agslv">Libre</span>' : ''}</span>
        ${f >= hoyISO() ? `<button type="button" class="agslm" data-agslm="${f}" aria-label="Opciones del ${fechaCorta(f)}">⋯</button>` : '<span></span>'}</div>`; }).join('')}</div>
    ${[...Array(7)].some((_, i) => isoMas(desde, i) >= hoyISO()) ? '<div class="acts agslacts"><button type="button" class="btn sec" id="agslrep">Repartir la semana</button></div>' : ''}`;
  box.querySelectorAll('[data-agslm]').forEach(b => b.onclick = ev => { ev.stopPropagation(); menuDiaSemana(b, b.dataset.agslm, !!bloq[b.dataset.agslm]); });
  box.querySelectorAll('[data-agsl]').forEach(d => { const ver = () => agVerDia(d.dataset.agsl); d.onclick = ver; d.onkeydown = e => { if (e.key === 'Enter') ver(); }; });
  if ($('agslrep')) $('agslrep').onclick = agRepartirSemana;
}
// Sugerencias dentro de tu día y bandejas

/* v2.230.0 · KPIs de Pedidos y Analítica (Eric eligió la A de https://claude.ai/artifact/PTBZBvZ3yZrQxpxXCNKyrs).
   - Pedidos: #operativa deja de ser el cartel con los avisos desplegables y pasa a tres tarjetas vivas (pagos por validar, paquetes por
     preparar y facturas por enviar) con su número que cuenta, una frase y la entrada de los últimos 10 días. Pulsar una pone el filtro
     «Operativa» (#popf) de la tabla; volver a pulsarla lo quita. Las cifras son las de la tabla (todos los pendientes). El engranaje
     (#opcfg) sigue eligiendo qué tarjetas se ven.
   - Analítica: cada indicador cuenta hasta su cifra y dibuja la línea de los últimos seis meses (analitica_kpis_periodo por mes, con
     el filtro propio del indicador). Sin línea los de «a día de hoy» y los de texto. */
const PK_TARJ = [['pago', 'pago', 'Pendientes de cobro', 'credit-card'], ['paquete', 'paquete', 'Paquetes por preparar', 'package'],
  ['email_factura', 'email', 'Facturas por enviar', 'mail']];
const pkMovimiento = () => !matchMedia('(prefers-reduced-motion: reduce)').matches;
function pkContar(els, fmt) {
  if (!pkMovimiento()) { els.forEach(el => el.textContent = fmt(+el.dataset.v, el)); return; }
  const t0 = performance.now();
  const paso = t => { const p = Math.min(1, (t - t0) / 900), e = 1 - Math.pow(1 - p, 3); els.forEach(el => { if (el.isConnected) el.textContent = fmt(+el.dataset.v * e, el); }); if (p < 1) requestAnimationFrame(paso); };
  requestAnimationFrame(paso);
}
function pkMarcar() {
  const s = $('popf'), v = s ? s.value : '';
  document.querySelectorAll('#operativa [data-pk]').forEach(b => { b.classList.toggle('on', b.dataset.pk === v); b.setAttribute('aria-pressed', b.dataset.pk === v); });
}
document.addEventListener('change', e => { if (e.target && e.target.id === 'popf') pkMarcar(); });
pintarOperativa = async function () {
  let c = $('operativa');
  if (!c) { const ref = $('vcuerpo'); if (!ref) return; ref.insertAdjacentHTML('beforebegin', '<div id="operativa"></div>'); c = $('operativa'); }
  const [{ data }, { data: aj }] = await Promise.all([RPC_ORIG('operativa_pendiente', {}),
    db.from('ajustes').select('valor').eq('clave', 'avisos_pedidos').maybeSingle()]);
  c = $('operativa'); if (!c) return;
  c.className = 'pkop';
  document.querySelectorAll('#opcfg').forEach(x => x.remove());
  const d = data || {}, oblig = (((aj && aj.valor) || {}).obligatorios || {})[PERFIL.rol] || [];
  const pref = ((PERFIL.preferencias || {}).avisos_pedidos) || {};
  const vis = PK_TARJ.filter(([k]) => oblig.includes(k) || pref[k] !== false);
  const hoy = hoyISO(), dia = x => String(x.fecha || '').slice(0, 10);
  const barras = l => { const m = {}; l.forEach(x => { m[dia(x)] = (m[dia(x)] || 0) + 1; }); return [...Array(10)].map((_, i) => m[isoMas(hoy, i - 9)] || 0); };
  const antig = l => l.length ? Math.max(0, ...l.map(x => Math.round((new Date(hoy) - new Date(dia(x))) / 864e5))) : 0;
  const hace = n => n === 0 ? 'de hoy' : n === 1 ? 'de ayer' : `de hace ${num(n)} días`;
  const frase = (k, l) => {
    if (!l.length) return k === 'pago' ? 'Todo cobrado' : k === 'paquete' ? 'Todo preparado' : 'Todas enviadas';
    const ant = `el más antiguo, ${hace(antig(l))}`;
    if (k === 'pago' && verImportes()) return `<b>${eurI(l.reduce((a, x) => a + (+x.total || 0), 0))}</b> por cobrar · ${ant}`;
    return ant.charAt(0).toUpperCase() + ant.slice(1);
  };
  const gear = `<button type="button" class="pkcfg" id="opcfg" aria-label="Elegir qué avisos ver" title="Elegir qué avisos ver">${svgIco(ICON_NOM.settings || '')}</button>`;
  c.innerHTML = !vis.length
    ? `<div class="pkvacio">Has ocultado los avisos de pedidos. Vuelve a elegirlos con el engranaje. ${gear}</div>`
    : `<div class="pk">${vis.map(([k, f, t, ic]) => {
        const l = d[k] || [], b = barras(l), mx = Math.max(1, ...b), alta = k === 'pago' && l.length;
        return `<button type="button" class="pkt ${alta ? 'alta' : ''}" data-pk="${f}" aria-pressed="false" ${l.length ? '' : 'data-cero'}>
          <span class="pkfil">Filtrando</span><span class="pktt">${svgIco(ICON_NOM[ic] || ICON_NOM.info || '')} ${t}</span>
          <span class="pkn" data-v="${l.length}">${num(l.length)}</span><span class="pks">${frase(k, l)}</span>
          <span class="pkbars" aria-hidden="true">${b.map((n, i) => `<i class="${i === 9 ? 'u' : pkLibre(isoMas(hoy, i - 9)) ? 'fin' : ''}" style="height:${n ? Math.max(14, 100 * n / mx) : 6}%"></i>`).join('')}</span>
          <span class="pkdias">${b.map((n, i) => pkDia(isoMas(hoy, i - 9), n, i === 9)).join('')}</span>
          <span class="pklg">Entrada de los últimos 10 días</span></button>`; }).join('')}${gear}</div>`;
  c.querySelectorAll('[data-pk]').forEach(b => b.onclick = () => {
    const s = $('popf'); if (!s) return;
    s.value = s.value === b.dataset.pk ? '' : b.dataset.pk; s.dispatchEvent(new Event('change', { bubbles: true }));
    pkMarcar();
  });
  // El engranaje, junto a «Filtros y columnas» de la cabecera (si está a la vista)
  const hb = document.querySelector('#v-ventas .htbtn'), g = $('opcfg');
  if (hb && hb.offsetParent && g && vis.length) { g.className = 'btn sec pkcfg pkcfgcab'; hb.insertAdjacentElement('beforebegin', g); }
  $('opcfg').onclick = () => configurarAvisosPedidos(oblig);
  pkMarcar();
  pkContar([...c.querySelectorAll('.pkn[data-v]')], n => num(Math.round(n)));
};

/* ---------------- Analítica: cifras que cuentan y línea de seis meses ---------------- */
const AN_SERIE = new Map();
var AN_REP = '';   // v2.329.0: Analítica → Resumen, «Reporte»
const AN_MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
function anMeses(hasta) {
  return [...Array(6)].map((_, i) => {
    const d = new Date(hasta + 'T12:00:00'); d.setDate(1); d.setMonth(d.getMonth() - 5 + i);
    const a = isoLocal(d); d.setMonth(d.getMonth() + 1); d.setDate(0); const b = isoLocal(d);
    return [a, b > hasta ? hasta : b];
  });
}
async function anSerie(meses, f, fams) {
  const clave = JSON.stringify([meses[0][0], meses[5][1], f, fams, AN_REP]);
  if (!AN_SERIE.has(clave)) AN_SERIE.set(clave, Promise.all(meses.map(([a, b]) =>
    db.rpc('analitica_kpis_periodo', { p_desde: a, p_hasta: b, p_filtro: f, p_familias: fams, p_estado: false }).then(r => r.error ? {} : (r.data || {}), () => ({})))));
  const r = await AN_SERIE.get(clave);
  if (r.every(x => !Object.keys(x).length)) AN_SERIE.delete(clave);
  return r;
}
function anLinea(vals, meses) {
  const mx = Math.max(...vals), mn = Math.min(...vals, 0), W = 200, H = 40, rg = (mx - mn) || 1;
  const pts = vals.map((x, i) => [i * W / 5, H - 4 - (H - 8) * (x - mn) / rg]);
  const dl = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  return `<svg class="avsp" viewBox="0 0 200 46" preserveAspectRatio="none" aria-hidden="true"><path class="a" d="${dl} L200 46 L0 46 Z"/><path class="l" pathLength="100" d="${dl}"/></svg>
    <span class="avpt" style="left:${(pts[5][0] / 2).toFixed(1)}%;top:${(pts[5][1] / 46 * 100).toFixed(1)}%"></span>
    <div class="avm">${meses.map(([a]) => `<span>${AN_MES[+a.slice(5, 7) - 1]}</span>`).join('')}</div>`;
}
anCargarKpis = (orig => async function () {
  await orig.apply(this, arguments);
  const caja = $('anareas'); if (!caja || !AN_CFG || !$('anper')) return;
  const pedido = caja.dataset.pedido, cat = anCatalogo(), r = $('anper').__rango(), hoy = hoyISO();
  const hasta = !r.hasta || r.hasta > hoy ? hoy : r.hasta, meses = anMeses(hasta);
  const tarjetas = [...caja.querySelectorAll('.ankpi[data-anu]')].map(el => {
    const x = AN_CFG.kpis.find(y => y.u === el.dataset.anu), k = x && cat.find(c => c.id === x.id);
    return { el, x, k };
  }).filter(t => t.x && t.k);
  // Las cifras cuentan desde cero (con su mismo formato)
  const nums = [];
  tarjetas.forEach(({ el, k }) => {
    el.classList.add('anv');
    const n = el.querySelector('.ankval'); if (!n || k.fmt === 'txt') return;
    const t = n.textContent, m = t.match(/-?[\d.]+(,\d+)?/); if (!m) return;
    n.dataset.v = parseFloat(m[0].replace(/\./g, '').replace(',', '.')); n.dataset.f = t; n.dataset.dec = m[1] ? m[1].length - 1 : 0; nums.push(n);
  });
  pkContar(nums, (v, el) => el.dataset.f.replace(/-?[\d.]+(,\d+)?/, v.toLocaleString('es-ES', { minimumFractionDigits: +el.dataset.dec, maximumFractionDigits: +el.dataset.dec })));
  // La línea: hueco reservado ya (sin saltos) y se dibuja al llegar
  const conLinea = tarjetas.filter(({ k }) => !k.hoy && k.fmt !== 'txt');
  conLinea.forEach(({ el }) => el.insertAdjacentHTML('beforeend', '<div class="avz" aria-hidden="true"></div>'));
  const grupos = {};
  conLinea.forEach(t => {
    const f = {}; (AN_FILTROS[t.k.fam] || []).forEach(c => { if (t.x.f && t.x.f[c]) f[c] = t.x.f[c]; });
    const g = JSON.stringify(f); (grupos[g] = grupos[g] || { f, fams: new Set(), ts: [] }).fams.add(t.k.fam); grupos[g].ts.push(t);
  });
  await Promise.all(Object.values(grupos).map(async g => {
    const serie = await anSerie(meses, g.f, [...g.fams].sort());
    if (!$('anareas') || $('anareas').dataset.pedido !== pedido) return;
    g.ts.forEach(({ el, x, k }) => {
      const z = el.querySelector('.avz'); if (!z) return;
      const vals = serie.map(s => +s[x.id] || 0);
      if (vals.every(v => !v)) { z.classList.add('avcero'); z.innerHTML = anLinea(vals, meses); z.title = 'Sin datos en estos seis meses'; return; }   // v2.343.0: línea plana (antes se escondía y la tarjeta quedaba descuadrada y vacía)
      z.innerHTML = anLinea(vals, meses); z.title = meses.map(([a], i) => `${AN_MES[+a.slice(5, 7) - 1]}: ${anFmt(vals[i], k.fmt).replace(/<[^>]+>/g, '')}`).join(' · ');
    });
  }));
})(anCargarKpis);

