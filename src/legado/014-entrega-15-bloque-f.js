/* ============================================================
   DLC OS 2.0 · Entrega 15 · Bloque F
   ============================================================ */

/* ---------------- panel lateral de herramientas ---------------- */

let HERR_CTX = null;
function abrirHerramientas(contexto) {
  const d = $('tools');
  if (d.classList.contains('abierto') && HERR_CTX === contexto) { d.classList.remove('abierto'); return; }
  HERR_CTX = contexto;
  const filtrosDir = `
    <h3>Filtros</h3>
    <label>Tipo</label><select data-tf="tipo"><option value="">Todas</option><option value="Persona" ${F.tipo === 'Persona' ? 'selected' : ''}>Profesionales</option><option value="Centro" ${F.tipo === 'Centro' ? 'selected' : ''}>Centros</option></select>
    <label>Provincia</label><select data-tf="prov">${optFiltro(OPF.provincias, F.prov, 'Todas las provincias')}</select>
    <label>Municipio</label><select data-tf="muni">${optFiltro(OPF.municipios, F.muni, 'Todos los municipios')}</select>
    <label>${TT('especialidad', 's', '', 'l', 'C')}</label><select data-tf="esp">${optFiltro(OPF.especialidades, F.esp, todosLos('especialidad'))}</select>
    <label>Estado comercial</label><select data-tf="est">${optFiltro(OPF.estados, F.est, 'Todos los estados')}</select>
    <label>Reporting</label><select data-tf="rep"><option value="">Todos</option><option value="con" ${F.rep === 'con' ? 'selected' : ''}>Con reporting</option><option value="sin" ${F.rep === 'sin' ? 'selected' : ''}>Sin reporting</option></select>
    ${VE_TODO() && $('fcom') ? `<label>Comercial</label><select data-tf="com">${$('fcom').innerHTML}</select>` : ''}
    <label class="opt" style="margin-top:10px"><input type="checkbox" data-tfc="mios" ${F.mios ? 'checked' : ''}> Solo ${TT('medico', 'p', 'el', 'l', 'l')} de mi cartera</label>
    <label class="opt"><input type="checkbox" data-tfc="sin" ${F.sin ? 'checked' : ''}> Sin visitar nunca</label>
    <label class="opt"><input type="checkbox" data-tfc="urg" ${F.urg ? 'checked' : ''}> Solo urgentes</label>
    <div class="tfcampos">${camposFiltros('medico', F.campos, 'tfcp')}</div>
    <label>Ordenar por</label><select data-tf="orden">
      <option value="nombre" ${F.orden === 'nombre' ? 'selected' : ''}>Nombre</option>
      <option value="urgentes" ${F.orden === 'urgentes' ? 'selected' : ''}>Urgentes primero</option>
      <option value="reciente" ${F.orden === 'reciente' ? 'selected' : ''}>${TT('visita', 's', '', 'l', 'C')} más reciente</option></select>
    <div class="acts"><button class="btn sec" id="tlimpiar">Limpiar filtros</button></div>
    <h3 style="margin-top:18px">Columnas</h3>
    <p class="sm">Arrastra el borde de cada cabecera para cambiar su ancho.</p>
    <div class="acts"><button class="btn sec" id="tcols">Elegir columnas</button></div>`;

  d.innerHTML = `<div class="tbox">
    <div class="fh"><h2>Herramientas</h2><button class="x" id="tclose" aria-label="Cerrar">✕</button></div>
    ${contexto === 'directorio' ? filtrosDir : ''}
  </div>`;
  d.classList.add('abierto');

  $('tclose').onclick = () => d.classList.remove('abierto');
  d.querySelectorAll('[data-tf]').forEach(s => s.onchange = () => {
    const k = s.dataset.tf;
    if (k === 'prov') { F.prov = s.value; F.muni = ''; cargarFiltros(); }
    else F[k] = s.value;
    buscar(true);
  });
  if (d.querySelector('[data-tf="com"]')) d.querySelector('[data-tf="com"]').value = F.com || '';
  camposFiltrosActivar(d, F.campos, () => buscar(true));
  d.querySelectorAll('[data-tfc]').forEach(c => c.onchange = () => { F[c.dataset.tfc] = c.checked; buscar(true); });
  if ($('tlimpiar')) $('tlimpiar').onclick = () => {
    Object.assign(F, { q: '', prov: '', muni: '', esp: '', est: '', urg: false, mios: false, sin: false, orden: 'nombre', com: '', rep: '', campos: {} });
    if ($('frep')) $('frep').value = '';
    if ($('fcom')) $('fcom').value = '';
    $('q').value = ''; buscar(true); d.classList.remove('abierto');
  };
  if ($('tcols')) $('tcols').onclick = () => { d.classList.remove('abierto'); abrirColumnas(); };
  d.querySelectorAll('[data-tdl]').forEach(b => b.onclick = () => {
    const fmt = b.dataset.tdl;
    d.classList.remove('abierto');
    if (contexto === 'directorio' && window.__dlDir) window.__dlDir(fmt);
    if (contexto === 'seguimiento' && window.__dlSeg) window.__dlSeg(fmt);
    if (contexto === 'analitica' && window.__dlAn) window.__dlAn(fmt);
  });
}

