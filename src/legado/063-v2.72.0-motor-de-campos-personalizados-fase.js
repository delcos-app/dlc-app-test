// Filtros generados (listas y sí/no) para una zona de filtros; al cambiar, actualiza «estado» y llama a «alCambiar»
function camposFiltros(amb, estado, pref) {
  return (CAMPOS[amb] || []).filter(c => c.en_filtro && ['lista', 'si_no'].includes(c.tipo)).map((c, i) => {
    const ops = c.tipo === 'si_no' ? [['true', 'Sí'], ['false', 'No']] : (c.valores || []).map(x => [x, x]);
    const act = estado[c.clave] == null ? '' : String(estado[c.clave]);
    return `<div class="fcpers"><label for="${pref}${i}">${esc(c.nombre)}</label><select id="${pref}${i}" data-fcp="${esc(c.clave)}" data-fcpt="${c.tipo}">
      <option value="">Todos</option>${ops.map(([v, t]) => `<option value="${esc(v)}" ${act === v ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></div>`;
  }).join('');
}
// (v2.183.0: aquí iba la primera versión de camposEnDirectorio; se redefine entera más abajo)

fichaPaciente = (orig => async function (id, ...a) { const r = await orig.call(this, id, ...a); bloqueCampos('contactos', id, $('ficha') && ($('ficha').querySelector('.fbody, #fbody') || $('ficha').firstElementChild)); return r; })(fichaPaciente);
editorProducto = (orig => function (p, ...a) { const r = orig.call(this, p, ...a); if (p && p.id) setTimeout(() => bloqueCampos('productos', p.id, $('dbody')), 150); return r; })(editorProducto);
abrirFicha = (orig => async function (id, ...a) { const r = await orig.call(this, id, ...a); bloqueCampos('cuentas', id, $('fzcampos') || ($('ficha') && ($('ficha').querySelector('.fbody, #fbody') || $('ficha').firstElementChild))); return r; })(abrirFicha);


