// pantallas/rutas.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.

function planBotonesAgenda() {
  if ($('planag')) $('planag').onclick = async ev => {
    ev.target.disabled = true;
    const r = await planAAgenda(PLAN);
    ev.target.disabled = false;
    if (!r) return;
    toast(`${r.n} citas en tu agenda del ${fechaCorta(r.fecha)}`);
    AG_MODO = 'dia'; AG_FECHA = r.fecha; PLAN = null; ir('agenda');
  };
  if ($('planempezar')) { $('planempezar').textContent = '▶ Pasar a mi agenda y empezar'; $('planempezar').onclick = empezarRuta; }
  if ($('planag')) $('planag').textContent = 'Guardar en mi agenda';
}

function planHorasYFueraDePlan() {
  if (!PLAN || !$('rplan')) return;
  // Hora de cada médico y su franja de consulta
  $('rplan').querySelectorAll('.lista > .item').forEach((el, i) => {
    const p = PLAN.paradas[i]; if (!p) return;
    const linea = el.querySelectorAll('.tx .sm')[1];
    if (linea) linea.innerHTML = p.medicos.map(m => `<span class="pmed"><b>${m.horaPlan != null ? hm(m.horaPlan) : ''}</b> ${esc(m.nombre)}${
      m.ventanas && m.ventanas.length ? ` <span class="pvent">atiende ${txtVentanas(m.ventanas)}</span>` : ''}</span>`).join('');
  });
  const fuera = PLAN.fuera || [];
  if (fuera.length) {
    $('rplan').querySelector('.card .lista').insertAdjacentHTML('afterend', `<div class="planfuera">
      <h3>Se quedan fuera · ${fuera.length}</h3>
      <div class="lista">${fuera.map((f, i) => `<div class="item ${i >= 30 ? 'extra' : ''}" style="cursor:default">
        <span class="ic w">!</span><span class="tx"><b>${esc(f.m.nombre)}</b>
          <span class="sm">${esc(f.motivo)}${f.m.municipio ? ' · ' + esc(f.m.municipio) : ''}</span></span></div>`).join('')}
        ${fuera.length > 30 ? `<button class="vermas" type="button" data-vermas>Ver los ${fuera.length - 30} restantes</button>` : ''}</div></div>`);
  }
}

function planMapaYDescartar() {
  if (!PLAN || !$('rplan')) return;
  const fuera = $('rplan').querySelector('.planfuera'), mapa = $('planmapa');
  if (fuera && mapa) mapa.insertAdjacentElement('afterend', fuera);
  if ($('plancerrar')) { $('plancerrar').textContent = '✕ Descartar plan'; $('plancerrar').title = 'Descarta este plan (la ruta guardada no cambia)'; }
  if ($('planver')) $('planver').onclick = () => {
    const m = $('planmapa');
    if (m.dataset.on && m.style.height !== '0px') {
      m.style.height = '0px'; m.style.marginTop = '0'; $('planver').textContent = 'Ver la ruta en el mapa';
    } else {
      mapaDelPlan(); m.style.height = 'min(55vh,460px)'; m.style.marginTop = '12px'; $('planver').textContent = 'Ocultar el mapa';
    }
  };
}

function planVisitadosRecientes() {
  if (!PLAN || !$('rplan') || PLAN.__recientes === undefined && !PLAN.__pedido) {
    if (PLAN && !PLAN.__pedido) {
      PLAN.__pedido = true;
      const ids = PLAN.paradas.flatMap(p => p.medicos.map(m => m.id));
      recientesDe(ids, PLAN.fecha || hoyISO()).then(por => { if (!PLAN) return; PLAN.__recientes = por; pintarPlan(); });
    }
    return;
  }
  const por = PLAN.__recientes || {};
  const ids = Object.keys(por);
  if (!ids.length) return;
  $('rplan').querySelectorAll('.pmed').forEach(el => {
    const m = PLAN.paradas.flatMap(p => p.medicos).find(x => el.textContent.includes(x.nombre));
    if (m && por[m.id] && !el.querySelector('.prec')) el.insertAdjacentHTML('beforeend', ` <span class="prec">⚠ ${esc(txtReciente(por[m.id].slice(0, 2)))}</span>`);
  });
  const card = $('rplan').querySelector('.card');
  if (card && !$('planrec')) {
    card.querySelector('h2').insertAdjacentHTML('afterend', `<div class="avisoh" id="planrec"><span>⚠ ${ids.length} ${ids.length === 1 ? `${TT('medico', 's', '', 'l', 'l')} del plan ya se ha` : `${TT('medico', 'p', '', 'l', 'l')} del plan ya se han`} visitado o tienen cita en los últimos ${avisoRevisita().dias} días.</span>
      <button class="btn sec" id="planquitar">Quitarlos del plan</button></div>`);
    $('planquitar').onclick = () => {
      const u = ULTIMO_PLAN; if (!u) return;
      construirPlan(u.conXY.filter(m => !ids.includes(m.id)), u.rutaId, null, u.opts);
    };
  }
}

function planAvisoSinSalida() {
 if (PLAN && $('rplan')) avisoSinSalida($('rplan').querySelector('.card'));
}

function planFichasYNotas() {
  if (!PLAN || !$('rplan')) return;
  const items = $('rplan').querySelectorAll('.lista > .item');
  PLAN.paradas.forEach((p, i) => {
    const it = items[i]; if (!it || it.dataset.ext) return;
    it.dataset.ext = '1';
    const tx = it.querySelector('.tx'), meds = tx.querySelectorAll('.sm')[1];
    if (meds) meds.innerHTML = p.medicos.map(m => `<button type="button" class="lnkmed" data-pfm="${m.id}" title="Abrir la ficha">${esc(m.nombre)}</button>`).join('');
    if (p.nota) tx.insertAdjacentHTML('beforeend', `<span class="sm notapar">📝 ${esc(p.nota)}</span>`);
    const acts = it.querySelector('.acts');
    acts.insertAdjacentHTML('afterbegin', `${p.medicos.length === 1 ? `<button class="btn sec" data-pfm="${p.medicos[0].id}">Ficha</button>` : ''}<button class="btn sec" data-pnota="${i}">${p.nota ? 'Editar nota' : 'Nota'}</button>`);
  });
  $('rplan').querySelectorAll('[data-pfm]').forEach(b => b.onclick = () => abrirFicha(b.dataset.pfm));
  $('rplan').querySelectorAll('[data-pnota]').forEach(b => b.onclick = async () => {
    const p = PLAN.paradas[+b.dataset.pnota];
    const t = await pedirTexto(`Se guardará en la cita de cada ${TT('medico', 's', '', 'l', 'l')} de esta parada al pasar el plan a tu agenda.`, p.nota || '', { titulo: 'Nota para ' + p.centro, ok: 'Guardar nota', tipo: 'area' });
    if (t === null) return; p.nota = t.trim(); pintarPlan();
  });
}

