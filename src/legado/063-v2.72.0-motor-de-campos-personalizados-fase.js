/* ============================================================
   v2.72.0 · Motor de campos personalizados (fase 2 de la auditoría)
   Cada cliente define sus campos (tipo, obligatorio, dónde se ven) en
   Configuración → Catálogos, y la plataforma genera los formularios,
   las columnas y los filtros. Los valores se guardan con guardar_campos().
   ============================================================ */
const CAMPOS = { medico: [], cliente: [], producto: [], pedido: [] };
const CAMPO_TABLA = { medico: 'cuentas', cliente: 'contactos', producto: 'productos', pedido: 'pedidos' };
const TIPOS_CAMPO = [['lista', 'Lista de valores'], ['texto', 'Texto'], ['numero', 'Número'], ['fecha', 'Fecha'], ['si_no', 'Sí / No']];
const campoTexto = (c, v) => v == null || v === '' ? '' : c && c.tipo === 'si_no' ? (v === true || v === 'true' ? 'Sí' : 'No')
  : c && c.tipo === 'fecha' ? fechaCorta(String(v)) : c && c.tipo === 'numero' ? String(v).replace('.', ',') : String(v);
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


