/* ============================================================
   v2.72.0 · Motor de campos personalizados (fase 2 de la auditoría)
   Cada cliente define sus campos (tipo, obligatorio, dónde se ven) en
   Configuración → Catálogos, y la plataforma genera los formularios,
   las columnas y los filtros. Los valores se guardan con guardar_campos().
   ============================================================ */
const CAMPOS = { medico: [], cliente: [], producto: [], pedido: [] };
const CAMPO_TABLA = { medico: 'cuentas', cliente: 'contactos', producto: 'productos', pedido: 'pedidos' };
const TIPOS_CAMPO = [['lista', 'Lista de valores'], ['texto', 'Texto'], ['numero', 'Número'], ['fecha', 'Fecha'], ['si_no', 'Sí / No']];
async function cargarCampos() {
  const ambs = Object.keys(CAMPOS);
  const r = await Promise.all(ambs.map(a => db.rpc('campos_de', { p_ambito: a })));
  ambs.forEach((a, i) => { if (!r[i].error) CAMPOS[a] = r[i].data || []; });
  camposEnDirectorio();
}
const campoTexto = (c, v) => v == null || v === '' ? '' : c && c.tipo === 'si_no' ? (v === true || v === 'true' ? 'Sí' : 'No')
  : c && c.tipo === 'fecha' ? fechaCorta(String(v)) : c && c.tipo === 'numero' ? String(v).replace('.', ',') : String(v);
