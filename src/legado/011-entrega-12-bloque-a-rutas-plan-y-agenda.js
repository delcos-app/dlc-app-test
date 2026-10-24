/* ============================================================
   DLC OS 2.0 · Entrega 12 · Bloque A: rutas, plan y agenda
   ============================================================ */

let RSEC = 'mis', PROPUESTAS = null;
/* v2.76.0 · La salida y la vuelta son de cada ruta (o del día planificado), no un ajuste general.
   HOR = horario del plan en curso; sin él se estima desde las 9:00 (o desde ahora) y no hay hora de vuelta. */
let HOR = null;
const TIEMPOS = () => { const p = prefsActivas().plan || {}; return { visita: +p.visita || 15, parada: p.parada != null && p.parada !== '' ? +p.parada : 10 }; };
const PLANCFG = () => Object.assign({}, TIEMPOS(), { salida: (HOR && HOR.salida) || '09:00', tope: (HOR && HOR.vuelta) || '23:59',
  conSalida: !!(HOR && HOR.salida), conTope: !!(HOR && HOR.vuelta) });
function conHor(h, fn) { const prev = HOR; HOR = h && (h.salida || h.vuelta) ? h : null; try { return fn(); } finally { HOR = prev; } }
const horDeCitas = l => { const c = (l || []).find(x => x && (x.salida || x.vuelta)); return c ? { salida: c.salida || null, vuelta: c.vuelta || null } : null; };
const horDeRuta = id => { const r = (RUTAS || []).find(x => x.id === id); return r && (r.salida || r.vuelta) ? { salida: r.salida || null, vuelta: r.vuelta || null } : null; };

/* ---------------- navegador de mapas ---------------- */

const NAVEGADORES = [['google', 'Google Maps'], ['apple', 'Apple Maps'], ['waze', 'Waze']];
const navActual = () => (PERFIL.preferencias || {}).navegador || 'google';

function enlaceNav(destino, paradas, n = 'google') {
  const d = Array.isArray(destino) ? destino.join(',') : destino;
  if (n === 'waze') return 'https://waze.com/ul?ll=' + encodeURIComponent(d) + '&navigate=yes';
  if (n === 'apple') return 'https://maps.apple.com/?daddr=' + encodeURIComponent(d) + '&dirflg=d';
  const wp = paradas && paradas.length ? '&waypoints=' + encodeURIComponent(paradas.map(p => p.join(',')).join('|')) : '';
  return 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(d) + '&travelmode=driving' + wp;
}

async function cambiarNavegador(n) {
  const prefs = Object.assign({}, PERFIL.preferencias || {}, { navegador: n });
  const { data } = await db.rpc('guardar_preferencias', { p: prefs });
  PERFIL.preferencias = data || prefs;
  toast('Navegación con ' + (NAVEGADORES.find(x => x[0] === n) || [])[1]);
  if (PLAN) pintarPlan();
}

// Cada navegación pregunta con qué app abrirla (Google Maps admite la ruta con todas sus paradas)
const navAttr = (d, p) => esc(JSON.stringify({ d, p: p && p.length ? p : null }));
async function navegarA(destino, paradas) {
  if (!destino) { toast('Esta parada no tiene ubicación', true); return; }
  const varias = paradas && paradas.length;
  const op = await elegirOpcion('¿Con qué app quieres navegar?',
    varias ? 'Google Maps abre la ruta completa con todas las paradas. Waze y Apple Maps solo admiten un destino: abrirán la primera parada.' : '',
    [{ k: 'google', t: 'Google Maps' }, { k: 'waze', t: 'Waze', cls: 'sec' }, { k: 'apple', t: 'Apple Maps', cls: 'sec' }, { k: 'no', t: 'Cancelar', cls: 'sec' }]);
  if (!op || op === 'no') return;
  const dest = op === 'google' ? destino : (varias ? paradas[0] : destino), par = op === 'google' ? paradas : null;
  const web = enlaceNav(dest, par, op);
  const app = (ES_IOS || ES_ANDROID) ? enlaceNavApp(dest, par, op) : null;
  if (!app) { window.open(web, '_blank', 'noopener'); return; }
  // La app de mapas toma el control y delcos pasa a segundo plano; si no está instalada, delcos sigue a la vista y se usa la web
  let fuera = false; const marcar = () => { if (document.visibilityState === 'hidden') fuera = true; };
  document.addEventListener('visibilitychange', marcar);
  location.href = app;
  setTimeout(() => { document.removeEventListener('visibilitychange', marcar); if (!fuera && document.visibilityState === 'visible') { const w = window.open(web, '_blank'); if (!w) location.href = web; } }, 1500);   // sin el clic, el navegador puede bloquear la ventana: entonces se abre aquí mismo
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-nav]'); if (!b) return;
  e.preventDefault();
  try { const v = JSON.parse(b.dataset.nav); navegarA(v.d, v.p); } catch (x) { /* dato de navegación no válido */ }
});
const selectorNav = () => `<select id="navsel" title="Navegador de mapas" style="max-width:160px">${
  NAVEGADORES.map(([v, t]) => `<option value="${v}" ${navActual() === v ? 'selected' : ''}>${t}</option>`).join('')}</select>`;