function mapaDelPlan() {
  if (!PLAN || !window.L) return;
  const caja = $('planmapa');
  if (!caja) return;
  if (!caja.dataset.on) {
    caja.dataset.on = '1'; caja.style.height = 'min(55vh,460px)';
    const conSal = PLAN.salida.lat != null, centro = conSal ? [PLAN.salida.lat, PLAN.salida.lon] : PLAN.paradas[0].xy;
    const m = L.map('planmapa').setView(centro, 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(m);
    const pin = (xy, txt, col) => L.marker(xy, { icon: L.divIcon({ className: 'mpin', html: `<span style="background:${col}">${txt}</span>`, iconSize: [24, 24], iconAnchor: [12, 12] }) }).addTo(m);
    if (conSal) pin([PLAN.salida.lat, PLAN.salida.lon], 'S', '#0E6B4C').bindPopup('Salida · ' + esc(PLAN.salida.nombre));
    PLAN.paradas.forEach((p, i) => pin(p.xy, String(i + 1), '#17457A')
      .bindPopup(`<b>${i + 1}. ${esc(p.centro)}</b><br>${hm(p.llegada)}–${hm(p.fin)}<br>${p.medicos.map(x => esc(x.nombre)).join('<br>')}`));
    const linea = conSal ? [[PLAN.salida.lat, PLAN.salida.lon]].concat(PLAN.paradas.map(p => p.xy), [[PLAN.salida.lat, PLAN.salida.lon]]) : PLAN.paradas.map(p => p.xy);
    L.polyline(linea, { color: '#17457A', weight: 3, dashArray: '6 6' }).addTo(m);
    m.fitBounds(linea, { padding: [30, 30] });
    setTimeout(() => m.invalidateSize(), 60);
  }
}

async function cargarRutasPaso1() {
 pintarRutaEnCurso();
}

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

async function planDesdeLista(lista, nombre, btn) {
  const conXY = (lista || []).filter(m => m.lat && m.lon);
  if (!conXY.length) { toast(`Ninguno de esos ${TT('medico', 'p', '', 'l', 'l')} tiene ubicación`, true); return; }
  construirPlan(conXY, nombre, btn);
}

async function tarjetasRuta() {
  const cr = $('c-recom'), cp = $('c-pend');
  if (!cr) return;
  const { data } = await db.rpc('propuestas_rutas', { lim: 40 });
  if (!data) { cr.innerHTML = ''; return; }
  PROPUESTAS = data;
  const dn = { L: 'lunes', M: 'martes', X: 'miércoles', J: 'jueves', V: 'viernes' }[data.dia] || 'hoy';
  const bloques = [
    ['hoy', '📅', `Atienden ${dn}`],
    ['urgentes', '❗', 'Urgentes sin visitar'],
    ['interesados', '🔥', `${TT('medico', 'p', '', 'l', 'C', 'interesado')} sin ${TT('visita', 's', '', 'l', 'l')} en 20 días`],
    ['sin_visitar', '🆕', 'Sin visitar nunca']
  ].filter(([k]) => (data[k] || []).length);

  cr.innerHTML = bloques.length ? `<h2>Rutas sugeridas</h2>
    <p class="sm">Calculadas con tus datos de hoy. Al pulsar, se planifica la ruta.</p>
    <div class="lista">${bloques.map(([k, ic, t]) => `<button class="item" data-recruta="${k}">
      <span class="ic">${ic}</span><span class="tx"><b>${t}</b>
        <span class="sm">${num(data[k].length)} ${TT('medico', 'p', '', 'l', 'l')} con ubicación</span></span>
      <span class="rn">${num(data[k].length)}</span></button>`).join('')}</div>
    <button class="verlo" data-ir-rutas>Ver todas las rutas</button>` : '';

  cr.querySelectorAll('[data-recruta]').forEach(b => b.onclick = async e => {
    const k = b.dataset.recruta;
    ir('rutas');
    await new Promise(r => setTimeout(r, 60));   // esperamos a que exista la pantalla de rutas
    planDesdeLista(PROPUESTAS[k], k, e.currentTarget);
  });
  if (cr.querySelector('[data-ir-rutas]')) cr.querySelector('[data-ir-rutas]').onclick = () => ir('rutas');

  const pend = data.pendientes || [];
  if (cp) cp.innerHTML = pend.length ? `<h2><span style="color:var(--warn)">Pendientes de rutas anteriores</span>
      <span class="n">${pend.length}</span></h2>
    <p class="sm">Los planificaste y no se visitaron.</p>
    <div class="lista">${pend.slice(0, 5).map(m => `<button class="item" data-id="${m.id}">
      <span class="ic w">!</span><span class="tx"><b>${esc(m.nombre)}</b>
        <span class="sm">${esc(m.especialidad || '')} · ${esc(m.centro_nombre || m.municipio || '')}</span></span></button>`).join('')}</div>
    <button class="verlo" data-ir-agenda>Ver los ${pend.length} en Agenda</button>` : '';
  if (cp && cp.querySelector('[data-ir-agenda]')) cp.querySelector('[data-ir-agenda]').onclick = () => ir('agenda');
}

async function pintarRutaBarra() {
  const j = jornadaActiva(), el = $('rutabar');
  if (!j) { el.classList.add('hide'); document.body.classList.remove('conruta'); return; }
  el.classList.remove('hide'); document.body.classList.add('conruta');
  const citas = await citasDelDia(hoyISO());
  const hechas = citas.filter(c => c.estado === 'Visitada' || c.estado === 'No estaba').length;
  const total = citas.filter(c => !['Descartada', 'Aplazada'].includes(c.estado)).length;
  el.innerHTML = `<span class="rbtx">● <b class="rblargo">Jornada en curso · </b><span class="rt">${durTxt(Date.now() - j.inicio)}</span> · ${hechas}<span class="rblargo"> de </span><span class="rbcorto">/</span>${total}<span class="rblargo"> hechas</span></span>
    <span class="acts" style="margin:0"><button class="btn sec chico" id="rbver">Mi día</button><button class="btn dang chico" id="rbfin">Terminar</button></span>`;
  // El contenido de la página empieza justo debajo del banner, mida lo que mida
  requestAnimationFrame(() => document.documentElement.style.setProperty('--rbh', el.offsetHeight + 'px'));
  $('rbver').onclick = () => { AG_MODO = 'dia'; AG_FECHA = hoyISO(); ir('agenda'); };
  $('rbfin').onclick = terminarJornada;
}

async function planAAgenda(plan) {
  const fecha = plan.fecha || hoyISO();
  const meds = plan.paradas.flatMap(p => p.medicos.map(m => ({ m, centro: p.centro, nota: p.nota || '' })));
  const existentes = await citasDelDia(fecha);
  const ids = [];
  let orden = existentes.length;
  for (const { m, centro, nota } of meds) {
    const ya = existentes.find(c => c.cuenta_id === m.id && CITA_ABIERTA.includes(c.estado));
    if (ya) { ids.push(ya.id); continue; }
    const { data: r, error } = await db.rpc('guardar_cita', { p: { cuenta_id: m.id, fecha, hora: null, centro_nombre: centro,
      estado: 'Planificada', origen: 'Ruta' + (typeof plan.rutaId === 'string' && plan.rutaId.length > 20 ? '' : ''), orden: ++orden, nota: nota || null,
      salida: (plan.horario || {}).salida || null, vuelta: (plan.horario || {}).vuelta || null,
      op_id: 'c-' + m.id + '-' + fecha } });
    if (error || !r || !r.ok) { toast('No se ha podido guardar alguna cita', true); return null; }
    ids.push(r.id);
  }
  // Orden: primero lo que ya había cerrado, después el orden del plan
  const cerradas = existentes.filter(c => !CITA_ABIERTA.includes(c.estado)).map(c => c.id);
  const abiertasPrevias = existentes.filter(c => CITA_ABIERTA.includes(c.estado) && !ids.includes(c.id)).map(c => c.id);
  await db.rpc('ordenar_citas', { p_ids: cerradas.concat(ids, abiertasPrevias) });
  invalidarCache();
  return { fecha, n: meds.length };
}

async function empezarRuta() {
  if (!PLAN) return;
  if (PLAN.fecha && PLAN.fecha !== hoyISO()) { toast('Este plan es para otro día: guárdalo en tu agenda.', true); return; }
  const r = await planAAgenda(PLAN);
  if (!r) return;
  PLAN = null;
  localStorage.setItem(JKEY(), JSON.stringify({ fecha: hoyISO(), inicio: Date.now() }));
  pintarRutaBarra();
  toast('Plan pasado a tu agenda · jornada iniciada');
  AG_MODO = 'dia'; AG_FECHA = hoyISO();
  ir('agenda');
}

/**
 * Ordena visitas respetando franjas de consulta y horas fijadas.
 * items: { id, xy, ventanas, fija, ref }. Devuelve { seq: [{it, llegada, ini, fin}], fuera: [{it, motivo}], fin }
 */
function programarVisitas(items, t0) {
  const cfg = PLANCFG(), sal = salidaUsuario(), tope = minHora(cfg.tope), dura = cfg.visita;
  let pos = [sal.lat, sal.lon], t = t0;
  const seq = [], fuera = [];
  let pend = [];
  items.forEach(it => {
    if (it.ventanas && !it.ventanas.length) fuera.push({ it, motivo: 'no atiende este día' });
    else if (!it.xy) fuera.push({ it, motivo: 'sin ubicación' });
    else pend.push(it);
  });
  const llegadaA = (it, desde, tt, primera) => {
    const mismo = !primera && desde[0] === it.xy[0] && desde[1] === it.xy[1];
    return tt + (mismo ? 0 : minutosEntre(desde, it.xy) + cfg.parada);
  };
  while (pend.length) {
    let mejor = null;
    const fijas = pend.filter(x => x.fija != null).sort((a, b) => a.fija - b.fija);
    for (const it of pend) {
      const lleg = llegadaA(it, pos, t, !seq.length);
      const ini = inicioPosible(it, lleg, dura);
      // Tiene que dar tiempo a terminar la visita Y volver a casa antes de «Vuelta como tarde»
      if (ini == null || ini + dura + minutosEntre(it.xy, [sal.lat, sal.lon]) > tope) continue;
      // No elegir algo que haga llegar tarde a la próxima cita con hora fijada
      if (it.fija == null && fijas.length) {
        const f = fijas[0];
        if (llegadaA(f, it.xy, ini + dura, false) > f.fija + 10) continue;
      }
      const coste = ini - t;
      if (!mejor || coste < mejor.coste) mejor = { it, lleg, ini, coste };
    }
    if (!mejor) break;
    seq.push({ it: mejor.it, llegada: mejor.lleg, ini: mejor.ini, fin: mejor.ini + dura });
    t = mejor.ini + dura; pos = mejor.it.xy;
    pend = pend.filter(x => x !== mejor.it);
  }
  pend.forEach(it => {
    const v = it.ventanas;
    fuera.push({ it, motivo: it.fija != null ? 'no llegas a la hora fijada'
      : v && v.every(([, b]) => b <= t) ? `su horario (${txtVentanas(v)}) ya habrá acabado`
      : 'no da tiempo a volver antes de tu hora de vuelta' });
  });
  return { seq, fuera, fin: t + minutosEntre(pos, [sal.lat, sal.lon]) };
}

function ordenarPorCercania(citas) { return conHor(horDeCitas(citas), () => ordenarPorCercaniaBase(citas)); }

function ordenarPorCercaniaBase(citas) {
  const fecha = (citas[0] && citas[0].fecha) || AG_FECHA;
  const cfg = PLANCFG(), ahora = new Date(), minAhora = ahora.getHours() * 60 + ahora.getMinutes();
  let t0 = minHora(cfg.salida);
  if (fecha === hoyISO()) t0 = Math.max(t0, Math.ceil(minAhora / 5) * 5);
  const cerradas = citas.filter(c => !CITA_ABIERTA.includes(c.estado));
  const abiertas = citas.filter(c => CITA_ABIERTA.includes(c.estado));
  const items = abiertas.map(c => ({ id: c.id, ref: c, xy: xyCita(c), ventanas: ventanasDe(c.dias, fecha), fija: minHora(c.hora) }));
  // Para ordenar no se descarta a nadie por la hora tope: se ordena todo lo posible
  const { seq, fuera } = programarVisitas(items, t0);
  ordenarPorCercania.fuera = fuera.length;
  return cerradas.concat(seq.map(s => s.it.ref), fuera.map(f => f.it.ref));
}

function rutaCompleta() {
  const sal = salidaUsuario(), casa = sal && sal.lat != null ? [sal.lat, sal.lon] : null;
  const xy = TD_PARADAS.map(xyCita);
  if (!xy.length) return;
  // Todas las paradas en orden y la vuelta a casa como destino (Google Maps admite hasta 9 paradas intermedias)
  return casa ? navegarA(casa, xy.slice(0, 9)) : navegarA(xy[xy.length - 1], xy.slice(0, -1).slice(0, 9));
}

function pintarBotonesRuta(fecha) {
  const cont = document.querySelector('#agcuerpo .tdhead > .acts');
  if (!cont) return;
  const emp = $('tdempezar');
  if (emp && !emp.dataset.v264) {
    emp.dataset.v264 = '1'; emp.textContent = '▶ Empezar ruta';
    emp.title = 'Inicia la jornada y abre la navegación hacia la primera parada';
    emp.onclick = async () => {
      const primera = TD_PARADAS[0];
      await empezarJornada();
      if (primera) navegarA(xyCita(primera));
    };
  }
  let rc = $('tdrutacompleta');
  const pasado = fecha < hoyISO();
  if (!pasado && TD_PARADAS.length && agUid() === PERFIL.id) {
    if (!rc) { cont.insertAdjacentHTML('afterbegin', `<button class="btn sec chico" id="tdrutacompleta" type="button" title="Abre todas las paradas del día en el navegador, en orden">${svgIco(ICON_NOM.map)} Ruta completa</button>`); rc = $('tdrutacompleta'); }
    rc.onclick = () => rutaCompleta();
  } else if (rc) rc.remove();
}

/* ============================================================
   v2.98.0 · Centros en las rutas
   En el editor de rutas, «Añadir un centro» añade todos sus médicos (se quitan
   los que no se van a ver). La ruta guarda sus centros y cada médico se
   planifica en ese centro aunque atienda también en otros.
   ============================================================ */
function rutaCentrosHTML(centros, medicos) {
  const chip = m => `<span class="chip">${esc(m.nombre)}
    <button type="button" data-rq="${m.id}" aria-label="Quitar ${esc(m.nombre)}" style="border:0;background:none;color:var(--dang);cursor:pointer;font-weight:700">✕</button></span>`;
  if (!medicos.length) return `<div class="chips"><span class="sm">Todavía no has añadido ${TT('medico', 'p', '', 'l', 'l')}.</span></div>`;
  const grupos = centros.map(c => {
    const ms = medicos.filter(m => m.centro_ruta === c.id);
    return `<div class="rcentro"><div class="rcentrocab"><span class="rcentronom">${svgIco(ICON_NOM['building-2'])}<b>${esc(c.nombre)}</b>
        <span class="sm">${esc(c.municipio || '')}${c.municipio ? ' · ' : ''}${num(ms.length)} ${TT('medico', ms.length === 1 ? 's' : 'p', '', 'l', 'l')}</span></span>
      <button type="button" class="lnk" data-rqc="${c.id}">Quitar el centro</button></div>
      <div class="chips">${ms.map(chip).join('')}</div></div>`;
  }).join('');
  const sueltos = medicos.filter(m => !centros.some(c => c.id === m.centro_ruta));
  return grupos + (sueltos.length ? `${centros.length ? `<div class="sm rcentrootros">Otros ${TT('medico', 'p', '', 'l', 'l')}</div>` : ''}<div class="chips">${sueltos.map(chip).join('')}</div>` : '');
}

// Mis rutas: lista compacta con «Planificar» y el resto en el menú ⋯
function rpMisRutas() {
  const caja = $('rmis'); if (!caja) return;
  const R = RUTAS || [];
  caja.innerHTML = `<div class="fh"><h2>Mis rutas${R.length ? `<span class="n">${R.length}</span>` : ''}</h2></div>
    ${R.length ? `<div class="lista">${R.map(r => `<div class="item rmit" style="cursor:default">
        <span class="tx"><b>${esc(r.nombre)}</b><span class="sm">${r.dinamica ? 'Por criterios' : num(r.n_fijos || 0) + ' ' + TT('medico', 'p', '', 'l', 'l')}${r.visitados ? ` · ${num(r.visitados)} visitados` : ''}${r.mia ? '' : ' · de ' + esc(r.duenyo || '')}</span></span>
        <span class="acts" style="margin:0"><button class="btn sec" type="button" data-ruta="${r.id}">Planificar</button>
          <button class="btn sec tdmas" type="button" data-rmas="${r.id}" aria-label="Más opciones de ${esc(r.nombre)}">⋯</button></span></div>`).join('')}</div>`
    : `<div class="rguia"><p>Una ruta es una lista de ${TT('medico', 'p', '', 'l', 'l')} a quienes vas a ver a menudo: con nombres concretos o por criterios (municipio, estado, días de atención) que se recalculan solos.</p>
        <div class="acts"><button class="btn sec" type="button" id="rrnueva">+ Crear mi primera ruta</button></div></div>`}`;
  if ($('rrnueva')) $('rrnueva').onclick = () => editorRuta(null);
  caja.querySelectorAll('[data-ruta]').forEach(b => b.onclick = () => planificar(b.dataset.ruta, b));
  caja.querySelectorAll('[data-rmas]').forEach(b => b.onclick = () => rpMenuRuta(b, R.find(x => x.id === b.dataset.rmas)));
}

function rpMenuRuta(boton, r) {
  document.querySelectorAll('.tdmenu').forEach(m => m.remove());
  if (!r) return;
  const ed = r.mia || puede('administrar');
  const ops = [['ver', `Ver ${TT('medico', 'p', '', 'l', 'l')}`], ed ? ['editar', 'Editar'] : null, ed ? ['duplicar', 'Duplicar'] : null, ed ? ['eliminar', 'Eliminar'] : null].filter(Boolean);
  const m = document.createElement('div');
  m.className = 'tdmenu'; m.__t = Date.now();
  m.innerHTML = ops.map(([k, t]) => `<button type="button" data-rmop="${k}" class="${k === 'eliminar' ? 'peligro' : ''}"><b>${t}</b></button>`).join('');
  document.body.appendChild(m);
  const b = boton.getBoundingClientRect();
  m.style.top = Math.min(window.innerHeight - m.offsetHeight - 10, b.bottom + 6) + 'px';
  m.style.left = Math.max(10, Math.min(window.innerWidth - m.offsetWidth - 10, b.right - m.offsetWidth)) + 'px';
  m.querySelectorAll('[data-rmop]').forEach(x => x.onclick = async () => {
    m.remove();
    const k = x.dataset.rmop;
    if (k === 'ver') return verMedicosRuta(r.id);
    if (k === 'editar') return editorRuta(r.id);
    if (k === 'duplicar') return duplicarRuta(r.id);
    if (!await preguntar(`Se elimina "${r.nombre}".\nLos ${TT('medico', 'p', '', 'l', 'l')} y sus ${TT('visita', 'p', '', 'l', 'l')} no se borran.`,
      { titulo: '¿Eliminar la ruta?', ok: 'Eliminar', peligro: true })) return;
    await db.rpc('guardar_ruta', { p: { id: r.id, activa: false } });
    toast('Ruta eliminada'); cargarRutas();
  });
}

function rmLib() {
  if (window.maplibregl) return Promise.resolve(window.maplibregl);
  return RM_LIB || (RM_LIB = new Promise((res, rej) => {
    document.head.insertAdjacentHTML('beforeend', '<style>@import url("https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css") layer(lib);</style>');   // v2.356.0: en la capa de las librerías
    const s = document.createElement('script'); s.src = 'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js'; s.integrity = 'sha384-SYKAG6cglRMN0RVvhNeBY0r3FYKNOJtznwA0v7B5Vp9tr31xAHsZC0DqkQ/pZDmj'; s.crossOrigin = 'anonymous';
    s.onload = () => res(window.maplibregl); s.onerror = () => { RM_LIB = null; rej(new Error('mapa')); }; document.head.appendChild(s);
  }));
}

async function rmRuta(puntos, salida) {
  const k = JSON.stringify([puntos, salida]), m = RM_MEM.get(k);
  if (m && Date.now() - m.t < 600000) return m.r;
  let r = null;
  try {
    const { data, error } = await db.functions.invoke('rutas', { body: { puntos, salida } });
    if (!error) r = data;
    else {
      const st = error.context && error.context.status;
      r = st === 404 ? { ok: false, motivo: 'sin_clave' } : await Promise.resolve(error.context && error.context.json ? error.context.json() : null).then(x => x && x.motivo ? x : { ok: false, motivo: 'servicio' }, () => ({ ok: false, motivo: 'servicio' }));
    }
  }
  catch (e) { r = { ok: false, motivo: 'servicio' }; }
  if (r && r.ok) RM_MEM.set(k, { t: Date.now(), r });
  return r || { ok: false, motivo: 'servicio' };
}

function pintarRutasMapa(ml, P, tramos) {
  if (RM_ANIM) { cancelAnimationFrame(RM_ANIM); RM_ANIM = null; }
  if (RM_MAPA) { try { RM_MAPA.remove(); } catch (e) {} RM_MAPA = null; }
  const xs = P.paradas.map(p => p.xy).concat(P.casa ? [P.casa] : []);
  const bb = xs.reduce((b, [la, lo]) => [[Math.min(b[0][0], lo), Math.min(b[0][1], la)], [Math.max(b[1][0], lo), Math.max(b[1][1], la)]], [[180, 90], [-180, -90]]);
  const map = new ml.Map({ container: 'rmc', style: 'https://tiles.openfreemap.org/styles/liberty', maxPitch: 0, dragRotate: false, attributionControl: { compact: true } });
  RM_MAPA = map; map.touchZoomRotate.disableRotation();
  map.fitBounds(bb, { padding: { top: 50, bottom: 90, left: 50, right: 50 }, duration: 0, maxZoom: 15 });
  map.addControl(new ml.NavigationControl({ showCompass: false }), 'top-right');
  // Los tramos de viaje: por las calles si los hay; si no, en recto
  const VIA = P.segs.filter(s => s.tipo === 'viaje');
  const prep = l => { const c = [0]; for (let i = 1; i < l.length; i++) c.push(c[i - 1] + rmKm([l[i - 1][1], l[i - 1][0]], [l[i][1], l[i][0]])); return { l, c, tot: c[c.length - 1] || 0.001 }; };
  const PL = VIA.map(v => prep(tramos && tramos[v.k] && tramos[v.k].linea && tramos[v.k].linea.length > 1
    ? tramos[v.k].linea.map(([la, lo]) => [lo, la]) : [[v.de[1], v.de[0]], [v.hasta[1], v.hasta[0]]]));
  const enLinea = (pl, f) => {
    const d = Math.max(0, Math.min(1, f)) * pl.tot; let i = 1; while (i < pl.c.length - 1 && pl.c[i] < d) i++;
    const a = pl.l[i - 1], b = pl.l[i] || a, g = Math.max(0, Math.min(1, (d - pl.c[i - 1]) / ((pl.c[i] - pl.c[i - 1]) || 1)));
    return { pt: [a[0] + (b[0] - a[0]) * g, a[1] + (b[1] - a[1]) * g], i, rumbo: (Math.atan2((b[0] - a[0]) * Math.cos(a[1] * Math.PI / 180), b[1] - a[1]) * 180 / Math.PI + 360) % 360 };
  };
  const linea = () => ({ type: 'Feature', geometry: { type: 'LineString', coordinates: PL.flatMap(x => x.l) } });
  map.on('load', () => {
    (map.getStyle().layers || []).forEach(l => {
      const id = l.id, set = (k, v) => { try { map.setPaintProperty(id, k, v); } catch (e) {} }, ocultar = () => { try { map.setLayoutProperty(id, 'visibility', 'none'); } catch (e) {} };
      if (l.type === 'fill-extrusion') return ocultar();
      if (l.type === 'background') return set('background-color', RM_PAL.tierra);
      if (l.type === 'symbol') { if (/poi|aeroway|housenumber|transit|rail|ferry|shield/i.test(id)) return ocultar(); set('text-color', RM_PAL.texto); set('text-halo-color', '#FFFFFF'); set('text-halo-width', 1.4); return; }
      if (l.type === 'fill') {
        if (/water/i.test(id)) return set('fill-color', RM_PAL.agua);
        if (/building/i.test(id)) { set('fill-color', RM_PAL.edif); set('fill-outline-color', RM_PAL.borde); return; }
        if (/park|wood|grass|forest|landcover|cemetery|pitch/i.test(id)) { set('fill-color', RM_PAL.parque); set('fill-opacity', 0.8); return; }
        set('fill-color', RM_PAL.zona); set('fill-opacity', 0.6); return;
      }
      if (l.type === 'line') {
        if (/water|river|stream|canal/i.test(id)) return set('line-color', RM_PAL.agua);
        if (/rail|ferry|aeroway|boundary|admin/i.test(id)) return ocultar();
        const grande = /motorway|trunk|primary/i.test(id);
        set('line-color', /casing/i.test(id) ? (grande ? RM_PAL.viaBorde : RM_PAL.borde) : (grande ? RM_PAL.via : RM_PAL.calle));
      }
    });
    const lp = { 'line-cap': 'round', 'line-join': 'round' };
    map.addSource('rm-ruta', { type: 'geojson', data: linea() });
    map.addSource('rm-hecho', { type: 'geojson', data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] } } });
    map.addLayer({ id: 'rm-ruta-borde', type: 'line', source: 'rm-ruta', paint: { 'line-color': RM_PAL.rutaBorde, 'line-width': 8 }, layout: lp });
    map.addLayer({ id: 'rm-ruta', type: 'line', source: 'rm-ruta', paint: { 'line-color': RM_PAL.ruta, 'line-width': 5, ...(tramos ? {} : { 'line-dasharray': [1.5, 1.5] }) }, layout: lp });
    map.addLayer({ id: 'rm-hecho', type: 'line', source: 'rm-hecho', paint: { 'line-color': RM_PAL.hecho, 'line-width': 6 }, layout: lp });
    mover();
  });
  // Paradas (las del mismo sitio, juntas) y la salida
  if (P.casa) { const e = document.createElement('div'); e.className = 'rmcasa'; e.title = salidaUsuario().nombre || 'Salida'; e.innerHTML = svgIco(ICON_NOM.house || ''); new ml.Marker({ element: e }).setLngLat([P.casa[1], P.casa[0]]).addTo(map); }
  const MK = {}, grupos = {};
  P.paradas.forEach(p => { const k = p.xy.join(','); (grupos[k] = grupos[k] || []).push(p); });
  Object.values(grupos).forEach(g => {
    const e = document.createElement('button'); e.type = 'button'; e.className = 'rmmk' + (g.length > 1 ? ' multi' : '');
    e.style.setProperty('--c', EST_COL[g[0].c.estado] || 'var(--navy)');
    e.innerHTML = `<span>${g.map(p => p.i + 1).join('·')}</span>`; e.setAttribute('aria-label', g.map(p => p.c.nombre).join(', '));
    e.onclick = ev => { ev.stopPropagation(); verCita(g[0].c); };
    new ml.Marker({ element: e, anchor: 'bottom' }).setLngLat([g[0].xy[1], g[0].xy[0]]).addTo(map);
    g.forEach(p => { MK[p.c.id] = e; });
  });
  // El marcador propio con su haz
  const yo = document.createElement('div'); yo.className = 'rmyo';
  yo.innerHTML = `<span class="haz"><svg viewBox="0 0 84 84"><path d="M42 42 L27 2.9 A42 42 0 0 1 57 2.9 Z" fill="#3F82C0" fill-opacity=".38"/></svg></span><span class="pun">${RM_SV(RM_COCHE)}</span>`;
  const myo = new ml.Marker({ element: yo }).setLngLat([xs[0][1], xs[0][0]]).addTo(map);
  // La jornada en una pista
  const lo = Math.floor((Math.min(P.ini, P.tope || P.ini) - 30) / 60) * 60, hi = Math.ceil((Math.max(P.fin, P.tope || 0) + 30) / 60) * 60;
  const x = m => ((m - lo) / ((hi - lo) || 1) * 100).toFixed(2) + '%';
  const ahora = (() => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); })();
  $('rmpista').innerHTML = `${P.tope && P.tope < hi ? `<div class="tope" style="left:${x(P.tope)};right:0" title="Después de tu hora de vuelta"></div>` : ''}
    ${P.segs.map(s => s.tipo === 'viaje' ? `<div class="seg viaje" style="left:${x(s.a)};width:calc(${x(s.b)} - ${x(s.a)})"></div>`
      : `<div class="seg vis ${citaHecha(s.p.c.estado) ? 'hecha' : CITA_ABIERTA.includes(s.p.c.estado) ? '' : 'no'}" style="left:${x(s.a)};width:calc(${x(s.b)} - ${x(s.a)})" title="${esc(s.p.c.nombre)}"><span>${s.p.i + 1}</span></div>`).join('')}
    ${ahora > lo && ahora < hi ? `<div class="ahora" style="left:${x(ahora)}"></div>` : ''}`;
  $('rmhoras').innerHTML = Array.from({ length: (hi - lo) / 60 + 1 }, (_, k) => lo + k * 60).map(m => `<span style="left:${x(m)}">${hm(m)}</span>`).join('');
  const s = $('rmscrub'); s.min = lo; s.max = hi; s.value = Math.min(hi, Math.max(lo, ahora));
  let cam = false, cen = null, tAnt = 0;
  const nav = $('rmnav');
  const mover = mm => {
    if (!$('rmscrub')) return;
    const m = mm != null ? mm : +s.value;
    const k = VIA.findIndex(v => m >= v.a && m < v.b), seg = k >= 0 ? VIA[k] : null;
    const vis = P.segs.find(v => v.tipo === 'vis' && m >= v.a && m <= v.b);
    const antes = P.segs.filter(v => v.b <= m).pop();
    let pt, f = 0, rumbo = null;
    if (seg) { f = (m - seg.a) / ((seg.b - seg.a) || 1); const e = enLinea(PL[k], f); pt = e.pt; rumbo = e.rumbo; }
    else if (vis) pt = [vis.p.xy[1], vis.p.xy[0]];
    else if (antes) { const q = antes.tipo === 'vis' ? antes.p.xy : antes.hasta; pt = [q[1], q[0]]; }
    else pt = [xs[0][1], xs[0][0]];
    myo.setLngLat(pt); yo.classList.toggle('parado', !seg);
    if (rumbo != null) yo.querySelector('.haz').style.transform = `rotate(${rumbo}deg)`;
    const hecho = []; PL.forEach((pl, i) => { if (VIA[i].b <= m) hecho.push(...pl.l); else if (i === k) { const e = enLinea(pl, f); hecho.push(...pl.l.slice(0, e.i), e.pt); } });
    const sh = map.getSource && map.getSource('rm-hecho'); sh && sh.setData({ type: 'Feature', geometry: { type: 'LineString', coordinates: hecho.length > 1 ? hecho : [] } });
    const dura = PLANCFG().visita || 15, sig = P.paradas.find(p => p.ini + dura > m);
    P.paradas.forEach(p => { const el = MK[p.c.id]; if (!el) return; el.classList.toggle('pasada', p.ini + dura <= m); el.classList.toggle('sig', p === sig); });
    const lugar = xy => { const p = P.paradas.find(q => q.xy[0] === xy[0] && q.xy[1] === xy[1]); return p ? p.c.nombre : (salidaUsuario().nombre || 'la salida'); };
    if (seg) nav.innerHTML = `<span class="ico">${RM_SV(RM_COCHE)}</span><div><b>Hacia ${esc(lugar(seg.hasta))}</b><span>Llegas hacia las ${hm(seg.b)}${seg.km != null ? ` · ${String(Math.round((1 - f) * seg.km * 10) / 10).replace('.', ',')} km` : ''}</span></div>`;
    else if (vis) nav.innerHTML = `<span class="ico">${RM_SV('<path d="M20 6 9 17l-5-5"/>')}</span><div><b>En ${esc(vis.p.c.nombre)}</b><span>Hasta las ${hm(vis.b)}${sig && sig !== vis.p ? ' · después, ' + esc(sig.c.nombre) : ''}</span></div>`;
    else nav.innerHTML = sig ? `<span class="ico">${RM_SV('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>')}</span><div><b>Siguiente: ${esc(sig.c.nombre)}</b><span>Hacia las ${hm(sig.ini)}</span></div>`
      : `<span class="ico">${svgIco(ICON_NOM.house || '')}</span><div><b>Jornada terminada</b><span>De vuelta hacia las ${hm(P.fin)}</span></div>`;
    $('rmtx').innerHTML = `A las <b>${hm(m)}</b>`;
    if (cam) {
      const t = performance.now(), g = tAnt ? 1 - Math.exp(-Math.min(500, t - tAnt) / 1000 * 2.2) : 1; tAnt = t;
      cen = cen ? [cen[0] + (pt[0] - cen[0]) * g, cen[1] + (pt[1] - cen[1]) * g] : pt;
      map.jumpTo({ center: cen, zoom: 13.6 });
    }
  };
  s.oninput = () => mover();
  const pb = $('rmplay');
  const parar = () => {
    if (RM_ANIM) cancelAnimationFrame(RM_ANIM); RM_ANIM = null; if (pb) pb.querySelector('span').textContent = 'Ver el día';
    yo.classList.remove('va'); if (cam) { cam = false; cen = null; tAnt = 0; map.fitBounds(bb, { padding: { top: 50, bottom: 90, left: 50, right: 50 }, duration: 900, maxZoom: 15 }); }
  };
  pb.onclick = () => {
    if (RM_ANIM) return parar();
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let m = +s.value >= hi - 5 ? lo : +s.value, t0 = null;
    cam = !reduce; pb.querySelector('span').textContent = 'Parar'; yo.classList.add('va');
    const paso = t => {
      if (!$('rmscrub')) return parar();
      if (t0 == null) t0 = t; const dt = Math.min(0.1, (t - t0) / 1000); t0 = t;
      const enViaje = VIA.some(v => m >= v.a && m <= v.b);
      m = Math.min(hi, m + dt * (enViaje ? 6 : 70)); s.value = m; mover(m);
      if (m < hi) RM_ANIM = requestAnimationFrame(paso); else parar();
    };
    RM_ANIM = requestAnimationFrame(paso);
  };
  mover();
}

