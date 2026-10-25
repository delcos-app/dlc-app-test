// pantallas/calidad.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.

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

async function cargarDuplicadosBase() {
  const v = $('v-duplicados');
  const permitido = puede('administrar') || ((PERFIL.areas || {}).M || 0) >= 3;
  v.innerHTML = `
    <div class="saludo"><div><h1>Duplicados</h1>
      <div class="fecha">Revisa fichas repetidas y unifícalas sin perder la lista</div></div>
      <div class="acts" style="margin:0">
        <button class="btn sec" id="dvolver">← Volver</button>
        <button class="btn sec" id="dbuscar">Volver a buscar parecidos</button></div></div>
    ${permitido ? `<div class="dupgrid">
      <div><div class="card" id="dpendc"></div><div class="card" id="dparc"></div></div>
      <div class="card dupcmp" id="dcmp"><div class="vacio vguia"><b>Elige una pareja para revisarla</b><span>Pulsa «Comparar» en la lista de la izquierda y aquí verás las dos fichas lado a lado. Al terminar, pasas a la siguiente.</span></div></div>
    </div>` : '<div class="card"><div class="vacio">Solo administración puede unificar fichas.</div></div>'}`;
  $('dvolver').onclick = () => ir(TAB_ANTERIOR && TAB_ANTERIOR !== 'duplicados' ? TAB_ANTERIOR : 'directorio');
  if (!permitido) { $('dbuscar').classList.add('hide'); return; }
  $('dbuscar').onclick = () => { invalidarCache(); listasDuplicados(); };
  listasDuplicados();
}

async function cargarDuplicados(...a) {
  const r = await cargarDuplicadosBase.apply(this, a);
  const s = document.querySelector('#v-duplicados .saludo');
  if (s && !$('dupvolver')) s.insertAdjacentHTML('beforebegin', '<button class="cfgvolver visible" id="dupvolver" type="button">‹ Calidad del dato</button>');
  if ($('dupvolver')) $('dupvolver').onclick = () => ir('seguimiento');
  return r;
}

// Calidad del dato está en src/app/screens/quality (v2.410.0). Estos nombres se quedan: el mapa de pantallas (legado 001) y el
// arranque (legado 018) los usan.
function cargarSeguimiento() { return window.delcos.screens.quality.loadQuality(); }
function botonCalidad() { window.delcos.screens.quality.paintAccountsHeader(); }