/* ---------------- pantalla de rutas ---------------- */

/* cargarRutas: la parte base y, en orden, cada paso que se le añade (antes eran 2 capas separadas). */
async function cargarRutas() {
  await cargarRutasBase();
  await cargarRutasPaso1();
  await cargarRutasPaso2();
}

async function cargarRutasPaso1() {
 pintarRutaEnCurso();
}

async function cargarRutasPaso2() {
  const acts = $('v-rutas').querySelector('.saludo .acts');
  if (acts && !$('rhorario')) {
    acts.insertAdjacentHTML('afterbegin', `<button class="btn sec" id="rhorario" title="Minutos por ${TT('visita', 's', '', 'l', 'l')} y por parada">⚙ Tiempos de ${TT('visita', 's', '', 'l', 'l')}</button>`);
    $('rhorario').onclick = abrirHorarioPlan;
  }
  const c = PLANCFG();
  const sub = $('v-rutas').querySelector('.saludo .fecha');
  if (sub) sub.textContent = `Crea, edita y planifica tus rutas · ${c.visita} min por ${TT('medico', 's', '', 'l', 'l')}`;
}

// (v2.183.0: aquí iba la primera versión de cargarRutasBase; se redefine entera más abajo)

// v2.242.0: aquí iba listaRutas (nadie la usaba)

async function duplicarRuta(id) {
  const r = RUTAS.find(x => x.id === id); if (!r) return;
  const nombre = await pedirTexto('Nombre de la copia', r.nombre + ' (copia)', { titulo: 'Duplicar ruta', ok: 'Duplicar' });
  if (!nombre) return;
  const { error } = await db.rpc('guardar_ruta', { p: {
    nombre, tipo: r.tipo, desde: hoyISO(), nota: r.nota,
    codigos: r.codigos || [], centros: r.centros || [], reglas: r.reglas || null, visible_para: r.visible_para || ''
  }});
  if (error) { toast('No se ha podido duplicar: ' + error.message, true); return; }
  toast('Ruta duplicada'); cargarRutas();
}

async function verMedicosRuta(id) {
  const r = RUTAS.find(x => x.id === id);
  $('dbody').innerHTML = '<div class="skel"></div><div class="skel" style="width:60%"></div>';
  $('dlg').showModal();
  const { data } = await db.rpc('cuentas_de_ruta', { p_id: id });
  const lista = data || [];
  $('dbody').innerHTML = `
    <div class="fh"><div><h2>${esc(r.nombre)}</h2>
      <div class="sm">${lista.length} ${TT('medico', 'p', '', 'l', 'l')} · ${r.dinamica ? 'por criterios, se recalcula cada día' : 'lista fija'}</div></div>
      <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
    <div class="lista">${lista.map(m => `<button class="item" data-mficha="${m.id}">
      <span class="ic ${m.urgente ? 'w' : ''}">${m.urgente ? '!' : '·'}</span>
      <span class="tx"><b>${esc(m.nombre)}</b><span class="sm">${esc(m.especialidad || '')} · ${esc(m.centro_nombre || '')} ${esc(m.municipio || '')}</span></span>
    </button>`).join('') || `<div class="vacio">${TT('medico', 's', 'ningun', 'C', 'l')} cumple ahora mismo los criterios.</div>`}</div>
    <div class="acts" style="justify-content:flex-end"><button class="btn" data-ruta="${id}">Planificar hoy</button></div>`;
  $('dbody').querySelectorAll('[data-mficha]').forEach(b => b.onclick = () => { $('dlg').close(); abrirFicha(b.dataset.mficha); });
}