function rnCumple(rep, f) {
  if (!rep) return false;
  const d = new Date(f + 'T12:00:00');
  if (rep.tipo === 'fecha') return rep.fecha === f;
  if (d.getDay() !== rnDiaSem(rep.dia)) return false;
  if (rep.tipo === 'semanal') return !rep.desde || f >= rep.desde;
  if (rep.tipo === 'quincenal') { const base = new Date((rep.desde || f) + 'T12:00:00'); const sem = Math.round((d - base) / 864e5 / 7); return f >= (rep.desde || f) && sem % 2 === 0; }
  if (rep.tipo === 'mensual') {
    const n = Math.ceil(d.getDate() / 7);
    if (+rep.semana === 5) { const sig = new Date(d); sig.setDate(d.getDate() + 7); return sig.getMonth() !== d.getMonth(); }
    return n === +rep.semana;
  }
  return false;
}

function rnFechas(rep, desde, hasta) {
  const out = []; if (!rep) return out;
  if (rep.tipo === 'fecha') return rep.fecha && rep.fecha >= desde && rep.fecha <= hasta ? [rep.fecha] : [];
  for (let f = desde; f <= hasta; f = isoMas(f, 1)) if (rnCumple(rep, f)) out.push(f);
  return out;
}

function rnCuando(rep) {
  if (!rep) return 'Sin fecha fija';
  if (rep.tipo === 'fecha') return rep.fecha ? fechaLarga(new Date(rep.fecha + 'T12:00:00')).replace(/^./, c => c.toUpperCase()) : 'Un día concreto';
  if (rep.tipo === 'semanal') return `Cada ${RN_DIAN[rep.dia]}`;
  if (rep.tipo === 'quincenal') return `Cada 15 días, los ${RN_DIAN[rep.dia]}`;
  if (rep.tipo === 'mensual') return `El ${RN_SEM[rep.semana] || 'primer'} ${RN_DIAN[rep.dia]} de cada mes`;
  return '';
}

