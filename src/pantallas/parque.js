// @ts-check
// pantallas/parque.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.



// Parque instalado está en src/app/screens/equipment (v2.409.0). Estos nombres se quedan: la pestaña y el cierre de la ventana
// (legado 080), la ficha, los enlaces, «‹ Volver» y las pruebas los usan.
function editarEquipo(e, cuenta) { return window.delcos.screens.equipment.editEquipment(e || null, cuenta || null); }
function verEquipo(id) { return window.delcos.screens.equipment.showEquipment(id); }
