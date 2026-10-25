// @ts-check
// componentes/ayuda.js · la «i» de ayuda está en src/app/components/help.ts (v2.416.0). La lista de títulos se queda aquí
// (legado 019 le añade los suyos al cargar); los nombres se quedan como adaptadores.

const ANCLAS_AYUDA = [
  ['#v-inicio .saludo h1', 'inicio'], ['#c-agenda > h2', 'ini_agenda'], ['#c-acciones > h2', 'ini_acciones'],
  ['#c-urgentes > h2', 'ini_urgentes'], ['#c-ultimas > h2', 'ini_ultimas'], ['#c-recom > h2', 'ini_recom'],
  ['#c-pend > h2', 'ini_pend'], ['#c-comision > h2', 'ini_comision'],
  ['#v-agenda .saludo h1', 'agenda'], ['#v-rutas .saludo h1', 'rutas'], ['#v-seguimiento .saludo h1', 'seguimiento'],
  ['#v-ventas .saludo h1', 'ventas'], ['#v-analitica .saludo h1', 'analitica'], ['#v-config .saludo h1', 'config'],
  ['#v-admin .saludo h1', 'admin'], ['#v-duplicados .saludo h1', 'duplicados']
];

function ponerAyudas() { window.delcos.components.addHelpButtons(); }
/** @param {HTMLElement} b */
function anclaAyuda(b) { return window.delcos.components.helpAnchor(b); }