// El día de referencia para las horas de atención: el de la repetición o el siguiente laborable
function rnFechaRef(rep, nombre) {
  const p = rnProxima(rep); if (p) return p;
  const m = String(nombre || '').toLowerCase().match(/^(lunes|martes|miércoles|jueves|viernes)(?=[\s·]|$)/);
  if (m) { const d = RN_DIAS.find(k => RN_DIAN[k] === m[1]); return rnFechas({ tipo: 'semanal', dia: d }, isoMas(hoyISO(), 1), isoMas(hoyISO(), 8))[0] || siguienteLaborable(); }
  return siguienteLaborable();
}

// ---------- horas ----------
function rnItems(ms, fecha) { return ms.map(m => ({ id: m.id, ref: m, xy: m.lat != null && m.lon != null ? [+m.lat, +m.lon] : null, ventanas: ventanasDe(m.dias, fecha), fija: null })); }

function rnConHor(salida, vuelta, fn) { return conHor({ salida: salida || '09:00', vuelta: vuelta || null }, fn); }

// El mejor orden: el planificador de siempre (cercanía y horas de atención)
function rnOrdenAuto(ms, fecha, salida, vuelta) {
  return rnConHor(salida, vuelta, () => {
    const { seq, fuera } = programarVisitas(rnItems(ms, fecha), minHora(salida || '09:00'));
    return seq.map(s => s.it.ref).concat(fuera.map(f => f.it.ref));
  });
}

