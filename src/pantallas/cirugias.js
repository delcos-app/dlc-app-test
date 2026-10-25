// pantallas/cirugias.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.


/* v2.199.0 · Intervenciones con lote y número de serie (tercera tanda del estudio por sectores, SQL 125). Decisiones de Eric: sección propia y
   cada intervención también en la Agenda de quien asiste; el material se elige en cada intervención (depósito del centro o el de quien asiste); el
   número de serie se apunta al usar; lo usado crea el pedido en borrador al centro y una reposición con plazo de 48 horas que avisa.
   - Menú «Intervenciones» (en «Tu día»): reposiciones pendientes (las vencidas, marcadas), próximas y hechas en los últimos 30 días; «+ Nueva intervención».
   - Ventana de la cirugía: datos, «Registrar lo usado» (por lote, con un número de serie por unidad y la referencia del paciente sin
     datos de salud), lo usado con su lote y serie, el pedido y «Reponer ahora».
   - Ficha del responsable o del centro: sus últimas intervenciones. Los avisos de reposición vencida abren la intervención. */

// Intervenciones está en src/app/screens/surgeries (v2.407.0). Estos nombres se quedan: la pestaña de la página (legado 079),
// los avisos, la ficha, «‹ Volver» y las pruebas los usan.
function pintarCirugias() { return window.delcos.screens.surgeries.paintSurgeries(); }
function editarCirugia(c) { return window.delcos.screens.surgeries.editSurgery(c || null); }
function verCirugia(id, aviso) { return window.delcos.screens.surgeries.showSurgery(id, aviso || ''); }