function campoInput(c, v) {
  const a = `data-cpk="${esc(c.clave)}" ${c.solo_lectura ? 'disabled' : ''}`;
  const val = v == null ? '' : v;
  if (c.tipo === 'lista') return `<select ${a}><option value=""></option>${(c.valores || []).concat(val && !(c.valores || []).includes(val) ? [val] : [])
    .map(x => `<option ${x === val ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select>`;
  if (c.tipo === 'si_no') return `<select ${a}><option value=""></option><option value="true" ${val === true ? 'selected' : ''}>Sí</option><option value="false" ${val === false ? 'selected' : ''}>No</option></select>`;
  if (c.tipo === 'fecha') return `<input type="date" ${a} value="${esc(String(val))}">`;
  if (c.tipo === 'numero') return `<input type="text" inputmode="decimal" ${a} value="${esc(String(val).replace('.', ','))}">`;
  return `<input ${a} value="${esc(String(val))}" maxlength="500" placeholder="${esc(c.descripcion || '')}">`;
}
function camposHTML(amb, valores) {
  const l = (CAMPOS[amb] || []).filter(c => c.en_ficha);
  if (!l.length) return '';
  return `<div class="cpersform" data-cpamb="${amb}"><h3>Campos personalizados</h3><div class="g2">${l.map(c =>
    `<div><label>${esc(c.nombre)}${c.obligatorio ? ' <span class="cpob">*</span>' : ''}</label>${campoInput(c, (valores || {})[c.clave])}</div>`).join('')}</div></div>`;
}
// Lee los campos del formulario. Devuelve null si no hay campos; { falta } si falta un obligatorio.
function camposLeer(raiz) {
  const b = raiz && raiz.querySelector('.cpersform'); if (!b) return null;
  const amb = b.dataset.cpamb, v = {}, falta = [];
  b.querySelectorAll('[data-cpk]:not([disabled])').forEach(i => {
    const c = (CAMPOS[amb] || []).find(x => x.clave === i.dataset.cpk); v[i.dataset.cpk] = i.value.trim();
    if (c && c.obligatorio && !i.value.trim()) falta.push(c.nombre);
  });
  return { amb, valores: v, falta };
}
async function camposGuardar(leido, id) {
  if (!leido || !id || !Object.keys(leido.valores).length) return true;
  const { data, error } = await db.rpc('guardar_campos', { p_ambito: leido.amb, p_id: id, p_valores: leido.valores });
  if (!error && data && data.ok) return true;
  const e = (data && data.errores || [])[0];
  const c = e && (CAMPOS[leido.amb] || []).find(x => x.clave === e.campo);
  toast(e ? `Revisa «${c ? c.nombre : e.campo}»: ${{ obligatorio: 'es obligatorio', numero: 'tiene que ser un número', fecha: 'no es una fecha válida', lista: 'no es un valor de la lista', si_no: 'tiene que ser sí o no', solo_lectura: 'no se puede cambiar', desconocido: 'ya no existe' }[e.error] || e.error}`
    : 'No se han podido guardar los campos personalizados', true);
  return false;
}
// Inserta el bloque en un formulario ya pintado, con los valores actuales de la ficha
async function camposInsertar(raiz, amb, id, antesDe) {
  if (!raiz || !(CAMPOS[amb] || []).some(c => c.en_ficha) || raiz.querySelector('.cpersform')) return;
  let v = {};
  if (id) { const { data } = await db.from(CAMPO_TABLA[amb]).select('clasificadores').eq('id', id).maybeSingle(); v = (data && data.clasificadores) || {}; }
  if (raiz.querySelector('.cpersform') || !raiz.isConnected) return;
  const ref = antesDe && antesDe.isConnected ? antesDe : null;
  if (ref) ref.insertAdjacentHTML('beforebegin', camposHTML(amb, v)); else raiz.insertAdjacentHTML('beforeend', camposHTML(amb, v));
}
// Filtros generados (listas y sí/no) para una zona de filtros; al cambiar, actualiza «estado» y llama a «alCambiar»
function camposFiltros(amb, estado, pref) {
  return (CAMPOS[amb] || []).filter(c => c.en_filtro && ['lista', 'si_no'].includes(c.tipo)).map((c, i) => {
    const ops = c.tipo === 'si_no' ? [['true', 'Sí'], ['false', 'No']] : (c.valores || []).map(x => [x, x]);
    const act = estado[c.clave] == null ? '' : String(estado[c.clave]);
    return `<div class="fcpers"><label for="${pref}${i}">${esc(c.nombre)}</label><select id="${pref}${i}" data-fcp="${esc(c.clave)}" data-fcpt="${c.tipo}">
      <option value="">Todos</option>${ops.map(([v, t]) => `<option value="${esc(v)}" ${act === v ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></div>`;
  }).join('');
}
function camposFiltrosActivar(zona, estado, alCambiar) {
  zona.querySelectorAll('[data-fcp]').forEach(sel => sel.onchange = () => {
    const k = sel.dataset.fcp;
    if (!sel.value) delete estado[k]; else estado[k] = sel.dataset.fcpt === 'si_no' ? sel.value === 'true' : sel.value;
    alCambiar();
  });
}
// (v2.183.0: aquí iba la primera versión de camposEnDirectorio; se redefine entera más abajo)

/* ---------- campos personalizados en las fichas ---------- */
async function bloqueCampos(tabla, id, cont) {
  if (!cont || !id || cont.querySelector('.campospers')) return;
  const { data } = await db.from(tabla).select('clasificadores').eq('id', id).maybeSingle();
  const c = (data && data.clasificadores) || {}; const ks = Object.keys(c).filter(k => c[k] !== '' && c[k] != null);
  const amb = Object.keys(CAMPO_TABLA).find(a => CAMPO_TABLA[a] === tabla), defs = CAMPOS[amb] || [];
  if (defs.length && ks.length) {
    if (cont.querySelector('.campospers')) return;
    const orden = defs.filter(d => ks.includes(d.clave)).concat(ks.filter(k => !defs.some(d => d.clave === k)).map(k => ({ clave: k, nombre: k.replace(/_/g, ' ').toLowerCase().replace(/^./, x => x.toUpperCase()) })));
    cont.insertAdjacentHTML('beforeend', `<div class="campospers"><h3>Campos personalizados</h3><div class="cpgrid">${orden.map(d =>
      `<div><span class="sm">${esc(d.nombre)}</span><b>${esc(campoTexto(d, c[d.clave]))}</b></div>`).join('')}</div></div>`);
    return;
  }
  if (!ks.length || cont.querySelector('.campospers')) return;
  cont.insertAdjacentHTML('beforeend', `<div class="campospers"><h3>Campos personalizados</h3><div class="cpgrid">${ks.map(k => `<div><span class="sm">${esc(k.replace(/_/g, ' ').toLowerCase().replace(/^./, x => x.toUpperCase()))}</span><b>${esc(typeof c[k] === 'object' ? JSON.stringify(c[k]) : c[k])}</b></div>`).join('')}</div></div>`);
}
fichaPaciente = (orig => async function (id, ...a) { const r = await orig.call(this, id, ...a); bloqueCampos('contactos', id, $('ficha') && ($('ficha').querySelector('.fbody, #fbody') || $('ficha').firstElementChild)); return r; })(fichaPaciente);
editorProducto = (orig => function (p, ...a) { const r = orig.call(this, p, ...a); if (p && p.id) setTimeout(() => bloqueCampos('productos', p.id, $('dbody')), 150); return r; })(editorProducto);
abrirFicha = (orig => async function (id, ...a) { const r = await orig.call(this, id, ...a); bloqueCampos('cuentas', id, $('fzcampos') || ($('ficha') && ($('ficha').querySelector('.fbody, #fbody') || $('ficha').firstElementChild))); return r; })(abrirFicha);


