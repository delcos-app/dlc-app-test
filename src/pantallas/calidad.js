// pantallas/calidad.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.

async function cargarSeguimientoPaso2() {
  const s = document.querySelector('#v-seguimiento .saludo');
  if (s && !$('calvolver')) s.insertAdjacentHTML('beforebegin', `<button class="cfgvolver visible" id="calvolver" type="button">‹ ${TT('medico', 'p', '', 'l', 'C')}</button>`);
  if ($('calvolver')) $('calvolver').onclick = () => ir('directorio');
  document.querySelectorAll('nav.main [data-t]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.t === 'directorio')));
}

async function cargarSeguimientoBase() {
  $('v-seguimiento').innerHTML = `
    <div class="saludo"><div><h1>Seguimiento</h1><div class="fecha">Cómo avanza cada ${TT('medico', 's', '', 'l', 'l')}</div></div>
      <div class="acts" style="margin:0">
</div></div>
    <div class="kpis" id="segkpis"><div class="skel"></div></div>
    <div class="panel">
      <div class="filtros">
        <div><label for="sest">Estado comercial</label><select id="sest"></select></div>
        <div><label for="sprov">Provincia</label><select id="sprov"></select></div>
        <div><label for="smuni">Municipio</label><select id="smuni"></select></div>
        <div><label for="smodo">Mostrar</label><select id="smodo">
          <option value="todos">Todos</option>
          <option value="visitados">Solo visitados</option>
          <option value="sin_visitar">Sin visitar</option>
          <option value="con_accion">Con próxima acción</option>
          <option value="atrasados">Acciones atrasadas</option>
        </select></div>
      </div>
      <div class="cuenta" id="scuenta">Cargando…</div>
      <div id="slista"><div class="cargador"><span class="spin"></span><span class="sm">Cargando el seguimiento…</span></div></div>
      <div id="spag"></div>
    </div>`;

  const { data: op } = await db.rpc('opciones_filtros', {});
  const pon = (id, lista, todo) => $(id).innerHTML = `<option value="">${todo}</option>` +
    (lista || []).map(o => `<option>${esc(o.v)}</option>`).join('');
  pon('sest', op.estados, 'Todos los estados');
  pon('sprov', op.provincias, 'Todas las provincias');
  pon('smuni', op.municipios, 'Todos los municipios');
  ['sest', 'sprov', 'smuni', 'smodo'].forEach(id => $(id).onchange = () => {
    SEG = { estado: $('sest').value, prov: $('sprov').value, muni: $('smuni').value, modo: $('smodo').value, pagina: 0 };
    listaSeguimiento(true);
  });
  window.__dlSeg = async fmt => {
    const { data } = await db.rpc('exportar_seguimiento', {
      f_estado: SEG.estado || null, f_provincia: SEG.prov || null, f_municipio: SEG.muni || null, f_modo: SEG.modo });
    descargar(data || [], 'Exportacion_seguimiento', fmt);
  };
  if ($('segdup')) $('segdup').onclick = () => ir('duplicados');


  const { data: r } = await db.rpc('resumen_seguimiento');
  if (r) {
    const pct = (a, b) => b ? Math.round(a / b * 100) + '%' : '0%';
    const emb = (r.embudo || []).map(e => `<div class="kpi"><b>${num(e.n)}</b><span>${esc(e.estado)}</span></div>`).join('');
    $('segkpis').innerHTML = emb +
      `<div class="kpi ok"><b>${num(r.visitados)}</b><span>${TT('medico', 'p', '', 'l', 'l', 'visitado')}</span></div>
       <div class="kpi"><b>${num(r.visitas_total)}</b><span>${TT('visita', 'p', '', 'l', 'l', 'registrado')}</span></div>
       <div class="kpi"><b>${num(r.muestras_total)}</b><span>muestras entregadas</span></div>
       <div class="kpi"><b>${pct(r.con_direccion, r.total)}</b><span>fichas con dirección</span></div>
       <div class="kpi"><b>${pct(r.con_dias, r.total)}</b><span>con días de atención</span></div>`;
  }
  listaSeguimiento(true);
}

async function listaSeguimiento(reinicia) {
  if (reinicia) SEG.pagina = 0;
  cargando($('slista'), 'Cargando el seguimiento…');
  $('scuenta').textContent = 'Buscando…';
  const { data, error } = await db.rpc('seguimiento_lista', {
    f_estado: SEG.estado || null, f_provincia: SEG.prov || null, f_municipio: SEG.muni || null,
    f_modo: SEG.modo, lim: tamPagina(), desplaz: SEG.pagina * tamPagina()
  });
  if (error) { $('scuenta').textContent = 'No se ha podido cargar: ' + error.message; return; }
  $('scuenta').innerHTML = `<b>${num(data.total)}</b> ${TT('medico', 'p', '', 'l', 'l')}`;
  const filas = data.filas || [];
  if (!filas.length) { $('slista').innerHTML = '<div class="vacio">Nada que mostrar con estos filtros.</div>'; }
  else {
    $('slista').innerHTML = '';
    $('slista').insertAdjacentHTML('beforeend', filas.map(m => `
    <button class="fila" data-id="${m.id}">
      <span><span class="nm">${m.urgente ? '<span class="pill p-urg">Urgente</span> ' : ''}${m.sin_reporting ? `<span class="pill p-sr" title="Solo ${TT('visita', 's', '', 'l', 'l')} presencial: sin informes ni feedback">Sin reporting</span> ` : ''}${esc(m.nombre)}</span>
        <span class="sm">${esc(m.especialidad || '')} · ${esc(m.centro_nombre || '')} ${esc(m.municipio || '')}</span></span>
      <span class="c2"><span class="sm">${m.ultima_visita ? 'Última: <b>' + fechaCorta(m.ultima_visita) + '</b> · ' + esc(m.ultimo_resultado || '') : 'Sin visitar'}</span>
        <span class="sm">${m.n_visitas} ${TT('visita', 'p', '', 'l', 'l')}${m.muestras ? ' · ' + m.muestras + ' muestras' : ''}</span></span>
      <span class="c3"><span class="sm">${m.proxima_fecha
        ? `<b style="color:${m.proxima_fecha < hoyISO() ? 'var(--warn)' : 'var(--navy)'}">${fechaCorta(m.proxima_fecha)}</b><br>${esc(m.proxima_accion || '')}
           <br><span class="acts" style="margin:4px 0 0"><button class="btn sec chico" data-acc="hecha|${m.id}">Hecha</button>
           <button class="btn sec chico" data-acc="aplazar|${m.id}">Aplazar</button></span>`
        : ''}</span></span>
      <span class="pill p-est">${esc(m.estado_comercial)}</span>
    </button>`).join(''));
  }
  paginador($('spag'), data.total, SEG.pagina, p => { SEG.pagina = p; listaSeguimiento(false); $('slista').scrollIntoView({ block: 'start', behavior: 'smooth' }); },
    () => listaSeguimiento(true));
  $('slista').onclick = async e => {
    const acc = e.target.closest('[data-acc]');
    if (acc) {
      e.stopPropagation();
      const [modo, mid] = acc.dataset.acc.split('|');
      let f = null;
      if (modo === 'aplazar') { f = await pedirFecha('¿Para cuándo la aplazas?', isoMas(hoyISO(), 7), { titulo: 'Aplazar acción', ok: 'Aplazar' }); if (!f) return; }
      const { data: r } = await db.rpc('resolver_accion', { p_medico: mid, p_modo: modo, p_fecha: f });
      if (r && r.ok === false) { toast('No se ha podido', true); return; }
      toast(modo === 'hecha' ? 'Acción marcada como hecha' : 'Acción aplazada');
      listaSeguimiento(true); cargarInicio();
      return;
    }
    const b = e.target.closest('[data-id]'); if (b) abrirFicha(b.dataset.id);
  };
}

async function abrirDuplicados() {
  $('dbody').innerHTML = `<div class="fh"><div><h2>Duplicados</h2>
      <div class="sm">Fichas marcadas y búsqueda de parecidos en toda la base</div></div>
      <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
    <div class="acts"><button class="btn sec" id="dscan">Buscar parecidos (≥80%)</button>
      <button class="btn sec" id="dpend">Revisar pendientes</button></div>
    <div id="dcuerpo"><div class="skel"></div><div class="skel" style="width:60%"></div></div>`;
  $('dlg').showModal();

  $('dscan').onclick = async ev => {
    ev.target.disabled = true; ev.target.textContent = 'Buscando…';
    const { data } = await db.rpc('escanear_duplicados', { p_umbral: 80, p_tope: 100 });
    ev.target.disabled = false; ev.target.textContent = 'Buscar parecidos (≥80%)';
    PARES = data || [];
    pintarDuplicados();
  };

  $('dpend').onclick = () => revisarPendientes();
  const { data } = await db.rpc('duplicados_pendientes');
  DUPS = data || [];
  pintarDuplicados();
}

function pintarDuplicados() {
  const pend = (DUPS || []).map(d => `<div class="item" style="cursor:default">
      <span class="ic w">!</span>
      <span class="tx"><b>${esc(d.nombre)}</b><span class="sm">Código ${esc(d.codigo)} · ${esc(d.centro || '')} ${esc(d.municipio || '')}${d.duplicado_de ? ' · parecido a ' + esc(d.duplicado_de) : ''}</span></span>
      <span class="acts" style="margin:0"><button class="btn sec" data-dficha="${d.id}">Ver ficha</button></span></div>`).join('');

  const pares = (PARES || []).map(p => `<div class="item" style="cursor:default">
      <span class="ic">${p.pct}%</span>
      <span class="tx"><b>${esc(p.a_nombre)}</b><span class="sm">códigos ${esc(p.a_codigo)} y ${esc(p.b_codigo)} · ${esc(p.b_nombre)}</span></span>
      <span class="acts" style="margin:0"><button class="btn" data-unif="${p.a_id}|${p.b_id}">Comparar</button></span></div>`).join('');

  $('dcuerpo').innerHTML =
    `<h2 style="padding:8px 0 0">Pendientes de unificar<span class="n">${(DUPS || []).length}</span></h2>
     ${pend ? `<div class="lista">${pend}</div>` : '<div class="vacio">Ninguna ficha marcada.</div>'}
     ${PARES ? `<h2 style="padding:12px 0 0">Parecidos encontrados<span class="n">${PARES.length}</span></h2>
       ${pares ? `<div class="lista">${pares}</div>` : '<div class="vacio">Sin parejas por encima del 80%.</div>'}` : ''}`;

  $('dcuerpo').querySelectorAll('[data-dficha]').forEach(b => b.onclick = () => { $('dlg').close(); abrirFicha(b.dataset.dficha); });
  $('dcuerpo').querySelectorAll('[data-unif]').forEach(b => b.onclick = () => {
    const [a, c] = b.dataset.unif.split('|'); compararFichas(a, c);
  });
}

async function listasDuplicados() {
  cargando($('dpendc'), 'Buscando fichas pendientes…');
  cargando($('dparc'), 'Buscando nombres parecidos…');
  const [rp, rs] = await Promise.all([db.rpc('duplicados_pendientes'), db.rpc('escanear_duplicados', { p_umbral: 80, p_tope: 200 })]);
  DUP_PEND = rp.data || []; DUP_PARES = rs.data || [];
  const ids = [...new Set([...DUP_PEND.map(x => x.id), ...DUP_PARES.map(p => p.a_id)])];
  DUP_TIPO = {};
  for (let i = 0; i < ids.length; i += 150) {
    const { data } = await db.from('cuentas').select('id, tipo').in('id', ids.slice(i, i + 150));
    (data || []).forEach(c => { DUP_TIPO[c.id] = c.tipo || 'Persona'; });
  }
  pintarListasDup();
}

async function pintarDireccionesDudosas() {
  const cal = $('calidad'); if (!cal || $('caldirs')) return;
  const { data, error } = await db.rpc('ubicaciones_dudosas', {});
  if (error || !$('calidad') || $('caldirs')) return;
  const l = data || [];
  if (!l.length) return;
  cal.insertAdjacentHTML('afterend', `<div class="card" id="caldirs">
    <div class="fh"><div><h2>Direcciones que no cuadran · ${num(l.length)}</h2>
      <div class="sm">El punto del mapa de ${TT('consulta', 'p', 'este', 'l', 'l')} está lejos de su municipio: «Cómo llegar», las rutas y la agenda las sitúan mal.</div></div></div>
    <div class="lista">${l.map(u => `<div class="item cdir" data-cdir="${u.id}" style="cursor:default">
      <span class="tx"><b>${esc(u.nombre)}</b>
        <span class="sm">${esc([u.centro_nombre, u.direccion, [u.cp, u.municipio].filter(Boolean).join(' ')].filter(Boolean).join(' · ') || 'Sin dirección')}</span>
        <span class="sm cdirkm">${u.km != null ? `El punto está a ${num(u.km)} km de ${esc(u.municipio)}` : 'El punto está fuera de España'}</span></span>
      <span class="acts" style="margin:0">
        <button type="button" class="btn sec" data-cdirf="${u.cuenta_id}">Ficha</button>
        ${u.direccion || u.municipio ? `<button type="button" class="btn" data-cdirg="${u.id}">Volver a situar</button>` : ''}</span></div>`).join('')}</div></div>`);
  const caja = $('caldirs');
  caja.querySelectorAll('[data-cdirf]').forEach(b => b.onclick = () => abrirFicha(b.dataset.cdirf));
  caja.querySelectorAll('[data-cdirg]').forEach(b => b.onclick = async () => {
    const u = l.find(x => x.id === b.dataset.cdirg); if (!u) return;
    const txt = b.textContent; b.disabled = true; b.textContent = 'Buscando…';
    const g = await geocodificar([u.direccion, u.cp, u.municipio, u.provincia, 'España'].filter(Boolean).join(', '), { direccion: u.direccion, municipio: u.municipio, cp: u.cp });
    b.disabled = false; b.textContent = txt;
    if (!g) { toast('No se encuentra esa dirección: corrígela en la ficha', true); return; }
    if (g.fuera) { toast(`Esa dirección sale en ${g.fuera}, no en ${u.municipio}: corrígela en la ficha`, true); return; }
    const { error: e } = await db.from('ubicaciones').update({ lat: +g.lat, lon: +g.lon }).eq('id', u.id);
    if (e) { toast('No se ha podido guardar: ' + e.message, true); return; }
    toast(`${u.nombre}: situado en ${u.municipio}`);
    const fila = caja.querySelector(`[data-cdir="${u.id}"]`); if (fila) fila.remove();
    const h = caja.querySelector('h2'), quedan = caja.querySelectorAll('.cdir').length;
    if (!quedan) caja.remove(); else if (h) h.textContent = `Direcciones que no cuadran · ${num(quedan)}`;
  });
}

async function dupJuntarCentros(queda, va) {
  if (!queda.centro_id || !va.centro_id) return;
  const { data: qc } = await db.from('centros').select('id, nombre, municipio').eq('id', queda.centro_id).maybeSingle();
  const { data: vc } = await db.from('centros').select('id, nombre, municipio').eq('id', va.centro_id).maybeSingle();
  if (!qc) return;
  const pon = { centro_id: qc.id, centro_nombre: qc.nombre };
  await db.from('ubicaciones').update(pon).eq('centro_id', va.centro_id);
  if (vc) await db.from('ubicaciones').update(pon).is('centro_id', null).eq('centro_nombre', vc.nombre);
  // Quien quede dos veces en el centro: una sola consulta (la principal, si la hay)
  const { data: u } = await db.from('ubicaciones').select('id, cuenta_id, principal').eq('centro_id', qc.id);
  const vistos = {}, sobran = [];
  (u || []).sort((x, y) => (y.principal ? 1 : 0) - (x.principal ? 1 : 0)).forEach(x => { if (x.cuenta_id === queda.id) return; if (vistos[x.cuenta_id]) sobran.push(x.id); else vistos[x.cuenta_id] = 1; });
  if (sobran.length) await db.from('ubicaciones').delete().in('id', sobran);
  try { invalidarCache(); } catch (e) {}
}

function panelDupVacio(msg) {
  $('dcmp').innerHTML = `<div class="vacio">${esc(msg)} Elige la siguiente pareja de la lista.</div>`;
}

async function revisarPendientes() {
  cargando($('dbody'), 'Buscando pendientes…');
  $('dlg').showModal();
  const { data } = await db.rpc('duplicados_pendientes');
  const l = data || [];
  $('dbody').innerHTML = `
    <div class="fh"><div><h2>Pendientes de unificar</h2>
      <div class="sm">${l.length} fichas marcadas al darlas de alta</div></div>
      <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
    <div class="lista">${l.map(x => `<div class="item" style="cursor:default">
      <span class="ic w">${x.pct ? x.pct + '%' : '?'}</span>
      <span class="tx"><b>${esc(x.nombre)}</b>
        <span class="sm">Código ${esc(x.codigo)} · ${esc(x.centro || '')} ${esc(x.municipio || '')}</span>
        <span class="sm">${x.par_nombre ? 'Se parece a ' + esc(x.par_nombre) : 'Sin pareja identificada'}</span></span>
      <span class="acts" style="margin:0">
        ${x.par_id ? `<button class="btn" data-cmp="${x.id}|${x.par_id}">Comparar</button>` : ''}
        <button class="btn sec" data-dficha="${x.id}">Ver ficha</button></span></div>`).join('')
      || '<div class="vacio">No hay fichas pendientes de unificar.</div>'}</div>`;

  $('dbody').querySelectorAll('[data-cmp]').forEach(b => b.onclick = () => {
    const [a, c] = b.dataset.cmp.split('|'); compararFichas(a, c);
  });
  $('dbody').querySelectorAll('[data-dficha]').forEach(b => b.onclick = () => { $('dlg').close(); abrirFicha(b.dataset.dficha); });
}

// (R-12: listasDuplicados se definía aquí otra vez; ahora está en su sitio, más arriba)
const dupTipoDe = id => DUP_TIPO[id] === 'Centro' ? 'Centro' : 'Persona';

let DUP_TRAS = null;