/* ---------------- propuestas automáticas ---------------- */

// v2.242.0: aquí iba listaPropuestas (nadie la usaba)

/* ---------------- editor de ruta ---------------- */

async function editorRuta(id) {
  const r = id ? RUTAS.find(x => x.id === id) : null;
  let modo = r ? (r.dinamica ? 'crit' : 'lista') : 'lista';
  let codigos = r && r.codigos ? r.codigos.slice() : [];
  let medicos = [];
  let busca = '';
  // v2.98.0: centros de la ruta; sus médicos se planifican en ese centro
  let centrosR = [], buscaCen = '';
  let cab = { nombre: r ? r.nombre : '', tipo: r ? r.tipo : 'Normal', desde: (r && r.desde) || hoyISO(), salida: (r && r.salida) || '', vuelta: (r && r.vuelta) || '' };
  const leerCab = () => { if ($('rn')) cab = { nombre: $('rn').value, tipo: $('rt').value, desde: $('rd').value, salida: ($('rsal') || {}).value || '', vuelta: ($('rvue') || {}).value || '' }; };
  let op = { provincias: [], municipios: [], centros: [], especialidades: [], estados: [] };
  const g = Object.assign({}, (r && r.reglas) || {});

  cargando($('dbody'), 'Abriendo…');
  $('dlg').showModal();

  db.rpc('opciones_filtros', {}).then(({ data }) => { if (data) { op = data; if (modo === 'crit') pinta(); } });
  if (codigos.length) {
    // v2.98.0: con cuentas_de_ruta cada médico sabe en qué centro de la ruta está
    (id && !(r && r.dinamica) ? db.rpc('cuentas_de_ruta', { p_id: id }) : db.rpc('cuentas_por_ids', { p_ids: codigos }))
      .then(({ data }) => { medicos = (data || []).filter(m => codigos.includes(m.id)); pinta(); });
  }
  if (r && (r.centros || []).length) {
    db.from('centros').select('id,nombre,municipio').in('id', r.centros).then(({ data }) => {
      centrosR = r.centros.map(c => (data || []).find(x => x.id === c)).filter(Boolean); pinta();
    });
  }

  const sel = (lista, v) => '<option value=""></option>' + (lista || []).map(o =>
    `<option ${v === o.v ? 'selected' : ''}>${esc(o.v)}</option>`).join('');

  const pinta = async () => {
    leerCab();
    $('dbody').innerHTML = `
      <div class="fh"><div><h2>${id ? 'Editar ruta' : 'Nueva ruta'}</h2>
        <div class="sm">Una lista fija de ${TT('medico', 'p', '', 'l', 'l')}, o criterios que se recalculan cada día</div></div>
        <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
      <label for="rn">Nombre</label><input id="rn" value="${esc(cab.nombre)}" placeholder="p. ej. Urgentes zona alta">
      <div class="g2">
        <div><label for="rt">Tipo</label><select id="rt">
          <option ${cab.tipo !== 'Urgente' ? 'selected' : ''}>Normal</option>
          <option ${cab.tipo === 'Urgente' ? 'selected' : ''}>Urgente</option></select></div>
        <div><label for="rd">Contar ${TT('visita', 'p', '', 'l', 'l')} desde</label><input id="rd" type="date" value="${esc(cab.desde)}"></div>
        <div><label for="rsal">Hora de salida</label><input id="rsal" type="time" value="${esc(cab.salida || '')}"></div>
        <div><label for="rvue">Vuelta como tarde</label><input id="rvue" type="time" value="${esc(cab.vuelta || '')}"></div>
      </div>
      <label>Cómo se eligen ${TT('medico', 'p', 'el', 'l', 'l')}</label>
      <div class="subnav" style="margin:6px 0 10px">
        <button type="button" data-rm="lista" aria-pressed="${modo === 'lista'}">Lista de ${TT('medico', 'p', '', 'l', 'l')}</button>
        <button type="button" data-rm="crit" aria-pressed="${modo === 'crit'}">Por criterios</button></div>

      ${modo === 'lista' ? `
        ${rutaCentrosHTML(centrosR, medicos)}
        <label for="rbuscacen">Añadir un centro</label>
        <input id="rbuscacen" value="${esc(buscaCen)}" placeholder="Busca el centro: se añaden todos sus ${TT('medico', 'p', '', 'l', 'l')}" autocomplete="off">
        <div id="rrescen" class="lista"></div>
        <label for="rbusca">Añadir ${TT('medico', 'p', '', 'l', 'l')}</label>
        <input id="rbusca" value="${esc(busca)}" placeholder="Busca por nombre, centro o municipio" autocomplete="off">
        <div id="rres" class="lista"></div>`
      : `
        <div class="g2">
          <div><label for="cprov">Provincia</label><select id="cprov">${sel(op.provincias, g.provincia)}</select></div>
          <div><label for="cmuni">Municipio</label><select id="cmuni">${sel(op.municipios, g.municipio)}</select></div>
        </div>
        <div class="g2">
          <div><label for="ccen">Centro</label><select id="ccen">${sel(op.centros, g.centro)}</select></div>
          <div><label for="cesp">${TT('especialidad', 's', '', 'l', 'C')}</label><select id="cesp">${sel(op.especialidades, g.especialidad)}</select></div>
        </div>
        <div class="g2">
          <div><label for="cest">Estado comercial</label><select id="cest">${sel(op.estados, g.estado)}</select></div>
        </div>
        <div class="g2">
          <div><label for="csv">Sin visitar hace más de (días)</label><input id="csv" type="number" min="1" max="365" value="${g.sinVisita || ''}"></div>
          <div><label for="cdia">Atienden</label><select id="cdia"><option value=""></option>
            ${DIAS.map(k => `<option value="${k}" ${g.dia === k ? 'selected' : ''}>${DIAN[k]}</option>`).join('')}</select></div>
        </div>
        <label class="opt" style="margin-top:10px"><input type="checkbox" id="curg" ${g.urgentes ? 'checked' : ''}> Solo urgentes</label>
        <div id="rprev" class="sm" style="margin-top:10px"></div>`}

      <div class="acts" style="justify-content:flex-end">
        <button class="btn sec" data-cerrar>Cancelar</button>
        ${modo === 'crit' ? '<button class="btn sec" id="rprob">Ver cuántos cumplen</button>' : ''}
        <button class="btn" id="rguardar">${id ? 'Guardar' : 'Crear ruta'}</button></div>`;

    $('dbody').querySelectorAll('[data-rm]').forEach(b => b.onclick = () => { modo = b.dataset.rm; pinta(); });
    $('dbody').querySelectorAll('[data-rq]').forEach(b => b.onclick = () => {
      codigos = codigos.filter(c => c !== b.dataset.rq);
      medicos = medicos.filter(m => m.id !== b.dataset.rq);
      // v2.98.0: un centro sin médicos ya no pinta nada en la ruta
      centrosR = centrosR.filter(c => medicos.some(m => m.centro_ruta === c.id));
      pinta();
    });
    $('dbody').querySelectorAll('[data-rqc]').forEach(b => b.onclick = () => {
      const fuera = medicos.filter(m => m.centro_ruta === b.dataset.rqc).map(m => m.id);
      codigos = codigos.filter(c => !fuera.includes(c)); medicos = medicos.filter(m => !fuera.includes(m.id));
      centrosR = centrosR.filter(c => c.id !== b.dataset.rqc);
      pinta();
    });
    if ($('rbuscacen')) {
      let tc;
      const buscarCen = async q => {
        if (q.length < 2) { $('rrescen').innerHTML = ''; return; }
        const { data } = await RPC_ORIG('buscar_centros', { p_q: q, p_lat: null, p_lon: null, p_radio: 400, p_lim: 8 });
        if (!$('rrescen')) return;
        const res = (data || []).filter(c => !centrosR.some(x => x.id === c.id));
        $('rrescen').innerHTML = res.map((c, i) => `<button class="item" type="button" data-raddc="${i}"><span class="ic">+</span>
          <span class="tx"><b>${esc(c.nombre)}</b><span class="sm">${esc([c.direccion, c.municipio].filter(Boolean).join(' · '))}${c.medicos ? ` · ${num(c.medicos)} ${TT('medico', c.medicos === 1 ? 's' : 'p', '', 'l', 'l')}` : ''}</span></span></button>`).join('')
          || '<div class="vacio">Ningún centro con ese nombre.</div>';
        $('rrescen').querySelectorAll('[data-raddc]').forEach(b => b.onclick = async () => {
          const c = res[+b.dataset.raddc];
          b.disabled = true;
          const { data: meds, error } = await db.rpc('cuentas_de_centro', { p_centro: c.id });
          if (error) { toast('No se ha podido añadir el centro: ' + error.message, true); b.disabled = false; return; }
          // Todos sus médicos; los que ya estaban en la ruta pasan a este centro
          const lista = meds || [];
          lista.forEach(m => { const ya = medicos.find(x => x.id === m.id); if (ya) ya.centro_ruta = c.id; else { codigos.push(m.id); medicos.push(m); } });
          if (lista.length) centrosR.push({ id: c.id, nombre: c.nombre, municipio: c.municipio });
          buscaCen = '';
          toast(lista.length ? `${num(lista.length)} ${TT('medico', lista.length === 1 ? 's' : 'p', '', 'l', 'l')} de ${c.nombre} añadidos: quita los que no vayas a ver`
            : `${c.nombre} no tiene ${TT('medico', 'p', '', 'l', 'l')} en la base`, !lista.length);
          pinta();
        });
      };
      $('rbuscacen').oninput = e => { buscaCen = e.target.value; clearTimeout(tc); tc = setTimeout(() => buscarCen(e.target.value.trim()), 300); };
      if (buscaCen) buscarCen(buscaCen);
    }

    if (modo === 'lista') {
      let t;
      const buscarMed = async q => {
        if (q.length < 2) { $('rres').innerHTML = ''; return; }
        const { data } = await db.rpc('buscar_cuentas', { q, f_provincia: null, f_municipio: null, f_estado: null,
          f_especialidad: null, f_area: null, f_urgentes: false, f_mios: false, f_sin_visitar: false,
          orden: 'nombre', lim: 8, desplaz: 0 });
        const res = (data && data.filas || []).filter(m => !codigos.includes(m.id));
        $('rres').innerHTML = res.map(m => `<button class="item" data-radd='${esc(JSON.stringify({ id: m.id, nombre: m.nombre, especialidad: m.especialidad, centro_nombre: m.centro_nombre, municipio: m.municipio }))}'>
          <span class="ic">+</span><span class="tx"><b>${esc(m.nombre)}</b>
            <span class="sm">${esc(m.especialidad || '')} · ${esc(m.centro_nombre || '')} ${esc(m.municipio || '')}</span></span></button>`).join('')
          || '<div class="vacio">Sin coincidencias.</div>';
        $('rres').querySelectorAll('[data-radd]').forEach(b => b.onclick = () => {
          const m = JSON.parse(b.dataset.radd);
          codigos.push(m.id); medicos.push(m); busca = ''; pinta();
        });
      };
      $('rbusca').oninput = e => { busca = e.target.value; clearTimeout(t); t = setTimeout(() => buscarMed(e.target.value.trim()), 300); };
      if (busca) buscarMed(busca);
    } else {
      const reglas = () => {
        const o = {};
        if ($('cprov').value) o.provincia = $('cprov').value;
        if ($('cmuni').value) o.municipio = $('cmuni').value;
        if ($('cesp').value) o.especialidad = $('cesp').value;
        if ($('ccen') && $('ccen').value) o.centro = $('ccen').value;
        if ($('cest').value) o.estado = $('cest').value;
        if ($('csv').value) o.sinVisita = +$('csv').value;
        if ($('cdia').value) o.dia = $('cdia').value;
        if ($('curg').checked) o.urgentes = true;
        return o;
      };
      $('rprob').onclick = async ev => {
        ev.target.disabled = true;
        const rg = reglas();
        const { data } = await db.rpc('ids_filtrados', {
          f_provincia: rg.provincia || null, f_municipio: rg.municipio || null,
          f_estado: rg.estado || null, f_especialidad: rg.especialidad || null, f_urgentes: !!rg.urgentes });
        ev.target.disabled = false;
        $('rprev').innerHTML = `<b>${num((data || []).length)}</b> ${TT('medico', 'p', '', 'l', 'l')} cumplen ahora estos criterios${rg.sinVisita ? ', antes de aplicar los días sin visitar' : ''}.`;
      };
      $('dbody').__reglas = reglas;
      if ($('navsel')) $('navsel').onchange = e => cambiarNavegador(e.target.value);
    }

    $('rguardar').onclick = async ev => {
      if (!$('rn').value.trim()) { toast('Ponle un nombre a la ruta', true); return; }
      if (modo === 'lista' && !codigos.length) { toast(`Añade al menos ${TT('medico', 's', 'un', 'l', 'l')}`, true); return; }
      ev.target.disabled = true; ev.target.textContent = 'Guardando…';
      const { error } = await db.rpc('guardar_ruta', { p: {
        id: id || null, nombre: $('rn').value.trim(), tipo: $('rt').value, desde: $('rd').value,
        salida: ($('rsal') || {}).value || '', vuelta: ($('rvue') || {}).value || '',
        visible_para: puede('administrar') ? '*' : '',
        codigos: modo === 'lista' ? codigos : [],
        centros: modo === 'lista' ? centrosR.map(c => c.id) : [],
        reglas: modo === 'crit' ? ($('dbody').__reglas ? $('dbody').__reglas() : {}) : null
      }});
      ev.target.disabled = false; ev.target.textContent = id ? 'Guardar' : 'Crear ruta';
      if (error) { toast('No se ha podido guardar: ' + error.message, true); return; }
      $('dlg').close(); toast('Ruta guardada'); RSEC = 'mis'; cargarRutas();
    };
  };
  pinta();
}

