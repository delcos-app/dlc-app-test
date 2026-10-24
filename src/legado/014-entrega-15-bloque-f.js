/* ============================================================
   DLC OS 2.0 · Entrega 15 · Bloque F
   ============================================================ */

/* ---------------- panel lateral de herramientas ---------------- */

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


/* ---------------- contactos: alta completa y buscador ---------------- */


/* ---------------- clasificadores por grupos ---------------- */





/* ---------------- duplicados pendientes con su pareja ---------------- */