let OPF = { provincias: [], municipios: [], especialidades: [], estados: [], centros: [] };
const optFiltro = (lista, v, todo) => `<option value="">${todo}</option>` +
  (lista || []).map(o => `<option ${v === o.v ? 'selected' : ''}>${esc(o.v)} (${o.n})</option>`).join('');

/* ---------------- contactos: alta completa y buscador ---------------- */


/* ---------------- clasificadores por grupos ---------------- */

let CATS_ABIERTOS = {};


/* v2.72.0 · Un clasificador de ficha, cliente o producto sin papel es un campo personalizado: tipo y dónde se ve */
function cajaCampo(c, completo) {
  if (c.papel || !CAMPO_TABLA[c.ambito]) return '';
  const t = c.tipo_campo || 'lista', chk = (k, txt) => `<label class="chk"><input type="checkbox" id="cfc_${k}" ${c[k] ? 'checked' : ''} ${completo ? '' : 'disabled'}> ${txt}</label>`;
  return `<div class="cfcampo"><h3>Campo personalizado</h3>
    <div class="g2"><div><label for="cfctipo">Tipo</label><select id="cfctipo" ${completo ? '' : 'disabled'}>${TIPOS_CAMPO.map(([k, n]) => `<option value="${k}" ${k === t ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
      <div class="cfchks">${chk('obligatorio', 'Obligatorio')}${chk('solo_lectura', 'Solo lectura')}${chk('en_ficha', 'En la ficha')}${chk('en_tabla', 'Columna en la tabla')}${chk('en_filtro', 'Filtro (listas y sí/no)')}</div></div>
    ${completo ? '<div class="acts" style="justify-content:flex-end"><button class="btn sec" id="cfcok">Guardar campo</button></div>' : ''}</div>`;
}
function abrirClasificador(id) {
  const c = CATS.find(x => x.id === id); if (!c) return;
  const puedeEditar = puede('administrar') || ((PERFIL.areas || {}).K || 0) >= 2;
  const completo = puede('administrar') || ((PERFIL.areas || {}).K || 0) >= 3;

  const pinta = () => {
    $('dbody').innerHTML = `
      <div class="fh"><div><h2>${esc(c.nombre)}</h2>
        <div class="sm">Grupo ${esc(c.grupo || 'General')} · se usa en ${esc(c.ambito === 'pedido' ? 'pedidos' : c.ambito === 'visita' ? 'visitas' : `fichas de ${TT('medico', 's', '', 'l', 'l')}`)}
        ${puedeEditar ? '' : ' · <b>solo lectura</b>'}</div></div>
        <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
      ${cajaCampo(c, completo)}
      <div class="lista ${!c.papel && CAMPO_TABLA[c.ambito] && (c.tipo_campo || 'lista') !== 'lista' ? 'hide' : ''}">${(c.valores || []).map(v => `<div class="item ${v.padre ? 'vsub' : ''}" style="cursor:default">
        <span class="ic">${v.activo ? '●' : '○'}</span>
        <span class="tx"><b style="${v.activo ? '' : 'opacity:.5;text-decoration:line-through'}">${esc(v.valor)}</b>
          ${v.extra ? `<span class="sm">${v.extra === 'neg' ? `sin ${TT('visita', 's', '', 'l', 'l')}` : `${TT('visita', 's', '', 'l', 'l', 'realizado')}`}${v.destino ? ' · pasa a ' + esc(v.destino) : ''}</span>` : ''}</span>
        ${puedeEditar ? `<span class="acts" style="margin:0">
          <button class="btn sec" data-vren="${v.id}|${esc(v.valor)}">Renombrar</button>
          ${c.papel === 'resultado_visita' ? `<select data-vdest="${v.id}" title="Estado al que pasa la ficha con este resultado" style="max-width:170px"><option value="">No cambia el estado</option>${estados().map(x => `<option value="${esc(x)}" ${v.destino === x ? 'selected' : ''}>Pasa a ${esc(x)}</option>`).join('')}</select>` : ''}
          <button class="btn sec" data-vtog="${v.id}|${v.activo ? 0 : 1}">${v.activo ? 'Desactivar' : 'Activar'}</button>
          ${completo ? `<button class="btn sec dang" data-vdel="${v.id}">Eliminar</button>` : ''}</span>` : ''}
      </div>`).join('') || '<div class="vacio">Sin valores todavía.</div>'}</div>
      ${puedeEditar ? `<div class="acts"><input id="cvnew" placeholder="Nuevo valor" style="flex:1;min-width:160px">
        ${c.papel === 'resultado_visita' ? `<select id="cvextra" style="max-width:170px"><option value="pos">${TT('visita', 's', '', 'l', 'C', 'realizado')}</option><option value="neg">Sin ${TT('visita', 's', '', 'l', 'l')}</option></select>
          <select id="cvdest" style="max-width:190px" title="Estado al que pasa la ficha con este resultado"><option value="">No cambia el estado</option>${estados().map(x => `<option value="${esc(x)}">Pasa a ${esc(x)}</option>`).join('')}</select>` : ''}
        ${(c.valores || []).some(v => v.padre) ? `<select id="cvpadre" style="max-width:210px" title="Categoría del valor"><option value="">Sin categoría (es una categoría)</option>${(c.valores || []).filter(v => !v.padre).map(v => `<option value="${esc(v.valor)}">Dentro de ${esc(v.valor)}</option>`).join('')}</select>` : ''}
        <button class="btn" id="cvadd">Añadir</button></div>` : ''}
      ${completo && !c.sistema ? `<div class="acts" style="justify-content:flex-end;border-top:1px solid var(--line);padding-top:12px">
        <button class="btn sec dang" id="cdel">Eliminar clasificador</button></div>` : ''}`;

    if ($('cfcok')) $('cfcok').onclick = async () => {
      const v = { tipo: $('cfctipo').value };
      ['obligatorio', 'solo_lectura', 'en_ficha', 'en_tabla', 'en_filtro'].forEach(k => { v[k] = $('cfc_' + k).checked; });
      const { data: r, error } = await db.rpc('configurar_campo', { p_id: id, p: v });
      if (error || !r || !r.ok) { toast('No se ha podido guardar el campo', true); return; }
      toast('Campo guardado'); recarga(); cargarCampos().catch(() => {});
    };
    const recarga = async () => {
      const { data } = await db.rpc('catalogos_todos');
      CATS = data || [];
      Object.assign(c, CATS.find(x => x.id === id) || c);
      pinta(); cargarCatalogos();
    };

    if ($('cvadd')) $('cvadd').onclick = async () => {
      const v = $('cvnew').value.trim(); if (!v) return;
      const { error } = await db.rpc('guardar_valor', { p: { clasificador_id: id, valor: v,
        extra: $('cvextra') ? $('cvextra').value : null, destino: $('cvdest') ? $('cvdest').value : null,
        ...($('cvpadre') && $('cvpadre').value ? { padre: $('cvpadre').value, valor: v.startsWith($('cvpadre').value + ' · ') ? v : $('cvpadre').value + ' · ' + v } : {}) } });
      if (error) { toast('No se ha podido añadir', true); return; }
      toast('Valor añadido'); recarga();
    };
    $('dbody').querySelectorAll('[data-vtog]').forEach(b => b.onclick = async () => {
      const [vid, activo] = b.dataset.vtog.split('|');
      await db.rpc('guardar_valor', { p: { id: vid, activo: activo === '1' } });
      recarga();
    });
    $('dbody').querySelectorAll('[data-vren]').forEach(b => b.onclick = async () => {
      const [vid, actual] = b.dataset.vren.split('|');
      const nuevo = await pedirTexto('Nuevo nombre', actual, { titulo: 'Renombrar valor', ok: 'Guardar' });
      if (!nuevo) return;
      await db.rpc('guardar_valor', { p: { id: vid, valor: nuevo } });
      toast('Renombrado'); recarga();
    });
    // v2.87.0: el estado al que lleva cada resultado se puede cambiar en cualquier momento
    $('dbody').querySelectorAll('[data-vdest]').forEach(sel => sel.onchange = async () => {
      const { data: r, error } = await db.rpc('guardar_valor', { p: { id: sel.dataset.vdest, destino: sel.value } });
      if (error || (r && r.ok === false)) { toast('No se ha podido cambiar', true); return; }
      toast(sel.value ? `Ahora pasa a ${sel.value}` : 'Ya no cambia el estado');
    });
    $('dbody').querySelectorAll('[data-vdel]').forEach(b => b.onclick = async () => {
      if (!await preguntar(`Las fichas y ${TT('visita', 'p', '', 'l', 'l')} que ya lo usan lo conservan, pero dejará de aparecer.`,
        { titulo: '¿Eliminar el valor?', ok: 'Eliminar', peligro: true })) return;
      const { data: r } = await db.rpc('borrar_valor', { p_id: b.dataset.vdel });
      if (r && r.ok === false) { toast('No tienes permiso', true); return; }
      toast('Eliminado'); recarga();
    });
    if ($('cdel')) $('cdel').onclick = async () => {
      if (!await preguntar(`Se elimina "${c.nombre}" y todos sus valores.`,
        { titulo: '¿Eliminar el clasificador?', ok: 'Eliminar', peligro: true })) return;
      const { data: r } = await db.rpc('borrar_clasificador', { p_id: id });
      if (r && r.ok === false) { toast(r.error === 'sistema' ? 'Los del sistema no se pueden eliminar' : 'Sin permiso', true); return; }
      $('dlg').close(); toast('Clasificador eliminado'); pintarCatalogos(); cargarCatalogos();
    };
  };
  pinta();
  $('dlg').showModal();
}


/* ---------------- duplicados pendientes con su pareja ---------------- */

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



