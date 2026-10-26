// @ts-check
// pantallas/ciclo.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.


/* v2.197.0 · Ciclo de visitas con clasificación A/B/C (segunda tanda del estudio por sectores, SQL 123). Decisiones de Eric: cada ficha en A,
   B o C, cada clase con sus visitas por ciclo y el ciclo configurable (de partida, trimestral: A = 3, B = 2, C = 1).
   - Menú «Ciclo de visitas» (en «Tu día»): «Este ciclo» (cómo va cada clase y a quién le faltan visitas, con «+ Cita»), «Clasificar»
     (A, B o C en cada ficha, con sus visitas de los últimos 12 meses como ayuda) y, para quien ve todo el equipo, «Equipo».
   - Ficha: en el bloque «Estado», la clase (A, B, C; pulsar la marcada la quita) y las visitas de este ciclo.
   - Configuración → Cartera y visitas → «Ciclo A/B/C» (administración): duración del ciclo y visitas de cada clase. */

// Ciclo de visitas está en src/app/screens/cycle (v2.408.0). Estos nombres se quedan: las pestañas de la página (legado 079),
// Configuración → Cartera y visitas y «‹ Volver» los usan.
function pintarCiclo() { return window.delcos.screens.cycle.paintCycle(); }
function pintarCobertura() { return window.delcos.screens.cycle.paintCoverage(); }
function pintarClasificar() { return window.delcos.screens.cycle.paintClassify(); }
function pintarCicloEquipo() { return window.delcos.screens.cycle.paintCycleTeam(); }
function editorCiclo() { return window.delcos.screens.cycle.editCycle(); }
