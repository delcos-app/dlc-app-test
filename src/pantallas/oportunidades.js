// @ts-check
// pantallas/oportunidades.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.

 // v2.440.0: LLAMADA_PEND → estado de src/app (plan 6.6), accesible en window

function hayOportunidades() { return hayExtra('oportunidades'); }

// Oportunidades está en src/app/screens/opportunities (v2.410.0). Estos nombres se quedan: Pedidos, Clientes (alta con registro de
// llamada), «‹ Volver» y las pruebas los usan.
function pintarLlamadas() { return window.delcos.screens.opportunities.paintOpportunities(); }
function editorOportunidad(l, previa) { return window.delcos.screens.opportunities.editOpportunity(l || null, previa || null); }
