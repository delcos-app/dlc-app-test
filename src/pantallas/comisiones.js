// pantallas/comisiones.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.











async function cargarComerciales() {
  const { data } = await db.from('perfiles').select('id,nombre,rol,activo').order('nombre');
  // Solo quien lleva cartera o agenda comercial (no Dirección, Solo consulta ni médicos)
  COMS = (data || []).filter(u => u.activo && rolPuede(u.rol, 'equipo_comercial'));
  $('fcom').innerHTML = '<option value="">Todos</option><option value="ninguno">Sin comercial</option>' +
    COMS.map(u => `<option value="${u.id}" ${F.com === u.id ? 'selected' : ''}>${esc(u.nombre)}</option>`).join('');
}

let ESQUEMAS = [];

let COMS = [];





// Comisiones está en src/app/screens/commissions (v2.411.0). Estos nombres se quedan: Configuración (legado 004), Inicio y las
// pruebas los usan.
function pintarComisiones() { return window.delcos.screens.commissions.paintCommissions(); }
function tarjetaComision() { return window.delcos.screens.commissions.paintCommissionCard(); }
function editorEsquema(id) { return window.delcos.screens.commissions.editScheme(id || null, () => { pintarComisiones(); }); }
