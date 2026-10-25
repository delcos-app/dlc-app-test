// componentes/guardar_pagina.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.

function pagActual() { return window.delcos.leftovers.currentPage(); }

function pagBloque(el, cuerpo) { return window.delcos.leftovers.blockOf(el, cuerpo); }

function pagPonerGuardar() { window.delcos.leftovers.placeSave(); }

/* ============================================================
    v2.376.0 · D-042 (Eric): en una página, un solo «Guardar», arriba a la derecha. En Configuración cada bloque traía su
    propio botón (dentro de la tarjeta o suelto debajo); ahora la cabecera del apartado lleva «Descartar cambios» y «Guardar»,
    que se activa al cambiar algo y guarda cada bloque modificado con su propio guardado (que queda oculto). Los títulos que
    repiten el de encima se ocultan. Las acciones que no son guardar (enviar un correo de prueba, añadir…) siguen en su bloque.
   ============================================================ */
// Páginas que configuran algo con varios bloques: dónde está su cabecera (donde van los botones) y su contenido. Una ventana que se
// abre encima es ventana (sus botones, abajo); el contenido de un apartado que se pinta dentro de una ventana encajada lo declara con
// data-pagina (Diseño del PDF) y cuenta como página.
const PAG_GUARDA = [
  // toda la página del apartado (también la ventana encajada, p. ej. Diseño del PDF)
  { tab: 'config', cab: () => document.querySelector('#v-config .cfucab'), cuerpo: () => document.querySelector('#v-config .cfupag') || $('cfgcuerpo-hub') },
  { tab: 'facturacion', cab: () => document.querySelector('#v-facturacion .cfgsubs') && document.querySelector('#v-facturacion > .saludo'), cuerpo: () => $('fcuerpo') },
];

// Lo que no cambia datos no activa «Guardar»: buscadores y filtros de la página
const PAG_NO_CAMBIA = 'input[type=search], #txq, #cfubus, [placeholder^="Busca"]';

const PAG_SUCIO = new Set();

// Las páginas se pintan por partes y algunas se repintan al guardar: se vuelve a colocar al cambiar el contenido
let PAG_GUARDA_RAF = 0;