// Horas siguiendo el orden que hay (con las fijadas a mano)
function rnHoras(ms, fecha, salida, vuelta, fijas) {
  return rnConHor(salida, vuelta, () => {
    const cfg = PLANCFG(), sal = salidaUsuario(), dura = cfg.visita || 15;
    let pos = sal.lat != null ? [+sal.lat, +sal.lon] : null, t = minHora(salida || '09:00'), km = 0;
    const out = ms.map((m, i) => {
      const xy = m.lat != null ? [+m.lat, +m.lon] : null, ven = ventanasDe(m.dias, fecha);
      const mismo = pos && xy && pos[0] === xy[0] && pos[1] === xy[1];
      const v = pos && xy && !mismo ? minutosEntre(pos, xy) + (cfg.parada || 0) : 0;
      if (pos && xy && !mismo) km += Math.hypot((xy[0] - pos[0]) * 111.32, (xy[1] - pos[1]) * 111.32 * Math.cos(xy[0] * Math.PI / 180)) * 1.3;
      let ini = t + v; const fija = fijas && fijas[m.id] ? minHora(fijas[m.id]) : null;
      if (fija != null) ini = Math.max(ini, fija);
      else if (ven && ven.length) { const w = ven.find(([a, b]) => ini <= b - dura) || null; if (w && ini < w[0]) ini = w[0]; }
      const aviso = !xy ? 'Sin ubicación' : ven && !ven.length ? `Ese día no atiende` : ven && ven.length && !ven.some(([a, b]) => ini >= a && ini + dura <= b) ? `Fuera de su horario (${txtVentanas(ven)})` : '';
      const r = { m, i, ini, fin: ini + dura, viaje: v, ven, aviso, fija: fija != null, mismo }; if (xy) pos = xy; t = ini + dura; return r;
    });
    const tope = minHora(cfg.tope);
    return { filas: out, fin: t, km, pasa: vuelta && t > tope };
  });
}

function rnNombreAuto(ms, rep) {
  const munis = [...new Set(ms.map(m => rpTitulo(m.municipio || '')).filter(Boolean))];
  const dia = rep && rep.dia ? RN_DIAN[rep.dia].replace(/^./, c => c.toUpperCase()) : rep && rep.tipo === 'fecha' && rep.fecha ? fechaCorta(rep.fecha) : '';
  const zona = munis.length ? munis.slice(0, 2).join(' y ') + (munis.length > 2 ? ' y más' : '') : 'Nueva ruta';
  return dia ? `${dia} · ${zona}` : zona;
}