/* ---------------- plan del día con horario configurable ---------------- */

async function planDesdeLista(lista, nombre, btn) {
  const conXY = (lista || []).filter(m => m.lat && m.lon);
  if (!conXY.length) { toast(`Ninguno de esos ${TT('medico', 'p', '', 'l', 'l')} tiene ubicación`, true); return; }
  construirPlan(conXY, nombre, btn);
}


function abrirHorarioPlan() {
  const c = PLANCFG();
  $('dbody').innerHTML = `
    <div class="fh"><div><h2>Tiempos de ${TT('visita', 's', '', 'l', 'l')}</h2><div class="sm">Se guardan en tus preferencias. La hora de salida y la de vuelta se ponen en cada ruta.</div></div>
      <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
    <div class="g2">
      <div><label for="hvis">Minutos por ${TT('medico', 's', '', 'l', 'l')}</label><input id="hvis" type="number" min="5" max="60" value="${c.visita}"></div>
      <div><label for="hpar">Minutos fijos por parada</label><input id="hpar" type="number" min="0" max="40" value="${c.parada}"></div>
    </div>
    <div class="acts" style="justify-content:flex-end">
      <button class="btn sec" data-cerrar>Cancelar</button>
      <button class="btn" id="hok">Guardar</button></div>`;
  $('hok').onclick = async ev => {
    ev.target.disabled = true;
    const plan = { visita: +$('hvis').value || 15, parada: $('hpar').value === '' ? 10 : +$('hpar').value };
    const prefs = Object.assign({}, PERFIL.preferencias || {}, { plan });
    const { data } = await db.rpc('guardar_preferencias', { p: prefs });
    PERFIL.preferencias = data || prefs;
    $('dlg').close(); toast('Horario guardado');
    if (ULTIMO_PLAN) construirPlan(ULTIMO_PLAN.conXY, ULTIMO_PLAN.rutaId, null, ULTIMO_PLAN.opts);
    else if (PLAN && PLAN.rutaId) {
      if (typeof PLAN.rutaId === 'string' && PROPUESTAS && PROPUESTAS[PLAN.rutaId]) planDesdeLista(PROPUESTAS[PLAN.rutaId], PLAN.rutaId);
      else planificar(PLAN.rutaId, $('rnueva') || document.createElement('button'));
    }
  };
  $('dlg').showModal();
}



