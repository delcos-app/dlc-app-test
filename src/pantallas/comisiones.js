// @ts-check
// pantallas/comisiones.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.


 // v2.440.0: ESQUEMAS → estado de src/app (plan 6.6), accesible en window

 // v2.440.0: COMS → estado de src/app (plan 6.6), accesible en window

// Comisiones está en src/app/screens/commissions (v2.411.0). Estos nombres se quedan: Configuración (legado 004), Inicio y las
// pruebas los usan.
function pintarComisiones() { return window.delcos.screens.commissions.paintCommissions(); }
function editorEsquema(id) { return window.delcos.screens.commissions.editScheme(id || null, () => { pintarComisiones(); }); }