// ---------- Mis rutas ----------
function rnCroquis(ms) {
  const pts = []; ms.forEach(m => { if (m.lat == null) return; if (!pts.some(u => u.lat === +m.lat && u.lon === +m.lon)) pts.push({ lat: +m.lat, lon: +m.lon }); });
  if (!pts.length) return '<div class="rnsin">Sin ubicaciones</div>';
  const W = 400, H = 140, P = 22, PT = 44, la = pts.map(p => p.lat), lo = pts.map(p => p.lon);
  const a0 = Math.min(...la), a1 = Math.max(...la), o0 = Math.min(...lo), o1 = Math.max(...lo), k = Math.cos(a0 * Math.PI / 180);
  const s = Math.min((W - 2 * P) / Math.max(1e-6, (o1 - o0) * k), (H - P - PT) / Math.max(1e-6, a1 - a0));
  const cx = (W - (o1 - o0) * k * s) / 2, cy = (H - PT - P - (a1 - a0) * s) / 2 + P;
  const ps = pts.map(p => [cx + (p.lon - o0) * k * s, H - cy - (p.lat - a0) * s]);
  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><polyline points="${ps.map(p => p.map(v => v.toFixed(1)).join(',')).join(' ')}" fill="none" stroke="#3F82C0" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>
    ${ps.map((p, i) => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="10.5" fill="#17457A" stroke="#fff" stroke-width="2.5"/><text x="${p[0].toFixed(1)}" y="${(p[1] + 4).toFixed(1)}" text-anchor="middle" font-size="11" font-weight="800" fill="#fff" font-family="Manrope, sans-serif">${i + 1}</text>`).join('')}</svg>`;
}

async function rnMiembros(r) {
  const { data } = await db.rpc('cuentas_de_ruta', { p_id: r.id });
  const ms = data || [], pos = id => { const i = (r.codigos || []).indexOf(id); return i < 0 ? 1e9 : i; };
  return r.dinamica ? ms : ms.slice().sort((a, b) => pos(a.id) - pos(b.id));
}

// ---------- pasar a la agenda ----------
async function rnCitasEn(r, ms, fechas) {
  let n = 0, saltados = [];
  const bloq = fechas.length ? await bloqueadosSemana(fechas[0], fechas[fechas.length - 1]) : {};
  for (const f of fechas) {
    if (bloq[f]) { saltados.push(f); continue; }
    const existentes = await citasDelDia(f), ids = [];
    let orden = existentes.length;
    for (const m of ms) {
      const ya = existentes.find(c => c.cuenta_id === m.id && CITA_ABIERTA.includes(c.estado));
      if (ya) { ids.push(ya.id); continue; }
      const { data: x, error } = await db.rpc('guardar_cita', { p: { cuenta_id: m.id, fecha: f, hora: (r.fijas || {})[m.id] || null, centro_nombre: m.centro_nombre || null,
        estado: CITA_ABIERTA[0], origen: 'Ruta', orden: ++orden, salida: r.salida || null, vuelta: r.vuelta || null, op_id: `r-${r.id}-${m.id}-${f}` } });
      if (error || !x || !x.ok) { toast('No se ha podido guardar alguna cita', true); return { n, saltados, error: true }; }
      ids.push(x.id); n++;
    }
    const cerradas = existentes.filter(c => !CITA_ABIERTA.includes(c.estado)).map(c => c.id);
    const otras = existentes.filter(c => CITA_ABIERTA.includes(c.estado) && !ids.includes(c.id)).map(c => c.id);
    await db.rpc('ordenar_citas', { p_ids: cerradas.concat(otras, ids) });
  }
  invalidarCache();
  return { n, saltados };
}

// Las rutas que se repiten se rellenan solas hasta 4 semanas vista (una vez al día, solo las propias)
async function rnRellenar() {
  try {
    const k = 'delcos-rnrell-' + (PERFIL || {}).id; if (localStorage.getItem(k) === hoyISO()) return;
    localStorage.setItem(k, hoyISO());
    const { data } = await RPC_ORIG('rutas_visibles', {});
    for (const r of (data || []).filter(x => x.mia && x.repeticion && x.repeticion.tipo !== 'fecha')) {
      const rep = r.repeticion, desde = rep.hasta && rep.hasta >= hoyISO() ? isoMas(rep.hasta, 1) : (rep.desde && rep.desde > hoyISO() ? rep.desde : hoyISO());
      const fechas = rnFechas(rep, desde, isoMas(hoyISO(), 28)); if (!fechas.length) continue;
      const ms = (await rnMiembros(r)).filter(m => m.lat != null); if (!ms.length) continue;
      const res = await rnCitasEn(r, ms, fechas);
      if (!res.error) await db.rpc('guardar_ruta', { p: { id: r.id, repeticion: Object.assign({}, rep, { hasta: fechas[fechas.length - 1] }) } });
    }
  } catch (e) {}
}

// ---------- crear o editar ----------
function rnAbrir(item, paso) {
  const r = item && item.r;
  const rep = r ? (r.repeticion || null) : { tipo: 'semanal', dia: RN_DIAS[Math.max(0, new Date(siguienteLaborable() + 'T12:00:00').getDay() - 1)] || 'L', desde: siguienteLaborable() };
  RN = { id: r ? r.id : null, nombre: r ? r.nombre : '', auto: !r, ms: item ? item.ms.slice() : [], rep, salida: r && r.salida ? String(r.salida).slice(0, 5) : '09:00',
    vuelta: r && r.vuelta ? String(r.vuelta).slice(0, 5) : '', fijas: Object.assign({}, (r && r.fijas) || {}), ordenManual: !!r, paso: paso || 1, centros: r ? r.centros || [] : [],
    q: '', fil: { mios: true, urg: false, dia: false, nunca: false }, res: [], mapa: null };
  if (TAB !== 'rutas') ir('rutas'); else rnPintar();
}

function rnCerrar() { RN = null; if (RM_MAPA) { try { RM_MAPA.remove(); } catch (e) {} RM_MAPA = null; } cargarRutas(); }

function rnNombre() { if (RN.auto) RN.nombre = rnNombreAuto(RN.ms, RN.rep); return RN.nombre || 'Nueva ruta'; }

function rnPintar() {
  const v = $('v-rutas'); if (!v || !RN) return;
  const pasos = [['1', 'A quién vas a ver'], ['2', 'Orden y horario'], ['3', 'Vista previa y cuándo']];
  v.innerHTML = `<div class="rnroot">
    <div><button class="rnvol" type="button" id="rnvol">‹ Mis rutas</button>
      <div class="rntit"><input id="rnnom" value="${esc(rnNombre())}" aria-label="Nombre de la ruta" maxlength="80"><span class="rnlap">${rnSV(RN_IC.lapiz)}</span></div>
      <div class="sm rnnomsm">${RN.auto ? 'Nombre propuesto con el día y los municipios: puedes cambiarlo' : 'Nombre de la ruta'}</div></div>
    <div class="rnpasos" role="tablist">${pasos.map(([n, t]) => `<button type="button" role="tab" data-rnp="${n}" class="${+n === RN.paso ? 'on' : +n < RN.paso ? 'ok' : ''}" aria-selected="${+n === RN.paso}" ${+n > 1 && !RN.ms.length ? 'disabled' : ''}><i>${+n < RN.paso ? '✓' : n}</i><span>${t}</span></button>`).join('')}</div>
    <div id="rnpaso"></div></div>`;
  $('rnvol').onclick = rnCerrar;
  $('rnnom').oninput = e => { RN.nombre = e.target.value; RN.auto = !e.target.value.trim(); };
  v.querySelectorAll('[data-rnp]').forEach(b => b.onclick = () => { if (b.disabled) return; RN.paso = +b.dataset.rnp; rnPintar(); });
  if (RN.paso === 1) rnPaso1(); else if (RN.paso === 2) rnPaso2(); else rnPaso3();
}

// Paso 1: a quién vas a ver
async function rnBuscar() {
  const f = RN.fil, dia = RN.rep && RN.rep.dia;
  const { data } = await db.rpc('buscar_cuentas', { q: RN.q || null, f_provincia: null, f_municipio: null, f_estado: null, f_especialidad: null, f_area: null,
    f_urgentes: !!f.urg, f_mios: !!f.mios, f_sin_visitar: !!f.nunca, f_comercial: null, f_reporting: null, orden: null, lim: 200, desplaz: 0 });
  let l = ((data || {}).filas || []);
  // Sin cartera propia (p. ej. administración), «Mi cartera» se quita sola la primera vez
  if (f.mios && !l.length && !RN.q && !RN.__sinCartera) { RN.__sinCartera = true; f.mios = false; return rnBuscar(); }
  if (f.dia && dia) l = l.filter(m => m.dias && m.dias[dia]);
  RN.res = l;
}

async function rnPaso1() {
  const caja = $('rnpaso'), dia = RN.rep && RN.rep.dia;
  caja.innerHTML = `<div class="rnb1"><div class="rnsel">
      <div class="rnbus">${rnSV(RN_IC.lupa)}<input id="rnq" placeholder="Busca por nombre, centro o municipio" value="${esc(RN.q)}" autocomplete="off"></div>
      <div class="rnfil" role="group" aria-label="Filtros">
        <button type="button" data-rnf="mios" class="${RN.fil.mios ? 'on' : ''}" id="rnfmios">Mi cartera</button><button type="button" data-rnf="urg" class="${RN.fil.urg ? 'on' : ''}">Urgentes</button>
        ${dia ? `<button type="button" data-rnf="dia" class="${RN.fil.dia ? 'on' : ''}">Atienden el ${RN_DIAN[dia]}</button>` : ''}<button type="button" data-rnf="nunca" class="${RN.fil.nunca ? 'on' : ''}">Nunca visitados</button></div>
      <div class="rnres" id="rnres"><div class="sm" style="padding:10px 4px">Buscando…</div></div></div>
    <div class="rnmini"><div class="mc" id="rnmc"></div><div class="rnley"><span><i style="background:#17457A"></i>En la ruta</span><span><i style="background:#9FB6CE"></i>Para añadir</span><span><i style="background:#E08A00"></i>Urgente</span></div></div></div>
    ${rnPie(`<b id="rnn">${RN.ms.length}</b> elegidos`, `<button class="btn" type="button" id="rnsig1" ${RN.ms.length ? '' : 'disabled'}>Siguiente: orden y horario</button>`)}`;
  let tq = null;
  $('rnq').oninput = e => { RN.q = e.target.value; clearTimeout(tq); tq = setTimeout(async () => { await rnBuscar(); rnLista1(); rnMapa1(); }, 300); };
  caja.querySelectorAll('[data-rnf]').forEach(b => b.onclick = async () => { RN.fil[b.dataset.rnf] = !RN.fil[b.dataset.rnf]; b.classList.toggle('on'); await rnBuscar(); rnLista1(); rnMapa1(); });
  $('rnsig1').onclick = () => { RN.paso = 2; if (!RN.ordenManual) rnAuto(); rnPintar(); };
  await rnBuscar(); if (!$('rnres')) return;
  if ($('rnfmios')) $('rnfmios').classList.toggle('on', !!RN.fil.mios);
  rnLista1(); rnMapa1();
}

function rnToggle(m) {
  const i = RN.ms.findIndex(x => x.id === m.id);
  if (i >= 0) { RN.ms.splice(i, 1); delete RN.fijas[m.id]; } else RN.ms.push(m);
  RN.ordenManual = false;
  if ($('rnn')) $('rnn').textContent = RN.ms.length;
  if ($('rnsig1')) $('rnsig1').disabled = !RN.ms.length;
  if (RN.auto && $('rnnom')) $('rnnom').value = rnNombre();
  document.querySelectorAll('[data-rnp="2"], [data-rnp="3"]').forEach(b => b.disabled = !RN.ms.length);
  rnLista1(); rnMapa1();
}

function rnLista1() {
  const c = $('rnres'); if (!c) return;
  const sel = new Set(RN.ms.map(m => m.id)), dia = RN.rep && RN.rep.dia;
  const l = RN.ms.filter(m => !RN.res.some(x => x.id === m.id)).concat(RN.res);
  c.innerHTML = l.length ? l.slice(0, 120).map(m => `<button type="button" class="rnopt ${sel.has(m.id) ? 'on' : ''}" data-rnm="${m.id}" aria-pressed="${sel.has(m.id)}">
      <span class="ck">${sel.has(m.id) ? rnSV(RN_IC.check) : ''}</span>
      <span class="tx"><b>${esc(m.nombre)}</b><span class="sm">${esc([m.centro_nombre, rpTitulo(m.municipio || '')].filter(Boolean).join(' · '))}${dia && m.dias ? (m.dias[dia] ? ` · atiende ${esc(String(m.dias[dia]))}` : ` · no atiende el ${RN_DIAN[dia]}`) : ''}</span></span>
      <span class="tag ${m.urgente ? 'u' : ''}">${m.urgente ? 'Urgente' : esc(m.estado_comercial || '')}</span></button>`).join('')
    : `<div class="vacio">No hay ${TT('medico', 'p', '', 'l', 'l')} con esos filtros.</div>`;
  c.querySelectorAll('[data-rnm]').forEach(b => b.onclick = () => { const m = l.find(x => x.id === b.dataset.rnm); if (m) rnToggle(m); });
}

async function rnMapaBase(el, ms) {
  const ml = await rmLib();
  if (RM_MAPA) { const viejo = RM_MAPA; RM_MAPA = null; setTimeout(() => { try { viejo.remove(); } catch (e) {} }, 0); }
  const map = new ml.Map({ container: el, style: 'https://tiles.openfreemap.org/styles/liberty', maxPitch: 0, dragRotate: false, attributionControl: { compact: true } });
  RM_MAPA = map; map.touchZoomRotate.disableRotation();
  map.addControl(new ml.NavigationControl({ showCompass: false }), 'top-right');
  map.__mk = [];
  map.on('load', () => { if (!map.style) return; rnRestilo(map); map.__listo = true; });
  return { ml, map };
}

function rnRestilo(map) {
  (map.getStyle().layers || []).forEach(l => {
    const id = l.id, set = (k, v) => { try { map.setPaintProperty(id, k, v); } catch (e) {} }, off = () => { try { map.setLayoutProperty(id, 'visibility', 'none'); } catch (e) {} };
    if (/^rn-/.test(id)) return;
    if (l.type === 'fill-extrusion') return off();
    if (l.type === 'background') return set('background-color', RM_PAL.tierra);
    if (l.type === 'symbol') { if (/poi|aeroway|housenumber|transit|rail|ferry|shield/i.test(id)) return off(); set('text-color', RM_PAL.texto); set('text-halo-color', '#FFFFFF'); set('text-halo-width', 1.4); return; }
    if (l.type === 'fill') { if (/water/i.test(id)) return set('fill-color', RM_PAL.agua); if (/building/i.test(id)) return set('fill-color', RM_PAL.edif); if (/park|wood|grass|forest|landcover|cemetery|pitch/i.test(id)) { set('fill-color', RM_PAL.parque); return set('fill-opacity', 0.8); } set('fill-color', RM_PAL.zona); return set('fill-opacity', 0.6); }
    if (l.type === 'line') { if (/water|river|stream|canal/i.test(id)) return set('line-color', RM_PAL.agua); if (/rail|ferry|aeroway|boundary|admin/i.test(id)) return off(); const g = /motorway|trunk|primary/i.test(id); set('line-color', /casing/i.test(id) ? (g ? RM_PAL.viaBorde : RM_PAL.borde) : (g ? RM_PAL.via : RM_PAL.calle)); }
  });
}

function rnPintarCapas(map, ml, ms, otros, linea, encaje) {
  if (!map || !ml || !map.getContainer().isConnected) return;
  const fijo = () => {
    if (!map.style || !map.getContainer().isConnected) return;
    const src = (id, data) => { const s = map.getSource(id); if (s) s.setData(data); else map.addSource(id, { type: 'geojson', data }); };
    src('rn-otros', rnFC((otros || []).filter(m => m.lat != null).map(m => ({ type: 'Feature', properties: { id: m.id, u: m.urgente ? 1 : 0 }, geometry: { type: 'Point', coordinates: [+m.lon, +m.lat] } }))));
    src('rn-linea', { type: 'Feature', geometry: { type: 'LineString', coordinates: linea || [] } });
    if (!map.getLayer('rn-linea-b')) {
      map.addLayer({ id: 'rn-linea-b', type: 'line', source: 'rn-linea', paint: { 'line-color': RM_PAL.rutaBorde, 'line-width': 7 }, layout: { 'line-cap': 'round', 'line-join': 'round' } });
      map.addLayer({ id: 'rn-linea', type: 'line', source: 'rn-linea', paint: { 'line-color': RM_PAL.ruta, 'line-width': 4.5 }, layout: { 'line-cap': 'round', 'line-join': 'round' } });
      map.addLayer({ id: 'rn-otros', type: 'circle', source: 'rn-otros', paint: { 'circle-radius': 7, 'circle-color': ['case', ['==', ['get', 'u'], 1], '#E08A00', '#9FB6CE'], 'circle-stroke-color': '#fff', 'circle-stroke-width': 2 } });
      map.on('click', 'rn-otros', e => { const id = e.features && e.features[0] && e.features[0].properties.id; const m = (RN && RN.res || []).find(x => x.id === id); if (m) rnToggle(m); });
      map.on('mouseenter', 'rn-otros', () => { map.getCanvas().style.cursor = 'pointer'; }); map.on('mouseleave', 'rn-otros', () => { map.getCanvas().style.cursor = ''; });
    }
  };
  if (map.__listo) fijo(); else map.once('load', () => setTimeout(fijo, 0));
  map.__mk.forEach(m => m.remove()); map.__mk = [];
  const sal = salidaUsuario();
  if (sal.lat != null) { const e = document.createElement('div'); e.className = 'rmcasa'; e.innerHTML = svgIco(ICON_NOM.house || ''); map.__mk.push(new ml.Marker({ element: e }).setLngLat([+sal.lon, +sal.lat]).addTo(map)); }
  const grupos = []; ms.forEach((m, i) => { if (m.lat == null) return; const u = grupos[grupos.length - 1]; if (u && u.lat === +m.lat && u.lon === +m.lon) u.n.push(i + 1); else grupos.push({ lat: +m.lat, lon: +m.lon, n: [i + 1], m }); });
  grupos.forEach(g => { const e = document.createElement('button'); e.type = 'button'; e.className = 'rmmk' + (g.n.length > 1 ? ' multi' : ''); e.style.setProperty('--c', '#17457A');
    e.innerHTML = `<span>${g.n.length > 2 ? g.n[0] + '–' + g.n[g.n.length - 1] : g.n.join('·')}</span>`; e.title = g.m.nombre;
    if (RN && RN.paso === 1) e.onclick = ev => { ev.stopPropagation(); rnToggle(g.m); };
    map.__mk.push(new ml.Marker({ element: e, anchor: 'bottom' }).setLngLat([g.lon, g.lat]).addTo(map)); });
  if (encaje !== false) {
    const xs = ms.concat(otros || []).filter(m => m.lat != null).map(m => [+m.lon, +m.lat]).concat(sal.lat != null && ms.length ? [[+sal.lon, +sal.lat]] : []);
    if (xs.length) { const b = xs.reduce((b, p) => [[Math.min(b[0][0], p[0]), Math.min(b[0][1], p[1])], [Math.max(b[1][0], p[0]), Math.max(b[1][1], p[1])]], [[180, 90], [-180, -90]]);
      map.fitBounds(b, { padding: 50, duration: map.__ya ? 500 : 0, maxZoom: 14 }); map.__ya = true; }
  }
}

async function rnMapa1() {
  const el = $('rnmc'); if (!el || !RN) return;
  if (!RM_MAPA || RM_MAPA.getContainer() !== el) {
    if (!RN_MAPA_P || RN_MAPA_P.el !== el) { RN_MAPA_P = rnMapaBase(el).then(({ ml, map }) => { map.__ml = ml; }); RN_MAPA_P.el = el; }
    await RN_MAPA_P;
  }
  if (!$('rnmc') || !RM_MAPA || !RM_MAPA.__ml || RM_MAPA.getContainer() !== $('rnmc')) return;
  const map = RM_MAPA, sel = new Set(RN.ms.map(m => m.id)), sal = salidaUsuario();
  const linea = (sal.lat != null && RN.ms.length ? [[+sal.lon, +sal.lat]] : []).concat(RN.ms.filter(m => m.lat != null).map(m => [+m.lon, +m.lat]));
  rnPintarCapas(map, map.__ml, RN.ms, RN.res.filter(m => !sel.has(m.id)), linea, !map.__ya);
}

// Paso 2: orden y horario
function rnAuto() { const f = rnFechaRef(RN.rep, RN.nombre); RN.ms = rnOrdenAuto(RN.ms, f, RN.salida, RN.vuelta); RN.ordenManual = false; }

function rnPaso2() {
  const caja = $('rnpaso'), f = rnFechaRef(RN.rep, RN.nombre), h = rnHoras(RN.ms, f, RN.salida, RN.vuelta, RN.fijas);
  const sal = salidaUsuario();
  caja.innerHTML = `<div class="rnb2"><div class="rnord">
      <div class="rnordcab"><div class="rnhor2"><label>Sales a las <input type="time" id="rnsal" value="${esc(RN.salida)}"></label><label>Vuelves como tarde <input type="time" id="rnvue" value="${esc(RN.vuelta)}" placeholder="Sin hora"></label>
        <span class="sm">Desde ${esc(sal.nombre || 'tu punto de salida')} · horas calculadas para el ${esc(fechaLarga(new Date(f + 'T12:00:00')))}</span></div>
        <button class="btn sec" type="button" id="rnauto">${rnSV(RN_IC.varita)} ${RN.ordenManual ? 'Volver al orden automático' : 'Orden automático'}</button></div>
      <p class="sm rnordtx">${RN.ordenManual ? 'Has cambiado el orden a mano.' : 'El mejor orden: el más corto que respeta las horas de atención.'} Usa las flechas para cambiarlo y toca una hora para fijarla.</p>
      <div class="rnlst">${h.filas.map((x, i) => `${i && !x.mismo && x.viaje ? `<div class="rntramo">${Math.round(x.viaje)} min</div>` : ''}<div class="rnpar ${x.aviso ? 'aviso' : ''}">
          <span class="n">${i + 1}</span>
          <div class="tx"><b>${esc(x.m.nombre)}</b><span class="sm">${esc([x.m.centro_nombre, rpTitulo(x.m.municipio || '')].filter(Boolean).join(' · '))}</span>
            <span class="sm ${x.aviso ? 'rnav' : ''}">${esc(x.aviso || (x.ven && x.ven.length ? 'Atiende ' + txtVentanas(x.ven) : ''))}</span></div>
          <div class="der"><button type="button" class="rnh ${x.fija ? 'fija' : ''}" data-rnh="${x.m.id}" title="${x.fija ? 'Hora fijada: toca para cambiarla o quitarla' : 'Hora calculada: toca para fijarla'}">${x.fija ? rnSV(RN_IC.reloj) : '~'}${hm(x.ini)}</button>
            <span class="ops"><button type="button" data-rnmv="-1|${i}" aria-label="Subir" ${i ? '' : 'disabled'}>${rnSV(RN_IC.up)}</button><button type="button" data-rnmv="1|${i}" aria-label="Bajar" ${i < h.filas.length - 1 ? '' : 'disabled'}>${rnSV(RN_IC.down)}</button>
              <button type="button" data-rnx="${i}" aria-label="Quitar">${rnSV(RN_IC.x)}</button></span></div></div>`).join('')}</div></div>
    <div class="rnresum"><div><b>${RN.ms.length}</b>${TT('medico', 'p', '', 'l', 'l')}</div><div><b>${new Set(RN.ms.filter(m => m.lat != null).map(m => m.lat + ',' + m.lon)).size}</b>paradas</div>
      <div><b>${Math.round(h.km)} km</b>aprox.</div><div><b class="${h.pasa ? 'rnmal' : ''}">${hm(h.fin)}</b>terminas${h.pasa ? ' (pasa de tu hora de vuelta)' : ''}</div></div></div>
    ${rnPie('Lo ves en el mapa en el paso siguiente.', '<button class="btn sec" type="button" id="rnant2">‹ Atrás</button><button class="btn" type="button" id="rnsig2">Siguiente: vista previa</button>')}`;
  $('rnsal').onchange = e => { RN.salida = e.target.value || '09:00'; if (!RN.ordenManual) rnAuto(); rnPaso2(); };
  $('rnvue').onchange = e => { RN.vuelta = e.target.value || ''; if (!RN.ordenManual) rnAuto(); rnPaso2(); };
  $('rnauto').onclick = () => { rnAuto(); rnPaso2(); };
  caja.querySelectorAll('[data-rnmv]').forEach(b => b.onclick = () => { const [d, i] = b.dataset.rnmv.split('|').map(Number), j = i + d; [RN.ms[i], RN.ms[j]] = [RN.ms[j], RN.ms[i]]; RN.ordenManual = true; rnPaso2(); });
  caja.querySelectorAll('[data-rnx]').forEach(b => b.onclick = () => { const m = RN.ms.splice(+b.dataset.rnx, 1)[0]; if (m) delete RN.fijas[m.id]; if (!RN.ms.length) { RN.paso = 1; return rnPintar(); } rnPaso2(); });
  caja.querySelectorAll('[data-rnh]').forEach(b => b.onclick = async () => {
    const id = b.dataset.rnh, x = h.filas.find(y => y.m.id === id);
    const op = await elegirOpcion('Hora de la visita', `${x.m.nombre}${x.ven && x.ven.length ? ' · atiende ' + txtVentanas(x.ven) : ''}`,
      [{ k: 'no', t: 'Cancelar', cls: 'sec' }].concat(RN.fijas[id] ? [{ k: 'quitar', t: 'Que la calcule la app', cls: 'sec' }] : []).concat([{ k: 'fijar', t: 'Fijar una hora' }]));
    if (op === 'quitar') { delete RN.fijas[id]; return rnPaso2(); }
    if (op !== 'fijar') return;
    const v = await pedirCampo('Fijar la hora', 'time', RN.fijas[id] || hm(x.ini), 'Hora'); if (!v) return;
    RN.fijas[id] = v; rnPaso2();
  });
  $('rnant2').onclick = () => { RN.paso = 1; rnPintar(); };
  $('rnsig2').onclick = () => { RN.paso = 3; rnPintar(); };
}

// Paso 3: vista previa y cuándo
function rnRepHtml() {
  const rep = RN.rep || null, t = rep ? rep.tipo : 'nada', dia = (rep && rep.dia) || 'L';
  const op = (k, tx) => `<button type="button" data-rnrt="${k}" class="${t === k ? 'on' : ''}" aria-pressed="${t === k}">${tx}</button>`;
  return `<div class="rncuando"><h3>¿Cuándo la haces?</h3>
    <div class="segs rnrt" role="group" aria-label="Cuándo">${op('fecha', 'Un día')}${op('semanal', 'Cada semana')}${op('quincenal', 'Cada 15 días')}${op('mensual', 'Una vez al mes')}${op('nada', 'Sin fecha')}</div>
    ${t === 'fecha' ? `<label for="rnfe">Día</label><input type="date" id="rnfe" value="${esc((rep && rep.fecha) || siguienteLaborable())}" min="${hoyISO()}">` : ''}
    ${['semanal', 'quincenal', 'mensual'].includes(t) ? `<div class="rndias2" role="group" aria-label="Día de la semana">${RN_DIAS.map(d => `<button type="button" data-rnd="${d}" class="${d === dia ? 'on' : ''}">${RN_DIAN[d].charAt(0).toUpperCase() + RN_DIAN[d].slice(1, 3)}</button>`).join('')}</div>` : ''}
    ${t === 'mensual' ? `<label for="rnsem">Qué semana del mes</label><select id="rnsem">${[1, 2, 3, 4, 5].map(n => `<option value="${n}" ${+((rep && rep.semana) || 1) === n ? 'selected' : ''}>${n === 5 ? 'La última' : `La ${RN_SEM[n].replace(/r$/, 'ra')}`}</option>`).join('')}</select>` : ''}
    ${t === 'quincenal' ? `<label for="rnde">Empezando el</label><input type="date" id="rnde" value="${esc((rep && rep.desde) || siguienteLaborable())}" min="${hoyISO()}">` : ''}
    <p class="sm rnrtx">${t === 'nada' ? 'Se guarda sin fecha: la pasas a tu agenda cuando quieras.' : `${esc(rnCuando(rep))}.${(() => { const f = rnFechas(rep, hoyISO(), rnHorizonte(rep)).slice(0, 4); return f.length ? ` Próximas: ${f.map(x => fechaCorta(x)).join(', ')}.` : ''; })()}`}</p></div>`;
}

async function rnPaso3() {
  const caja = $('rnpaso'), f = rnFechaRef(RN.rep, RN.nombre), h = rnHoras(RN.ms, f, RN.salida, RN.vuelta, RN.fijas), sal = salidaUsuario();
  const repetida = RN.rep && RN.rep.tipo !== 'fecha';
  caja.innerHTML = `<div class="rnb3"><div class="rnmini"><div class="mc" id="rnmc"></div><div class="rnchip" id="rnchip">Calculando la ruta…</div></div>
      <div class="rnlado"><div class="rntl"><h3 id="rntlh">${esc(fechaLarga(new Date(f + 'T12:00:00')).replace(/^./, c => c.toUpperCase()))} · así será tu día</h3><div id="rntl"></div></div>${rnRepHtml()}</div></div>
    ${rnPie(RN.id ? 'Los cambios se guardan en la ruta; las citas que ya están en tu agenda no cambian.' : 'Se guarda en Mis rutas.',
      `<button class="btn sec" type="button" id="rnant3">‹ Atrás</button><button class="btn sec" type="button" id="rnguar">Guardar ruta</button><button class="btn" type="button" id="rnguarag">${RN.rep ? 'Guardar y pasar a mi agenda' : 'Guardar y elegir el día'}</button>`)}`;
  const tl = (hh, tramos) => {
    const filas = hh.filas;
    $('rntl').innerHTML = `<div class="rntli viaje"><span class="h">${hm(minHora(RN.salida || '09:00'))}</span><span class="l"></span><span class="t">Sales de ${esc(sal.nombre || 'tu punto de salida')}</span></div>
      ${filas.map((x, i) => `${i && !x.mismo && x.viaje ? `<div class="rntli viaje"><span class="h"></span><span class="l"></span><span class="t">${Math.round(x.viaje)} min de coche</span></div>` : ''}
        <div class="rntli"><span class="h">${hm(x.ini)}</span><span class="l"><i></i></span><span class="t"><b>${i + 1}. ${esc(x.m.nombre)}</b><span class="sm">${esc(x.m.centro_nombre || rpTitulo(x.m.municipio || ''))}${x.aviso ? ` · <span class="rnav">${esc(x.aviso)}</span>` : ''}</span></span></div>`).join('')}
      <div class="rntli viaje"><span class="h">${hm(hh.fin)}</span><span class="l"></span><span class="t">Terminas la última ${TT('visita', 's', '', 'l', 'l')}</span></div>`;
  };
  tl(h);
  const pon = () => { const c = caja.querySelector('.rncuando'); c.outerHTML = rnRepHtml(); engancharRep(); const f2 = rnFechaRef(RN.rep, RN.nombre); if ($('rntlh')) $('rntlh').textContent = fechaLarga(new Date(f2 + 'T12:00:00')).replace(/^./, c => c.toUpperCase()) + ' · así será tu día'; tl(rnHoras(RN.ms, f2, RN.salida, RN.vuelta, RN.fijas)); if (RN.auto && $('rnnom')) $('rnnom').value = rnNombre(); $('rnguarag').textContent = RN.rep ? 'Guardar y pasar a mi agenda' : 'Guardar y elegir el día'; };
  const engancharRep = () => {
    caja.querySelectorAll('[data-rnrt]').forEach(b => b.onclick = () => { const t = b.dataset.rnrt, dia = (RN.rep && RN.rep.dia) || 'L';
      RN.rep = t === 'nada' ? null : t === 'fecha' ? { tipo: 'fecha', fecha: (RN.rep && RN.rep.fecha) || siguienteLaborable() } : t === 'mensual' ? { tipo: 'mensual', dia, semana: (RN.rep && RN.rep.semana) || 1 }
        : { tipo: t, dia, desde: (RN.rep && RN.rep.desde) || siguienteLaborable() }; pon(); });
    caja.querySelectorAll('[data-rnd]').forEach(b => b.onclick = () => { RN.rep = Object.assign({}, RN.rep, { dia: b.dataset.rnd }); pon(); });
    if ($('rnfe')) $('rnfe').onchange = e => { RN.rep = { tipo: 'fecha', fecha: e.target.value }; pon(); };
    if ($('rnde')) $('rnde').onchange = e => { RN.rep = Object.assign({}, RN.rep, { desde: e.target.value }); pon(); };
    if ($('rnsem')) $('rnsem').onchange = e => { RN.rep = Object.assign({}, RN.rep, { semana: +e.target.value }); pon(); };
    if (typeof mejorarCampos === 'function') mejorarCampos(caja);
  };
  engancharRep();
  $('rnant3').onclick = () => { RN.paso = 2; rnPintar(); };
  $('rnguar').onclick = () => rnGuardar(false);
  $('rnguarag').onclick = () => rnGuardar(true);
  // El mapa: en recto y, si contesta la función, por las calles
  const el = $('rnmc'); const { ml, map } = await rnMapaBase(el); if (!$('rnmc')) return;
  const conXY = RN.ms.filter(m => m.lat != null);
  const pts = (sal.lat != null ? [[+sal.lat, +sal.lon]] : []).concat(conXY.map(m => [+m.lat, +m.lon]));
  const puntos = pts.filter((p, i) => !i || p[0] !== pts[i - 1][0] || p[1] !== pts[i - 1][1]);
  rnPintarCapas(map, ml, RN.ms, null, puntos.map(p => [p[1], p[0]]));
  if (puntos.length < 2 || puntos.length > 30) { $('rnchip').textContent = 'Vista previa en línea recta'; return; }
  const res = await rmRuta(puntos, `${f}T${RN.salida || '09:00'}:00`); if (!$('rnchip')) return;
  if (res.ok && res.tramos && res.tramos.length === puntos.length - 1) {
    const linea = res.tramos.flatMap(t => (t.linea || []).map(([la, lo]) => [lo, la]));
    rnPintarCapas(map, ml, RN.ms, null, linea, false);
    $('rnchip').innerHTML = `Por las calles, con tráfico · <b>${String(res.km).replace('.', ',')} km</b> · <b>${rmDur(res.min)}</b> al volante <span class="rmfuente">Ruta: © TomTom</span>`;
  } else $('rnchip').textContent = `${RM_MOTIVO[res.motivo] || RM_MOTIVO.servicio}: vista previa en línea recta`;
}

async function rnGuardar(agenda) {
  const nombre = ($('rnnom') && $('rnnom').value.trim()) || rnNombre();
  const rep = RN.rep ? Object.assign({}, RN.rep) : null;
  if (rep) delete rep.hasta;   // al cambiar la ruta, la agenda se vuelve a mirar desde hoy
  const p = { nombre, codigos: RN.ms.map(m => m.id), reglas: null, salida: RN.salida || null, vuelta: RN.vuelta || null, repeticion: rep,
    fijas: Object.keys(RN.fijas).length ? RN.fijas : null, centros: RN.centros || [] };
  if (RN.id) p.id = RN.id;
  const b1 = $('rnguar'), b2 = $('rnguarag'); [b1, b2].forEach(b => b && (b.disabled = true));
  const { data, error } = await db.rpc('guardar_ruta', { p });
  [b1, b2].forEach(b => b && (b.disabled = false));
  if (error || !data || !data.ok) { toast('No se ha podido guardar la ruta' + (error ? ': ' + error.message : ''), true); return; }
  invalidarCache();
  const ms = RN.ms.slice();
  RN = null;
  toast('Ruta guardada');
  if (agenda) return rnPasarAgenda({ r: Object.assign({}, p, { id: data.id, mia: true }), ms });
  cargarRutas();
}
